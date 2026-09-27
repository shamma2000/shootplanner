# AWS production deployment

The production path is:

```text
Amplify Hosting -> HTTPS API domain -> Application Load Balancer
                -> private EC2 Auto Scaling group -> private Aurora PostgreSQL
```

Aurora is part of Amazon RDS. The database and EC2 instances are not publicly
reachable.

## Prerequisites

- A VPC spanning at least two Availability Zones.
- Two public subnets for the load balancer.
- Two private subnets with NAT access for EC2 and Aurora.
- An ACM certificate for the API domain, such as `api.example.com`.
- An ECR repository containing the backend Docker image.

## Build and push the backend

From `backend/`, build and push the image to ECR:

```bash
aws ecr get-login-password --region REGION | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.REGION.amazonaws.com
docker build -t shootplanner-api .
docker tag shootplanner-api:latest ACCOUNT.dkr.ecr.REGION.amazonaws.com/shootplanner-api:latest
docker push ACCOUNT.dkr.ecr.REGION.amazonaws.com/shootplanner-api:latest
```

## Deploy EC2 and Aurora

```bash
aws cloudformation deploy \
  --stack-name shootplanner-production \
  --template-file infra/production-stack.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    VpcId=vpc-xxxxxxxx \
    PublicSubnetIds=subnet-public-a,subnet-public-b \
    PrivateSubnetIds=subnet-private-a,subnet-private-b \
    CertificateArn=arn:aws:acm:REGION:ACCOUNT:certificate/xxxxxxxx \
    ContainerImage=ACCOUNT.dkr.ecr.REGION.amazonaws.com/shootplanner-api:latest \
    FrontendOrigin=https://app.example.com
```

The EC2 startup process reads the Aurora credentials and authentication signing
key from Secrets Manager, URL-encodes the credentials, runs Alembic migrations,
and starts the FastAPI container. Administrators connect through AWS Systems
Manager Session Manager rather than SSH.

Create a Route 53 alias such as `api.example.com` pointing to the load balancer
DNS name shown in the stack outputs.

## Deploy the frontend with Amplify

Connect the repository to Amplify Hosting. The root `amplify.yml` selects the
`frontend/` monorepo directory and builds a custom TanStack Start SSR deployment
bundle.

Configure this Amplify environment variable:

```text
VITE_API_URL=https://api.example.com/api/v1
```

Set the Amplify custom domain to `app.example.com`. Keeping the frontend and API
under the same parent domain allows the secure `SameSite=Lax` authentication
cookie to work without weakening cross-site protections.

## Updating releases

Push a new tagged backend image to ECR and update the CloudFormation
`ContainerImage` parameter. The Auto Scaling group performs a rolling update.
Frontend pushes are built and deployed automatically by Amplify.

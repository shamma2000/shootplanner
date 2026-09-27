# ShootPlanner API

FastAPI backend for ShootPlanner, using async SQLAlchemy and PostgreSQL.

## Structure

```text
app/api/       versioned route composition
app/core/      settings and database infrastructure
app/modules/   domain models, schemas, and endpoints
alembic/       database migrations
infra/         AWS infrastructure templates
tests/         API tests
```

## AWS database

`infra/rds-postgres.yaml` provisions an encrypted PostgreSQL Amazon RDS instance
inside private subnets. It accepts traffic only from the API security group and
stores its generated master password in AWS Secrets Manager.

After deployment, expose the secret to the API runtime and construct:

```text
postgresql+asyncpg://USERNAME:PASSWORD@RDS_ENDPOINT:5432/shootplanner
```

Set that value as `DATABASE_URL`, then run `alembic upgrade head` from the API
deployment before serving traffic.

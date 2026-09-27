# ShootPlanner API

FastAPI backend for ShootPlanner, using async SQLAlchemy and PostgreSQL.

## Run locally

Python 3.12+ and PostgreSQL are required. From this directory, run:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e ".[dev]"
Copy-Item .env.example .env
```

Set the local PostgreSQL connection and a random authentication secret in
`.env`, then run:

```powershell
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API is available at `http://localhost:8000`; Swagger documentation is at
`http://localhost:8000/docs`.

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

`infra/production-stack.yaml` provisions Aurora PostgreSQL Serverless v2 in
private subnets. It accepts traffic only from private EC2 API instances, stores
generated credentials in Secrets Manager, and exposes FastAPI through an HTTPS
Application Load Balancer.

After deployment, expose the secret to the API runtime and construct:

```text
postgresql+asyncpg://USERNAME:PASSWORD@RDS_ENDPOINT:5432/shootplanner
```

Set that value as `DATABASE_URL`, then run `alembic upgrade head` from the API
deployment before serving traffic.

See [docs/aws-deployment.md](docs/aws-deployment.md) for the complete Amplify,
EC2, Aurora, networking, secret, and release flow.

## Authentication

The API stores studios and users in PostgreSQL, hashes passwords with Argon2,
and returns a signed session in an `HttpOnly` cookie. The following endpoints
are available under `/api/v1/auth`:

- `POST /register`
- `POST /login`
- `POST /logout`
- `GET /me`

All studio data endpoints require this session and are scoped by `studio_id`.

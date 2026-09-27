# ShootPlanner

ShootPlanner is a studio-management application for photographers and
videographers.

```text
frontend/  TanStack Start, React, Vite, and Tailwind CSS
backend/   FastAPI, SQLAlchemy, Alembic, and PostgreSQL
```

## Prerequisites

- Node.js 22 or newer
- npm
- Python 3.12 or newer
- PostgreSQL 16 or newer for local development

## 1. Create the local database

Create a PostgreSQL user and database. Run the following through `psql` or a
tool such as pgAdmin:

```sql
CREATE USER shootplanner WITH PASSWORD 'change-me';
CREATE DATABASE shootplanner OWNER shootplanner;
```

Aurora PostgreSQL can be used instead. Never connect the browser directly to
PostgreSQL; only the Python backend receives database credentials.

## 2. Run the backend

Open a terminal at the repository root:

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e ".[dev]"
Copy-Item .env.example .env
```

Update `backend/.env`:

```env
APP_NAME=ShootPlanner API
ENVIRONMENT=development
API_V1_PREFIX=/api/v1
FRONTEND_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql+asyncpg://shootplanner:change-me@localhost:5432/shootplanner
DATABASE_ECHO=false
AUTH_SECRET_KEY=replace-with-a-random-secret-containing-at-least-32-characters
ACCESS_TOKEN_MINUTES=480
AUTH_COOKIE_NAME=shootplanner_session
```

Create the tables and start FastAPI:

```powershell
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend URLs:

- API: `http://localhost:8000`
- Swagger documentation: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/v1/health`

## 3. Run the frontend

Open a second terminal at the repository root:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

The frontend environment should contain:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Open `http://localhost:3000`. Registration creates a studio and owner account;
the login session is stored in an `HttpOnly` cookie.

## Checks and production builds

Frontend:

```powershell
cd frontend
npx tsc --noEmit
npm run lint
npm run build
```

Backend:

```powershell
cd backend
.venv\Scripts\Activate.ps1
pytest
ruff check .
```

Build the backend container:

```powershell
cd backend
docker build -t shootplanner-api .
docker run --rm -p 8000:8000 --env-file .env shootplanner-api
```

## AWS deployment

The production architecture uses:

- AWS Amplify Hosting for the TanStack Start frontend
- Application Load Balancer and private EC2 Auto Scaling for FastAPI
- Aurora PostgreSQL Serverless v2 through Amazon RDS
- AWS Secrets Manager for database credentials and the authentication secret

Deployment instructions are in
[backend/docs/aws-deployment.md](backend/docs/aws-deployment.md). The
infrastructure template is
[backend/infra/production-stack.yaml](backend/infra/production-stack.yaml).

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

First confirm Python is installed:

```powershell
py --version
```

If this command reports that Python is missing, install Python 3.12 or newer
and enable the installer option that adds the Python launcher to PATH.

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

Keep this terminal open while using the application. A successful startup ends
with output similar to:

```text
Uvicorn running on http://127.0.0.1:8000
```

### Verify the database connection

The migration command is the first database connection check:

```powershell
cd backend
.venv\Scripts\Activate.ps1
alembic current
alembic upgrade head
```

If it succeeds, PostgreSQL should contain these authentication tables:

```text
studios
users
clients
events
quotations
invoices
alembic_version
```

You can also open `http://localhost:8000/docs`, run `GET /api/v1/health`, and
then create the first account with `POST /api/v1/auth/register`.

### Using the configured Supabase PostgreSQL database

`backend/.env` contains separate Supabase pooler URLs:

- `DATABASE_URL` uses transaction mode on port `6543` for FastAPI.
- `DIRECT_URL` uses session mode on port `5432` for Alembic migrations.

Before starting the backend, replace `[YOUR-PASSWORD]` in both values with the
database password from the Supabase dashboard. Percent-encode reserved URL
characters in the password, such as `@`, `:`, `/`, `#`, `?`, and `%`.

Then run:

```powershell
cd backend
.venv\Scripts\Activate.ps1
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The transaction pooler does not support prepared statements. The backend
therefore disables the asyncpg and SQLAlchemy prepared-statement caches and
uses `NullPool`; Alembic always selects `DIRECT_URL`.

### Verify registration and login

After both applications are running:

1. Open `http://localhost:3000/signup`.
2. Create a studio owner account.
3. Confirm that one row was added to both `studios` and `users`.
4. Log out and sign in again at `http://localhost:3000/login`.
5. Open `http://localhost:8000/docs` and check `GET /api/v1/auth/me` if API
   debugging is needed.

Passwords are never stored directly. The database stores only an Argon2 hash
in `users.password_hash`.

### Common backend errors

- `py is not recognized`: install Python 3.12+ and reopen the terminal.
- `connection refused`: start PostgreSQL and confirm it is listening on port
  `5432`.
- `password authentication failed`: make the username and password in
  `DATABASE_URL` match PostgreSQL.
- `database "shootplanner" does not exist`: create the database before running
  Alembic.
- Browser CORS or cookie errors: confirm `FRONTEND_ORIGIN` exactly matches the
  frontend URL and `VITE_API_URL` exactly matches the backend API URL.

## 3. Run the frontend

Open a second terminal at the repository root:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

After installing the frontend dependencies, you can also start it directly
from the repository root:

```powershell
npm run dev
```

The frontend environment should contain:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Open `http://localhost:3000`. Registration creates a studio and owner account;
the login session is stored in an `HttpOnly` cookie.

## Customer invoice PDFs

Save your studio's brand colors, contact information, and bank details in
**Settings**. In **Invoices**, use **Download Invoice** to select a saved
customer invoice, or **Save & download PDF** on an invoice to save payment
changes before downloading.

The PDF includes the customer and linked event, quotation items and quantities,
discount, total, advance/payments received, balance due, due date, saved bank
details, deliverables, and notes. It uses the studio's saved primary and
secondary colors. Long invoices continue onto additional pages.

PDFs are generated by the authenticated backend from database records; they
are downloaded locally, not emailed automatically. After pulling this update,
run `python -m pip install -e ".[dev]"` in the backend virtual environment and
restart the backend to install the PDF dependency. No database migration is
needed for PDF downloads.

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

The final dot in `ruff check .` means "check all Python files in the current
backend directory."

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

The AWS database connection is established automatically by the production
stack:

1. Aurora generates its credentials in AWS Secrets Manager.
2. The private EC2 backend reads those credentials through its IAM role.
3. EC2 constructs `DATABASE_URL` inside the instance.
4. The backend container runs `alembic upgrade head`.
5. FastAPI connects to Aurora over port `5432` inside the VPC.
6. Amplify calls FastAPI through the HTTPS API domain; Amplify never receives
   database credentials.

Use custom domains under the same parent domain, for example
`app.example.com` and `api.example.com`, so the authentication cookie works
with its current `SameSite=Lax` policy.

## Authentication status

Currently implemented:

- Studio-owner registration
- Unique email and workspace subdomain checks
- Argon2 password hashing
- Login and logout
- Signed, expiring JWT session in an `HttpOnly` cookie
- Remember-me behavior
- Authenticated `/auth/me` endpoint
- Dashboard route protection
- Studio-level database isolation

Still required before a public production launch:

- Email verification
- Password-reset tokens and AWS SES email delivery
- Login rate limiting and temporary account lockout
- Session revocation or token-version support
- Audit logs for authentication and sensitive changes
- Automated backend integration tests against PostgreSQL
- Monitoring and alerts for failed login spikes and backend errors

``powershell backend
cd shoot-shine-main
cd backend
.\.venv\Scripts\Activate.ps1
python -m alembic upgrade head
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

frontend
cd .\shoot-shine-main\frontend
npm run dev
# ShootPlanner

ShootPlanner is organized as a small monorepo:

```text
frontend/  TanStack Start, React, Vite, and Tailwind CSS
backend/   FastAPI, SQLAlchemy, Alembic, and PostgreSQL on Amazon RDS
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate
pip install -e ".[dev]"
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

The API defaults to `http://localhost:8000`, with OpenAPI documentation at
`http://localhost:8000/docs`. Set `DATABASE_URL` to the SQLAlchemy connection
URL for the PostgreSQL instance provisioned in AWS RDS.

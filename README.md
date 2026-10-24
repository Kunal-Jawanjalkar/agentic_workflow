# Agentic Workflow

## Prerequisites

- Python ≥ 3.14 and [uv](https://docs.astral.sh/uv/)
- Node.js and npm
- Docker (for PostgreSQL)

## Setup

### Backend

```bash
cd backend
cp .env.example .env
# Set SECRET_KEY in .env
docker compose up -d db
uv sync
uv run alembic upgrade head
```

If `upgrade head` fails because `users` already exists from an older dev setup, run the command again after pulling the latest migration (it upgrades legacy tables in place). For a clean slate: `docker compose down -v`, then start Postgres and run migrations again.

### Frontend

```bash
cd frontend
npm install
```

## Start

**Backend** (from `backend/`):

```bash
uv run backend
```

API: http://localhost:8000

**Frontend** (from `frontend/`):

```bash
npm run dev
```

App: http://localhost:5173

The frontend dev server proxies `/api` to the backend on port 8000.

## Docker (optional)

Run API and database together from `backend/` (set `DATABASE_URL` to use host `db`, e.g. `postgresql://app:app@db:5432/agentic_workflow`):

```bash
docker compose up --build
```

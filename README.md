# Agentic Workflow

## Prerequisites

- Node.js 24 and npm
- Docker (for PostgreSQL)

## Setup

### Server

```bash
cd server
cp .env.example .env
# Set SECRET_KEY in .env
docker compose up -d db
npm install
npm run prisma:generate
```

### Frontend

```bash
cd frontend
npm install
```

## Start

**Server** (from `server/`):

```bash
npm run dev
```

API: http://localhost:8001

**Frontend** (from `frontend/`):

```bash
npm run dev
```

App: http://localhost:5173

The frontend dev server proxies `/api` to the NestJS server on port 8001.

## Docker (optional)

Run the API and database together from `server/`:

```bash
docker compose up --build
```

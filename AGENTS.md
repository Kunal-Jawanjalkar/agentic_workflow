# Agent instructions

You are a **senior full-stack engineer** on this repo: **React (TypeScript)** on the client and **FastAPI (Python)** on the server. Ship production-quality changes with small, reviewable diffs, clear types end-to-end, and behavior that matches existing patterns.

## Product vision

We are building an **agentic AI workflow platform** in the spirit of **Zapier** and **n8n**, with workflows that combine classic automation (triggers, integrations, data mapping) and **AI agent steps** (reasoning, tool use, optional human approval).

### What users do

- **Design** workflows on a visual canvas (nodes and edges).
- **Connect** apps and services (HTTP, webhooks, email, CRMs, etc.) plus **AI** (models, prompts, tools).
- **Run** workflows on schedules, events, or manually; inspect **runs**, logs, and outputs.
- **Iterate** on prompts and graph structure without breaking saved versions when possible.

### Core domain (use these terms consistently)

| Concept | Meaning |
| -------- | -------- |
| **Workflow** | Versioned graph definition (metadata + nodes + edges). |
| **Node** | One step: trigger, action, transform, branch, delay, or **agent**. |
| **Edge** | Data/control flow between nodes; may carry typed payloads or references. |
| **Run / execution** | One invocation of a workflow; has status, timestamps, per-node results. |
| **Connector / integration** | Authenticated capability to call an external system (OAuth, API key, webhook). |
| **Agent node** | LLM-driven step with system prompt, tools, context from upstream nodes, and guardrails. |

### Agentic vs classic automation

- **Classic nodes** should be **deterministic** when inputs are fixed (HTTP call, filter, map fields).
- **Agent nodes** may be **non-deterministic** — design for: timeouts, token limits, structured outputs (JSON schema), validation, retries, and clear failure messages in run logs.
- Prefer **human-in-the-loop** as an explicit node type (approve/reject/edit) rather than implicit blocking in the UI only.

### Architecture direction (evolve incrementally)

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend: canvas editor, run history, credentials UI       │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST / (later) SSE or WebSocket
┌───────────────────────────▼─────────────────────────────────┐
│  API: workflows, versions, runs, connectors, secrets        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Execution engine: topological walk / queue, node executors │
│  (Python: integrations + agent runtime + sandboxed tools)   │
└─────────────────────────────────────────────────────────────┘
```

**Source of truth:** workflow graph as **JSON** (stored server-side); the canvas is an editor over that model, not a separate ad-hoc format.

**Suggested build order** (unless the user asks otherwise):

1. Workflow CRUD + graph JSON schema (types in TS + Pydantic).
2. Minimal executor: manual trigger → one or two action nodes → persist run record.
3. Canvas UI bound to the same graph model (add/move/connect nodes).
4. Webhook trigger + HTTP action nodes.
5. Agent node (prompt + structured output + optional tools).
6. Credentials vault, scheduling, retries, and streaming run updates.

When implementing features, ask: *Does this belong in the graph model, the executor, or the editor?* Keep those boundaries clean.

## Repository layout

| Path        | Stack                                                       | Notes                                                        |
| ----------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| `frontend/` | React 19, Vite 8, TypeScript, React Compiler (Babel preset) | SPA; `npm run dev` on default Vite port                      |
| `backend/`  | FastAPI, Uvicorn, **uv**, Python **≥ 3.14**                 | Src layout: `backend/src/backend/`; app instance in `app.py` |

Workspace Python interpreter: `backend/.venv` (see `.vscode/settings.json`). Backend analysis uses `[tool.pyright]` in `backend/pyproject.toml`.

## Commands

**Backend** (from `backend/`):

```bash
uv sync
uv run backend                    # Uvicorn with reload on :8000
uv run uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

**Frontend** (from `frontend/`):

```bash
npm install
npm run dev
npm run build
npm run lint
```

**Dependencies:** Prefer `uv add` / `pyproject.toml` for Python; `npm install <pkg>` for JS. Keep `requirements.txt` as **direct** runtime deps only (`fastapi`, `uvicorn[standard]`), aligned with `pyproject.toml`.

## How you work

1. **Read before writing** — Match naming, folder structure, and style in the area you touch.
2. **Minimize scope** — One concern per change; no drive-by refactors or unrelated formatting.
3. **Types are part of the API** — Pydantic models and TypeScript types should stay in sync when exposing HTTP contracts.
4. **Verify** — Run lint/build or a quick manual check for the surfaces you changed; fix issues you introduce.
5. **No secrets in git** — Use env vars; never commit `.env`, keys, or tokens.

## Frontend (React)

### Stack defaults

- **Functional components** only; use hooks for state and effects.
- **TypeScript strict** — Explicit props/types; avoid `any` unless justified in a comment.
- **React 19** + **React Compiler** — Rely on the compiler for memoization where appropriate; still write clear data flow (don’t fight the compiler with unstable inline objects in hot paths without reason).
- **Vite** — ESM, `import` for assets; configure API proxy in `vite.config.ts` when calling the backend in dev (e.g. `/api` → `http://localhost:8000`).

### Structure (grow into this as the app grows)

```
frontend/src/
  components/     # Presentational & shared UI
  features/
    workflows/    # List, editor entry, versioning UI
    canvas/       # Node palette, graph view, inspector panel
    runs/         # Execution timeline, logs, node I/O
    connections/  # OAuth / API key management UI
  hooks/
  lib/            # api client, utils
  types/          # Workflow graph, nodes, runs (mirror API schemas)
```

**Canvas:** Prefer a maintained graph library (e.g. React Flow) when adding the editor; keep **node types** and **port types** driven from shared workflow schema types, not hardcoded only in the UI.

### UI & data fetching

- Colocate feature code; extract hooks when logic is reused or `useEffect` chains grow.
- Prefer **typed fetch** or a thin `lib/api.ts` with base URL from `import.meta.env`.
- Handle loading, error, and empty states for user-facing requests.
- Accessibility: semantic HTML, labels on controls, meaningful `alt` text, keyboard-friendly interactions.

### Styling

- Follow existing approach in the repo (CSS modules, plain CSS, or a library once introduced). Don’t introduce a new styling system without a clear need.

## Backend (FastAPI)

### Stack defaults

- **Python 3.14** features are fine when they improve clarity (e.g. modern type syntax).
- **FastAPI** app factory pattern: keep `app = FastAPI(...)` in `app.py`; add routers under `backend/src/backend/api/` or `routers/` as endpoints grow.
- **Pydantic v2** models for request/response bodies and settings.
- **Dependency injection** for DB sessions, auth, and shared services — avoid global mutable state.

### Suggested layout (as complexity grows)

```
backend/src/backend/
  app.py
  api/v1/             # workflows, runs, webhooks, connections
  core/               # config, deps, security
  schemas/            # WorkflowGraph, NodeConfig, Run, RunStep, ...
  services/           # CRUD, credentials (never log secrets)
  engine/             # orchestration: schedule, execute node, persist state
    executors/        # per node type: http, transform, agent, ...
  integrations/     # third-party clients (thin wrappers)
```

### API design

- RESTful, predictable paths: `/api/v1/...` when versioning matters.
- Consistent JSON shapes; use appropriate HTTP status codes and FastAPI `HTTPException` / exception handlers.
- Document via OpenAPI (automatic); keep `summary`/`description` on non-obvious routes.
- **CORS**: configure explicitly for known frontend origins in dev/prod — don’t use `allow_origins=["*"]` with credentials.

### Quality

- Type-annotate route handlers and services; run Pyright against `backend/` when changing Python.
- Side effects (DB, HTTP clients) belong in services, not fat route handlers.
- Add `GET /health` (or keep existing) for orchestration; don’t put secrets in health responses.

## Full-stack integration

- **Contract first** — Define or update Pydantic schemas and matching TS types (or generate types from OpenAPI if you add that pipeline).
- **Errors** — Prefer a consistent error body, e.g. `{ "detail": "..." }` (FastAPI default) or a shared `{ "code", "message" }` if the project adopts it.
- **Local dev** — Frontend on Vite port, API on `:8000`; use Vite proxy or `VITE_API_URL` so the browser never hardcodes production URLs.

## Security (baseline)

- Validate all input with Pydantic; validate on the client for UX, never for authority.
- Authn/authz: use dependencies and fail closed; no sensitive logic in query params.
- Parameterize DB queries; no string-built SQL.

## Commits & docs

- Don’t create commits or markdown files unless the user asks.
- When adding env vars, document names in code comments or existing README patterns — don’t add new top-level docs unprompted.

## Anti-patterns

- Huge single-file components or 200-line route handlers.
- Duplicating API field names as loose strings across frontend and backend.
- Installing packages without updating the canonical manifest (`package.json` / `pyproject.toml`).
- Disabling lint/typecheck to “make it pass”.
- Over-abstracting (generic helpers used once).
- **Canvas-only workflow state** that never round-trips to the API graph model.
- **Executing arbitrary user code** on the server without sandboxing or strict allowlists.
- **Logging prompts, API keys, or PII** in run logs — redact by default.

When requirements are ambiguous, choose the **simplest maintainable** option that fits the product vision and structures above, and note tradeoffs briefly in your reply.

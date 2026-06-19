# dag-tools

A web application that hosts independent file-manipulation utilities ("Tools"). Today there are two client-side Tools — **PDF Combine** and **PDF Split** — and a server-side backend is being introduced to support Share Links (see [ADR 0001](docs/adr/0001-server-side-pdf-with-sqlite.md)).

## Prerequisites

- Node.js 20+
- pnpm

## Install

```bash
pnpm install --frozen-lockfile
```

> Never use `npm install` — it produces a different dependency tree.

## Development

dag-tools runs two processes during the server-side migration (strangler fig):

| Process | Command        | Port | Serves                              |
| ------- | -------------- | ---- | ----------------------------------- |
| Web UI  | `pnpm dev`     | 3000 | Next.js App Router (the Tools UI)   |
| API     | `pnpm dev:api` | 3001 | Hono backend (`/api/v1/*`)          |

Run both in separate terminals. The Web UI Talks to the API at `http://localhost:3001`.

On first boot the API creates two runtime directories (both gitignored):

- `./data/dag-tools.db` — the SQLite database (Artifact metadata).
- `./storage/` — binary Artifact blobs, stored as `./storage/<id>.<ext>`.

Override the API port, database path, or storage directory with `PORT`, `DB_PATH`, and `STORAGE_DIR` env vars.

## Quality gates

Run all of these before committing — they must pass:

```bash
pnpm run typecheck   # tsc --noEmit (strict)
pnpm run lint        # ESLint
pnpm run test        # vitest unit + integration tests
pnpm run test:e2e    # Playwright (only when routes/build change)
```

## Project layout

```
src/
  app/            Next.js App Router routes
  components/      React components
  lib/            Tool domain logic (combine-pdf, split-pdf, pdf-tools)
  server/         Hono backend (app, db, storage, boot entry)
tests/
  unit/           vitest — pure domain logic
  integration/    vitest — Hono app boundary via app.request()
  e2e/            Playwright — full stack
  fixtures/       sample PDFs
docs/adr/         architecture decision records
```

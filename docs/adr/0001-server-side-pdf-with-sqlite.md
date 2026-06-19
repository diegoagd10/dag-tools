# ADR 0001: Server-side PDF processing with SQLite + filesystem Artifacts

- **Status:** Accepted
- **Date:** 2026-06-19
- **Supersedes:** the Client-Side Processing constraint as it applied to file operations (PDF Combine, PDF Split)

## Context

dag-tools originally ran every Tool entirely in the browser: Source PDFs were parsed, merged, and split client-side, and the result lived only in browser memory. There was no way to share a result by link, and the planned QR Code Tool needs server-side storage for Share Links anyway. The deployment target is a personal Linux server behind nginx, so the stack should be cheap to operate: one Node process, one database file, a filesystem directory for blobs — no cloud-first complexity.

## Decision

Move all Tool processing to a small Hono backend. SQLite holds Artifact metadata; the filesystem holds binary blobs. Every Tool invocation produces a Share Link (`/<group>/<tool>/:id`) that anyone can open. The frontend becomes a UI shell that uploads inputs and renders Share Links.

### Stack

- **Runtime:** Node + pnpm. `pdf-lib` and `jszip` already work server-side without rewrites.
- **Framework:** Hono with `@hono/node-server`. TypeScript-first; one process will eventually serve both the API and the React static build.
- **Database:** SQLite via `better-sqlite3` at `./data/dag-tools.db` — one file to back up.
- **Binary storage:** filesystem at `./storage/<id>.<ext>`. The DB row holds the path.

### URL hierarchy

- API: `POST /api/v1/<group>/<tool>` (e.g. `/api/v1/pdf/combine`).
- Form: `GET /<group>/<tool>` (e.g. `/pdf/combine`).
- Share Link: `GET /<group>/<tool>/:id` (e.g. `/pdf/combine/:id`).

### Schema — single `artifacts` table

```
artifacts
  id            TEXT    PRIMARY KEY   -- share ID, opaque string
  "group"       TEXT    NOT NULL      -- 'pdf' | 'links'
  tool          TEXT    NOT NULL      -- 'combine' | 'split' | 'qr'
  artifact_path TEXT                   -- filesystem path, NULL for QR
  text_content  TEXT                   -- QR content, NULL for PDF
  filename      TEXT                   -- original filename, NULL for QR
  mime_type     TEXT    NOT NULL       -- 'application/pdf' | 'application/zip' | 'text/plain'
  byte_size    INTEGER                 -- NULL for QR
  page_count   INTEGER                 -- PDF only
  created_at    INTEGER NOT NULL       -- unix ms
  expires_at    INTEGER                 -- reserved (TTL seam), NULL for now
  creator_token TEXT                   -- reserved (auth seam), NULL for now
```

`"group"` is double-quoted because `GROUP` is a SQL keyword.

### Design seams (deferred, no implementation today)

- **Share ID generation**: nanoid / UUID / base62 — TBD. The schema accepts any opaque string, so it can be swapped without migration.
- **TTL**: `expires_at` reserved; lazy check via a single helper.
- **Auth**: `creator_token` reserved; the Share ID is the only authorization today.

### Migration strategy

Strangler fig, per-Tool. Hono runs alongside Next.js on a separate port (Hono on 3001, Next.js on 3000) during migration. Each Tool is migrated end-to-end (frontend + API) before moving on. Order: Combine → Split → QR (QR is built directly on Hono). Next.js is dropped when empty.

## Consequences

- **Positive:** Share Links become possible; large PDFs no longer strain the browser; one process + one DB file + one storage dir is simple to operate and back up.
- **Negative:** The "nothing is uploaded, nothing is logged" Home copy is no longer accurate and must be updated. Processing now consumes server CPU/memory instead of the client's. The server stores user Artifacts (mitigated by Share-ID-only authorization and reserved TTL/auth seams).
- **Testing seam:** the Hono app boundary via `app.request()` against an in-memory SQLite (`:memory:`) and a temp storage dir covers routing, validation, DB queries, file storage, and error responses in one place.

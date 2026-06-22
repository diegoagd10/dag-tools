# Server-side PDF processing with SQLite and shareable Artifacts

We moved all Tool processing (PDF Combine, PDF Split, QR Code planned) from the browser to the Hono backend. Artifacts are stored on the filesystem with metadata in SQLite, and every Tool produces a Share Link at `/<group>/<tool>/:id`.

This replaces the previous client-side design where files never traversed a server and processing happened in-browser via pdf-lib and Zustand stores.

## Context

The original dag-tools was a Next.js 16 app where PDF Combine and PDF Split ran entirely in the browser using pdf-lib and jszip. The home page promised "nothing is uploaded, nothing is logged." The planned QR Code Tool already required server-side storage to support its Share Link feature, but the PDF Tools did not.

The user wanted the ability to share results ("share later"), and chose SQLite + a tiny personal-server backend over a heavier framework. The pivot inverts the privacy guarantee: files now traverse the server, Artifacts persist on disk, and Share Links become the primary user-facing artifact.

## Considered Options

- **Stay client-side (status quo)**: preserve "nothing leaves your browser." Rejected because shareability requires server-side persistence, and the QR Tool already needed server-side storage anyway.
- **Stateless server with object storage (S3, MinIO)**: proper cloud architecture. Rejected as overkill for a personal Linux server; SQLite + filesystem is one backup target, fewer moving parts, and matches the deployment target.
- **Server-side processing with SQLite + filesystem** *(chosen)*: Hono backend, SQLite for metadata, filesystem under `./storage/` for binary blobs. Simple systemd unit + nginx in front.

## Consequences

- `Client-Side Processing` (in old glossary) is gone; files DO traverse the server. The home page copy must be updated.
- `File Tool` / `Link Tool` subtype split remains valid as a domain concept, but the rationale shifted: both subtypes are server-side; the distinction is now about output shape (downloadable file vs. rendered share page) rather than processing location.
- `File Tool Session` / `Share Link Session` (added in an earlier grilling pass) are obsolete — client-side ephemeral sessions no longer exist; Share Links now point to persistent Artifacts on the server.
- `Empty Result State` patterns (the `/tools/<slug>/result` "no merge to show" message) are gone; replaced by `404 on Missing Artifact` (see `CONTEXT.md` Patterns).
- URL hierarchy is now uniform: API `POST /api/v1/<group>/<tool>`, form `GET /<group>/<tool>`, Share Link `GET /<group>/<tool>/:id`.
- Single `artifacts` table with reserved `expires_at` and `creator_token` columns — both `NULL` for now, populated when TTL/auth features land (design seams).
- Share ID generation strategy is also deferred (design seam) — any opaque string of reasonable length works.

## Migration

Strangler fig, per-Tool. Hono runs alongside Next.js on a separate port; each Tool migrated end-to-end (frontend + API) before moving on. QR goes straight to Hono since it was never implemented. Next.js is dropped when no Tools remain.

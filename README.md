# dag-tools

A small workshop of self-contained file-manipulation utilities.

## Getting Started

### Hono server (backend)

```bash
# Install dependencies
pnpm install

# Build Tailwind CSS (one-time or on change)
pnpm run build:css

# Start the Hono dev server
pnpm run dev:hono
```

The Hono server runs on `http://localhost:3001` by default.

Environment variables:
- `PORT` — server port (default: `3001`)
- `DB_PATH` — SQLite database path (default: `./data/dag-tools.db`)
- `STORAGE_DIR` — artifact storage directory (default: `./storage`)

### Next.js app (frontend)

```bash
# Start the Next.js dev server
pnpm run dev
```

The Next.js app runs on `http://localhost:3000`.

### Testing

```bash
# Unit and integration tests
pnpm run test

# End-to-end tests
pnpm run test:e2e

# Type checking (root + server)
pnpm run typecheck
pnpm run typecheck:server
```

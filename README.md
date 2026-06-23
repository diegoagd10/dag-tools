# dag-tools

A small workshop of self-contained file-manipulation utilities. Each tool runs server-side — your files are processed and stored securely.

## Getting Started

```bash
# Install dependencies
pnpm install

# Build Tailwind CSS (one-time or on change)
pnpm run build:css

# Start the development server
pnpm run dev
```

The server runs on `http://localhost:3001` by default.

Environment variables:
- `PORT` — server port (default: `3001`)
- `DB_PATH` — SQLite database path (default: `./data/dag-tools.db`)
- `STORAGE_DIR` — artifact storage directory (default: `./storage`)

## Testing

```bash
# Unit and integration tests
pnpm run test

# End-to-end tests
pnpm run test:e2e

# Type checking
pnpm run typecheck
```

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

The server runs on `http://localhost:3000` by default.

Environment variables:
- `PORT` — server port (default: `3000`)
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

## Production Deployment

The Docker image (`Dockerfile`) is designed for production hosting (e.g., on a VPS or cloud instance). It expects persistent host storage mounted at `/data` inside the container.

### Runtime data path contract

| Mount point | Purpose | Host example |
|---|---|---|
| `/data` | SQLite database + artifact storage | `/home/charizard10/dag-tools-data` |

- **Database**: SQLite file at `/data/dag-tools.db` (set via `DB_PATH`).
- **Artifacts**: Share Link files under `/data/storage` (set via `STORAGE_DIR`).

### Example run

```bash
docker run -d --name dag-tools \
  -p 3010:3000 \
  -v /home/charizard10/dag-tools-data:/data \
  dag-tools:latest
```

The container exposes port 3000 internally; map it to any host port (here `3010`). The volume mount ensures database and artifacts survive container restarts and upgrades.

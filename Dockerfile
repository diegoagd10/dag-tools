# Stage 1: build frontend assets
FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Stage 2: production runtime
FROM node:22-bookworm-slim AS runtime

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/src ./src
COPY --from=builder /app/static ./static
COPY --from=builder /app/tsconfig.server.json ./

EXPOSE 3000

ENV PORT=3000
ENV DB_PATH=/data/dag-tools.db
ENV STORAGE_DIR=/data/storage

VOLUME /data

# Run only the Hono server — CSS is pre-built in the builder stage
ENTRYPOINT ["pnpm", "exec", "tsx", "--tsconfig", "tsconfig.server.json", "src/index.ts"]

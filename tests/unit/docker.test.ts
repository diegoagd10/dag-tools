import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");

const dockerfile = (): string => readFileSync(resolve(root, "Dockerfile"), "utf-8");

describe("Dockerfile", () => {
  it("uses a multi-stage build with at least two FROM instructions", () => {
    const lines = dockerfile().split("\n");
    const fromLines = lines.filter((l) => l.match(/^FROM\s/));
    expect(fromLines.length).toBeGreaterThanOrEqual(2);
  });

  it("builds CSS during the builder stage (pnpm run build)", () => {
    const content = dockerfile();
    expect(content).toMatch(/pnpm\s+run\s+build/);
  });

  it("exposes port 3000", () => {
    const content = dockerfile();
    expect(content).toMatch(/EXPOSE\s+3000/);
  });

  it("sets ENV PORT=3000", () => {
    const content = dockerfile();
    expect(content).toMatch(/ENV\s+PORT\s*=\s*3000/);
  });

  it("sets ENV DB_PATH=/data/dag-tools.db", () => {
    const content = dockerfile();
    expect(content).toMatch(/ENV\s+DB_PATH\s*=\s*\/data\/dag-tools\.db/);
  });

  it("sets ENV STORAGE_DIR=/data/storage", () => {
    const content = dockerfile();
    expect(content).toMatch(/ENV\s+STORAGE_DIR\s*=\s*\/data\/storage/);
  });

  it("declares VOLUME /data", () => {
    const content = dockerfile();
    expect(content).toMatch(/VOLUME\s+\/data/);
  });

  it("ENTRYPOINT starts only the Hono server, not build:css or pnpm run start", () => {
    const content = dockerfile();
    expect(content).toMatch(/ENTRYPOINT\s/);
    expect(content).toMatch(/tsx.*src\/index\.ts/);
    expect(content).not.toMatch(/build:css/);
    // Must not use pnpm run start (which rebuilds CSS at runtime)
    expect(content).not.toMatch(/pnpm\s+run\s+start/);
  });
});

describe(".dockerignore", () => {
  it("exists", () => {
    expect(existsSync(resolve(root, ".dockerignore"))).toBe(true);
  });

  it("excludes node_modules", () => {
    const content = readFileSync(resolve(root, ".dockerignore"), "utf-8");
    expect(content).toMatch(/node_modules/);
  });

  it("excludes .git", () => {
    const content = readFileSync(resolve(root, ".dockerignore"), "utf-8");
    expect(content).toMatch(/(?:^|\n)\.git(?:\n|$|\r)/);
  });

  it("excludes tests/e2e", () => {
    const content = readFileSync(resolve(root, ".dockerignore"), "utf-8");
    expect(content).toMatch(/tests\/e2e/);
  });
});

describe("pnpm native build config", () => {
  it("package.json declares onlyBuiltDependencies with better-sqlite3 and esbuild", () => {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"));
    expect(pkg.pnpm).toBeDefined();
    expect(pkg.pnpm.onlyBuiltDependencies).toEqual(
      expect.arrayContaining(["better-sqlite3", "esbuild"]),
    );
  });

  it("pnpm-workspace.yaml allowBuilds enables better-sqlite3 and esbuild", () => {
    const content = readFileSync(resolve(root, "pnpm-workspace.yaml"), "utf-8");
    expect(content).toMatch(/better-sqlite3:\s*true/);
    expect(content).toMatch(/esbuild:\s*true/);
  });
});

describe("server PORT default", () => {
  it("src/index.ts defaults PORT to 3000", () => {
    const content = readFileSync(resolve(root, "src/index.ts"), "utf-8");
    expect(content).toMatch(/process\.env\.PORT\s*\|\|\s*"3000"/);
  });
});

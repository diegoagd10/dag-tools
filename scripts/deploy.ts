#!/usr/bin/env tsx
/**
 * svc-01 deploy script. Runs from an already-cloned dag-tools repo.
 * Justification for `scripts/` top-level dir: ops-only CLI, not runtime code.
 *
 * Pipeline:
 *  1. Load .env.deploy (shell overrides win).
 *  2. Validate required env vars (PORTAINER_API_KEY required).
 *  3. Detect git SHA via `git rev-parse HEAD`.
 *  4. `docker build -t dag-tools:<sha> -t dag-tools:latest .`
 *  5. GET /api/stacks — find STACK_NAME (case-insensitive).
 *  6. POST /api/stacks (create) or PUT /api/stacks/:id (update).
 *  7. Smoke check http://127.0.0.1:3010/ until 2xx or timeout.
 *  8. Backup Traefik dynamic config.
 *  9. Merge dag-tools router + service marker block into config.
 * 10. Write merged config, restart Traefik container.
 * 11. Public smoke check https://tools.local.dagdappshub.com/.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { backupConfig, buildDagToolsBlock, mergeDagToolsBlock } from "./traefik-config";

// ── Public types ────────────────────────────────────────────────────────────

export type DeployEnv = {
  portainerUrl: string;
  portainerApiKey: string;
  portainerEndpointId: number;
  stackName: string;
};

export interface DeployExecutor {
  readDotenv(path: string): Record<string, string>;
  getEnv(): Record<string, string | undefined>;
  gitSha(): string;
  dockerBuild(sha: string): void;
  portainerList(env: DeployEnv): Promise<{ Id: number; Name: string }[]>;
  portainerCreate(env: DeployEnv, composeYaml: string): Promise<void>;
  portainerUpdate(
    env: DeployEnv,
    id: number,
    composeYaml: string,
  ): Promise<void>;
  smokeCheck(url: string, timeoutMs: number): Promise<boolean>;
  traefikBackupConfig(path: string): Promise<string>;
  traefikWriteConfig(path: string, content: string): Promise<void>;
  traefikRestart(): Promise<void>;
  traefikSmokeCheck(url: string, timeoutMs: number): Promise<boolean>;
}

// ── Core orchestration (testable seam) ──────────────────────────────────────

export async function main(executor: DeployExecutor): Promise<void> {
  // 1. Load env: .env.deploy first, then shell overrides win
  const dotenv = executor.readDotenv(".env.deploy");
  const shell = executor.getEnv();
  const env: Record<string, string> = { ...dotenv };
  for (const [k, v] of Object.entries(shell)) {
    if (v !== undefined) env[k] = v;
  }

  // 2. Validate required and apply defaults
  const apiKey = (env["PORTAINER_API_KEY"] ?? "").trim();
  if (!apiKey) {
    throw new Error(
      "PORTAINER_API_KEY is required. Set it in .env.deploy or the shell environment.",
    );
  }

  const deployEnv: DeployEnv = {
    portainerUrl: env["PORTAINER_URL"] ?? "https://localhost:9443",
    portainerApiKey: apiKey,
    portainerEndpointId: parseInt(
      env["PORTAINER_ENDPOINT_ID"] ?? "1",
      10,
    ),
    stackName: env["STACK_NAME"] ?? "dag-tools",
  };

  // 3. Git SHA
  const sha = executor.gitSha();

  // 4. Docker build
  executor.dockerBuild(sha);

  // 5. Compose YAML with immutable image tag
  const composeYaml = `version: "3.8"
services:
  dag-tools:
    image: dag-tools:${sha}
    ports:
      - "3010:3000"
    volumes:
      - /home/charizard10/dag-tools-data:/data
    environment:
      - PORT=3000
      - DB_PATH=/data/dag-tools.db
      - STORAGE_DIR=/data/storage
`;

  // 6. Portainer: list stacks, find by name (case-insensitive)
  const stacks = await executor.portainerList(deployEnv);
  const existing = stacks.find(
    (s) => s.Name.toLowerCase() === deployEnv.stackName.toLowerCase(),
  );

  if (existing) {
    await executor.portainerUpdate(deployEnv, existing.Id, composeYaml);
  } else {
    await executor.portainerCreate(deployEnv, composeYaml);
  }

  // 7. Smoke check
  const ok = await executor.smokeCheck("http://127.0.0.1:3010/", 30_000);
  if (!ok) {
    throw new Error(
      "Smoke check failed: app not responding on http://127.0.0.1:3010/",
    );
  }

  // 8. Traefik: backup current dynamic config
  const traefikConfigPath =
    env["TRAEFIK_CONFIG_PATH"] ?? "/home/charizard10/traefik/dynamic.yml";
  const traefikSmokeUrl =
    env["TRAEFIK_SMOKE_URL"] ?? "https://tools.local.dagdappshub.com/";

  await executor.traefikBackupConfig(traefikConfigPath);

  // 9. Read current config, merge dag-tools block
  const raw = existsSync(traefikConfigPath)
    ? readFileSync(traefikConfigPath, "utf-8")
    : "";
  const block = buildDagToolsBlock();
  const merged = mergeDagToolsBlock(raw, block);

  // 10. Write merged config
  await executor.traefikWriteConfig(traefikConfigPath, merged);

  // 11. Restart Traefik
  await executor.traefikRestart();

  // 12. Public smoke check
  const traefikOk = await executor.traefikSmokeCheck(traefikSmokeUrl, 30_000);
  if (!traefikOk) {
    throw new Error("Traefik smoke check failed");
  }
}

// ── Default (real) executor implementations ─────────────────────────────────

function realReadDotenv(path: string): Record<string, string> {
  const result: Record<string, string> = {};
  const fullPath = resolve(process.cwd(), path);
  if (!existsSync(fullPath)) return result;

  const content = readFileSync(fullPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

function realGetEnv(): Record<string, string | undefined> {
  return { ...(process.env as Record<string, string | undefined>) };
}

function realGitSha(): string {
  const sha = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  if (!sha) throw new Error("Failed to get git SHA — empty output");
  return sha;
}

function realDockerBuild(sha: string): void {
  execFileSync(
    "docker",
    ["build", "-t", `dag-tools:${sha}`, "-t", "dag-tools:latest", "."],
    { stdio: "inherit" },
  );
}

async function realPortainerList(
  env: DeployEnv,
): Promise<{ Id: number; Name: string }[]> {
  const url = `${env.portainerUrl}/api/stacks?endpointId=${env.portainerEndpointId}`;
  const res = await fetch(url, {
    headers: { "X-API-Key": env.portainerApiKey },
  });
  if (!res.ok) {
    throw new Error(
      `Portainer list stacks failed: ${res.status} ${await tryText(res)}`,
    );
  }
  return res.json() as Promise<{ Id: number; Name: string }[]>;
}

async function realPortainerCreate(
  env: DeployEnv,
  composeYaml: string,
): Promise<void> {
  const composeBase64 = Buffer.from(composeYaml).toString("base64");
  const url = `${env.portainerUrl}/api/stacks`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-API-Key": env.portainerApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Name: env.stackName,
      EndpointId: env.portainerEndpointId,
      ComposeFile: composeBase64,
      Format: "compose",
    }),
  });
  if (res.status !== 201 && res.status !== 200) {
    throw new Error(
      `Portainer create stack failed: ${res.status} ${await tryText(res)}`,
    );
  }
}

async function realPortainerUpdate(
  env: DeployEnv,
  id: number,
  composeYaml: string,
): Promise<void> {
  const composeBase64 = Buffer.from(composeYaml).toString("base64");
  const url = `${env.portainerUrl}/api/stacks/${id}?endpointId=${env.portainerEndpointId}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "X-API-Key": env.portainerApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ComposeFile: composeBase64,
      Prune: false,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Portainer update stack failed: ${res.status} ${await tryText(res)}`,
    );
  }
}

async function realSmokeCheck(
  url: string,
  timeoutMs: number,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return true;
    } catch {
      // Retry on any failure (connection refused, timeout, non-2xx)
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

async function realTraefikBackupConfig(path: string): Promise<string> {
  return backupConfig(path);
}

async function realTraefikWriteConfig(
  path: string,
  content: string,
): Promise<void> {
  writeFileSync(path, content, "utf-8");
}

async function realTraefikRestart(): Promise<void> {
  execFileSync("docker", ["restart", "traefik"], { stdio: "inherit" });
}

async function realTraefikSmokeCheck(
  url: string,
  timeoutMs: number,
): Promise<boolean> {
  return realSmokeCheck(url, timeoutMs);
}

async function tryText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "<unreadable body>";
  }
}

// ── Factory ─────────────────────────────────────────────────────────────────

/** Build a DeployExecutor wired to real OS / Docker / Portainer. */
export function defaultExecutor(): DeployExecutor {
  return {
    readDotenv: realReadDotenv,
    getEnv: realGetEnv,
    gitSha: realGitSha,
    dockerBuild: realDockerBuild,
    portainerList: realPortainerList,
    portainerCreate: realPortainerCreate,
    portainerUpdate: realPortainerUpdate,
    smokeCheck: realSmokeCheck,
    traefikBackupConfig: realTraefikBackupConfig,
    traefikWriteConfig: realTraefikWriteConfig,
    traefikRestart: realTraefikRestart,
    traefikSmokeCheck: realTraefikSmokeCheck,
  };
}

// ── CLI entry point ─────────────────────────────────────────────────────────

const isDirectRun =
  process.argv[1] != null &&
  import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  main(defaultExecutor()).catch((err) => {
    console.error("Deploy failed:", (err as Error).message);
    process.exit(1);
  });
}

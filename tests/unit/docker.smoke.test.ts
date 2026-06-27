import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dirname, "../..");

describe.skipIf(!process.env.DOCKER_SMOKE_TEST)("Docker smoke", () => {
  const imageTag = "dag-tools:smoke-test";
  const containerName = "dag-tools-smoke";
  const hostPort = 3099;
  const baseUrl = `http://127.0.0.1:${hostPort}`;
  let volumeDir: string;

  beforeAll(() => {
    volumeDir = mkdtempSync(`${tmpdir()}/dag-tools-smoke-vol-`);
  });

  afterAll(() => {
    // Best-effort cleanup
    try { spawnSync("docker", ["stop", containerName], { timeout: 30_000 }); } catch { /* ignore */ }
    try { spawnSync("docker", ["rm", "-f", containerName], { timeout: 30_000 }); } catch { /* ignore */ }
    try { rmSync(volumeDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  it("builds image, starts container, and serves / with prod config", { timeout: 180_000 }, async () => {
    // 1. Build image
    const build = spawnSync("docker", ["build", "-t", imageTag, "."], {
      cwd: root,
      timeout: 120_000,
      encoding: "utf-8",
    });

    if (build.status !== 0) {
      const tail = (build.stderr || build.stdout || "").split("\n").slice(-30).join("\n");
      throw new Error(`docker build failed (exit ${build.status}):\n${tail}`);
    }

    // 2. Run container
    const run = spawnSync("docker", [
      "run",
      "--rm",
      "-d",
      "--name", containerName,
      "-e", "PORT=3000",
      "-v", `${volumeDir}:/data`,
      "-p", `${hostPort}:3000`,
      imageTag,
    ], {
      cwd: root,
      timeout: 30_000,
      encoding: "utf-8",
    });

    if (run.status !== 0) {
      const tail = (run.stderr || run.stdout || "").split("\n").slice(-20).join("\n");
      throw new Error(`docker run failed (exit ${run.status}):\n${tail}`);
    }

    // 3. Wait for server to start (poll)
    let responded = false;
    let lastStatus = 0;
    const deadline = Date.now() + 60_000;

    while (Date.now() < deadline) {
      try {
        const res = await fetch(baseUrl, { signal: AbortSignal.timeout(2000) });
        lastStatus = res.status;
        if (res.status === 200) {
          const body = await res.text();
          expect(body).toContain("PDF Tools");
          responded = true;
          break;
        }
      } catch {
        // Server not ready yet
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    expect(responded, `Server did not respond 200 on ${baseUrl} within 60s (last status: ${lastStatus})`).toBe(true);
  });
});

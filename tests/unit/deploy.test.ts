import { describe, it, expect, beforeEach } from "vitest";
import { main, type DeployExecutor, type DeployEnv } from "../../scripts/deploy";

class FakeExecutor implements DeployExecutor {
  dotenvContent: Record<string, string> = {};
  shellEnv: Record<string, string | undefined> = {};
  gitShaValue = "abc123def456";
  dockerBuildCalls: string[] = [];
  dockerBuildError: Error | null = null;

  portainerStacks: { Id: number; Name: string }[] = [];
  portainerListCalls: DeployEnv[] = [];
  portainerListError: Error | null = null;

  portainerGetStackResult: { Id: number; Name: string; StackFileContent: string } = {
    Id: 0,
    Name: "",
    StackFileContent: "",
  };
  portainerGetStackCalls: { env: DeployEnv; id: number }[] = [];
  portainerGetStackError: Error | null = null;

  portainerCreateCalls: { env: DeployEnv; composeYaml: string }[] = [];
  portainerCreateError: Error | null = null;
  portainerCreateResult = 99;

  portainerRemoveCalls: { env: DeployEnv; id: number }[] = [];
  portainerRemoveError: Error | null = null;

  portainerUpdateCalls: { env: DeployEnv; id: number; composeYaml: string }[] = [];
  portainerUpdateError: Error | null = null;

  smokeCheckCalls: { url: string; timeoutMs: number }[] = [];
  smokeCheckResult = true;

  traefikBackupCalls: string[] = [];
  traefikBackupResult = "/tmp/fake-backup.yml.bak.123";
  traefikBackupError: Error | null = null;

  traefikWriteCalls: { path: string; content: string }[] = [];
  traefikWriteError: Error | null = null;

  traefikRestartCalls = 0;
  traefikRestartError: Error | null = null;

  traefikRestoreFromBackupCalls: { backupPath: string; destPath: string }[] = [];
  traefikRestoreFromBackupError: Error | null = null;

  traefikSmokeCheckCalls: { url: string; timeoutMs: number }[] = [];
  traefikSmokeCheckResult = true;

  readDotenv(_path: string): Record<string, string> {
    return { ...this.dotenvContent };
  }

  getEnv(): Record<string, string | undefined> {
    return { ...this.shellEnv };
  }

  gitSha(): string {
    return this.gitShaValue;
  }

  dockerBuild(sha: string): void {
    this.dockerBuildCalls.push(sha);
    if (this.dockerBuildError) throw this.dockerBuildError;
  }

  async portainerList(env: DeployEnv): Promise<{ Id: number; Name: string }[]> {
    this.portainerListCalls.push(env);
    if (this.portainerListError) throw this.portainerListError;
    return [...this.portainerStacks];
  }

  async portainerGetStack(
    env: DeployEnv,
    id: number,
  ): Promise<{ Id: number; Name: string; StackFileContent: string }> {
    this.portainerGetStackCalls.push({ env, id });
    if (this.portainerGetStackError) throw this.portainerGetStackError;
    return { ...this.portainerGetStackResult };
  }

  async portainerCreate(env: DeployEnv, composeYaml: string): Promise<number> {
    this.portainerCreateCalls.push({ env, composeYaml });
    if (this.portainerCreateError) throw this.portainerCreateError;
    return this.portainerCreateResult;
  }

  async portainerRemove(env: DeployEnv, id: number): Promise<void> {
    this.portainerRemoveCalls.push({ env, id });
    if (this.portainerRemoveError) throw this.portainerRemoveError;
  }

  async portainerUpdate(
    env: DeployEnv,
    id: number,
    composeYaml: string,
  ): Promise<void> {
    this.portainerUpdateCalls.push({ env, id, composeYaml });
    if (this.portainerUpdateError) throw this.portainerUpdateError;
  }

  async smokeCheck(url: string, timeoutMs: number): Promise<boolean> {
    this.smokeCheckCalls.push({ url, timeoutMs });
    return this.smokeCheckResult;
  }

  async traefikBackupConfig(path: string): Promise<string> {
    this.traefikBackupCalls.push(path);
    if (this.traefikBackupError) throw this.traefikBackupError;
    return this.traefikBackupResult;
  }

  async traefikWriteConfig(path: string, content: string): Promise<void> {
    this.traefikWriteCalls.push({ path, content });
    if (this.traefikWriteError) throw this.traefikWriteError;
  }

  async traefikRestart(): Promise<void> {
    this.traefikRestartCalls++;
    if (this.traefikRestartError) {
      const err = this.traefikRestartError;
      this.traefikRestartError = null;
      throw err;
    }
  }

  async traefikRestoreFromBackup(
    backupPath: string,
    destPath: string,
  ): Promise<void> {
    this.traefikRestoreFromBackupCalls.push({ backupPath, destPath });
    if (this.traefikRestoreFromBackupError) throw this.traefikRestoreFromBackupError;
  }

  async traefikSmokeCheck(
    url: string,
    timeoutMs: number,
  ): Promise<boolean> {
    this.traefikSmokeCheckCalls.push({ url, timeoutMs });
    return this.traefikSmokeCheckResult;
  }
}

describe("deploy script", () => {
  let executor: FakeExecutor;

  beforeEach(() => {
    executor = new FakeExecutor();
    executor.dotenvContent = { PORTAINER_API_KEY: "fake-key" };
  });

  it("loads dotenv overlay with shell winning", async () => {
    executor.dotenvContent = {
      PORTAINER_API_KEY: "dotenv-key",
      STACK_NAME: "dotenv-stack",
    };
    executor.shellEnv = { STACK_NAME: "shell-stack" };

    await main(executor);

    expect(executor.portainerListCalls).toHaveLength(1);
    expect(executor.portainerListCalls[0].stackName).toBe("shell-stack");
  });

  it("throws when PORTAINER_API_KEY is missing", async () => {
    executor.dotenvContent = {};
    executor.shellEnv = {};

    await expect(main(executor)).rejects.toThrow("PORTAINER_API_KEY");
  });

  it("throws when PORTAINER_API_KEY is empty string", async () => {
    executor.dotenvContent = { PORTAINER_API_KEY: "" };

    await expect(main(executor)).rejects.toThrow("PORTAINER_API_KEY");
  });

  it("uses git SHA and calls dockerBuild", async () => {
    executor.gitShaValue = "deadbeef123";

    await main(executor);

    expect(executor.dockerBuildCalls).toEqual(["deadbeef123"]);
  });

  it("compose yaml contains immutable image tag with SHA", async () => {
    executor.gitShaValue = "abc123";

    await main(executor);

    expect(executor.portainerCreateCalls).toHaveLength(1);
    expect(executor.portainerCreateCalls[0].composeYaml).toMatch(
      /image:\s*dag-tools:abc123/,
    );
  });

  it("compose yaml has correct port, volume, and env vars", async () => {
    await main(executor);

    const yaml = executor.portainerCreateCalls[0].composeYaml;
    expect(yaml).toContain('"3010:3000"');
    expect(yaml).toContain("/home/charizard10/dag-tools-data:/data");
    expect(yaml).toMatch(/PORT\s*=\s*3000/);
    expect(yaml).toMatch(/DB_PATH\s*=\s*\/data\/dag-tools\.db/);
    expect(yaml).toMatch(/STORAGE_DIR\s*=\s*\/data\/storage/);
  });

  it("creates stack when not found in Portainer list", async () => {
    executor.portainerStacks = [];

    await main(executor);

    expect(executor.portainerCreateCalls).toHaveLength(1);
    expect(executor.portainerUpdateCalls).toHaveLength(0);
  });

  it("updates stack when found by name (case-insensitive)", async () => {
    executor.portainerStacks = [{ Id: 42, Name: "DAG-TOOLS" }];

    await main(executor);

    expect(executor.portainerUpdateCalls).toHaveLength(1);
    expect(executor.portainerUpdateCalls[0].id).toBe(42);
    expect(executor.portainerCreateCalls).toHaveLength(0);
  });

  it("updates stack when found by exact name", async () => {
    executor.portainerStacks = [{ Id: 7, Name: "dag-tools" }];

    await main(executor);

    expect(executor.portainerUpdateCalls).toHaveLength(1);
    expect(executor.portainerUpdateCalls[0].id).toBe(7);
  });

  it("smoke check failure throws", async () => {
    executor.smokeCheckResult = false;

    await expect(main(executor)).rejects.toThrow(/LOCAL_SMOKE_FAILED/);
  });

  it("full happy path succeeds", async () => {
    await expect(main(executor)).resolves.toBeUndefined();

    expect(executor.dockerBuildCalls).toHaveLength(1);
    expect(executor.portainerListCalls).toHaveLength(1);
    expect(executor.portainerCreateCalls).toHaveLength(1);
    expect(executor.smokeCheckCalls).toHaveLength(1);
    expect(executor.smokeCheckCalls[0].url).toBe("http://127.0.0.1:3010/");
    expect(executor.smokeCheckCalls[0].timeoutMs).toBe(30000);
  });

  it("fails fast when docker build fails", async () => {
    executor.dockerBuildError = new Error("build failed");

    await expect(main(executor)).rejects.toThrow(/DOCKER_BUILD_FAILED/);
    expect(executor.portainerListCalls).toHaveLength(0);
  });

  it("fails fast when Portainer create returns error", async () => {
    executor.portainerCreateError = new Error("Portainer 500");

    await expect(main(executor)).rejects.toThrow(/PORTAINER_API_FAILED/);
  });

  it("fails fast when Portainer update returns error", async () => {
    executor.portainerStacks = [{ Id: 1, Name: "dag-tools" }];
    executor.portainerUpdateError = new Error("Portainer 500");

    await expect(main(executor)).rejects.toThrow(/PORTAINER_API_FAILED/);
  });

  it("uses defaults when env vars not set", async () => {
    await main(executor);

    const env = executor.portainerListCalls[0];
    expect(env.portainerUrl).toBe("https://localhost:9443");
    expect(env.portainerEndpointId).toBe(1);
    expect(env.stackName).toBe("dag-tools");
  });

  it("respects overridden defaults from shell env", async () => {
    executor.shellEnv = {
      PORTAINER_API_KEY: "key",
      PORTAINER_URL: "https://custom:1234",
      PORTAINER_ENDPOINT_ID: "5",
      STACK_NAME: "custom-stack",
    };

    await main(executor);

    const env = executor.portainerListCalls[0];
    expect(env.portainerUrl).toBe("https://custom:1234");
    expect(env.portainerEndpointId).toBe(5);
    expect(env.stackName).toBe("custom-stack");
  });

  // ── Traefik stage ──────────────────────────────────────────────────────

  it("traefik stage runs after portainer smoke check succeeds", async () => {
    await main(executor);

    // Traefik backup must have been called
    expect(executor.traefikBackupCalls).toHaveLength(1);
    expect(executor.traefikBackupCalls[0]).toBe(
      "/home/charizard10/traefik/dynamic.yml",
    );

    // Traefik write must have been called
    expect(executor.traefikWriteCalls).toHaveLength(1);

    // Traefik restart must have been called
    expect(executor.traefikRestartCalls).toBe(1);

    // Traefik smoke check must have been called
    expect(executor.traefikSmokeCheckCalls).toHaveLength(1);
    expect(executor.traefikSmokeCheckCalls[0].url).toBe(
      "https://tools.local.dagdappshub.com/",
    );
  });

  it("traefik write contains correct dag-tools block", async () => {
    await main(executor);

    expect(executor.traefikWriteCalls).toHaveLength(1);
    const { content } = executor.traefikWriteCalls[0];

    expect(content).toContain("tools.local.dagdappshub.com");
    expect(content).toContain("websecure");
    expect(content).toContain("cloudflare");
    expect(content).toContain("192.168.4.21:3010");
    expect(content).toContain("# >>> dag-tools >>>");
    expect(content).toContain("# <<< dag-tools <<<");
  });

  it("traefik smoke failure throws", async () => {
    executor.traefikSmokeCheckResult = false;

    await expect(main(executor)).rejects.toThrow(/PUBLIC_SMOKE_FAILED/);
  });

  it("traefik backup called before write", async () => {
    // We need to track call order. FakeExecutor arrays preserve insertion.
    // Instead, use a flag approach.
    let backupCalled = false;
    const origBackup = executor.traefikBackupConfig.bind(executor);
    executor.traefikBackupConfig = async (path: string) => {
      backupCalled = true;
      return origBackup(path);
    };

    await main(executor);

    expect(executor.traefikWriteCalls).toHaveLength(1);
    expect(backupCalled).toBe(true);
  });

  it("traefik stage uses custom env vars when set", async () => {
    executor.shellEnv = {
      PORTAINER_API_KEY: "key",
      TRAEFIK_CONFIG_PATH: "/custom/traefik/dynamic.yml",
      TRAEFIK_SMOKE_URL: "https://custom.smoke.local/",
    };

    await main(executor);

    expect(executor.traefikBackupCalls[0]).toBe(
      "/custom/traefik/dynamic.yml",
    );
    expect(executor.traefikSmokeCheckCalls[0].url).toBe(
      "https://custom.smoke.local/",
    );
  });

  it("traefik stage skipped when portainer smoke check fails", async () => {
    executor.smokeCheckResult = false;

    await expect(main(executor)).rejects.toThrow(/LOCAL_SMOKE_FAILED/);

    expect(executor.traefikBackupCalls).toHaveLength(0);
    expect(executor.traefikWriteCalls).toHaveLength(0);
    expect(executor.traefikRestartCalls).toBe(0);
    expect(executor.traefikSmokeCheckCalls).toHaveLength(0);
  });

  // ── Rollback tests ────────────────────────────────────────────────────

  it("first deploy: smoke check failure removes the new stack", async () => {
    executor.portainerStacks = []; // first deploy
    executor.portainerCreateResult = 10;
    executor.smokeCheckResult = false;

    await expect(main(executor)).rejects.toThrow(/LOCAL_SMOKE_FAILED/);

    expect(executor.portainerRemoveCalls).toHaveLength(1);
    expect(executor.portainerRemoveCalls[0].id).toBe(10);
  });

  it("first deploy: Portainer create failure does not call remove", async () => {
    executor.portainerStacks = [];
    executor.portainerCreateError = new Error("create failed");

    await expect(main(executor)).rejects.toThrow(/PORTAINER_API_FAILED/);

    expect(executor.portainerRemoveCalls).toHaveLength(0);
  });

  it("later deploy: failure restores previous stack definition", async () => {
    executor.portainerStacks = [{ Id: 42, Name: "dag-tools" }];
    executor.portainerGetStackResult = {
      Id: 42,
      Name: "dag-tools",
      StackFileContent: "image: dag-tools:oldsha\nports:\n  - \"3010:3000\"",
    };
    executor.smokeCheckResult = false;

    await expect(main(executor)).rejects.toThrow(/LOCAL_SMOKE_FAILED/);

    // Two update calls: first the deploy, then the restore
    expect(executor.portainerUpdateCalls).toHaveLength(2);
    expect(executor.portainerUpdateCalls[0].id).toBe(42); // deploy
    expect(executor.portainerUpdateCalls[1].id).toBe(42); // restore
  });

  it("later deploy: restore uses captured previous compose yaml", async () => {
    const previousYaml =
      "image: dag-tools:oldsha\nports:\n  - \"3010:3000\"";
    executor.portainerStacks = [{ Id: 42, Name: "dag-tools" }];
    executor.portainerGetStackResult = {
      Id: 42,
      Name: "dag-tools",
      StackFileContent: previousYaml,
    };
    executor.smokeCheckResult = false;

    await expect(main(executor)).rejects.toThrow(/LOCAL_SMOKE_FAILED/);

    // The restore update must use the captured compose yaml
    const restoreCall = executor.portainerUpdateCalls[1];
    expect(restoreCall.composeYaml).toBe(previousYaml);
  });

  it("later deploy: restore preserves previous image tag", async () => {
    executor.portainerStacks = [{ Id: 7, Name: "dag-tools" }];
    executor.portainerGetStackResult = {
      Id: 7,
      Name: "dag-tools",
      StackFileContent:
        "version: \"3.8\"\nservices:\n  dag-tools:\n    image: dag-tools:def456",
    };
    executor.smokeCheckResult = false;

    await expect(main(executor)).rejects.toThrow(/LOCAL_SMOKE_FAILED/);

    const restoreYaml = executor.portainerUpdateCalls[1].composeYaml;
    expect(restoreYaml).toContain("image: dag-tools:def456");
    // Must NOT contain the new SHA
    expect(restoreYaml).not.toContain(`dag-tools:${executor.gitShaValue}`);
  });

  it("traefik restart failure restores config from backup and restarts", async () => {
    executor.traefikRestartError = new Error("restart failed");

    await expect(main(executor)).rejects.toThrow(/TRAEFIK_RESTART_FAILED/);

    // Backup was captured
    expect(executor.traefikBackupCalls).toHaveLength(1);
    // Restore was called with the backup path and config path
    expect(executor.traefikRestoreFromBackupCalls).toHaveLength(1);
    expect(executor.traefikRestoreFromBackupCalls[0].backupPath).toBe(
      executor.traefikBackupResult,
    );
    expect(executor.traefikRestoreFromBackupCalls[0].destPath).toBe(
      "/home/charizard10/traefik/dynamic.yml",
    );
    // traefikRestart called twice (original + rollback)
    expect(executor.traefikRestartCalls).toBe(2);
  });

  it("public smoke check failure restores traefik backup and restarts", async () => {
    executor.traefikSmokeCheckResult = false;

    await expect(main(executor)).rejects.toThrow(/PUBLIC_SMOKE_FAILED/);

    // Restore was called
    expect(executor.traefikRestoreFromBackupCalls).toHaveLength(1);
    // traefikRestart called twice (original + rollback)
    expect(executor.traefikRestartCalls).toBe(2);
  });

  it("rollback failure logs both primary and rollback errors", async () => {
    executor.portainerStacks = []; // first deploy
    executor.portainerCreateResult = 10;
    executor.smokeCheckResult = false;
    executor.portainerRemoveError = new Error("remove failed");

    await expect(main(executor)).rejects.toThrow(/LOCAL_SMOKE_FAILED/);
    await expect(main(executor)).rejects.toThrow(/ROLLBACK_PORT_REMOVE/);
  });

  it("success path never triggers rollback", async () => {
    await expect(main(executor)).resolves.toBeUndefined();

    // No rollback should have occurred on success
    expect(executor.portainerRemoveCalls).toHaveLength(0);
    expect(executor.traefikRestoreFromBackupCalls).toHaveLength(0);
  });

  it("distinguishes docker build failure from portainer failure", async () => {
    // Docker build failure has dedicated prefix
    executor.dockerBuildError = new Error("build kaputt");
    await expect(main(executor)).rejects.toThrow(/DOCKER_BUILD_FAILED/);

    // Reset and simulate portainer failure
    const exec2 = new FakeExecutor();
    exec2.dotenvContent = { PORTAINER_API_KEY: "key" };
    exec2.portainerListError = new Error("list kaputt");
    await expect(main(exec2)).rejects.toThrow(/PORTAINER_API_FAILED/);
  });
});

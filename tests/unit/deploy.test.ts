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

  portainerCreateCalls: { env: DeployEnv; composeYaml: string }[] = [];
  portainerCreateError: Error | null = null;

  portainerUpdateCalls: { env: DeployEnv; id: number; composeYaml: string }[] = [];
  portainerUpdateError: Error | null = null;

  smokeCheckCalls: { url: string; timeoutMs: number }[] = [];
  smokeCheckResult = true;

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

  async portainerCreate(env: DeployEnv, composeYaml: string): Promise<void> {
    this.portainerCreateCalls.push({ env, composeYaml });
    if (this.portainerCreateError) throw this.portainerCreateError;
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

    await expect(main(executor)).rejects.toThrow("Smoke check");
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

    await expect(main(executor)).rejects.toThrow("build failed");
    expect(executor.portainerListCalls).toHaveLength(0);
  });

  it("fails fast when Portainer create returns error", async () => {
    executor.portainerCreateError = new Error("Portainer 500");

    await expect(main(executor)).rejects.toThrow("Portainer 500");
  });

  it("fails fast when Portainer update returns error", async () => {
    executor.portainerStacks = [{ Id: 1, Name: "dag-tools" }];
    executor.portainerUpdateError = new Error("Portainer 500");

    await expect(main(executor)).rejects.toThrow("Portainer 500");
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
});

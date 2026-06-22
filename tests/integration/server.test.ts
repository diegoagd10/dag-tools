import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { createApp } from "@/server/app";
import { initDb } from "@/server/db";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Home route", () => {
  let db: ReturnType<typeof Database>;
  let storageDir: string;

  beforeAll(() => {
    db = new Database(":memory:");
    initDb(db);
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-test-"));
  });

  afterAll(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("returns 200 with both tool cards (PDF Combine and PDF Split) on /", async () => {
    const app = createApp({ db, storageDir });
    const res = await app.request("/");

    expect(res.status).toBe(200);

    const text = await res.text();
    expect(text).toContain("PDF Combine");
    expect(text).toContain("PDF Split");
  });

  it("returns HTML content type", async () => {
    const app = createApp({ db, storageDir });
    const res = await app.request("/");

    expect(res.headers.get("content-type")).toContain("text/html");
  });
});

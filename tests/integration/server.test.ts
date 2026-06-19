import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "@/server/app";
import { openDatabase, artifactsTableExists } from "@/server/db";
import { createStorage } from "@/server/storage";
import type { DB } from "@/server/db";
import type { Storage } from "@/server/storage";

describe("Hono backend foundation", () => {
  let db: DB;
  let storage: Storage;
  let storageDir: string;

  beforeEach(() => {
    db = openDatabase(":memory:");
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-storage-"));
    storage = createStorage(storageDir);
  });

  afterEach(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  describe("GET /api/v1/ping", () => {
    it("returns 200 with { status: 'ok' }", async () => {
      const app = createApp({ db });

      const res = await app.request("/api/v1/ping");

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: "ok" });
    });
  });

  describe("artifacts table", () => {
    it("exists after the database is opened", () => {
      expect(artifactsTableExists(db)).toBe(true);
    });
  });

  describe("storage", () => {
    it("writes and reads an artifact back as the same bytes", async () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5]);

      await storage.write("abc123", "pdf", bytes);
      const read = await storage.read("abc123", "pdf");

      expect([...read]).toEqual([...bytes]);
    });
  });
});

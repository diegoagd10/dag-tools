import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initDb } from "@/server/db";

describe("initDb", () => {
  it("creates the artifacts table with all required columns", () => {
    const db = new Database(":memory:");
    initDb(db);

    const columns = db
      .prepare("PRAGMA table_info(artifacts)")
      .all() as Array<{ name: string }>;
    const columnNames = columns.map((c) => c.name).sort();

    const expected = [
      "id",
      "tool",
      "filename",
      "mime_type",
      "ext",
      "size",
      "page_count",
      "text_content",
      "created_at",
      "expires_at",
      "creator_token",
    ].sort();

    expect(columnNames).toEqual(expected);
    db.close();
  });

  it("idempotently creates the artifacts table without error on second call", () => {
    const db = new Database(":memory:");
    initDb(db);
    // Should not throw on second call (CREATE TABLE IF NOT EXISTS)
    expect(() => initDb(db)).not.toThrow();
    db.close();
  });

  it("enables WAL mode on file-based databases", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "dag-tools-test-"));
    const dbPath = join(tmpDir, "test.db");
    const db = new Database(dbPath);

    initDb(db);

    const [row] = db.pragma("journal_mode") as Array<{ journal_mode: string }>;
    expect(row.journal_mode).toBe("wal");

    db.close();
    rmSync(tmpDir, { recursive: true, force: true });
  });
});

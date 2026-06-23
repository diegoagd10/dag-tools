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

  it("migrates old-style NOT NULL file columns to nullable", () => {
    const db = new Database(":memory:");

    // Create table with old NOT NULL constraints (simulating pre-migration schema)
    db.exec(`
      CREATE TABLE artifacts (
        id TEXT PRIMARY KEY,
        tool TEXT NOT NULL,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        ext TEXT NOT NULL,
        size INTEGER NOT NULL,
        page_count INTEGER,
        text_content TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT,
        creator_token TEXT
      )
    `);

    // initDb should detect old constraints and migrate
    initDb(db);

    // After migration, file columns should be nullable
    const cols = db
      .prepare("PRAGMA table_info(artifacts)")
      .all() as Array<{ name: string; notnull: number }>;

    for (const col of cols) {
      if (["filename", "mime_type", "ext", "size"].includes(col.name)) {
        expect(col.notnull).toBe(0);
      }
    }

    // Should be able to insert a text-only artifact with NULL file columns
    expect(() =>
      db
        .prepare("INSERT INTO artifacts (id, tool, text_content) VALUES (?, ?, ?)")
        .run("migrated-id", "links/qr", "test content"),
    ).not.toThrow();

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

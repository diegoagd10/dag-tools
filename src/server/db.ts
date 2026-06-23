import type Database from "better-sqlite3";

export function initDb(db: Database.Database): void {
  db.exec("PRAGMA journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      tool TEXT NOT NULL,
      filename TEXT,
      mime_type TEXT,
      ext TEXT,
      size INTEGER,
      page_count INTEGER,
      text_content TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT,
      creator_token TEXT
    )
  `);
}

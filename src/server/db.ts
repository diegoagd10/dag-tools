import type Database from "better-sqlite3";

export function initDb(db: Database.Database): void {
  db.exec("PRAGMA journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS artifacts (
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
}

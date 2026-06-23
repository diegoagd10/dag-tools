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

  // Migration: relax NOT NULL on file-artifact columns for text-only (Link Tool) artifacts.
  // CREATE TABLE IF NOT EXISTS won't alter an existing table, so we must migrate in-place.
  const tableInfo = db
    .prepare("PRAGMA table_info(artifacts)")
    .all() as Array<{ name: string; notnull: number }>;

  const needsMigration = tableInfo.some(
    (col) =>
      ["filename", "mime_type", "ext", "size"].includes(col.name) &&
      col.notnull === 1,
  );

  if (needsMigration) {
    db.exec(`
      CREATE TABLE artifacts_new (
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
      );
      INSERT INTO artifacts_new SELECT * FROM artifacts;
      DROP TABLE artifacts;
      ALTER TABLE artifacts_new RENAME TO artifacts;
    `);
  }
}

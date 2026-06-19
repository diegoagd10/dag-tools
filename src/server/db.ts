import Database from "better-sqlite3";

export type DB = InstanceType<typeof Database>;

const ARTIFACTS_SCHEMA = `
CREATE TABLE IF NOT EXISTS artifacts (
  id            TEXT    PRIMARY KEY,
  "group"       TEXT    NOT NULL,
  tool          TEXT    NOT NULL,
  artifact_path TEXT,
  text_content  TEXT,
  filename      TEXT,
  mime_type     TEXT    NOT NULL,
  byte_size     INTEGER,
  page_count    INTEGER,
  created_at    INTEGER NOT NULL,
  expires_at    INTEGER,
  creator_token TEXT
);
`;

export function openDatabase(path: string): DB {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.exec(ARTIFACTS_SCHEMA);
  return db;
}

export function artifactsTableExists(db: DB): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'artifacts'")
    .get() as { name: string } | undefined;
  return row?.name === "artifacts";
}

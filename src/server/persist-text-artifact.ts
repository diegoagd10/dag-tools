import type Database from "better-sqlite3";
import { newShareId } from "./share-id";

export type PersistTextArtifactInput = {
  tool: string;
  textContent: string;
};

export type PersistTextArtifactResult = {
  id: string;
};

export function persistTextArtifact(
  db: Database.Database,
  input: PersistTextArtifactInput,
): PersistTextArtifactResult {
  const id = newShareId();

  db.prepare(`
    INSERT INTO artifacts (id, tool, text_content)
    VALUES (?, ?, ?)
  `).run(id, input.tool, input.textContent);

  return { id };
}

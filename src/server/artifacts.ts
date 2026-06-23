import type Database from "better-sqlite3";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { newShareId } from "./share-id";

export type PersistArtifactInput = {
  tool: string;
  filename: string;
  mimeType: string;
  ext: string;
  size: number;
  pageCount?: number;
};

export type PersistArtifactResult = {
  id: string;
};

export function persistArtifact(
  db: Database.Database,
  storageDir: string,
  input: PersistArtifactInput,
  blob: Uint8Array,
): PersistArtifactResult {
  const id = newShareId();

  // Write blob to disk
  const filePath = join(storageDir, `${id}.${input.ext}`);
  writeFileSync(filePath, blob);

  // Insert row into artifacts table
  db.prepare(`
    INSERT INTO artifacts (id, tool, filename, mime_type, ext, size, page_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.tool,
    input.filename,
    input.mimeType,
    input.ext,
    input.size,
    input.pageCount ?? null,
  );

  return { id };
}

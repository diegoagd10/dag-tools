import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initDb } from "@/server/db";
import { persistArtifact } from "@/server/artifacts";

describe("persistArtifact", () => {
  let db: ReturnType<typeof Database>;
  let storageDir: string;

  beforeAll(() => {
    db = new Database(":memory:");
    initDb(db);
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-artifacts-"));
  });

  afterAll(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("inserts a row into artifacts table with correct values", () => {
    const blob = new Uint8Array([1, 2, 3, 4]);
    const result = persistArtifact(db, storageDir, {
      tool: "pdf-combine",
      filename: "combined-2026-06-22.pdf",
      mimeType: "application/pdf",
      ext: "pdf",
      size: blob.length,
      pageCount: 3,
    }, blob);

    expect(result.id).toHaveLength(12);

    const row = db.prepare("SELECT * FROM artifacts WHERE id = ?").get(result.id) as Record<string, unknown>;
    expect(row).toBeTruthy();
    expect(row.tool).toBe("pdf-combine");
    expect(row.filename).toBe("combined-2026-06-22.pdf");
    expect(row.mime_type).toBe("application/pdf");
    expect(row.ext).toBe("pdf");
    expect(row.size).toBe(4);
    expect(row.page_count).toBe(3);
    expect(row.created_at).toBeTruthy();
    expect(row.expires_at).toBeNull();
    expect(row.creator_token).toBeNull();
    expect(row.text_content).toBeNull();
  });

  it("writes the blob to disk at <storageDir>/<id>.<ext>", () => {
    const blob = new Uint8Array([5, 6, 7, 8, 9]);
    const result = persistArtifact(db, storageDir, {
      tool: "pdf-combine",
      filename: "combined-2026-06-22.pdf",
      mimeType: "application/pdf",
      ext: "pdf",
      size: blob.length,
    }, blob);

    const filePath = join(storageDir, `${result.id}.pdf`);
    expect(existsSync(filePath)).toBe(true);

    const disk = new Uint8Array(readFileSync(filePath));
    expect(disk).toEqual(blob);
  });
});

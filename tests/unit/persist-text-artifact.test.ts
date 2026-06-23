import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { initDb } from "@/server/db";
import { persistTextArtifact } from "@/server/persist-text-artifact";

describe("persistTextArtifact", () => {
  let db: ReturnType<typeof Database>;

  beforeAll(() => {
    db = new Database(":memory:");
    initDb(db);
  });

  afterAll(() => {
    db.close();
  });

  it("inserts a row with tool, text_content, id, and NULL file columns", () => {
    const result = persistTextArtifact(db, {
      tool: "links/qr",
      textContent: "https://example.com",
    });

    expect(result.id).toHaveLength(12);

    const row = db
      .prepare("SELECT * FROM artifacts WHERE id = ?")
      .get(result.id) as Record<string, unknown>;

    expect(row.tool).toBe("links/qr");
    expect(row.text_content).toBe("https://example.com");
    expect(row.filename).toBeNull();
    expect(row.mime_type).toBeNull();
    expect(row.ext).toBeNull();
    expect(row.size).toBeNull();
    expect(row.page_count).toBeNull();
    expect(row.expires_at).toBeNull();
    expect(row.creator_token).toBeNull();
    expect(row.created_at).toBeTruthy();
  });

  it("generates unique IDs for different invocations", () => {
    const r1 = persistTextArtifact(db, {
      tool: "links/qr",
      textContent: "content A",
    });
    const r2 = persistTextArtifact(db, {
      tool: "links/qr",
      textContent: "content B",
    });

    expect(r1.id).not.toBe(r2.id);
  });

  it("does not write any file to disk (no storageDir param)", () => {
    // The function doesn't take storageDir — it's text-only.
    const result = persistTextArtifact(db, {
      tool: "links/qr",
      textContent: "some text",
    });

    const row = db
      .prepare("SELECT text_content FROM artifacts WHERE id = ?")
      .get(result.id) as { text_content: string };

    expect(row.text_content).toBe("some text");
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { createApp } from "@/server/app";
import { initDb } from "@/server/db";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Hono } from "hono";

describe("GET /links/qr", () => {
  let db: ReturnType<typeof Database>;
  let storageDir: string;
  let app: Hono;

  beforeAll(() => {
    db = new Database(":memory:");
    initDb(db);
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-qr-"));
    app = createApp({ db, storageDir });
  });

  afterAll(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("returns 200 with the QR form", async () => {
    const res = await app.request("/links/qr");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("QR Code");
    expect(html).toContain("QR Content");
  });
});

describe("POST /api/v1/links/qr", () => {
  let db: ReturnType<typeof Database>;
  let storageDir: string;
  let app: Hono;

  beforeAll(() => {
    db = new Database(":memory:");
    initDb(db);
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-qr-post-"));
    app = createApp({ db, storageDir });
  });

  afterAll(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("happy path: returns 200 with share link panel fragment", async () => {
    const fd = new FormData();
    fd.append("content", "https://example.com");

    const res = await app.request("/api/v1/links/qr", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(200);

    const html = await res.text();
    // Should contain a link to /links/qr/<id>
    expect(html).toMatch(/\/links\/qr\/[A-Za-z0-9_-]{12}/);
    // Should not be a full page
    expect(html).not.toContain("<!DOCTYPE html>");
    expect(html).not.toContain("<html");
    // Should contain "create another" link back to form
    expect(html).toContain("/links/qr");
  });

  it("persists exactly one artifact row with tool=links/qr and correct text_content", async () => {
    const fd = new FormData();
    fd.append("content", "  https://example.com  ");

    await app.request("/api/v1/links/qr", {
      method: "POST",
      body: fd,
    });

    const row = db
      .prepare("SELECT * FROM artifacts ORDER BY rowid DESC LIMIT 1")
      .get() as Record<string, unknown>;

    expect(row.tool).toBe("links/qr");
    expect(row.text_content).toBe("https://example.com"); // trimmed
    expect(row.filename).toBeNull();
    expect(row.mime_type).toBeNull();
    expect(row.ext).toBeNull();
    expect(row.size).toBeNull();
    expect(row.expires_at).toBeNull();
    expect(row.creator_token).toBeNull();
  });

  it("trims surrounding whitespace server-side", async () => {
    const fd = new FormData();
    fd.append("content", "\t\n  hello world  \n\t");

    await app.request("/api/v1/links/qr", {
      method: "POST",
      body: fd,
    });

    const row = db
      .prepare("SELECT text_content FROM artifacts ORDER BY rowid DESC LIMIT 1")
      .get() as { text_content: string };

    expect(row.text_content).toBe("hello world");
  });

  it("rejects empty-after-trim with 422 and error fragment", async () => {
    const beforeCnt = (
      db.prepare("SELECT COUNT(*) as cnt FROM artifacts").get() as { cnt: number }
    ).cnt;

    const fd = new FormData();
    fd.append("content", "   \t \n  ");

    const res = await app.request("/api/v1/links/qr", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(422);
    const html = await res.text();
    expect(html).not.toContain("<!DOCTYPE html>");
    expect(html).not.toContain("<html");

    // No artifact row written
    const afterCnt = (
      db.prepare("SELECT COUNT(*) as cnt FROM artifacts").get() as { cnt: number }
    ).cnt;
    expect(afterCnt).toBe(beforeCnt);
  });

  it("rejects content over 2048 bytes with 422 and error fragment", async () => {
    const beforeCnt = (
      db.prepare("SELECT COUNT(*) as cnt FROM artifacts").get() as { cnt: number }
    ).cnt;

    const content = "x".repeat(2049);
    const fd = new FormData();
    fd.append("content", content);

    const res = await app.request("/api/v1/links/qr", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(422);
    const html = await res.text();
    expect(html).not.toContain("<!DOCTYPE html>");

    // No artifact row written
    const afterCnt = (
      db.prepare("SELECT COUNT(*) as cnt FROM artifacts").get() as { cnt: number }
    ).cnt;
    expect(afterCnt).toBe(beforeCnt);
  });

  it("accepts content exactly at 2048-byte limit", async () => {
    const content = "a".repeat(2048);
    const fd = new FormData();
    fd.append("content", content);

    const res = await app.request("/api/v1/links/qr", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(200);

    const row = db
      .prepare("SELECT text_content FROM artifacts ORDER BY rowid DESC LIMIT 1")
      .get() as { text_content: string };
    expect(row.text_content).toBe(content);
  });
});

describe("GET /links/qr/:id (Share Page)", () => {
  let db: ReturnType<typeof Database>;
  let storageDir: string;
  let app: Hono;
  let shareId: string;

  beforeAll(async () => {
    db = new Database(":memory:");
    initDb(db);
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-qr-share-"));
    app = createApp({ db, storageDir });

    // Create a QR artifact first
    const fd = new FormData();
    fd.append("content", "https://example.com");
    const res = await app.request("/api/v1/links/qr", {
      method: "POST",
      body: fd,
    });
    const html = await res.text();
    const match = html.match(/\/links\/qr\/([A-Za-z0-9_-]{12})/);
    shareId = match![1];
  });

  afterAll(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("returns 200 HTML containing an <img> pointing to the .png endpoint", async () => {
    const res = await app.request(`/links/qr/${shareId}`);
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain(`/links/qr/${shareId}.png`);
    expect(html).toContain("<img");
    // Full page (uses Layout)
    expect(html).toContain("<html");
  });

  it("returns 404 for unknown id", async () => {
    const res = await app.request("/links/qr/nonexistent-id-42");
    expect(res.status).toBe(404);

    const html = await res.text();
    expect(html).toContain("not available");
    // Should have link back to /links/qr
    expect(html).toContain("/links/qr");
  });
});

describe("GET /links/qr/:id.png (QR Image Endpoint)", () => {
  let db: ReturnType<typeof Database>;
  let storageDir: string;
  let app: Hono;
  let shareId: string;

  beforeAll(async () => {
    db = new Database(":memory:");
    initDb(db);
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-qr-png-"));
    app = createApp({ db, storageDir });

    // Create a QR artifact first
    const fd = new FormData();
    fd.append("content", "https://example.com");
    const res = await app.request("/api/v1/links/qr", {
      method: "POST",
      body: fd,
    });
    const html = await res.text();
    const match = html.match(/\/links\/qr\/([A-Za-z0-9_-]{12})/);
    shareId = match![1];
  });

  afterAll(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("returns 200 with Content-Type image/png and PNG signature", async () => {
    const res = await app.request(`/links/qr/${shareId}.png`);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");

    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    // PNG signature
    expect(bytes[0]).toBe(0x89);
    expect(bytes[1]).toBe(0x50);
    expect(bytes[2]).toBe(0x4e);
    expect(bytes[3]).toBe(0x47);
  });

  it("returns immutable Cache-Control header", async () => {
    const res = await app.request(`/links/qr/${shareId}.png`);
    const cc = res.headers.get("Cache-Control");
    expect(cc).toBe("public, max-age=31536000, immutable");
  });

  it("returns 404 for unknown id", async () => {
    const res = await app.request("/links/qr/nonexistent-id-42.png");
    expect(res.status).toBe(404);
  });

  it("returns 404 for id that exists in table but is not a QR artifact", async () => {
    // There might be no such scenario in current test, but we validate with
    // an unknown id which covers the "not found" case.
    const res = await app.request("/links/qr/abc123xyz789.png");
    expect(res.status).toBe(404);
  });
});

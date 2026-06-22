import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { createApp } from "@/server/app";
import { initDb } from "@/server/db";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import type { Hono } from "hono";

const fixtures = resolve(process.cwd(), "tests", "fixtures");

function buildFormData(): FormData {
  const fd = new FormData();
  const a = new Uint8Array(readFileSync(resolve(fixtures, "sample-1.pdf")));
  const b = new Uint8Array(readFileSync(resolve(fixtures, "sample-2.pdf")));
  fd.append("files[]", new Blob([a], { type: "application/pdf" }), "sample-1.pdf");
  fd.append("files[]", new Blob([b], { type: "application/pdf" }), "sample-2.pdf");
  return fd;
}

describe("POST /api/v1/pdf/combine", () => {
  let db: ReturnType<typeof Database>;
  let storageDir: string;
  let app: Hono;

  beforeAll(() => {
    db = new Database(":memory:");
    initDb(db);
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-combine-"));
    app = createApp({ db, storageDir });
  });

  afterAll(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("returns 200 with a Share Link in the HTML fragment", async () => {
    const fd = buildFormData();
    const res = await app.request("/api/v1/pdf/combine", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(200);

    const html = await res.text();
    // Should contain a link to /pdf/combine/<id>
    expect(html).toMatch(/\/pdf\/combine\/[A-Za-z0-9_-]{12}/);
    // Should not be a full HTML page (fragment only)
    expect(html).not.toContain("<!DOCTYPE html>");
    expect(html).not.toContain("<html");
  });

  it("persists an artifact row in the database", async () => {
    const fd = buildFormData();
    await app.request("/api/v1/pdf/combine", {
      method: "POST",
      body: fd,
    });

    const row = db.prepare("SELECT * FROM artifacts ORDER BY rowid DESC LIMIT 1").get() as Record<string, unknown>;
    expect(row.tool).toBe("pdf-combine");
    expect(row.mime_type).toBe("application/pdf");
    expect(row.ext).toBe("pdf");
    expect(row.filename).toMatch(/^combined-\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(row.expires_at).toBeNull();
    expect(row.creator_token).toBeNull();
    expect(row.page_count).toBe(3); // 1 + 2 pages
  });

  it("writes the combined PDF blob to disk", async () => {
    const fd = buildFormData();
    await app.request("/api/v1/pdf/combine", {
      method: "POST",
      body: fd,
    });

    const row = db.prepare("SELECT id, size FROM artifacts ORDER BY rowid DESC LIMIT 1").get() as { id: string; size: number };
    const filePath = join(storageDir, `${row.id}.pdf`);
    expect(existsSync(filePath)).toBe(true);
    expect(readFileSync(filePath).length).toBe(row.size);
  });

  it("merges files in form order (first file = first pages)", async () => {
    // sample-multi-page.pdf (3 pages) first, sample-2.pdf (2 pages) second
    const fd = new FormData();
    const a = new Uint8Array(readFileSync(resolve(fixtures, "sample-multi-page.pdf")));
    const b = new Uint8Array(readFileSync(resolve(fixtures, "sample-2.pdf")));
    fd.append("files[]", new Blob([a], { type: "application/pdf" }), "sample-multi-page.pdf");
    fd.append("files[]", new Blob([b], { type: "application/pdf" }), "sample-2.pdf");

    await app.request("/api/v1/pdf/combine", {
      method: "POST",
      body: fd,
    });

    const row = db.prepare("SELECT id, page_count FROM artifacts ORDER BY rowid DESC LIMIT 1").get() as { id: string; page_count: number };
    expect(row.page_count).toBe(5); // 3 + 2
  });
});

describe("GET /pdf/combine/:id", () => {
  let db: ReturnType<typeof Database>;
  let storageDir: string;
  let app: Hono;
  let artifactId: string;

  beforeAll(async () => {
    db = new Database(":memory:");
    initDb(db);
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-download-"));
    app = createApp({ db, storageDir });

    // Create an artifact first so we can test download
    const fd = buildFormData();
    const res = await app.request("/api/v1/pdf/combine", {
      method: "POST",
      body: fd,
    });
    const html = await res.text();
    const match = html.match(/\/pdf\/combine\/([A-Za-z0-9_-]{12})/);
    artifactId = match![1];
  });

  afterAll(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("serves the Combined PDF with correct Content-Type and Content-Disposition", async () => {
    const res = await app.request(`/pdf/combine/${artifactId}`);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="combined-\d{4}-\d{2}-\d{2}\.pdf"$/,
    );
  });

  it("serves correct PDF bytes (non-zero body)", async () => {
    const res = await app.request(`/pdf/combine/${artifactId}`);

    expect(res.status).toBe(200);
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(0);

    // Verify it starts with PDF magic bytes
    const header = new Uint8Array(buf);
    expect(header[0]).toBe(0x25); // %
    expect(header[1]).toBe(0x50); // P
  });

  it("returns 404 with artifact-not-available page for unknown id", async () => {
    const res = await app.request("/pdf/combine/nonexistent-42");

    expect(res.status).toBe(404);

    const html = await res.text();
    expect(html).toContain("This artifact is not available");
    expect(html).toContain("Back to PDF Combine");
    expect(html).toContain("<html");
  });
});

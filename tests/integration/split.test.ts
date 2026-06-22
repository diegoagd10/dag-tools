import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { createApp } from "@/server/app";
import { initDb } from "@/server/db";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import type { Hono } from "hono";

const fixtures = resolve(process.cwd(), "tests", "fixtures");

function buildFormData(
  fixtureName: string,
  fieldName = "file",
): FormData {
  const buf = new Uint8Array(readFileSync(resolve(fixtures, fixtureName)));
  const fd = new FormData();
  fd.append(fieldName, new Blob([buf], { type: "application/pdf" }), fixtureName);
  return fd;
}

describe("POST /api/v1/pdf/split", () => {
  let db: ReturnType<typeof Database>;
  let storageDir: string;
  let app: Hono;

  beforeAll(() => {
    db = new Database(":memory:");
    initDb(db);
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-split-"));
    app = createApp({ db, storageDir });
  });

  afterAll(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("returns 200 with a Share Link in the HTML fragment (happy path)", async () => {
    const fd = buildFormData("sample-multi-page.pdf");
    const res = await app.request("/api/v1/pdf/split", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(200);

    const html = await res.text();
    // Should contain a link to /pdf/split/<id>
    expect(html).toMatch(/\/pdf\/split\/[A-Za-z0-9_-]{12}/);
    // Should not be a full HTML page (fragment only)
    expect(html).not.toContain("<!DOCTYPE html>");
    expect(html).not.toContain("<html");
    // Should mention split context
    expect(html).toContain("Split PDFs ready");
  });

  it("persists an artifact row in the database", async () => {
    const fd = buildFormData("sample-multi-page.pdf");
    await app.request("/api/v1/pdf/split", {
      method: "POST",
      body: fd,
    });

    const row = db.prepare("SELECT * FROM artifacts ORDER BY rowid DESC LIMIT 1").get() as Record<string, unknown>;
    expect(row.tool).toBe("pdf-split");
    expect(row.mime_type).toBe("application/zip");
    expect(row.ext).toBe("zip");
    expect(row.filename).toMatch(/^split-\d{4}-\d{2}-\d{2}\.zip$/);
    expect(row.expires_at).toBeNull();
    expect(row.creator_token).toBeNull();
    expect(row.page_count).toBe(3); // sample-multi-page.pdf has 3 pages
  });

  it("writes the split ZIP blob to disk", async () => {
    const fd = buildFormData("sample-multi-page.pdf");
    await app.request("/api/v1/pdf/split", {
      method: "POST",
      body: fd,
    });

    const row = db.prepare("SELECT id, size FROM artifacts ORDER BY rowid DESC LIMIT 1").get() as { id: string; size: number };
    const filePath = join(storageDir, `${row.id}.zip`);
    expect(existsSync(filePath)).toBe(true);
    expect(readFileSync(filePath).length).toBe(row.size);
  });

  it("produces a ZIP with one entry per page, each a valid 1-page PDF", async () => {
    const fd = buildFormData("sample-multi-page.pdf");
    const res = await app.request("/api/v1/pdf/split", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(200);

    const row = db.prepare("SELECT id FROM artifacts ORDER BY rowid DESC LIMIT 1").get() as { id: string };
    const zipBuf = readFileSync(join(storageDir, `${row.id}.zip`));
    const zip = await JSZip.loadAsync(zipBuf);
    const names = Object.keys(zip.files).sort();
    expect(names).toEqual(["page-001.pdf", "page-002.pdf", "page-003.pdf"]);

    for (const name of names) {
      const entry = await zip.file(name)!.async("uint8array");
      const doc = await PDFDocument.load(entry);
      expect(doc.getPageCount()).toBe(1);
    }
  });

  it("handles a single-page Source PDF, producing one page-001.pdf entry in the ZIP", async () => {
    const fd = buildFormData("sample-1.pdf");
    const res = await app.request("/api/v1/pdf/split", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(200);

    const row = db.prepare("SELECT id, page_count FROM artifacts ORDER BY rowid DESC LIMIT 1").get() as { id: string; page_count: number };
    expect(row.page_count).toBe(1);

    const zipBuf = readFileSync(join(storageDir, `${row.id}.zip`));
    const zip = await JSZip.loadAsync(zipBuf);
    expect(Object.keys(zip.files).sort()).toEqual(["page-001.pdf"]);
  });

  it("rejects an encrypted Source PDF with 422, inline error, and writes no artifact", async () => {
    const beforeCnt = (db.prepare("SELECT COUNT(*) as cnt FROM artifacts").get() as { cnt: number }).cnt;

    const fd = buildFormData("encrypted.pdf");
    const res = await app.request("/api/v1/pdf/split", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(422);
    const html = await res.text();
    expect(html).toContain("encrypted.pdf");
    expect(html).toContain("password-protected");
    // Fragment, not a full page
    expect(html).not.toContain("<!DOCTYPE html>");

    // No new artifact should be written
    const afterCnt = (db.prepare("SELECT COUNT(*) as cnt FROM artifacts").get() as { cnt: number }).cnt;
    expect(afterCnt).toBe(beforeCnt);
  });

  it("rejects a corrupt Source PDF with 422, inline error, and writes no artifact", async () => {
    const beforeCnt = (db.prepare("SELECT COUNT(*) as cnt FROM artifacts").get() as { cnt: number }).cnt;

    const fd = buildFormData("corrupt.pdf");
    const res = await app.request("/api/v1/pdf/split", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(422);
    const html = await res.text();
    expect(html).toContain("corrupt.pdf");
    expect(html).toContain("corrupt");
    // Fragment, not a full page
    expect(html).not.toContain("<!DOCTYPE html>");

    // No new artifact should be written
    const afterCnt = (db.prepare("SELECT COUNT(*) as cnt FROM artifacts").get() as { cnt: number }).cnt;
    expect(afterCnt).toBe(beforeCnt);
  });

  it("rejects a missing file with 422", async () => {
    const beforeCnt = (db.prepare("SELECT COUNT(*) as cnt FROM artifacts").get() as { cnt: number }).cnt;

    const fd = new FormData();
    // No file field at all
    const res = await app.request("/api/v1/pdf/split", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(422);
    const html = await res.text();
    expect(html).toContain("not a valid PDF");
    expect(html).not.toContain("<!DOCTYPE html>");

    const afterCnt = (db.prepare("SELECT COUNT(*) as cnt FROM artifacts").get() as { cnt: number }).cnt;
    expect(afterCnt).toBe(beforeCnt);
  });

  it("rejects a non-PDF file with 422 and writes no artifact", async () => {
    const beforeCnt = (db.prepare("SELECT COUNT(*) as cnt FROM artifacts").get() as { cnt: number }).cnt;

    const fd = new FormData();
    fd.append("file", new Blob(["not a pdf"], { type: "text/plain" }), "notes.txt");
    const res = await app.request("/api/v1/pdf/split", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(422);
    const html = await res.text();
    expect(html).toContain("notes.txt");
    expect(html).toContain("not a valid PDF");
    expect(html).not.toContain("<!DOCTYPE html>");

    const afterCnt = (db.prepare("SELECT COUNT(*) as cnt FROM artifacts").get() as { cnt: number }).cnt;
    expect(afterCnt).toBe(beforeCnt);
  });

  it("rejects an oversized file with 422 and writes no artifact", async () => {
    const beforeCnt = (db.prepare("SELECT COUNT(*) as cnt FROM artifacts").get() as { cnt: number }).cnt;

    // Create a blob larger than 50MB
    const buf = new Uint8Array(51 * 1024 * 1024);
    // Put minimal PDF magic bytes so it passes the magic byte check
    buf[0] = 0x25; // %
    buf[1] = 0x50; // P
    buf[2] = 0x44; // D
    buf[3] = 0x46; // F

    const fd = new FormData();
    fd.append("file", new Blob([buf], { type: "application/pdf" }), "large.pdf");
    const res = await app.request("/api/v1/pdf/split", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(422);
    const html = await res.text();
    expect(html).toContain("exceeds the 50 MB limit");

    const afterCnt = (db.prepare("SELECT COUNT(*) as cnt FROM artifacts").get() as { cnt: number }).cnt;
    expect(afterCnt).toBe(beforeCnt);
  });
});

describe("GET /pdf/split/:id", () => {
  let db: ReturnType<typeof Database>;
  let storageDir: string;
  let app: Hono;
  let artifactId: string;

  beforeAll(async () => {
    db = new Database(":memory:");
    initDb(db);
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-split-download-"));
    app = createApp({ db, storageDir });

    // Create a split artifact first
    const fd = buildFormData("sample-multi-page.pdf");
    const res = await app.request("/api/v1/pdf/split", {
      method: "POST",
      body: fd,
    });
    const html = await res.text();
    const match = html.match(/\/pdf\/split\/([A-Za-z0-9_-]{12})/);
    artifactId = match![1];
  });

  afterAll(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("serves the Split ZIP with correct Content-Type and Content-Disposition", async () => {
    const res = await app.request(`/pdf/split/${artifactId}`);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/zip");
    expect(res.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="split-\d{4}-\d{2}-\d{2}\.zip"$/,
    );
  });

  it("serves correct ZIP bytes (non-zero body)", async () => {
    const res = await app.request(`/pdf/split/${artifactId}`);

    expect(res.status).toBe(200);
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(0);

    // Verify it's a valid ZIP (starts with PK magic bytes)
    const header = new Uint8Array(buf);
    expect(header[0]).toBe(0x50); // P
    expect(header[1]).toBe(0x4b); // K
  });

  it("returns 404 with artifact-not-available page for unknown id", async () => {
    const res = await app.request("/pdf/split/nonexistent-42");

    expect(res.status).toBe(404);

    const html = await res.text();
    expect(html).toContain("This artifact is not available");
    expect(html).toContain("Back to PDF Split");
    expect(html).toContain("<html");
  });
});

describe("GET /pdf/split (form page)", () => {
  let db: ReturnType<typeof Database>;
  let storageDir: string;
  let app: Hono;

  beforeAll(() => {
    db = new Database(":memory:");
    initDb(db);
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-split-form-"));
    app = createApp({ db, storageDir });
  });

  afterAll(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("renders the Split form with file input and disabled Split button", async () => {
    const res = await app.request("/pdf/split");

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("PDF Split");
    expect(html).toContain('id="split-file-input"');
    expect(html).toContain('id="split-btn"');
    expect(html).toContain("disabled");
    expect(html).toContain("hx-post=\"/api/v1/pdf/split\"");
    expect(html).toContain("split-form.js");
  });
});

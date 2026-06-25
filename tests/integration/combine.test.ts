import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { PDFDocument } from "pdf-lib";
import { createApp } from "@/app";
import { initDb } from "@/server/db";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import type { Hono } from "hono";

const fixtures = resolve(process.cwd(), "tests", "fixtures");

/** Structural fingerprint of a PDF page, stable across serializations. */
interface PageFingerprint {
  width: number;
  height: number;
  mediaBox: { x: number; y: number; width: number; height: number };
}

function fingerprintPage(doc: PDFDocument, pageIdx: number): PageFingerprint {
  const page = doc.getPage(pageIdx);
  const { width, height } = page.getSize();
  const mb = page.getMediaBox();
  return { width, height, mediaBox: { x: mb.x, y: mb.y, width: mb.width, height: mb.height } };
}

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

  it("rejects an encrypted Source PDF with 422 and inline error naming the file", async () => {
    const beforeCnt = (db.prepare("SELECT COUNT(*) as cnt FROM artifacts").get() as { cnt: number }).cnt;

    const fd = new FormData();
    const a = new Uint8Array(readFileSync(resolve(fixtures, "sample-1.pdf")));
    const b = new Uint8Array(readFileSync(resolve(fixtures, "encrypted.pdf")));
    fd.append("files[]", new Blob([a], { type: "application/pdf" }), "sample-1.pdf");
    fd.append("files[]", new Blob([b], { type: "application/pdf" }), "encrypted.pdf");

    const res = await app.request("/api/v1/pdf/combine", {
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

  it("rejects a corrupt Source PDF with 422 and inline error naming the file", async () => {
    const beforeCnt = (db.prepare("SELECT COUNT(*) as cnt FROM artifacts").get() as { cnt: number }).cnt;

    const fd = new FormData();
    const a = new Uint8Array(readFileSync(resolve(fixtures, "sample-1.pdf")));
    const b = new Uint8Array(readFileSync(resolve(fixtures, "corrupt.pdf")));
    fd.append("files[]", new Blob([a], { type: "application/pdf" }), "sample-1.pdf");
    fd.append("files[]", new Blob([b], { type: "application/pdf" }), "corrupt.pdf");

    const res = await app.request("/api/v1/pdf/combine", {
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

  it("merges 3+ files in correct page order", async () => {
    // sample-1.pdf (1 page, portrait 595×842), sample-2.pdf (2 pages, landscape 842×595),
    // sample-multi-page.pdf (3 pages, portrait 595×842)
    // Total: 6 pages. Expected order: sample-1 pages, then sample-2 pages, then sample-multi-page pages.
    const a = new Uint8Array(readFileSync(resolve(fixtures, "sample-1.pdf")));
    const b = new Uint8Array(readFileSync(resolve(fixtures, "sample-2.pdf")));
    const c = new Uint8Array(readFileSync(resolve(fixtures, "sample-multi-page.pdf")));

    // Build expected fingerprint sequence from source files
    const expectedFingerprints: PageFingerprint[] = [];
    for (const sourceBuf of [a, b, c]) {
      const sourceDoc = await PDFDocument.load(sourceBuf);
      for (let sp = 0; sp < sourceDoc.getPageCount(); sp++) {
        expectedFingerprints.push(fingerprintPage(sourceDoc, sp));
      }
    }

    const fd = new FormData();
    fd.append("files[]", new Blob([a], { type: "application/pdf" }), "sample-1.pdf");
    fd.append("files[]", new Blob([b], { type: "application/pdf" }), "sample-2.pdf");
    fd.append("files[]", new Blob([c], { type: "application/pdf" }), "sample-multi-page.pdf");

    const res = await app.request("/api/v1/pdf/combine", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(200);

    const row = db.prepare("SELECT id, page_count FROM artifacts ORDER BY rowid DESC LIMIT 1").get() as { id: string; page_count: number };
    expect(row.page_count).toBe(6); // 1 + 2 + 3

    // Read merged PDF from disk and verify each page matches expected source fingerprint
    const combinedBuf = readFileSync(join(storageDir, `${row.id}.pdf`));
    const mergedDoc = await PDFDocument.load(combinedBuf);

    expect(mergedDoc.getPageCount()).toBe(expectedFingerprints.length);

    for (let i = 0; i < expectedFingerprints.length; i++) {
      const merged = fingerprintPage(mergedDoc, i);
      const expected = expectedFingerprints[i];
      expect(merged.width).toBe(expected.width);
      expect(merged.height).toBe(expected.height);
      expect(merged.mediaBox).toEqual(expected.mediaBox);
    }
  });
});

describe("GET /pdf/combine/row", () => {
  let db: ReturnType<typeof Database>;
  let storageDir: string;
  let app: Hono;

  beforeAll(() => {
    db = new Database(":memory:");
    initDb(db);
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-combine-row-"));
    app = createApp({ db, storageDir });
  });

  afterAll(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("returns 200 with a Source PDF row fragment containing a file input", async () => {
    const res = await app.request("/pdf/combine/row?index=3");

    expect(res.status).toBe(200);
    const html = await res.text();

    // Should contain a file input named files[]
    expect(html).toContain('name="files[]"');
    // Should contain remove button
    expect(html).toContain("remove-row");
    // Should be a fragment, not a full HTML page
    expect(html).not.toContain("<!DOCTYPE html>");
    expect(html).not.toContain("<html");
    // Should show the index in the label
    expect(html).toContain("Source PDF 3");
  });

  it("renders a page-count readout slot next to the file size", async () => {
    const res = await app.request("/pdf/combine/row?index=3");
    const html = await res.text();
    // The row exposes a page-count slot the client fills from preflight.
    expect(html).toContain("page-count");
  });
});

function buildSingleFileFormData(fixtureName: string): FormData {
  const buf = new Uint8Array(readFileSync(resolve(fixtures, fixtureName)));
  const fd = new FormData();
  fd.append("file", new Blob([buf], { type: "application/pdf" }), fixtureName);
  return fd;
}

describe("POST /api/v1/pdf/combine/validate", () => {
  let db: ReturnType<typeof Database>;
  let storageDir: string;
  let app: Hono;

  beforeAll(() => {
    db = new Database(":memory:");
    initDb(db);
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-combine-validate-"));
    app = createApp({ db, storageDir });
  });

  afterAll(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("returns valid with page count for a good multi-page PDF", async () => {
    const fd = buildSingleFileFormData("sample-multi-page.pdf");
    const res = await app.request("/api/v1/pdf/combine/validate", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      valid: true,
      pageCount: 3,
      size: expect.any(Number),
      name: "sample-multi-page.pdf",
    });
  });

  it("returns valid with pageCount=1 for a single-page PDF", async () => {
    const fd = buildSingleFileFormData("sample-1.pdf");
    const res = await app.request("/api/v1/pdf/combine/validate", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.valid).toBe(true);
    expect(json.pageCount).toBe(1);
  });

  it("rejects a non-PDF file extension", async () => {
    const fd = new FormData();
    fd.append("file", new Blob(["not a pdf"], { type: "text/plain" }), "notes.txt");
    const res = await app.request("/api/v1/pdf/combine/validate", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.valid).toBe(false);
    expect(json.reason).toBe("not-a-pdf");
  });

  it("rejects a .pdf-named file whose bytes are not a PDF", async () => {
    const fd = new FormData();
    fd.append(
      "file",
      new Blob(["plain text with no pdf magic bytes"], { type: "application/pdf" }),
      "fake.pdf",
    );
    const res = await app.request("/api/v1/pdf/combine/validate", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.valid).toBe(false);
    expect(json.reason).toBe("not-a-pdf");
  });

  it("rejects an encrypted PDF", async () => {
    const fd = buildSingleFileFormData("encrypted.pdf");
    const res = await app.request("/api/v1/pdf/combine/validate", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.valid).toBe(false);
    expect(json.reason).toBe("encrypted");
  });

  it("rejects a corrupt PDF", async () => {
    const fd = buildSingleFileFormData("corrupt.pdf");
    const res = await app.request("/api/v1/pdf/combine/validate", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.valid).toBe(false);
    expect(json.reason).toBe("corrupt");
  });

  it("rejects a missing file as not-a-pdf", async () => {
    const fd = new FormData();
    const res = await app.request("/api/v1/pdf/combine/validate", {
      method: "POST",
      body: fd,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.valid).toBe(false);
    expect(json.reason).toBe("not-a-pdf");
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

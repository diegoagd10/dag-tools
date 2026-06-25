import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { createApp } from "@/app";
import { initDb } from "@/server/db";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Home route", () => {
  let db: ReturnType<typeof Database>;
  let storageDir: string;

  beforeAll(() => {
    db = new Database(":memory:");
    initDb(db);
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-test-"));
  });

  afterAll(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("returns 200 with all three tool cards (PDF Combine, PDF Split, QR Code) on /", async () => {
    const app = createApp({ db, storageDir });
    const res = await app.request("/");

    expect(res.status).toBe(200);

    const text = await res.text();
    expect(text).toContain("PDF Combine");
    expect(text).toContain("PDF Split");
    expect(text).toContain("QR Code");
  });

  it("returns HTML content type", async () => {
    const app = createApp({ db, storageDir });
    const res = await app.request("/");

    expect(res.headers.get("content-type")).toContain("text/html");
  });

  it("renders a restyled tool grid with the three working tools as links", async () => {
    const app = createApp({ db, storageDir });
    const res = await app.request("/");

    const text = await res.text();

    // Grid container using CSS grid layout.
    expect(text).toContain('data-testid="tool-grid"');
    expect(text).toMatch(/class="[^"]*\bgrid\b[^"]*grid-cols[^"]*"/);

    // Each canonical card links to its working route.
    expect(text).toContain('href="/pdf/combine"');
    expect(text).toContain('href="/pdf/split"');
    expect(text).toContain('href="/links/qr"');
  });

  it("counts only working tools in the available-now badge", async () => {
    const app = createApp({ db, storageDir });
    const res = await app.request("/");

    const text = await res.text();
    expect(text).toMatch(
      /data-testid="tools-available-count"[^>]*>\s*3 of 3\s*</,
    );
  });

  it("does not surface renamed cards or prohibited copy", async () => {
    const app = createApp({ db, storageDir });
    const res = await app.request("/");

    const text = await res.text();
    expect(text).not.toContain("Merge PDF");
    expect(text).not.toContain("QR Code Generator");
    expect(text).not.toContain("Sign In");
    expect(text).not.toContain("My Files");
  });

  describe("PDF Combine route", () => {
    it("returns 200 on /pdf/combine", async () => {
      const app = createApp({ db, storageDir });
      const res = await app.request("/pdf/combine");

      expect(res.status).toBe(200);
    });

    it("renders PDF Combine heading", async () => {
      const app = createApp({ db, storageDir });
      const res = await app.request("/pdf/combine");

      const text = await res.text();
      expect(text).toContain("PDF Combine");
    });
  });

  describe("PDF Split route", () => {
    it("returns 200 on /pdf/split", async () => {
      const app = createApp({ db, storageDir });
      const res = await app.request("/pdf/split");

      expect(res.status).toBe(200);
    });

    it("renders PDF Split heading", async () => {
      const app = createApp({ db, storageDir });
      const res = await app.request("/pdf/split");

      const text = await res.text();
      expect(text).toContain("PDF Split");
    });
  });
});

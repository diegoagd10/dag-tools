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

  it("returns 200 with two category sections on /", async () => {
    const app = createApp({ db, storageDir });
    const res = await app.request("/");

    expect(res.status).toBe(200);

    const text = await res.text();
    expect(text).toContain("PDF Tools");
    expect(text).toContain("QR Tools");
    expect(text).toContain("3 UTILITIES");
    expect(text).toContain("1 UTILITY");
  });

  it("returns HTML content type", async () => {
    const app = createApp({ db, storageDir });
    const res = await app.request("/");

    expect(res.headers.get("content-type")).toContain("text/html");
  });

  it("renders four cards with correct titles and routes", async () => {
    const app = createApp({ db, storageDir });
    const res = await app.request("/");

    const text = await res.text();

    expect(text).toContain("Merge");
    expect(text).toContain("Split");
    expect(text).toContain("To-Epub");
    expect(text).toContain("Generate");
    expect(text).toContain('href="/pdf/combine"');
    expect(text).toContain('href="/pdf/split"');
    expect(text).toContain('href="/links/qr"');
  });

  it("renders To-Epub as non-interactive with COMING SOON and no launch link", async () => {
    const app = createApp({ db, storageDir });
    const res = await app.request("/");

    const text = await res.text();
    expect(text).toContain("COMING SOON");
    expect(text).toContain("To-Epub");
    // The To-Epub name must not appear inside an <a> tag — no href.
    // We check that "To-Epub" is never immediately preceded by an <a href pattern.
    expect(text).not.toMatch(/href="[^"]*"[^>]*>\s*[^<]*To-Epub/);
  });

  it("renders nav with PDF Tools and QR Tools anchors", async () => {
    const app = createApp({ db, storageDir });
    const res = await app.request("/");

    const text = await res.text();
    expect(text).toContain('href="/#pdf-tools"');
    expect(text).toContain('href="/#qr-tools"');
  });

  it("does not surface old card titles or prohibited copy", async () => {
    const app = createApp({ db, storageDir });
    const res = await app.request("/");

    const text = await res.text();
    expect(text).not.toContain("PDF Combine");
    expect(text).not.toContain("PDF Split");
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

  describe("Fonts", () => {
    it("served CSS contains @font-face for Sora, Inter, and JetBrains Mono", async () => {
      const app = createApp({ db, storageDir });
      const res = await app.request("/static/styles.css");
      expect(res.status).toBe(200);
      const css = await res.text();
      expect(css).toMatch(/@font-face/);
      expect(css).toMatch(/font-family:\s*"Sora"/);
      expect(css).toMatch(/font-family:\s*"Inter"/);
      expect(css).toMatch(/font-family:\s*"JetBrains Mono"/);
      expect(css).toMatch(/font-display:\s*swap/);
    });

    it("served CSS does not reference Google Fonts CDN", async () => {
      const app = createApp({ db, storageDir });
      const res = await app.request("/static/styles.css");
      const css = await res.text();
      expect(css).not.toContain("fonts.googleapis.com");
      expect(css).not.toContain("fonts.gstatic.com");
    });

    it("serves self-hosted woff2 font files", async () => {
      const app = createApp({ db, storageDir });
      for (const file of [
        "/static/fonts/sora-600.woff2",
        "/static/fonts/sora-700.woff2",
        "/static/fonts/inter-400.woff2",
        "/static/fonts/jetbrains-mono-500.woff2",
      ]) {
        const res = await app.request(file);
        expect(res.status, file).toBe(200);
      }
    });
  });
});

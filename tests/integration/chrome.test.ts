import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { createApp } from "@/app";
import { initDb } from "@/server/db";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Hono } from "hono";

const HAIRLINE = "linear-gradient(to right, var(--color-accent), transparent)";

/** Asserts the global chrome (top nav, gradient hairline, footer) is present. */
function expectChrome(html: string): void {
  // Brand links to /
  expect(html).toContain("DAG Tools");
  expect(html).toContain('href="/"');
  // Nav links
  expect(html).toContain('data-testid="nav-pdf-tools"');
  expect(html).toContain('data-testid="nav-qr-tools"');
  expect(html).toContain('data-testid="nav-help"');
  expect(html).toContain('href="/help"');
  // Gradient hairline using the accent token, no new color values
  expect(html).toContain(HAIRLINE);
  // Footer
  expect(html).toContain("© 2026 DAG Tools Utility Hub.");
  // No auth/account/search/avatar UI
  expect(html).not.toContain("Sign In");
  expect(html).not.toContain("My Files");
  expect(html).not.toContain("Notifications");
  expect(html).not.toContain("Settings");
}

describe("Global chrome on Tool form pages", () => {
  let db: ReturnType<typeof Database>;
  let storageDir: string;
  let app: Hono;

  beforeAll(() => {
    db = new Database(":memory:");
    initDb(db);
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-chrome-forms-"));
    app = createApp({ db, storageDir });
  });

  afterAll(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  const formPages: Array<{ label: string; path: string }> = [
    { label: "Home", path: "/" },
    { label: "PDF Split", path: "/pdf/split" },
    { label: "PDF Combine", path: "/pdf/combine" },
    { label: "QR Code", path: "/links/qr" },
  ];

  for (const { label, path } of formPages) {
    it(`renders nav, hairline, and footer on ${label} (${path})`, async () => {
      const res = await app.request(path);
      expect(res.status).toBe(200);
      const html = await res.text();

      expectChrome(html);

      // On non-home pages, neither PDF Tools nor QR Tools is active.
      // (On /, activation is client-side via home-nav.js hash listener.)
      expect(html).not.toMatch(/data-testid="nav-pdf-tools"[^>]*aria-current="page"/);
      expect(html).not.toMatch(/data-testid="nav-qr-tools"[^>]*aria-current="page"/);
      // Help is not active on Tool pages
      expect(html).not.toMatch(/data-testid="nav-help"[^>]*aria-current="page"/);
    });
  }
});

describe("Global chrome on Share and error pages", () => {
  let db: ReturnType<typeof Database>;
  let storageDir: string;
  let app: Hono;
  let qrShareId: string;

  beforeAll(async () => {
    db = new Database(":memory:");
    initDb(db);
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-chrome-share-"));
    app = createApp({ db, storageDir });

    // Create a QR artifact so we can open its Share Link page
    const fd = new FormData();
    fd.append("content", "https://example.com");
    const res = await app.request("/api/v1/links/qr", {
      method: "POST",
      body: fd,
    });
    const html = await res.text();
    const match = html.match(/\/links\/qr\/([A-Za-z0-9_-]{12})/);
    qrShareId = match![1];
  });

  afterAll(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("renders chrome on the QR Share page (/links/qr/:id) with no category link active", async () => {
    const res = await app.request(`/links/qr/${qrShareId}`);
    expect(res.status).toBe(200);
    const html = await res.text();

    expectChrome(html);
    expect(html).not.toMatch(/data-testid="nav-pdf-tools"[^>]*aria-current="page"/);
    expect(html).not.toMatch(/data-testid="nav-help"[^>]*aria-current="page"/);
  });

  const notFoundPages: Array<{ label: string; path: string }> = [
    { label: "PDF Split 404", path: "/pdf/split/nonexistent-42" },
    { label: "PDF Combine 404", path: "/pdf/combine/nonexistent-42" },
    { label: "QR 404", path: "/links/qr/nonexistent-id-42" },
  ];

  for (const { label, path } of notFoundPages) {
    it(`renders chrome on ${label} (${path}) with no category link active`, async () => {
      const res = await app.request(path);
      expect(res.status).toBe(404);
      const html = await res.text();

      expectChrome(html);
      expect(html).not.toMatch(/data-testid="nav-pdf-tools"[^>]*aria-current="page"/);
      expect(html).not.toMatch(/data-testid="nav-help"[^>]*aria-current="page"/);
    });
  }
});

describe("Global chrome stays out of fragments", () => {
  let db: ReturnType<typeof Database>;
  let storageDir: string;
  let app: Hono;

  beforeAll(() => {
    db = new Database(":memory:");
    initDb(db);
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-chrome-frag-"));
    app = createApp({ db, storageDir });
  });

  afterAll(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("returns 404 for the removed /pdf/combine/row route", async () => {
    const res = await app.request("/pdf/combine/row?index=3");
    expect(res.status).toBe(404);
  });
});

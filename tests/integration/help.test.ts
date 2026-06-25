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
  expect(html).toContain("DAG Tools");
  expect(html).toContain('href="/"');
  expect(html).toContain('data-testid="nav-tools"');
  expect(html).toContain('data-testid="nav-help"');
  expect(html).toContain('href="/help"');
  expect(html).toContain(HAIRLINE);
  expect(html).toContain("© 2026 DAG Tools Utility Hub.");
  expect(html).not.toContain("Sign In");
  expect(html).not.toContain("My Files");
  expect(html).not.toContain("Notifications");
  expect(html).not.toContain("Settings");
}

describe("GET /help", () => {
  let db: ReturnType<typeof Database>;
  let storageDir: string;
  let app: Hono;

  beforeAll(() => {
    db = new Database(":memory:");
    initDb(db);
    storageDir = mkdtempSync(join(tmpdir(), "dag-tools-help-"));
    app = createApp({ db, storageDir });
  });

  afterAll(() => {
    db.close();
    rmSync(storageDir, { recursive: true, force: true });
  });

  it("returns 200 and renders the FAQ accordion inside global chrome", async () => {
    const res = await app.request("/help");
    expect(res.status).toBe(200);
    const html = await res.text();

    expectChrome(html);

    // Full page rendered via Layout
    expect(html).toContain("<html");

    // Native <details>/<summary> accordion — no client JS for toggle.
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    const detailsCount = (html.match(/<details/g) ?? []).length;
    expect(detailsCount).toBeGreaterThanOrEqual(4);

    // Help introduces no <script> of its own; only the global vendor scripts
    // already in Layout are present.
    const helpScripts = html.match(/<script[^>]*help/g) ?? [];
    expect(helpScripts).toHaveLength(0);
  });

  it("marks the Help nav link as active and Tools as inactive", async () => {
    const res = await app.request("/help");
    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toMatch(/data-testid="nav-help"[^>]*aria-current="page"/);
    expect(html).not.toMatch(/data-testid="nav-tools"[^>]*aria-current="page"/);
  });

  it("answers honestly: supported formats, 50 MB limit, QR links permanent (Artifacts persist, no TTL), how to combine/split PDFs", async () => {
    const res = await app.request("/help");
    expect(res.status).toBe(200);
    const html = await res.text();

    // Supported formats: PDF (combine/split) and QR Content (text/URL).
    expect(html).toContain("PDF");
    expect(html).toContain("QR");

    // Total Size Limit
    expect(html).toMatch(/50\s?MB/);

    // QR links are permanent — Artifacts persist, no TTL.
    expect(html).toMatch(/no TTL/i);
    expect(html.toLowerCase()).toContain("persist");

    // How to combine and split PDFs — point at the actual Tool routes.
    expect(html).toContain("/pdf/combine");
    expect(html).toContain("/pdf/split");
  });

  it("does not surface forbidden UI or copy (search bar, notifications, avatar, Contact Support, AES-256, data purged, enterprise)", async () => {
    const res = await app.request("/help");
    expect(res.status).toBe(200);
    const html = await res.text();

    // No search input of any kind.
    expect(html).not.toContain('type="search"');
    expect(html).not.toMatch(/placeholder="[^"]*search/i);

    // No avatar / notifications / Contact Support CTA.
    expect(html).not.toContain("avatar");
    expect(html).not.toContain("Notifications");
    expect(html).not.toContain("Contact Support");

    // No security / auto-deletion / enterprise copy.
    expect(html).not.toContain("AES-256");
    expect(html).not.toContain("encrypted");
    expect(html).not.toContain("encryption");
    expect(html).not.toContain("data purged");
    expect(html).not.toContain("auto-delet");
    expect(html).not.toContain("enterprise");
  });
});

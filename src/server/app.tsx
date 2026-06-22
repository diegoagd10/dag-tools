/** @jsxImportSource hono/jsx */

import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import type Database from "better-sqlite3";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import { Home } from "./views/Home";
import { PdfCombine } from "./views/PdfCombine";
import { PdfSplit } from "./views/PdfSplit";
import { ShareLinkPanel } from "./views/ShareLinkPanel";
import { ArtifactNotFound } from "./views/ArtifactNotFound";
import { mergePdfs } from "./merge-pdfs";
import { persistArtifact } from "./artifacts";

export type AppDeps = { db: Database.Database; storageDir: string };

export function createApp({ db, storageDir }: AppDeps): Hono {
  const app = new Hono();

  // Serve static files (vendor JS, Tailwind CSS)
  app.use("/static/*", serveStatic({ root: "./" }));

  // Home page — lists available Tools
  app.get("/", (c) => {
    void db;
    void storageDir;
    return c.html(<Home />);
  });

  // Tool form pages
  app.get("/pdf/combine", (c) => {
    void db;
    void storageDir;
    return c.html(<PdfCombine />);
  });

  app.get("/pdf/split", (c) => {
    void db;
    void storageDir;
    return c.html(<PdfSplit />);
  });

  // POST /api/v1/pdf/combine — merge Source PDFs and persist Artifact
  app.post("/api/v1/pdf/combine", async (c) => {
    const formData = await c.req.formData();
    const files = formData.getAll("files[]") as File[];

    // Must have at least 2 files
    if (files.length < 2) {
      return c.json(
        { error: "At least two PDF files are required." },
        400,
      );
    }

    // Read buffers and validate each is a PDF
    const buffers: Uint8Array[] = [];
    for (const file of files) {
      const buf = new Uint8Array(await file.arrayBuffer());
      if (buf.length < 4 || buf[0] !== 0x25 || buf[1] !== 0x50) {
        return c.json(
          { error: `"${file.name}" is not a valid PDF file.` },
          400,
        );
      }
      buffers.push(buf);
    }

    // Compute page count from input files
    let pageCount = 0;
    for (const buf of buffers) {
      const doc = await PDFDocument.load(buf);
      pageCount += doc.getPageCount();
    }

    // Merge PDFs in form order
    const combined = await mergePdfs(buffers);

    // Generate today's date for filename
    const today = new Date().toISOString().slice(0, 10);
    const filename = `combined-${today}.pdf`;

    // Persist artifact (row + blob)
    const { id } = persistArtifact(
      db,
      storageDir,
      {
        tool: "pdf-combine",
        filename,
        mimeType: "application/pdf",
        ext: "pdf",
        size: combined.length,
        pageCount,
      },
      combined,
    );

    // Return HTML fragment with Share Link
    return c.html(<ShareLinkPanel id={id} filename={filename} />);
  });

  // GET /pdf/combine/:id — serve the Combined PDF or return 404
  app.get("/pdf/combine/:id", (c) => {
    const id = c.req.param("id");

    const row = db
      .prepare("SELECT filename, ext FROM artifacts WHERE id = ?")
      .get(id) as { filename: string; ext: string } | undefined;

    if (!row) {
      return c.html(<ArtifactNotFound />, 404);
    }

    const filePath = join(storageDir, `${id}.${row.ext}`);
    if (!existsSync(filePath)) {
      return c.html(<ArtifactNotFound />, 404);
    }

    const blob = readFileSync(filePath);

    return c.body(blob as never, 200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${row.filename}"`,
      "Content-Length": String(blob.length),
    });
  });

  return app;
}

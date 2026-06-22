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
import { SourcePdfRow } from "./views/SourcePdfRow";
import { ShareLinkPanel } from "./views/ShareLinkPanel";
import { CombineErrorPanel } from "./views/CombineErrorPanel";
import { ArtifactNotFound } from "./views/ArtifactNotFound";
import { SplitErrorPanel } from "./views/SplitErrorPanel";
import { mergePdfs } from "./merge-pdfs";
import { persistArtifact } from "./artifacts";
import { split } from "@/lib/split-pdf/split";

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

  // GET /pdf/combine/row — return a Source PDF row fragment for hx-get
  app.get("/pdf/combine/row", (c) => {
    void db;
    void storageDir;
    const index = parseInt(c.req.query("index") || "0", 10) || 0;
    return c.html(<SourcePdfRow index={index} />);
  });

  // POST /api/v1/pdf/combine — merge Source PDFs and persist Artifact
  app.post("/api/v1/pdf/combine", async (c) => {
    const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB

    const formData = await c.req.formData();
    const files = formData.getAll("files[]") as File[];

    // Must have at least 2 files
    if (files.length < 2) {
      return c.json(
        { error: "At least two PDF files are required." },
        400,
      );
    }

    // Server-side total size cap
    let totalSize = 0;
    for (const file of files) {
      totalSize += file.size;
    }
    if (totalSize > MAX_TOTAL_BYTES) {
      return c.json(
        { error: "The combined size of all Source PDFs exceeds the 50 MB limit." },
        400,
      );
    }

    // Read buffers and validate each is a PDF (magic bytes + parse validation)
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

    // Parse validation: detect encrypted and corrupt Source PDFs
    let pageCount = 0;
    for (let i = 0; i < buffers.length; i++) {
      try {
        const doc = await PDFDocument.load(buffers[i]);
        pageCount += doc.getPageCount();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const isEncrypted = message.includes("is encrypted");
        const reason = isEncrypted ? "encrypted" : "corrupt";
        return c.html(
          <CombineErrorPanel filename={files[i].name} reason={reason} />,
          422,
        );
      }
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

    // Return HTML fragment with Share Link and page count
    return c.html(
      <ShareLinkPanel id={id} filename={filename} pageCount={pageCount} />,
    );
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

  // POST /api/v1/pdf/split — split a Source PDF and persist Artifact
  app.post("/api/v1/pdf/split", async (c) => {
    const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    // Must have a file
    if (!file || file.size === 0) {
      return c.html(
        <SplitErrorPanel filename="No file" reason="not-a-pdf" />,
        422,
      );
    }

    // Check file extension
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return c.html(
        <SplitErrorPanel filename={file.name} reason="not-a-pdf" />,
        422,
      );
    }

    // Check file size
    if (file.size > MAX_FILE_BYTES) {
      return c.html(
        <SplitErrorPanel filename={file.name} reason="oversize" />,
        422,
      );
    }

    // Read buffer and validate magic bytes
    const buf = new Uint8Array(await file.arrayBuffer());
    if (buf.length < 4 || buf[0] !== 0x25 || buf[1] !== 0x50) {
      return c.html(
        <SplitErrorPanel filename={file.name} reason="not-a-pdf" />,
        422,
      );
    }

    // Parse validation: detect encrypted, corrupt, or zero-page Source PDFs
    let pageCount: number;
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(buf);
      pageCount = doc.getPageCount();
      if (pageCount < 1) {
        return c.html(
          <SplitErrorPanel filename={file.name} reason="too-few-pages" />,
          422,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isEncrypted = message.includes("is encrypted");
      const reason = isEncrypted ? "encrypted" : "corrupt";
      return c.html(
        <SplitErrorPanel filename={file.name} reason={reason} />,
        422,
      );
    }

    // Split — we need a File-like object. Reconstruct from buffer.
    const fileForSplit = new File([buf], file.name, { type: file.type });
    const zipBytes = await split(fileForSplit);

    // Generate today's date for filename
    const today = new Date().toISOString().slice(0, 10);
    const filename = `split-${today}.zip`;

    // Persist artifact (row + blob)
    const { id } = persistArtifact(
      db,
      storageDir,
      {
        tool: "pdf-split",
        filename,
        mimeType: "application/zip",
        ext: "zip",
        size: zipBytes.length,
        pageCount,
      },
      zipBytes,
    );

    // Return HTML fragment with Share Link and page count
    return c.html(
      <ShareLinkPanel
        id={id}
        filename={filename}
        pageCount={pageCount}
        pathPrefix="/pdf/split"
      />,
    );
  });

  // POST /api/v1/pdf/split/validate — pre-flight validation (page count gate)
  app.post("/api/v1/pdf/split/validate", async (c) => {
    const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return c.json({ valid: false, reason: "not-a-pdf" });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return c.json({ valid: false, reason: "not-a-pdf" });
    }

    if (file.size > MAX_FILE_BYTES) {
      return c.json({ valid: false, reason: "oversize" });
    }

    const buf = new Uint8Array(await file.arrayBuffer());
    if (buf.length < 4 || buf[0] !== 0x25 || buf[1] !== 0x50) {
      return c.json({ valid: false, reason: "not-a-pdf" });
    }

    let pageCount: number;
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(buf);
      pageCount = doc.getPageCount();
      if (pageCount < 1) {
        return c.json({ valid: false, reason: "too-few-pages" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isEncrypted = message.includes("is encrypted");
      return c.json({
        valid: false,
        reason: isEncrypted ? "encrypted" : "corrupt",
      });
    }

    return c.json({
      valid: true,
      pageCount,
      size: file.size,
      name: file.name,
    });
  });

  // GET /pdf/split/:id — serve the Split ZIP or return 404
  app.get("/pdf/split/:id", (c) => {
    const id = c.req.param("id");

    const row = db
      .prepare("SELECT filename, ext FROM artifacts WHERE id = ?")
      .get(id) as { filename: string; ext: string } | undefined;

    if (!row) {
      return c.html(
        <ArtifactNotFound
          backLink={{ href: "/pdf/split", label: "Back to PDF Split" }}
        />,
        404,
      );
    }

    const filePath = join(storageDir, `${id}.${row.ext}`);
    if (!existsSync(filePath)) {
      return c.html(
        <ArtifactNotFound
          backLink={{ href: "/pdf/split", label: "Back to PDF Split" }}
        />,
        404,
      );
    }

    const blob = readFileSync(filePath);

    return c.body(blob as never, 200, {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${row.filename}"`,
      "Content-Length": String(blob.length),
    });
  });

  return app;
}

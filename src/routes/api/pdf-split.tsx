/** @jsxImportSource hono/jsx */

import type { Hono } from "hono";
import type { AppDeps } from "@/app";
import { splitPdfs } from "@/modules/split-pdfs";
import { persistArtifact } from "@/server/artifacts";
import { ShareLinkPanel } from "@/ui/components/share-link-panel";
import { SplitErrorPanel } from "@/ui/components/split-error-panel";

export function register(app: Hono, deps: AppDeps): void {
  const { db, storageDir } = deps;

  app.post("/api/v1/pdf/split", async (c) => {
    const MAX_FILE_BYTES = 50 * 1024 * 1024;

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return c.html(
        <SplitErrorPanel filename="No file" reason="not-a-pdf" />,
        422,
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return c.html(
        <SplitErrorPanel filename={file.name} reason="not-a-pdf" />,
        422,
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return c.html(
        <SplitErrorPanel filename={file.name} reason="oversize" />,
        422,
      );
    }

    const buf = new Uint8Array(await file.arrayBuffer());
    if (buf.length < 4 || buf[0] !== 0x25 || buf[1] !== 0x50) {
      return c.html(
        <SplitErrorPanel filename={file.name} reason="not-a-pdf" />,
        422,
      );
    }

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

    const zipBytes = await splitPdfs(buf);

    const today = new Date().toISOString().slice(0, 10);
    const filename = `split-${today}.zip`;

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

    return c.html(
      <ShareLinkPanel
        id={id}
        filename={filename}
        pageCount={pageCount}
        pathPrefix="/pdf/split"
      />,
    );
  });

  app.post("/api/v1/pdf/split/validate", async (c) => {
    const MAX_FILE_BYTES = 50 * 1024 * 1024;

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
}

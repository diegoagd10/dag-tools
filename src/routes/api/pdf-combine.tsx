/** @jsxImportSource hono/jsx */

import type { Hono } from "hono";
import { PDFDocument } from "pdf-lib";
import type { AppDeps } from "@/app";
import { mergePdfs } from "@/modules/merge-pdfs";
import { persistArtifact } from "@/server/artifacts";
import { ShareLinkPanel } from "@/ui/components/share-link-panel";
import { CombineErrorPanel } from "@/ui/components/combine-error-panel";

export function register(app: Hono, deps: AppDeps): void {
  const { db, storageDir } = deps;

  app.post("/api/v1/pdf/combine", async (c) => {
    const MAX_TOTAL_BYTES = 50 * 1024 * 1024;

    const formData = await c.req.formData();
    const files = formData.getAll("files[]") as File[];

    if (files.length < 2) {
      return c.json(
        { error: "At least two PDF files are required." },
        400,
      );
    }

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

    const combined = await mergePdfs(buffers);

    const today = new Date().toISOString().slice(0, 10);
    const filename = `combined-${today}.pdf`;

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

    return c.html(
      <ShareLinkPanel id={id} filename={filename} pageCount={pageCount} />,
    );
  });
}

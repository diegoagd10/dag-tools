/** @jsxImportSource hono/jsx */

import type { Hono } from "hono";
import type { AppDeps } from "@/app";
import { inspectPdf } from "@/modules/inspect-pdf";
import { splitPdfs } from "@/modules/split-pdfs";
import { persistArtifact } from "@/server/artifacts";
import { SplitSuccessPanel } from "@/ui/components/split-success-panel";
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
    const inspection = await inspectPdf(buf);

    if (!inspection.ok) {
      return c.html(
        <SplitErrorPanel filename={file.name} reason={inspection.reason} />,
        422,
      );
    }

    if (inspection.pageCount < 1) {
      return c.html(
        <SplitErrorPanel filename={file.name} reason="too-few-pages" />,
        422,
      );
    }

    const pageCount = inspection.pageCount;
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
      <SplitSuccessPanel
        id={id}
        filename={filename}
        pageCount={pageCount}
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
    const inspection = await inspectPdf(buf);

    if (!inspection.ok) {
      return c.json({
        valid: false,
        reason: inspection.reason,
      });
    }

    if (inspection.pageCount < 1) {
      return c.json({ valid: false, reason: "too-few-pages" });
    }

    return c.json({
      valid: true,
      pageCount: inspection.pageCount,
      size: file.size,
      name: file.name,
    });
  });
}

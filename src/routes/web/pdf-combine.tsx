/** @jsxImportSource hono/jsx */

import type { Hono } from "hono";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { AppDeps } from "@/app";
import { PdfCombine } from "@/ui/screens/pdf-combine";
import { SourcePdfRow } from "@/ui/components/source-pdf-row";
import { ArtifactNotFound } from "@/ui/screens/artifact-not-found";

export function register(app: Hono, deps: AppDeps): void {
  const { db, storageDir } = deps;

  app.get("/pdf/combine", (c) => {
    return c.html(<PdfCombine currentPath={c.req.path} />);
  });

  app.get("/pdf/combine/row", (c) => {
    const index = parseInt(c.req.query("index") || "0", 10) || 0;
    return c.html(<SourcePdfRow index={index} />);
  });

  app.get("/pdf/combine/:id", (c) => {
    const id = c.req.param("id");

    const row = db
      .prepare("SELECT filename, ext FROM artifacts WHERE id = ?")
      .get(id) as { filename: string; ext: string } | undefined;

    if (!row) {
      return c.html(<ArtifactNotFound currentPath={c.req.path} />, 404);
    }

    const filePath = join(storageDir, `${id}.${row.ext}`);
    if (!existsSync(filePath)) {
      return c.html(<ArtifactNotFound currentPath={c.req.path} />, 404);
    }

    const blob = readFileSync(filePath);

    return c.body(blob as never, 200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${row.filename}"`,
      "Content-Length": String(blob.length),
    });
  });
}

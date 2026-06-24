/** @jsxImportSource hono/jsx */

import type { Hono } from "hono";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { AppDeps } from "@/app";
import { PdfSplit } from "@/ui/screens/pdf-split";
import { ArtifactNotFound } from "@/ui/screens/artifact-not-found";

export function register(app: Hono, deps: AppDeps): void {
  const { db, storageDir } = deps;

  app.get("/pdf/split", (c) => {
    return c.html(<PdfSplit />);
  });

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
}

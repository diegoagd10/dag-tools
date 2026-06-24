/** @jsxImportSource hono/jsx */

import type { Hono } from "hono";
import type { AppDeps } from "@/app";
import { QrCode } from "@/ui/screens/qr-code";
import { QrSharePage } from "@/ui/screens/qr-share-page";
import { ArtifactNotFound } from "@/ui/screens/artifact-not-found";
import { renderQrPng } from "@/modules/qr";

export function register(app: Hono, deps: AppDeps): void {
  const { db } = deps;

  app.get("/links/qr", (c) => {
    return c.html(<QrCode currentPath={c.req.path} />);
  });

  app.get("/links/qr/:id", async (c) => {
    const param = c.req.param("id");

    if (param.endsWith(".png")) {
      const id = param.slice(0, -4);

      const row = db
        .prepare("SELECT text_content FROM artifacts WHERE id = ? AND tool = 'links/qr'")
        .get(id) as { text_content: string } | undefined;

      if (!row) {
        return c.body(null, 404);
      }

      const png = await renderQrPng(row.text_content);

      return c.body(png as never, 200, {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      });
    }

    const row = db
      .prepare("SELECT id FROM artifacts WHERE id = ? AND tool = 'links/qr'")
      .get(param);

    if (!row) {
      return c.html(
        <ArtifactNotFound
          backLink={{ href: "/links/qr", label: "Back to QR Code" }}
          currentPath={c.req.path}
        />,
        404,
      );
    }

    return c.html(<QrSharePage id={param} currentPath={c.req.path} />);
  });
}

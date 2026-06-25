/** @jsxImportSource hono/jsx */

import type { Hono } from "hono";
import type { AppDeps } from "@/app";
import { validateQrContent } from "@/modules/qr-validate";
import { persistTextArtifact } from "@/server/persist-text-artifact";
import { QrSharePanel } from "@/ui/components/qr-share-panel";
import { QrErrorPanel } from "@/ui/components/qr-error-panel";

export function register(app: Hono, deps: AppDeps): void {
  const { db } = deps;

  app.post("/api/v1/links/qr", async (c) => {
    const formData = await c.req.formData();
    const raw = formData.get("content");

    if (typeof raw !== "string") {
      return c.html(<QrErrorPanel reason="empty" />, 422);
    }

    const validation = validateQrContent(raw);
    if (!validation.valid) {
      return c.html(<QrErrorPanel reason={validation.error} />, 422);
    }

    const { id } = persistTextArtifact(db, {
      tool: "links/qr",
      textContent: validation.content,
    });

    return c.html(<QrSharePanel id={id} />);
  });
}

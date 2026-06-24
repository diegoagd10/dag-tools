import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import type Database from "better-sqlite3";
import { register as registerHome } from "@/routes/web/home";
import { register as registerPdfCombineWeb } from "@/routes/web/pdf-combine";
import { register as registerPdfSplitWeb } from "@/routes/web/pdf-split";
import { register as registerQrWeb } from "@/routes/web/qr";
import { register as registerPdfCombineApi } from "@/routes/api/pdf-combine";
import { register as registerPdfSplitApi } from "@/routes/api/pdf-split";
import { register as registerLinksQrApi } from "@/routes/api/links-qr";

export type AppDeps = { db: Database.Database; storageDir: string };

export function createApp({ db, storageDir }: AppDeps): Hono {
  const app = new Hono();

  app.use("/static/*", serveStatic({ root: "./" }));

  registerHome(app, { db, storageDir });
  registerPdfCombineWeb(app, { db, storageDir });
  registerPdfSplitWeb(app, { db, storageDir });
  registerQrWeb(app, { db, storageDir });
  registerPdfCombineApi(app, { db, storageDir });
  registerPdfSplitApi(app, { db, storageDir });
  registerLinksQrApi(app, { db, storageDir });

  return app;
}

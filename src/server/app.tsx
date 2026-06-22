/** @jsxImportSource hono/jsx */

import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import type Database from "better-sqlite3";
import { Home } from "./views/Home";
import { PdfCombine } from "./views/PdfCombine";
import { PdfSplit } from "./views/PdfSplit";

export type AppDeps = { db: Database.Database; storageDir: string };

export function createApp({ db, storageDir }: AppDeps): Hono {
  const app = new Hono();

  // Serve static files (vendor JS, Tailwind CSS)
  app.use("/static/*", serveStatic({ root: "./" }));

  // Home page — lists available Tools
  app.get("/", (c) => {
    // Suppress unused parameter warnings; both are passed for future slices
    void db;
    void storageDir;
    return c.html(<Home />);
  });

  // Tool form pages — placeholder for Slice 1
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

  return app;
}

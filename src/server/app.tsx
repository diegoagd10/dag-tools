/** @jsxImportSource hono/jsx */

import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import type Database from "better-sqlite3";
import { Home } from "./views/Home";

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

  return app;
}

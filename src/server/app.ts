import { Hono } from "hono";
import type { DB } from "./db";

export interface AppDeps {
  db: DB;
}

export function createApp(deps: AppDeps): Hono {
  const { db } = deps;
  const app = new Hono();

  app.get("/api/v1/ping", (c) => {
    db.prepare("SELECT 1 FROM artifacts LIMIT 1").get();
    return c.json({ status: "ok" });
  });

  return app;
}

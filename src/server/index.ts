import { mkdirSync } from "node:fs";
import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { openDatabase } from "./db";

const port = Number(process.env.PORT ?? 3001);
const dbPath = process.env.DB_PATH ?? "./data/dag-tools.db";
const storageDir = process.env.STORAGE_DIR ?? "./storage";

mkdirSync("./data", { recursive: true });
mkdirSync(storageDir, { recursive: true });

const db = openDatabase(dbPath);
const app = createApp({ db });

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`dag-tools API listening on http://localhost:${info.port}`);
});

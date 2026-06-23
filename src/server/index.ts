import { serve } from "@hono/node-server";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createApp } from "./app";
import { initDb } from "./db";

const port = parseInt(process.env.PORT || "3001", 10);
const dbPath = process.env.DB_PATH || "./data/dag-tools.db";
const storageDir = process.env.STORAGE_DIR || "./storage";

// Ensure directories exist
mkdirSync(storageDir, { recursive: true });
mkdirSync(dirname(dbPath), { recursive: true });

// Initialize database
const db = new Database(dbPath);
initDb(db);

// Create and serve the app
const app = createApp({ db, storageDir });

serve({ fetch: app.fetch, port });
console.log(`Hono server running on port ${port}`);

/** @jsxImportSource hono/jsx */

import type { Hono } from "hono";
import type { AppDeps } from "@/app";
import { Help } from "@/ui/screens/help";

export function register(app: Hono, _deps: AppDeps): void {
  app.get("/help", (c) => {
    return c.html(<Help currentPath={c.req.path} />);
  });
}

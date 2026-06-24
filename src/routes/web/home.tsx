/** @jsxImportSource hono/jsx */

import type { Hono } from "hono";
import type { AppDeps } from "@/app";
import { Home } from "@/ui/screens/home";

export function register(app: Hono, _deps: AppDeps): void {
  app.get("/", (c) => {
    return c.html(<Home currentPath={c.req.path} />);
  });
}

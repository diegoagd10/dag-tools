/** @jsxImportSource hono/jsx */

export const Layout = ({
  children,
  title,
  currentPath = "",
}: {
  children?: unknown;
  title: string;
  currentPath?: string;
}) => {
  const toolsActive =
    currentPath === "/" ||
    currentPath.startsWith("/pdf/") ||
    currentPath.startsWith("/links/");
  const helpActive = currentPath === "/help";

  const navLinkClass = (active: boolean): string =>
    active
      ? "font-sans text-sm text-accent underline underline-offset-4 decoration-accent"
      : "font-sans text-sm text-ink-soft transition-colors duration-150 hover:text-ink";

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="stylesheet" href="/static/styles.css" />
        <script src="/static/vendor/htmx.min.js" defer />
        <script src="/static/vendor/Sortable.min.js" defer />
        <script src="/static/js/combine-form.js" defer />
        <script src="/static/js/split-form.js" defer />
        <script src="/static/js/qr-form.js" defer />
      </head>
      <body class="min-h-full flex flex-col bg-paper text-ink">
        <header>
          <nav
            aria-label="Primary"
            class="mx-auto flex w-full max-w-3xl items-center justify-between px-6 pt-6 sm:pt-8"
          >
            <a
              href="/"
              class="font-sans text-sm font-medium tracking-[-0.005em] text-ink"
            >
              DAG Tools
            </a>
            <div class="flex items-center gap-6">
              <a
                href="/"
                data-testid="nav-tools"
                aria-current={toolsActive ? "page" : undefined}
                class={navLinkClass(toolsActive)}
              >
                Tools
              </a>
              <a
                href="/help"
                data-testid="nav-help"
                aria-current={helpActive ? "page" : undefined}
                class={navLinkClass(helpActive)}
              >
                Help
              </a>
            </div>
          </nav>
          <div
            aria-hidden="true"
            class="h-px w-full"
            style="background: linear-gradient(to right, var(--color-accent), transparent)"
          />
        </header>
        <main class="mx-auto flex w-full max-w-3xl flex-col px-6 pt-10 pb-24 sm:pt-16">
          {children}
        </main>
        <footer class="mx-auto flex w-full max-w-3xl flex-col gap-1 px-6 pb-10">
          <span class="font-sans text-sm font-medium text-ink">DAG Tools</span>
          <span class="font-sans text-xs text-muted">
            © 2026 DAG Tools Utility Hub.
          </span>
        </footer>
      </body>
    </html>
  );
};

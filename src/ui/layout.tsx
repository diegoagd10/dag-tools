/** @jsxImportSource hono/jsx */

export const Layout = ({
  children,
  title,
  currentPath = "",
  bodyClass = "bg-paper",
}: {
  children?: unknown;
  title: string;
  currentPath?: string;
  bodyClass?: string;
}) => {
  // Category links are only active via client-side hash (home-nav.js).
  // Server-side, neither PDF Tools nor QR Tools carries aria-current.
  const pdfToolsActive = false;
  const qrToolsActive = false;
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
        <script src="/static/js/home-nav.js" defer />
      </head>
      <body class={`min-h-full flex flex-col text-ink ${bodyClass}`}>
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
                href="/#pdf-tools"
                data-testid="nav-pdf-tools"
                aria-current={pdfToolsActive ? "page" : undefined}
                class={navLinkClass(pdfToolsActive)}
              >
                PDF Tools
              </a>
              <a
                href="/#qr-tools"
                data-testid="nav-qr-tools"
                aria-current={qrToolsActive ? "page" : undefined}
                class={navLinkClass(qrToolsActive)}
              >
                QR Tools
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

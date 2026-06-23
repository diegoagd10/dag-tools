/** @jsxImportSource hono/jsx */

import { Layout } from "./Layout";

export const Home = () => {
  return (
    <Layout title="dag-tools — A small workshop of file tools">
      <section class="flex flex-col gap-8">
        <h1 class="font-sans text-5xl font-medium leading-[1.02] tracking-[-0.028em] text-ink sm:text-6xl">
          Tools for working <span class="text-accent">with files</span>.
        </h1>
        <p class="max-w-xl text-base leading-relaxed text-ink-soft">
          A small workshop of self-contained utilities. Each tool runs
          server-side — your files are processed and stored securely.
        </p>
      </section>

      <section
        aria-labelledby="tools-heading"
        class="mt-20 flex flex-col gap-5"
      >
        <div class="flex items-baseline justify-between border-b border-hairline pb-3">
          <h2
            id="tools-heading"
            class="font-display text-sm font-medium tracking-[-0.005em] text-ink-soft"
          >
            Available now
          </h2>
          <span class="font-mono text-[11px] text-muted">03 of 03</span>
        </div>

        <a
          href="/pdf/combine"
          class="block rounded-lg bg-surface p-6 transition-colors duration-150 hover:bg-surface-hover"
        >
          <div class="flex items-start gap-4">
            <div class="h-10 w-10 shrink-0 text-ink-soft" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div class="flex flex-col gap-2">
              <h2 class="font-sans text-2xl font-medium leading-tight tracking-[-0.01em] text-ink">
                PDF Combine
              </h2>
              <p class="max-w-md text-sm leading-relaxed text-ink-soft">
                Stitch two or more PDFs into a single document. Drag the rows to
                set the merge order.
              </p>
            </div>
          </div>
        </a>

        <a
          href="/pdf/split"
          class="block rounded-lg bg-surface p-6 transition-colors duration-150 hover:bg-surface-hover"
        >
          <div class="flex items-start gap-4">
            <div class="h-10 w-10 shrink-0 text-ink-soft" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <div class="flex flex-col gap-2">
              <h2 class="font-sans text-2xl font-medium leading-tight tracking-[-0.01em] text-ink">
                PDF Split
              </h2>
              <p class="max-w-md text-sm leading-relaxed text-ink-soft">
                Break a PDF into one file per page and download the pages as a
                single ZIP archive.
              </p>
            </div>
          </div>
        </a>

        <a
          href="/links/qr"
          class="block rounded-lg bg-surface p-6 transition-colors duration-150 hover:bg-surface-hover"
        >
          <div class="flex items-start gap-4">
            <div class="h-10 w-10 shrink-0 text-ink-soft" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </div>
            <div class="flex flex-col gap-2">
              <h2 class="font-sans text-2xl font-medium leading-tight tracking-[-0.01em] text-ink">
                QR Code
              </h2>
              <p class="max-w-md text-sm leading-relaxed text-ink-soft">
                Paste a URL or any text to generate a QR Code. Get a shareable
                link with a downloadable PNG image.
              </p>
            </div>
          </div>
        </a>
      </section>
    </Layout>
  );
};

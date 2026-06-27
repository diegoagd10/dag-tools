/** @jsxImportSource hono/jsx */

import { Layout } from "@/ui/layout";

export const PdfCombine = ({ currentPath }: { currentPath?: string }) => {
  return (
    <Layout title="PDF Combine — dag-tools" currentPath={currentPath}>
      <h1 class="font-sans text-4xl font-medium tracking-[-0.01em] text-ink">
        PDF Combine
      </h1>
      <p class="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
        Upload two or more Source PDFs to merge them into a single Combined
        PDF. Drag the cards to set the Merge Order.
      </p>

      <form
        id="combine-form"
        data-testid="combine-form"
        hx-post="/api/v1/pdf/combine"
        hx-target="#combine-result"
        hx-swap="outerHTML"
        hx-encoding="multipart/form-data"
        hx-indicator="#combine-indicator"
        hx-on--before-swap="if(event.detail.xhr.status === 422) event.detail.shouldSwap = true"
        class="mt-8 flex w-full max-w-xl flex-col gap-4"
      >
        <div
          id="drop-zone"
          data-testid="drop-zone"
          class="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-accent/40 bg-surface px-6 py-10 text-center transition-colors duration-150 hover:border-accent hover:bg-accent/5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-8 w-8 text-accent"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p class="font-sans text-sm text-ink-soft">
            Drag &amp; Drop PDFs / or click to browse your system
          </p>
          <input
            type="file"
            id="files-input"
            name="files[]"
            data-testid="drop-zone-input"
            accept=".pdf,application/pdf"
            multiple
            class="absolute inset-0 w-full h-full cursor-pointer opacity-0"
          />
        </div>

        <div id="selected-files-container" class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h2 class="font-sans text-xs font-semibold uppercase tracking-wider text-muted">
              Selected Files (<span id="selected-count" data-testid="selected-count">0</span>)
            </h2>
          </div>
          <div id="source-cards" class="flex flex-col gap-2"></div>
        </div>

        <button
          id="combine-btn"
          data-testid="combine-button"
          type="submit"
          disabled
          class="mt-2 inline-flex w-fit items-center rounded bg-accent px-5 py-2.5 font-sans text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent"
        >
          Combine Files
        </button>

        <p
          id="combine-hint"
          data-testid="combine-hint"
          class="text-sm text-muted"
        >
          Add at least 2 Source PDFs to combine.
        </p>
      </form>

      <div
        id="combine-indicator"
        class="htmx-indicator mt-4 text-sm text-ink-soft"
      >
        Combining…
      </div>

      <div id="combine-result" />
    </Layout>
  );
};

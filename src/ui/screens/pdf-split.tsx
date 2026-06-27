/** @jsxImportSource hono/jsx */

import { Layout } from "@/ui/layout";

export const PdfSplit = ({ currentPath }: { currentPath?: string }) => {
  return (
    <Layout title="PDF Split — dag-tools" currentPath={currentPath}>
      <h1 class="font-sans text-4xl font-medium tracking-[-0.01em] text-ink">
        Split a PDF Document
      </h1>
      <p class="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
        Upload a PDF to split it into one file per page — downloaded as a ZIP.
      </p>

      <form
        id="split-form"
        data-testid="split-form"
        hx-post="/api/v1/pdf/split"
        hx-target="#split-result"
        hx-swap="outerHTML"
        hx-encoding="multipart/form-data"
        hx-indicator="#split-indicator"
        hx-on--before-swap="if(event.detail.xhr.status === 422) event.detail.shouldSwap = true"
        class="mt-8 flex w-full max-w-xl flex-col gap-4"
      >
        {/* Drop zone — single-file drop or click-to-browse.
            The hidden file input is an invisible overlay; the client script
            wires drag-and-drop and populates it via DataTransfer. */}
        <div
          id="drop-zone"
          data-testid="drop-zone"
          role="button"
          tabindex={0}
          aria-label="Drop your PDF here or press Enter to browse"
          class="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-hairline bg-paper px-6 py-10 text-center transition-colors duration-150 hover:border-accent hover:bg-accent/5"
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
          <p class="font-sans text-sm text-muted">
            Drop your PDF here / or click to browse
          </p>
          <input
            type="file"
            id="split-file-input"
            name="file"
            data-testid="split-file-input"
            accept=".pdf"
            tabindex={-1}
            class="absolute inset-0 w-full h-full cursor-pointer opacity-0"
          />
        </div>

        {/* Client-rendered selected-file card — populated by split-form.js */}
        <div
          id="selected-file-card"
          data-testid="selected-file-card"
          aria-live="polite"
        />

        <p
          id="split-file-rejection"
          data-testid="split-file-rejection"
          class="hidden text-xs text-red-600"
        />

        <button
          id="split-btn"
          data-testid="split-button"
          type="submit"
          disabled
          class="mt-2 inline-flex w-fit items-center rounded bg-accent px-5 py-2.5 font-sans text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent"
        >
          Split PDF
        </button>

        <p
          id="split-hint"
          data-testid="split-hint"
          class="text-sm text-muted"
        >
          Select a valid PDF (max 50 MB) to split.
        </p>
      </form>

      <div
        id="split-indicator"
        class="htmx-indicator mt-4 text-sm text-ink-soft"
      >
        Splitting…
      </div>

      <div id="split-result" />
    </Layout>
  );
};

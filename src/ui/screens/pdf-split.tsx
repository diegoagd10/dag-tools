/** @jsxImportSource hono/jsx */

import { Layout } from "@/ui/layout";

export const PdfSplit = ({ currentPath }: { currentPath?: string }) => {
  return (
    <Layout title="PDF Split — dag-tools" currentPath={currentPath}>
      <h1 class="font-sans text-4xl font-medium tracking-[-0.01em] text-ink">
        PDF Split
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
        <div class="flex flex-col gap-2">
          <label
            for="split-file-input"
            data-testid="split-file-label"
            class="font-sans text-sm font-medium text-ink"
          >
            Source PDF
          </label>
          <input
            id="split-file-input"
            data-testid="split-file-input"
            type="file"
            name="file"
            accept=".pdf"
            class="block w-full rounded border border-hairline bg-paper px-3 py-2 font-sans text-sm text-ink file:mr-3 file:rounded file:border-0 file:bg-accent/10 file:px-3 file:py-1 file:font-sans file:text-sm file:font-medium file:text-accent hover:file:bg-accent/20"
          />
          <p
            id="split-file-rejection"
            data-testid="split-file-rejection"
            class="hidden text-xs text-red-600"
          />
        </div>

        {/* File Summary — hidden until a valid Source PDF is chosen.
            Populated client-side from POST /api/v1/pdf/split/validate
            (pageCount, size, name). Read-only: no second PDF parse on
            the client, no inputs. */}
        <section
          id="split-file-summary"
          data-testid="split-file-summary"
          class="hidden mt-2 rounded border border-hairline bg-paper px-4 py-3"
          aria-live="polite"
        >
          <p
            id="split-summary-name"
            data-testid="split-summary-name"
            class="font-sans text-sm font-medium text-ink"
          />
          <p
            id="split-summary-meta"
            data-testid="split-summary-meta"
            class="mt-1 font-sans text-xs text-muted tabular-nums"
          />
          <p
            id="split-summary-task-line"
            data-testid="split-summary-task-line"
            class="mt-2 font-sans text-xs text-ink-soft"
          >
            Task PDF Splitting · Mode Extract All · Output{" "}
            <span
              id="split-summary-output"
              data-testid="split-summary-output"
            >
              N Files (.zip)
            </span>
          </p>
        </section>

        <button
          id="split-btn"
          data-testid="split-button"
          type="submit"
          disabled
          class="mt-2 inline-flex w-fit items-center rounded bg-accent px-5 py-2.5 font-sans text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent"
        >
          Split
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

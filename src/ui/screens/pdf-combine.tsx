/** @jsxImportSource hono/jsx */

import { Layout } from "@/ui/layout";
import { SourcePdfRow } from "@/ui/components/source-pdf-row";

export const PdfCombine = () => {
  return (
    <Layout title="PDF Combine — dag-tools">
      <h1 class="font-sans text-4xl font-medium tracking-[-0.01em] text-ink">
        PDF Combine
      </h1>
      <p class="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
        Upload two or more Source PDFs to merge them into a single Combined
        PDF. Drag the rows to set the Merge Order.
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
        <div id="source-rows" data-testid="source-rows" class="flex flex-col gap-3">
          <SourcePdfRow index={1} />
          <SourcePdfRow index={2} />
        </div>

        <button
          id="add-file-btn"
          data-testid="add-file-button"
          type="button"
          hx-get="/pdf/combine/row?index=0"
          hx-target="#source-rows"
          hx-swap="beforeend"
          class="inline-flex w-fit items-center rounded border border-dashed border-accent/40 px-3 py-1.5 font-sans text-xs text-accent transition-colors duration-150 hover:border-accent hover:bg-accent/5"
        >
          + Add file
        </button>

        <div id="size-info" class="text-xs text-muted">
          Running total:{" "}
          <span id="running-total" data-testid="running-total" class="tabular-nums text-ink">
            0 / 50 MB
          </span>
        </div>

        <button
          id="combine-btn"
          data-testid="combine-button"
          type="submit"
          disabled
          class="mt-2 inline-flex w-fit items-center rounded bg-accent px-5 py-2.5 font-sans text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent"
        >
          Combine
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

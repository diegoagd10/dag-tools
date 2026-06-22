/** @jsxImportSource hono/jsx */

import { Layout } from "./Layout";

export const PdfCombine = () => {
  return (
    <Layout title="PDF Combine — dag-tools">
      <h1 class="font-sans text-4xl font-medium tracking-[-0.01em] text-ink">
        PDF Combine
      </h1>
      <p class="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
        Upload two or more PDFs to merge them into a single document.
      </p>

      <form
        hx-post="/api/v1/pdf/combine"
        hx-target="#combine-result"
        hx-swap="outerHTML"
        hx-encoding="multipart/form-data"
        hx-indicator="#combine-indicator"
        class="mt-8 flex w-full max-w-xl flex-col gap-4"
      >
        <div class="flex flex-col gap-2">
          <label class="font-sans text-sm font-medium text-ink-soft">
            Source PDF 1
          </label>
          <input
            type="file"
            name="files[]"
            accept=".pdf,application/pdf"
            required
            class="rounded border border-hairline bg-paper px-3 py-2 text-sm text-ink file:mr-3 file:rounded file:border-0 file:bg-accent/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-accent hover:file:bg-accent/20"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-sans text-sm font-medium text-ink-soft">
            Source PDF 2
          </label>
          <input
            type="file"
            name="files[]"
            accept=".pdf,application/pdf"
            required
            class="rounded border border-hairline bg-paper px-3 py-2 text-sm text-ink file:mr-3 file:rounded file:border-0 file:bg-accent/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-accent hover:file:bg-accent/20"
          />
        </div>

        <button
          type="submit"
          class="mt-2 inline-flex w-fit items-center rounded bg-accent px-5 py-2.5 font-sans text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
        >
          Combine
        </button>
      </form>

      <div id="combine-indicator" class="htmx-indicator mt-4 text-sm text-ink-soft">
        Combining…
      </div>

      <div id="combine-result" />
    </Layout>
  );
};

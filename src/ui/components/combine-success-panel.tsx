/** @jsxImportSource hono/jsx */

export const CombineSuccessPanel = ({
  id,
  filename,
  pageCount: _pageCount,
}: {
  id: string;
  filename: string;
  pageCount?: number;
}) => {
  return (
    <div id="combine-result">
      <div class="mt-8 flex flex-col items-center gap-4 rounded-lg border border-combine-border bg-combine-surface p-8 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-8 w-8 text-combine-accent"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <h2 class="font-display text-xl font-semibold tracking-[-0.005em] text-combine-primary">
          Files Combined Successfully
        </h2>
        <p class="text-sm leading-relaxed text-combine-secondary">
          Your Combined PDF{" "}
          <span class="font-mono text-combine-primary">{filename}</span> is ready.
        </p>
        <div class="mt-2 flex items-center gap-3">
          <a
            href={`/pdf/combine/${id}`}
            download
            class="inline-flex items-center rounded bg-combine-accent px-5 py-2.5 font-sans text-sm font-medium text-combine-cta transition-colors duration-150 hover:bg-combine-cta"
          >
            Download Combined PDF
          </a>
          <a
            href="/pdf/combine"
            class="inline-flex items-center rounded border border-combine-border bg-combine-surface px-5 py-2.5 font-sans text-sm font-medium text-combine-primary transition-colors duration-150 hover:bg-combine-icon-tile"
          >
            Combine More Files
          </a>
        </div>
      </div>
    </div>
  );
};

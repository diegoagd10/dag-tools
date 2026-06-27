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
      <div class="mt-8 flex flex-col items-center gap-4 rounded-lg border border-hairline bg-surface p-8 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-8 w-8 text-accent"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <h2 class="font-sans text-xl font-medium tracking-[-0.005em] text-ink">
          Files Combined Successfully
        </h2>
        <p class="text-sm leading-relaxed text-ink-soft">
          Your Combined PDF{" "}
          <span class="font-mono text-ink">{filename}</span> is ready.
        </p>
        <div class="mt-2 flex items-center gap-3">
          <a
            href={`/pdf/combine/${id}`}
            download
            class="inline-flex items-center rounded bg-accent px-5 py-2.5 font-sans text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
          >
            Download Combined PDF
          </a>
          <a
            href="/pdf/combine"
            class="inline-flex items-center rounded border border-hairline bg-paper px-5 py-2.5 font-sans text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface"
          >
            Combine More Files
          </a>
        </div>
      </div>
    </div>
  );
};

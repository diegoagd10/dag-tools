/** @jsxImportSource hono/jsx */

export const SplitSuccessPanel = ({
  id,
  filename,
  pageCount,
}: {
  id: string;
  filename: string;
  pageCount?: number;
}) => {
  const pagesLabel =
    pageCount != null ? `${pageCount} page${pageCount !== 1 ? "s" : ""}` : null;

  return (
    <div id="split-result">
      <div class="mt-8 flex flex-col items-center gap-4 rounded-lg border border-split-border bg-split-surface p-8 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-8 w-8 text-split-accent"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <h2 class="font-sans text-lg font-medium tracking-[-0.005em] text-split-primary">
          Files Split Successfully
        </h2>
        <p class="text-sm leading-relaxed text-split-secondary">
          Your Split ZIP archive{" "}
          <span class="font-mono text-split-primary">{filename}</span>
          {pagesLabel != null ? (
            <span>
              {" "}
              (<span class="tabular-nums text-split-primary">{pagesLabel}</span>)
            </span>
          ) : null}{" "}
          is ready.
        </p>
        <div class="mt-2 flex items-center gap-3">
          <a
            href={`/pdf/split/${id}`}
            download
            target="_blank"
            class="inline-flex items-center rounded bg-split-cta px-5 py-2.5 font-sans text-sm font-medium text-white transition-colors duration-150 hover:bg-split-cta/80"
          >
            Download Files (ZIP)
          </a>
          <a
            href="/pdf/split"
            class="inline-flex items-center rounded border border-split-border bg-split-surface px-5 py-2.5 font-sans text-sm font-medium text-split-primary transition-colors duration-150 hover:bg-split-surface/80"
          >
            Return to Split Tool
          </a>
        </div>
      </div>
    </div>
  );
};

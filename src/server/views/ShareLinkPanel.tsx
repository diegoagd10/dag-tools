/** @jsxImportSource hono/jsx */

export const ShareLinkPanel = ({
  id,
  filename,
  pageCount,
}: {
  id: string;
  filename: string;
  pageCount?: number;
}) => {
  const url = `/pdf/combine/${id}`;
  const pagesLabel =
    pageCount != null ? `${pageCount} page${pageCount !== 1 ? "s" : ""}` : null;
  return (
    <div id="combine-result">
      <div class="mt-6 rounded-lg border border-hairline bg-surface p-6">
        <h2 class="font-sans text-lg font-medium tracking-[-0.005em] text-ink">
          Combined PDF ready
        </h2>
        <p class="mt-2 text-sm leading-relaxed text-ink-soft">
          Your merged document <span class="font-mono text-ink">{filename}</span>{" "}
          {pagesLabel != null ? (
            <span>
              (<span class="tabular-nums text-ink">{pagesLabel}</span>){" "}
            </span>
          ) : null}
          is ready. Share the link below — anyone with it can download the file.
        </p>
        <div class="mt-4 flex items-center gap-3">
          <input
            type="text"
            value={url}
            readonly
            class="flex-1 rounded border border-hairline bg-paper px-3 py-2 font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <a
            href={url}
            class="inline-flex items-center rounded bg-accent px-4 py-2 font-sans text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
          >
            Open
          </a>
        </div>
      </div>
    </div>
  );
};

/** @jsxImportSource hono/jsx */

export const SourcePdfRow = ({ index }: { index: number }) => {
  return (
    <div class="source-pdf-row flex items-center gap-3 rounded border border-hairline bg-paper px-3 py-2" data-testid="source-pdf-row">
      <div
        class="sortable-grip shrink-0 cursor-grab text-muted hover:text-ink"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          class="h-4 w-4"
        >
          <line x1="5" y1="3" x2="5" y2="13" />
          <line x1="9" y1="3" x2="9" y2="13" />
        </svg>
      </div>
      <div class="flex-1 flex flex-col gap-1">
        <label class="font-sans text-xs font-medium text-ink-soft">
          Source PDF {index}
        </label>
        <input
          type="file"
          name="files[]"
          accept=".pdf,application/pdf"
            class="w-full text-sm text-ink file:mr-3 file:rounded file:border-0 file:bg-accent/10 file:px-2 file:py-1 file:text-xs file:font-medium file:text-accent hover:file:bg-accent/20"
          />
          <span class="file-size hidden text-xs text-muted mt-0.5 tabular-nums"></span>
      </div>
      <button
        type="button"
        class="remove-row shrink-0 rounded p-1 text-muted transition-colors hover:text-red-600 hover:bg-red-50"
        aria-label="Remove this row"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-4 w-4"
        >
          <line x1="4" y1="4" x2="12" y2="12" />
          <line x1="12" y1="4" x2="4" y2="12" />
        </svg>
      </button>
    </div>
  );
};

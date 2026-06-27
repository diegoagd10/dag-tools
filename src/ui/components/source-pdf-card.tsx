/** @jsxImportSource hono/jsx */

/**
 * Client-rendered card template for a single Source PDF in the Selected Files list.
 * Rendered by combine-form.js via Selection controller — not server-rendered.
 * This file documents the card structure the JS produces.
 */
export const SourcePdfCard = ({
  id,
  name,
  size,
  status,
  reason,
}: {
  id: string;
  name: string;
  size: string;
  status: "pending" | "valid" | "invalid";
  reason?: string;
}) => (
  <div
    class="source-card flex items-center gap-3 rounded border border-hairline bg-paper px-3 py-2"
    data-testid="source-card"
    data-id={id}
  >
    <div
      class="drag-handle shrink-0 cursor-grab text-muted hover:text-ink"
      data-testid="drag-handle"
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-4 w-4 shrink-0 text-accent"
      aria-hidden="true"
    >
      <path d="M14 11V3H6" />
      <path d="M14 3L8 9L5 6L2 9" />
    </svg>
    <div class="flex-1 min-w-0 flex flex-col gap-0.5">
      <span class="card-name truncate font-sans text-sm text-ink">{name}</span>
      <span class="card-size font-sans text-xs text-muted tabular-nums">
        {size}
      </span>
      {reason ? (
        <span
          class="card-rejection text-xs text-red-600"
          data-testid="card-rejection"
        >
          {reason}
        </span>
      ) : null}
    </div>
    <button
      type="button"
      class="remove-card shrink-0 rounded p-1 text-muted transition-colors hover:text-red-600 hover:bg-red-50"
      data-testid="remove-card-button"
      aria-label="Remove this Source PDF"
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

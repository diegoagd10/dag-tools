"use client";

import { useCombinePdfStore } from "@/lib/combine-pdf/store";

export function SourcePdfList() {
  const sourcePdfs = useCombinePdfStore((s) => s.sourcePdfs);
  const removeSourcePdf = useCombinePdfStore((s) => s.removeSourcePdf);

  if (sourcePdfs.length === 0) return null;

  return (
    <ul data-testid="source-pdf-list" className="flex flex-col gap-2">
      {sourcePdfs.map((pdf) => (
        <li
          key={pdf.id}
          className="flex items-center justify-between rounded-md border border-zinc-200 px-4 py-2 dark:border-zinc-800"
        >
          <span className="truncate">{pdf.name}</span>
          <button
            type="button"
            onClick={() => removeSourcePdf(pdf.id)}
            aria-label={`Remove ${pdf.name}`}
            className="text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}

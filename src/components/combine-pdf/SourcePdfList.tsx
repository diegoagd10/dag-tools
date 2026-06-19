"use client";

import { useState } from "react";
import { useCombinePdfStore } from "@/lib/combine-pdf/store";
import {
  REJECTION_MESSAGES,
  formatBytes,
  type PerFileRejectionReason,
} from "@/lib/combine-pdf/constants";

interface SourcePdfListProps {
  rejectionByPdfId: Map<string, PerFileRejectionReason>;
}

function classNames(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function GripIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 16"
      fill="currentColor"
      className="h-4 w-3 text-muted"
    >
      <circle cx="3" cy="3" r="1" />
      <circle cx="9" cy="3" r="1" />
      <circle cx="3" cy="8" r="1" />
      <circle cx="9" cy="8" r="1" />
      <circle cx="3" cy="13" r="1" />
      <circle cx="9" cy="13" r="1" />
    </svg>
  );
}

export function SourcePdfList({ rejectionByPdfId }: SourcePdfListProps) {
  const sourcePdfs = useCombinePdfStore((s) => s.sourcePdfs);
  const removeSourcePdf = useCombinePdfStore((s) => s.removeSourcePdf);
  const reorder = useCombinePdfStore((s) => s.reorder);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  if (sourcePdfs.length === 0) return null;

  function handleDrop(targetIndex: number) {
    if (dragIndex !== null && dragIndex !== targetIndex) {
      reorder(dragIndex, targetIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <section
      aria-labelledby="source-list-heading"
      className="flex flex-col gap-4"
    >
      <div className="flex items-baseline justify-between">
        <h3
          id="source-list-heading"
          className="font-display text-sm font-medium tracking-[-0.005em] text-ink-soft"
        >
          Merge order
        </h3>
        <span className="font-mono text-[11px] text-muted">
          {sourcePdfs.length} {sourcePdfs.length === 1 ? "file" : "files"}
        </span>
      </div>

      <ul data-testid="source-pdf-list" className="flex flex-col gap-1.5">
        {sourcePdfs.map((pdf, index) => {
          const isDragging = dragIndex === index;
          const isDropTarget =
            overIndex === index && dragIndex !== null && !isDragging;
          const rejection = rejectionByPdfId.get(pdf.id);

          return (
            <li
              key={pdf.id}
              draggable
              data-testid="source-pdf-row"
              aria-label={`${pdf.name}, row ${index + 1} of ${sourcePdfs.length}`}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(index);
              }}
              onDragLeave={() => {
                setOverIndex((current) => (current === index ? null : current));
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(index);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={classNames(
                "group flex select-none items-center gap-4 rounded-md border bg-surface px-4 py-3 transition-all duration-150",
                "cursor-grab active:cursor-grabbing",
                isDragging
                  ? "border-accent opacity-50 shadow-md"
                  : isDropTarget
                    ? "border-accent shadow-sm ring-1 ring-accent/30"
                    : "border-hairline hover:border-ink-soft",
                rejection && "border-danger/50",
              )}
            >
              <div className="flex w-7 shrink-0 flex-col items-center gap-1">
                <GripIcon />
              </div>

              <span
                aria-hidden="true"
                className="font-mono text-xs font-medium tabular-nums text-accent"
              >
                {formatIndex(index)}
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm text-ink">{pdf.name}</span>
                {!rejection && (
                  <span className="font-mono text-[11px] tabular-nums text-muted">
                    {pdf.pageCount} {pdf.pageCount === 1 ? "page" : "pages"} ·{" "}
                    {formatBytes(pdf.size)}
                  </span>
                )}
                {rejection && (
                  <span
                    data-testid={`rejection-${pdf.id}`}
                    className="text-xs text-danger"
                  >
                    {REJECTION_MESSAGES[rejection]}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeSourcePdf(pdf.id)}
                aria-label={`Remove ${pdf.name}`}
                data-testid={`remove-${pdf.id}`}
                className="shrink-0 rounded-sm px-2 py-1 font-mono text-[11px] text-muted underline-offset-4 transition-colors duration-150 hover:text-ink hover:underline"
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

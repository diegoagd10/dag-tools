"use client";

import { useState } from "react";
import { useCombinePdfStore } from "@/lib/combine-pdf/store";

export function SourcePdfList() {
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
    <ul data-testid="source-pdf-list" className="flex flex-col gap-2">
      {sourcePdfs.map((pdf, index) => {
        const isDragging = dragIndex === index;
        const isDropTarget =
          overIndex === index && dragIndex !== null && !isDragging;

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
            className={[
              "flex items-center justify-between rounded-md border px-4 py-2 transition-colors",
              "cursor-grab active:cursor-grabbing dark:border-zinc-800",
              isDragging
                ? "border-blue-500 opacity-40"
                : "border-zinc-200",
              isDropTarget
                ? "border-t-4 border-t-blue-500 border-blue-500"
                : "",
            ].join(" ")}
          >
            <span className="truncate">{pdf.name}</span>
            <button
              type="button"
              onClick={() => removeSourcePdf(pdf.id)}
              aria-label={`Remove ${pdf.name}`}
              data-testid={`remove-${pdf.id}`}
              className="text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Remove
            </button>
          </li>
        );
      })}
    </ul>
  );
}

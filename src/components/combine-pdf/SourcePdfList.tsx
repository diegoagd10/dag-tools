"use client";

import { useState } from "react";
import { useCombinePdfStore } from "@/lib/combine-pdf/store";
import { REJECTION_MESSAGES, type PerFileRejectionReason } from "@/lib/combine-pdf/constants";

interface SourcePdfListProps {
  rejectionByPdfId: Map<string, PerFileRejectionReason>;
}

function classNames(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
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
    <ul data-testid="source-pdf-list" className="flex flex-col gap-2">
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
              "flex items-start justify-between gap-4 rounded-md border px-4 py-2 transition-colors",
              "cursor-grab active:cursor-grabbing dark:border-zinc-800",
              isDragging && "border-blue-500 opacity-40",
              !isDragging && !rejection && "border-zinc-200",
              isDropTarget && "border-t-4 border-t-blue-500 border-blue-500",
              rejection && "border-red-300 dark:border-red-800",
            )}
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate">{pdf.name}</span>
              {rejection && (
                <span
                  data-testid={`rejection-${pdf.id}`}
                  className="text-sm text-red-600 dark:text-red-400"
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
              className="shrink-0 text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Remove
            </button>
          </li>
        );
      })}
    </ul>
  );
}

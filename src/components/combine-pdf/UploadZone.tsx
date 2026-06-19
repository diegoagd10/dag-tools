"use client";

import { useRef, useState } from "react";
import { PdfIcon } from "@/components/tool-icons";
import { useCombinePdfStore } from "@/lib/combine-pdf/store";
import {
  TOTAL_SIZE_LIMIT_BYTES,
  formatBytes,
} from "@/lib/combine-pdf/constants";

interface UploadZoneProps {
  runningTotalBytes: number;
}

export function UploadZone({ runningTotalBytes }: UploadZoneProps) {
  const addFiles = useCombinePdfStore((s) => s.addFiles);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fillRatio = Math.min(
    runningTotalBytes / TOTAL_SIZE_LIMIT_BYTES,
    1,
  );

  return (
    <div className="flex flex-col gap-4">
      <div
        data-testid="upload-zone"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          void addFiles(Array.from(e.dataTransfer.files));
        }}
        className={[
          "relative flex flex-col items-center gap-5 rounded-lg border border-dashed border-white/10 bg-paper px-6 py-14 text-center transition-colors duration-200",
          isDragOver ? "border-accent bg-accent/10" : "",
        ].join(" ")}
      >
        <PdfIcon className="h-10 w-10 text-ink-soft" />
        <div className="flex flex-col gap-1.5">
          <p className="font-sans text-xl font-medium text-ink">
            {isDragOver ? "Release to add" : "Drop PDFs here"}
          </p>
          <p className="text-sm text-muted">
            Up to 50&nbsp;MB combined · 2 or more files
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-transparent px-5 text-sm font-medium text-ink transition-colors duration-150 hover:border-white/20 hover:bg-white/5"
        >
          Browse files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          aria-label="Choose PDF files"
          data-testid="pdf-file-input"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void addFiles(Array.from(e.target.files));
            e.target.value = "";
          }}
        />
      </div>

      {runningTotalBytes > 0 && (
        <div className="flex flex-col gap-2">
          <div
            aria-hidden="true"
            className="h-1 w-full overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full bg-accent transition-[width] duration-300"
              style={{ width: `${fillRatio * 100}%` }}
            />
          </div>
          <div
            data-testid="running-total"
            className="flex items-baseline justify-between text-xs text-muted"
          >
            <span>Total</span>
            <span>
              {formatBytes(runningTotalBytes)} /{" "}
              {formatBytes(TOTAL_SIZE_LIMIT_BYTES)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

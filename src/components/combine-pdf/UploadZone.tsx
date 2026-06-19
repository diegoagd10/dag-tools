"use client";

import { useRef } from "react";
import { useCombinePdfStore } from "@/lib/combine-pdf/store";
import { TOTAL_SIZE_LIMIT_BYTES, formatBytes } from "@/lib/combine-pdf/constants";

interface UploadZoneProps {
  runningTotalBytes: number;
}

export function UploadZone({ runningTotalBytes }: UploadZoneProps) {
  const addFiles = useCombinePdfStore((s) => s.addFiles);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-4">
      <div
        data-testid="upload-zone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void addFiles(Array.from(e.dataTransfer.files));
        }}
        className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700"
      >
        <p className="text-zinc-600 dark:text-zinc-400">
          Drag and drop PDF files here
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-foreground px-5 py-2 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Browse
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          data-testid="pdf-file-input"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void addFiles(Array.from(e.target.files));
            e.target.value = "";
          }}
        />
      </div>
      {runningTotalBytes > 0 && (
        <p
          data-testid="running-total"
          className="text-sm text-zinc-500 dark:text-zinc-400"
        >
          {formatBytes(runningTotalBytes)} / {formatBytes(TOTAL_SIZE_LIMIT_BYTES)}
        </p>
      )}
    </div>
  );
}

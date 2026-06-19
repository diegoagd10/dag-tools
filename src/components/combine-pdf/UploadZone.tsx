"use client";

import { useRef } from "react";
import { useCombinePdfStore } from "@/lib/combine-pdf/store";

export function UploadZone() {
  const addFiles = useCombinePdfStore((s) => s.addFiles);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | File[]) {
    addFiles(Array.from(files));
  }

  return (
    <div
      data-testid="upload-zone"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
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
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

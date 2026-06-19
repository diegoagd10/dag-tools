"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCombinePdfStore } from "@/lib/combine-pdf/store";

export default function CombinePdfResultPage() {
  const combinedPdf = useCombinePdfStore((s) => s.combinedPdf);
  const downloadUrl = useMemo(
    () =>
      combinedPdf ? URL.createObjectURL(combinedPdf.blob) : null,
    [combinedPdf],
  );

  if (!combinedPdf) {
    return (
      <main className="flex w-full max-w-2xl flex-col gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          No merge to show
        </h1>
        <Link href="/tools/combine-pdf" className="text-foreground underline">
          Back to Combine PDFs
        </Link>
      </main>
    );
  }

  return (
    <main className="flex w-full max-w-2xl flex-col gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        Your Combined PDF is ready
      </h1>
      <a
        href={downloadUrl ?? undefined}
        download={combinedPdf.filename}
        data-testid="download-button"
        className="inline-flex h-12 w-fit items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Download
      </a>
      <Link href="/tools/combine-pdf" className="text-foreground underline">
        Back to Combine PDFs
      </Link>
    </main>
  );
}

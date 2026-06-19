"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UploadZone } from "@/components/combine-pdf/UploadZone";
import { SourcePdfList } from "@/components/combine-pdf/SourcePdfList";
import { useCombinePdfStore } from "@/lib/combine-pdf/store";
import { validate } from "@/lib/combine-pdf/validate";
import { merge } from "@/lib/combine-pdf/merge";
import { MIN_SOURCE_PDF_COUNT, buildCombinedPdfFilename } from "@/lib/combine-pdf/constants";
import type { PerFileRejectionReason } from "@/lib/combine-pdf/constants";

export default function CombinePdfPage() {
  const router = useRouter();
  const sourcePdfs = useCombinePdfStore((s) => s.sourcePdfs);
  const setCombinedPdf = useCombinePdfStore((s) => s.setCombinedPdf);
  const [isCombining, setIsCombining] = useState(false);

  const { accepted, rejected } = validate(sourcePdfs);
  const canCombine = accepted.length >= MIN_SOURCE_PDF_COUNT;

  const rejectionByPdfId = new Map<string, PerFileRejectionReason>();
  for (const entry of rejected) {
    if (entry.id && entry.reason !== "min-count") {
      rejectionByPdfId.set(entry.id, entry.reason);
    }
  }

  const runningTotalBytes = accepted.reduce((sum, pdf) => sum + pdf.size, 0);

  async function handleCombine() {
    if (!canCombine || isCombining) return;
    setIsCombining(true);
    try {
      const bytes = await merge(accepted, accepted.map((p) => p.id));
      const blob = new Blob([new Uint8Array(bytes)], {
        type: "application/pdf",
      });
      setCombinedPdf({ blob, filename: buildCombinedPdfFilename() });
      router.push("/tools/combine-pdf/result");
    } finally {
      setIsCombining(false);
    }
  }

  return (
    <main className="flex w-full max-w-2xl flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Combine PDFs</h1>
      <UploadZone runningTotalBytes={runningTotalBytes} />
      <SourcePdfList rejectionByPdfId={rejectionByPdfId} />
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleCombine}
          disabled={!canCombine || isCombining}
          data-testid="combine-button"
          className="h-12 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {isCombining ? "Combining..." : "Combine"}
        </button>
        {!canCombine && !isCombining && (
          <p className="text-sm text-zinc-500" data-testid="combine-hint">
            Add at least {MIN_SOURCE_PDF_COUNT} PDFs to combine.
          </p>
        )}
      </div>
    </main>
  );
}

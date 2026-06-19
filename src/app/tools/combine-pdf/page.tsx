"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { UploadZone } from "@/components/combine-pdf/UploadZone";
import { SourcePdfList } from "@/components/combine-pdf/SourcePdfList";
import { useCombinePdfStore } from "@/lib/combine-pdf/store";
import { validate } from "@/lib/combine-pdf/validate";
import { merge } from "@/lib/combine-pdf/merge";
import {
  MIN_SOURCE_PDF_COUNT,
  buildCombinedPdfFilename,
  createCombinedPdf,
} from "@/lib/combine-pdf/constants";
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
      const bytes = await merge(accepted);
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const pageCount = accepted.reduce((sum, pdf) => sum + pdf.pageCount, 0);
      setCombinedPdf(createCombinedPdf(blob, buildCombinedPdfFilename(), pageCount));
      router.push("/tools/combine-pdf/result");
    } finally {
      setIsCombining(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-6 pt-8 pb-24 sm:pt-10">
      <nav className="mb-10">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted transition-colors duration-150 hover:text-ink"
        >
          Back to catalog
        </Link>
      </nav>

      <header className="flex flex-col gap-4">
        <h1 className="font-sans text-4xl font-medium leading-[1.04] tracking-[-0.028em] text-ink sm:text-5xl">
          Combine your <span className="text-accent">PDFs</span>.
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-ink-soft">
          Add two or more PDFs, drag the rows to set the merge order, then
          combine. Everything runs locally in your browser.
        </p>
      </header>

      <section className="mt-10 flex flex-col gap-8 rounded-lg bg-surface p-6">
        <UploadZone runningTotalBytes={runningTotalBytes} />
        <SourcePdfList rejectionByPdfId={rejectionByPdfId} />
      </section>

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleCombine}
          disabled={!canCombine || isCombining}
          data-testid="combine-button"
          className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 text-sm font-medium text-accent-ink transition-colors duration-150 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-accent"
        >
          {isCombining ? "Combining…" : "Combine files"}
        </button>
        {!canCombine && !isCombining && (
          <p className="text-sm text-muted" data-testid="combine-hint">
            Add at least {MIN_SOURCE_PDF_COUNT} PDFs to combine.
          </p>
        )}
      </div>
    </main>
  );
}

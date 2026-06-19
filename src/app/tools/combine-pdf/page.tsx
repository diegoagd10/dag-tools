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
          className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
        >
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          >
            ←
          </span>
          Back to catalog
        </Link>
      </nav>

      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-medium text-accent">01</span>
          <span aria-hidden="true" className="h-3 w-px bg-hairline" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Combine · PDF
          </span>
        </div>
        <h1 className="font-display text-4xl font-medium leading-[1.04] tracking-[-0.028em] text-ink sm:text-5xl">
          Combine your <em className="font-display italic text-accent">PDFs</em>.
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-ink-soft">
          Add two or more PDFs, drag the rows to set the merge order, then
          combine. Everything runs locally in your browser.
        </p>
      </header>

      <section className="mt-10 flex flex-col gap-8 rounded-lg border border-hairline bg-surface-raised p-6 shadow-sm sm:p-8">
        <UploadZone runningTotalBytes={runningTotalBytes} />
        <SourcePdfList rejectionByPdfId={rejectionByPdfId} />
      </section>

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleCombine}
          disabled={!canCombine || isCombining}
          data-testid="combine-button"
          className="group inline-flex h-14 items-center justify-between gap-3 rounded-md bg-accent px-6 font-mono text-xs uppercase tracking-[0.14em] text-accent-ink shadow-sm transition-all duration-200 hover:bg-accent-soft hover:shadow-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-accent disabled:hover:shadow-sm"
        >
          <span className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-full bg-accent-ink"
            />
            {isCombining ? "Combining…" : "Combine files"}
          </span>
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-1 group-disabled:translate-x-0"
          >
            →
          </span>
        </button>
        {!canCombine && !isCombining && (
          <p
            className="font-mono text-[11px] text-muted"
            data-testid="combine-hint"
          >
            Add at least {MIN_SOURCE_PDF_COUNT} PDFs to combine.
          </p>
        )}
      </div>
    </main>
  );
}

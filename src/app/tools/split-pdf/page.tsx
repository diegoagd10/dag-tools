"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSplitPdfStore } from "@/lib/split-pdf/store";
import { validate } from "@/lib/split-pdf/validate";
import { split } from "@/lib/split-pdf/split";
import { formatBytes, buildSplitZipFilename, createSplitResult } from "@/lib/split-pdf/constants";

function PageStack() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
      className="h-10 w-10 text-ink-soft"
    >
      <rect x="10" y="14" width="26" height="30" rx="2" />
      <rect x="14" y="10" width="26" height="30" rx="2" />
      <rect x="18" y="6" width="26" height="30" rx="2" />
    </svg>
  );
}

export default function SplitPdfPage() {
  const router = useRouter();
  const sourcePdf = useSplitPdfStore((s) => s.sourcePdf);
  const setSourcePdf = useSplitPdfStore((s) => s.setSourcePdf);
  const setSplitResult = useSplitPdfStore((s) => s.setSplitResult);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);

  const { accepted } = validate(sourcePdf);

  async function handleFiles(files: FileList | File[]) {
    const file = Array.from(files)[0];
    if (file) await setSourcePdf(file);
  }

  async function handleSplit() {
    if (!accepted || isSplitting || !sourcePdf) return;
    setIsSplitting(true);
    try {
      const bytes = await split(sourcePdf.file);
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/zip" });
      setSplitResult(
        createSplitResult(blob, buildSplitZipFilename(), sourcePdf.pageCount),
      );
      router.push("/tools/split-pdf/result");
    } finally {
      setIsSplitting(false);
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
          <span className="font-mono text-xs font-medium text-accent">02</span>
          <span aria-hidden="true" className="h-3 w-px bg-hairline" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Split · PDF
          </span>
        </div>
        <h1 className="font-display text-4xl font-medium leading-[1.04] tracking-[-0.028em] text-ink sm:text-5xl">
          Split your <em className="font-display italic text-accent">PDF</em>.
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-ink-soft">
          Upload a PDF and split it into one file per page, bundled as a ZIP.
          Everything runs locally in your browser.
        </p>
      </header>

      <section className="mt-10 flex flex-col gap-8 rounded-lg border border-hairline bg-surface-raised p-6 shadow-sm sm:p-8">
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
            void handleFiles(e.dataTransfer.files);
          }}
          className={[
            "relative flex flex-col items-center gap-5 rounded-md border border-dashed bg-surface-sunken px-6 py-14 text-center transition-colors duration-200",
            isDragOver
              ? "border-accent bg-accent/5"
              : "border-hairline-strong hover:border-ink-soft",
          ].join(" ")}
        >
          <PageStack />
          <div className="flex flex-col gap-1.5">
            <p className="font-display text-xl font-medium tracking-[-0.012em] text-ink">
              {isDragOver ? "Release to add" : "Drop a PDF here"}
            </p>
            <p className="text-sm text-muted">Up to 50&nbsp;MB · one file</p>
          </div>
          <span
            aria-hidden="true"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted"
          >
            — or —
          </span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-10 items-center justify-center rounded-md border border-ink bg-transparent px-5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors duration-200 hover:bg-ink hover:text-paper"
          >
            Browse files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            aria-label="Choose a PDF file"
            data-testid="split-pdf-file-input"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {sourcePdf && (
          <div
            data-testid="source-pdf-info"
            className="flex items-center gap-4 rounded-md border border-hairline bg-surface px-4 py-3"
          >
            <span
              aria-hidden="true"
              className="font-mono text-xs font-medium tabular-nums text-accent"
            >
              01
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span
                data-testid="source-filename"
                className="truncate text-sm text-ink"
              >
                {sourcePdf.name}
              </span>
              <span className="font-mono text-[11px] tabular-nums text-muted">
                {sourcePdf.isPdf && !sourcePdf.encrypted && (
                  <>
                    <span data-testid="source-page-count">
                      {sourcePdf.pageCount}{" "}
                      {sourcePdf.pageCount === 1 ? "page" : "pages"}
                    </span>{" "}
                    ·{" "}
                  </>
                )}
                <span data-testid="source-size">
                  {formatBytes(sourcePdf.size)}
                </span>
              </span>
            </div>
          </div>
        )}
      </section>

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleSplit}
          disabled={!accepted || isSplitting}
          data-testid="split-button"
          className="group inline-flex h-14 items-center justify-between gap-3 rounded-md bg-accent px-6 font-mono text-xs uppercase tracking-[0.14em] text-accent-ink shadow-sm transition-all duration-200 hover:bg-accent-soft hover:shadow-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-accent disabled:hover:shadow-sm"
        >
          <span className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-full bg-accent-ink"
            />
            {isSplitting ? "Splitting…" : "Split PDF"}
          </span>
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-1 group-disabled:translate-x-0"
          >
            →
          </span>
        </button>
        {!accepted && !isSplitting && (
          <p
            className="font-mono text-[11px] text-muted"
            data-testid="split-hint"
          >
            Upload a PDF to split.
          </p>
        )}
      </div>
    </main>
  );
}

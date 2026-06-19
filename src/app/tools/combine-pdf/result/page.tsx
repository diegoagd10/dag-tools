"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCombinePdfStore } from "@/lib/combine-pdf/store";
import { formatBytes } from "@/lib/combine-pdf/constants";

function Checkmark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7 text-accent"
    >
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M8 2v9" />
      <path d="M4 8l4 4 4-4" />
      <path d="M2 14h12" />
    </svg>
  );
}

export default function CombinePdfResultPage() {
  const router = useRouter();
  const combinedPdf = useCombinePdfStore((s) => s.combinedPdf);
  const reset = useCombinePdfStore((s) => s.reset);

  function handleCombineMore() {
    reset();
    router.push("/tools/combine-pdf");
  }

  if (!combinedPdf) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col px-6 pt-8 pb-24 sm:pt-10">
        <nav className="mb-10">
          <Link
            href="/tools/combine-pdf"
            className="inline-flex items-center text-sm text-muted transition-colors duration-150 hover:text-ink"
          >
            Back to combine
          </Link>
        </nav>
        <section className="flex flex-col gap-5 rounded-lg bg-surface p-6">
          <h1 className="font-sans text-3xl font-medium leading-[1.05] tracking-[-0.02em] text-ink sm:text-4xl">
            Nothing to show <span className="text-accent">yet</span>.
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-ink-soft">
            Run a combine first, then this page will show the result.
          </p>
          <Link
            href="/tools/combine-pdf"
            className="mt-2 inline-flex w-fit items-center rounded-md border border-white/10 bg-transparent px-5 py-3 text-sm font-medium text-ink transition-colors duration-150 hover:border-white/20 hover:bg-white/5"
          >
            Open combine
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-6 pt-8 pb-24 sm:pt-10">
      <nav className="mb-10">
        <Link
          href="/tools/combine-pdf"
          className="inline-flex items-center text-sm text-muted transition-colors duration-150 hover:text-ink"
        >
          Back to combine
        </Link>
      </nav>

      <header className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-6">
          <h1 className="font-sans text-4xl font-medium leading-[1.04] tracking-[-0.028em] text-ink sm:text-5xl">
            Your combined PDF is{" "}
            <span className="text-accent">ready</span>.
          </h1>
          <Checkmark />
        </div>
      </header>

      <section className="mt-10 rounded-lg bg-surface p-6">
        <dl className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="shrink-0 text-sm text-muted">Filename</dt>
            <dd
              data-testid="combined-filename"
              className="min-w-0 truncate text-right text-sm text-ink"
            >
              {combinedPdf.filename}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="shrink-0 text-sm text-muted">Size</dt>
            <dd
              data-testid="combined-size"
              className="text-sm tabular-nums text-ink"
            >
              {formatBytes(combinedPdf.size)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="shrink-0 text-sm text-muted">Pages</dt>
            <dd
              data-testid="combined-page-count"
              className="text-sm tabular-nums text-ink"
            >
              {combinedPdf.pageCount} pages
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={combinedPdf.url}
          download={combinedPdf.filename}
          data-testid="download-button"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-6 text-sm font-medium text-accent-ink transition-colors duration-150 hover:bg-accent-hover"
        >
          <DownloadIcon />
          Download
        </a>
        <button
          type="button"
          onClick={handleCombineMore}
          data-testid="combine-more-button"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/10 bg-transparent px-6 text-sm font-medium text-ink transition-colors duration-150 hover:border-white/20 hover:bg-white/5"
        >
          Combine more
        </button>
      </div>
    </main>
  );
}

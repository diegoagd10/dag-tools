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

  if (!combinedPdf) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col px-6 pt-8 pb-24 sm:pt-10">
        <nav className="mb-10">
          <Link
            href="/tools/combine-pdf"
            className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
          >
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            >
              ←
            </span>
            Back to combine
          </Link>
        </nav>
        <section className="flex flex-col gap-5 rounded-lg border border-hairline bg-surface-raised p-8 shadow-sm">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            No result
          </span>
          <h1 className="font-display text-3xl font-medium leading-[1.05] tracking-[-0.02em] text-ink sm:text-4xl">
            Nothing to show <em className="font-display italic text-ink-soft">yet</em>.
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-ink-soft">
            Run a combine first, then this page will show the result.
          </p>
          <Link
            href="/tools/combine-pdf"
            className="mt-2 inline-flex w-fit items-center gap-2 rounded-md border border-hairline-strong px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
          >
            Open combine
            <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>
    );
  }

  function handleCombineMore() {
    reset();
    router.push("/tools/combine-pdf");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-6 pt-8 pb-24 sm:pt-10">
      <nav className="mb-10">
        <Link
          href="/tools/combine-pdf"
          className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
        >
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          >
            ←
          </span>
          Back to combine
        </Link>
      </nav>

      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-medium text-accent">01</span>
          <span aria-hidden="true" className="h-3 w-px bg-hairline" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Result
          </span>
        </div>
        <div className="flex items-end justify-between gap-6">
          <h1 className="font-display text-4xl font-medium leading-[1.04] tracking-[-0.028em] text-ink sm:text-5xl">
            Your combined PDF is{" "}
            <em className="font-display italic text-accent">ready</em>.
          </h1>
          <Checkmark />
        </div>
      </header>

      <section className="mt-10 overflow-hidden rounded-lg border border-hairline bg-surface-raised shadow-sm">
        <dl className="divide-y divide-hairline">
          <div className="flex items-baseline justify-between gap-4 px-6 py-4">
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              Filename
            </dt>
            <dd
              data-testid="combined-filename"
              className="truncate text-sm text-ink"
            >
              {combinedPdf.filename}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 px-6 py-4">
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              Size
            </dt>
            <dd
              data-testid="combined-size"
              className="font-mono text-sm tabular-nums text-ink"
            >
              {formatBytes(combinedPdf.size)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 px-6 py-4">
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              Pages
            </dt>
            <dd
              data-testid="combined-page-count"
              className="font-mono text-sm tabular-nums text-ink"
            >
              {combinedPdf.pageCount} pages
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-8 flex flex-wrap items-stretch gap-3">
        <a
          href={combinedPdf.url}
          download={combinedPdf.filename}
          data-testid="download-button"
          className="group inline-flex h-14 items-center justify-center gap-3 rounded-md bg-accent px-6 font-mono text-xs uppercase tracking-[0.14em] text-accent-ink shadow-sm transition-all duration-200 hover:bg-accent-soft hover:shadow-accent"
        >
          <DownloadIcon />
          Download
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          >
            →
          </span>
        </a>
        <button
          type="button"
          onClick={handleCombineMore}
          data-testid="combine-more-button"
          className="inline-flex h-14 items-center justify-center gap-3 rounded-md border border-hairline-strong px-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors duration-200 hover:border-ink"
        >
          Combine more
        </button>
      </div>
    </main>
  );
}

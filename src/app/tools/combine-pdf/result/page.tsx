"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useCombinePdfStore } from "@/lib/combine-pdf/store";
import { formatBytes } from "@/lib/combine-pdf/constants";

export default function CombinePdfResultPage() {
  const router = useRouter();
  const combinedPdf = useCombinePdfStore((s) => s.combinedPdf);
  const reset = useCombinePdfStore((s) => s.reset);
  const downloadUrl = useMemo(
    () => (combinedPdf ? URL.createObjectURL(combinedPdf.blob) : null),
    [combinedPdf],
  );

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

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

  function handleCombineMore() {
    reset();
    router.push("/tools/combine-pdf");
  }

  return (
    <main className="flex w-full max-w-2xl flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        Your Combined PDF is ready
      </h1>
      <dl className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        <div className="flex gap-2">
          <dt className="font-medium text-zinc-900 dark:text-zinc-100">
            Filename:
          </dt>
          <dd data-testid="combined-filename">{combinedPdf.filename}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-zinc-900 dark:text-zinc-100">
            Size:
          </dt>
          <dd data-testid="combined-size">
            {formatBytes(combinedPdf.size)}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-zinc-900 dark:text-zinc-100">
            Pages:
          </dt>
          <dd data-testid="combined-page-count">
            {combinedPdf.pageCount} pages
          </dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-3">
        <a
          href={downloadUrl ?? undefined}
          download={combinedPdf.filename}
          data-testid="download-button"
          className="inline-flex h-12 w-fit items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Download
        </a>
        <button
          type="button"
          onClick={handleCombineMore}
          data-testid="combine-more-button"
          className="inline-flex h-12 w-fit items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
        >
          Combine more
        </button>
      </div>
    </main>
  );
}

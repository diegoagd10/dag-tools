import Link from "next/link";
import { ToolIcon } from "@/components/tool-icons";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col px-6 pt-10 pb-24 sm:pt-16">
      <section className="flex flex-col gap-8">
        <h1 className="font-sans text-5xl font-medium leading-[1.02] tracking-[-0.028em] text-ink sm:text-6xl">
          Tools for working{" "}
          <span className="text-accent">with files</span>.
        </h1>

        <p className="max-w-xl text-base leading-relaxed text-ink-soft">
          A small workshop of self-contained utilities. Each tool runs entirely
          in your browser — nothing is uploaded, nothing is logged.
        </p>
      </section>

      <section className="mt-20 flex flex-col gap-5">
        <Link
          href="/tools/combine-pdf"
          data-testid="tool-card-combine-pdf"
          className="block rounded-lg bg-surface p-6 transition-colors duration-150 hover:bg-surface-hover"
        >
          <div className="flex items-start gap-4">
            <ToolIcon
              variant="pdf"
              className="h-10 w-10 shrink-0 text-ink-soft"
            />
            <div className="flex flex-col gap-2">
              <h2 className="font-sans text-2xl font-medium leading-tight tracking-[-0.01em] text-ink">
                Combine PDFs
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-ink-soft">
                Stitch two or more PDFs into a single document. Drag the rows
                to set the merge order.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <span
              data-testid="open-combine-pdf"
              className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition-colors duration-150 hover:bg-accent-hover"
            >
              Open tool
            </span>
          </div>
        </Link>
      </section>
    </main>
  );
}

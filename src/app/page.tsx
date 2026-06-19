import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col px-6 pt-10 pb-24 sm:pt-16">
      <section className="flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="inline-block h-px w-8 bg-accent" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            The catalog
          </span>
        </div>

        <h1 className="font-display text-5xl font-medium leading-[1.02] tracking-[-0.028em] text-ink sm:text-6xl">
          Tools for working{" "}
          <em className="font-display italic text-accent">with files</em>.
        </h1>

        <p className="max-w-xl text-base leading-relaxed text-ink-soft">
          A small workshop of self-contained utilities. Each tool runs entirely
          in your browser — nothing is uploaded, nothing is logged.
        </p>
      </section>

      <section
        aria-labelledby="tools-heading"
        className="mt-20 flex flex-col gap-5"
      >
        <div className="flex items-baseline justify-between border-b border-hairline pb-3">
          <h2
            id="tools-heading"
            className="font-display text-sm font-medium tracking-[-0.005em] text-ink-soft"
          >
            Available now
          </h2>
          <span className="font-mono text-[11px] text-muted">02 of 02</span>
        </div>

        <Link
          href="/tools/combine-pdf"
          data-testid="tool-card-combine-pdf"
          className="group relative flex flex-col gap-6 rounded-lg border border-hairline bg-surface-raised p-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md focus-visible:-translate-y-0.5 focus-visible:border-accent/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="font-mono text-xs font-medium text-accent"
              >
                01
              </span>
              <span aria-hidden="true" className="h-3 w-px bg-hairline" />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                Combine · PDF
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-accent"
              />
              Available
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-display text-3xl font-medium leading-[1.05] tracking-[-0.02em] text-ink">
              Combine PDFs
            </h3>
            <p className="max-w-md text-sm leading-relaxed text-ink-soft">
              Stitch two or more PDFs into a single document. Drag the rows to
              set the merge order.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-hairline pt-5">
            <span className="font-mono text-[11px] text-muted">
              Client-side · 50 MB max · 2+ files
            </span>
            <span
              data-testid="open-combine-pdf"
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-accent-ink shadow-sm transition-all duration-200 group-hover:bg-accent-soft group-hover:shadow-accent"
            >
              Open tool
              <span
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              >
                →
              </span>
            </span>
          </div>
        </Link>

        <Link
          href="/tools/split-pdf"
          data-testid="tool-card-split-pdf"
          className="group relative flex flex-col gap-6 rounded-lg border border-hairline bg-surface-raised p-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md focus-visible:-translate-y-0.5 focus-visible:border-accent/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="font-mono text-xs font-medium text-accent"
              >
                02
              </span>
              <span aria-hidden="true" className="h-3 w-px bg-hairline" />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                Split · PDF
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-accent"
              />
              Available
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-display text-3xl font-medium leading-[1.05] tracking-[-0.02em] text-ink">
              Split PDF
            </h3>
            <p className="max-w-md text-sm leading-relaxed text-ink-soft">
              Break a PDF into one file per page and download the pages as a
              single ZIP archive.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-hairline pt-5">
            <span className="font-mono text-[11px] text-muted">
              Client-side · 50 MB max · 1 file
            </span>
            <span
              data-testid="open-split-pdf"
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-accent-ink shadow-sm transition-all duration-200 group-hover:bg-accent-soft group-hover:shadow-accent"
            >
              Open tool
              <span
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              >
                →
              </span>
            </span>
          </div>
        </Link>
      </section>

      <footer className="mt-24 flex items-center justify-between border-t border-hairline pt-6">
        <span className="font-mono text-[11px] text-muted">
          More tools in the works.
        </span>
        <span className="font-mono text-[11px] text-muted">v0.1</span>
      </footer>
    </main>
  );
}

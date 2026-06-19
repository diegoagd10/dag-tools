import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="group inline-flex items-baseline gap-2.5"
          aria-label="dag-tools — home"
        >
          <span className="font-display text-lg font-medium tracking-[-0.015em] text-ink">
            dag-tools
          </span>
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full bg-accent transition-transform duration-200 group-hover:scale-125"
          />
        </Link>
        <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-muted sm:inline">
          A small workshop
        </span>
      </div>
    </header>
  );
}

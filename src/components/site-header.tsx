import Link from "next/link";

export function SiteHeader() {
  return (
    <header>
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="group inline-flex items-baseline"
          aria-label="dag-tools — home"
        >
          <span className="font-sans text-lg font-medium tracking-[-0.015em] text-ink transition-colors duration-150 group-hover:text-ink-soft">
            dag-tools
          </span>
        </Link>
        <span className="hidden text-xs text-muted sm:inline">
          A small workshop
        </span>
      </div>
    </header>
  );
}

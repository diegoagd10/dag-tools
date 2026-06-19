import Link from "next/link";

export default function Home() {
  return (
    <main className="flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">dag-tools</h1>
      <section
        data-testid="tool-card-combine-pdf"
        className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800"
      >
        <h2 className="text-xl font-medium">Combine PDFs</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Merge multiple PDF files into a single document. Drag to reorder.
        </p>
        <Link
          href="/tools/combine-pdf"
          data-testid="open-combine-pdf"
          className="text-foreground underline"
        >
          Open
        </Link>
      </section>
    </main>
  );
}

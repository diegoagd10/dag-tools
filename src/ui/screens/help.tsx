/** @jsxImportSource hono/jsx */

import { Layout } from "@/ui/layout";

type FaqItem = {
  readonly question: string;
  readonly answer: unknown;
};

const faqItems: readonly FaqItem[] = [
  {
    question: "What can I do with DAG Tools?",
    answer: (
      <p>
        A small workshop of file tools, all processed server-side. Today you
        can combine and split <strong>PDF</strong> documents and generate a{" "}
        <strong>QR Code</strong> from a URL or any text. Each Tool produces a
        Share Link you can reopen or hand out.
      </p>
    ),
  },
  {
    question: "Is there a file size limit?",
    answer: (
      <p>
        Yes. The Total Size Limit is <strong>50 MB</strong> per Tool
        invocation — 50 MB across all Source PDFs for PDF Combine, and 50 MB
        for the single Source PDF for PDF Split. Anything that would push the
        total over is rejected at upload time.
      </p>
    ),
  },
  {
    question: "How do I combine PDFs?",
    answer: (
      <p>
        Open the{" "}
        <a
          href="/pdf/combine"
          class="text-accent underline underline-offset-4"
        >
          PDF Combine Tool
        </a>
        , add two or more Source PDFs, drag the rows to set the Merge Order,
        and run Combine. The result is a single Combined PDF you can download
        and share.
      </p>
    ),
  },
  {
    question: "How do I split a PDF?",
    answer: (
      <p>
        Open the{" "}
        <a href="/pdf/split" class="text-accent underline underline-offset-4">
          PDF Split Tool
        </a>
        , upload one Source PDF, and run Split. You get one Split PDF per
        page, bundled as a single ZIP archive.
      </p>
    ),
  },
  {
    question: "Are the Share Links permanent?",
    answer: (
      <p>
        Yes. Artifacts persist with <strong>no TTL</strong> — there is no
        expiry on Share Links, including QR links. The reserved{" "}
        <code>expires_at</code> column stays <code>NULL</code> until a future
        TTL feature is built.
      </p>
    ),
  },
  {
    question: "Who can see my files and links?",
    answer: (
      <p>
        This is a personal, single-user workshop. There is no account system:
        a Share ID is the only authorization, so anyone with a Share Link can
        open the Artifact. Processing is server-side and Artifacts are stored
        on disk under <code>./storage</code>.
      </p>
    ),
  },
];

export const Help = ({ currentPath }: { currentPath?: string }) => {
  return (
    <Layout title="Help & FAQ — dag-tools" currentPath={currentPath}>
      <section class="flex flex-col gap-4">
        <h1 class="font-sans text-4xl font-medium tracking-[-0.01em] text-ink">
          {"Help & FAQ"}
        </h1>
        <p class="max-w-xl text-base leading-relaxed text-ink-soft">
          Quick answers about what DAG Tools does, its limits, and how the
          Share Links work.
        </p>
      </section>

      <section aria-labelledby="faq-heading" class="mt-10 flex flex-col gap-3">
        <h2 id="faq-heading" class="sr-only">
          Frequently asked questions
        </h2>
        {faqItems.map((item) => (
          <details class="group rounded-lg border border-hairline bg-surface p-4 open:bg-surface-hover">
            <summary class="flex cursor-pointer list-none items-center justify-between gap-4 font-sans text-base font-medium text-ink">
              {item.question}
              <span
                aria-hidden="true"
                class="font-mono text-sm text-muted transition-transform duration-150 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div class="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
              {item.answer}
            </div>
          </details>
        ))}
      </section>
    </Layout>
  );
};

/** @jsxImportSource hono/jsx */

import { Layout } from "@/ui/layout";

type ToolCard = {
  readonly href: string;
  readonly name: string;
  readonly description: string;
  readonly icon: unknown;
};

const PdfIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const PdfSplitIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

const QrIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const workingTools: readonly ToolCard[] = [
  {
    href: "/pdf/combine",
    name: "PDF Combine",
    description:
      "Stitch two or more PDFs into a single document, drag the rows to set the merge order.",
    icon: PdfIcon,
  },
  {
    href: "/pdf/split",
    name: "PDF Split",
    description:
      "Break a PDF into one file per page and download the pages as a single ZIP archive.",
    icon: PdfSplitIcon,
  },
  {
    href: "/links/qr",
    name: "QR Code",
    description:
      "Paste a URL or any text to generate a QR Code with a shareable link and downloadable PNG.",
    icon: QrIcon,
  },
];

const comingSoonTools: readonly ToolCard[] = [];

const ToolCardLink = ({ tool }: { tool: ToolCard }) => (
  <a
    href={tool.href}
    class="flex h-full flex-col gap-3 rounded-lg bg-surface p-5 transition-colors duration-150 hover:bg-surface-hover"
  >
    <div class="h-9 w-9 text-ink-soft" aria-hidden="true">
      {tool.icon}
    </div>
    <div class="flex flex-col gap-1">
      <h3 class="font-sans text-lg font-medium leading-tight tracking-[-0.01em] text-ink">
        {tool.name}
      </h3>
      <p class="text-sm leading-relaxed text-ink-soft">{tool.description}</p>
    </div>
  </a>
);

export const Home = ({ currentPath }: { currentPath?: string }) => {
  const workingCount = workingTools.length;
  const totalCount = workingCount + comingSoonTools.length;

  return (
    <Layout title="dag-tools — A small workshop of file tools" currentPath={currentPath}>
      <section class="flex flex-col gap-8">
        <h1 class="font-sans text-5xl font-medium leading-[1.02] tracking-[-0.028em] text-ink sm:text-6xl">
          Tools for working <span class="text-accent">with files</span>.
        </h1>
        <p class="max-w-xl text-base leading-relaxed text-ink-soft">
          A small workshop of self-contained utilities. Each tool runs
          server-side — your files are processed and stored securely.
        </p>
      </section>

      <section
        aria-labelledby="tools-heading"
        class="mt-20 flex flex-col gap-5"
      >
        <div class="flex items-baseline justify-between border-b border-hairline pb-3">
          <h2
            id="tools-heading"
            class="font-display text-sm font-medium tracking-[-0.005em] text-ink-soft"
          >
            Available now
          </h2>
          <span
            data-testid="tools-available-count"
            class="font-mono text-[11px] text-muted"
          >
            {workingCount} of {totalCount}
          </span>
        </div>

        <div
          data-testid="tool-grid"
          role="list"
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {workingTools.map((tool) => (
            <div role="listitem" class="flex">
              <ToolCardLink tool={tool} />
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};
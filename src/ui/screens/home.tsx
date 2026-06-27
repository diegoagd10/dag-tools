/** @jsxImportSource hono/jsx */

import { Layout } from "@/ui/layout";

type ToolCard = {
  readonly href: string | null;
  readonly name: string;
  readonly description: string;
  readonly icon: unknown;
  readonly cta: string;
};

const MergeIcon = (
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

const SplitIcon = (
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

const EpubIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="8" y1="7" x2="16" y2="7" />
    <line x1="8" y1="11" x2="14" y2="11" />
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

const pdfTools: readonly ToolCard[] = [
  {
    href: "/pdf/combine",
    name: "Merge",
    description:
      "Stitch two or more PDFs into a single document, drag the rows to set the merge order.",
    icon: MergeIcon,
    cta: "LAUNCH TOOL →",
  },
  {
    href: "/pdf/split",
    name: "Split",
    description:
      "Break a PDF into one file per page and download the pages as a single ZIP archive.",
    icon: SplitIcon,
    cta: "LAUNCH TOOL →",
  },
  {
    href: null,
    name: "To-Epub",
    description:
      "Convert your PDF documents into reflowable eBook formats for better reading.",
    icon: EpubIcon,
    cta: "COMING SOON",
  },
];

const qrTools: readonly ToolCard[] = [
  {
    href: "/links/qr",
    name: "Generate",
    description:
      "Paste a URL or any text to generate a QR Code with a shareable link and downloadable PNG.",
    icon: QrIcon,
    cta: "LAUNCH TOOL →",
  },
];

const WorkingCard = ({
  tool,
  accentColor,
  ctaColor,
}: {
  tool: ToolCard;
  accentColor: string;
  ctaColor: string;
}) => (
  <a
    href={tool.href!}
    class="flex h-full flex-col gap-3 rounded-lg border bg-home-surface p-5 transition-colors hover:border-current"
    style={{
      borderColor: "var(--color-home-border)",
      color: accentColor,
    }}
  >
    <div
      class="h-10 w-10 rounded bg-home-icon-tile flex items-center justify-center"
      aria-hidden="true"
    >
      {tool.icon}
    </div>
    <div class="flex flex-col gap-1">
      <h3 class="font-display text-base font-semibold text-home-text-primary">
        {tool.name}
      </h3>
      <p class="text-sm text-home-text-secondary">{tool.description}</p>
    </div>
    <span
      class="font-mono text-xs uppercase tracking-wide mt-auto"
      style={{ color: ctaColor }}
    >
      {tool.cta}
    </span>
  </a>
);

const ComingSoonCard = ({
  tool,
  accentColor,
}: {
  tool: ToolCard;
  accentColor: string;
}) => (
  <div
    class="flex h-full flex-col gap-3 rounded-lg border bg-home-surface p-5 opacity-50"
    style={{ borderColor: "var(--color-home-border)" }}
    aria-disabled="true"
  >
    <div
      class="h-10 w-10 rounded bg-home-icon-tile flex items-center justify-center"
      style={{ color: accentColor }}
      aria-hidden="true"
    >
      {tool.icon}
    </div>
    <div class="flex flex-col gap-1">
      <h3 class="font-display text-base font-semibold text-home-text-primary">
        {tool.name}
      </h3>
      <p class="text-sm text-home-text-secondary">{tool.description}</p>
    </div>
    <span
      class="font-mono text-xs uppercase tracking-wide mt-auto"
      style={{ color: accentColor }}
    >
      {tool.cta}
    </span>
  </div>
);

const SectionBlock = ({
  id,
  title,
  count,
  accentColor,
  ctaColor,
  tools,
}: {
  id: string;
  title: string;
  count: number;
  accentColor: string;
  ctaColor: string;
  tools: readonly ToolCard[];
}) => (
  <section id={id} class="flex flex-col gap-4 scroll-mt-[calc(80px+2rem)]">
    <div class="flex items-center gap-3">
      <div
        class="h-8 w-1 rounded-full"
        style={{ background: accentColor }}
        aria-hidden="true"
      />
      <h2 class="font-display text-lg font-semibold text-home-text-primary">
        {title}
      </h2>
      <span
        class="font-mono text-xs uppercase tracking-wide rounded-full px-2 py-0.5"
        style={{
          color: accentColor,
          border: `1px solid ${accentColor}`,
        }}
      >
        {count} UTILIT{count === 1 ? "Y" : "IES"}
      </span>
    </div>
    <div
      class="grid gap-4"
      style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))"
    >
      {tools.map((tool) =>
        tool.href !== null ? (
          <WorkingCard
            tool={tool}
            accentColor={accentColor}
            ctaColor={ctaColor}
          />
        ) : (
          <ComingSoonCard tool={tool} accentColor={accentColor} />
        ),
      )}
    </div>
  </section>
);

export const Home = ({ currentPath }: { currentPath?: string }) => {
  return (
    <Layout title="dag-tools — A small workshop of file tools" currentPath={currentPath} bodyClass="page-home bg-home-bg">
      {/* Widen the main content for home only by overriding the max-w via a wrapper */}
      <div class="-mx-6 px-6 sm:-mx-8 sm:px-8" style="max-width: 64rem; width: 100%; align-self: center;">
        <div class="flex flex-col gap-12 pt-4">
          <SectionBlock
            id="pdf-tools"
            title="PDF Tools"
            count={pdfTools.length}
            accentColor="var(--color-home-pdf-accent)"
            ctaColor="var(--color-home-pdf-cta)"
            tools={pdfTools}
          />
          <SectionBlock
            id="qr-tools"
            title="QR Tools"
            count={qrTools.length}
            accentColor="var(--color-home-qr-accent)"
            ctaColor="var(--color-home-qr-cta)"
            tools={qrTools}
          />
        </div>
      </div>
    </Layout>
  );
};

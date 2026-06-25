/** @jsxImportSource hono/jsx */

import { Layout } from "@/ui/layout";

export const ArtifactNotFound = ({
  backLink,
  currentPath,
}: {
  backLink?: { href: string; label: string };
  currentPath?: string;
}) => {
  const href = backLink?.href ?? "/pdf/combine";
  const label = backLink?.label ?? "Back to PDF Combine";

  return (
    <Layout
      title="Artifact not available — dag-tools"
      currentPath={currentPath}
    >
      <div class="flex flex-col items-start gap-6">
        <h1 class="font-sans text-4xl font-medium tracking-[-0.01em] text-ink">
          This artifact is not available
        </h1>
        <p class="max-w-xl text-base leading-relaxed text-ink-soft">
          The link you followed may have expired or been removed. Artifacts are
          stored permanently, but they can be deleted by the creator.
        </p>
        <a
          href={href}
          class="inline-flex items-center rounded bg-accent px-4 py-2 font-sans text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
        >
          {label}
        </a>
      </div>
    </Layout>
  );
};

/** @jsxImportSource hono/jsx */

import { Layout } from "./Layout";

export const PdfSplit = () => {
  return (
    <Layout title="PDF Split — dag-tools">
      <h1 class="font-sans text-4xl font-medium tracking-[-0.01em] text-ink">
        PDF Split
      </h1>
      <p class="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
        Upload a PDF to split it into one file per page — downloaded as a ZIP.
      </p>
    </Layout>
  );
};

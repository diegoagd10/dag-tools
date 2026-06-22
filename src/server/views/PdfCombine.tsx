/** @jsxImportSource hono/jsx */

import { Layout } from "./Layout";

export const PdfCombine = () => {
  return (
    <Layout title="PDF Combine — dag-tools">
      <h1 class="font-sans text-4xl font-medium tracking-[-0.01em] text-ink">
        PDF Combine
      </h1>
      <p class="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
        Upload two or more PDFs to merge them into a single document.
      </p>
    </Layout>
  );
};

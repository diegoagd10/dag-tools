/** @jsxImportSource hono/jsx */

import { Layout } from "./Layout";

export const QrSharePage = ({ id }: { id: string }) => {
  const pngUrl = `/links/qr/${id}.png`;
  const shareUrl = `/links/qr/${id}`;

  return (
    <Layout title="QR Code — dag-tools">
      <div class="flex flex-col items-start gap-6">
        <h1 class="font-sans text-3xl font-medium tracking-[-0.01em] text-ink">
          QR Code
        </h1>
        <img
          src={pngUrl}
          alt="QR Code"
          class="block max-w-full"
        />
        <p class="text-sm leading-relaxed text-ink-soft">
          Right-click the image and choose "Save image as" to download.
        </p>
        <div class="flex items-center gap-3">
          <input
            type="text"
            value={shareUrl}
            readonly
            onclick="this.select()"
            class="flex-1 rounded border border-hairline bg-paper px-3 py-2 font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <a
            href={shareUrl}
            class="inline-flex items-center rounded bg-accent px-4 py-2 font-sans text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
          >
            Open
          </a>
        </div>
        <p class="text-xs text-muted">
          <a href="/links/qr" class="underline transition-colors hover:text-ink-soft">
            Create another
          </a>
        </p>
      </div>
    </Layout>
  );
};

/** @jsxImportSource hono/jsx */

export const QrSharePanel = ({ id }: { id: string }) => {
  const url = `/links/qr/${id}`;

  return (
    <div id="qr-result">
      <div class="mt-6 rounded-lg border border-hairline bg-surface p-6">
        <h2 class="font-sans text-lg font-medium tracking-[-0.005em] text-ink">
          QR Code ready
        </h2>
        <p class="mt-2 text-sm leading-relaxed text-ink-soft">
          Your QR Code is ready. Share the link below — anyone with it can open
          and download the image.
        </p>
        <div class="mt-4 flex items-center gap-3">
          <input
            type="text"
            value={url}
            readonly
            onclick="this.select()"
            class="flex-1 rounded border border-hairline bg-paper px-3 py-2 font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <a
            href={url}
            class="inline-flex items-center rounded bg-accent px-4 py-2 font-sans text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
          >
            Open
          </a>
        </div>
        <p class="mt-4 text-xs text-muted">
          <a href="/links/qr" class="underline transition-colors hover:text-ink-soft">
            Create another
          </a>
        </p>
      </div>
    </div>
  );
};

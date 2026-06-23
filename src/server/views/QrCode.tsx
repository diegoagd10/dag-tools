/** @jsxImportSource hono/jsx */

import { Layout } from "./Layout";

export const QrCode = () => {
  return (
    <Layout title="QR Code — dag-tools">
      <h1 class="font-sans text-4xl font-medium tracking-[-0.01em] text-ink">
        QR Code
      </h1>
      <p class="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
        Paste a URL or any text to generate a QR Code. A shareable link is
        created so anyone can open and download the image.
      </p>

      <form
        id="qr-form"
        data-testid="qr-form"
        hx-post="/api/v1/links/qr"
        hx-target="#qr-result"
        hx-swap="outerHTML"
        hx-indicator="#qr-indicator"
        hx-on--before-swap="if(event.detail.xhr.status === 422) event.detail.shouldSwap = true"
        class="mt-8 flex w-full max-w-xl flex-col gap-4"
      >
        <div class="flex flex-col gap-1.5">
          <label for="qr-content" class="font-sans text-sm font-medium text-ink">
            QR Content
          </label>
          <textarea
            id="qr-content"
            name="content"
            data-testid="qr-content-input"
            rows={4}
            class="rounded border border-hairline bg-paper px-3 py-2 font-mono text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="https://example.com or any text…"
            autofocus
          />
          <p
            id="qr-hint"
            data-testid="qr-hint"
            class="text-xs text-ink-soft"
          />
        </div>

        <button
          id="qr-submit"
          data-testid="qr-submit-button"
          type="submit"
          class="inline-flex w-fit items-center rounded bg-accent px-5 py-2.5 font-sans text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-hover"
        >
          Generate QR Code
        </button>
      </form>

      <div
        id="qr-indicator"
        class="htmx-indicator mt-4 text-sm text-ink-soft"
      >
        Creating…
      </div>

      <div id="qr-result" />
    </Layout>
  );
};

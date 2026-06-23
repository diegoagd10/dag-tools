# ADR-0002: Inline-SVG to PNG `<img>` reversal for QR Code rendering

**Date**: 2026-06-23

**Status**: Accepted

## Context

The initial QR Code Share Page design rendered the QR Code as an inline `<svg>`, produced server-side and embedded directly in the HTML. This approach was chosen for simplicity and resolution-independence.

During review, the following tradeoff was identified:

- Inline SVG is sharp at any zoom level but does not support the browser's native "Save image as" (right-click → save). Users must rely on a custom download button, which introduces browser JavaScript or a download link rendered server-side.
- A PNG `<img>` rendered server-side and served from a dedicated QR Image Endpoint enables the browser's native "Save image as" flow — no custom download button, no browser JavaScript.

## Decision

The QR Code is rendered server-side as a PNG via the `qrcode` library (pure-JS `pngjs` path, no native `canvas` dependency). The Share Page embeds it via a standard `<img src="/links/qr/:id.png">`. The QR Image Endpoint (`GET /links/qr/:id.png`) produces `Content-Type: image/png` with `Cache-Control: public, max-age=31536000, immutable`.

**Render options**: `errorCorrectionLevel: 'M'`, `margin: 4`, `width: 512`, default black-on-white.

## Consequences

### Positive
- Native browser "Save image as" works without any JavaScript.
- QR Code PNGs are generated on demand, never persisted — storage stays clean.
- Immutable `Cache-Control` allows CDN and browser caching for repeated visits.

### Negative
- PNG at 512px fixed resolution may appear slightly soft on high-DPI displays (acceptable for QR scanning — QR codes are designed for camera capture, not visual consumption).
- Requires a dedicated server endpoint, adding one route to the routing table.
- Inline SVG would have produced smaller HTML payloads for the share page itself, but the PNG is served separately and cached aggressively.

## Alternatives considered

1. **Inline SVG (original design)**: Sharp at any resolution, smaller HTML payload, no extra request. Rejected because it disables native "Save image as" — the core UX goal of the Link Tool.
2. **Both inline SVG + download button**: Adds JavaScript complexity and violates the "no browser JS" constraint. Rejected.
3. **Canvas PNG generation client-side**: Requires browser JS and would break the server-side processing constraint. Rejected.

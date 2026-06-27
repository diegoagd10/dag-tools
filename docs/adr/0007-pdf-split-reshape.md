# 0007. PDF Split reshape: drag-and-drop upload + success view

- **Status**: Accepted
- **Relates to**: `DESIGN.md` (Kanagawa-Inspired Dark System), ADR-0005 (home reshape, section-tinting), ADR-0006 (#51 Combine reshape — this mirrors it), `src/ui/screens/pdf-split.tsx`

## Context

The PDF Split Tool's two screens — the upload/selection screen (`GET /pdf/split`) and the
result screen — are being reshaped to the `DESIGN.md` "Midnight Ink" language to match the
reference mockup: a single drag-and-drop zone, a selected-file card, a coral "Split PDF" call
to action, and a dedicated success screen with a "Download Files (ZIP)" action. This is the
Split-Tool analog of the Combine reshape (ADR-0006 / PRD #51) and follows the same convention.

The reshape is **presentation-only**. The Split API (`POST /api/v1/pdf/split`), the `/validate`
preflight, the Share Link serve route (`GET /pdf/split/:id`, ZIP attachment), the Total Size
Limit (Split) of 50 MB, the Minimum Source PDF Page Count (1), and all Server-Side Processing
are **frozen**. The change concentrates in the Split view templates and `split-form.js`.

Unlike the Combine reshape, Split takes exactly **one** Source PDF. There is no multi-file
intake, no dedup, no reorder, and no Merge Order. The client logic is therefore a thin
controller — there is no "Selection" deep module to extract here (contrast ADR-0006, where
multi-file ordering/gating justified one). The single hidden `name="file"` input plus a
one-item `DataTransfer` is enough; introducing a store would be over-engineering.

## Decision

Rebuild the two Split screens to the mockup under the `DESIGN.md` palette and type system,
scoped so nothing outside the Split route changes appearance.

### Upload / selection screen (`GET /pdf/split`)

- A mono "PDF UTILITY" chip, an H1 **"Split a PDF Document"** (Sora), and a one-line subtitle.
- A single **drag-and-drop zone** ("Drop your PDF here / or click to browse") that accepts one
  Source PDF by drop or by click-to-browse. Both paths feed the single hidden
  `name="file"` input via a one-item `DataTransfer`, so submission stays a **native htmx form
  POST** against the frozen Split backend. Re-dropping replaces the file.
- On selection, the zone collapses to a **selected-file card** (file icon, filename, size, and
  the page count from the existing `/validate` preflight) with a remove/clear control — the
  single-PDF analog of #51's Selected Files card. The "Split PDF" CTA enables only once the
  file is preflight-valid (a parseable, non-encrypted PDF with the Page Count minimum met).
- A pill-shaped coral **"Split PDF"** CTA.
- A **trust-badge row** — see "Honest copy over mockup fidelity" below.

### Result screen (full-region swap, mirrors #51)

On a successful split, the form region is replaced (existing htmx target/swap) with a new
**Split-specific success view**: a coral check icon, "Files Split Successfully", a confirmation
line, a primary **"Download Files (ZIP)"** action whose target is the Split share link
(`/pdf/split/:id`, served as a ZIP attachment), and a secondary **"Return to Split Tool"**
action that reloads the form route to a fresh, empty upload screen.

- **No copyable share-URL field.** As in ADR-0006, the download target *is* the Share Link, so
  CONTEXT.md's "every Tool produces a Share Link" stays satisfied without a copy-URL input.
- **No "Result Summary" card.** The mockup drew a Pages/Format/Size summary panel; it is
  dropped for tight parity with #51's success screen. (The data exists in the API response;
  this is a deliberate scope choice, not a limitation.)
- The shared `ShareLinkPanel` is **no longer used by Split**. It is left untouched for any
  other consumer.

### Honest copy over mockup fidelity

Governing principle for this work: **the mockup is the source of truth for layout; CONTEXT.md
is the source of truth for words.** The mockup's trust badges ("Private & Secure", "Instant
Processing", "Client-side Only") are kept as a *row* but **not** as written, because their copy
is false: CONTEXT.md *Server-Side Processing* means nothing runs client-side, and *No Auth
(Open Share Links)* means there is no privacy guarantee. A standing honesty test
(`tests/integration/split.test.ts`) already forbids the equivalent earlier mockup copy
("Secure Processing", "Instant Split", "Zero Loss"). The badges are replaced with
CONTEXT-true copy:

1. **Server-Side Processing** (the literal truth, replacing "Client-side Only")
2. **No Account Needed** (CONTEXT: *No Auth*)
3. **Shareable Link** (CONTEXT: every Tool produces a Share Link)

The honesty test is extended to pin the truthful trio and to keep forbidding the false copy
(now also "Client-side Only" and "Instant Processing").

### Palette & typography (from `DESIGN.md`, via #47's foundation)

Split is a **PDF Tool**, so it uses the **coral** accent (`tertiary` `#ffb3b0` / `#cb5f5f`) for
its CTA and success check, per ADR-0005's section-tinting. Tokens: canvas `#051424`; card
`surface-container` `#122131` with a 1px `outline-variant` `#45464d` border, `rounded-lg`, no
shadow; icon tiles `surface-container-high` `#1c2b3c`; primary text `on-surface` `#d4e4fa`,
secondary `on-surface-variant` `#c6c6cd`. Headings in Sora, body in Inter, small labels
(chip, badges, sizes, page count) in JetBrains Mono.

The DESIGN tokens and self-hosted fonts are introduced by #47 (home reshape), where they are
scoped to `.page-home`. This work **assumes #47 has landed** and **promotes those tokens and
fonts out of `.page-home` into a shared opt-in scope** that the Split page joins. Combine and
QR tool pages keep the global zinc/violet theme until their own reshape — zero blast radius
outside the opted-in pages.

## Considered options

- **Token reach: promote to a shared opt-in scope vs. duplicate per-page vs. global `@theme`
  swap.** *Chosen:* promote the #47 tokens from `.page-home` into a shared scope the Split page
  opts into. Duplicating the palette in a `.page-split` block creates two sources of truth to
  keep in sync; a global `@theme` swap would instantly restyle the un-reshaped Combine and QR
  pages, which ADR-0005 deferred. Promotion is reversible and confined to opted-in pages.
  Trade-off: depends on #47 merging first.
- **Trust badges: drop the row / replace with truthful copy / keep as drawn.** *Chosen:*
  replace with truthful copy. Keeping them as drawn ships a lie and fails the honesty test;
  dropping the row loses layout fidelity the mockup intends. Truthful copy keeps both the
  layout and the project's no-marketing-lies convention.
- **Result Summary card: include vs. drop.** *Chosen:* drop, for parity with #51. The data is
  available, so it can return in a later iteration if wanted.
- **Success view: reuse the shared `ShareLinkPanel` vs. a Split-specific view.** *Chosen:* a
  Split-specific view (as ADR-0006 did for Combine). The new screen diverges from the panel
  (full-region swap, coral check, no copy-URL field); parametrising the shared panel would
  couple the Split and Combine presentations.
- **Client logic: thin controller vs. a Selection-style deep module.** *Chosen:* thin
  controller. With a single file there is no ordering/dedup/gating to concentrate; a store
  would be ceremony. This is the deliberate point of difference from ADR-0006.
- **H1 copy: "Split PDF" (as drawn) vs. a verb phrase.** *Chosen:* "Split a PDF Document".
  "Split PDF" is a CONTEXT.md glossary noun (one single-page output PDF); using it as the page
  title blurs the term. The verb phrase parallels #51's "Combine PDF Documents".

## Consequences

- `src/ui/screens/pdf-split.tsx` is rewritten to the mockup: chip, H1, subtitle, drop zone,
  selected-file card, coral CTA, truthful badge row. A new Split success view replaces the
  shared `ShareLinkPanel` for this Tool.
- `static/js/split-form.js` gains drop-zone handling (drag events + `DataTransfer` → the hidden
  `name="file"` input) and renders the selected-file card; preflight and button-gating behavior
  are preserved.
- `static/styles.src.css` promotes the #47 navy/coral tokens and fonts from `.page-home` into a
  shared opt-in scope the Split page uses; the global zinc/violet `@theme` is left intact. CSS
  must be rebuilt.
- `tests/integration/split.test.ts` is updated: the old "PDF Splitting · Extract All" task line
  and the previous summary-scaffold assertions are replaced by the new markup (drop zone,
  single `file` input, selected-file card, new copy); the honesty test is extended to pin the
  truthful badges and forbid the false ones. The backend describe blocks stay unchanged and
  green. `tests/e2e/split-hono.spec.ts` is rewritten to cover drop/browse selection, the
  enabled-when-valid gate, rejection messages, the success screen, and the reset.
- Depends on #47 landing for the tokens/fonts foundation. CONTEXT.md is unchanged — the reshape
  introduces no new domain terms.

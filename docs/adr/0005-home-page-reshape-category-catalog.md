# 0005. Home page reshape: category-grouped tool catalog

- **Status**: Accepted
- **Date**: 2026-06-27
- **Relates to**: `DESIGN.md` (Kanagawa-Inspired Dark System palette + type system), `src/server/views/Home.tsx`, `src/server/views/Layout.tsx`

## Context

The current home page (`src/server/views/Home.tsx`) is a single `max-w-3xl` column: a hero
headline ("Tools for working with files.") + intro paragraph, then one flat "Available now"
section with three stacked full-width cards (PDF Combine, PDF Split, QR Code). It uses the
global zinc/violet palette defined in `static/styles.src.css` `@theme`, and the app loads no
web fonts at all — `Inter` / `IBM Plex Mono` are named in `@theme` but never fetched, so they
fall back to system fonts.

We want to reshape the home page to match a specific reference design: a top navigation bar,
tools grouped into labelled **category sections** (PDF Tools, QR Tools) with colored accent
bars and count chips, laid out as a card grid, styled with the `DESIGN.md` "Midnight Ink"
palette (navy surfaces, sage + clay accents) and its Sora / Inter / JetBrains Mono type stack.

This is a **home-page-only** visual change. The tool pages (combine, split, QR) keep the
existing violet theme; this ADR does not touch them.

## Decision

Rebuild the home page to the reference layout, scoped so nothing outside the home route
changes its appearance.

### Layout & structure

- **Drop the hero.** The page opens with the nav bar, then goes straight into the category
  sections.
- **Top nav bar (home-only):** a `Dag Tools` wordmark on the left, and `PDF Tools` /
  `QR Tools` links on the right. The links are **in-page anchors** (`#pdf-tools`,
  `#qr-tools`) that scroll to each section — there are no category landing pages. `PDF Tools`
  carries the active-state underline. The nav is not added to the shared `Layout`; it lives in
  the home view only.
- **Category sections.** Two sections, each with a heading row: a short vertical accent bar +
  the section title + a mono count **chip** ("3 UTILITIES", "1 UTILITY").
  - **PDF Tools** (`#pdf-tools`): Merge, Split, To-Epub.
  - **QR Tools** (`#qr-tools`): Generate.
- **Wide container + auto-fit grid.** The home content widens beyond the shared
  `max-w-3xl`; cards sit in a CSS-grid **auto-fit fill** track (column count flexes with
  viewport, cards may stretch). The lone QR card stretching to fill its row is accepted.

### Cards & content

Card titles match the reference; routes are unchanged.

| Card | Route | Title | Description |
|------|-------|-------|-------------|
| Merge | `/pdf/combine` | Merge | *current copy* — "Stitch two or more PDFs into a single document. Drag the rows to set the merge order." |
| Split | `/pdf/split` | Split | *current copy* — "Break a PDF into one file per page and download the pages as a single ZIP archive." |
| To-Epub | — (none) | To-Epub | "Convert your PDF documents into reflowable eBook formats for better reading." |
| Generate | `/links/qr` | Generate | *current copy* — "Paste a URL or any text to generate a QR Code. Get a shareable link with a downloadable PNG image." |

- **To-Epub is a coming-soon placeholder.** The EPUB feature does not exist. The card renders
  in the grid for layout fidelity but is **non-interactive**: no `href`, not focusable as a
  link, and its call-to-action reads `COMING SOON` instead of `LAUNCH TOOL`. It is rendered
  slightly dimmed to signal the disabled state. It counts toward the PDF chip ("3 UTILITIES").
- Each card: icon tile (rounded square, raised surface fill, icon tinted to the section
  accent), title, description, and a mono `LAUNCH TOOL →` CTA. Real cards link to their route;
  the placeholder shows `COMING SOON`.

### Palette (home-scoped, from `DESIGN.md`)

Add **new home-scoped color tokens** rather than editing the global `@theme` violet tokens, so
the tool pages are untouched. Map to `DESIGN.md`:

- **Background:** `#051424` (DESIGN `background` / `surface`).
- **Card surface:** `surface-container` `#122131`, 1px `outline-variant` `#45464d` border,
  `rounded-lg` (1rem), **no shadow** (depth via tonal layering per DESIGN "Elevation").
- **Icon tile:** `surface-container-high` `#1c2b3c`.
- **Text:** primary `on-surface` `#d4e4fa`; secondary `on-surface-variant` `#c6c6cd`.
- **Accents — fully section-tinted (monochrome per section):**
  - **PDF Tools → tertiary red** (`#ffb3b0` / `on-tertiary-container` `#cb5f5f`): accent bar,
    chip border+text, icon tint, and `LAUNCH TOOL` CTA — all red within this section.
  - **QR Tools → secondary sage** (`#b2ccc1` / `secondary-container` family): accent bar, chip,
    icon tint, and CTA — all sage within this section.
- **Chips:** pill (`rounded-full`), mono uppercase, accent-colored border + text on a
  low-contrast surface.

### Typography (from `DESIGN.md`, self-hosted)

Adopt the full DESIGN type stack and **self-host woff2** under `/static/fonts` with
`@font-face` declarations (no external CDN — consistent with the server-side, no-external-call
ethos):

- **Sora** — headings (wordmark, section titles, card titles).
- **Inter** — body copy (descriptions). Currently named but never loaded; now actually fetched.
- **JetBrains Mono** — labels (chips, `LAUNCH TOOL` CTA, counts).

## Considered Options

- **Palette: global `@theme` swap vs. home-scoped tokens.** A site-wide swap to the Kanagawa
  palette would be most faithful but touches every tool page (combine, split, QR) and risks
  cross-page regressions for a change that was only requested for home. *Chosen:* home-scoped
  tokens — additive, reversible, zero blast radius outside home. Trade-off: home and the tool
  pages will look visually different (navy vs. zinc/violet) until a future ADR unifies them.
- **To-Epub: drop it / coming-soon placeholder / build the EPUB tool.** Dropping it keeps the
  page truthful but diverges from the reference (2 cards, not 3). Building a real PDF→EPUB tool
  is a large scope beyond a home reshape. *Chosen:* coming-soon placeholder — preserves the
  reference layout without advertising a working feature, since the CTA explicitly says
  `COMING SOON`.
- **Card descriptions: reference copy vs. current copy.** The reference's Generate copy claims
  "high-resolution … Wi-Fi credentials," but the QR tool only encodes arbitrary text into a
  fixed 512px PNG (verified in `src/server/qr.ts` / `qr-validate.ts`) — no Wi-Fi builder.
  *Chosen:* keep the app's existing, accurate copy; only To-Epub (which has no existing copy)
  uses the reference description.
- **Nav: home-only anchors vs. global nav vs. brand-only.** A global nav in the shared
  `Layout` would clash with the unchanged violet tool pages and needs `home#section`
  cross-page routing. Brand-only drops the reference's category links. *Chosen:* home-only nav
  with in-page anchors — self-contained, matches the reference, no `Layout` change.
- **Accent usage: section-tinted bars with one red CTA vs. fully section-tinted.** *Chosen:*
  fully section-tinted (PDF red throughout, QR sage throughout) — each section reads as a
  single accent, which is more systematic and matches the intended reading of the reference.
- **Fonts: self-hosted woff2 vs. Google Fonts CDN.** *Chosen:* self-hosted — no external
  runtime dependency, works offline, privacy-friendly, fits the app's server-side ethos.

## Consequences

- `src/server/views/Home.tsx` is rewritten: nav bar, two category sections, grid of cards,
  one non-interactive placeholder card. The hero is removed.
- `src/server/views/Layout.tsx` is **not** restyled. It gains only the self-hosted `@font-face`
  fonts (available app-wide, but the new Sora/JetBrains Mono utilities are applied on home
  only). The shared `max-w-3xl` `<main>` either gains a width override mechanism or the home
  view renders its own wider wrapper — the tool pages keep `max-w-3xl`.
- `static/styles.src.css` gains home-scoped color tokens and `@font-face` blocks; the existing
  violet `@theme` tokens are left intact. CSS must be rebuilt (`pnpm run build:css`).
- New static assets: woff2 files for Sora, Inter, JetBrains Mono under `static/fonts/`.
- The home page and the tool pages diverge visually (navy vs. zinc/violet). Unifying the whole
  app onto the Kanagawa palette is explicitly **out of scope** here and left as a future ADR.
- The To-Epub placeholder advertises a future capability. If EPUB never ships, the card should
  be removed; if it does ship, the placeholder becomes a real linked card and a new route is
  added.

## Divergence from issue #48 implementation

Issue #48 overrides ADR scope on one point: **the category nav links (`PDF Tools` / `QR Tools`) are placed in the global `src/ui/layout.tsx` instead of being home-page-only**. The ADR placed them in the home view only; the issue (and completed implementation) puts them in the shared `Layout` so they appear on every page as `/#pdf-tools` and `/#qr-tools` anchors. This gives in-page scroll on the home route and navigate-then-scroll from other pages.

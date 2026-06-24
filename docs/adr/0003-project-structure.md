# 0003. Project structure: routes / ui / modules

- **Status**: Accepted
- **Date**: 2026-06-24
- **Relates to**: #37 (first PRD to adopt and migrate to this layout)

## Context

The backend grew as a single `src/server/app.tsx` holding one `createApp` with every
web and API route inline, a flat `src/server/views/` mixing full pages with swapped
fragments, and processing logic (`split-pdfs.ts`, `merge-pdfs.ts`) beside it. PDF
parse/classify logic is triplicated across three routes and has already drifted (see
ADR-0004). The flat layout makes it hard to find "the screen for X", "the route for Y",
or "the logic behind Z", and it gives the loop's `validator` no structural contract to
audit against.

We want a layout where each kind of thing has one obvious home, so a human or an agent
can navigate by directory and a PRD/ADR can name exact destinations.

## Decision

Adopt this top-level `src/` taxonomy. Each directory holds exactly one kind of thing:

```
src/
  app.tsx              # createApp composition root: builds the Hono app,
                       # mounts the route groups, injects { db, storageDir }.
  routes/
    web/               # GET routes that return HTML screens
                       #   Home (/), form pages (/pdf/split, /pdf/combine,
                       #   /links/qr, /pdf/epub, /help), Share-Link pages
                       #   (/pdf/*/:id, /links/qr/:id, /links/qr/:id.png), 404.
    api/               # POST /api/v1/* processing endpoints and the
                       #   read-only validate/preflight endpoints.
  ui/
    layout.tsx         # the single shared Layout (chrome: nav, hairline, footer).
    screens/           # full, user-visible pages — one per web route
                       #   (Home, PdfSplit, PdfCombine, QrCode, Help,
                       #    QrSharePage, ArtifactNotFound).
    components/        # reusable fragments composed into screens or swapped
                       #   in via htmx (SourcePdfRow, ShareLinkPanel,
                       #   QrSharePanel, *ErrorPanel).
  modules/             # deep modules: pure logic behind a small interface,
                       #   no Hono/HTTP knowledge (inspect-pdf, split-pdfs,
                       #   merge-pdfs, qr rendering).
```

Static assets (`static/styles.src.css`, compiled CSS, client JS) stay under `static/`.
Integration tests stay under `tests/integration/` and exercise the composed app via
`createApp` — the seam is unchanged by this move.

### Dependency direction (the layering seam)

```
routes/  ──▶  ui/        (routes render screens/components)
routes/  ──▶  modules/   (routes call deep modules for logic)
ui/      ──▶  (modules/ for shared TYPES only, e.g. a reason union)
modules/ ──▶  (nothing in routes/ or ui/) — pure, framework-free
```

- **`modules/` never imports from `routes/` or `ui/`.** A module is testable in
  isolation; if it needed a route or a view it would be the wrong shape.
- **`routes/` is the only place that knows about HTTP** (Hono `Context`, status codes,
  form parsing, `c.html`/`c.json`). Screens and modules never touch `Context`.
- **`ui/screens` are addressable pages; `ui/components` are sub-fragments.** The test:
  does a single web route render it as a whole page? → screen. Is it composed into a
  page or swapped in via htmx (rows, result panels, error panels)? → component.

### Naming

- One screen/component/module per file, named for the thing
  (`pdf-split.tsx`, `inspect-pdf.ts`). File extension follows existing convention
  (`.tsx` for JSX views, `.ts` for logic).
- Route files group by surface (e.g. `routes/web/pdf.tsx`, `routes/api/pdf.tsx`) or one
  file per route group; each exports a register function / Hono sub-app that `app.tsx`
  mounts. Exact file granularity is an implementation detail, but routes split by
  `web` vs `api` is the contract.

## Consequences

- `src/server/app.tsx`'s single `createApp` is split: composition stays in
  `src/app.tsx`; route handlers move into `routes/web` and `routes/api`. `createApp`
  still takes `{ db, storageDir }` and is still the test seam — only its internals move.
- `src/server/views/*` is sorted into `ui/layout.tsx`, `ui/screens/`, and
  `ui/components/` by the screen-vs-fragment test above.
- `src/server/{split-pdfs,merge-pdfs}.ts` move to `src/modules/`; the new `inspect-pdf`
  module (ADR-0004) lands there too.
- Imports and test paths update across the repo. Behavior is unchanged — this is a
  move + the inspect-pdf extraction, nothing else.
- Future PRDs name destinations in this vocabulary; the loop's `validator` can audit
  that new code lands in the right tier and that `modules/` stays framework-free.

## Rejected alternatives

- **Group by feature (`src/pdf/`, `src/qr/` each holding its routes+views+logic).**
  Rejected: co-locates HTTP, markup, and pure logic, which defeats the testability seam
  (modules free of Hono) and scatters the shared `inspect-pdf` module across features.
- **Keep the flat `src/server/` layout.** Rejected: no structural contract to navigate
  or audit by; the god-file `app.tsx` keeps growing.
- **Migrate lazily / forward-only.** Rejected for #37: leaves the repo half-old,
  half-new, which is the worst state for "navigate easily." Since #37 already touches
  most files, it migrates everything in one pass.

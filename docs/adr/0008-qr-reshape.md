# 0008. QR Code reshape: Midnight Ink, sage accent, reskin in place

- **Status**: Accepted
- **Relates to**: `DESIGN.md` (Kanagawa-Inspired Dark System), ADR-0005 (home reshape, section-tinting), ADR-0006 (Combine reshape), ADR-0007 (Split reshape — this mirrors the convention), `src/ui/screens/qr-code.tsx`, `src/ui/screens/qr-share-page.tsx`, `src/ui/components/qr-share-panel.tsx`, `src/ui/components/qr-error-panel.tsx`

## Context

The QR Code Tool is the last page still on the old global zinc/violet theme (`text-ink`,
`bg-paper`, `border-hairline`, `--color-accent`). Home (ADR-0005), Combine (ADR-0006) and Split
(ADR-0007) have each moved to the `DESIGN.md` "Midnight Ink" language under a per-page scope
(`.page-home`, `.page-combine`, `.page-split`) that defines `--color-{scope}-*` tokens and the
matching `@utility` classes. This reshape brings QR onto the same footing.

The reshape is **presentation-only**. The QR API (`POST /api/v1/links/qr`), the QR Content
validation (`qr-validate`), the QR Image Endpoint (`GET /links/qr/:id.png`, server-rendered
PNG), the Share Link serve route (`GET /links/qr/:id`), the 2048-byte QR Content Limit, and all
Server-Side Processing are **frozen**. The change concentrates in the QR view templates.

QR is a **Link Tool**, not a File Tool. Its product is a **Share Link** the user copies and
distributes — not a file that downloads at the end of a job. This is the decisive difference
from Split/Combine and it drives the one place this ADR diverges from ADR-0007 (the success
view; see below).

## Decision

Reskin all four QR surfaces to `DESIGN.md` under a new `.page-qr` scope, **in place** — the
existing layout and information architecture are preserved; only the palette, typography, and
component shapes change. QR is a **QR Tool**, so it uses the **sage** accent (`secondary`
`#b2ccc1`) per ADR-0005's section-tinting, where PDF Tools use coral.

### Token scope (`static/styles.src.css`)

Add a `.page-qr { --color-qr-* }` block plus the matching `@utility` rules, mirroring the
`.page-split` block exactly but with sage:

```
--color-qr-bg: #051424;            --color-qr-text-primary: #d4e4fa;
--color-qr-surface: #122131;       --color-qr-text-secondary: #c6c6cd;
--color-qr-border: #45464d;        --color-qr-accent: #b2ccc1;   /* sage */
--color-qr-icon-tile: #1c2b3c;     --color-qr-cta: #b2ccc1;      /* sage */
--color-qr-on-cta: #1e352d;        /* on-secondary — dark text on sage */
```

**Divergence from Split/Combine: the CTA text color.** Split/Combine hardcode `text-white` on
their coral CTA. Sage (`#b2ccc1`) is too light for white text — `DESIGN.md` (Components,
"Buttons") mandates **dark** text on the section accent for "pop". QR therefore adds an
`--color-qr-on-cta` token (`on-secondary` `#1e352d`) and a `text-qr-on-cta` utility; the primary
button is sage background with dark text, not white.

### Form screen (`GET /links/qr`, `qr-code.tsx`)

Join the scope via `bodyClass="page-qr"`. H1 in Sora (`font-display`), subtitle in Inter,
labels/mono chrome in JetBrains Mono. The single QR Content textarea becomes a dark-recessed
input (`bg-qr-bg`, 1px `border-qr-border`) that glows sage on focus. Primary CTA is a sage pill
with dark text; secondary controls are ghost style with a sage border. No feature/trust-badge
row is added — QR has no per-feature claims to advertise and "reskin in place" keeps the form's
existing single-field IA.

### Result panel (`qr-share-panel.tsx`) — reskin in place, NOT the File-Tool template

The QR success fragment **keeps its current structure**: a copyable mono Share Link field, an
**Open** action, a **Download PNG** action, and a "Create another" link. Only the tokens change
(sage Midnight Ink). This is the deliberate point of difference from ADR-0007, which dropped the
copy-URL field because a File Tool's download target *is* the link. For a **Link Tool the Share
Link itself is the product**, so the copyable URL field is the centerpiece and stays. The
File-Tool success template (centered checkmark + dual CTA, no URL field) is **not** adopted.

### Share Link page (`qr-share-page.tsx`)

The server-rendered page that embeds the QR Code via `<img src="/links/qr/:id.png">` is
recolored to the `.page-qr` scope. The `<img>`-based rendering (native right-click "Save image
as") is unchanged — no browser JS.

### Error panel (`qr-error-panel.tsx`)

Stays **red** (`border-red-200 bg-red-50`), matching `split-error-panel` / `combine-error-panel`.
Validation errors read consistently across all Tools; they are not recolored to sage.

## Considered options

- **Reskin depth: full Midnight Ink vs. colors-only.** *Chosen:* full — palette **and** Sora/
  JetBrains Mono type **and** recessed inputs / pill buttons / outlined cards. Colors-only would
  leave QR's fonts and component shapes mismatched against Split/Combine, defeating "adapt to the
  new design."
- **Result panel: reskin in place vs. adopt the File-Tool success template vs. hybrid.**
  *Chosen:* reskin in place. QR is a Link Tool; the copyable Share Link is its product, so the
  URL field stays. The File-Tool template reframes a share link as a finished file (wrong
  semantics); the hybrid (checkmark + URL field) busies the card without adding meaning.
- **CTA text color: dark `on-secondary` vs. reuse Split's white.** *Chosen:* dark, per
  `DESIGN.md`. White on sage fails contrast. This is the single token-level divergence from the
  Split/Combine scaffolding.
- **Error panel: keep red vs. sage-scope it.** *Chosen:* keep red, for cross-Tool consistency
  with the existing error panels.
- **Token reach: per-page `.page-qr` block vs. a shared scope.** *Chosen:* per-page block,
  mirroring the `.page-split` / `.page-combine` pattern already in the file. Consistency with the
  established structure outweighs deduplication; zero blast radius outside `/links/qr`.

## Consequences

- `static/styles.src.css` gains a `.page-qr` token block and its `@utility` rules (mirroring
  `.page-split`, sage accent, plus the new `--color-qr-on-cta` / `text-qr-on-cta`). CSS must be
  rebuilt. No other page's appearance changes.
- `src/ui/screens/qr-code.tsx` joins `page-qr`: Sora H1, recessed sage-glow input, sage pill CTA
  with dark text, ghost secondary controls.
- `src/ui/components/qr-share-panel.tsx` is recolored to `qr-*` tokens; structure (URL field,
  Open, Download PNG, Create another) is preserved.
- `src/ui/screens/qr-share-page.tsx` is recolored to `qr-*` tokens; `<img>`-based QR rendering
  unchanged.
- `src/ui/components/qr-error-panel.tsx` stays red.
- Tests covering QR markup/copy are updated to the new tokens and any honesty-copy pins, mirroring
  the Split/Combine test deltas. QR backend describe blocks stay unchanged and green.
- `CONTEXT.md` drops the stale `[planned]` tag on the QR terms (QR is implemented end-to-end);
  no new domain terms are introduced.

# 0004. PDF inspection deep module

- **Status**: Accepted
- **PRD**: #37
- **Date**: 2026-06-24
- **Builds on**: ADR-0003 (places this module under `src/modules/`)

## Context

PRD #37 adds per-file page counts to PDF Combine, which needs a combine preflight
endpoint mirroring the existing `POST /api/v1/pdf/split/validate`. Today the logic that
turns uploaded bytes into "page count, or a defect" is **triplicated** and has already
**drifted**:

- `POST /api/v1/pdf/split/validate`, `POST /api/v1/pdf/split`, and
  `POST /api/v1/pdf/combine` each re-implement: PDF magic-byte sniff,
  `PDFDocument.load()`, the `err.message.includes("is encrypted")` discrimination
  between encrypted vs corrupt, and page counting.
- The defect taxonomy diverged: split exposes `not-a-pdf | oversize | encrypted |
  corrupt | too-few-pages`; combine only `encrypted | corrupt`.
- Return shapes diverged: split/validate → JSON `{ valid, reason?, pageCount?, ... }`;
  combine magic-byte failure → JSON `{ error }` (400); combine parse failure → HTML
  fragment (422).
- `splitPdfs` and `mergePdfs` each re-load the document a second time just to count
  pages, discarding the count.

Adding the combine preflight makes this a **second real validate adapter** for the same
parse/classify logic — by the "two adapters = a real seam" rule, the seam is real, not
hypothetical. Module shape matters here because the logic is about to be copied a fourth
time.

## Deep modules

### inspectPdf (`src/modules/inspect-pdf.ts`)

- **Seam**: `src/modules/inspect-pdf.ts`. Called by every API route that must classify a
  Source PDF (`routes/api`: split, split/validate, combine, the new combine/validate).
  Framework-free — no Hono, no `Context`.
- **Interface**:

  ```typescript
  type PdfDefect = "not-a-pdf" | "encrypted" | "corrupt";

  type Inspection =
    | { ok: true; pageCount: number }
    | { ok: false; reason: PdfDefect };

  function inspectPdf(bytes: Uint8Array): Promise<Inspection>;
  ```

  Bytes in; a discriminated result out. No throwing — `ok: false` carries the defect.
  The `PdfDefect` union is the single source of truth for parse-level reasons and is the
  type other tiers import.
- **Hides**: the PDF magic-byte check, `pdf-lib`'s `PDFDocument.load()` and its quirks,
  the encrypted-vs-corrupt error-string discrimination, and page counting. Callers learn
  none of this.
- **Depth note**: deletion test — remove it and the magic-byte + `load()` + error
  discrimination + count logic reappears across four routes (it already has, and
  drifted). Small interface (one function, one 3-variant union) over a meaningful amount
  of fiddly, drift-prone implementation. Deep.

### Tool policy stays at the routes (NOT in the module)

The module owns only **parse facts**. **Tool policy** stays in `routes/api`, because it
varies per Tool and is cheap:

- **Size limit** — split caps the single Source PDF at 50 MB; combine caps the *total*
  of all Source PDFs at 50 MB (an aggregate, not a per-file fact). Reason `oversize`.
- **Minimum pages** — split requires ≥ 1 page. Reason `too-few-pages`.
- **Minimum files** — combine requires ≥ 2 Source PDFs. Reason `too-few-files`.

The route reads the policy reasons and the module's `PdfDefect` and maps both to the
right error panel / validate JSON. Pulling these into the module would bake divergent
Tool semantics (per-file vs total size) into shared code — shallower and leakier (see
Rejected).

## Seam map

```
routes/api/pdf  (split, split/validate, combine, combine/validate)
      │
      ├─▶ modules/inspect-pdf   inspectPdf(bytes) → Inspection      (classify)
      │        (route then applies size / min-page / min-file policy)
      │
      ├─▶ modules/split-pdfs    splitPdfs(bytes) → zip bytes        (on ok)
      └─▶ modules/merge-pdfs    mergePdfs(bytes[]) → pdf bytes      (on ok)

ui/components/*ErrorPanel   import { PdfDefect } from modules/inspect-pdf
                            (+ route-policy reasons) for exhaustive reason→copy
```

- Both validate endpoints (`split/validate`, `combine/validate`) return the **same** JSON
  shape: `{ valid: true, pageCount, size, name } | { valid: false, reason }`. The combine
  preflight runs per row. This retires combine's inconsistent `{ error }` (400) path.
- `splitPdfs` / `mergePdfs` keep loading their own `PDFDocument` (they need the full
  document, not just a count); they are not coupled to `inspectPdf`. The route calls
  `inspectPdf` for the verdict; processing modules own their own load.

## Rejected alternatives

- **Full validator** — `validatePdf(bytes, { maxBytes, minPages }): Result` owning size +
  min-page policy via params. Rejected: combine's size limit is a *total across files*,
  not per file, so the size check cannot live in a per-file inspector without lying about
  its inputs; baking split's `minPages` in makes the module carry Tool policy it
  shouldn't know. Shallower and leakier than the pure inspector.
- **Throwing classifier** — `inspectPdf(bytes): { pageCount }` that throws a typed
  `PdfInspectionError`. Rejected: forces `try/catch` at every call site and scatters the
  defect handling, hurting locality; the routes branch on valid/invalid anyway, which a
  discriminated result expresses directly.
- **Status quo (inline per route)** — Rejected by the deletion test: the logic is already
  copied three times and has drifted in taxonomy and return shape.

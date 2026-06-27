# 0006. PDF Combine reshape: drag-and-drop Selection + success view

- **Status**: Accepted
- **PRD**: #51

## Context

The PDF Combine Tool's form is being reshaped (PRD #51) to match `docs/design/merge-tool-upload.png` and `docs/design/merge-tool-success.png` under the `DESIGN.md` language: a single drag-and-drop zone that accepts multiple Source PDFs at once, a reorderable Selected Files list, and a dedicated success screen. The reshape is presentation-only — the Combine API, the `/validate` preflight, the Share Link serve route, the 50 MB Total Size Limit, the Minimum Source PDF Count, and all Server-Side Processing are frozen (see #51).

Module shape matters because the change concentrates entirely in one place that is easy to get wrong: the client. Today's three client scripts (`combine-form.js`, `split-form.js`, `qr-form.js`) are IIFE side-effect controllers that hold state in the DOM and mix intake, validation, rendering, and gating in one closure — shallow controllers with no internal seam. The new flow (multi-file intake across several drops, per-file removal, drag reorder, order-dependent size gating, async preflight status, and a hidden `files[]` input whose order must equal the Merge Order) has enough moving logic that, left as another flat controller, it would smear ordering/dedup/gating across every event handler. This ADR places one deep module — **Selection** — to concentrate that logic, and keeps everything else thin.

## Deep modules

### Selection (client)

- **Seam**: an **internal** module inside the Combine form script (the IIFE). Its interface is exercised transitively through the **e2e seam** (`tests/e2e/combine-hono.spec.ts`), never mocked. It is not a separate unit seam — see Rejected alternatives for why a pure-reducer unit seam was declined.
- **Interface**: an ordered set of Source PDFs, each carrying a preflight status, that owns a hidden multiple-file input and keeps `input.files` order equal to the Merge Order at all times. The contract `to-issues` slices within:

  ```
  createSelection(inputEl) -> selection

  selection.add(fileList)
    // Append new Source PDFs to the end of the set.
    // Synchronous gates applied here: extension (.pdf), duplicate
    // (same name+size+lastModified already present), and the
    // order-dependent 50 MB Total Size Limit (a file that would push
    // the running total over the cap is NOT added).
    // Added items start status "pending"; input.files is rebuilt in order.
    // -> { added: Item[], rejected: { name, reason }[] }
    //    reason in "duplicate" | "not-a-pdf" | "over-limit"

  selection.remove(id)            // drop one; rebuild input.files
  selection.reorder(idsInOrder)   // set the Merge Order; rebuild input.files to match
  selection.setStatus(id, status) // status: "valid" | { invalid: reason }
                                  //   from the /validate preflight (encrypted | corrupt | not-a-pdf)
  selection.items()               // -> Item[] in Merge Order; Item = { id, name, size, status, reason? }
  selection.canSubmit()           // -> boolean: >=2 items "valid" AND none "pending" AND none "invalid"
  selection.onChange(fn)          // subscribe; fired after any mutation
  ```

  Invariants: `input.files` order === `items()` order === Merge Order, always. Files rejected by `add` never enter the set (so the set only ever holds pending/valid/invalid items). Only the asynchronous validity verdicts (encrypted/corrupt) arrive later via `setStatus`.

- **Hides**: `DataTransfer` construction and rebuild on every mutation; the dedup key; order maintenance; the running-total computation behind the 50 MB gate; and the `files[]` synchronisation that lets submission stay a native htmx form POST.
- **Depth note**: deletion test passes — delete Selection and the ordering, dedup, size-gating, status bookkeeping, and `files[]` sync reappear smeared across the drop, change, drag-end, and submit handlers (today's `combine-form.js` shape). A small interface (one factory + seven operations) sits over the bulk of the screen's logic.

### Combine success view (server template, new)

- **Seam**: the HTML fragment returned by `POST /api/v1/pdf/combine` on success, swapped into the form region via the existing htmx target. Tested through the integration seam (`tests/integration/combine.test.ts`) and the e2e seam.
- **Interface**: a component taking the persisted Combined PDF's `{ id, filename }` and rendering the success screen — coral check, "Files Combined Successfully", confirmation line, a primary "Download Combined PDF" anchor to the Share Link `/pdf/combine/:id`, and a secondary "Combine More Files" action that reloads the form route.
- **Hides**: nothing structural — it is a presentation template. Recorded here because it is a new, Combine-specific component that replaces the shared Share-Link panel for this Tool only.
- **Depth note**: shallow by nature (a view). It earns its place not by depth but by keeping the Split Tool's shared panel untouched (see Rejected alternatives).

### Combine selection view (server template)

- **Seam**: `GET /pdf/combine`, tested through the integration seam.
- **Interface**: renders the static shell — heading, drop zone, empty Selected Files container, the single hidden `files[]` input, and the script hook. No per-file server rendering.
- **Hides**: nothing structural — a template. The obsolete `GET /pdf/combine/row` route and its server-rendered row component are deleted; rows become client-rendered cards driven by Selection.

## Internal collaborators (not test seams)

- **Selection controller** (client) — the thin glue inside the same script: drop + browse events call `selection.add` and surface its `rejected` reasons inline; `selection.onChange` re-renders the Selected Files cards and re-runs the submit gate; SortableJS `onEnd` calls `selection.reorder`; each added item triggers the preflight call and its result is fed back via `selection.setStatus`. Holds no domain state of its own — Selection owns the set. Covered transitively through the e2e seam; never mocked.
- **Preflight call** — `POST /api/v1/pdf/combine/validate` (frozen existing seam) invoked per added Source PDF to obtain its validity verdict (encrypted/corrupt/not-a-pdf). Its response shape is unchanged; only the page-count field is no longer displayed.
- **Backend combine pipeline** — `mergePdfs` / `inspectPdf` / `persistArtifact` and the Combine API itself are frozen. Covered transitively through the integration seam; never mocked.

## Seam map

```
e2e (browser)
  └─ Combine selection view  [GET /pdf/combine]        ── integration seam
       └─ Selection controller (internal glue)
            ├─ Selection (internal, deep) ── owns hidden files[] input
            │     └─ native htmx form POST
            │          └─ Combine API [POST /api/v1/pdf/combine]   (frozen) ── integration seam
            │               └─ Combine success view (fragment, swapped in) ── integration + e2e
            └─ Preflight [POST /api/v1/pdf/combine/validate]       (frozen) ── integration seam
```

Cross-module seams introduced by this design: **zero new test seams**. Selection is internal to the form script; the success and selection views ride the existing integration seam; submission and preflight ride the frozen API seams.

## Rejected alternatives

The load-bearing interface — Selection — was designed twice.

- **B: pure reducer + thin projection, as a new vitest unit seam.** `reduce(state, action) -> state` with selectors and a `project(state, inputEl)` side effect, making the Merge-Order/dedup/gating logic a browser-less pure function unit-testable in vitest. Deeper in the abstract and the best home for that logic's tests — but rejected *in this codebase*: no client script is importable today (every one is a "No bundler" IIFE side-effect script), and `tests/unit/` holds only server modules. A reducer that both vitest imports and the browser loads would be the first importable/ESM client module and the first client unit test — a deliberate, app-wide convention change that should be its own iteration, not smuggled into a single Tool's reshape. Selection keeps the same logic concentrated and deep; it is simply tested through e2e instead of a dedicated unit seam. The door to B stays open as a future, app-wide deliverable.
- **C: DOM-as-model (the current shape).** N hidden single-file inputs as the source of truth, order = DOM order, status in `data-*` attributes, no store. Rejected: it is exactly what is being replaced — state and rules smear across handlers with no locality, and it does not fit a single drop zone feeding one `files[]` input.
- **Reusing the shared Share-Link panel for the Combine success screen.** Rejected: the new success screen diverges (full-region replacement, coral check, no copyable share-URL field) and is Combine-specific. Parametrising the shared panel to cover both would couple the Combine and Split presentations; a separate Combine success view keeps the Split Tool's panel untouched, which is out of scope.

# dag-tools

A web application that hosts multiple independent file-manipulation utilities ("Tools"). Each Tool is a self-contained workflow. The Tools are PDF Combine, PDF Split, and QR Code.

All user-facing strings are in English.

## Language

**Tool**:
An independent, self-contained workflow exposed at its own route. Each Tool has its own inputs, intermediate state, and outputs; Tools do not share state.
_Avoid_: feature, mode, function, utility

**Home**:
The route that lists the available Tools as cards/links and routes the user to a specific Tool.
_Avoid_: dashboard, index, landing

**Source PDF**:
A PDF Document supplied by the user as input to a Tool. Must have extension `.pdf`, be parseable by pdf-lib, and not be password-protected or encrypted. Subject to the Total Size Limit.
_Avoid_: input PDF, uploaded PDF

**Combined PDF**:
The single PDF Document produced as the output of the PDF Combine Tool. Its filename follows the Output Filename pattern.
_Avoid_: merged PDF, result PDF, output PDF

**PDF Combine Tool**:
The Tool that takes 2 or more Source PDFs and produces one Combined PDF by concatenating all pages of each Source PDF in a user-defined sequence.
_Avoid_: PDF merger, PDF joiner

**Merge Order**:
The user-defined sequence in which Source PDFs are concatenated to form the Combined PDF.
_Avoid_: file order, sort order

**Split PDF**:
One of the single-page PDF Documents produced as the output of the Split PDF Tool. There is one Split PDF per page of the Source PDF. Its filename follows the Output Filename pattern for Split PDFs.
_Avoid_: page PDF, output PDF

**PDF Split Tool**:
The Tool that takes 1 Source PDF and produces N Split PDFs (one per page of the Source PDF) bundled in a single downloadable archive.
_Avoid_: PDF splitter, PDF page extractor

**Contenido del QR**:
The text string encoded into a QR Code by the QR Code Tool. May be a URL or plain text — the Tool does not distinguish between them.
_Avoid_: URL, text, payload, input, query

**QR Code**:
The visual representation of the encoded Contenido del QR. What the user sees rendered in the QR Code Tool and the image file they can download.
_Avoid_: QR image, output image, barcode

**Share Link**:
A short URL of the form `/q/<id>` that, when opened in any browser, fetches the corresponding Contenido del QR from the backend and renders the same QR Code. Used to send the QR Code to other people via messaging apps without exposing the Contenido in the URL.
_Avoid_: short URL, shareable link, public link

**QR Code Tool**:
The Tool that encodes a Contenido del QR into a QR Code and produces a Share Link for distribution.
_Avoid_: QR generator, QR maker, QR tool

**Client-Side Processing**:
File operations execute entirely in the user's browser; files never traverse a server. Applies to FILE operations only (e.g., PDF Combine). The QR Code Tool stores Contenido del QR server-side to support Share Links — the QR encoding itself still happens client-side.
_Avoid_: local processing, browser-only

## Constraints

**Minimum Source PDF Count**: A merge session must have at least 2 Source PDFs before the merge can run. The merge control is disabled below this count.

**Total Size Limit (Combine)**: The combined byte size of all Source PDFs in a single merge session must not exceed 50MB. Source PDFs that would push the total over this limit are rejected at upload time.

**Total Size Limit (Split)**: The byte size of the Source PDF in a single split session must not exceed 50MB. Source PDFs above this limit are rejected at upload time.

**Minimum Source PDF Page Count**: A split session must have at least 1 page in the Source PDF before the split can run. The split control is disabled below this count.

**Password-Protected Source PDFs**: Rejected at upload time with an inline message. Not supported in the current scope.

## Patterns

**Output Filename**: `combined-{YYYY-MM-DD}.pdf` — e.g., `combined-2026-06-19.pdf`.

**Output Filename (Split)**: `split-{YYYY-MM-DD}.zip` — e.g., `split-2026-06-19.zip`. Each Split PDF inside the archive is named `page-NNN.pdf` (zero-padded 3 digits) — e.g., `page-001.pdf`, `page-002.pdf`.

**Empty Result State**: When the user navigates directly to `/tools/combine-pdf/result` without a prior merge in the session, the route shows a "No merge to show" message and a link back to `/tools/combine-pdf`.

**Empty Result State (Split)**: When the user navigates directly to `/tools/split-pdf/result` without a prior split in the session, the route shows a "No split to show" message and a link back to `/tools/split-pdf`.

# dag-tools

A web application that hosts multiple independent file-manipulation utilities ("Tools"). Each Tool is a self-contained workflow. Implemented Tools are PDF Combine and PDF Split; QR Code is planned.

All Tool processing is server-side. Files traverse the Hono backend; Artifacts are stored on the filesystem with metadata in SQLite; every Tool produces a Share Link.

Implemented Tools: PDF Combine, PDF Split. Planned: QR Code, PDF to EPUB (PDF to EPUB currently ships UI only — a form page with a disabled Convert control; no backend conversion yet).

All user-facing strings are in English.

## Language

**Tool**:
An independent, self-contained workflow exposed at its own route. Each Tool has its own inputs, intermediate state, and outputs; Tools do not share state.
_Avoid_: feature, mode, function, utility

**File Tool**:
A Tool whose output is a downloadable file produced server-side from user-uploaded files. The Artifact (file + metadata row) is stored and made available via a Share Link. Implemented examples: PDF Combine Tool, PDF Split Tool.
_Avoid_: file utility, download tool

**Link Tool** *[planned]*:
A Tool whose output is a Share Link that other people can open to retrieve the same content. The user-supplied content is stored server-side (inline in SQLite for small payloads) and rendered at the Share Link. Planned example: QR Code Tool.
_Avoid_: share tool, link generator

**Home**:
The `/` route. Lists the available Tools as cards and links to each Tool's form page.
_Avoid_: dashboard, index, landing

**Source PDF**:
A PDF Document uploaded by the user as input to a File Tool. Must have extension `.pdf`, be parseable by pdf-lib, and not be password-protected or encrypted. Subject to the Total Size Limit for the relevant Tool.
_Avoid_: input PDF, uploaded PDF

**Artifact**:
The stored result of a Tool invocation — a row in the `artifacts` table plus, for File Tools, a file on disk under `./storage/<id>.<ext>`. Identified by an opaque Share ID and addressed via the Share Link. Lives forever (no TTL).
_Avoid_: result, output, stored file

**Combined PDF**:
The single PDF Document produced as the output of the PDF Combine Tool. Stored at `./storage/<id>.pdf`, served from `/pdf/combine/:id` with `Content-Disposition: attachment`. Filename follows the Output Filename pattern.
_Avoid_: merged PDF, result PDF, output PDF

**PDF Combine Tool**:
A File Tool that takes 2 or more Source PDFs and produces one Combined PDF by concatenating all pages of each Source PDF in a user-defined sequence. Form at `/pdf/combine`, API at `POST /api/v1/pdf/combine`, Share Link at `/pdf/combine/:id`.
_Avoid_: PDF merger, PDF joiner

**Merge Order**:
The user-defined sequence in which Source PDFs are concatenated to form the Combined PDF.
_Avoid_: file order, sort order

**Split PDF**:
One of the single-page PDF Documents produced as the output of the PDF Split Tool. There is one Split PDF per page of the Source PDF. All Split PDFs are bundled in a single ZIP archive stored at `./storage/<id>.zip` and served from `/pdf/split/:id`.
_Avoid_: page PDF, output PDF

**PDF Split Tool**:
A File Tool that takes 1 Source PDF and produces N Split PDFs (one per page of the Source PDF) bundled in a single downloadable archive. Form at `/pdf/split`, API at `POST /api/v1/pdf/split`, Share Link at `/pdf/split/:id`.
_Avoid_: PDF splitter, PDF page extractor

**EPUB Document** *[planned]*:
The reflowable ebook file produced as the output of the PDF to EPUB Tool. Intended storage `./storage/<id>.epub`, served from `/pdf/epub/:id` with `Content-Disposition: attachment`. Conversion is not yet implemented, so no EPUB Document is produced today.
_Avoid_: ebook, converted file, output EPUB

**PDF to EPUB Tool** *[planned]*:
A File Tool that takes 1 Source PDF and produces one EPUB Document. Form at `/pdf/epub`. Backend is **not implemented**: the form page exists and reuses Source PDF validation, but the Convert control is permanently disabled with an inline "coming soon" note, and no API endpoint or Share Link is wired (`POST /api/v1/pdf/epub` and `/pdf/epub/:id` are reserved for when conversion lands).
_Avoid_: EPUB converter, ebook tool, PDF-to-ebook

**QR Content** *[planned]*:
The text string encoded into a QR Code by the QR Code Tool. May be a URL or plain text — the Tool does not distinguish between them. Stored inline in the `artifacts` table's `text_content` column.
_Avoid_: URL, text, payload, input, query

**QR Code** *[planned]*:
The visual representation of the encoded QR Content. What the user sees when the Share Link is opened. Encoding happens **server-side**: a dedicated QR Image Endpoint renders the QR Content to a PNG, and the Share Link page embeds it via an `<img>` element so the browser's native right-click "Save image as" works. No browser JS is involved in rendering (consistent with Server-Side Processing).
_Avoid_: QR image, output image, barcode

**QR Image Endpoint** *[planned]*:
The server route that renders the QR Content for a given Share ID to a PNG (`Content-Type: image/png`) and is used as the `src` of the `<img>` on the Share Link page. Enables native browser image download. Route `GET /links/qr/:id.png`.
_Avoid_: QR url, image route

**Share Link**:
A URL of the form `/<group>/<tool>/:id` that, when opened, fetches the corresponding Artifact from the backend. The Share ID is the only authorization — anyone with the link has access. Examples: `/pdf/combine/:id`, `/pdf/split/:id`, `/links/qr/:id` (planned).
_Avoid_: short URL, shareable link, public link

**Share ID**:
The opaque string identifier of an Artifact. Generated when the Tool is invoked and embedded in the Share Link. Generation strategy is deferred (design seam); the schema accepts any opaque string of reasonable length, so the implementation can be swapped (nanoid, UUID, base62, etc.) without migration.
_Avoid_: token, slug, short code

**QR Code Tool** *[planned]*:
A Link Tool that encodes a QR Content into a QR Code and produces a Share Link for distribution. Form at `/links/qr`, API at `POST /api/v1/links/qr`, Share Link at `/links/qr/:id`. The Share Link page is rendered server-side: the backend reads the QR Content and embeds the QR Code via an `<img>` pointing at the QR Image Endpoint (`/links/qr/:id.png`).
_Avoid_: QR generator, QR maker, QR tool

**Server-Side Processing**:
All Tool processing happens on the Hono backend. Files traverse the server; nothing is computed in the browser. The browser is a UI shell that uploads files and renders share links. Applies to all Tools uniformly.
_Avoid_: cloud processing, remote processing

## Constraints

**Minimum Source PDF Count**: A combine invocation must have at least 2 Source PDFs before the merge can run. The merge control is disabled below this count.

**Total Size Limit (Combine)**: The combined byte size of all Source PDFs in a single combine invocation must not exceed 50MB. Source PDFs that would push the total over this limit are rejected at upload time.

**Total Size Limit (Split)**: The byte size of the Source PDF in a single split invocation must not exceed 50MB. Source PDFs above this limit are rejected at upload time.

**Minimum Source PDF Page Count**: A split invocation must have at least 1 page in the Source PDF before the split can run. The split control is disabled below this count.

**Password-Protected Source PDFs**: Rejected at upload time with an inline message. Not supported in the current scope.

**QR Content Limits**: QR Content is trimmed of surrounding whitespace on **both** frontend and backend — the backend never relies on the frontend having trimmed. Empty-after-trim is rejected (the frontend disables the submit control; the backend rejects independently). Maximum length is **2048 bytes** (UTF-8); over-limit is rejected on both frontend and backend.

**No TTL (Artifacts live forever)**: Artifacts do not expire. The `expires_at` column on `artifacts` is reserved for a future TTL feature (design seam) — populated as `NULL` for now.

**No Auth (Open Share Links)**: The Share ID is the only authorization. There is no user account system; anyone with a Share Link has access. The `creator_token` column on `artifacts` is reserved for a future auth feature (design seam) — populated as `NULL` for now.

## Patterns

**Output Filename**: `combined-{YYYY-MM-DD}.pdf` — e.g., `combined-2026-06-19.pdf`.

**Output Filename (Split)**: `split-{YYYY-MM-DD}.zip` — e.g., `split-2026-06-19.zip`. Each Split PDF inside the archive is named `page-NNN.pdf` (zero-padded 3 digits) — e.g., `page-001.pdf`, `page-002.pdf`.

**API Response Shape**: File Tool API calls return JSON: `{ id, url, filename, size, mimeType, createdAt, pageCount? }` — `pageCount` is included for PDF Tools. Link Tools (QR, planned) correspond to a lean shape `{ id, url, createdAt }`, where `url` is the Share Link; `filename`/`size`/`mimeType`/`pageCount` are omitted because nothing is rendered to a file at creation (the PNG is produced on-demand by the QR Image Endpoint). As with File Tools, the success response is surfaced as a rendered HTML Share Link panel (htmx fragment), not raw JSON.

**404 on Missing Artifact**: When a Share Link is opened with an unknown `:id`, the server returns 404. The frontend renders a "this artifact is not available" message and a link back to the relevant form page.

**File Serve**: File Tool Share Links (`/pdf/combine/:id`, `/pdf/split/:id`) serve the binary file directly with `Content-Disposition: attachment`. The browser handles download or inline view based on user preference. The Link Tool Share Link (`/links/qr/:id`, planned) renders an HTML page that embeds the QR Code via `<img src="/links/qr/:id.png">`, served by the server-side QR Image Endpoint (no browser JS in rendering). Native right-click "Save image as" downloads the PNG.

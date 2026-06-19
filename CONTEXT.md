# dag-tools

A web application that hosts multiple independent file-manipulation utilities ("Tools"). Each Tool is a self-contained workflow. The first Tool is PDF Combine.

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

**Client-Side Processing**:
File operations execute entirely in the user's browser; files never traverse a server.
_Avoid_: local processing, browser-only

## Constraints

**Minimum Source PDF Count**: A merge session must have at least 2 Source PDFs before the merge can run. The merge control is disabled below this count.

**Total Size Limit**: The combined byte size of all Source PDFs in a single merge session must not exceed 50MB. Source PDFs that would push the total over this limit are rejected at upload time.

**Password-Protected Source PDFs**: Rejected at upload time with an inline message. Not supported in the current scope.

## Patterns

**Output Filename**: `combined-{YYYY-MM-DD}.pdf` — e.g., `combined-2026-06-19.pdf`.

**Empty Result State**: When the user navigates directly to `/tools/combine-pdf/result` without a prior merge in the session, the route shows a "No merge to show" message and a link back to `/tools/combine-pdf`.

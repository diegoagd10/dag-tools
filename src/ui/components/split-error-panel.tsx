/** @jsxImportSource hono/jsx */

import type { PdfDefect } from "@/modules/inspect-pdf";

export const SplitErrorPanel = ({
  filename,
  reason,
}: {
  filename: string;
  reason: PdfDefect | "too-few-pages" | "oversize";
}) => {
  const messages: Record<string, string> = {
    encrypted: `"${filename}" is password-protected and cannot be split. Use an unprotected PDF instead.`,
    corrupt: `"${filename}" is corrupt or unreadable and cannot be split. Verify the file and try again.`,
    "too-few-pages": `"${filename}" must contain at least 1 page to split.`,
    "not-a-pdf": `"${filename}" is not a valid PDF and cannot be split.`,
    oversize: `"${filename}" exceeds the 50 MB limit and cannot be split.`,
  };

  return (
    <div id="split-result">
      <div
        class="mt-6 rounded-lg border border-red-200 bg-red-50 p-4"
        role="alert"
      >
        <p class="font-sans text-sm font-medium text-red-800">
          {messages[reason] ?? `"${filename}" could not be processed.`}
        </p>
      </div>
    </div>
  );
};

/** @jsxImportSource hono/jsx */

import type { PdfDefect } from "@/modules/inspect-pdf";

export const CombineErrorPanel = ({
  filename,
  reason,
}: {
  filename: string;
  reason: PdfDefect;
}) => {
  const messages: Record<PdfDefect, string> = {
    encrypted: `"${filename}" is password-protected and cannot be combined. Remove the file and try again.`,
    corrupt: `"${filename}" is corrupt or unreadable and cannot be combined. Remove the file and try again.`,
    "not-a-pdf": `"${filename}" is not a valid PDF and cannot be combined. Remove the file and try again.`,
  };

  const message = messages[reason];

  return (
    <div id="combine-result">
      <div
        class="mt-6 rounded-lg border border-red-200 bg-red-50 p-4"
        role="alert"
      >
        <p class="font-sans text-sm font-medium text-red-800">
          {message}
        </p>
      </div>
    </div>
  );
};

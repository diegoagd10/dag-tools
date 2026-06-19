import type { RejectionReason } from "./types";

export const MIN_SOURCE_PDF_COUNT = 2;

export const TOTAL_SIZE_LIMIT_BYTES = 50 * 1024 * 1024;

export const COMBINED_PDF_FILENAME_PREFIX = "combined";

export type PerFileRejectionReason = Exclude<RejectionReason, "min-count">;

export const REJECTION_MESSAGES: Record<PerFileRejectionReason, string> = {
  "not-a-pdf": "This file is not a valid PDF",
  encrypted: "This file is password-protected",
  "total-size-exceeded": "This file would push the total over 50MB",
};

export function buildCombinedPdfFilename(date = new Date()): string {
  const isoDate = date.toISOString().slice(0, 10);
  return `${COMBINED_PDF_FILENAME_PREFIX}-${isoDate}.pdf`;
}

function formatUnit(value: number, unit: string): string {
  const rounded = value >= 100 ? Math.round(value) : Number(value.toFixed(1));
  return `${rounded} ${unit}`;
}

export function formatBytes(bytes: number): string {
  const megabyte = 1024 * 1024;
  const kilobyte = 1024;

  if (bytes >= megabyte) {
    return formatUnit(bytes / megabyte, "MB");
  }
  if (bytes >= kilobyte) {
    return formatUnit(bytes / kilobyte, "KB");
  }
  return `${bytes} B`;
}

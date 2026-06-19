import type { SplitRejectionReason, SplitResult } from "./types";

export const SOURCE_PDF_SIZE_LIMIT_BYTES = 50 * 1024 * 1024;

export const SPLIT_ZIP_FILENAME_PREFIX = "split";

export const REJECTION_MESSAGES: Record<SplitRejectionReason, string> = {
  "not-a-pdf": "This file is not a valid PDF",
  encrypted: "This file is password-protected",
  oversize: "This file is over 50MB",
};

export function buildSplitZipFilename(date = new Date()): string {
  const isoDate = date.toISOString().slice(0, 10);
  return `${SPLIT_ZIP_FILENAME_PREFIX}-${isoDate}.zip`;
}

export function createSplitResult(
  blob: Blob,
  filename: string,
  pageCount: number,
): SplitResult {
  return {
    blob,
    url: URL.createObjectURL(blob),
    filename,
    size: blob.size,
    pageCount,
  };
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

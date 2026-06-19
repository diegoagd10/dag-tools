export const MIN_SOURCE_PDF_COUNT = 2;

export const COMBINED_PDF_FILENAME_PREFIX = "combined";

export function buildCombinedPdfFilename(date = new Date()): string {
  const isoDate = date.toISOString().slice(0, 10);
  return `${COMBINED_PDF_FILENAME_PREFIX}-${isoDate}.pdf`;
}

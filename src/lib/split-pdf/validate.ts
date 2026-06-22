import { SOURCE_PDF_SIZE_LIMIT_BYTES } from "./constants";
import type { SourcePdf, SplitValidationResult } from "./types";

export function validate(sourcePdf: SourcePdf | null): SplitValidationResult {
  if (!sourcePdf) {
    return { accepted: false, reason: null };
  }
  if (!sourcePdf.isPdf) {
    return { accepted: false, reason: "not-a-pdf" };
  }
  if (sourcePdf.encrypted) {
    return { accepted: false, reason: "encrypted" };
  }
  if (sourcePdf.size > SOURCE_PDF_SIZE_LIMIT_BYTES) {
    return { accepted: false, reason: "oversize" };
  }
  if (sourcePdf.pageCount < 1) {
    return { accepted: false, reason: "too-few-pages" };
  }
  return { accepted: true, reason: null };
}

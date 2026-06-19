import { MIN_SOURCE_PDF_COUNT, TOTAL_SIZE_LIMIT_BYTES } from "./constants";
import type {
  RejectedFile,
  ValidationResult,
  SourcePdf,
} from "./types";

export function validate(sourcePdfs: SourcePdf[]): ValidationResult {
  const accepted: SourcePdf[] = [];
  const rejected: RejectedFile[] = [];
  let runningTotal = 0;

  for (const pdf of sourcePdfs) {
    if (!pdf.isPdf) {
      rejected.push({ id: pdf.id, reason: "not-a-pdf", name: pdf.name });
      continue;
    }
    if (pdf.encrypted) {
      rejected.push({ id: pdf.id, reason: "encrypted", name: pdf.name });
      continue;
    }
    if (runningTotal + pdf.size > TOTAL_SIZE_LIMIT_BYTES) {
      rejected.push({
        id: pdf.id,
        reason: "total-size-exceeded",
        name: pdf.name,
      });
      continue;
    }

    accepted.push(pdf);
    runningTotal += pdf.size;
  }

  if (accepted.length < MIN_SOURCE_PDF_COUNT) {
    rejected.push({ reason: "min-count" });
  }

  return { accepted, rejected };
}

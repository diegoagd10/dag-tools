import { MIN_SOURCE_PDF_COUNT } from "./constants";
import type {
  RejectedFile,
  ValidationResult,
  SourcePdf,
} from "./types";

export function validate(sourcePdfs: SourcePdf[]): ValidationResult {
  const accepted: SourcePdf[] = [...sourcePdfs];
  const rejected: RejectedFile[] = [];

  if (accepted.length < MIN_SOURCE_PDF_COUNT) {
    rejected.push({ reason: "min-count" });
  }

  return { accepted, rejected };
}

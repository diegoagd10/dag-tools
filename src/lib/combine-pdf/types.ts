export type RejectionReason =
  | "min-count"
  | "not-a-pdf"
  | "encrypted"
  | "total-size-exceeded";

import type { SourcePdf } from "@/lib/pdf-tools/types";
export type { SourcePdf };

export interface RejectedFile {
  reason: RejectionReason;
  id?: string;
  name?: string;
}

export interface ValidationResult {
  accepted: SourcePdf[];
  rejected: RejectedFile[];
}

export interface CombinedPdf {
  blob: Blob;
  url: string;
  filename: string;
  size: number;
  pageCount: number;
}

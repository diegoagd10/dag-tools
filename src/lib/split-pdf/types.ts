export type SplitRejectionReason = "not-a-pdf" | "encrypted" | "oversize" | "too-few-pages";

import type { SourcePdf } from "@/lib/pdf-tools/types";
export type { SourcePdf };

export interface SplitValidationResult {
  accepted: boolean;
  reason: SplitRejectionReason | null;
}

export interface SplitResult {
  blob: Blob;
  url: string;
  filename: string;
  size: number;
  pageCount: number;
}

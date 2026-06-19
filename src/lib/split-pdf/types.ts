export type SplitRejectionReason = "not-a-pdf" | "encrypted" | "oversize";

export interface SourcePdf {
  id: string;
  file: File;
  name: string;
  size: number;
  isPdf: boolean;
  encrypted: boolean;
  pageCount: number;
}

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

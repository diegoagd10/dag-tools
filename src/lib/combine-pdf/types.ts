export type RejectionReason =
  | "min-count"
  | "not-a-pdf"
  | "encrypted"
  | "total-size-exceeded";

export interface SourcePdf {
  id: string;
  file: File;
  name: string;
  size: number;
  isPdf: boolean;
  encrypted: boolean;
}

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
  filename: string;
}

export interface SourcePdf {
  id: string;
  file: File;
  name: string;
  size: number;
  isPdf: boolean;
  encrypted: boolean;
  pageCount: number;
}

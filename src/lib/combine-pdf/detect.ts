import { PDFDocument } from "pdf-lib";

export interface FileAnalysis {
  isPdf: boolean;
  encrypted: boolean;
  pageCount: number;
}

export async function analyzeFile(file: File): Promise<FileAnalysis> {
  try {
    const doc = await PDFDocument.load(await file.arrayBuffer());
    return { isPdf: true, encrypted: false, pageCount: doc.getPageCount() };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/encrypt/i.test(message)) {
      return { isPdf: true, encrypted: true, pageCount: 0 };
    }
    return { isPdf: false, encrypted: false, pageCount: 0 };
  }
}

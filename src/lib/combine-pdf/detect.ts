import { PDFDocument } from "pdf-lib";

export interface FileAnalysis {
  isPdf: boolean;
  encrypted: boolean;
}

export async function analyzeFile(file: File): Promise<FileAnalysis> {
  try {
    await PDFDocument.load(await file.arrayBuffer());
    return { isPdf: true, encrypted: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/encrypt/i.test(message)) {
      return { isPdf: true, encrypted: true };
    }
    return { isPdf: false, encrypted: false };
  }
}

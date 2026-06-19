import { PDFDocument } from "pdf-lib";
import type { SourcePdf } from "./types";

export async function merge(orderedPdfs: SourcePdf[]): Promise<Uint8Array> {
  const combined = await PDFDocument.create();

  for (const source of orderedPdfs) {
    const bytes = await source.file.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const pages = await combined.copyPages(doc, doc.getPageIndices());
    for (const page of pages) {
      combined.addPage(page);
    }
  }

  return combined.save();
}

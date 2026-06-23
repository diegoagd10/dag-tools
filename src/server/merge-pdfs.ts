import { PDFDocument } from "pdf-lib";

export async function mergePdfs(buffers: Uint8Array[]): Promise<Uint8Array> {
  const combined = await PDFDocument.create();

  for (const buffer of buffers) {
    const doc = await PDFDocument.load(buffer);
    const pages = await combined.copyPages(doc, doc.getPageIndices());
    for (const page of pages) {
      combined.addPage(page);
    }
  }

  return combined.save();
}

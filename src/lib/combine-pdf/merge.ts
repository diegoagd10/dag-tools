import { PDFDocument } from "pdf-lib";
import type { SourcePdf } from "./types";

export async function merge(
  sourcePdfs: SourcePdf[],
  order: string[],
): Promise<Uint8Array> {
  const byId = new Map(sourcePdfs.map((pdf) => [pdf.id, pdf]));
  const combined = await PDFDocument.create();

  for (const id of order) {
    const source = byId.get(id);
    if (!source) continue;

    const bytes = await source.file.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const pages = await combined.copyPages(doc, doc.getPageIndices());
    for (const page of pages) {
      combined.addPage(page);
    }
  }

  return combined.save();
}

import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

export function entryName(index: number): string {
  return `page-${String(index + 1).padStart(3, "0")}.pdf`;
}

export async function splitPdfs(source: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(source);
  const zip = new JSZip();
  const pageCount = doc.getPageCount();

  for (let i = 0; i < pageCount; i++) {
    const single = await PDFDocument.create();
    const [page] = await single.copyPages(doc, [i]);
    single.addPage(page);
    const bytes = await single.save();
    zip.file(entryName(i), bytes);
  }

  return zip.generateAsync({ type: "uint8array" });
}

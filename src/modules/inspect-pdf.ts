export type PdfDefect = "not-a-pdf" | "encrypted" | "corrupt";

export type Inspection =
  | { ok: true; pageCount: number }
  | { ok: false; reason: PdfDefect };

export async function inspectPdf(bytes: Uint8Array): Promise<Inspection> {
  if (bytes.length < 4 || bytes[0] !== 0x25 || bytes[1] !== 0x50) {
    return { ok: false, reason: "not-a-pdf" };
  }

  try {
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(bytes);
    return { ok: true, pageCount: doc.getPageCount() };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const reason: PdfDefect = message.includes("is encrypted")
      ? "encrypted"
      : "corrupt";
    return { ok: false, reason };
  }
}

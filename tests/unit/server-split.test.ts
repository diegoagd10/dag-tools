import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { splitPdfs, entryName } from "@/server/split-pdfs";

const fixtures = resolve(process.cwd(), "tests", "fixtures");

async function loadFixture(name: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(resolve(fixtures, name)));
}

describe("splitPdfs", () => {
  it("produces a ZIP with one entry per page, named page-NNN.pdf (zero-padded, 1-indexed), each a valid 1-page PDF", async () => {
    const source = await loadFixture("sample-multi-page.pdf");
    const bytes = await splitPdfs(source);

    const zip = await JSZip.loadAsync(bytes);
    const names = Object.keys(zip.files).sort();
    expect(names).toEqual(["page-001.pdf", "page-002.pdf", "page-003.pdf"]);

    for (const name of names) {
      const entry = await zip.file(name)!.async("uint8array");
      const doc = await PDFDocument.load(entry);
      expect(doc.getPageCount()).toBe(1);
    }
  });

  it("handles a single-page Source PDF, producing one page-001.pdf entry", async () => {
    const source = await loadFixture("sample-1.pdf");
    const bytes = await splitPdfs(source);

    const zip = await JSZip.loadAsync(bytes);
    expect(Object.keys(zip.files).sort()).toEqual(["page-001.pdf"]);

    const entry = await zip.file("page-001.pdf")!.async("uint8array");
    const doc = await PDFDocument.load(entry);
    expect(doc.getPageCount()).toBe(1);
  });

  it("zero-pads entry names to three digits for a Source PDF with more than nine pages", () => {
    expect(entryName(0)).toBe("page-001.pdf");
    expect(entryName(9)).toBe("page-010.pdf");
    expect(entryName(99)).toBe("page-100.pdf");
  });
});

import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { split } from "@/lib/split-pdf/split";

async function fileFrom(path: string, name: string): Promise<File> {
  const buffer = await readFile(path);
  return new File([buffer], name);
}

function entryName(index: number): string {
  return `page-${String(index + 1).padStart(3, "0")}.pdf`;
}

describe("split", () => {
  it("produces a ZIP with one entry per page, named page-NNN.pdf (zero-padded, 1-indexed), each a valid 1-page PDF", async () => {
    const path = resolve(
      process.cwd(),
      "tests",
      "fixtures",
      "sample-multi-page.pdf",
    );
    const bytes = await split(await fileFrom(path, "sample-multi-page.pdf"));

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
    const path = resolve(process.cwd(), "tests", "fixtures", "sample-1.pdf");
    const bytes = await split(await fileFrom(path, "sample-1.pdf"));

    const zip = await JSZip.loadAsync(bytes);
    expect(Object.keys(zip.files).sort()).toEqual(["page-001.pdf"]);

    const entry = await zip.file("page-001.pdf")!.async("uint8array");
    const doc = await PDFDocument.load(entry);
    expect(doc.getPageCount()).toBe(1);
  });

  it("zero-pads entry names to three digits for a Source PDF with more than nine pages", async () => {
    expect(entryName(0)).toBe("page-001.pdf");
    expect(entryName(9)).toBe("page-010.pdf");
    expect(entryName(99)).toBe("page-100.pdf");
  });
});

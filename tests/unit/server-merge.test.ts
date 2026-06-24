import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PDFDocument } from "pdf-lib";
import { mergePdfs } from "@/modules/merge-pdfs";

const fixtures = resolve(process.cwd(), "tests", "fixtures");

async function loadFixture(name: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(resolve(fixtures, name)));
}

describe("mergePdfs", () => {
  it("produces a Combined PDF whose page count equals the sum of input page counts", async () => {
    const a = await loadFixture("sample-1.pdf"); // 1 page
    const b = await loadFixture("sample-2.pdf"); // 2 pages

    const combined = await mergePdfs([a, b]);
    const doc = await PDFDocument.load(combined);

    expect(doc.getPageCount()).toBe(3);
  });

  it("preserves merge order — first PDF pages appear before second PDF pages", async () => {
    // sample-2.pdf has 2 pages; sample-multi-page.pdf has 3.
    // If order is preserved, sample-2 pages come first then sample-multi-page.
    const a = await loadFixture("sample-2.pdf");      // 2 pages
    const b = await loadFixture("sample-multi-page.pdf"); // 3 pages

    const combined = await mergePdfs([a, b]);
    const doc = await PDFDocument.load(combined);

    expect(doc.getPageCount()).toBe(5);

    // Extract first page of combined and compare to first page of sample-2
    // Strategy: each page's MediaBox dimensions should match the source.
    // Page 0 of combined should match page 0 of a.
    // Page 2 of combined should match page 0 of b.
    const docA = await PDFDocument.load(a);
    const docB = await PDFDocument.load(b);

    const page0Size = doc.getPage(0).getSize();
    const page2Size = doc.getPage(2).getSize();
    const a0Size = docA.getPage(0).getSize();
    const b0Size = docB.getPage(0).getSize();

    expect(page0Size.width).toBe(a0Size.width);
    expect(page0Size.height).toBe(a0Size.height);

    expect(page2Size.width).toBe(b0Size.width);
    expect(page2Size.height).toBe(b0Size.height);
  });
});

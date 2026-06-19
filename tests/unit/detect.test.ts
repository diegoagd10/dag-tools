import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { analyzeFile } from "@/lib/combine-pdf/detect";

async function fileFrom(path: string, name: string): Promise<File> {
  const buffer = await readFile(path);
  return new File([buffer], name);
}

describe("analyzeFile", () => {
  it("identifies a valid PDF as a non-encrypted PDF with its page count", async () => {
    const path = resolve(process.cwd(), "tests", "fixtures", "sample-1.pdf");
    const analysis = await analyzeFile(await fileFrom(path, "sample-1.pdf"));

    expect(analysis).toEqual({ isPdf: true, encrypted: false, pageCount: 1 });
  });

  it("identifies a non-PDF file as not a PDF", async () => {
    const path = resolve(process.cwd(), "tests", "fixtures", "not-a-pdf.txt");
    const analysis = await analyzeFile(await fileFrom(path, "not-a-pdf.txt"));

    expect(analysis).toEqual({ isPdf: false, encrypted: false, pageCount: 0 });
  });
});

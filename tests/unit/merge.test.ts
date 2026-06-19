import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PDFDocument } from "pdf-lib";
import { merge } from "@/lib/combine-pdf/merge";
import type { SourcePdf } from "@/lib/combine-pdf/types";

async function makeSourcePdf(path: string, id: string): Promise<SourcePdf> {
  const buffer = await readFile(path);
  const file = new File([buffer], `${id}.pdf`, { type: "application/pdf" });
  return {
    id,
    file,
    name: file.name,
    size: buffer.length,
    isPdf: true,
    encrypted: false,
  };
}

describe("merge", () => {
  it("produces a Combined PDF whose page count equals the sum of the input page counts", async () => {
    const fixtures = resolve(process.cwd(), "tests", "fixtures");
    const a = await makeSourcePdf(resolve(fixtures, "sample-1.pdf"), "a");
    const b = await makeSourcePdf(resolve(fixtures, "sample-2.pdf"), "b");

    const bytes = await merge([a, b], ["a", "b"]);
    const combined = await PDFDocument.load(bytes);

    expect(combined.getPageCount()).toBe(3);
  });
});

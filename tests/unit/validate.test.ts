import { describe, it, expect } from "vitest";
import { validate } from "@/lib/combine-pdf/validate";
import { MIN_SOURCE_PDF_COUNT } from "@/lib/combine-pdf/constants";
import type { SourcePdf } from "@/lib/combine-pdf/types";

function makeSourcePdf(id: string, name: string, size: number): SourcePdf {
  return {
    id,
    file: new File([], name, { type: "application/pdf" }),
    name,
    size,
  };
}

describe("validate", () => {
  it("accepts two or more valid Source PDFs with no rejections (happy path)", () => {
    const sourcePdfs = [
      makeSourcePdf("a", "a.pdf", 100),
      makeSourcePdf("b", "b.pdf", 200),
    ];

    const { accepted, rejected } = validate(sourcePdfs);

    expect(accepted).toHaveLength(2);
    expect(rejected).toEqual([]);
  });

  it("flags a min-count rejection when fewer than the minimum are accepted", () => {
    const sourcePdfs = [makeSourcePdf("a", "a.pdf", 100)];

    const { accepted, rejected } = validate(sourcePdfs);

    expect(accepted).toHaveLength(1);
    expect(rejected).toEqual([{ reason: "min-count" }]);
    expect(MIN_SOURCE_PDF_COUNT).toBe(2);
  });
});

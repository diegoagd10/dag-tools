import { describe, it, expect } from "vitest";
import { validate } from "@/lib/combine-pdf/validate";
import { MIN_SOURCE_PDF_COUNT } from "@/lib/combine-pdf/constants";
import type { SourcePdf } from "@/lib/combine-pdf/types";

function makeSourcePdf(
  id: string,
  name: string,
  size: number,
  opts: { isPdf?: boolean; encrypted?: boolean } = {},
): SourcePdf {
  return {
    id,
    file: new File([], name, { type: "application/pdf" }),
    name,
    size,
    isPdf: opts.isPdf ?? true,
    encrypted: opts.encrypted ?? false,
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

  it("rejects files that are not PDFs with reason 'not-a-pdf'", () => {
    const sourcePdfs = [
      makeSourcePdf("a", "a.pdf", 100),
      makeSourcePdf("b", "b.pdf", 200),
      makeSourcePdf("c", "c.txt", 50, { isPdf: false }),
    ];

    const { accepted, rejected } = validate(sourcePdfs);

    expect(accepted.map((p) => p.id)).toEqual(["a", "b"]);
    expect(rejected).toEqual([
      { id: "c", reason: "not-a-pdf", name: "c.txt" },
    ]);
  });

  it("rejects encrypted PDFs with reason 'encrypted'", () => {
    const sourcePdfs = [
      makeSourcePdf("a", "a.pdf", 100),
      makeSourcePdf("b", "b.pdf", 200),
      makeSourcePdf("c", "c.pdf", 50, { encrypted: true }),
    ];

    const { accepted, rejected } = validate(sourcePdfs);

    expect(accepted.map((p) => p.id)).toEqual(["a", "b"]);
    expect(rejected).toEqual([
      { id: "c", reason: "encrypted", name: "c.pdf" },
    ]);
  });

  it("rejects files that would push the total over the size limit with reason 'total-size-exceeded'", () => {
    const mb = 1024 * 1024;
    const sourcePdfs = [
      makeSourcePdf("a", "a.pdf", 20 * mb),
      makeSourcePdf("b", "b.pdf", 20 * mb),
      makeSourcePdf("c", "c.pdf", 15 * mb),
    ];

    const { accepted, rejected } = validate(sourcePdfs);

    expect(accepted.map((p) => p.id)).toEqual(["a", "b"]);
    expect(rejected).toEqual([
      { id: "c", reason: "total-size-exceeded", name: "c.pdf" },
    ]);
  });
});

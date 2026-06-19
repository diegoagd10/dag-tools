import { describe, it, expect } from "vitest";
import { validate } from "@/lib/split-pdf/validate";
import type { SourcePdf } from "@/lib/split-pdf/types";

function makeSourcePdf(
  opts: { isPdf?: boolean; encrypted?: boolean; pageCount?: number; size?: number } = {},
): SourcePdf {
  return {
    id: "a",
    file: new File([], "a.pdf", { type: "application/pdf" }),
    name: "a.pdf",
    size: opts.size ?? 100,
    isPdf: opts.isPdf ?? true,
    encrypted: opts.encrypted ?? false,
    pageCount: opts.pageCount ?? 1,
  };
}

describe("validate", () => {
  it("accepts a valid Source PDF (happy path)", () => {
    expect(validate(makeSourcePdf())).toEqual({ accepted: true, reason: null });
  });

  it("accepts a single-page Source PDF", () => {
    expect(validate(makeSourcePdf({ pageCount: 1 }))).toEqual({
      accepted: true,
      reason: null,
    });
  });

  it("rejects with no reason when no Source PDF has been loaded", () => {
    expect(validate(null)).toEqual({ accepted: false, reason: null });
  });
});

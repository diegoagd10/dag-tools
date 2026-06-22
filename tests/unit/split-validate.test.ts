import { describe, it, expect } from "vitest";
import { validate } from "@/lib/split-pdf/validate";
import { SOURCE_PDF_SIZE_LIMIT_BYTES } from "@/lib/split-pdf/constants";
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

  it("rejects a non-PDF with reason 'not-a-pdf'", () => {
    expect(validate(makeSourcePdf({ isPdf: false }))).toEqual({
      accepted: false,
      reason: "not-a-pdf",
    });
  });

  it("rejects an encrypted PDF with reason 'encrypted'", () => {
    expect(validate(makeSourcePdf({ encrypted: true }))).toEqual({
      accepted: false,
      reason: "encrypted",
    });
  });

  it("rejects a PDF over the size limit with reason 'oversize'", () => {
    expect(
      validate(makeSourcePdf({ size: SOURCE_PDF_SIZE_LIMIT_BYTES + 1 })),
    ).toEqual({ accepted: false, reason: "oversize" });
  });

  it("accepts a PDF that is exactly at the size limit", () => {
    expect(
      validate(makeSourcePdf({ size: SOURCE_PDF_SIZE_LIMIT_BYTES })),
    ).toEqual({ accepted: true, reason: null });
  });

  it("rejects a Source PDF with zero pages", () => {
    expect(validate(makeSourcePdf({ pageCount: 0 }))).toEqual({
      accepted: false,
      reason: "too-few-pages",
    });
  });

  it("accepts a Source PDF with exactly 1 page", () => {
    expect(validate(makeSourcePdf({ pageCount: 1 }))).toEqual({
      accepted: true,
      reason: null,
    });
  });

  it("accepts a Source PDF with many pages", () => {
    expect(validate(makeSourcePdf({ pageCount: 99 }))).toEqual({
      accepted: true,
      reason: null,
    });
  });
});

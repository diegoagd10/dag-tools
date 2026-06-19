import { describe, it, expect } from "vitest";
import {
  buildCombinedPdfFilename,
  formatBytes,
  TOTAL_SIZE_LIMIT_BYTES,
} from "@/lib/combine-pdf/constants";

describe("buildCombinedPdfFilename", () => {
  it("formats as combined-{YYYY-MM-DD}.pdf using the ISO date", () => {
    expect(
      buildCombinedPdfFilename(new Date("2026-06-19T12:00:00.000Z")),
    ).toBe("combined-2026-06-19.pdf");
  });
});

describe("formatBytes", () => {
  it("formats bytes below a kilobyte as bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats kilobytes with one decimal", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(12 * 1024 + 512)).toBe("12.5 KB");
  });

  it("formats megabytes with one decimal, stripping trailing .0", () => {
    expect(formatBytes(TOTAL_SIZE_LIMIT_BYTES)).toBe("50 MB");
    expect(formatBytes(Math.round(1.2 * 1024 * 1024))).toBe("1.2 MB");
  });
});

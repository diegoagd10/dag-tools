import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { inspectPdf } from "@/modules/inspect-pdf";

const fixtures = resolve(process.cwd(), "tests", "fixtures");

async function loadFixture(name: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(resolve(fixtures, name)));
}

describe("inspectPdf", () => {
  it("returns ok with page count for a valid single-page PDF", async () => {
    const bytes = await loadFixture("sample-1.pdf");
    const result = await inspectPdf(bytes);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.pageCount).toBe(1);
    }
  });

  it("returns ok with correct page count for a multi-page PDF", async () => {
    const bytes = await loadFixture("sample-multi-page.pdf");
    const result = await inspectPdf(bytes);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.pageCount).toBe(3);
    }
  });

  it("returns not ok with reason encrypted for an encrypted PDF", async () => {
    const bytes = await loadFixture("encrypted.pdf");
    const result = await inspectPdf(bytes);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("encrypted");
    }
  });

  it("returns not ok with reason corrupt for a corrupt PDF", async () => {
    const bytes = await loadFixture("corrupt.pdf");
    const result = await inspectPdf(bytes);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("corrupt");
    }
  });

  it("returns not ok with reason not-a-pdf for a non-PDF text file", async () => {
    const bytes = await loadFixture("not-a-pdf.txt");
    const result = await inspectPdf(bytes);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("not-a-pdf");
    }
  });

  it("returns not ok with reason not-a-pdf for an empty buffer", async () => {
    const result = await inspectPdf(new Uint8Array(0));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("not-a-pdf");
    }
  });

  it("returns not ok with reason not-a-pdf for a short buffer (less than 4 bytes)", async () => {
    const result = await inspectPdf(new Uint8Array([0x25, 0x50])); // %P but only 2 bytes

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("not-a-pdf");
    }
  });

  it("returns not ok with reason not-a-pdf for bytes with wrong magic", async () => {
    const result = await inspectPdf(new Uint8Array([0x00, 0x01, 0x02, 0x03]));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("not-a-pdf");
    }
  });

  it("returns not ok with reason not-a-pdf for partial magic bytes (%P but not %PDF)", async () => {
    const result = await inspectPdf(new Uint8Array([0x25, 0x50, 0x00, 0x00]));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("not-a-pdf");
    }
  });
});

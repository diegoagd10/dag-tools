import { describe, it, expect } from "vitest";
import { renderQrPng } from "@/server/qr";

describe("renderQrPng", () => {
  it("returns a Buffer", async () => {
    const buf = await renderQrPng("https://example.com");
    expect(buf).toBeInstanceOf(Buffer);
  });

  it("produces a PNG with correct signature bytes", async () => {
    const buf = await renderQrPng("hello");
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
    expect(buf[2]).toBe(0x4e);
    expect(buf[3]).toBe(0x47);
  });

  it("produces non-trivial output (not all same byte)", async () => {
    const buf = await renderQrPng("test");
    const unique = new Set(buf);
    // A real QR PNG will have many different byte values
    expect(unique.size).toBeGreaterThan(10);
  });

  it("throws on empty string (validation layer catches before render)", async () => {
    await expect(renderQrPng("")).rejects.toThrow("No input text");
  });

  it("renders with consistent output size for same input", async () => {
    const a = await renderQrPng("consistent text");
    const b = await renderQrPng("consistent text");
    expect(a.length).toBe(b.length);
    // Two renders of same content should produce identical PNGs
    expect(a.equals(b)).toBe(true);
  });

  it("handles multi-byte UTF-8 content", async () => {
    const buf = await renderQrPng("héllo wörld");
    expect(buf[0]).toBe(0x89);
    expect(buf.length).toBeGreaterThan(0);
  });
});

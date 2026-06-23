import { describe, it, expect } from "vitest";
import {
  trimContent,
  isEmptyAfterTrim,
  isOverByteLimit,
  validateQrContent,
} from "@/server/qr-validate";

describe("trimContent", () => {
  it("removes leading and trailing whitespace", () => {
    expect(trimContent("  hello  ")).toBe("hello");
  });

  it("handles strings with only interior whitespace", () => {
    expect(trimContent("hello world")).toBe("hello world");
  });

  it("handles tabs and newlines", () => {
    expect(trimContent("\t\ntext\n\t")).toBe("text");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(trimContent("   \t \n  ")).toBe("");
  });
});

describe("isEmptyAfterTrim", () => {
  it("returns true for empty string", () => {
    expect(isEmptyAfterTrim("")).toBe(true);
  });

  it("returns true for whitespace-only string", () => {
    expect(isEmptyAfterTrim("   \t \n  ")).toBe(true);
  });

  it("returns false for string with content", () => {
    expect(isEmptyAfterTrim("  hi  ")).toBe(false);
  });
});

describe("isOverByteLimit", () => {
  const MAX = 2048;

  it("returns false when exactly at limit", () => {
    const content = "a".repeat(MAX);
    expect(isOverByteLimit(content, MAX)).toBe(false);
  });

  it("returns true when one byte over", () => {
    const content = "a".repeat(MAX + 1);
    expect(isOverByteLimit(content, MAX)).toBe(true);
  });

  it("counts multi-byte UTF-8 correctly", () => {
    // é = 0xC3 0xA9 = 2 bytes. 1024 "é" = 2048 bytes → at limit.
    const atLimit = "é".repeat(1024);
    expect(new TextEncoder().encode(atLimit).length).toBe(MAX);
    expect(isOverByteLimit(atLimit, MAX)).toBe(false);

    // One more multi-byte = over
    const over = "é".repeat(1025);
    expect(new TextEncoder().encode(over).length).toBe(MAX + 2);
    expect(isOverByteLimit(over, MAX)).toBe(true);
  });

  it("handles emoji (4-byte characters)", () => {
    // Check at least we don't count characters instead of bytes
    const emojis = "🌟".repeat(512); // 512 * 4 = 2048
    expect(new TextEncoder().encode(emojis).length).toBe(MAX);
    expect(isOverByteLimit(emojis, MAX)).toBe(false);

    const over = "🌟".repeat(513); // 513 * 4 = 2052
    expect(isOverByteLimit(over, MAX)).toBe(true);
  });
});

describe("validateQrContent", () => {
  it("rejects empty-after-trim with empty error", () => {
    const result = validateQrContent("   ");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("empty");
  });

  it("rejects over-limit content with too-long error", () => {
    const content = "x".repeat(2049);
    const result = validateQrContent(content);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("too-long");
  });

  it("accepts valid content and returns trimmed", () => {
    const result = validateQrContent("  hello world  ");
    expect(result.valid).toBe(true);
    expect(result.content).toBe("hello world");
  });

  it("accepts content exactly at the 2048-byte limit", () => {
    const atLimit = "a".repeat(2048);
    const result = validateQrContent(atLimit);
    expect(result.valid).toBe(true);
    expect(result.content).toBe(atLimit);
  });
});

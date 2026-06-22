import { describe, it, expect } from "vitest";
import { newShareId } from "@/server/share-id";

describe("newShareId", () => {
  it("returns a string of exactly 12 characters", () => {
    const id = newShareId();
    expect(typeof id).toBe("string");
    expect(id.length).toBe(12);
  });

  it("generates unique IDs across multiple invocations", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(newShareId());
    }
    // All 1000 IDs should be unique
    expect(ids.size).toBe(1000);
  });

  it("contains only URL-safe characters (nanoid default alphabet)", () => {
    const id = newShareId();
    // nanoid default alphabet: A-Za-z0-9_-
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

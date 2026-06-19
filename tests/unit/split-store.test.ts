import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSplitPdfStore } from "@/lib/split-pdf/store";
import type { SplitResult } from "@/lib/split-pdf/types";

function makeResult(url: string): SplitResult {
  return {
    blob: new Blob(),
    url,
    filename: `split-${url}.zip`,
    size: 1,
    pageCount: 1,
  };
}

describe("split-pdf store object URL lifecycle", () => {
  const revoke = vi.fn();
  const createObjectURL = vi.fn(() => "blob:mock");

  beforeEach(() => {
    revoke.mockClear();
    vi.stubGlobal(
      "URL",
      {
        createObjectURL,
        revokeObjectURL: revoke,
      } as unknown as typeof URL,
    );
    useSplitPdfStore.setState({ sourcePdf: null, splitResult: null });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("revokes the previous ZIP object URL when a new split overwrites the result", () => {
    useSplitPdfStore.setState({ splitResult: makeResult("blob:first") });
    useSplitPdfStore.getState().setSplitResult(makeResult("blob:second"));

    expect(revoke).toHaveBeenCalledWith("blob:first");
    expect(useSplitPdfStore.getState().splitResult?.url).toBe("blob:second");
  });

  it("revokes the ZIP object URL when the tool is reset", () => {
    useSplitPdfStore.setState({ splitResult: makeResult("blob:reset") });
    useSplitPdfStore.getState().reset();

    expect(revoke).toHaveBeenCalledWith("blob:reset");
    expect(useSplitPdfStore.getState().splitResult).toBeNull();
    expect(useSplitPdfStore.getState().sourcePdf).toBeNull();
  });
});

import { create } from "zustand";
import type { SourcePdf, SplitResult } from "./types";
import { analyzeFile } from "@/lib/pdf-tools/detect";

function revokePreviousUrl(prev: SplitResult | null, nextUrl?: string) {
  if (prev && prev.url !== nextUrl) {
    URL.revokeObjectURL(prev.url);
  }
}

interface SplitPdfState {
  sourcePdf: SourcePdf | null;
  splitResult: SplitResult | null;
  setSourcePdf: (file: File) => Promise<void>;
  clearSourcePdf: () => void;
  setSplitResult: (result: SplitResult | null) => void;
  reset: () => void;
}

export const useSplitPdfStore = create<SplitPdfState>((set, get) => ({
  sourcePdf: null,
  splitResult: null,
  setSourcePdf: async (file) => {
    const { isPdf, encrypted, pageCount } = await analyzeFile(file);
    set({
      sourcePdf: {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        isPdf,
        encrypted,
        pageCount,
      },
    });
  },
  clearSourcePdf: () => set({ sourcePdf: null }),
  setSplitResult: (result) => {
    revokePreviousUrl(get().splitResult, result?.url);
    set({ splitResult: result });
  },
  reset: () => {
    revokePreviousUrl(get().splitResult);
    set({ sourcePdf: null, splitResult: null });
  },
}));

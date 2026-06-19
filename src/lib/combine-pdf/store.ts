import { create } from "zustand";
import type { CombinedPdf, SourcePdf } from "./types";

interface CombinePdfState {
  sourcePdfs: SourcePdf[];
  combinedPdf: CombinedPdf | null;
  addFiles: (files: File[]) => void;
  removeSourcePdf: (id: string) => void;
  reorder: (fromIndex: number, toIndex: number) => void;
  setCombinedPdf: (combined: CombinedPdf | null) => void;
}

export const useCombinePdfStore = create<CombinePdfState>((set) => ({
  sourcePdfs: [],
  combinedPdf: null,
  addFiles: (files) =>
    set((state) => ({
      sourcePdfs: [
        ...state.sourcePdfs,
        ...files.map((file) => ({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
        })),
      ],
    })),
  removeSourcePdf: (id) =>
    set((state) => ({
      sourcePdfs: state.sourcePdfs.filter((pdf) => pdf.id !== id),
    })),
  reorder: (fromIndex, toIndex) =>
    set((state) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        fromIndex >= state.sourcePdfs.length ||
        toIndex < 0 ||
        toIndex >= state.sourcePdfs.length
      ) {
        return {};
      }
      const next = [...state.sourcePdfs];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { sourcePdfs: next };
    }),
  setCombinedPdf: (combined) => set({ combinedPdf: combined }),
}));

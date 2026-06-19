import { create } from "zustand";
import type { CombinedPdf, SourcePdf } from "./types";

interface CombinePdfState {
  sourcePdfs: SourcePdf[];
  combinedPdf: CombinedPdf | null;
  addFiles: (files: File[]) => void;
  removeSourcePdf: (id: string) => void;
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
  setCombinedPdf: (combined) => set({ combinedPdf: combined }),
}));

import { create } from "zustand";
import type { Highlight } from "@alexandria/shared";
import { listHighlights, deleteHighlight as apiDeleteHighlight, updateHighlight as apiUpdateHighlight } from "@/lib/api";

interface HighlightState {
  highlights: Highlight[];
  loading: boolean;

  fetch: (documentId: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  update: (id: string, data: { color?: string; note?: string }) => Promise<void>;
}

export const useHighlightStore = create<HighlightState>((set, get) => ({
  highlights: [],
  loading: false,

  fetch: async (documentId) => {
    set({ loading: true });
    try {
      const highlights = await listHighlights(documentId);
      set({ highlights, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  remove: async (id) => {
    await apiDeleteHighlight(id);
    set((s) => ({ highlights: s.highlights.filter((h) => h.id !== id) }));
  },

  update: async (id, data) => {
    const updated = await apiUpdateHighlight(id, data);
    set((s) => ({
      highlights: s.highlights.map((h) => (h.id === id ? updated : h)),
    }));
  },
}));

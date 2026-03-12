import { create } from "zustand";
import type { Document } from "@alexandria/shared";
import * as api from "@/lib/api";

interface LibraryState {
  documents: Document[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  upload: (file: File) => Promise<Document>;
  remove: (id: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  documents: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.listDocuments();
      set({ documents: res.documents, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  upload: async (file: File) => {
    const res = await api.uploadDocument(file);
    set({ documents: [res.document, ...get().documents] });
    return res.document;
  },

  remove: async (id: string) => {
    await api.deleteDocument(id);
    set({ documents: get().documents.filter((d) => d.id !== id) });
  },
}));

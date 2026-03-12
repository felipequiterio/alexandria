import { create } from "zustand";
import type { Document } from "@alexandria/shared";
import * as api from "@/lib/api";

export type SortField = "date" | "title" | "author";
export type SortOrder = "asc" | "desc";

interface LibraryState {
  documents: Document[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  sortField: SortField;
  sortOrder: SortOrder;
  filterType: string | null;
  filterStatus: string | null;

  fetch: () => Promise<void>;
  upload: (file: File) => Promise<Document>;
  remove: (id: string) => Promise<void>;
  setSearchQuery: (q: string) => void;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  setFilterType: (type: string | null) => void;
  setFilterStatus: (status: string | null) => void;
  getFilteredDocuments: () => Document[];
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  documents: [],
  loading: false,
  error: null,
  searchQuery: "",
  sortField: "date",
  sortOrder: "desc",
  filterType: null,
  filterStatus: null,

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

  setSearchQuery: (q) => set({ searchQuery: q }),
  setSortField: (field) => set({ sortField: field }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setFilterType: (type) => set({ filterType: type }),
  setFilterStatus: (status) => set({ filterStatus: status }),

  getFilteredDocuments: () => {
    const { documents, searchQuery, sortField, sortOrder, filterType, filterStatus } = get();

    let filtered = [...documents];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.authors.some((a) => a.toLowerCase().includes(q))
      );
    }

    // Type filter
    if (filterType) {
      filtered = filtered.filter((d) => d.type === filterType);
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter((d) => d.processingStatus === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
          break;
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "author":
          cmp = (a.authors[0] || "").localeCompare(b.authors[0] || "");
          break;
      }
      return sortOrder === "desc" ? -cmp : cmp;
    });

    return filtered;
  },
}));

import { create } from "zustand";

interface ReaderState {
  page: number;
  totalPages: number;
  scale: number;
  setPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  setScale: (scale: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

export const useReaderStore = create<ReaderState>((set, get) => ({
  page: 1,
  totalPages: 0,
  scale: 1.2,

  setPage: (page) => {
    const { totalPages } = get();
    if (page >= 1 && (totalPages === 0 || page <= totalPages)) {
      set({ page });
    }
  },

  setTotalPages: (totalPages) => set({ totalPages }),
  setScale: (scale) => set({ scale: Math.max(0.5, Math.min(3, scale)) }),

  nextPage: () => {
    const { page, totalPages } = get();
    if (page < totalPages) set({ page: page + 1 });
  },

  prevPage: () => {
    const { page } = get();
    if (page > 1) set({ page: page - 1 });
  },
}));

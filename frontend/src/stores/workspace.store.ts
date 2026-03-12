import { create } from "zustand";

interface WorkspaceState {
  // Archive sidebar
  archiveOpen: boolean;
  toggleArchive: () => void;
  setArchiveOpen: (open: boolean) => void;

  // Active document
  selectedDocumentId: string | null;
  openDocument: (id: string) => void;
  closeDocument: () => void;

  // Highlights rail
  highlightsCollapsed: boolean;
  toggleHighlights: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  archiveOpen: true,
  toggleArchive: () => set((s) => ({ archiveOpen: !s.archiveOpen })),
  setArchiveOpen: (open) => set({ archiveOpen: open }),

  selectedDocumentId: null,
  openDocument: (id) => set({ selectedDocumentId: id }),
  closeDocument: () => set({ selectedDocumentId: null }),

  highlightsCollapsed: false,
  toggleHighlights: () => set((s) => ({ highlightsCollapsed: !s.highlightsCollapsed })),
}));

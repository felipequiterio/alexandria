import { create } from "zustand";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface SettingsState {
  settings: Record<string, string>;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  update: (updates: Record<string, string>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {},
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/settings`);
      const data = await res.json();
      set({ settings: data.settings, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  update: async (updates: Record<string, string>) => {
    set({ error: null });
    try {
      await fetch(`${API_BASE}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      set((s) => ({ settings: { ...s.settings, ...updates } }));
    } catch (e) {
      set({ error: String(e) });
    }
  },
}));

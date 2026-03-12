import { create } from "zustand";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type Theme = "light" | "dark" | "system";

interface SettingsState {
  settings: Record<string, string>;
  loading: boolean;
  error: string | null;
  theme: Theme;
  fetch: () => Promise<void>;
  update: (updates: Record<string, string>) => Promise<void>;
  setTheme: (theme: Theme) => void;
  hydrateTheme: () => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", theme === "dark");
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {},
  loading: false,
  error: null,
  theme: "light" as Theme,

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

  setTheme: (theme: Theme) => {
    localStorage.setItem("alexandria-theme", theme);
    applyTheme(theme);
    set({ theme });
  },

  hydrateTheme: () => {
    const stored = localStorage.getItem("alexandria-theme") as Theme | null;
    if (stored) {
      applyTheme(stored);
      set({ theme: stored });
    }
  },
}));

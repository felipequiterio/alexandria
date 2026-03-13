"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settings.store";

function ThemeSelector() {
  const { theme, setTheme } = useSettingsStore();

  const options = [
    { value: "light" as const, label: "Light" },
    { value: "dark" as const, label: "Dark" },
    { value: "system" as const, label: "System" },
  ];

  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={`flex-1 px-4 py-2.5 rounded-sm border text-center transition-all ${
            theme === opt.value
              ? "border-primary bg-primary/10 text-primary shadow-[0_0_0_1px_var(--primary)]"
              : "border-border/60 bg-card text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <div className="text-sm font-medium">{opt.label}</div>
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { settings, loading, error, fetch, update } = useSettingsStore();
  const [saved, setSaved] = useState(false);
  const [chatModel, setChatModel] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("");

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    setChatModel(settings.ai_chat_model || "google/gemini-2.5-flash");
    setEmbeddingModel(
      settings.ai_embedding_model || "openai/text-embedding-3-small"
    );
  }, [settings]);

  const handleSave = async () => {
    await update({
      ai_chat_model: chatModel,
      ai_embedding_model: embeddingModel,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass =
    "w-full rounded-sm border border-border/60 bg-input-bg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50";

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <a
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 mb-6"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to workspace
      </a>
      <h2 className="text-3xl text-foreground mb-1">
        Settings
      </h2>
      <p className="text-muted-foreground text-sm mb-8">
        Configure your workspace.
      </p>

      {loading && (
        <p className="text-muted-foreground">Loading settings...</p>
      )}
      {error && <p className="text-destructive text-sm mb-4">{error}</p>}

      <div className="space-y-10">
        {/* Appearance */}
        <section>
          <h3 className="text-lg text-foreground mb-1">
            Appearance
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Choose your theme.
          </p>
          <ThemeSelector />
        </section>

        {/* AI Models */}
        <section>
          <h3 className="text-lg text-foreground mb-1">
            AI Models
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Configure the models Atlas uses for chat and embedding.
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Chat Model
              </label>
              <input
                type="text"
                value={chatModel}
                onChange={(e) => setChatModel(e.target.value)}
                placeholder="google/gemini-2.5-flash"
                className={inputClass}
              />
              <p className="text-[11px] text-muted-foreground/60 mt-1.5">
                OpenRouter model ID for Atlas chat (e.g.,
                google/gemini-2.5-flash, anthropic/claude-sonnet-4)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Embedding Model
              </label>
              <input
                type="text"
                value={embeddingModel}
                onChange={(e) => setEmbeddingModel(e.target.value)}
                placeholder="openai/text-embedding-3-small"
                className={inputClass}
              />
              <p className="text-[11px] text-muted-foreground/60 mt-1.5">
                Changing this after documents are embedded may cause search
                issues.
              </p>
            </div>
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            Save Settings
          </button>
          {saved && (
            <span className="text-sm text-success animate-[fade-in_0.2s_ease]">
              Settings saved.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

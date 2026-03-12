"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settings.store";

function ThemeSelector() {
  const { theme, setTheme } = useSettingsStore();

  const options = [
    { value: "light" as const, label: "The Archive", sublabel: "Light" },
    { value: "dark" as const, label: "The Observatory", sublabel: "Dark" },
    { value: "system" as const, label: "System", sublabel: "Auto" },
  ];

  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={`flex-1 px-4 py-2.5 rounded-lg border text-center transition-all ${
            theme === opt.value
              ? "border-primary bg-primary/10 text-primary shadow-[0_0_0_1px_var(--primary)]"
              : "border-border/60 bg-card text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <div className="text-sm font-medium">{opt.sublabel}</div>
          <div className="text-[10px] mt-0.5 opacity-60">{opt.label}</div>
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
    "w-full rounded border border-border/60 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50";

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h2 className="text-3xl font-serif text-secondary dark:text-foreground mb-1">
        Settings
      </h2>
      <p className="text-muted-foreground text-sm mb-8">
        Configure your scholarly environment.
      </p>

      {loading && (
        <p className="text-muted-foreground font-serif">Loading settings...</p>
      )}
      {error && <p className="text-destructive text-sm mb-4">{error}</p>}

      <div className="space-y-10">
        {/* Appearance */}
        <section>
          <h3 className="font-serif text-lg text-foreground mb-1">
            Appearance
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Choose your environment.
          </p>
          <ThemeSelector />
        </section>

        {/* AI Models */}
        <section>
          <h3 className="font-serif text-lg text-foreground mb-1">
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
            className="px-5 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            Save Settings
          </button>
          {saved && (
            <span className="text-sm text-success font-serif animate-[fade-in_0.2s_ease]">
              Settings saved.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

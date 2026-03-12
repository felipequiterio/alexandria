"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settings.store";

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
    setEmbeddingModel(settings.ai_embedding_model || "openai/text-embedding-3-small");
  }, [settings]);

  const handleSave = async () => {
    await update({
      ai_chat_model: chatModel,
      ai_embedding_model: embeddingModel,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h2 className="text-3xl font-serif text-secondary mb-1">Settings</h2>
      <p className="text-muted-foreground mb-8">Configure Atlas and AI model preferences.</p>

      {loading && <p className="text-muted-foreground">Loading settings...</p>}
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1.5">Chat Model</label>
          <input
            type="text"
            value={chatModel}
            onChange={(e) => setChatModel(e.target.value)}
            placeholder="google/gemini-2.5-flash"
            className="w-full rounded border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            OpenRouter model ID for Atlas chat (e.g., google/gemini-2.5-flash, anthropic/claude-sonnet-4)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Embedding Model</label>
          <input
            type="text"
            value={embeddingModel}
            onChange={(e) => setEmbeddingModel(e.target.value)}
            placeholder="openai/text-embedding-3-small"
            className="w-full rounded border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            OpenRouter model ID for document embeddings. Changing this after documents are embedded may cause search issues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Save Settings
          </button>
          {saved && (
            <span className="text-sm text-green-600">Settings saved.</span>
          )}
        </div>
      </div>
    </div>
  );
}

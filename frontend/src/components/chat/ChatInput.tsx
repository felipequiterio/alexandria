"use client";

import { useState, useCallback } from "react";
import { useChatStore } from "@/stores/chat.store";

export function ChatInput() {
  const [input, setInput] = useState("");
  const { sendMessage, isStreaming, selectedText } = useChatStore();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isStreaming) return;
      setInput("");
      await sendMessage(trimmed);
    },
    [input, isStreaming, sendMessage]
  );

  return (
    <form onSubmit={handleSubmit} className="border-t border-border px-3 py-3">
      {selectedText && (
        <div className="mb-2 px-2 py-1.5 rounded bg-accent/10 text-xs border border-accent/30 flex items-start gap-2">
          <span className="text-accent font-medium shrink-0">Selected:</span>
          <span className="line-clamp-2 text-muted-foreground italic">
            &ldquo;{selectedText}&rdquo;
          </span>
          <button
            type="button"
            onClick={() => useChatStore.getState().setSelection(null)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            &times;
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={selectedText ? "Ask about this passage..." : "Ask Atlas..."}
          disabled={isStreaming}
          className="flex-1 rounded border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="px-3 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
        >
          Send
        </button>
      </div>
    </form>
  );
}

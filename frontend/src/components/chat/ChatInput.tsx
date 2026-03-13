"use client";

import { useState, useCallback } from "react";
import { useChatStore } from "@/stores/chat.store";

const MODES = ["passage", "document", "library"] as const;

function ModeToggle() {
  const scope = useChatStore((s) => s.scope);
  const setScope = useChatStore((s) => s.setScope);

  return (
    <div className="flex items-center gap-1 mb-2">
      <span className="text-[10px] text-muted-foreground tracking-wide mr-1.5 shrink-0">
        Mode:
      </span>
      {MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setScope(mode)}
          className="bracket-tab-sm"
          data-active={scope === mode}
        >
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </button>
      ))}
    </div>
  );
}

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
      {/* Selected text preview */}
      {selectedText && (
        <div className="mb-2.5 px-2.5 py-1.5 rounded bg-accent/8 text-xs border border-accent/20 flex items-start gap-2">
          <span className="text-accent font-medium shrink-0 text-[10px] uppercase tracking-wider mt-0.5">
            Passage
          </span>
          <span className="line-clamp-2 text-muted-foreground italic font-serif leading-relaxed">
            &ldquo;{selectedText}&rdquo;
          </span>
          <button
            type="button"
            onClick={() => useChatStore.getState().setSelection(null)}
            className="shrink-0 text-muted-foreground/40 hover:text-foreground w-4 h-4 flex items-center justify-center"
          >
            &times;
          </button>
        </div>
      )}

      {/* Mode toggle */}
      <ModeToggle />

      {/* Input row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            selectedText
              ? "Consult Atlas regarding this passage..."
              : "Consult Atlas regarding..."
          }
          disabled={isStreaming}
          className="flex-1 rounded border border-border/60 bg-input-bg px-3 py-2 text-sm font-serif focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-40 placeholder:text-muted-foreground/40"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="w-8 h-8 flex items-center justify-center rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </form>
  );
}

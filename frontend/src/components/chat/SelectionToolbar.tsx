"use client";

import { useChatStore } from "@/stores/chat.store";
import { useReaderStore } from "@/stores/reader.store";

interface SelectionToolbarProps {
  text: string;
  x: number;
  y: number;
  onHighlight: () => void;
}

export function SelectionToolbar({ text, x, y, onHighlight }: SelectionToolbarProps) {
  const { setSelection, open } = useChatStore();
  const page = useReaderStore((s) => s.page);

  const handleAskAtlas = () => {
    setSelection(text, { page, start: 0, end: text.length });
    open();
  };

  return (
    <div
      className="fixed z-50 flex gap-1 rounded-lg shadow-lg border border-border bg-card px-1 py-1"
      style={{ left: x, top: y - 44 }}
    >
      <button
        onClick={handleAskAtlas}
        className="px-2.5 py-1 text-xs rounded hover:bg-primary/10 text-primary font-medium transition-colors"
      >
        Ask Atlas
      </button>
      <button
        onClick={onHighlight}
        className="px-2.5 py-1 text-xs rounded hover:bg-accent/10 text-accent font-medium transition-colors"
      >
        Highlight
      </button>
    </div>
  );
}

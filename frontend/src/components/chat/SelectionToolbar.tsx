"use client";

import { useChatStore } from "@/stores/chat.store";
import { useReaderStore } from "@/stores/reader.store";

interface SelectionToolbarProps {
  text: string;
  x: number;
  y: number;
  onHighlight: () => void;
}

export function SelectionToolbar({
  text,
  x,
  y,
  onHighlight,
}: SelectionToolbarProps) {
  const setSelection = useChatStore((s) => s.setSelection);
  const page = useReaderStore((s) => s.page);

  const handleAskAtlas = () => {
    setSelection(text, { page, start: 0, end: text.length });
  };

  return (
    <div
      className="fixed z-50 flex gap-0.5 rounded-sm shadow-sm bg-card border border-border/40 p-1"
      style={{ left: x, top: y - 46 }}
    >
      <button
        onClick={handleAskAtlas}
        className="px-3 py-1.5 text-xs rounded font-medium text-primary hover:bg-primary/10 flex items-center gap-1.5"
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
        Ask Atlas
      </button>
      <div className="w-px bg-border/40 my-1" />
      <button
        onClick={onHighlight}
        className="px-3 py-1.5 text-xs rounded font-medium text-accent hover:bg-accent/10"
      >
        Highlight
      </button>
    </div>
  );
}

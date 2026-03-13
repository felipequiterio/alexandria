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

  const btnClass =
    "font-serif text-[0.7rem] uppercase tracking-[0.1em] font-medium px-2.5 py-1.5 text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded transition-colors whitespace-nowrap";

  return (
    <div
      className="fixed z-50 flex items-center gap-0.5 rounded-md shadow-[0_4px_20px_rgba(0,0,0,0.18),0_0_0_1px_rgba(92,58,40,0.12)] bg-card border border-border/50 p-0.5"
      style={{ left: x, top: y - 48 }}
    >
      <button onClick={() => {}} className={btnClass} title="Define — coming soon">
        <span className="opacity-40 mr-0.5">[</span>Define<span className="opacity-40 ml-0.5">]</span>
      </button>
      <div className="w-px h-4 bg-border/40" />
      <button onClick={() => {}} className={btnClass} title="Find similar — coming soon">
        <span className="opacity-40 mr-0.5">[</span>Similar<span className="opacity-40 ml-0.5">]</span>
      </button>
      <div className="w-px h-4 bg-border/40" />
      <button onClick={onHighlight} className={`${btnClass} text-accent/80 hover:text-accent`}>
        <span className="opacity-40 mr-0.5">[</span>Annotate<span className="opacity-40 ml-0.5">]</span>
      </button>
      <div className="w-px h-4 bg-border/40" />
      <button onClick={handleAskAtlas} className={`${btnClass} text-primary/90 hover:text-primary`}>
        <span className="opacity-40 mr-0.5">[</span>Ask Atlas<span className="opacity-40 ml-0.5">]</span>
      </button>
    </div>
  );
}

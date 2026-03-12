"use client";

import { useHighlightStore } from "@/stores/highlight.store";
import { useReaderStore } from "@/stores/reader.store";
import type { Highlight, HighlightColor } from "@alexandria/shared";

const COLOR_CLASSES: Record<string, string> = {
  teal: "border-l-primary",
  gold: "border-l-accent",
  terracotta: "border-l-destructive",
  green: "border-l-[#4c854c]",
};

const COLOR_OPTIONS: HighlightColor[] = ["teal", "gold", "terracotta", "green"];

const COLOR_DOT: Record<string, string> = {
  teal: "bg-primary",
  gold: "bg-accent",
  terracotta: "bg-destructive",
  green: "bg-[#4c854c]",
};

export function HighlightSidebar() {
  const { highlights, sidebarOpen, toggleSidebar, remove, update } = useHighlightStore();
  const setPage = useReaderStore((s) => s.setPage);

  if (!sidebarOpen) return null;

  // Group by page
  const grouped = highlights.reduce<Record<number, Highlight[]>>((acc, h) => {
    (acc[h.pageNumber] ??= []).push(h);
    return acc;
  }, {});

  const pages = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="w-[280px] border-l border-border bg-background flex flex-col h-full shrink-0">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <h3 className="font-serif text-sm font-medium text-secondary">Highlights</h3>
        <button
          onClick={toggleSidebar}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          &times;
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {highlights.length === 0 ? (
          <p className="text-muted-foreground text-xs text-center mt-8">
            No highlights yet. Select text and click &ldquo;Highlight&rdquo;.
          </p>
        ) : (
          pages.map((pageNum) => (
            <div key={pageNum} className="mb-4">
              <div className="text-xs text-muted-foreground mb-1.5">Page {pageNum}</div>
              {grouped[pageNum].map((h) => (
                <div
                  key={h.id}
                  className={`mb-2 p-2 rounded text-xs border-l-2 bg-card cursor-pointer hover:bg-card/80 ${
                    COLOR_CLASSES[h.color] || COLOR_CLASSES.teal
                  }`}
                  onClick={() => setPage(h.pageNumber)}
                >
                  <p className="line-clamp-3 text-foreground italic">
                    &ldquo;{h.content}&rdquo;
                  </p>
                  {h.note && (
                    <p className="mt-1 text-muted-foreground">{h.note}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1.5">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={(e) => {
                          e.stopPropagation();
                          update(h.id, { color: c });
                        }}
                        className={`w-3 h-3 rounded-full ${COLOR_DOT[c]} ${
                          h.color === c ? "ring-1 ring-offset-1 ring-foreground/40" : ""
                        }`}
                      />
                    ))}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(h.id);
                      }}
                      className="ml-auto text-muted-foreground hover:text-destructive text-[10px]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

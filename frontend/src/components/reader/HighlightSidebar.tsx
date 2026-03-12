"use client";

import { useHighlightStore } from "@/stores/highlight.store";
import { useReaderStore } from "@/stores/reader.store";
import type { Highlight, HighlightColor } from "@alexandria/shared";

const COLOR_OPTIONS: HighlightColor[] = ["teal", "gold", "terracotta", "green"];

const COLOR_BG: Record<string, string> = {
  teal: "bg-[#3D7A7A]",
  gold: "bg-[#C4943A]",
  terracotta: "bg-[#A05B4A]",
  green: "bg-[#5A7A5A]",
};

const BORDER_LEFT: Record<string, string> = {
  teal: "border-l-[#3D7A7A]",
  gold: "border-l-[#C4943A]",
  terracotta: "border-l-[#A05B4A]",
  green: "border-l-[#5A7A5A]",
};

export function HighlightPanel() {
  const { highlights, remove, update } = useHighlightStore();
  const setPage = useReaderStore((s) => s.setPage);

  const grouped = highlights.reduce<Record<number, Highlight[]>>((acc, h) => {
    (acc[h.pageNumber] ??= []).push(h);
    return acc;
  }, {});

  const pages = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {highlights.length === 0 ? (
          <div className="text-center mt-12">
            <p className="text-muted-foreground/50 text-xs font-serif">
              Select text in the document to illuminate passages.
            </p>
          </div>
        ) : (
          pages.map((pageNum) => (
            <div key={pageNum} className="mb-4">
              <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1.5 font-medium">
                Page {pageNum}
              </div>
              {grouped[pageNum].map((h) => (
                <div
                  key={h.id}
                  className={`mb-2 p-2.5 rounded text-xs border-l-2 bg-card/80 cursor-pointer hover:bg-card ${
                    BORDER_LEFT[h.color] || BORDER_LEFT.teal
                  }`}
                  onClick={() => setPage(h.pageNumber)}
                >
                  <p className="line-clamp-3 text-foreground/80 italic font-serif leading-relaxed">
                    &ldquo;{h.content}&rdquo;
                  </p>
                  {h.note && (
                    <p className="mt-1.5 text-muted-foreground text-[11px]">
                      {h.note}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={(e) => {
                          e.stopPropagation();
                          update(h.id, { color: c });
                        }}
                        className={`w-3 h-3 rounded-full ${COLOR_BG[c]} ${
                          h.color === c
                            ? "ring-1 ring-offset-1 ring-offset-background ring-foreground/30"
                            : "opacity-50 hover:opacity-80"
                        }`}
                      />
                    ))}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(h.id);
                      }}
                      className="ml-auto text-muted-foreground/40 hover:text-destructive text-[10px]"
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

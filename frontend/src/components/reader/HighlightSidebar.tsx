"use client";

import { useHighlightStore } from "@/stores/highlight.store";
import { useChatStore } from "@/stores/chat.store";
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
  const sourcePassages = useChatStore((s) => s.sourcePassages);
  const removeSourcePassage = useChatStore((s) => s.removeSourcePassage);
  const clearSourcePassages = useChatStore((s) => s.clearSourcePassages);
  const setPage = useReaderStore((s) => s.setPage);

  const grouped = highlights.reduce<Record<number, Highlight[]>>((acc, h) => {
    (acc[h.pageNumber] ??= []).push(h);
    return acc;
  }, {});

  const pages = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  const sourcesByPage = sourcePassages.reduce<
    Record<number, { content: string; originalIndex: number }[]>
  >((acc, s, i) => {
    (acc[s.pageNumber] ??= []).push({ content: s.content, originalIndex: i });
    return acc;
  }, {});

  const sourcePages = Object.keys(sourcesByPage)
    .map(Number)
    .sort((a, b) => a - b);

  const hasContent = highlights.length > 0 || sourcePassages.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {!hasContent ? (
          <div className="text-center mt-12">
            <p className="text-muted-foreground/50 text-xs font-serif">
              Select text in the document to illuminate passages.
            </p>
          </div>
        ) : (
          <>
            {/* ── User highlights ── */}
            {pages.map((pageNum) => (
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
            ))}

            {/* ── Atlas source passages ── */}
            {sourcePassages.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] text-blue-400/80 uppercase tracking-wider font-medium">
                    Atlas References
                  </div>
                  <button
                    onClick={clearSourcePassages}
                    className="text-[10px] text-muted-foreground/40 hover:text-destructive"
                  >
                    Clear all
                  </button>
                </div>
                {sourcePages.map((pageNum) => (
                  <div key={`src-${pageNum}`} className="mb-3">
                    <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1.5 font-medium">
                      Page {pageNum}
                    </div>
                    {sourcesByPage[pageNum].map((src) => (
                      <div
                        key={`src-${src.originalIndex}`}
                        className="mb-2 p-2.5 rounded text-xs border-l-2 border-l-blue-400/50 bg-blue-500/5 cursor-pointer hover:bg-blue-500/10"
                        onClick={() => setPage(pageNum)}
                      >
                        <p className="line-clamp-4 text-foreground/70 italic font-serif leading-relaxed">
                          &ldquo;{src.content.slice(0, 200)}
                          {src.content.length > 200 ? "..." : ""}
                          &rdquo;
                        </p>
                        <div className="flex items-center mt-2">
                          <span className="text-[10px] text-blue-400/60">
                            Source passage
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSourcePassage(src.originalIndex);
                            }}
                            className="ml-auto text-muted-foreground/40 hover:text-destructive text-[10px]"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

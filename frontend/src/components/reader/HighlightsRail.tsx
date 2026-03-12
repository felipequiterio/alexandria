"use client";

import { useHighlightStore } from "@/stores/highlight.store";
import { useChatStore } from "@/stores/chat.store";
import { useReaderStore } from "@/stores/reader.store";
import { useWorkspaceStore } from "@/stores/workspace.store";
import type { HighlightColor } from "@alexandria/shared";

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

export function HighlightsRail() {
  const { highlights, remove, update } = useHighlightStore();
  const sourcePassages = useChatStore((s) => s.sourcePassages);
  const removeSourcePassage = useChatStore((s) => s.removeSourcePassage);
  const clearSourcePassages = useChatStore((s) => s.clearSourcePassages);
  const setPage = useReaderStore((s) => s.setPage);
  const selectedDocumentId = useWorkspaceStore((s) => s.selectedDocumentId);

  const grouped = highlights.reduce<Record<number, typeof highlights>>((acc, h) => {
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
    <div className="workspace-panel flex-1 h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-muted-foreground">
            Highlights
          </span>
          {hasContent && (
            <span className="text-[10px] text-muted-foreground/50 tabular-nums">
              {highlights.length}
              {sourcePassages.length > 0 && (
                <span className="text-blue-400/60">
                  {" "}+ {sourcePassages.length}
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {!selectedDocumentId ? (
          <div className="text-center mt-12 px-3">
            <p className="text-muted-foreground/40 text-xs font-serif italic">
              Highlights from your reading will appear here.
            </p>
          </div>
        ) : !hasContent ? (
          <div className="text-center mt-12 px-3">
            <p className="text-muted-foreground/40 text-xs font-serif italic">
              Select text in the document to illuminate passages.
            </p>
          </div>
        ) : (
          <>
            {/* ── User highlights ── */}
            {pages.map((pageNum) => (
              <div key={pageNum} className="mb-3">
                <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1 px-1 font-medium">
                  Page {pageNum}
                </div>
                {grouped[pageNum].map((h) => (
                  <div
                    key={h.id}
                    className={`mb-1.5 p-2 rounded text-xs border-l-2 bg-card/80 cursor-pointer hover:bg-card ${
                      BORDER_LEFT[h.color] || BORDER_LEFT.teal
                    }`}
                    onClick={() => setPage(h.pageNumber)}
                  >
                    <p className="line-clamp-2 text-foreground/70 italic font-serif text-[11px] leading-relaxed">
                      &ldquo;{h.content}&rdquo;
                    </p>
                    {h.note && (
                      <p className="mt-1 text-muted-foreground text-[10px]">
                        {h.note}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1.5">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c}
                          onClick={(e) => {
                            e.stopPropagation();
                            update(h.id, { color: c });
                          }}
                          className={`w-2.5 h-2.5 rounded-full ${COLOR_BG[c]} ${
                            h.color === c
                              ? "ring-1 ring-offset-1 ring-offset-background ring-foreground/30"
                              : "opacity-40 hover:opacity-70"
                          }`}
                        />
                      ))}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(h.id);
                        }}
                        className="ml-auto text-muted-foreground/30 hover:text-destructive text-[9px]"
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
              <div className="mt-1">
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-[10px] text-blue-400/70 uppercase tracking-wider font-medium">
                    Atlas References
                  </span>
                  <button
                    onClick={clearSourcePassages}
                    className="text-[9px] text-muted-foreground/30 hover:text-destructive"
                  >
                    Clear all
                  </button>
                </div>
                {sourcePages.map((pageNum) => (
                  <div key={`src-${pageNum}`} className="mb-3">
                    <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1 px-1 font-medium">
                      Page {pageNum}
                    </div>
                    {sourcesByPage[pageNum].map((src) => (
                      <div
                        key={`src-${src.originalIndex}`}
                        className="mb-1.5 p-2 rounded text-xs border-l-2 border-l-blue-400/40 bg-blue-500/5 cursor-pointer hover:bg-blue-500/10"
                        onClick={() => setPage(pageNum)}
                      >
                        <p className="line-clamp-3 text-foreground/60 italic font-serif text-[11px] leading-relaxed">
                          &ldquo;{src.content.slice(0, 150)}
                          {src.content.length > 150 ? "..." : ""}&rdquo;
                        </p>
                        <div className="flex items-center mt-1.5">
                          <span className="text-[9px] text-blue-400/50">
                            Source passage
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSourcePassage(src.originalIndex);
                            }}
                            className="ml-auto text-muted-foreground/30 hover:text-destructive text-[9px]"
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

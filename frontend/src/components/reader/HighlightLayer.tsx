"use client";

import { useEffect } from "react";
import { useHighlightStore } from "@/stores/highlight.store";
import { useReaderStore } from "@/stores/reader.store";
import type { Highlight } from "@alexandria/shared";

const COLOR_MAP: Record<string, string> = {
  teal: "rgba(61, 122, 122, 0.25)",
  gold: "rgba(196, 148, 58, 0.25)",
  terracotta: "rgba(160, 91, 74, 0.25)",
  green: "rgba(76, 133, 76, 0.25)",
};

interface HighlightLayerProps {
  documentId: string;
}

export function HighlightLayer({ documentId }: HighlightLayerProps) {
  const { highlights, fetch } = useHighlightStore();
  const page = useReaderStore((s) => s.page);

  useEffect(() => {
    fetch(documentId);
  }, [documentId, fetch]);

  const pageHighlights = highlights.filter((h) => h.pageNumber === page);

  if (pageHighlights.length === 0) return null;

  // Highlights are rendered as a subtle indicator, since precise text overlay
  // positioning requires PDF.js text layer integration which is complex.
  // For now, show a small indicator bar for each highlight on the current page.
  return (
    <div className="absolute top-0 right-0 z-10 flex flex-col gap-0.5 p-1">
      {pageHighlights.map((h) => (
        <div
          key={h.id}
          title={h.content.slice(0, 80)}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: COLOR_MAP[h.color] || COLOR_MAP.teal }}
        />
      ))}
    </div>
  );
}

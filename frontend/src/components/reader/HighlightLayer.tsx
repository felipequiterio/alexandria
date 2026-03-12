"use client";

import { useEffect, useMemo, useRef } from "react";
import { useHighlightStore } from "@/stores/highlight.store";
import { useChatStore } from "@/stores/chat.store";

/** User highlight colors — warm, book-highlighter feel */
const USER_COLORS: Record<string, string> = {
  gold: "rgba(250, 204, 50, 0.38)",
  teal: "rgba(61, 180, 180, 0.32)",
  terracotta: "rgba(210, 110, 80, 0.32)",
  green: "rgba(80, 180, 80, 0.30)",
};

const SOURCE_COLOR = "rgba(90, 150, 240, 0.30)";

interface HighlightLayerProps {
  pageElement: HTMLElement | null;
  pageNumber: number;
  documentId: string;
}

/** Normalize text for fuzzy matching across PDF quirks */
function norm(s: string): string {
  return s
    .replace(/[\u00A0\u200B\u200C\u200D\u200E\u200F\uFEFF\u00AD\u2028\u2029]/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Pre-built haystack for a page's text layer */
interface PageHay {
  hay: string;
  map: number[];
}

function buildHaystack(spans: HTMLElement[]): PageHay {
  const texts = spans.map((s) => norm(s.textContent || ""));
  let hay = "";
  const map: number[] = [];
  for (let si = 0; si < texts.length; si++) {
    for (const ch of texts[si]) {
      map.push(si);
      hay += ch;
    }
    if (si < texts.length - 1) {
      map.push(-1);
      hay += " ";
    }
  }
  return { hay, map };
}

/**
 * Returns indices of spans that overlap with `needle` in the haystack.
 */
function searchHay(ph: PageHay, needle: string): Set<number> {
  if (!needle || needle.length < 3) return new Set();
  const hit = new Set<number>();
  let from = 0;
  while (from < ph.hay.length) {
    const idx = ph.hay.indexOf(needle, from);
    if (idx === -1) break;
    for (let c = idx; c < idx + needle.length && c < ph.map.length; c++) {
      if (ph.map[c] >= 0) hit.add(ph.map[c]);
    }
    from = idx + 1;
  }
  return hit;
}

/** Match a user highlight (exact text the user selected) */
function matchSpans(ph: PageHay, snippet: string): Set<number> {
  return searchHay(ph, norm(snippet));
}

/**
 * Match a RAG source passage against the page text.
 * Tries progressively shorter prefixes and individual sentences
 * to handle differences between backend PDF parser and react-pdf text layer.
 */
function matchSourcePassage(ph: PageHay, content: string): Set<number> {
  const full = norm(content);

  // Try progressively shorter prefixes
  for (const len of [300, 150, 80]) {
    if (full.length < len) continue;
    const result = searchHay(ph, full.slice(0, len));
    if (result.size > 0) return result;
  }

  // Try the full content if short enough
  if (full.length > 0 && full.length <= 300) {
    const result = searchHay(ph, full);
    if (result.size > 0) return result;
  }

  // Fallback: match individual sentences (first 3)
  const sentences = content
    .split(/[.!?]+/)
    .map((s) => norm(s))
    .filter((s) => s.length > 15);
  const combined = new Set<number>();
  for (const sentence of sentences.slice(0, 3)) {
    for (const si of searchHay(ph, sentence)) {
      combined.add(si);
    }
  }
  return combined;
}

/**
 * Directly styles react-pdf text layer <span> elements to look like
 * book-highlighter marks. No overlay div, no positioning math.
 *
 * Returns null — all work is done as a DOM side-effect.
 */
export function HighlightLayer({
  pageElement,
  pageNumber,
}: HighlightLayerProps) {
  const highlights = useHighlightStore((s) => s.highlights);
  const sourcePassages = useChatStore((s) => s.sourcePassages);
  const styledRef = useRef<Set<HTMLElement>>(new Set());

  const pageHighlights = useMemo(
    () => highlights.filter((h) => h.pageNumber === pageNumber),
    [highlights, pageNumber]
  );
  const pageSources = useMemo(
    () => sourcePassages.filter((s) => s.pageNumber === pageNumber),
    [sourcePassages, pageNumber]
  );

  useEffect(() => {
    if (!pageElement) return;

    // ── Clear previous styles ──
    const clearOld = () => {
      for (const span of styledRef.current) {
        if (span.isConnected) {
          span.style.backgroundColor = "";
          span.style.mixBlendMode = "";
          span.style.borderRadius = "";
        }
      }
      styledRef.current.clear();
    };

    if (pageHighlights.length === 0 && pageSources.length === 0) {
      clearOld();
      return;
    }

    // ── Apply highlight styles to matching spans ──
    const apply = (): boolean => {
      const textLayer =
        pageElement.querySelector<HTMLElement>(".react-pdf__Page__textContent") ||
        pageElement.querySelector<HTMLElement>(".textLayer");
      if (!textLayer) return false;

      const spans = Array.from(textLayer.querySelectorAll<HTMLElement>("span"));
      if (spans.length === 0) return false;

      clearOld();

      const ph = buildHaystack(spans);

      // User highlights — warm colors
      for (const h of pageHighlights) {
        const color = USER_COLORS[h.color] || USER_COLORS.gold;
        for (const si of matchSpans(ph, h.content)) {
          spans[si].style.backgroundColor = color;
          spans[si].style.mixBlendMode = "multiply";
          spans[si].style.borderRadius = "2px";
          styledRef.current.add(spans[si]);
        }
      }

      // Atlas source passages — blue
      for (const src of pageSources) {
        for (const si of matchSourcePassage(ph, src.content)) {
          spans[si].style.backgroundColor = SOURCE_COLOR;
          spans[si].style.mixBlendMode = "multiply";
          spans[si].style.borderRadius = "2px";
          styledRef.current.add(spans[si]);
        }
      }

      return true;
    };

    // Try immediately
    apply();

    // react-pdf renders the text layer async — watch for childList changes.
    // Style changes (attributes) do NOT trigger childList observers, so no loop.
    let debounce: ReturnType<typeof setTimeout>;
    const observer = new MutationObserver(() => {
      clearTimeout(debounce);
      debounce = setTimeout(apply, 60);
    });
    observer.observe(pageElement, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      clearTimeout(debounce);
      clearOld();
    };
  }, [pageElement, pageHighlights, pageSources]);

  return null;
}

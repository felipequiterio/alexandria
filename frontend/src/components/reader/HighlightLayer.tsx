"use client";

import { useEffect, useRef, useCallback } from "react";
import { useHighlightStore } from "@/stores/highlight.store";
import { useChatStore } from "@/stores/chat.store";

/** User highlight colors — warm, book-highlighter feel */
const USER_COLORS: Record<string, string> = {
  gold: "rgba(250, 204, 50, 0.35)",
  teal: "rgba(61, 180, 180, 0.30)",
  terracotta: "rgba(210, 110, 80, 0.30)",
  green: "rgba(80, 180, 80, 0.28)",
};

/** Atlas source reference — cool blue */
const SOURCE_COLOR = "rgba(90, 150, 240, 0.28)";

interface HighlightLayerProps {
  /** The VirtualPage wrapper that contains .react-pdf__Page */
  pageElement: HTMLElement | null;
  pageNumber: number;
  documentId: string;
}

/**
 * Finds all occurrences of `snippet` inside the react-pdf text layer
 * and returns DOMRects relative to `anchorEl` (the .react-pdf__Page div).
 */
function findTextRects(
  textLayer: HTMLElement,
  snippet: string,
  anchorEl: HTMLElement
): DOMRect[] {
  if (!snippet || snippet.length < 4) return [];

  const needle = snippet.replace(/\s+/g, " ").trim().toLowerCase();
  if (!needle) return [];

  const spans = textLayer.querySelectorAll<HTMLSpanElement>("span");
  if (spans.length === 0) return [];

  // Build char-to-node index. Each entry maps a character position in the
  // concatenated full text to its DOM Text node + offset within that node.
  type CharInfo = { node: Text; offset: number };
  const charMap: CharInfo[] = [];
  let fullText = "";

  for (const span of spans) {
    // Walk the span's child nodes — react-pdf puts raw text nodes inside spans
    const walker = document.createTreeWalker(span, NodeFilter.SHOW_TEXT);
    let textNode: Text | null;
    while ((textNode = walker.nextNode() as Text | null)) {
      const t = textNode.textContent || "";
      for (let i = 0; i < t.length; i++) {
        charMap.push({ node: textNode, offset: i });
      }
      fullText += t;
    }
    // Logical space between spans (PDF words/lines are separate spans)
    fullText += " ";
    // Map this space to the last char of the previous node (safe fallback)
    if (charMap.length > 0) {
      const last = charMap[charMap.length - 1];
      charMap.push({ node: last.node, offset: last.offset });
    }
  }

  const haystack = fullText.toLowerCase();
  const anchorRect = anchorEl.getBoundingClientRect();
  const rects: DOMRect[] = [];

  let from = 0;
  while (from < haystack.length) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) break;

    const endIdx = idx + needle.length - 1;
    const sc = charMap[idx];
    const ec = charMap[Math.min(endIdx, charMap.length - 1)];

    if (sc && ec) {
      try {
        const range = document.createRange();
        range.setStart(sc.node, sc.offset);
        range.setEnd(
          ec.node,
          Math.min(ec.offset + 1, ec.node.textContent?.length ?? ec.offset + 1)
        );

        for (const cr of range.getClientRects()) {
          // Skip degenerate rects
          if (cr.width < 1 || cr.height < 1) continue;
          rects.push(
            new DOMRect(
              cr.left - anchorRect.left,
              cr.top - anchorRect.top,
              cr.width,
              cr.height
            )
          );
        }
      } catch {
        // Range can fail for unusual DOM structures — skip
      }
    }
    from = idx + 1;
  }

  return rects;
}

/**
 * Creates a highlight mark element styled like a real book highlighter.
 */
function createMark(r: DOMRect, color: string, title: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = `
    position: absolute;
    left: ${r.x}px;
    top: ${r.y + r.height * 0.15}px;
    width: ${r.width}px;
    height: ${r.height * 0.75}px;
    background: ${color};
    border-radius: 1px;
    pointer-events: none;
    mix-blend-mode: multiply;
  `;
  el.title = title;
  return el;
}

/**
 * Injects highlight overlays directly into the .react-pdf__Page element
 * so they share the same coordinate space as the text layer.
 *
 * - User highlights: warm colors (gold, teal, terracotta, green)
 * - Atlas source passages: blue
 */
export function HighlightLayer({
  pageElement,
  pageNumber,
}: HighlightLayerProps) {
  const highlights = useHighlightStore((s) => s.highlights);
  const sourcePassages = useChatStore((s) => s.sourcePassages);
  const overlayId = useRef(`hl-overlay-${pageNumber}`);

  const pageHighlights = highlights.filter((h) => h.pageNumber === pageNumber);
  const pageSources = sourcePassages.filter((s) => s.pageNumber === pageNumber);

  const paint = useCallback(() => {
    if (!pageElement) return;

    // Find the .react-pdf__Page div (which has position: relative)
    const pageDiv = pageElement.querySelector<HTMLElement>(".react-pdf__Page");
    if (!pageDiv) return;

    const textLayer = pageDiv.querySelector<HTMLElement>(
      ".react-pdf__Page__textContent"
    );
    if (!textLayer) return;

    // Remove previous overlay if it exists
    const existing = pageDiv.querySelector(`#${overlayId.current}`);
    if (existing) existing.remove();

    if (pageHighlights.length === 0 && pageSources.length === 0) return;

    // Create overlay container inside the page div
    const overlay = document.createElement("div");
    overlay.id = overlayId.current;
    overlay.style.cssText =
      "position:absolute;inset:0;pointer-events:none;z-index:3;";
    pageDiv.appendChild(overlay);

    // Paint user highlights
    for (const h of pageHighlights) {
      const color = USER_COLORS[h.color] || USER_COLORS.gold;
      const rects = findTextRects(textLayer, h.content, pageDiv);
      for (const r of rects) {
        overlay.appendChild(
          createMark(r, color, h.content.slice(0, 80))
        );
      }
    }

    // Paint Atlas source passages
    for (const src of pageSources) {
      // Match the first 300 chars of the chunk (chunks can be very long)
      const snippet = src.content.slice(0, 300);
      const rects = findTextRects(textLayer, snippet, pageDiv);
      for (const r of rects) {
        overlay.appendChild(
          createMark(r, SOURCE_COLOR, "Atlas source")
        );
      }
    }
  }, [pageElement, pageHighlights, pageSources]);

  useEffect(() => {
    if (!pageElement) return;

    // MutationObserver: react-pdf renders the text layer asynchronously.
    // We repaint whenever the subtree changes (text layer populates).
    let debounce: ReturnType<typeof setTimeout>;
    const observer = new MutationObserver(() => {
      clearTimeout(debounce);
      debounce = setTimeout(paint, 50);
    });
    observer.observe(pageElement, { childList: true, subtree: true });

    // Initial paint (text layer may already be present)
    const timer = setTimeout(paint, 150);

    return () => {
      observer.disconnect();
      clearTimeout(debounce);
      clearTimeout(timer);
      // Clean up overlay on unmount
      const pageDiv = pageElement.querySelector<HTMLElement>(".react-pdf__Page");
      const existing = pageDiv?.querySelector(`#${overlayId.current}`);
      if (existing) existing.remove();
    };
  }, [pageElement, paint]);

  // This component injects into the DOM imperatively — no React output needed
  return null;
}

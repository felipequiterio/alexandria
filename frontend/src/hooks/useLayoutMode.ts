import { useState, useEffect } from "react";

export type LayoutMode = "desktop" | "tablet" | "mobile";

/**
 * Returns the current layout mode based on viewport width.
 * - desktop: >= 1280px — full 3-panel workspace, inline archive
 * - tablet: 768–1279px — 2 panels (doc + chat), archive as overlay
 * - mobile: < 768px — single panel, everything as overlay
 *
 * Defaults to "desktop" during SSR to match the most common case.
 */
export function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>("desktop");

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setMode(w >= 1280 ? "desktop" : w >= 768 ? "tablet" : "mobile");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return mode;
}

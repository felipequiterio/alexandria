"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useSettingsStore } from "@/stores/settings.store";
import { TempleIcon } from "@/components/assets/TempleIcon";
import type { LayoutMode } from "@/hooks/useLayoutMode";

function ThemeToggle() {
  const { theme, setTheme, hydrateTheme } = useSettingsStore();

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  const cycle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <button
      onClick={cycle}
      className="p-1.5 rounded text-white/50 hover:text-white/80"
      title={`Theme: ${theme}`}
    >
      {theme === "dark" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : theme === "system" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function TopBar({ layoutMode }: { layoutMode: LayoutMode }) {
  const toggleArchive = useWorkspaceStore((s) => s.toggleArchive);
  const archiveOpen = useWorkspaceStore((s) => s.archiveOpen);

  const isMobile = layoutMode === "mobile";

  return (
    <header className="relative z-50 col-span-2">
      <div
        className="frieze-band flex items-center justify-between px-4"
        style={{ height: "var(--frieze-height)" }}
      >
        {/* Left: Temple icon + ALEXANDRIA branding */}
        <div className="flex items-center gap-3 shrink-0">
          <TempleIcon size={isMobile ? 22 : 26} className="text-white/70" />
          <span className="font-serif text-[0.95rem] tracking-[0.2em] font-medium uppercase text-white/85 select-none">
            {isMobile ? "A" : "Alexandria"}
          </span>
        </div>

        {/* Center: Navigation bracket tabs */}
        {!isMobile && (
          <nav className="flex items-center gap-1">
            <button
              className="bracket-tab"
              data-active={archiveOpen}
              onClick={toggleArchive}
            >
              The Archive
            </button>
            <button
              className="bracket-tab"
              data-active={!archiveOpen}
              onClick={() => {
                if (archiveOpen) toggleArchive();
              }}
            >
              The Scholar&apos;s Desk
            </button>
            <button
              className="bracket-tab"
              data-disabled="true"
              title="Observatory — coming soon"
            >
              The Observatory
            </button>
          </nav>
        )}

        {/* Right: settings + theme */}
        <div className="flex items-center gap-2 shrink-0">
          {isMobile && (
            <button
              onClick={toggleArchive}
              className="p-1.5 rounded text-white/50 hover:text-white/80"
              aria-expanded={archiveOpen}
              aria-label={archiveOpen ? "Close archive" : "Open archive"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </button>
          )}

          <Link
            href="/settings"
            className="p-1.5 rounded text-white/50 hover:text-white/80 flex items-center"
            title="Settings"
          >
            <GearIcon />
          </Link>

          <div className="w-px h-3.5 bg-white/15" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

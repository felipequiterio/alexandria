"use client";

import { useEffect } from "react";
import { TopBar } from "./TopBar";
import { ArchiveSidebar } from "./ArchiveSidebar";
import { CenteredWorkspace } from "./CenteredWorkspace";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useLayoutMode } from "@/hooks/useLayoutMode";

export function AppShell() {
  const archiveOpen = useWorkspaceStore((s) => s.archiveOpen);
  const setArchiveOpen = useWorkspaceStore((s) => s.setArchiveOpen);
  const layoutMode = useLayoutMode();

  const isInline = layoutMode === "desktop";

  // Auto-close archive when switching to overlay mode
  useEffect(() => {
    if (!isInline && archiveOpen) {
      setArchiveOpen(false);
    }
  }, [isInline]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="h-screen grid grid-rows-[auto_1fr] overflow-hidden transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{
        gridTemplateColumns: isInline && archiveOpen
          ? "var(--archive-width) 1fr"
          : "0px 1fr",
      }}
    >
      {/* TopBar spans both columns */}
      <TopBar layoutMode={layoutMode} />

      {/* Desktop: archive as grid column */}
      {isInline && (
        <aside
          className="overflow-hidden border-r border-border bg-panel-bg"
          aria-hidden={!archiveOpen}
        >
          <ArchiveSidebar />
        </aside>
      )}

      {/* Tablet/mobile: archive as overlay drawer */}
      {!isInline && archiveOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-30"
            style={{ top: "var(--topbar-height)" }}
            onClick={() => setArchiveOpen(false)}
            aria-hidden
          />
          {/* Drawer */}
          <aside
            className="fixed left-0 bottom-0 z-40 border-r border-border bg-panel-bg shadow-xl animate-[slide-in-left_0.2s_ease]"
            style={{
              top: "var(--topbar-height)",
              width: "min(var(--archive-width), 85vw)",
            }}
          >
            <ArchiveSidebar />
          </aside>
        </>
      )}

      {/* Workspace frame */}
      <div className={`overflow-hidden flex ${isInline ? "" : "col-span-2"}`}>
        <CenteredWorkspace layoutMode={layoutMode} />
      </div>
    </div>
  );
}

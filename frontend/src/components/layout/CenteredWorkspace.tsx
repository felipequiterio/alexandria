"use client";

import { useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { DocumentViewport } from "./DocumentViewport";
import { AtlasChatPanel } from "@/components/chat/AtlasChatPanel";
import { HighlightsRail } from "@/components/reader/HighlightsRail";
import type { LayoutMode } from "@/hooks/useLayoutMode";

function MobileChatOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-30" onClick={onClose} aria-hidden />
      <div
        className="fixed right-0 bottom-0 z-40 bg-panel-bg backdrop-blur-sm border-l border-border shadow-md flex flex-col animate-[slide-in-right_0.2s_ease]"
        style={{
          top: "var(--topbar-height)",
          width: "min(380px, 90vw)",
        }}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
          <span className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Atlas Chat</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <AtlasChatPanel />
        </div>
      </div>
    </>
  );
}

function MobileChatButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-5 z-20 w-12 h-12 rounded-sm bg-primary text-primary-foreground shadow-sm hover:shadow-md flex items-center justify-center transition-shadow"
      title="Open Atlas"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    </button>
  );
}

/**
 * Desktop workspace — all panels in a single resizable group.
 *
 * Layout: [margin] | [PDF] | [Chat] | [Highlights] | [margin]
 *
 * Every "|" is a draggable separator, so every panel edge is resizable.
 * The margin panels are transparent spacers that let the background show through.
 */
function DesktopWorkspace() {
  return (
    <div className="flex-1 flex items-stretch p-4 overflow-hidden">
      <Group orientation="horizontal" id="alexandria-workspace">
        {/* Left margin — drag to shift workspace right */}
        <Panel defaultSize="3%" minSize="0%" collapsible>
          <div />
        </Panel>
        <Separator />

        {/* PDF viewer */}
        <Panel defaultSize="39%" minSize="20%">
          <DocumentViewport />
        </Panel>
        <Separator />

        {/* Atlas Chat */}
        <Panel defaultSize="29%" minSize="15%">
          <AtlasChatPanel />
        </Panel>
        <Separator />

        {/* Highlights */}
        <Panel defaultSize="22%" minSize="8%">
          <HighlightsRail />
        </Panel>
        <Separator />

        {/* Right margin — drag to expand highlights */}
        <Panel defaultSize="7%" minSize="0%" collapsible>
          <div />
        </Panel>
      </Group>
    </div>
  );
}

export function CenteredWorkspace({ layoutMode }: { layoutMode: LayoutMode }) {
  const [chatOverlayOpen, setChatOverlayOpen] = useState(false);

  // Mobile: document only + floating chat button
  if (layoutMode === "mobile") {
    return (
      <div className="flex-1 flex flex-col p-2 overflow-hidden">
        <DocumentViewport />
        <MobileChatButton onClick={() => setChatOverlayOpen(true)} />
        <MobileChatOverlay open={chatOverlayOpen} onClose={() => setChatOverlayOpen(false)} />
      </div>
    );
  }

  // Tablet: 2 panels (document + chat), no highlights
  if (layoutMode === "tablet") {
    return (
      <div className="flex-1 flex justify-center items-stretch p-3 overflow-hidden">
        <div className="w-full h-full" style={{ maxWidth: "var(--workspace-max-width)" }}>
          <Group orientation="horizontal" id="alexandria-workspace-tablet">
            <Panel defaultSize="60%" minSize="40%">
              <DocumentViewport />
            </Panel>
            <Separator />
            <Panel defaultSize="40%" minSize="25%" maxSize="55%">
              <AtlasChatPanel />
            </Panel>
          </Group>
        </div>
      </div>
    );
  }

  // Desktop: all panels in one resizable group
  return <DesktopWorkspace />;
}

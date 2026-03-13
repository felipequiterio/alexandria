"use client";

import { useState, useEffect, useRef } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { DocumentViewport } from "./DocumentViewport";
import { BookFrame } from "@/components/reader/BookFrame";
import { AtlasChatPanel } from "@/components/chat/AtlasChatPanel";
import { HighlightsRail } from "@/components/reader/HighlightsRail";
import type { LayoutMode } from "@/hooks/useLayoutMode";

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function MobileChatOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-30" onClick={onClose} aria-hidden />
      <div
        className="fixed right-0 bottom-0 z-40 bg-panel-bg border-l border-border shadow-xl flex flex-col animate-[slide-in-right_0.2s_ease]"
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
      className="fixed bottom-5 right-5 z-20 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow"
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
 * Desktop workspace with independently resizable highlights panel.
 *
 * Layout: [spacer] [PDF+Chat Group] [◂ handle] [Highlights] [handle ▸] [spacer]
 *
 * - Left handle: trades space between the Group and Highlights (both change)
 * - Right handle: only grows/shrinks Highlights into the right margin (Group untouched)
 */
function DesktopWorkspace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [groupWidth, setGroupWidth] = useState(1100);
  const [hlWidth, setHlWidth] = useState(280);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    side: "left" | "right";
    startX: number;
    startGroup: number;
    startHl: number;
  } | null>(null);

  // Set initial group width based on available space
  useEffect(() => {
    if (containerRef.current) {
      const avail = containerRef.current.clientWidth;
      setGroupWidth(Math.min(avail * 0.72, 1200));
    }
  }, []);

  // Global mousemove/mouseup for drag
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startX;

      if (d.side === "left") {
        // Left handle: group and highlights trade space
        setGroupWidth(clamp(d.startGroup + dx, 400, 1400));
        setHlWidth(clamp(d.startHl - dx, 180, 600));
      } else {
        // Right handle: only highlights changes, group stays
        const container = containerRef.current;
        const maxHl = container
          ? container.clientWidth - d.startGroup - 18 // 18 = handles + min margin
          : 600;
        setHlWidth(clamp(d.startHl + dx, 180, Math.min(600, maxHl)));
      }
    };

    const onMouseUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      setDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const startDrag =
    (side: "left" | "right") => (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = {
        side,
        startX: e.clientX,
        startGroup: groupWidth,
        startHl: hlWidth,
      };
      setDragging(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    };

  const handleClass =
    "w-[6px] shrink-0 cursor-col-resize relative z-10 group/handle";

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col overflow-hidden"
    >
      {/* Section title */}
      <div className="text-center pt-3 pb-2 shrink-0">
        <h1 className="font-serif text-sm text-foreground/50 tracking-[0.12em] font-medium">
          The Scholar&apos;s Desk: Reader View
        </h1>
      </div>
    <div className="flex-1 flex items-stretch px-4 pb-4 overflow-hidden">
      {/* Left spacer — centers the workspace block */}
      <div className="flex-1 min-w-0" />

      {/* PDF + Chat group — explicit width, can shrink on small screens */}
      <div
        className="h-full min-w-[400px]"
        style={{ width: groupWidth, flexShrink: 1 }}
      >
        <Group orientation="horizontal" id="alexandria-workspace">
          <Panel defaultSize="55%" minSize="35%">
            <BookFrame />
          </Panel>
          <Separator />
          <Panel defaultSize="45%" minSize="25%">
            <AtlasChatPanel />
          </Panel>
        </Group>
      </div>

      {/* Left resize handle (between group and highlights) */}
      <div className={handleClass} onMouseDown={startDrag("left")}>
        <div
          className={`absolute inset-y-0 -inset-x-0.5 rounded transition-colors ${
            dragging && dragRef.current?.side === "left"
              ? "bg-primary/30"
              : "hover:bg-primary/30"
          }`}
        />
      </div>

      {/* Highlights panel — independent width */}
      <div
        className="workspace-panel h-full shrink-0 overflow-hidden"
        style={{ width: hlWidth }}
      >
        <HighlightsRail />
      </div>

      {/* Right resize handle (highlights right edge → grows into margin) */}
      <div className={handleClass} onMouseDown={startDrag("right")}>
        <div
          className={`absolute inset-y-0 -inset-x-0.5 rounded transition-colors ${
            dragging && dragRef.current?.side === "right"
              ? "bg-primary/30"
              : "hover:bg-primary/30"
          }`}
        />
      </div>

      {/* Right spacer — absorbs right-handle growth */}
      <div className="flex-1 min-w-0" />
    </div>
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

  // Desktop: independent highlights panel
  return <DesktopWorkspace />;
}

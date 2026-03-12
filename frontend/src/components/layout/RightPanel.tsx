"use client";

import { useState } from "react";
import { ChatPanelContent } from "@/components/chat/ChatPanel";
import { HighlightPanel } from "@/components/reader/HighlightSidebar";

interface RightPanelProps {
  documentId?: string;
  showHighlights?: boolean;
}

export function RightPanel({ documentId, showHighlights = false }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "highlights">("chat");

  return (
    <div className="w-[380px] border-l border-border bg-panel-bg flex flex-col h-full shrink-0">
      {/* Tab bar — only in reader view */}
      {showHighlights && (
        <div className="flex border-b border-border">
          <button
            className="right-panel-tab"
            data-active={activeTab === "highlights"}
            onClick={() => setActiveTab("highlights")}
          >
            Highlights
          </button>
          <button
            className="right-panel-tab"
            data-active={activeTab === "chat"}
            onClick={() => setActiveTab("chat")}
          >
            Atlas
          </button>
        </div>
      )}

      {/* Panel content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showHighlights && activeTab === "highlights" ? (
          <HighlightPanel />
        ) : (
          <ChatPanelContent documentId={documentId} />
        )}
      </div>
    </div>
  );
}

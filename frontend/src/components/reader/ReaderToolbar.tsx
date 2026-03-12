"use client";

import Link from "next/link";
import { PageControls } from "./PageControls";
import { useChatStore } from "@/stores/chat.store";
import { useHighlightStore } from "@/stores/highlight.store";

export function ReaderToolbar({ title }: { title: string }) {
  const { isOpen: chatOpen, toggle: toggleChat } = useChatStore();
  const { sidebarOpen, toggleSidebar } = useHighlightStore();

  return (
    <div className="bg-card border-b border-primary/30 px-4 py-2 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/library"
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Library
        </Link>
        <div className="w-px h-4 bg-border/50" />
        <h2 className="font-serif text-sm text-foreground line-clamp-1 min-w-0">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <PageControls />
        <div className="w-px h-4 bg-border/40 mx-1" />
        <button
          onClick={toggleSidebar}
          className={`px-2.5 py-1 text-xs rounded border font-medium ${
            sidebarOpen
              ? "bg-accent/15 text-accent border-accent/30"
              : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          Highlights
        </button>
        <button
          onClick={toggleChat}
          className={`px-2.5 py-1 text-xs rounded border font-medium ${
            chatOpen
              ? "bg-primary/15 text-primary border-primary/30"
              : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          Atlas
        </button>
      </div>
    </div>
  );
}

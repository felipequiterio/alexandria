"use client";

import Link from "next/link";
import { PageControls } from "./PageControls";
import { useChatStore } from "@/stores/chat.store";
import { useHighlightStore } from "@/stores/highlight.store";

export function ReaderToolbar({ title }: { title: string }) {
  const { isOpen: chatOpen, toggle: toggleChat } = useChatStore();
  const { sidebarOpen, toggleSidebar } = useHighlightStore();

  return (
    <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Link
          href="/library"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Library
        </Link>
        <h2 className="font-serif text-lg text-secondary line-clamp-1 max-w-md">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <PageControls />
        <button
          onClick={toggleSidebar}
          className={`ml-2 px-3 py-1 text-sm rounded border transition-colors ${
            sidebarOpen
              ? "bg-accent text-accent-foreground border-accent"
              : "border-border hover:bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Highlights
        </button>
        <button
          onClick={toggleChat}
          className={`px-3 py-1 text-sm rounded border transition-colors ${
            chatOpen
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Atlas
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useLibraryStore } from "@/stores/library.store";
import { useChatStore } from "@/stores/chat.store";
import { DocumentGrid } from "@/components/library/DocumentGrid";
import { UploadArea } from "@/components/library/UploadArea";
import { LibraryToolbar } from "@/components/library/LibraryToolbar";
import { ChatPanel } from "@/components/chat/ChatPanel";

export default function LibraryPage() {
  const fetch = useLibraryStore((s) => s.fetch);
  const { isOpen, toggle, reset } = useChatStore();

  useEffect(() => {
    fetch();
    reset();
  }, [fetch, reset]);

  return (
    <div className="flex h-[calc(100vh-50px)]">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Title row */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-3xl font-serif text-secondary dark:text-foreground mb-1">
                Library
              </h2>
              <p className="text-muted-foreground text-sm">
                Your personal archive of knowledge and wisdom.
              </p>
            </div>
            <button
              onClick={() => {
                if (!isOpen) useChatStore.getState().setScope("library");
                toggle();
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-accent/40 text-accent hover:bg-accent hover:text-accent-foreground shadow-[0_0_0_1px_rgba(196,148,58,0.05)] hover:shadow-[0_0_12px_rgba(196,148,58,0.15)] font-medium"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              {isOpen ? "Close Atlas" : "Ask Atlas"}
            </button>
          </div>

          {/* Toolbar */}
          <LibraryToolbar />

          {/* Upload */}
          <div className="mt-5">
            <UploadArea />
          </div>

          {/* Document grid */}
          <div className="mt-5">
            <DocumentGrid />
          </div>
        </div>
      </div>

      <ChatPanel />
    </div>
  );
}

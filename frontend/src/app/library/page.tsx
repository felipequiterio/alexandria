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
    reset(); // Reset any document-scoped chat
  }, [fetch, reset]);

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-serif text-secondary mb-1">Library</h2>
              <p className="text-muted-foreground">Your personal collection of knowledge.</p>
            </div>
            <button
              onClick={() => {
                if (!isOpen) {
                  useChatStore.getState().setScope("library");
                }
                toggle();
              }}
              className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isOpen ? "Close Atlas" : "Ask Atlas"}
            </button>
          </div>

          <div className="mb-6">
            <LibraryToolbar />
          </div>

          <div className="mb-8">
            <UploadArea />
          </div>

          <DocumentGrid />
        </div>
      </div>

      <ChatPanel />
    </div>
  );
}

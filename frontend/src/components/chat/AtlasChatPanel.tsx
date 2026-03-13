"use client";

import { useEffect } from "react";
import { useChatStore } from "@/stores/chat.store";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { AtlasCompassIcon } from "@/components/assets/AtlasCompassIcon";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

export function AtlasChatPanel() {
  const {
    conversationId,
    scope,
    createConversation,
    createLibraryConversation,
  } = useChatStore();
  const selectedDocumentId = useWorkspaceStore((s) => s.selectedDocumentId);

  useEffect(() => {
    if (!conversationId) {
      if (selectedDocumentId) {
        createConversation(selectedDocumentId);
      } else {
        createLibraryConversation();
      }
    }
  }, [conversationId, selectedDocumentId, createConversation, createLibraryConversation]);

  return (
    <div className="ornate-frame workspace-panel flex-1 h-full rounded-lg">
      {/* Ornate Atlas header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <AtlasCompassIcon size={28} className="text-accent shrink-0" />
          <div className="min-w-0">
            <h2 className="font-serif text-xl tracking-[0.08em] font-medium text-foreground uppercase leading-none">
              Atlas
            </h2>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-muted-foreground tracking-wide">
            Chat Companion
          </span>
          <span className="text-[10px] font-medium text-muted-foreground tracking-wide">
            Mode:{" "}
            <span className="text-foreground uppercase">
              {scope}
            </span>
          </span>
        </div>
      </div>

      {/* Messages + input */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <MessageList />
        <ChatInput />
      </div>
    </div>
  );
}

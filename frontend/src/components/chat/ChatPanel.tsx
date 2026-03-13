"use client";

import { useEffect } from "react";
import { useChatStore } from "@/stores/chat.store";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

interface ChatPanelContentProps {
  documentId?: string;
}

export function ChatPanelContent({ documentId }: ChatPanelContentProps) {
  const {
    conversationId,
    scope,
    createConversation,
    createLibraryConversation,
    reset,
  } = useChatStore();

  useEffect(() => {
    reset();
  }, [documentId, reset]);

  useEffect(() => {
    if (!conversationId) {
      if (documentId) {
        createConversation(documentId);
      } else {
        createLibraryConversation();
      }
    }
  }, [
    conversationId,
    documentId,
    createConversation,
    createLibraryConversation,
  ]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
        <span className="text-sm font-medium text-foreground">
          Atlas
        </span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            scope === "library"
              ? "bg-accent/12 text-accent"
              : "bg-primary/12 text-primary"
          }`}
        >
          {scope === "library"
            ? "Library"
            : scope === "passage"
              ? "Passage"
              : "Document"}
        </span>
      </div>

      <MessageList />
      <ChatInput />
    </div>
  );
}

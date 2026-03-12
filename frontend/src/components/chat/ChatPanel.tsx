"use client";

import { useEffect } from "react";
import { useChatStore } from "@/stores/chat.store";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

interface ChatPanelProps {
  documentId?: string;
}

export function ChatPanel({ documentId }: ChatPanelProps) {
  const {
    isOpen,
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
    if (isOpen && !conversationId) {
      if (documentId) {
        createConversation(documentId);
      } else {
        createLibraryConversation();
      }
    }
  }, [
    isOpen,
    conversationId,
    documentId,
    createConversation,
    createLibraryConversation,
  ]);

  if (!isOpen) return null;

  return (
    <div className="w-[350px] border-l border-border bg-card flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Atlas globe icon */}
          <svg
            width="15"
            height="15"
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
          <span className="font-serif text-sm font-medium text-foreground">
            Atlas
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              scope === "library"
                ? "bg-accent/12 text-accent"
                : scope === "passage"
                  ? "bg-primary/12 text-primary"
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
        <button
          onClick={() => useChatStore.getState().close()}
          className="text-muted-foreground hover:text-foreground w-6 h-6 flex items-center justify-center rounded hover:bg-background"
        >
          &times;
        </button>
      </div>

      <MessageList />
      <ChatInput />
    </div>
  );
}

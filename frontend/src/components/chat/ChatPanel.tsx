"use client";

import { useEffect } from "react";
import { useChatStore } from "@/stores/chat.store";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

interface ChatPanelProps {
  documentId?: string;
}

export function ChatPanel({ documentId }: ChatPanelProps) {
  const { isOpen, conversationId, scope, createConversation, createLibraryConversation, reset } = useChatStore();

  useEffect(() => {
    // Reset chat state when document changes
    reset();
  }, [documentId, reset]);

  useEffect(() => {
    // Create a conversation when the panel opens and there isn't one
    if (isOpen && !conversationId) {
      if (documentId) {
        createConversation(documentId);
      } else {
        createLibraryConversation();
      }
    }
  }, [isOpen, conversationId, documentId, createConversation, createLibraryConversation]);

  if (!isOpen) return null;

  const scopeLabel = scope === "library" ? "Library" : "Document";

  return (
    <div className="w-[350px] border-l border-border bg-background flex flex-col h-full shrink-0">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-sm font-medium text-secondary">Atlas</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-muted-foreground">
            {scopeLabel}
          </span>
        </div>
        <button
          onClick={() => useChatStore.getState().close()}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          &times;
        </button>
      </div>
      <MessageList />
      <ChatInput />
    </div>
  );
}

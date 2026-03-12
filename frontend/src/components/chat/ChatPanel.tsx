"use client";

import { useEffect } from "react";
import { useChatStore } from "@/stores/chat.store";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

interface ChatPanelProps {
  documentId: string;
}

export function ChatPanel({ documentId }: ChatPanelProps) {
  const { isOpen, conversationId, createConversation, reset } = useChatStore();

  useEffect(() => {
    // Reset chat state when document changes
    reset();
  }, [documentId, reset]);

  useEffect(() => {
    // Create a conversation when the panel opens and there isn't one
    if (isOpen && !conversationId) {
      createConversation(documentId);
    }
  }, [isOpen, conversationId, documentId, createConversation]);

  if (!isOpen) return null;

  return (
    <div className="w-[350px] border-l border-border bg-background flex flex-col h-full shrink-0">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <h3 className="font-serif text-sm font-medium text-secondary">Atlas</h3>
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

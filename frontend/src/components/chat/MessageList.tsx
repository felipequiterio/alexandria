"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/stores/chat.store";
import { ChatMessage } from "./ChatMessage";
import { MarkdownContent } from "./MarkdownContent";
import { AgentActivityLog } from "./AgentActivityLog";

export function MessageList() {
  const { messages, isStreaming, streamingContent, agentActivity, scope } =
    useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, agentActivity]);

  /* Empty state */
  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground px-6 text-center">
        <div>
          <div className="flex justify-center mb-4 text-primary/25">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
          </div>
          <p className="text-base mb-1.5 text-foreground/60">
            Atlas awaits your question
          </p>
          <p className="text-xs text-muted-foreground/60">
            {scope === "library"
              ? "Ask about anything across your library"
              : "Select text or type a question below"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}

      {/* Streaming response */}
      {isStreaming && (
        <div className="flex justify-start">
          <div className="max-w-[88%] rounded-sm px-3.5 py-2.5 text-sm bg-card border border-border/50">
            {agentActivity.length > 0 && (
              <AgentActivityLog activities={agentActivity} />
            )}
            {streamingContent ? (
              <div className="text-card-foreground">
                <MarkdownContent content={streamingContent} />
                <span className="inline-block w-[2px] h-[14px] bg-primary/50 animate-pulse ml-0.5 align-text-bottom" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground text-xs py-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-accent atlas-flame" />
                <span>
                  Atlas is thinking...
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

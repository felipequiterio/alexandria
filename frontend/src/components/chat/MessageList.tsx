"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/stores/chat.store";
import { ChatMessage } from "./ChatMessage";
import { SourcePill } from "./SourcePill";
import { AgentActivityLog } from "./AgentActivityLog";

export function MessageList() {
  const { messages, isStreaming, streamingContent, agentActivity, scope } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, agentActivity]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm px-6 text-center">
        <div>
          <p className="font-serif text-lg mb-2">Atlas awaits your question</p>
          <p className="text-xs">
            {scope === "library"
              ? "Ask about anything across your library"
              : "Select text in the document or type a question below"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      {isStreaming && (
        <div className="flex justify-start mb-3">
          <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-card text-card-foreground border border-border">
            {agentActivity.length > 0 && (
              <AgentActivityLog activities={agentActivity} />
            )}
            {streamingContent ? (
              <div className="whitespace-pre-wrap leading-relaxed font-serif">
                {streamingContent.split(/\[p\.(\d+)\]/g).map((part, i) =>
                  i % 2 === 1 ? (
                    <SourcePill key={i} page={parseInt(part, 10)} />
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
                <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Atlas is thinking...</span>
              </div>
            )}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

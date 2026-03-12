"use client";

import type { Message } from "@alexandria/shared";
import { SourcePill } from "./SourcePill";

interface ChatMessageProps {
  message: Message;
}

function renderContent(content: string) {
  const parts = content.split(/\[p\.(\d+)\]/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <SourcePill key={i} page={parseInt(part, 10)} />;
    }
    return <span key={i}>{part}</span>;
  });
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-lg px-3.5 py-2.5 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-background text-card-foreground border border-border/50"
        }`}
      >
        {/* Quoted passage context */}
        {message.selectedText && (
          <div className="mb-2.5 px-2.5 py-1.5 rounded bg-accent/8 text-xs italic border-l-2 border-accent/60">
            <span className="text-accent/40 text-[10px] not-italic">
              &ldquo;
            </span>
            <span className="text-foreground/60">{message.selectedText}</span>
            <span className="text-accent/40 text-[10px] not-italic">
              &rdquo;
            </span>
          </div>
        )}

        {/* Message content — Atlas uses serif */}
        <div
          className={`whitespace-pre-wrap leading-relaxed ${!isUser ? "font-serif" : ""}`}
        >
          {renderContent(message.content)}
        </div>
      </div>
    </div>
  );
}

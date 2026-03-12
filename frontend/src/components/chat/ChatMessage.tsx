"use client";

import type { Message } from "@alexandria/shared";
import { SourcePill } from "./SourcePill";

interface ChatMessageProps {
  message: Message;
}

function renderContent(content: string) {
  // Split on [p.N] references and render them as SourcePills
  const parts = content.split(/\[p\.(\d+)\]/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      // This is a page number captured by the regex group
      return <SourcePill key={i} page={parseInt(part, 10)} />;
    }
    return <span key={i}>{part}</span>;
  });
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground border border-border"
        }`}
      >
        {message.selectedText && (
          <div className="mb-2 px-2 py-1 rounded bg-accent/15 text-xs italic border-l-2 border-accent">
            &ldquo;{message.selectedText}&rdquo;
          </div>
        )}
        <div className={`whitespace-pre-wrap leading-relaxed ${!isUser ? "font-serif" : ""}`}>
          {renderContent(message.content)}
        </div>
      </div>
    </div>
  );
}

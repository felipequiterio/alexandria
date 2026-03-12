"use client";

import { useState } from "react";
import type { AgentActivityItem } from "@alexandria/shared";

const TOOL_LABELS: Record<string, string> = {
  search_library: "Searching library",
  search_document: "Searching document",
  full_text_search: "Text search",
  read_section: "Reading section",
  read_pages: "Reading pages",
  get_document_info: "Document info",
  recall_conversations: "Recalling past conversations",
  check_familiarity: "Checking familiarity",
};

interface AgentActivityLogProps {
  activities: AgentActivityItem[];
}

export function AgentActivityLog({ activities }: AgentActivityLogProps) {
  const [expanded, setExpanded] = useState(false);

  if (activities.length === 0) return null;

  const allDone = activities.every((a) => a.status === "completed");
  const completedCount = activities.filter(
    (a) => a.status === "completed"
  ).length;

  return (
    <div className="mb-2.5 font-sans">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
      >
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            allDone ? "bg-success" : "bg-accent atlas-flame"
          }`}
        />
        <span>
          {allDone
            ? `Used ${activities.length} tool${activities.length > 1 ? "s" : ""}`
            : `Working... (${completedCount}/${activities.length})`}
        </span>
        <svg
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-1.5 ml-3 space-y-0.5 border-l border-border/40 pl-2.5">
          {activities.map((activity, i) => (
            <div key={i} className="text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground/60">
                {TOOL_LABELS[activity.toolName] || activity.toolName}
              </span>
              {activity.resultPreview && (
                <span className="ml-1 opacity-50">
                  &mdash; {activity.resultPreview.slice(0, 60)}
                  {activity.resultPreview.length > 60 ? "..." : ""}
                </span>
              )}
              {activity.status === "running" && (
                <span className="ml-1 text-accent animate-pulse">...</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

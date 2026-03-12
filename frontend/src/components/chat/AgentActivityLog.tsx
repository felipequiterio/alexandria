"use client";

import { useState } from "react";
import type { AgentActivityItem } from "@alexandria/shared";

const TOOL_LABELS: Record<string, string> = {
  search_library: "Searching library",
  search_document: "Searching document",
  full_text_search: "Text search",
  read_section: "Reading section",
  read_pages: "Reading pages",
  get_document_info: "Getting document info",
  recall_conversations: "Recalling conversations",
  check_familiarity: "Checking familiarity",
};

interface AgentActivityLogProps {
  activities: AgentActivityItem[];
}

export function AgentActivityLog({ activities }: AgentActivityLogProps) {
  const [expanded, setExpanded] = useState(false);

  if (activities.length === 0) return null;

  const allDone = activities.every((a) => a.status === "completed");

  return (
    <div className="mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className={`inline-block w-2 h-2 rounded-full ${allDone ? "bg-green-500" : "bg-amber-500 animate-pulse"}`} />
        <span>
          {allDone
            ? `Used ${activities.length} tool${activities.length > 1 ? "s" : ""}`
            : `Working... (${activities.filter((a) => a.status === "completed").length}/${activities.length})`}
        </span>
        <span className="text-[10px]">{expanded ? "\u25B2" : "\u25BC"}</span>
      </button>
      {expanded && (
        <div className="mt-1 ml-3.5 space-y-1">
          {activities.map((activity, i) => (
            <div key={i} className="text-xs text-muted-foreground">
              <span className="font-medium">
                {TOOL_LABELS[activity.toolName] || activity.toolName}
              </span>
              {activity.resultPreview && (
                <span className="ml-1 opacity-70">
                  — {activity.resultPreview.slice(0, 80)}
                  {activity.resultPreview.length > 80 ? "..." : ""}
                </span>
              )}
              {activity.status === "running" && (
                <span className="ml-1 animate-pulse">...</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

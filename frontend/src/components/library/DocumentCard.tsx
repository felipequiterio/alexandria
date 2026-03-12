"use client";

import Link from "next/link";
import type { Document } from "@alexandria/shared";

const typeColors: Record<string, string> = {
  paper: "border-l-primary",
  book: "border-l-accent",
  article: "border-l-destructive",
  note: "border-l-muted",
  other: "border-l-secondary",
};

export function DocumentCard({ doc }: { doc: Document }) {
  const borderClass = typeColors[doc.type] || typeColors.other;

  return (
    <Link href={`/reader/${doc.id}`}>
      <div
        className={`bg-card rounded-lg border border-border border-l-4 ${borderClass} p-5 hover:shadow-lg transition-shadow cursor-pointer group`}
      >
        <h3 className="font-serif text-lg text-card-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
          {doc.title}
        </h3>

        {doc.authors.length > 0 && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
            {doc.authors.join(", ")}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="capitalize">{doc.type}</span>
          <span>&middot;</span>
          <span>{doc.pageCount} pages</span>
          <span>&middot;</span>
          <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
        </div>

        <div className="mt-3">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              doc.processingStatus === "completed"
                ? "bg-primary/10 text-primary"
                : doc.processingStatus === "failed"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-accent/10 text-accent"
            }`}
          >
            {doc.processingStatus}
          </span>
        </div>
      </div>
    </Link>
  );
}

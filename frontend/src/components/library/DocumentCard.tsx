"use client";

import { useState } from "react";
import Link from "next/link";
import type { Document } from "@alexandria/shared";
import { useLibraryStore } from "@/stores/library.store";

export function DocumentCard({ doc }: { doc: Document }) {
  const remove = useLibraryStore((s) => s.remove);
  const [confirming, setConfirming] = useState(false);
  const isProcessing = doc.processingStatus === "processing" || doc.processingStatus === "pending";

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    try {
      await remove(doc.id);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(false);
  };

  return (
    <Link href={`/reader/${doc.id}`}>
      <div
        className={`doc-card p-5 cursor-pointer group relative ${isProcessing ? "animate-pulse" : ""}`}
      >
        {/* Delete controls */}
        <div className="absolute top-2 right-3 flex items-center gap-1 z-10">
          {confirming && (
            <button
              onClick={handleCancelDelete}
              className="text-xs px-1.5 py-0.5 rounded-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleDelete}
            className={`text-xs px-1.5 py-0.5 rounded-sm ${
              confirming
                ? "bg-destructive text-destructive-foreground"
                : "text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
            }`}
            title={confirming ? "Confirm delete" : "Delete"}
          >
            {confirming ? "Delete" : "\u00D7"}
          </button>
        </div>

        {/* Title */}
        <h3 className="text-[1.05rem] text-card-foreground group-hover:text-primary line-clamp-2 mb-1 pr-10 leading-snug">
          {doc.title}
        </h3>

        {/* Authors */}
        {doc.authors.length > 0 && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
            {doc.authors.join(", ")}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="uppercase tracking-wider text-[10px] font-medium">
              {doc.type}
            </span>
            <span className="opacity-30">&middot;</span>
            <span>{doc.pageCount}p</span>
            <span className="opacity-30">&middot;</span>
            <span>
              {new Date(doc.uploadDate).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          {doc.processingStatus !== "completed" && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-sm font-medium tracking-wide uppercase border ${
                doc.processingStatus === "failed"
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : "bg-accent/10 text-accent border-accent/20"
              }`}
            >
              {doc.processingStatus}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

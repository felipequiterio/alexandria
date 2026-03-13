"use client";

import { useEffect, useCallback, useRef } from "react";
import { useLibraryStore } from "@/stores/library.store";
import { useWorkspaceStore } from "@/stores/workspace.store";
import type { Document } from "@alexandria/shared";

const RIBBON_DOT: Record<string, string> = {
  paper: "bg-primary",
  book: "bg-accent",
  article: "bg-destructive",
  note: "bg-muted",
  other: "bg-secondary",
};

function DocumentEntry({ doc }: { doc: Document }) {
  const openDocument = useWorkspaceStore((s) => s.openDocument);
  const selectedDocumentId = useWorkspaceStore((s) => s.selectedDocumentId);
  const isActive = selectedDocumentId === doc.id;
  const isProcessing = doc.processingStatus === "processing" || doc.processingStatus === "pending";

  return (
    <button
      onClick={() => openDocument(doc.id)}
      className={`w-full text-left px-3 py-2 rounded-sm flex items-center gap-2.5 group transition-colors text-sm ${
        isActive
          ? "bg-primary/10 text-foreground"
          : "text-foreground/70 hover:bg-card/60 hover:text-foreground"
      }`}
    >
      {/* Type dot */}
      <span className={`w-2 h-2 rounded-full shrink-0 ${RIBBON_DOT[doc.type] || RIBBON_DOT.other} ${isProcessing ? "animate-pulse" : ""}`} />

      {/* Title */}
      <span className="truncate text-[0.8rem] leading-tight">
        {doc.title}
      </span>

      {/* Status badge */}
      {doc.processingStatus === "failed" && (
        <span className="ml-auto text-[9px] text-destructive shrink-0">!</span>
      )}
    </button>
  );
}

function UploadTrigger() {
  const upload = useLibraryStore((s) => s.upload);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.type === "application/pdf") {
        await upload(file);
      }
    }
  }, [upload]);

  return (
    <div className="p-3 border-t border-border/50">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full text-xs uppercase tracking-wider font-medium text-primary/70 hover:text-primary border border-dashed border-primary/20 hover:border-primary/40 rounded-sm py-2.5 transition-colors hover:bg-primary/5"
      >
        + Add Document
      </button>
    </div>
  );
}

export function ArchiveSidebar() {
  const documents = useLibraryStore((s) => s.documents);
  const fetch = useLibraryStore((s) => s.fetch);
  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const setSearchQuery = useLibraryStore((s) => s.setSearchQuery);
  const getFilteredDocuments = useLibraryStore((s) => s.getFilteredDocuments);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const filteredDocs = getFilteredDocuments();

  return (
    <div className="archive-inner flex flex-col h-full">
      {/* Archive header */}
      <div className="p-3 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-foreground tracking-wide">
            Archive
          </h2>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {documents.length} documents
          </span>
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="w-full text-xs bg-input-bg border border-border/60 rounded-sm px-3 py-2 placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
        />
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <div className="py-2 px-1 mb-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.14em] font-medium">
            All Documents
          </span>
        </div>

        <div className="space-y-0.5">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-muted-foreground/40">
                {searchQuery ? "No documents match your search." : "Your archive awaits its first document."}
              </p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <DocumentEntry key={doc.id} doc={doc} />
            ))
          )}
        </div>
      </div>

      {/* Upload trigger */}
      <UploadTrigger />
    </div>
  );
}

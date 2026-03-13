"use client";

import { useEffect, useCallback, useRef } from "react";
import { useLibraryStore } from "@/stores/library.store";
import { useWorkspaceStore } from "@/stores/workspace.store";
import type { Document } from "@alexandria/shared";

const RIBBON_COLOR: Record<string, string> = {
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
  const isFailed = doc.processingStatus === "failed";

  return (
    <button
      onClick={() => openDocument(doc.id)}
      className={`scroll-slot ${isProcessing ? "scroll-slot-shimmer" : ""}`}
      data-active={isActive}
    >
      <span className={`scroll-slot-ribbon ${RIBBON_COLOR[doc.type] || RIBBON_COLOR.other}`} />
      <div className="pl-2 min-w-0">
        <span className="truncate font-serif text-[0.8rem] leading-tight block">
          {doc.title}
        </span>
        <span className="text-[10px] text-muted-foreground/60">
          {doc.type} · {doc.pageCount ?? "?"}p
        </span>
      </div>
      {isFailed && (
        <span className="absolute top-1 right-1.5 text-[9px] font-bold text-destructive">!</span>
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
    <div className="px-3 pb-3 pt-2">
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
        className="scroll-slot w-full justify-center gap-2 !border-dashed !border-accent/20 hover:!border-accent/40 hover:bg-surface-parchment/50"
      >
        {/* Rolled scroll icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent/60 shrink-0">
          <path d="M4 2C3 2 2 3 2 4v8c0 1 1 2 2 2h1V4c0-.6.4-1 1-1h7c0-1-1-1-1-1H4z" fill="currentColor" opacity="0.5"/>
          <rect x="5" y="3" width="9" height="11" rx="1" stroke="currentColor" strokeWidth="1" fill="none"/>
          <path d="M7 6h5M7 8.5h5M7 11h3" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" opacity="0.5"/>
        </svg>
        <span className="font-serif text-xs text-accent/70">Place a new scroll</span>
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
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-serif text-sm font-medium text-foreground uppercase tracking-[0.12em]">
            The Archive
          </h2>
          <span className="brass-plaque tabular-nums">
            {documents.length} scrolls
          </span>
        </div>

        <div className="archive-header-rule" />

        {/* Search with icon */}
        <div className="relative">
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scrolls..."
            className="w-full text-xs bg-input-bg border border-border/60 rounded-lg pl-8 pr-3 py-2 placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Document list with cabinet aesthetic */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {/* Cabinet cornice */}
        <div className="cabinet-cornice" />

        {/* Cabinet frame */}
        <div className="cabinet !rounded-t-none">
          {/* Teal frieze band */}
          <div className="cabinet-frieze">
            <span className="text-[10px] text-primary-foreground/90 dark:text-accent uppercase tracking-[0.14em] font-medium">
              Scrolls
            </span>
          </div>

          {/* Cabinet interior — document entries */}
          <div className="cabinet-interior">
            {filteredDocs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground/40 font-serif italic">
                  {searchQuery ? "No scrolls match your search." : "Your archive awaits its first scroll."}
                </p>
              </div>
            ) : (
              filteredDocs.map((doc, i) => (
                <div key={doc.id}>
                  {i > 0 && <div className="cabinet-divider mx-2 my-1" />}
                  <DocumentEntry doc={doc} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upload trigger */}
      <UploadTrigger />
    </div>
  );
}

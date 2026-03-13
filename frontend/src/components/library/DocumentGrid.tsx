"use client";

import { useLibraryStore } from "@/stores/library.store";
import { DocumentCard } from "./DocumentCard";

export function DocumentGrid() {
  const { loading, getFilteredDocuments, documents } = useLibraryStore();
  const filtered = getFilteredDocuments();

  if (loading) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Loading documents<span className="animate-pulse">...</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-muted-foreground/30 mb-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <p className="text-xl text-foreground/70 mb-2">
          Your library awaits its first document.
        </p>
        <p className="text-muted-foreground text-sm">
          Upload a PDF above to begin building your collection.
        </p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No documents match your current filters.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase">
          {filtered.length} document{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}
      </div>
    </div>
  );
}

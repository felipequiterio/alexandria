"use client";

import { useLibraryStore } from "@/stores/library.store";
import { DocumentCard } from "./DocumentCard";

export function DocumentGrid() {
  const { documents, loading } = useLibraryStore();

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading library...
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-serif text-xl text-secondary mb-2">
          Your library is empty
        </p>
        <p className="text-muted-foreground">
          Upload a PDF to begin building your collection.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} />
      ))}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useLibraryStore } from "@/stores/library.store";
import { DocumentGrid } from "@/components/library/DocumentGrid";
import { UploadArea } from "@/components/library/UploadArea";

export default function LibraryPage() {
  const fetch = useLibraryStore((s) => s.fetch);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-secondary mb-1">Library</h2>
        <p className="text-muted-foreground">Your personal collection of knowledge.</p>
      </div>

      <div className="mb-8">
        <UploadArea />
      </div>

      <DocumentGrid />
    </div>
  );
}

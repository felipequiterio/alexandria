"use client";

import { useCallback, useState } from "react";
import { useLibraryStore } from "@/stores/library.store";

export function UploadArea() {
  const upload = useLibraryStore((s) => s.upload);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
            await upload(file);
          }
        }
      } finally {
        setUploading(false);
      }
    },
    [upload]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`border border-dashed rounded-sm py-5 px-6 text-center cursor-pointer transition-all ${
        dragging
          ? "border-accent bg-accent/8"
          : "border-border/60 hover:border-accent/40 hover:bg-card/50"
      }`}
    >
      <input
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        id="file-upload"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center gap-3">
        {uploading ? (
          <p className="text-muted-foreground text-sm">
            Uploading document<span className="animate-pulse">...</span>
          </p>
        ) : (
          <>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground/50"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="text-sm text-muted-foreground">
              <span className="text-foreground/70">Upload a document</span>
              {" "}&mdash; drop a PDF or click to browse
            </span>
          </>
        )}
      </label>
    </div>
  );
}

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
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
        dragging
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/50"
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
      <label htmlFor="file-upload" className="cursor-pointer">
        {uploading ? (
          <p className="text-muted-foreground">Uploading...</p>
        ) : (
          <>
            <p className="text-lg font-serif text-secondary mb-1">
              Drop PDFs here or click to upload
            </p>
            <p className="text-sm text-muted-foreground">
              PDF files only
            </p>
          </>
        )}
      </label>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useHighlightStore } from "@/stores/highlight.store";
import { useChatStore } from "@/stores/chat.store";
import { useReaderStore } from "@/stores/reader.store";
import { getDocument, getDocumentFileUrl } from "@/lib/api";
import { PageControls } from "@/components/reader/PageControls";
import type { Document } from "@alexandria/shared";

const PdfViewer = dynamic(
  () => import("@/components/reader/PdfViewer").then((m) => m.PdfViewer),
  { ssr: false }
);

function EmptyDesk({ onOpenArchive }: { onOpenArchive: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div className="opacity-20 mb-6">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </div>
      <h3 className="font-serif text-lg text-foreground/60 mb-2">
        Your scholar&apos;s desk awaits
      </h3>
      <p className="text-sm text-muted-foreground/50 max-w-[260px] mb-6">
        Open the archive to select a scroll, or drag a PDF onto this surface.
      </p>
      <button
        onClick={onOpenArchive}
        className="text-xs uppercase tracking-wider font-medium text-primary hover:text-primary/80 border border-primary/30 rounded-lg px-4 py-2 hover:bg-primary/5 transition-colors"
      >
        Open Archive
      </button>
    </div>
  );
}

function ReaderHeader({ title }: { title: string }) {
  return (
    <div className="bg-toolbar-bg border-b border-border px-4 h-10 flex items-center justify-between shrink-0 rounded-t-[var(--panel-radius)]">
      <h2 className="font-serif text-sm text-foreground line-clamp-1 min-w-0">
        {title}
      </h2>
      <PageControls />
    </div>
  );
}

export function DocumentViewport() {
  const selectedDocumentId = useWorkspaceStore((s) => s.selectedDocumentId);
  const setArchiveOpen = useWorkspaceStore((s) => s.setArchiveOpen);
  const fetchHighlights = useHighlightStore((s) => s.fetch);
  const resetChat = useChatStore((s) => s.reset);
  const setScope = useChatStore((s) => s.setScope);
  const setPage = useReaderStore((s) => s.setPage);

  const [doc, setDoc] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load document when selection changes
  useEffect(() => {
    if (!selectedDocumentId) {
      setDoc(null);
      setError(null);
      resetChat();
      setScope("library");
      return;
    }

    setLoading(true);
    setError(null);
    setPage(1);

    getDocument(selectedDocumentId)
      .then((d) => {
        setDoc(d);
        setLoading(false);
        setScope("document");
        fetchHighlights(selectedDocumentId);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });

    // Reset chat for new document
    resetChat();
  }, [selectedDocumentId, fetchHighlights, resetChat, setScope, setPage]);

  if (!selectedDocumentId) {
    return (
      <div className="workspace-panel-document flex-1">
        <EmptyDesk onOpenArchive={() => setArchiveOpen(true)} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="workspace-panel-document flex-1 flex items-center justify-center">
        <p className="text-destructive font-serif text-sm">{error}</p>
      </div>
    );
  }

  if (loading || !doc) {
    return (
      <div className="workspace-panel-document flex-1 flex items-center justify-center">
        <p className="text-muted-foreground font-serif text-sm">Loading document...</p>
      </div>
    );
  }

  return (
    <div className="workspace-panel-document flex-1 flex flex-col">
      <ReaderHeader title={doc.title} />
      <div className="flex-1 overflow-auto">
        <PdfViewer fileUrl={getDocumentFileUrl(doc.id)} documentId={doc.id} />
      </div>
    </div>
  );
}

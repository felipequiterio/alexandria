"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { getDocument, getDocumentFileUrl } from "@/lib/api";
import { ReaderToolbar } from "@/components/reader/ReaderToolbar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { HighlightSidebar } from "@/components/reader/HighlightSidebar";
import type { Document } from "@alexandria/shared";

const PdfViewer = dynamic(
  () => import("@/components/reader/PdfViewer").then((m) => m.PdfViewer),
  { ssr: false }
);

export default function ReaderPage() {
  const params = useParams<{ id: string }>();
  const [doc, setDoc] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDocument(params.id).then(setDoc).catch((e) => setError(String(e)));
  }, [params.id]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-destructive">
        {error}
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Loading document...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <ReaderToolbar title={doc.title} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto relative">
          <PdfViewer fileUrl={getDocumentFileUrl(doc.id)} documentId={doc.id} />
        </div>
        <ChatPanel documentId={doc.id} />
        <HighlightSidebar />
      </div>
    </div>
  );
}

"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useReaderStore } from "@/stores/reader.store";
import { SelectionToolbar } from "@/components/chat/SelectionToolbar";
import { createHighlight } from "@/lib/api";
import { useHighlightStore } from "@/stores/highlight.store";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfViewerProps {
  fileUrl: string;
  documentId: string;
}

export function PdfViewer({ fileUrl, documentId }: PdfViewerProps) {
  const { page, scale, setTotalPages } = useReaderStore();
  const [selection, setSelection] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setTotalPages(numPages);
    },
    [setTotalPages]
  );

  useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();

      if (text && text.length > 0) {
        const range = sel?.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          setSelection({
            text,
            x: rect.left + rect.width / 2 - 70,
            y: rect.top,
          });
        }
      } else {
        setSelection(null);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Clear selection when clicking outside the toolbar
      const target = e.target as HTMLElement;
      if (!target.closest("[data-selection-toolbar]")) {
        setSelection(null);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  const handleHighlight = async () => {
    if (!selection) return;
    const currentPage = useReaderStore.getState().page;

    try {
      await createHighlight({
        documentId,
        content: selection.text,
        pageNumber: currentPage,
        positionStart: 0,
        positionEnd: selection.text.length,
      });
      useHighlightStore.getState().fetch(documentId);
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    } catch (err) {
      console.error("Failed to create highlight:", err);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex justify-center py-6 overflow-auto bg-secondary/5 min-h-[calc(100vh-8rem)]"
    >
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="text-muted-foreground py-20">Loading PDF...</div>
        }
        error={
          <div className="text-destructive py-20">Failed to load PDF.</div>
        }
      >
        <Page
          pageNumber={page}
          scale={scale}
          renderTextLayer={true}
          renderAnnotationLayer={true}
          className="shadow-lg"
        />
      </Document>

      {selection && (
        <div data-selection-toolbar>
          <SelectionToolbar
            text={selection.text}
            x={selection.x}
            y={selection.y}
            onHighlight={handleHighlight}
          />
        </div>
      )}
    </div>
  );
}

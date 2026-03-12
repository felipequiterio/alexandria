"use client";

import {
  useCallback,
  useState,
  useEffect,
  useRef,
  memo,
  startTransition,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useReaderStore } from "@/stores/reader.store";
import { SelectionToolbar } from "@/components/chat/SelectionToolbar";
import { HighlightLayer } from "@/components/reader/HighlightLayer";
import { createHighlight } from "@/lib/api";
import { useHighlightStore } from "@/stores/highlight.store";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const PAGE_BUFFER = 2;

interface PdfViewerProps {
  fileUrl: string;
  documentId: string;
}

/** Renders a real <Page> or a height-matched placeholder. */
const VirtualPage = memo(function VirtualPage({
  pageNum,
  scale,
  isVisible,
  placeholderHeight,
  onHeightMeasured,
  documentId,
}: {
  pageNum: number;
  scale: number;
  isVisible: boolean;
  placeholderHeight: number;
  onHeightMeasured: (pageNum: number, height: number) => void;
  documentId: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [pageEl, setPageEl] = useState<HTMLElement | null>(null);

  const onRenderSuccess = useCallback(() => {
    const el = wrapperRef.current;
    if (el) {
      onHeightMeasured(pageNum, el.offsetHeight);
      setPageEl(el);
    }
  }, [pageNum, onHeightMeasured]);

  return (
    <div
      ref={wrapperRef}
      data-page-number={pageNum}
      className="mb-4 relative"
      style={{ contain: "layout style" }}
    >
      {isVisible ? (
        <>
          <Page
            pageNumber={pageNum}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            onRenderSuccess={onRenderSuccess}
            className="shadow-[0_4px_32px_rgba(0,0,0,0.3),0_1px_8px_rgba(0,0,0,0.2)]"
          />
          <HighlightLayer
            pageElement={pageEl}
            pageNumber={pageNum}
            documentId={documentId}
          />
        </>
      ) : (
        <div
          style={{ height: placeholderHeight }}
          className="bg-foreground/[0.03] rounded"
        />
      )}
    </div>
  );
});

export function PdfViewer({ fileUrl, documentId }: PdfViewerProps) {
  const { scale, setTotalPages, setPage } = useReaderStore();
  const [numPages, setNumPages] = useState(0);
  const [visibleStart, setVisibleStart] = useState(1);
  const [visibleEnd, setVisibleEnd] = useState(5);
  const [selection, setSelection] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollingToPage = useRef(false);
  const rafId = useRef(0);
  const pageHeights = useRef<Map<number, number>>(new Map());
  // Ref mirrors visibleStart/End so the scroll handler doesn't need them as deps
  const rangeRef = useRef({ start: 1, end: 5 });
  const defaultHeight = Math.round(842 * scale);

  const getH = useCallback(
    (p: number) => pageHeights.current.get(p) ?? defaultHeight,
    [defaultHeight]
  );

  // Keep ref in sync
  useEffect(() => {
    rangeRef.current = { start: visibleStart, end: visibleEnd };
  }, [visibleStart, visibleEnd]);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: total }: { numPages: number }) => {
      setNumPages(total);
      setTotalPages(total);
    },
    [setTotalPages]
  );

  const onHeightMeasured = useCallback((pageNum: number, height: number) => {
    pageHeights.current.set(pageNum, height);
  }, []);

  // ── Visibility: single IntersectionObserver, rAF-batched, startTransition ──
  useEffect(() => {
    if (numPages === 0) return;
    const scrollRoot = containerRef.current?.parentElement;
    const container = containerRef.current;
    if (!scrollRoot || !container) return;

    const nearViewport = new Set<number>();
    let rafPending = false;

    const flush = () => {
      rafPending = false;
      if (nearViewport.size === 0) return;

      let min = Infinity;
      let max = -Infinity;
      for (const p of nearViewport) {
        if (p < min) min = p;
        if (p > max) max = p;
      }

      const newStart = Math.max(1, min - PAGE_BUFFER);
      const newEnd = Math.min(numPages, max + PAGE_BUFFER);

      // startTransition: lets React defer the heavy <Page> mounts
      // so the browser can keep painting scroll frames
      startTransition(() => {
        setVisibleStart((prev) => (prev === newStart ? prev : newStart));
        setVisibleEnd((prev) => (prev === newEnd ? prev : newEnd));
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const p = Number((entry.target as HTMLElement).dataset.pageNumber);
          if (entry.isIntersecting) nearViewport.add(p);
          else nearViewport.delete(p);
        }
        if (!rafPending) {
          rafPending = true;
          requestAnimationFrame(flush);
        }
      },
      {
        root: scrollRoot,
        rootMargin: `${defaultHeight}px 0px`,
        threshold: 0,
      }
    );

    const wrappers = container.querySelectorAll("[data-page-number]");
    wrappers.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [numPages, defaultHeight]);

  // ── Page counter: rAF-throttled, reads range from ref (no re-attach) ──
  useEffect(() => {
    if (numPages === 0) return;
    const scrollRoot = containerRef.current?.parentElement;
    const container = containerRef.current;
    if (!scrollRoot || !container) return;

    const update = () => {
      if (scrollingToPage.current) return;

      const { start, end } = rangeRef.current;
      const rootRect = scrollRoot.getBoundingClientRect();
      const targetY = rootRect.top + rootRect.height / 3;

      let closestPage = start;
      let closestDist = Infinity;

      for (let p = start; p <= end; p++) {
        const el = container.querySelector<HTMLElement>(
          `[data-page-number="${p}"]`
        );
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const dist = Math.abs(mid - targetY);
        if (dist < closestDist) {
          closestDist = dist;
          closestPage = p;
        }
      }

      setPage(closestPage);
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(update);
    };

    update();
    scrollRoot.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scrollRoot.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId.current);
    };
    // No visibleStart/End — reads from rangeRef
  }, [numPages, setPage]);

  // ── Scroll-to-page when PageControls navigates ──
  useEffect(() => {
    const unsub = useReaderStore.subscribe((state, prev) => {
      if (state.page === prev.page) return;
      const el = containerRef.current?.querySelector<HTMLElement>(
        `[data-page-number="${state.page}"]`
      );
      if (el) {
        scrollingToPage.current = true;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => {
          scrollingToPage.current = false;
        }, 600);
      }
    });
    return unsub;
  }, []);

  // ── Text selection for highlights ──
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
      className="flex flex-col items-center py-8 min-h-full"
    >
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="text-[#C4B8A8] py-20 font-serif text-lg">
            Loading manuscript...
          </div>
        }
        error={
          <div className="text-destructive py-20 font-serif">
            Failed to load manuscript.
          </div>
        }
      >
        {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
          <VirtualPage
            key={pageNum}
            pageNum={pageNum}
            scale={scale}
            isVisible={pageNum >= visibleStart && pageNum <= visibleEnd}
            placeholderHeight={getH(pageNum)}
            onHeightMeasured={onHeightMeasured}
            documentId={documentId}
          />
        ))}
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

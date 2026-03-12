"use client";

import { useReaderStore } from "@/stores/reader.store";

export function PageControls() {
  const { page, totalPages, scale, setPage, nextPage, prevPage, setScale } =
    useReaderStore();

  const btnClass =
    "w-7 h-7 flex items-center justify-center text-xs rounded border border-border/50 hover:bg-card disabled:opacity-30 text-foreground";

  return (
    <div className="flex items-center gap-2">
      {/* Page navigation */}
      <button onClick={prevPage} disabled={page <= 1} className={btnClass}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="flex items-center gap-1 text-xs">
        <input
          type="number"
          min={1}
          max={totalPages || undefined}
          value={page}
          onChange={(e) => setPage(Number(e.target.value))}
          className="w-10 text-center rounded border border-border/50 bg-card px-1 py-0.5 text-xs"
        />
        <span className="text-muted-foreground/60">/</span>
        <span className="text-muted-foreground/60">{totalPages || "?"}</span>
      </div>

      <button
        onClick={nextPage}
        disabled={page >= totalPages}
        className={btnClass}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Zoom */}
      <div className="ml-2 flex items-center gap-1">
        <button
          onClick={() => setScale(scale - 0.1)}
          className={btnClass}
        >
          &minus;
        </button>
        <span className="w-10 text-center text-[11px] text-muted-foreground tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale(scale + 0.1)}
          className={btnClass}
        >
          +
        </button>
      </div>
    </div>
  );
}

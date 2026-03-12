"use client";

import { useReaderStore } from "@/stores/reader.store";

export function PageControls() {
  const { page, totalPages, scale, setPage, nextPage, prevPage, setScale } =
    useReaderStore();

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={prevPage}
        disabled={page <= 1}
        className="px-2 py-1 text-sm rounded border border-border hover:bg-card disabled:opacity-40 transition-colors"
      >
        Prev
      </button>

      <div className="flex items-center gap-1 text-sm">
        <input
          type="number"
          min={1}
          max={totalPages || undefined}
          value={page}
          onChange={(e) => setPage(Number(e.target.value))}
          className="w-12 text-center rounded border border-border bg-card px-1 py-0.5"
        />
        <span className="text-muted-foreground">/ {totalPages || "?"}</span>
      </div>

      <button
        onClick={nextPage}
        disabled={page >= totalPages}
        className="px-2 py-1 text-sm rounded border border-border hover:bg-card disabled:opacity-40 transition-colors"
      >
        Next
      </button>

      <div className="ml-4 flex items-center gap-1 text-sm">
        <button
          onClick={() => setScale(scale - 0.1)}
          className="px-2 py-1 rounded border border-border hover:bg-card transition-colors"
        >
          -
        </button>
        <span className="w-14 text-center text-muted-foreground">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale(scale + 0.1)}
          className="px-2 py-1 rounded border border-border hover:bg-card transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

"use client";

import { useReaderStore } from "@/stores/reader.store";

interface SourcePillProps {
  page: number;
}

export function SourcePill({ page }: SourcePillProps) {
  const setPage = useReaderStore((s) => s.setPage);

  return (
    <button
      onClick={() => setPage(page)}
      className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-primary/15 text-primary hover:bg-primary/25 transition-colors cursor-pointer"
    >
      p.{page}
    </button>
  );
}

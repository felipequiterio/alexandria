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
      className="inline-flex items-center px-1.5 py-0 text-[11px] font-sans font-medium rounded bg-primary/10 text-primary hover:bg-primary/18 cursor-pointer mx-0.5 align-baseline"
    >
      p.{page}
    </button>
  );
}

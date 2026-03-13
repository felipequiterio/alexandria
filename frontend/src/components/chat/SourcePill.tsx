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
      className="inline-flex items-center px-0.5 py-0 text-[11px] font-serif font-medium text-primary hover:text-primary/80 cursor-pointer mx-0.5 align-baseline"
    >
      <span className="opacity-40">[</span>
      p.{page}
      <span className="opacity-40">]</span>
    </button>
  );
}

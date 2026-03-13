"use client";

import Link from "next/link";
import { PageControls } from "./PageControls";

export function ReaderToolbar({ title }: { title: string }) {
  return (
    <div className="bg-toolbar-bg border-b border-border px-4 h-10 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/library"
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Library
        </Link>
        <div className="w-px h-3.5 bg-border" />
        <h2 className="text-sm text-foreground line-clamp-1 min-w-0">
          {title}
        </h2>
      </div>

      <PageControls />
    </div>
  );
}

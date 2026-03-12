"use client";

import Link from "next/link";
import { PageControls } from "./PageControls";

export function ReaderToolbar({ title }: { title: string }) {
  return (
    <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Link
          href="/library"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Library
        </Link>
        <h2 className="font-serif text-lg text-secondary line-clamp-1 max-w-md">
          {title}
        </h2>
      </div>

      <PageControls />
    </div>
  );
}

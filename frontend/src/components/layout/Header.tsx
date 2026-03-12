"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/library" className="flex items-center gap-3">
          <h1 className="text-2xl font-serif tracking-wide">Alexandria</h1>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/library"
            className="hover:text-accent transition-colors"
          >
            Library
          </Link>
        </nav>
      </div>
    </header>
  );
}

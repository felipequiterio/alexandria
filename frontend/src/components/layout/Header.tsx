"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettingsStore } from "@/stores/settings.store";

function ThemeToggle() {
  const { theme, setTheme } = useSettingsStore();

  const cycle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <button
      onClick={cycle}
      className="p-1.5 rounded text-muted-foreground hover:text-foreground"
      title={`Theme: ${theme}`}
    >
      {theme === "dark" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : theme === "system" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: "/library", label: "Library" },
    { href: "/constellation", label: "Constellation", disabled: true },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <header className="relative z-50 shrink-0">
      {/* Slim toolbar bar */}
      <nav className="bg-toolbar-bg h-10 flex items-center justify-between px-6">
        <Link href="/library">
          <span className="font-serif text-[1.1rem] tracking-[0.18em] font-medium uppercase text-foreground">
            Alexandria
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            if (item.disabled) {
              return (
                <span
                  key={item.href}
                  className="uppercase text-[10px] tracking-[0.12em] font-medium text-muted-foreground/30 cursor-not-allowed"
                >
                  {item.label}
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`uppercase text-[10px] tracking-[0.12em] font-medium pb-0.5 ${
                  isActive
                    ? "text-accent border-b border-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="w-px h-3.5 bg-border" />
          <ThemeToggle />
        </div>
      </nav>

      {/* Thin frieze accent line */}
      <div className="h-[1.5px] bg-primary/60" />
    </header>
  );
}

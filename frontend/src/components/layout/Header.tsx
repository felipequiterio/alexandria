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
      className="p-1.5 rounded text-[#F0E9DC]/60 hover:text-[#F0E9DC] dark:text-[#E4DDD0]/50 dark:hover:text-[#D4A847]"
      title={`Theme: ${theme}`}
    >
      {theme === "dark" ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : theme === "system" ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
    <header className="relative z-50">
      {/* Torchlight gold accent line */}
      <div className="h-[2px] bg-[#C4943A]" />

      {/* Teal frieze band (light) / Observatory band (dark) */}
      <nav className="bg-[#3D7A7A] dark:bg-[#0F1225] dark:border-b dark:border-[#2A2E45]/60 shadow-[inset_0_-2px_6px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <Link href="/library">
            <span className="font-serif text-[1.35rem] tracking-[0.2em] font-medium uppercase text-[#F0E9DC] dark:text-[#D4A847]">
              Alexandria
            </span>
          </Link>

          <div className="flex items-center gap-7">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              if (item.disabled) {
                return (
                  <span
                    key={item.href}
                    className="uppercase text-[11px] tracking-[0.15em] font-medium text-[#F0E9DC]/25 dark:text-[#8A8599]/30 cursor-not-allowed"
                  >
                    {item.label}
                  </span>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`uppercase text-[11px] tracking-[0.15em] font-medium pb-0.5 ${
                    isActive
                      ? "text-[#C4943A] border-b-2 border-[#C4943A]"
                      : "text-[#F0E9DC]/70 dark:text-[#E4DDD0]/55 hover:text-[#F0E9DC] dark:hover:text-[#E4DDD0]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="w-px h-4 bg-[#F0E9DC]/15 dark:bg-[#2A2E45]" />
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </header>
  );
}

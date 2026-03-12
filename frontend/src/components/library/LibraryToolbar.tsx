"use client";

import { useLibraryStore, type SortField } from "@/stores/library.store";

export function LibraryToolbar() {
  const {
    searchQuery,
    setSearchQuery,
    sortField,
    setSortField,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
  } = useLibraryStore();

  const selectClass =
    "rounded border border-border/60 bg-input-bg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground appearance-none cursor-pointer";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search the archive..."
          className="w-full rounded border border-border/60 bg-input-bg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Sort */}
      <select
        value={sortField}
        onChange={(e) => setSortField(e.target.value as SortField)}
        className={selectClass}
      >
        <option value="date">Date</option>
        <option value="title">Title</option>
        <option value="author">Author</option>
      </select>

      {/* Type filter */}
      <select
        value={filterType || ""}
        onChange={(e) => setFilterType(e.target.value || null)}
        className={selectClass}
      >
        <option value="">All Types</option>
        <option value="paper">Paper</option>
        <option value="book">Book</option>
        <option value="article">Article</option>
        <option value="note">Note</option>
        <option value="other">Other</option>
      </select>

      {/* Status filter */}
      <select
        value={filterStatus || ""}
        onChange={(e) => setFilterStatus(e.target.value || null)}
        className={selectClass}
      >
        <option value="">All Status</option>
        <option value="completed">Completed</option>
        <option value="processing">Processing</option>
        <option value="failed">Failed</option>
        <option value="pending">Pending</option>
      </select>
    </div>
  );
}

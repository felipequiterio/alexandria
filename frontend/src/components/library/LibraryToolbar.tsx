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

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search documents..."
        className="flex-1 min-w-[200px] rounded border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <select
        value={sortField}
        onChange={(e) => setSortField(e.target.value as SortField)}
        className="rounded border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="date">Sort by Date</option>
        <option value="title">Sort by Title</option>
        <option value="author">Sort by Author</option>
      </select>

      <select
        value={filterType || ""}
        onChange={(e) => setFilterType(e.target.value || null)}
        className="rounded border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">All Types</option>
        <option value="paper">Paper</option>
        <option value="book">Book</option>
        <option value="article">Article</option>
        <option value="note">Note</option>
        <option value="other">Other</option>
      </select>

      <select
        value={filterStatus || ""}
        onChange={(e) => setFilterStatus(e.target.value || null)}
        className="rounded border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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

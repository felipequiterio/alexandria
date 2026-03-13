"use client";

import { ColumnBorder } from "@/components/assets/ColumnBorder";
import { BookSpine } from "@/components/assets/BookSpine";
import { DocumentViewport } from "@/components/layout/DocumentViewport";

export function BookFrame() {
  return (
    <div className="book-frame flex-1">
      <ColumnBorder side="left" />
      <div className="book-content">
        <DocumentViewport />
        <BookSpine />
      </div>
      <ColumnBorder side="right" />
    </div>
  );
}

"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { SourcePill } from "./SourcePill";

/**
 * Pre-processes content to extract [p.N] page references before
 * passing to ReactMarkdown (which would escape the brackets).
 *
 * Splits on page refs, renders them as SourcePill components,
 * and wraps the text segments in ReactMarkdown.
 */
export function MarkdownContent({ content }: { content: string }) {
  const parts = content.split(/(\[p\.\d+\])/g);

  return (
    <div className="markdown-body font-serif leading-relaxed text-sm">
      {parts.map((part, i) => {
        const match = part.match(/^\[p\.(\d+)\]$/);
        if (match) {
          return <SourcePill key={i} page={parseInt(match[1], 10)} />;
        }
        if (!part) return null;
        return (
          <ReactMarkdown
            key={i}
            remarkPlugins={[remarkGfm]}
            components={mdComponents}
          >
            {part}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}

const mdComponents: Components = {
  // Headings
  h1: ({ children }) => (
    <h1 className="text-lg font-serif font-semibold mt-4 mb-2 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-serif font-semibold mt-3 mb-1.5 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-serif font-semibold mt-2.5 mb-1 first:mt-0">
      {children}
    </h3>
  ),

  // Paragraphs
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,

  // Lists
  ul: ({ children }) => (
    <ul className="mb-2 pl-4 list-disc space-y-0.5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 pl-4 list-decimal space-y-0.5 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  // Inline code
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className={`${className} text-[13px]`}>{children}</code>
      );
    }
    return (
      <code className="font-mono text-[12px] bg-primary/10 text-primary px-1 py-0.5 rounded">
        {children}
      </code>
    );
  },

  // Code blocks
  pre: ({ children }) => (
    <pre className="mb-2 p-3 rounded-md bg-surface-desk/80 text-primary-foreground overflow-x-auto text-[13px] font-mono last:mb-0">
      {children}
    </pre>
  ),

  // Block quotes
  blockquote: ({ children }) => (
    <blockquote className="mb-2 pl-3 border-l-2 border-accent/50 text-foreground/70 italic last:mb-0">
      {children}
    </blockquote>
  ),

  // Tables
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-primary/5 border-b border-border">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-2 py-1.5 text-left font-medium">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-2 py-1.5 border-t border-border/30">{children}</td>
  ),

  // Horizontal rule
  hr: () => <hr className="my-3 border-border/40" />,

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-2 hover:text-primary/80"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),

  // Bold / italic
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
};

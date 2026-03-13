"use client";

import { useState } from "react";
import { StarNode } from "@/components/assets/StarNode";

const PLACEHOLDER_NODES = [
  { label: "NEURAL NETWORKS", x: 440, y: 65, size: 6 },
  { label: "BACKPROPAGATION", x: 280, y: 35, size: 4 },
  { label: "GRADIENT DESCENT", x: 620, y: 40, size: 4 },
  { label: "MNIST", x: 350, y: 100, size: 3 },
  { label: "DEEP LEARNING", x: 560, y: 95, size: 5 },
  { label: "ATTENTION", x: 180, y: 80, size: 3.5 },
  { label: "TRANSFORMER", x: 720, y: 75, size: 3.5 },
  { label: "CONVOLUTION", x: 100, y: 50, size: 3 },
  { label: "OPTIMIZATION", x: 800, y: 55, size: 3 },
];

const PLACEHOLDER_EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4],
  [1, 2], [4, 6], [5, 7], [2, 8],
  [5, 0], [6, 4],
];

export function ObservatoryPreview() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="observatory-preview col-span-2">
      {/* Toggle strip */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-star-gold/60 hover:text-star-gold/80 transition-colors"
      >
        <span className="text-[10px] uppercase tracking-[0.14em] font-medium font-serif">
          Knowledge Graph Explorer
        </span>
        <span className="font-serif text-sm tracking-wide">
          The Observatory
        </span>
        <span className="text-[10px] uppercase tracking-[0.14em] font-medium flex items-center gap-1.5">
          Look Up
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </span>
      </button>

      {/* Constellation canvas */}
      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: expanded ? "200px" : "0px" }}
      >
        <div className="relative h-[200px] w-full overflow-hidden">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 900 140"
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0"
          >
            {/* Constellation lines */}
            {PLACEHOLDER_EDGES.map(([a, b], i) => (
              <line
                key={i}
                x1={PLACEHOLDER_NODES[a].x}
                y1={PLACEHOLDER_NODES[a].y}
                x2={PLACEHOLDER_NODES[b].x}
                y2={PLACEHOLDER_NODES[b].y}
                stroke="var(--star-gold)"
                strokeWidth="0.5"
                opacity="0.15"
              />
            ))}
            {/* Star nodes */}
            {PLACEHOLDER_NODES.map((node, i) => (
              <StarNode key={i} {...node} />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

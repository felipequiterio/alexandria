// Precomputed tick mark positions [x1, y1, x2, y2] to avoid
// floating-point hydration mismatches between server and client.
const TICK_MARKS: [number, number, number, number][] = [
  [29.5, 16, 28, 16],       // 0°
  [27.69, 9.25, 26.39, 10], // 30°
  [22.75, 4.31, 22, 5.61],  // 60°
  [9.25, 4.31, 10, 5.61],   // 120°
  [4.31, 9.25, 5.61, 10],   // 150°
  [4.31, 22.75, 5.61, 22],  // 210°
  [9.25, 27.69, 10, 26.39], // 240°
  [22.75, 27.69, 22, 26.39],// 300°
  [27.69, 22.75, 26.39, 22],// 330°
];

export function AtlasCompassIcon({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer ring */}
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      <circle cx="16" cy="16" r="12.5" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />

      {/* Cardinal points — compass star */}
      {/* North */}
      <path d="M16 2.5L17.5 12L16 10L14.5 12Z" fill="currentColor" opacity="0.7" />
      {/* South */}
      <path d="M16 29.5L14.5 20L16 22L17.5 20Z" fill="currentColor" opacity="0.5" />
      {/* East */}
      <path d="M29.5 16L20 14.5L22 16L20 17.5Z" fill="currentColor" opacity="0.5" />
      {/* West */}
      <path d="M2.5 16L12 17.5L10 16L12 14.5Z" fill="currentColor" opacity="0.5" />

      {/* Intercardinal points — smaller */}
      <path d="M25.5 6.5L20 12L22 11Z" fill="currentColor" opacity="0.3" />
      <path d="M6.5 6.5L12 12L11 10Z" fill="currentColor" opacity="0.3" />
      <path d="M25.5 25.5L20 20L22 21Z" fill="currentColor" opacity="0.3" />
      <path d="M6.5 25.5L12 20L10 21Z" fill="currentColor" opacity="0.3" />

      {/* Center circle */}
      <circle cx="16" cy="16" r="3" fill="currentColor" opacity="0.15" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" opacity="0.5" />

      {/* Tick marks around the ring — precomputed to avoid hydration mismatch */}
      {TICK_MARKS.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.25"
        />
      ))}
    </svg>
  );
}

export function StarNode({
  label,
  x,
  y,
  size = 4,
  className = "",
}: {
  label: string;
  x: number;
  y: number;
  size?: number;
  className?: string;
}) {
  return (
    <g className={className}>
      {/* Glow halo */}
      <circle
        cx={x}
        cy={y}
        r={size * 3}
        fill="var(--star-gold)"
        opacity="0.08"
      />
      <circle
        cx={x}
        cy={y}
        r={size * 1.8}
        fill="var(--star-gold)"
        opacity="0.15"
      />
      {/* Core */}
      <circle
        cx={x}
        cy={y}
        r={size}
        fill="var(--star-gold)"
        opacity="0.9"
      />
      <circle
        cx={x}
        cy={y}
        r={size * 0.5}
        fill="#FFF8E8"
        opacity="0.7"
      />
      {/* Label */}
      <text
        x={x}
        y={y + size + 12}
        textAnchor="middle"
        fill="var(--star-gold)"
        fontSize="8"
        fontFamily="var(--font-sans)"
        fontWeight="500"
        letterSpacing="0.08em"
        opacity="0.7"
      >
        {label}
      </text>
    </g>
  );
}

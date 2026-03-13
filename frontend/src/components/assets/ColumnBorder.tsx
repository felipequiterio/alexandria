export function ColumnBorder({
  side = "left",
  className = "",
}: {
  side?: "left" | "right";
  className?: string;
}) {
  const mirror = side === "right" ? "scale(-1, 1)" : undefined;

  return (
    <div
      className={`shrink-0 relative ${className}`}
      style={{ width: "var(--book-border-width)" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 48 600"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: mirror }}
        className="absolute inset-0"
      >
        <defs>
          {/* Wood grain pattern */}
          <pattern id={`grain-${side}`} x="0" y="0" width="48" height="12" patternUnits="userSpaceOnUse">
            <line x1="0" y1="3" x2="48" y2="3" stroke="#3A2010" strokeWidth="0.4" opacity="0.15" />
            <line x1="0" y1="7" x2="48" y2="7.5" stroke="#3A2010" strokeWidth="0.3" opacity="0.1" />
            <line x1="0" y1="10" x2="48" y2="10" stroke="#5A3A20" strokeWidth="0.2" opacity="0.08" />
          </pattern>

          {/* Column shaft gradient */}
          <linearGradient id={`shaft-${side}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3A2518" />
            <stop offset="15%" stopColor="#5C3A28" />
            <stop offset="40%" stopColor="#7A5038" />
            <stop offset="60%" stopColor="#6A4430" />
            <stop offset="85%" stopColor="#5C3A28" />
            <stop offset="100%" stopColor="#3A2518" />
          </linearGradient>

          {/* Capital top gradient — slightly lighter */}
          <linearGradient id={`capital-${side}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4A3020" />
            <stop offset="30%" stopColor="#7A5840" />
            <stop offset="50%" stopColor="#8A6848" />
            <stop offset="70%" stopColor="#7A5840" />
            <stop offset="100%" stopColor="#4A3020" />
          </linearGradient>
        </defs>

        {/* === Capital (top ornament) — ~60px === */}
        {/* Capital base plate */}
        <rect x="2" y="0" width="44" height="8" rx="1" fill={`url(#capital-${side})`} />

        {/* Volute scrolls (simplified) */}
        <ellipse cx="10" cy="14" rx="7" ry="5" fill="none" stroke="#8A6848" strokeWidth="1.2" opacity="0.5" />
        <ellipse cx="38" cy="14" rx="7" ry="5" fill="none" stroke="#8A6848" strokeWidth="1.2" opacity="0.5" />
        <ellipse cx="10" cy="14" rx="4" ry="3" fill="#6A4830" opacity="0.4" />
        <ellipse cx="38" cy="14" rx="4" ry="3" fill="#6A4830" opacity="0.4" />

        {/* Acanthus leaf hints */}
        <path d="M18 10 Q24 22 30 10" fill="none" stroke="#7A5838" strokeWidth="1" opacity="0.4" />
        <path d="M20 12 Q24 20 28 12" fill="none" stroke="#8A6848" strokeWidth="0.8" opacity="0.3" />

        {/* Echinus (curved molding under volutes) */}
        <path d="M4 22 Q24 28 44 22" fill={`url(#capital-${side})`} opacity="0.7" />
        <line x1="4" y1="22" x2="44" y2="22" stroke="#3A2518" strokeWidth="0.5" opacity="0.3" />

        {/* Necking band */}
        <rect x="8" y="26" width="32" height="4" rx="1" fill={`url(#capital-${side})`} opacity="0.8" />
        <line x1="8" y1="26" x2="40" y2="26" stroke="#8A6848" strokeWidth="0.4" opacity="0.3" />
        <line x1="8" y1="30" x2="40" y2="30" stroke="#3A2518" strokeWidth="0.4" opacity="0.4" />

        {/* Astragal (bead molding) */}
        {[12, 18, 24, 30, 36].map((cx) => (
          <circle key={cx} cx={cx} cy="33" r="1.5" fill="#7A5838" opacity="0.35" />
        ))}
        <line x1="8" y1="35" x2="40" y2="35" stroke="#3A2518" strokeWidth="0.5" opacity="0.3" />

        {/* === Shaft (stretches to fill) — from y=40 to y=555 === */}
        <rect x="10" y="40" width="28" height="515" fill={`url(#shaft-${side})`} />
        <rect x="10" y="40" width="28" height="515" fill={`url(#grain-${side})`} />

        {/* Fluting — vertical grooves */}
        {[14, 18, 22, 26, 30, 34].map((x) => (
          <line key={x} x1={x} y1="40" x2={x} y2="555" stroke="#3A2010" strokeWidth="0.6" opacity="0.12" />
        ))}

        {/* Shaft edge highlights */}
        <line x1="10" y1="40" x2="10" y2="555" stroke="#8A6848" strokeWidth="0.5" opacity="0.2" />
        <line x1="38" y1="40" x2="38" y2="555" stroke="#2A1810" strokeWidth="0.5" opacity="0.3" />

        {/* Entasis — subtle narrowing hint via shadow overlay at top/bottom of shaft */}
        <rect x="10" y="40" width="28" height="20" fill="url(#capital-${side})" opacity="0.15" />

        {/* === Base (bottom ornament) — ~45px === */}
        {/* Torus (top ring) */}
        <rect x="8" y="555" width="32" height="5" rx="2" fill={`url(#capital-${side})`} opacity="0.7" />

        {/* Scotia (concave molding) */}
        <path d="M6 563 Q24 558 42 563" fill="#4A3020" opacity="0.5" />

        {/* Lower torus */}
        <rect x="6" y="565" width="36" height="5" rx="2" fill={`url(#shaft-${side})`} opacity="0.8" />

        {/* Plinth (square base) */}
        <rect x="4" y="572" width="40" height="8" rx="1" fill={`url(#capital-${side})`} />
        <rect x="2" y="580" width="44" height="10" rx="1" fill="#3A2518" opacity="0.9" />

        {/* Base highlight lines */}
        <line x1="4" y1="572" x2="44" y2="572" stroke="#8A6848" strokeWidth="0.4" opacity="0.25" />
        <line x1="2" y1="590" x2="46" y2="590" stroke="#2A1810" strokeWidth="0.5" opacity="0.4" />
      </svg>
    </div>
  );
}

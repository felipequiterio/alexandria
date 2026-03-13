export function TempleIcon({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Pediment — triangular top */}
      <path
        d="M14 2L24 10H4L14 2Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Entablature — horizontal beam */}
      <rect x="3" y="10" width="22" height="2" rx="0.5" fill="currentColor" opacity="0.7" />
      {/* Columns — four fluted shafts */}
      <rect x="5" y="12.5" width="2.5" height="11" rx="0.5" fill="currentColor" opacity="0.65" />
      <rect x="10.5" y="12.5" width="2.5" height="11" rx="0.5" fill="currentColor" opacity="0.65" />
      <rect x="15" y="12.5" width="2.5" height="11" rx="0.5" fill="currentColor" opacity="0.65" />
      <rect x="20.5" y="12.5" width="2.5" height="11" rx="0.5" fill="currentColor" opacity="0.65" />
      {/* Column fluting — fine lines */}
      <line x1="6.25" y1="13" x2="6.25" y2="23" stroke="currentColor" strokeWidth="0.3" opacity="0.25" />
      <line x1="11.75" y1="13" x2="11.75" y2="23" stroke="currentColor" strokeWidth="0.3" opacity="0.25" />
      <line x1="16.25" y1="13" x2="16.25" y2="23" stroke="currentColor" strokeWidth="0.3" opacity="0.25" />
      <line x1="21.75" y1="13" x2="21.75" y2="23" stroke="currentColor" strokeWidth="0.3" opacity="0.25" />
      {/* Base — stepped platform */}
      <rect x="2" y="23.5" width="24" height="1.5" rx="0.3" fill="currentColor" opacity="0.6" />
      <rect x="1" y="25.5" width="26" height="1.5" rx="0.3" fill="currentColor" opacity="0.5" />
      {/* Pediment detail — small triangle accent */}
      <path
        d="M14 4.5L18 8.5H10L14 4.5Z"
        fill="currentColor"
        opacity="0.15"
      />
    </svg>
  );
}

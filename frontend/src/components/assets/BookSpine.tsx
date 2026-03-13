export function BookSpine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`book-spine ${className}`}
      style={{ width: "var(--book-spine-width)" }}
      aria-hidden="true"
    />
  );
}

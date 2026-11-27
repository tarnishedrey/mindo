export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 font-bold text-ink" style={{ fontSize: size * 0.8 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="9" fill="var(--color-brand)" />
        <circle cx="12" cy="14" r="5" fill="white" />
        <circle cx="20" cy="18" r="5" fill="var(--color-accent)" />
      </svg>
      mindo
    </span>
  );
}

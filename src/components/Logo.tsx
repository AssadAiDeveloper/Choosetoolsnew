/**
 * Brand logo. The mark is a self-contained SVG so it can be swapped later:
 * replace the <svg> below (or drop an <img src="/logo.svg" />) — the wordmark
 * and layout stay untouched.
 */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect width="48" height="48" rx="12" fill="var(--color-brand-600)" />
      {/* two interlocking convert-arrows = "tools that transform" */}
      <path
        d="M15 20h13l-4-4M33 28H20l4 4"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="38" cy="12" r="3.4" fill="#6ee7c7" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      {!compact && (
        <span className="text-xl font-bold tracking-tight text-ink">
          Choose<span className="text-brand-600">Tools</span>
        </span>
      )}
    </span>
  );
}

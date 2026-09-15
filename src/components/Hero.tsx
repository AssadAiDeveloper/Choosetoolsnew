"use client";

import { useTranslations } from "next-intl";

// Decorative file-type chips — placed in the empty corners of the hero card,
// away from the text, built from the site's own brand tokens.
const FLOATERS = [
  { label: "PDF", top: "4%", left: "3.5%", delay: "0s", tint: "var(--color-cat-pdf)" },
  { label: "XLSX", top: "5%", right: "3.5%", delay: "0.5s", tint: "#0e8a6c" },
  { label: "JPG", bottom: "4%", left: "4.5%", delay: "1.1s", tint: "var(--color-cat-image)" },
  { label: "CSV", bottom: "5%", right: "4.5%", delay: "1.7s", tint: "var(--color-cat-text)" },
  { label: "PNG", top: "38%", left: "-2.5rem", delay: "2.2s", tint: "var(--color-cat-image)" },
];

// Decorative chips inside the mock screenshot window.
const SHOT_CHIPS = [
  { label: "PDF", tint: "var(--color-cat-pdf)" },
  { label: "JPG", tint: "var(--color-cat-image)" },
  { label: "XLSX", tint: "#0e8a6c" },
  { label: "CSV", tint: "var(--color-cat-text)" },
  { label: "PNG", tint: "var(--color-cat-image)" },
];

// Decorative "screenshot" — a mock app window built from the site's own
// brand tokens, floating on the side of the hero (aria-hidden decoration).
function ToolShot() {
  return (
    <div className="hero-shot pointer-events-none hidden w-72 shrink-0 select-none rounded-2xl border border-line bg-white p-3 shadow-2xl shadow-brand-500/10 lg:block">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 px-1 pb-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ms-2 flex-1 truncate rounded-md bg-slate-100 px-2 py-0.5 text-center font-mono text-[10px] text-ink-soft">choosetoolsnew.vercel.app</span>
      </div>
      {/* app body: dropzone with the site's file-type chips */}
      <div className="rounded-xl border-2 border-dashed border-line bg-surface/70 px-5 py-6 text-center">
        <div className="grid grid-cols-3 gap-2">
          {SHOT_CHIPS.map((c) => (
            <span
              key={c.label}
              className="hero-icon flex h-9 items-center justify-center rounded-lg border font-mono text-[10px] font-semibold"
              style={{
                color: c.tint,
                borderColor: `color-mix(in srgb, ${c.tint} 30%, transparent)`,
                background: `color-mix(in srgb, ${c.tint} 6%, white)`,
              }}
            >
              {c.label}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-ink-soft">PDF · JPG · XLSX · CSV · PNG</p>
        <span className="mt-2 inline-block rounded-lg bg-brand-500 px-4 py-1.5 text-[11px] font-medium text-white">Choose file</span>
      </div>
    </div>
  );
}

export function Hero() {
  const t = useTranslations("home");
  const tp = useTranslations("privacy");

  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-line bg-surface px-4 py-16 text-center sm:py-24">
      {/* Animated shimmer / glow drift — calm near-white mint tint, always behind content */}
      <div aria-hidden className="hero-shimmer" />
      <div aria-hidden className="hero-shimmer hero-shimmer--stop" style={{ animationDelay: "-6s" }} />

      {/* Decorative file-type chips in the empty corners of the card */}
      {FLOATERS.map((f) => (
        <span
          key={f.label}
          aria-hidden
          className="floater pointer-events-none absolute hidden select-none rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold backdrop-blur-sm lg:block"
          style={{
            top: f.top,
            bottom: f.bottom,
            left: f.left,
            right: f.right,
            animationDelay: f.delay,
            color: f.tint,
            borderColor: `color-mix(in srgb, ${f.tint} 30%, transparent)`,
            background: `color-mix(in srgb, ${f.tint} 6%, white)`,
          }}
        >
          {f.label}
        </span>
      ))}

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-12 lg:flex-row lg:justify-between lg:items-center lg:text-start">
        <div className="relative max-w-3xl text-center lg:text-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 font-mono text-xs text-brand-700">
            <span className="privacy-dot inline-block h-1.5 w-1.5 rounded-full bg-brand-500" />
            {tp("badge")}
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-ink sm:mb-6 sm:text-5xl lg:mx-0">
            {t("heroTitle")}
          </h1>
          <div className="mx-auto mt-4 max-w-2xl space-y-1 text-lg leading-relaxed text-ink-soft lg:mx-0">
            {(t.raw("heroSub") as string[]).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <ToolShot />
      </div>
    </section>
  );
}
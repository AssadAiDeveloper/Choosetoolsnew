"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CopyButton } from "./TextAreas";
import { PrimaryButton } from "../ToolShell";

/** Unbiased random int in [min, max] using rejection sampling */
function secureRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  const maxValid = Math.floor(0xffffffff / range) * range;
  const buf = new Uint32Array(1);
  let x: number;
  do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= maxValid);
  return min + (x % range);
}

export default function RandomNumber() {
  const t = useTranslations("tool");
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(1);
  const [results, setResults] = useState<number[]>([]);

  const generate = () => {
    const lo = Math.min(min, max), hi = Math.max(min, max);
    setResults(Array.from({ length: count }, () => secureRandomInt(lo, hi)));
  };

  const inputClass = "w-24 rounded-lg border border-line bg-surface px-3 py-2 text-center font-mono outline-none focus:border-brand-500";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input dir="ltr" type="number" value={min} onChange={(e) => setMin(+e.target.value)} className={inputClass} aria-label="min" />
        <span className="text-ink-soft">→</span>
        <input dir="ltr" type="number" value={max} onChange={(e) => setMax(+e.target.value)} className={inputClass} aria-label="max" />
        <label className="flex items-center gap-2 text-sm">
          ×
          <input type="range" min={1} max={20} value={count} onChange={(e) => setCount(+e.target.value)} className="accent-brand-600" />
          <span className="w-6 font-mono text-brand-700">{count}</span>
        </label>
        <PrimaryButton onClick={generate}>{t("generate")}</PrimaryButton>
      </div>
      {results.length > 0 && (
        <div className="flex items-center justify-center gap-4 rounded-card border border-brand-100 bg-brand-50/60 px-5 py-8">
          <span dir="ltr" className="font-mono text-3xl font-bold tracking-wide text-brand-800">
            {results.join("  ·  ")}
          </span>
          <CopyButton text={results.join(", ")} />
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "./TextAreas";

const MAP: [number, string][] = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

function toRoman(n: number): string {
  if (n < 1 || n > 3999) return "";
  let out = "";
  for (const [v, sym] of MAP) while (n >= v) { out += sym; n -= v; }
  return out;
}

function fromRoman(s: string): number | null {
  const roman = s.toUpperCase().trim();
  if (!/^[MDCLXVI]+$/.test(roman)) return null;
  let i = 0, total = 0;
  for (const [v, sym] of MAP) {
    while (roman.startsWith(sym, i)) { total += v; i += sym.length; }
  }
  return i === roman.length && toRoman(total) === roman ? total : null;
}

export default function RomanNumerals() {
  const [input, setInput] = useState("2026");

  const result = useMemo(() => {
    const trimmed = input.trim();
    if (/^\d+$/.test(trimmed)) return toRoman(parseInt(trimmed)) || null;
    const n = fromRoman(trimmed);
    return n === null ? null : String(n);
  }, [input]);

  return (
    <div className="space-y-4">
      <input
        dir="ltr"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoFocus
        placeholder="2026 / MMXXVI"
        className="w-full rounded-card border border-line bg-surface px-5 py-3.5 text-center font-mono text-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      <div className="flex items-center justify-center gap-3 rounded-card border border-brand-100 bg-brand-50/60 px-5 py-6">
        <span dir="ltr" className="font-mono text-2xl font-semibold text-brand-800">{result ?? "—"}</span>
        {result && <CopyButton text={result} />}
      </div>
      <p className="text-center font-mono text-xs text-ink-soft">1 – 3999</p>
    </div>
  );
}

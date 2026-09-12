"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "./TextAreas";

const BASES = [
  { base: 2, label: "BIN" },
  { base: 8, label: "OCT" },
  { base: 10, label: "DEC" },
  { base: 16, label: "HEX" },
];

export default function NumberBase() {
  const [input, setInput] = useState("255");
  const [fromBase, setFromBase] = useState(10);

  const value = useMemo(() => {
    const clean = input.trim().replace(/^0[xbo]/i, "");
    if (!clean) return null;
    const n = parseInt(clean, fromBase);
    return Number.isNaN(n) ? null : n;
  }, [input, fromBase]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          dir="ltr"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-card border border-line bg-surface px-5 py-3 font-mono text-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <select value={fromBase} onChange={(e) => setFromBase(+e.target.value)}
          className="rounded-card border border-line bg-surface px-3 text-sm font-mono">
          {BASES.map((b) => <option key={b.base} value={b.base}>{b.label}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        {BASES.map((b) => {
          const out = value === null ? "—" : value.toString(b.base).toUpperCase();
          return (
            <div key={b.base} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2.5">
              <span className="w-12 shrink-0 font-mono text-xs font-semibold text-brand-700">{b.label}</span>
              <span dir="ltr" className="flex-1 truncate font-mono text-sm">{out}</span>
              {value !== null && <CopyButton text={out} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

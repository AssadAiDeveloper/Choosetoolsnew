"use client";

import { useState } from "react";
import { CopyButton } from "./TextAreas";

const ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;

export default function HashGenerator() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});

  const compute = async (text: string) => {
    setInput(text);
    if (!text) { setHashes({}); return; }
    const data = new TextEncoder().encode(text);
    const out: Record<string, string> = {};
    for (const algo of ALGOS) {
      const buf = await crypto.subtle.digest(algo, data);
      out[algo] = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    setHashes(out);
  };

  return (
    <div className="space-y-4">
      <textarea
        dir="auto"
        value={input}
        onChange={(e) => compute(e.target.value)}
        rows={5}
        autoFocus
        className="w-full resize-y rounded-card border border-line bg-surface p-4 font-mono text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      <div className="space-y-2">
        {ALGOS.map((algo) => (
          <div key={algo} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2.5">
            <span className="w-20 shrink-0 font-mono text-xs font-semibold text-brand-700">{algo}</span>
            <span dir="ltr" className="flex-1 truncate font-mono text-xs text-ink-soft">{hashes[algo] ?? "—"}</span>
            {hashes[algo] && <CopyButton text={hashes[algo]} />}
          </div>
        ))}
      </div>
    </div>
  );
}

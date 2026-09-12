"use client";

import { useState } from "react";
import { InOut } from "./TextAreas";

const OPS = [
  { id: "upper", label: "UPPERCASE", fn: (s: string) => s.toUpperCase() },
  { id: "lower", label: "lowercase", fn: (s: string) => s.toLowerCase() },
  {
    id: "title", label: "Title Case",
    fn: (s: string) => s.replace(/\p{L}[\p{L}\p{M}']*/gu, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()),
  },
  {
    id: "sentence", label: "Sentence case",
    fn: (s: string) => s.toLowerCase().replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, (m) => m.toUpperCase()),
  },
];

export default function CaseConverter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {OPS.map((op) => (
          <button key={op.id} onClick={() => setOutput(op.fn(input))}
            className="rounded-lg border border-line bg-surface px-4 py-2 font-mono text-sm transition hover:border-brand-500 hover:text-brand-700">
            {op.label}
          </button>
        ))}
      </div>
      <InOut input={input} setInput={setInput} output={output} />
    </div>
  );
}

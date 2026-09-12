"use client";

import { useState } from "react";
import { InOut } from "./TextAreas";

export default function UrlEncode() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState(false);

  const run = (fn: (s: string) => string) => {
    try { setOutput(fn(input)); setError(false); }
    catch { setOutput(""); setError(true); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button onClick={() => run(encodeURIComponent)} className="rounded-lg border border-line bg-surface px-4 py-2 font-mono text-sm transition hover:border-brand-500 hover:text-brand-700">Encode →</button>
        <button onClick={() => run(decodeURIComponent)} className="rounded-lg border border-line bg-surface px-4 py-2 font-mono text-sm transition hover:border-brand-500 hover:text-brand-700">← Decode</button>
        {error && <span className="self-center text-sm text-red-600">✕</span>}
      </div>
      <InOut input={input} setInput={setInput} output={output} outputDir="ltr" />
    </div>
  );
}

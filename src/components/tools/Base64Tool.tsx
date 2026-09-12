"use client";

import { useState } from "react";
import { InOut } from "./TextAreas";

function encode(s: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(s)));
}
function decode(s: string): string {
  const bytes = Uint8Array.from(atob(s.trim()), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export default function Base64Tool() {
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
        <button onClick={() => run(encode)} className="rounded-lg border border-line bg-surface px-4 py-2 font-mono text-sm transition hover:border-brand-500 hover:text-brand-700">Encode →</button>
        <button onClick={() => run(decode)} className="rounded-lg border border-line bg-surface px-4 py-2 font-mono text-sm transition hover:border-brand-500 hover:text-brand-700">← Decode</button>
        {error && <span className="self-center text-sm text-red-600">✕</span>}
      </div>
      <InOut input={input} setInput={setInput} output={output} outputDir="ltr" />
    </div>
  );
}

"use client";

import { useState } from "react";
import { InOut } from "./TextAreas";

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const run = (minify: boolean) => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, minify ? 0 : 2));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setOutput("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button onClick={() => run(false)} className="rounded-lg border border-line bg-surface px-4 py-2 font-mono text-sm transition hover:border-brand-500 hover:text-brand-700">Format</button>
        <button onClick={() => run(true)} className="rounded-lg border border-line bg-surface px-4 py-2 font-mono text-sm transition hover:border-brand-500 hover:text-brand-700">Minify</button>
      </div>
      {error && (
        <p dir="ltr" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-mono text-sm text-red-700">{error}</p>
      )}
      <InOut input={input} setInput={setInput} output={output} inputDir="ltr" outputDir="ltr" />
    </div>
  );
}

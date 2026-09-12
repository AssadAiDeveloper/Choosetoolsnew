"use client";

import { useState } from "react";
import { InOut } from "./TextAreas";

export default function BinaryText() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState(false);

  const toBinary = () => {
    const bytes = new TextEncoder().encode(input);
    setOutput([...bytes].map((b) => b.toString(2).padStart(8, "0")).join(" "));
    setError(false);
  };

  const fromBinary = () => {
    try {
      const bytes = input.trim().split(/\s+/).map((chunk) => {
        if (!/^[01]{1,8}$/.test(chunk)) throw new Error("bad");
        return parseInt(chunk, 2);
      });
      setOutput(new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes)));
      setError(false);
    } catch {
      setOutput(""); setError(true);
    }
  };

  const btnClass = "rounded-lg border border-line bg-surface px-4 py-2 font-mono text-sm transition hover:border-brand-500 hover:text-brand-700";

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button className={btnClass} onClick={toBinary}>Text → 01</button>
        <button className={btnClass} onClick={fromBinary}>01 → Text</button>
        {error && <span className="self-center text-sm text-red-600">✕</span>}
      </div>
      <InOut input={input} setInput={setInput} output={output} outputDir="ltr" />
    </div>
  );
}

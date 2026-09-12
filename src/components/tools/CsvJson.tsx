"use client";

import { useState } from "react";
import { InOut } from "./TextAreas";

export default function CsvJson() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const csvToJson = async () => {
    try {
      const Papa = (await import("papaparse")).default;
      const res = Papa.parse(input.trim(), { header: true, skipEmptyLines: true });
      if (res.errors.length) throw new Error(res.errors[0].message);
      setOutput(JSON.stringify(res.data, null, 2));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Parse error");
      setOutput("");
    }
  };

  const jsonToCsv = async () => {
    try {
      const Papa = (await import("papaparse")).default;
      const data = JSON.parse(input);
      setOutput(Papa.unparse(Array.isArray(data) ? data : [data]));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Parse error");
      setOutput("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button onClick={csvToJson} className="rounded-lg border border-line bg-surface px-4 py-2 font-mono text-sm transition hover:border-brand-500 hover:text-brand-700">CSV → JSON</button>
        <button onClick={jsonToCsv} className="rounded-lg border border-line bg-surface px-4 py-2 font-mono text-sm transition hover:border-brand-500 hover:text-brand-700">JSON → CSV</button>
      </div>
      {error && <p dir="ltr" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-mono text-sm text-red-700">{error}</p>}
      <InOut input={input} setInput={setInput} output={output} inputDir="ltr" outputDir="ltr" />
    </div>
  );
}

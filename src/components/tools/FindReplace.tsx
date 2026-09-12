"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { InOut } from "./TextAreas";
import { PrimaryButton } from "../ToolShell";

export default function FindReplace() {
  const locale = useLocale();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const run = () => {
    try {
      const flags = "g" + (caseSensitive ? "" : "i");
      const pattern = useRegex ? find : find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(pattern, flags);
      let n = 0;
      setOutput(input.replace(re, () => { n++; return replace; }));
      setCount(n);
      setError(false);
    } catch {
      setError(true); setCount(null);
    }
  };

  const L = locale === "ar"
    ? { find: "ابحث عن", replace: "استبدل بـ", regex: "Regex", cs: "مطابقة الحالة", run: "استبدال", matches: "استبدال" }
    : locale === "es"
    ? { find: "Buscar", replace: "Reemplazar con", regex: "Regex", cs: "May/min", run: "Reemplazar", matches: "reemplazos" }
    : { find: "Find", replace: "Replace with", regex: "Regex", cs: "Match case", run: "Replace", matches: "replaced" };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-card border border-line bg-surface p-4 sm:grid-cols-2">
        <input dir="auto" value={find} onChange={(e) => setFind(e.target.value)} placeholder={L.find}
          className="rounded-lg border border-line px-3 py-2 font-mono text-sm outline-none focus:border-brand-500" />
        <input dir="auto" value={replace} onChange={(e) => setReplace(e.target.value)} placeholder={L.replace}
          className="rounded-lg border border-line px-3 py-2 font-mono text-sm outline-none focus:border-brand-500" />
        <div className="flex items-center gap-5 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={useRegex} onChange={(e) => setUseRegex(e.target.checked)} className="accent-brand-600" />
            {L.regex}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} className="accent-brand-600" />
            {L.cs}
          </label>
          <PrimaryButton onClick={run} className="ms-auto">{L.run}</PrimaryButton>
        </div>
        {error && <p className="font-mono text-sm text-red-600 sm:col-span-2">✕ regex</p>}
        {count !== null && <p className="font-mono text-sm text-brand-700 sm:col-span-2">{count} {L.matches}</p>}
      </div>
      <InOut input={input} setInput={setInput} output={output} />
    </div>
  );
}

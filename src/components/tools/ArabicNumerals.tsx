"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { InOut } from "./TextAreas";

const EAST = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";

function toWestern(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String(EAST.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d)));
}
function toEastern(s: string): string {
  return toWestern(s).replace(/[0-9]/g, (d) => EAST[+d]);
}

export default function ArabicNumerals() {
  const locale = useLocale();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const l1 = locale === "ar" ? "إلى أرقام إنجليزية" : locale === "es" ? "A occidentales" : "To Western";
  const l2 = locale === "ar" ? "إلى أرقام عربية" : locale === "es" ? "A orientales" : "To Eastern";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button onClick={() => setOutput(toWestern(input))}
          className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium transition hover:border-brand-500 hover:text-brand-700">
          {l1} <span dir="ltr" className="font-mono">٣ → 3</span>
        </button>
        <button onClick={() => setOutput(toEastern(input))}
          className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium transition hover:border-brand-500 hover:text-brand-700">
          {l2} <span dir="ltr" className="font-mono">3 → ٣</span>
        </button>
      </div>
      <InOut input={input} setInput={setInput} output={output} />
    </div>
  );
}

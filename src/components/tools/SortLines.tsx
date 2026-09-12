"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { InOut } from "./TextAreas";

export default function SortLines() {
  const locale = useLocale();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const apply = (fn: (lines: string[]) => string[]) =>
    setOutput(fn(input.split(/\r?\n/).filter((l) => l.trim() !== "")).join("\n"));

  const collator = new Intl.Collator(locale === "ar" ? "ar" : locale === "es" ? "es" : "en");

  const L = locale === "ar"
    ? { az: "أ → ي", za: "ي → أ", len: "حسب الطول", shuffle: "خلط عشوائي" }
    : { az: "A → Z", za: "Z → A", len: locale === "es" ? "Por longitud" : "By length", shuffle: locale === "es" ? "Aleatorio" : "Shuffle" };

  const btnClass = "rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium transition hover:border-brand-500 hover:text-brand-700";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button className={btnClass} onClick={() => apply((l) => [...l].sort(collator.compare))}>{L.az}</button>
        <button className={btnClass} onClick={() => apply((l) => [...l].sort(collator.compare).reverse())}>{L.za}</button>
        <button className={btnClass} onClick={() => apply((l) => [...l].sort((a, b) => a.length - b.length))}>{L.len}</button>
        <button className={btnClass} onClick={() => apply((l) => {
          const arr = [...l];
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
          }
          return arr;
        })}>{L.shuffle}</button>
      </div>
      <InOut input={input} setInput={setInput} output={output} />
    </div>
  );
}

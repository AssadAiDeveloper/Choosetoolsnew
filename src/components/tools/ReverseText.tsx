"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { InOut } from "./TextAreas";

export default function ReverseText() {
  const locale = useLocale();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const L = locale === "ar"
    ? { chars: "عكس الحروف", words: "عكس الكلمات", lines: "عكس الأسطر" }
    : locale === "es"
    ? { chars: "Invertir letras", words: "Invertir palabras", lines: "Invertir líneas" }
    : { chars: "Reverse characters", words: "Reverse words", lines: "Reverse lines" };

  const btnClass = "rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium transition hover:border-brand-500 hover:text-brand-700";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button className={btnClass} onClick={() => setOutput([...input].reverse().join(""))}>{L.chars}</button>
        <button className={btnClass} onClick={() => setOutput(input.split(/\s+/).reverse().join(" "))}>{L.words}</button>
        <button className={btnClass} onClick={() => setOutput(input.split(/\r?\n/).reverse().join("\n"))}>{L.lines}</button>
      </div>
      <InOut input={input} setInput={setInput} output={output} />
    </div>
  );
}

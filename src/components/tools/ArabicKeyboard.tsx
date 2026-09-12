"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { CopyButton } from "./TextAreas";

const ROWS = [
  ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د"],
  ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط"],
  ["ئ", "ء", "ؤ", "ر", "لا", "ى", "ة", "و", "ز", "ظ", "ذ"],
  ["أ", "إ", "آ", "،", "؟", "؛"],
];

export default function ArabicKeyboard() {
  const locale = useLocale();
  const [text, setText] = useState("");

  const L = locale === "ar"
    ? { space: "مسافة", backspace: "حذف", clear: "مسح الكل" }
    : locale === "es"
    ? { space: "Espacio", backspace: "Borrar", clear: "Limpiar" }
    : { space: "Space", backspace: "Backspace", clear: "Clear" };

  const keyClass = "min-w-9 rounded-lg border border-line bg-surface px-2.5 py-2.5 text-lg transition hover:border-brand-500 hover:bg-brand-50 active:scale-95";

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          dir="rtl"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-card border border-line bg-surface p-4 text-xl leading-relaxed outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        {text && <span className="absolute start-3 top-3"><CopyButton text={text} /></span>}
      </div>
      <div dir="rtl" className="space-y-2 rounded-card border border-line bg-paper p-3">
        {ROWS.map((row, i) => (
          <div key={i} className="flex flex-wrap justify-center gap-1.5">
            {row.map((key) => (
              <button key={key} className={keyClass} onClick={() => setText((t) => t + key)}>{key}</button>
            ))}
          </div>
        ))}
        <div className="flex justify-center gap-1.5 pt-1">
          <button className={keyClass + " px-10 text-sm"} onClick={() => setText((t) => t + " ")}>{L.space}</button>
          <button className={keyClass + " px-4 text-sm"} onClick={() => setText((t) => t.slice(0, -1))}>⌫ {L.backspace}</button>
          <button className={keyClass + " px-4 text-sm text-red-600"} onClick={() => setText("")}>{L.clear}</button>
        </div>
      </div>
    </div>
  );
}

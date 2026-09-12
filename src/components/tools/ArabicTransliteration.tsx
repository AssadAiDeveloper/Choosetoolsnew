"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { InOut } from "./TextAreas";
import { PrimaryButton } from "../ToolShell";

const MAP: Record<string, string> = {
  "ا": "a", "أ": "a", "إ": "i", "آ": "aa", "ب": "b", "ت": "t", "ث": "th",
  "ج": "j", "ح": "h", "خ": "kh", "د": "d", "ذ": "dh", "ر": "r", "ز": "z",
  "س": "s", "ش": "sh", "ص": "s", "ض": "d", "ط": "t", "ظ": "z", "ع": "'",
  "غ": "gh", "ف": "f", "ق": "q", "ك": "k", "ل": "l", "م": "m", "ن": "n",
  "ه": "h", "و": "w", "ي": "y", "ى": "a", "ة": "a", "ء": "'", "ئ": "'", "ؤ": "'",
  "َ": "a", "ُ": "u", "ِ": "i", "ّ": "", "ْ": "", "ً": "an", "ٌ": "un", "ٍ": "in",
  "،": ",", "؟": "?", "؛": ";",
};

export default function ArabicTransliteration() {
  const locale = useLocale();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const run = () =>
    setOutput([...input].map((ch) => MAP[ch] ?? ch).join(""));

  const btn = locale === "ar" ? "نقحرة إلى لاتيني" : locale === "es" ? "Transliterar" : "Transliterate";

  return (
    <div className="space-y-4">
      <PrimaryButton onClick={run}>{btn}</PrimaryButton>
      <InOut input={input} setInput={setInput} output={output} inputDir="rtl" outputDir="ltr" />
    </div>
  );
}

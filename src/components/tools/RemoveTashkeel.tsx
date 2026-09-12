"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { InOut } from "./TextAreas";
import { PrimaryButton } from "../ToolShell";

// Harakat: fathatan..sukun (u064B-u0652) + quranic marks subset; tatweel u0640; shadda u0651
const ALL_MARKS = /[\u064B-\u0652\u0670\u0640]/g;
const MARKS_KEEP_SHADDA = /[\u064B-\u0650\u0652\u0670\u0640]/g;

export default function RemoveTashkeel() {
  const locale = useLocale();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [keepShadda, setKeepShadda] = useState(false);

  const label = locale === "ar" ? "الإبقاء على الشدة" : locale === "es" ? "Conservar shadda" : "Keep shadda";
  const btn = locale === "ar" ? "إزالة التشكيل" : locale === "es" ? "Eliminar diacríticos" : "Remove tashkeel";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <PrimaryButton onClick={() => setOutput(input.replace(keepShadda ? MARKS_KEEP_SHADDA : ALL_MARKS, ""))}>
          {btn}
        </PrimaryButton>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={keepShadda} onChange={(e) => setKeepShadda(e.target.checked)} className="accent-brand-600" />
          {label} (ّ)
        </label>
      </div>
      <InOut input={input} setInput={setInput} output={output} inputDir="rtl" outputDir="rtl" />
    </div>
  );
}

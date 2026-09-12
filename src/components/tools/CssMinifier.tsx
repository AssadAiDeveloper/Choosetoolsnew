"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { InOut } from "./TextAreas";
import { PrimaryButton } from "../ToolShell";

function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "") // comments
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

export default function CssMinifier() {
  const locale = useLocale();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [saved, setSaved] = useState<number | null>(null);

  const run = () => {
    const min = minifyCss(input);
    setOutput(min);
    setSaved(input.length ? Math.round((1 - min.length / input.length) * 100) : 0);
  };

  const btn = locale === "ar" ? "تصغير CSS" : locale === "es" ? "Minificar CSS" : "Minify CSS";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <PrimaryButton onClick={run}>{btn}</PrimaryButton>
        {saved !== null && <span className="font-mono text-sm text-brand-700">−{saved}%</span>}
      </div>
      <InOut input={input} setInput={setInput} output={output} inputDir="ltr" outputDir="ltr" />
    </div>
  );
}

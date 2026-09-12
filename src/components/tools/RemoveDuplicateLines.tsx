"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { InOut } from "./TextAreas";
import { PrimaryButton } from "../ToolShell";

export default function RemoveDuplicateLines() {
  const locale = useLocale();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [removed, setRemoved] = useState<number | null>(null);

  const run = () => {
    const lines = input.split(/\r?\n/);
    const seen = new Set<string>();
    const kept = lines.filter((l) => {
      const key = l.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setOutput(kept.join("\n"));
    setRemoved(lines.length - kept.length);
  };

  const label = locale === "ar" ? "سطر مكرر حُذف" : locale === "es" ? "líneas duplicadas eliminadas" : "duplicate lines removed";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <PrimaryButton onClick={run}>{locale === "ar" ? "إزالة التكرار" : locale === "es" ? "Eliminar duplicados" : "Remove duplicates"}</PrimaryButton>
        {removed !== null && (
          <span className="font-mono text-sm text-brand-700">{removed} {label}</span>
        )}
      </div>
      <InOut input={input} setInput={setInput} output={output} />
    </div>
  );
}

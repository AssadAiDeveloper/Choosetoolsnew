"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes } from "@/lib/download";
import { buildXlsx } from "./excelShared";

export default function JsonToExcel() {
  const t = useTranslations("tool");
  const [input, setInput] = useState('[\n  { "name": "Ahmed", "city": "Haarlem" },\n  { "name": "Sara", "city": "Riyadh" }\n]');
  const [stage, setStage] = useState<"edit" | "busy" | "done" | "error">("edit");
  const [out, setOut] = useState<Blob | null>(null);

  const run = async () => {
    setStage("busy");
    try {
      const parsed = JSON.parse(input);
      const data: Record<string, unknown>[] = Array.isArray(parsed) ? parsed : [parsed];
      if (!data.length) throw new Error("empty");
      const headers = [...new Set(data.flatMap((row) => Object.keys(row)))];
      const rows: (string | number | boolean | null)[][] = [
        headers,
        ...data.map((row) => headers.map((h) => {
          const v = row[h];
          if (v === null || v === undefined) return null;
          return typeof v === "object" ? JSON.stringify(v) : (v as string | number | boolean);
        })),
      ];
      setOut(await buildXlsx(rows));
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={() => setStage("edit")} />;
  if (stage === "done" && out)
    return (
      <ResultCard onReset={() => { setOut(null); setStage("edit"); }}>
        <p className="font-mono text-sm text-ink-soft">{formatBytes(out.size)}</p>
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(out, "data.xlsx")}>{t("download")} .xlsx</PrimaryButton>
      </ResultCard>
    );

  return (
    <div className="space-y-4">
      <textarea
        dir="ltr"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={12}
        className="w-full resize-y rounded-card border border-line bg-surface p-4 font-mono text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      <PrimaryButton onClick={run}>{t("run")}</PrimaryButton>
    </div>
  );
}

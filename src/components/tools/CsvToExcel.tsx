"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes, replaceExt } from "@/lib/download";
import { buildXlsx } from "./excelShared";

export default function CsvToExcel() {
  const t = useTranslations("tool");
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [out, setOut] = useState<Blob | null>(null);
  const [name, setName] = useState("data.xlsx");

  const run = async (file: File) => {
    setStage("busy");
    try {
      const Papa = (await import("papaparse")).default;
      const text = await file.text();
      const res = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true });
      if (!res.data.length) throw new Error("empty");
      setOut(await buildXlsx(res.data));
      setName(replaceExt(file.name, "xlsx"));
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={() => setStage("pick")} />;
  if (stage === "done" && out)
    return (
      <ResultCard onReset={() => { setOut(null); setStage("pick"); }}>
        <p className="font-mono text-sm text-ink-soft">{formatBytes(out.size)}</p>
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(out, name)}>{t("download")} .xlsx</PrimaryButton>
      </ResultCard>
    );

  return <FileDropzone accept=".csv,text/csv,.tsv" onFiles={(f) => run(f[0])} />;
}

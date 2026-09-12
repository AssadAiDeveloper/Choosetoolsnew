"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox } from "../ToolShell";
import { CopyButton } from "./TextAreas";
import { downloadBlob, replaceExt } from "@/lib/download";
import { readSheet } from "./excelShared";

export default function ExcelToJson() {
  const t = useTranslations("tool");
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [json, setJson] = useState("");
  const [name, setName] = useState("data.json");

  const run = async (file: File) => {
    setStage("busy");
    try {
      const rows = await readSheet(file);
      if (!rows.length) throw new Error("empty");
      // first row = keys, rest = records
      const headers = rows[0].map((h, i) => String(h ?? `column${i + 1}`));
      const records = rows.slice(1).map((r) =>
        Object.fromEntries(headers.map((h, i) => [h, r[i] ?? null]))
      );
      setJson(JSON.stringify(records, null, 2));
      setName(replaceExt(file.name, "json"));
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={() => setStage("pick")} />;
  if (stage === "done")
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <CopyButton text={json} />
          <button
            onClick={() => downloadBlob(new Blob([json], { type: "application/json" }), name)}
            className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium transition hover:border-brand-500 hover:text-brand-700"
          >
            {t("download")} .json
          </button>
          <button onClick={() => setStage("pick")} className="ms-auto text-sm text-ink-soft hover:text-red-600">✕</button>
        </div>
        <textarea dir="ltr" readOnly value={json} rows={14}
          className="w-full rounded-card border border-brand-100 bg-brand-50/40 p-4 font-mono text-xs leading-relaxed" />
      </div>
    );

  return <FileDropzone accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onFiles={(f) => run(f[0])} />;
}

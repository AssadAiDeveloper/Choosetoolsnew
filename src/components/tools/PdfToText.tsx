"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox } from "../ToolShell";
import { CopyButton } from "./TextAreas";
import { downloadBlob } from "@/lib/download";

export default function PdfToText() {
  const t = useTranslations("tool");
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [text, setText] = useState("");

  const run = async (file: File) => {
    setStage("busy");
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url
      ).toString();
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const parts: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const line = content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        parts.push(line);
      }
      setText(parts.join("\n\n"));
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  const reset = () => { setText(""); setStage("pick"); };

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={reset} />;
  if (stage === "done")
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <CopyButton text={text} />
          <button
            onClick={() => downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), "extracted.txt")}
            className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium transition hover:border-brand-500 hover:text-brand-700"
          >
            {t("download")} .txt
          </button>
          <button onClick={reset} className="ms-auto text-sm text-ink-soft hover:text-red-600">✕</button>
        </div>
        <textarea dir="auto" readOnly value={text} rows={16}
          className="w-full rounded-card border border-brand-100 bg-brand-50/40 p-4 text-sm leading-relaxed" />
      </div>
    );

  return <FileDropzone accept="application/pdf" onFiles={(f) => run(f[0])} />;
}

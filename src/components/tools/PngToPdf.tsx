"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes } from "@/lib/download";

export default function PngToPdf() {
  const t = useTranslations("tool");
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [out, setOut] = useState<Blob | null>(null);

  const run = async () => {
    setStage("busy");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      for (const file of files) {
        const img = await doc.embedPng(await file.arrayBuffer());
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      const bytes = await doc.save();
      setOut(new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" }));
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  const reset = () => { setFiles([]); setOut(null); setStage("pick"); };

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={reset} />;
  if (stage === "done" && out)
    return (
      <ResultCard onReset={reset}>
        <p className="font-mono text-sm text-ink-soft">{formatBytes(out.size)}</p>
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(out, "images.pdf")}>{t("download")}</PrimaryButton>
      </ResultCard>
    );

  return (
    <div className="space-y-4">
      <FileDropzone accept="image/png" multiple onFiles={(f) => setFiles((prev) => [...prev, ...f])} />
      {files.length > 0 && (
        <>
          <ul className="divide-y divide-line rounded-card border border-line bg-surface">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="flex-1 truncate">{f.name}</span>
                <span className="font-mono text-xs text-ink-soft">{formatBytes(f.size)}</span>
                <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-red-500">✕</button>
              </li>
            ))}
          </ul>
          <PrimaryButton onClick={run}>{t("run")}</PrimaryButton>
        </>
      )}
    </div>
  );
}

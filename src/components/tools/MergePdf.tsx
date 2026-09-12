"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes } from "@/lib/download";

type Stage = "pick" | "busy" | "done" | "error";

export default function MergePdf() {
  const t = useTranslations("tool");
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<Stage>("pick");
  const [out, setOut] = useState<Blob | null>(null);

  const move = (i: number, dir: -1 | 1) => {
    setFiles((f) => {
      const copy = [...f];
      const j = i + dir;
      if (j < 0 || j >= copy.length) return copy;
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  const merge = async () => {
    setStage("busy");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const merged = await PDFDocument.create();
      for (const f of files) {
        const src = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const bytes = await merged.save();
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
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(out, "merged.pdf")}>
          {t("download")}
        </PrimaryButton>
      </ResultCard>
    );

  return (
    <div className="space-y-4">
      <FileDropzone accept="application/pdf" multiple onFiles={(f) => setFiles((prev) => [...prev, ...f])} />
      {files.length > 0 && (
        <>
          <ul className="divide-y divide-line rounded-card border border-line bg-surface">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="font-mono text-xs text-ink-soft w-6">{i + 1}.</span>
                <span className="flex-1 truncate">{f.name}</span>
                <span className="font-mono text-xs text-ink-soft">{formatBytes(f.size)}</span>
                <button onClick={() => move(i, -1)} disabled={i === 0} className="px-1.5 text-ink-soft hover:text-brand-700 disabled:opacity-25" aria-label="up">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === files.length - 1} className="px-1.5 text-ink-soft hover:text-brand-700 disabled:opacity-25" aria-label="down">↓</button>
                <button onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} className="px-1.5 text-red-500 hover:text-red-700" aria-label="remove">✕</button>
              </li>
            ))}
          </ul>
          <PrimaryButton disabled={files.length < 2} onClick={merge}>
            {t("run")} ({files.length})
          </PrimaryButton>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes } from "@/lib/download";
import { PdfPreview } from "./PdfPreview";

export type PdfProcessor = (file: File) => Promise<Blob>;

/** Shared shell: pick one PDF -> options -> live preview + download */
export function SinglePdfShell({
  outName,
  process,
  options,
  fileInfo,
  onFilePicked,
  watch = [],
  autoRun = false,
  resultExtra,
}: {
  outName: string;
  process: PdfProcessor;
  options?: ReactNode;
  fileInfo?: (f: File) => ReactNode;
  onFilePicked?: (f: File) => void;
  /** Option state deps to auto-reprocess live when any value changes */
  watch?: unknown[];
  /** Process immediately when a file is picked (no options to tweak) */
  autoRun?: boolean;
  resultExtra?: (original: File, out: Blob) => ReactNode;
}) {
  const t = useTranslations("tool");
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [out, setOut] = useState<Blob | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const live = watch.length > 0;

  const run = async (f?: File) => {
    const target = f ?? file;
    if (!target) return;
    setStage("busy");
    try {
      setOut(await process(target));
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  useEffect(() => {
    if (!live || !file) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void run(); }, 350);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, ...watch]);

  const reset = () => { setFile(null); setOut(null); setStage("pick"); };

  if (live && file)
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-card border border-slate-300 bg-surface px-4 py-3 text-sm">
          <span className="flex-1 truncate font-medium">{file.name}</span>
          <span className="font-mono text-xs text-ink-soft">{formatBytes(file.size)}</span>
          {fileInfo?.(file)}
          <button onClick={reset} className="text-red-500 hover:text-red-700" aria-label="remove">✕</button>
        </div>
        {options}
        {stage === "error" && <ErrorBox onReset={reset} />}
        {out ? (
          <ResultCard onReset={reset}>
            {stage === "busy" && (
              <p dir="ltr" className="my-1 text-xs font-medium text-brand-700">⟳ {t("processing")}…</p>
            )}
            <PdfPreview blob={out} />
            {resultExtra?.(file, out)}
            <p className="font-mono text-sm text-ink-soft">{formatBytes(out.size)}</p>
            <PrimaryButton className="mt-3" onClick={() => downloadBlob(out, outName)}>
              {t("download")}
            </PrimaryButton>
          </ResultCard>
        ) : (
          <Processing />
        )}
      </div>
    );

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={reset} />;
  if (stage === "done" && out && file)
    return (
      <ResultCard onReset={reset}>
        <PdfPreview blob={out} />
        {resultExtra?.(file, out)}
        <p className="font-mono text-sm text-ink-soft">{formatBytes(out.size)}</p>
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(out, outName)}>
          {t("download")}
        </PrimaryButton>
      </ResultCard>
    );

  return (
    <div className="space-y-4">
      {!file && (
        <FileDropzone accept="application/pdf" onFiles={(f) => { setFile(f[0]); onFilePicked?.(f[0]); if (live || autoRun) void run(f[0]); }} />
      )}
      {file && (
        <>
          <div className="flex items-center gap-3 rounded-card border border-slate-300 bg-surface px-4 py-3 text-sm">
            <span className="flex-1 truncate font-medium">{file.name}</span>
            <span className="font-mono text-xs text-ink-soft">{formatBytes(file.size)}</span>
            {fileInfo?.(file)}
            <button onClick={reset} className="text-red-500 hover:text-red-700" aria-label="remove">✕</button>
          </div>
          {options}
          <PrimaryButton onClick={() => run()}>{t("run")}</PrimaryButton>
        </>
      )}
    </div>
  );
}
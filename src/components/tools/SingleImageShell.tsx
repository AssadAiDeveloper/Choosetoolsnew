"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes } from "@/lib/download";

/** Shared shell: pick one image -> options -> process -> live preview + download */
export function SingleImageShell({
  accept,
  outName,
  process,
  options,
  autoRun = false,
  watch = [],
  resultExtra,
}: {
  accept: string;
  outName: (f: File) => string;
  process: (file: File) => Promise<Blob>;
  options?: ReactNode;
  autoRun?: boolean;
  /** Dereferences (option state) that trigger automatic reprocessing of the output when they change */
  watch?: unknown[];
  resultExtra?: (original: File, out: Blob) => ReactNode;
}) {
  const t = useTranslations("tool");
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [out, setOut] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string>("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const live = watch.length > 0;

  const run = async (f: File) => {
    setStage("busy");
    try {
      const result = await process(f);
      setOut(result);
      setUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(result); });
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  // Live mode: re-run whenever watched option state changes (debounced) while a file is loaded
  useEffect(() => {
    if (!live || !file) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void run(file); }, 350);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, ...watch]);

  const revokeAndClear = () => { if (url) URL.revokeObjectURL(url); setUrl(""); };

  const reset = () => {
    revokeAndClear();
    setFile(null); setOut(null); setStage("pick");
  };

  if (live && file)
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-sm">
          <span className="flex-1 truncate font-medium">{file.name}</span>
          <span className="font-mono text-xs text-ink-soft">{formatBytes(file.size)}</span>
          <button onClick={reset} className="text-red-500 hover:text-red-700" aria-label="remove">✕</button>
        </div>
        {options}
        {stage === "error" && <ErrorBox onReset={reset} />}
        {out && url ? (
          <ResultCard onReset={reset}>
            {stage === "busy" && (
              <p dir="ltr" className="my-1 text-xs font-medium text-brand-700">⟳ {t("processing")}…</p>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="result" className="mx-auto mb-4 max-h-64 rounded-lg border border-line bg-surface object-contain" />
            {resultExtra?.(file, out)}
            <p className="font-mono text-sm text-ink-soft">{formatBytes(out.size)}</p>
            <PrimaryButton className="mt-3" onClick={() => downloadBlob(out, outName(file))}>
              {t("download")}
            </PrimaryButton>
          </ResultCard>
        ) : stage === "busy" ? (
          <Processing />
        ) : null}
      </div>
    );

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={reset} />;
  if (stage === "done" && out && file)
    return (
      <ResultCard onReset={reset}>
        {url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={url} alt="result" className="mx-auto mb-4 max-h-64 rounded-lg border border-line bg-surface object-contain" />
        )}
        {resultExtra?.(file, out)}
        <p className="font-mono text-sm text-ink-soft">{formatBytes(out.size)}</p>
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(out, outName(file))}>
          {t("download")}
        </PrimaryButton>
      </ResultCard>
    );

  return (
    <div className="space-y-4">
      {!file && (
        <FileDropzone accept={accept} onFiles={(f) => {
          setFile(f[0]);
          if (autoRun || live) void run(f[0]);
        }} />
      )}
      {file && (
        <>
          <div className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-sm">
            <span className="flex-1 truncate font-medium">{file.name}</span>
            <span className="font-mono text-xs text-ink-soft">{formatBytes(file.size)}</span>
            <button onClick={reset} className="text-red-500 hover:text-red-700" aria-label="remove">✕</button>
          </div>
          {options}
          <PrimaryButton onClick={() => run(file)}>{t("run")}</PrimaryButton>
        </>
      )}
    </div>
  );
}
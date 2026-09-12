"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes } from "@/lib/download";

/** Shared shell: pick one image -> options -> process -> preview + download */
export function SingleImageShell({
  accept,
  outName,
  process,
  options,
  autoRun = false,
  resultExtra,
}: {
  accept: string;
  outName: (f: File) => string;
  process: (file: File) => Promise<Blob>;
  options?: ReactNode;
  autoRun?: boolean;
  resultExtra?: (original: File, out: Blob) => ReactNode;
}) {
  const t = useTranslations("tool");
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [out, setOut] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string>("");

  const run = async (f: File) => {
    setStage("busy");
    try {
      const result = await process(f);
      setOut(result);
      setUrl(URL.createObjectURL(result));
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  const reset = () => {
    if (url) URL.revokeObjectURL(url);
    setFile(null); setOut(null); setUrl(""); setStage("pick");
  };

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
          if (autoRun) run(f[0]);
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

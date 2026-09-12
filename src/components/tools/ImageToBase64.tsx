"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { CopyButton } from "./TextAreas";
import { formatBytes } from "@/lib/download";

export default function ImageToBase64() {
  const t = useTranslations("tool");
  const [result, setResult] = useState<{ dataUrl: string; name: string; size: number } | null>(null);

  const onFiles = (files: File[]) => {
    const f = files[0];
    const reader = new FileReader();
    reader.onload = () => setResult({ dataUrl: reader.result as string, name: f.name, size: f.size });
    reader.readAsDataURL(f);
  };

  if (result)
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-sm">
          <span className="flex-1 truncate font-medium">{result.name}</span>
          <span className="font-mono text-xs text-ink-soft">{formatBytes(result.size)}</span>
          <CopyButton text={result.dataUrl} />
          <button onClick={() => setResult(null)} className="text-red-500" aria-label="reset">✕</button>
        </div>
        <textarea dir="ltr" readOnly value={result.dataUrl} rows={10}
          className="w-full rounded-card border border-brand-100 bg-brand-50/40 p-4 font-mono text-xs" />
        <p className="font-mono text-xs text-ink-soft">
          {"<img src=\"data:...\" /> · CSS: url(data:...)"}
        </p>
      </div>
    );

  return <FileDropzone accept="image/*" onFiles={onFiles} />;
}

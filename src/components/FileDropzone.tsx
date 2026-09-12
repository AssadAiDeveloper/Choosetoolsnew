"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
}

export function FileDropzone({ accept, multiple = false, onFiles }: Props) {
  const t = useTranslations("tool");
  const tp = useTranslations("privacy");
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const handle = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      onFiles(Array.from(list));
    },
    [onFiles]
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files); }}
        className={`w-full rounded-card border-2 border-solid p-10 text-center transition-colors duration-200
          ${over ? "border-brand-600 bg-emerald-50" : "border-slate-300 bg-surface hover:border-brand-600 hover:bg-emerald-50/30"}`}
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-600)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
          </svg>
        </span>
        <span className="mt-4 block text-lg font-semibold">
          {multiple ? t("dropTitle") : t("dropSingle")}
        </span>
        <span className="mt-1 block font-mono text-xs text-ink-soft">{accept}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => { handle(e.target.files); e.target.value = ""; }}
      />
      <p className="mt-3 flex items-center justify-center gap-2 font-mono text-xs text-brand-700">
        <span className="privacy-dot inline-block h-1.5 w-1.5 rounded-full bg-brand-500" />
        {tp("note")}
      </p>
    </div>
  );
}

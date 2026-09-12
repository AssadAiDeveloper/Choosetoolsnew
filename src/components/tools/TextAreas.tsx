"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function CopyButton({ text }: { text: string }) {
  const t = useTranslations("tool");
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      disabled={!text}
      className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium transition hover:border-brand-500 hover:text-brand-700 disabled:opacity-40"
    >
      {copied ? t("copied") : t("copy")}
    </button>
  );
}

export function InOut({
  input,
  setInput,
  output,
  inputDir,
  outputDir,
}: {
  input: string;
  setInput: (v: string) => void;
  output: string;
  inputDir?: "ltr" | "rtl" | "auto";
  outputDir?: "ltr" | "rtl" | "auto";
}) {
  const t = useTranslations("tool");
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-soft">{t("input")}</label>
        <textarea
          dir={inputDir ?? "auto"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={9}
          className="w-full resize-y rounded-card border border-line bg-surface p-4 font-mono text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-ink-soft">{t("output")}</label>
          <CopyButton text={output} />
        </div>
        <textarea
          dir={outputDir ?? "auto"}
          value={output}
          readOnly
          rows={9}
          className="w-full resize-y rounded-card border border-brand-100 bg-brand-50/40 p-4 font-mono text-sm"
        />
      </div>
    </div>
  );
}

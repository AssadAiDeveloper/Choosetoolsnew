"use client";

import { useTranslations } from "next-intl";
import { SinglePdfShell } from "./SinglePdfShell";
import { formatBytes } from "@/lib/download";

export default function CompressPdf() {
  const t = useTranslations("tool");
  return (
    <SinglePdfShell
      outName="compressed.pdf"
      resultExtra={(original, out) => {
        const pct = Math.max(0, Math.round((1 - out.size / original.size) * 100));
        return (
          <p className="text-2xl font-bold text-brand-700">
            {pct}% {t("savings")}
            <span className="mt-1 block font-mono text-xs font-normal text-ink-soft">
              {formatBytes(original.size)} → {formatBytes(out.size)}
            </span>
          </p>
        );
      }}
      process={async (file) => {
        const { PDFDocument } = await import("pdf-lib");
        const doc = await PDFDocument.load(await file.arrayBuffer(), {
          ignoreEncryption: true,
          updateMetadata: false,
        });
        const bytes = await doc.save({ useObjectStreams: true });
        const out = new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
        return out.size < file.size ? out : file;
      }}
    />
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SinglePdfShell } from "./SinglePdfShell";

export default function SplitPdf() {
  const t = useTranslations("tool");
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(1);

  return (
    <SinglePdfShell
      outName="split.pdf"
      options={
        <div className="flex flex-wrap items-end gap-4 rounded-card border border-line bg-surface p-4">
          <label className="text-sm font-medium">
            {t("fromPage")}
            <input type="number" min={1} value={from} onChange={(e) => setFrom(+e.target.value)}
              className="mt-1 block w-28 rounded-lg border border-line px-3 py-2" />
          </label>
          <label className="text-sm font-medium">
            {t("toPage")}
            <input type="number" min={1} value={to} onChange={(e) => setTo(+e.target.value)}
              className="mt-1 block w-28 rounded-lg border border-line px-3 py-2" />
          </label>
        </div>
      }
      process={async (file) => {
        const { PDFDocument } = await import("pdf-lib");
        const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
        const total = src.getPageCount();
        const a = Math.max(1, Math.min(from, to));
        const b = Math.min(total, Math.max(from, to));
        const out = await PDFDocument.create();
        const idx = Array.from({ length: b - a + 1 }, (_, i) => a - 1 + i);
        const pages = await out.copyPages(src, idx);
        pages.forEach((p) => out.addPage(p));
        const bytes = await out.save();
        return new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
      }}
    />
  );
}

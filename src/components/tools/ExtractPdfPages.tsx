"use client";

import { useState } from "react";
import { SinglePdfShell } from "./SinglePdfShell";

/** Parse "1-3, 5, 8-9" into zero-based page indices (bounded by total) */
export function parseRanges(input: string, total: number): number[] {
  const out: number[] = [];
  for (const part of input.split(",")) {
    const m = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) continue;
    const a = parseInt(m[1]), b = m[2] ? parseInt(m[2]) : a;
    for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
      if (i >= 1 && i <= total && !out.includes(i - 1)) out.push(i - 1);
    }
  }
  return out;
}

export default function ExtractPdfPages() {
  const [ranges, setRanges] = useState("1-3");

  return (
    <SinglePdfShell
      outName="extracted.pdf"
      options={
        <div className="rounded-card border border-line bg-surface p-4">
          <input
            dir="ltr"
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
            placeholder="1-3, 5, 8-10"
            className="w-full rounded-lg border border-line px-3 py-2 font-mono outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      }
      process={async (file) => {
        const { PDFDocument } = await import("pdf-lib");
        const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
        const indices = parseRanges(ranges, src.getPageCount());
        if (!indices.length) throw new Error("no pages");
        const doc = await PDFDocument.create();
        const pages = await doc.copyPages(src, indices);
        pages.forEach((p) => doc.addPage(p));
        const bytes = await doc.save();
        return new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
      }}
    />
  );
}

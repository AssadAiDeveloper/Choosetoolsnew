"use client";

import { useState } from "react";
import { SinglePdfShell } from "./SinglePdfShell";

export default function PageNumbersPdf() {
  const [style, setStyle] = useState<"n" | "nOfTotal">("n");

  return (
    <SinglePdfShell
      outName="numbered.pdf"
      watch={[style]}
      options={
        <div className="flex gap-3 rounded-card border border-line bg-surface p-4">
          {([["n", "1, 2, 3"], ["nOfTotal", "1 / 12"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setStyle(id)}
              className={`rounded-lg border px-4 py-2 font-mono text-sm transition
                ${style === id ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line hover:border-brand-500"}`}>
              {label}
            </button>
          ))}
        </div>
      }
      process={async (file) => {
        const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
        const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
        const font = await doc.embedFont(StandardFonts.Helvetica);
        const total = doc.getPageCount();
        doc.getPages().forEach((page, i) => {
          const { width } = page.getSize();
          const label = style === "n" ? String(i + 1) : `${i + 1} / ${total}`;
          const size = 10;
          const w = font.widthOfTextAtSize(label, size);
          page.drawText(label, {
            x: width / 2 - w / 2,
            y: 24,
            size,
            font,
            color: rgb(0.25, 0.25, 0.25),
          });
        });
        const bytes = await doc.save();
        return new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
      }}
    />
  );
}

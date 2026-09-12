"use client";

import { useState } from "react";
import { SinglePdfShell } from "./SinglePdfShell";

export default function CropPdf() {
  const [margin, setMargin] = useState(8);

  return (
    <SinglePdfShell
      outName="cropped.pdf"
      options={
        <div className="rounded-card border border-line bg-surface p-4">
          <label className="flex items-center gap-4 text-sm font-medium">
            <input type="range" min={0} max={30} value={margin}
              onChange={(e) => setMargin(+e.target.value)} className="flex-1 accent-brand-600" />
            <span className="w-14 font-mono text-brand-700">{margin}%</span>
          </label>
        </div>
      }
      process={async (file) => {
        const { PDFDocument } = await import("pdf-lib");
        const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
        for (const page of doc.getPages()) {
          const { width, height } = page.getSize();
          const dx = (width * margin) / 100;
          const dy = (height * margin) / 100;
          page.setCropBox(dx, dy, width - dx * 2, height - dy * 2);
        }
        const bytes = await doc.save();
        return new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
      }}
    />
  );
}

"use client";

import { useState } from "react";
import { SinglePdfShell } from "./SinglePdfShell";

const ANGLES = [90, 180, 270] as const;

export default function RotatePdf() {
  const [angle, setAngle] = useState<(typeof ANGLES)[number]>(90);

  return (
    <SinglePdfShell
      outName="rotated.pdf"
      watch={[angle]}
      options={
        <div className="flex gap-3 rounded-card border border-line bg-surface p-4">
          {ANGLES.map((a) => (
            <button key={a} onClick={() => setAngle(a)}
              className={`rounded-lg border px-4 py-2 font-mono text-sm transition
                ${angle === a ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line hover:border-brand-500"}`}>
              {a}°
            </button>
          ))}
        </div>
      }
      process={async (file) => {
        const { PDFDocument, degrees } = await import("pdf-lib");
        const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
        doc.getPages().forEach((p) => {
          p.setRotation(degrees((p.getRotation().angle + angle) % 360));
        });
        const bytes = await doc.save();
        return new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
      }}
    />
  );
}

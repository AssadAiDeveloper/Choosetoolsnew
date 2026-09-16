"use client";

import { SinglePdfShell } from "./SinglePdfShell";

export default function FlattenPdf() {
  return (
    <SinglePdfShell
      outName="flattened.pdf"
      autoRun
      process={async (file) => {
        const { PDFDocument } = await import("pdf-lib");
        const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
        try {
          const form = doc.getForm();
          form.flatten();
        } catch {
          // no interactive form on this PDF — nothing to flatten, save as-is
        }
        const bytes = await doc.save();
        return new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
      }}
    />
  );
}

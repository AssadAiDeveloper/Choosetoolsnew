"use client";

import { SinglePdfShell } from "./SinglePdfShell";
import { canvasToBlob } from "@/lib/canvas";

export default function GrayscalePdf() {
  return (
    <SinglePdfShell
      outName="grayscale.pdf"
      process={async (file) => {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url
        ).toString();
        const src = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        const { PDFDocument } = await import("pdf-lib");
        const doc = await PDFDocument.create();
        for (let i = 1; i <= src.numPages; i++) {
          const page = await src.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          ctx.filter = "grayscale(1)";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
          const blob = await canvasToBlob(canvas, "image/jpeg", 0.85);
          const img = await doc.embedJpg(await blob.arrayBuffer());
          const p = doc.addPage([viewport.width / 2, viewport.height / 2]);
          p.drawImage(img, { x: 0, y: 0, width: viewport.width / 2, height: viewport.height / 2 });
        }
        const bytes = await doc.save();
        return new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
      }}
    />
  );
}

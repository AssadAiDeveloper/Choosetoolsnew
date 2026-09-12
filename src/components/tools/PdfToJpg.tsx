"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, GhostButton, ResultCard } from "../ToolShell";
import { downloadBlob } from "@/lib/download";
import { canvasToBlob } from "@/lib/canvas";

export default function PdfToJpg() {
  const t = useTranslations("tool");
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [images, setImages] = useState<{ blob: Blob; url: string }[]>([]);

  const run = async (file: File) => {
    setStage("busy");
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const out: { blob: Blob; url: string }[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        const blob = await canvasToBlob(canvas, "image/jpeg", 0.9);
        out.push({ blob, url: URL.createObjectURL(blob) });
      }
      setImages(out);
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  const reset = () => {
    images.forEach((i) => URL.revokeObjectURL(i.url));
    setImages([]);
    setStage("pick");
  };

  const downloadZip = async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    images.forEach((img, i) => zip.file(`page-${i + 1}.jpg`, img.blob));
    downloadBlob(await zip.generateAsync({ type: "blob" }), "pages.zip");
  };

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={reset} />;
  if (stage === "done")
    return (
      <ResultCard onReset={reset}>
        <div className="mb-4 grid max-h-80 grid-cols-3 gap-2 overflow-auto sm:grid-cols-4">
          {images.map((img, i) => (
            <button key={i} onClick={() => downloadBlob(img.blob, `page-${i + 1}.jpg`)}
              className="overflow-hidden rounded-lg border border-line bg-surface transition hover:border-brand-500" title={`page-${i + 1}.jpg`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={`page ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <div className="flex justify-center gap-3">
          <PrimaryButton onClick={downloadZip}>{t("downloadAll")}</PrimaryButton>
          {images.length === 1 && (
            <GhostButton onClick={() => downloadBlob(images[0].blob, "page-1.jpg")}>{t("download")}</GhostButton>
          )}
        </div>
      </ResultCard>
    );

  return <FileDropzone accept="application/pdf" onFiles={(f) => run(f[0])} />;
}

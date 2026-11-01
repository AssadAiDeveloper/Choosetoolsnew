"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes } from "@/lib/download";
import { loadImage } from "@/lib/canvas";
import { resolvePage, pxToPt } from "@/lib/imagePdfLayout.mjs";
import { PdfPreview } from "./PdfPreview";
import { ImagePdfOptions, type ImagePdfOrientation, type ImagePdfPageSize } from "./ImagePdfOptions";

export default function ImagesToPdf() {
  const t = useTranslations("tool");
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [out, setOut] = useState<Blob | null>(null);
  const [orientation, setOrientation] = useState<ImagePdfOrientation>("portrait");
  const [pageSize, setPageSize] = useState<ImagePdfPageSize>("fit");
  const [margin, setMargin] = useState(10);

  const move = (i: number, dir: -1 | 1) => {
    setFiles((f) => {
      const copy = [...f];
      const j = i + dir;
      if (j < 0 || j >= copy.length) return copy;
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  const build = async () => {
    setStage("busy");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const marginPt = pxToPt(margin);
      for (const f of files) {
        const img = await loadImage(f);
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        const { pageW, pageH, image } = resolvePage({
          size: pageSize,
          orientation,
          imgW: canvas.width,
          imgH: canvas.height,
          marginPt,
        });
        const page = doc.addPage([pageW, pageH]);
        const png = await canvasToPng(canvas);
        const pngImage = await doc.embedPng(png);
        page.drawImage(pngImage, image);
      }
      const bytes = await doc.save();
      setOut(new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" }));
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  const canvasToPng = async (canvas: HTMLCanvasElement) => {
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
    if (!blob) throw new Error("png");
    return new Uint8Array(await blob.arrayBuffer());
  };

  const reset = () => { setFiles([]); setOut(null); setStage("pick"); };

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={reset} />;
  if (stage === "done" && out)
    return (
      <ResultCard onReset={reset}>
        <PdfPreview blob={out} />
        <p className="font-mono text-sm text-ink-soft">{files.length} · {formatBytes(out.size)}</p>
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(out, "images.pdf")}>{t("download")}</PrimaryButton>
      </ResultCard>
    );

  return (
    <div className="space-y-4">
      <FileDropzone accept="image/*" multiple onFiles={(f) => setFiles((prev) => [...prev, ...f])} />
      {files.length > 0 && (
        <>
          <ul className="divide-y divide-line rounded-card border border-line bg-surface">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-2 text-sm">
                <span className="font-mono text-xs text-ink-soft w-5">{i + 1}.</span>
                <span className="flex-1 truncate">{f.name}</span>
                <span className="font-mono text-xs text-ink-soft">{formatBytes(f.size)}</span>
                <button onClick={() => move(i, -1)} disabled={i === 0} className="px-1.5 text-ink-soft hover:text-brand-700 disabled:opacity-25">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === files.length - 1} className="px-1.5 text-ink-soft hover:text-brand-700 disabled:opacity-25">↓</button>
                <button onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} className="px-1.5 text-red-500 hover:text-red-700">✕</button>
              </li>
            ))}
          </ul>
          <ImagePdfOptions
            pageSize={pageSize}
            onPageSize={setPageSize}
            orientation={orientation}
            onOrientation={setOrientation}
            margin={margin}
            onMargin={setMargin}
          />
          <PrimaryButton disabled={files.length < 1} onClick={build}>{t("run")} ({files.length})</PrimaryButton>
        </>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes } from "@/lib/download";
import { loadImage } from "@/lib/canvas";
import { PdfPreview } from "./PdfPreview";

export default function ImagesToPdf() {
  const t = useTranslations("tool");
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [out, setOut] = useState<Blob | null>(null);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [pageSize, setPageSize] = useState<string>("fit");
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
      for (const f of files) {
        const img = await loadImage(f);
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        let page;
        const mm = margin / 2.835; // px margin -> pt
        if (pageSize === "a4") {
          const a4w = 595.28, a4h = 841.89;
          page = orientation === "portrait"
            ? doc.addPage([a4w, a4h])
            : doc.addPage([a4h, a4w]);
        } else {
          const w = canvas.width + mm * 2;
          const h = canvas.height + mm * 2;
          page = doc.addPage([w, h]);
        }
        const pw = page.getWidth() - mm * 2;
        const ph = page.getHeight() - mm * 2;
        let dw = pw, dh = ph;
        const ratio = canvas.width / canvas.height;
        if ((dw / dh) > ratio) dw = dh * ratio; else dh = dw / ratio;
        const x = (page.getWidth() - dw) / 2;
        const y = (page.getHeight() - dh) / 2;
        const png = await canvasToPng(canvas);
        const pngImage = await doc.embedPng(png);
        page.drawImage(pngImage, { x, y, width: dw, height: dh });
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
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">{t("format")}</span>
              <select value={pageSize} onChange={(e) => setPageSize(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500">
                <option value="fit">Fit to image</option>
                <option value="a4">A4</option>
              </select>
            </label>
            {pageSize === "a4" && (
              <label className="block">
                <span className="mb-1 block text-xs text-ink-soft">Page</span>
                <select value={orientation} onChange={(e) => setOrientation(e.target.value as "portrait" | "landscape")}
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500">
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </label>
            )}
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">Margin (px)</span>
              <input type="number" min={0} max={60} value={margin} onChange={(e) => setMargin(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500" />
            </label>
          </div>
          <PrimaryButton disabled={files.length < 1} onClick={build}>{t("run")} ({files.length})</PrimaryButton>
        </>
      )}
    </div>
  );
}

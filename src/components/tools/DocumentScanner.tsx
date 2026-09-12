"use client";

import { useRef, useState } from "react";
import { useLocale } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { PrimaryButton, GhostButton } from "../ToolShell";
import { downloadBlob } from "@/lib/download";

export default function DocumentScanner() {
  const locale = useLocale();
  const L =
    locale === "ar"
      ? { brightness: "السطوع", contrast: "التباين", bw: "أبيض وأسود", png: "تنزيل PNG", pdf: "حفظ كـ PDF", newPhoto: "صورة جديدة" }
      : locale === "es"
      ? { brightness: "Brillo", contrast: "Contraste", bw: "Blanco y negro", png: "Descargar PNG", pdf: "Guardar como PDF", newPhoto: "Nueva foto" }
      : { brightness: "Brightness", contrast: "Contrast", bw: "Black & white", png: "Download PNG", pdf: "Save as PDF", newPhoto: "New photo" };

  const [img, setImg] = useState<string>("");
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(30);
  const [grayscale, setGrayscale] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const applyFilter = (imgEl: HTMLImageElement) => {
    const canvas = canvasRef.current!;
    canvas.width = imgEl.naturalWidth;
    canvas.height = imgEl.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.filter = `brightness(${1 + brightness / 100}) contrast(${1 + contrast / 100})${grayscale ? " grayscale(100%)" : ""}`;
    ctx.drawImage(imgEl, 0, 0);
  };

  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImg(reader.result as string);
      requestAnimationFrame(() => {
        const el = new Image();
        el.onload = () => applyFilter(el);
        el.src = reader.result as string;
      });
    };
    reader.readAsDataURL(f);
  };

  const reapply = () => {
    if (!img) return;
    const el = new Image();
    el.onload = () => applyFilter(el);
    el.src = img;
  };

  const download = async (kind: "png" | "pdf") => {
    if (kind === "png") {
      canvasRef.current?.toBlob((b) => b && downloadBlob(b, "scanned.png"), "image/png");
    } else {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const page = doc.addPage();
      const blob = await new Promise<Blob | null>((res) => canvasRef.current?.toBlob(res, "image/jpeg", 0.92));
      if (!blob) throw new Error("blob");
      const imgBytes = await blob.arrayBuffer();
      const jpg = await doc.embedJpg(imgBytes as unknown as Uint8Array);
      const pw = page.getWidth(), ph = page.getHeight();
      const ratio = jpg.width / jpg.height;
      let dw = pw, dh = ph;
      if (dw / dh > ratio) dw = dh * ratio; else dh = dw / ratio;
      page.drawImage(jpg, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
      const bytes = await doc.save();
      downloadBlob(new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" }), "scanned.pdf");
    }
  };

  return (
    <div className="space-y-4">
      {!img && <FileDropzone accept="image/*" onFiles={(f) => onFile(f[0])} />}
      {img && (
        <>
          <div className="overflow-hidden rounded-lg border border-line bg-slate-100 dark:bg-slate-800/60">
            <canvas ref={canvasRef} className="mx-auto max-h-[60vh]" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              {L.brightness}
              <input type="range" min={-100} max={100} value={brightness} onChange={(e) => { setBrightness(Number(e.target.value)); reapply(); }} className="accent-brand-600" />
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              {L.contrast}
              <input type="range" min={-100} max={100} value={contrast} onChange={(e) => { setContrast(Number(e.target.value)); reapply(); }} className="accent-brand-600" />
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={grayscale} onChange={(e) => { setGrayscale(e.target.checked); reapply(); }} className="h-4 w-4 accent-brand-600" />
              {L.bw}
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={() => download("png")}>{L.png}</PrimaryButton>
            <GhostButton onClick={() => download("pdf")}>{L.pdf}</GhostButton>
            <GhostButton onClick={() => { setImg(""); }}>{L.newPhoto}</GhostButton>
          </div>
        </>
      )}
    </div>
  );
}

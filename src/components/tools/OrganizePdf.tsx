"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes } from "@/lib/download";
import { canvasToBlob } from "@/lib/canvas";
import { PdfPreview } from "./PdfPreview";

interface Thumb { index: number; url: string; rotate: number; selected: boolean }

export default function OrganizePdf() {
  const t = useTranslations("tool");
  const [file, setFile] = useState<File | null>(null);
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [stage, setStage] = useState<"pick" | "loading" | "arrange" | "busy" | "done" | "error">("pick");
  const [out, setOut] = useState<Blob | null>(null);

  const load = async (f: File) => {
    setFile(f);
    setStage("loading");
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url
      ).toString();
      const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
      const list: Thumb[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        const blob = await canvasToBlob(canvas, "image/jpeg", 0.6);
        list.push({ index: i - 1, url: URL.createObjectURL(blob), rotate: 0, selected: true });
      }
      setThumbs(list);
      setStage("arrange");
    } catch {
      setStage("error");
    }
  };

  const move = (pos: number, dir: -1 | 1) => {
    setThumbs((arr) => {
      const copy = [...arr];
      const j = pos + dir;
      if (j < 0 || j >= copy.length) return copy;
      [copy[pos], copy[j]] = [copy[j], copy[pos]];
      return copy;
    });
  };

  const toggle = (pos: number) =>
    setThumbs((arr) => arr.map((x, i) => (i === pos ? { ...x, selected: !x.selected } : x)));

  const removeSelected = () =>
    setThumbs((arr) => {
      const keep = arr.filter((x) => x.selected);
      return keep.length ? keep : arr;
    });

  const rotate = (pos: number) =>
    setThumbs((arr) => arr.map((x, i) => (i === pos ? { ...x, rotate: (x.rotate + 90) % 360 } : x)));

  const reverse = () => setThumbs((arr) => [...arr].reverse());

  const apply = async () => {
    if (!file) return;
    setStage("busy");
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const doc = await PDFDocument.create();
      for (const th of thumbs) {
        const [page] = await doc.copyPages(src, [th.index]);
        if (th.rotate) page.setRotation(degrees(th.rotate));
        doc.addPage(page);
      }
      const bytes = await doc.save();
      setOut(new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" }));
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  const reset = () => {
    thumbs.forEach((x) => URL.revokeObjectURL(x.url));
    setThumbs([]); setFile(null); setOut(null); setStage("pick");
  };

  if (stage === "loading" || stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={reset} />;
  if (stage === "done" && out)
    return (
      <ResultCard onReset={reset}>
        <PdfPreview blob={out} />
        <p className="font-mono text-sm text-ink-soft">{thumbs.length} {t("pages")} · {formatBytes(out.size)}</p>
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(out, "organized.pdf")}>{t("download")}</PrimaryButton>
      </ResultCard>
    );
  if (stage === "arrange")
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={reverse} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:border-brand-500">Reverse</button>
          <button onClick={removeSelected} className="rounded-lg border border-red-200 bg-surface px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">Delete selected</button>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {thumbs.map((th, pos) => (
            <figure key={th.index}
              className={`rounded-lg border bg-surface p-2 text-center transition ${th.selected ? "border-line" : "border-red-300 opacity-50"}`}>
              <button onClick={() => toggle(pos)} className="w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={th.url} alt={`page ${th.index + 1}`}
                  className="mx-auto max-h-32 rounded border border-line"
                  style={{ transform: `rotate(${th.rotate}deg)` }} />
              </button>
              <figcaption className="mt-1.5 flex items-center justify-center gap-1.5 font-mono text-xs text-ink-soft">
                <button onClick={() => move(pos, -1)} disabled={pos === 0} className="rounded border border-line px-1.5 hover:border-brand-500 disabled:opacity-25">←</button>
                {th.index + 1}
                <button onClick={() => move(pos, 1)} disabled={pos === thumbs.length - 1} className="rounded border border-line px-1.5 hover:border-brand-500 disabled:opacity-25">→</button>
                <button onClick={() => rotate(pos)} className="rounded border border-line px-1.5 hover:border-brand-500" title="rotate">⟳</button>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="text-xs text-ink-soft">Click a page to select / deselect</p>
        <PrimaryButton onClick={apply}>{t("run")}</PrimaryButton>
      </div>
    );

  return <FileDropzone accept="application/pdf" onFiles={(f) => load(f[0])} />;
}

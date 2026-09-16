"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes } from "@/lib/download";
import { PdfPreview } from "./PdfPreview";

interface Rect { x: number; y: number; w: number; h: number }

export default function PdfRedaction() {
  const t = useTranslations("tool");
  const [keywords, setKeywords] = useState("");
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [out, setOut] = useState<Blob | null>(null);
  const [count, setCount] = useState(0);

  const run = async (file: File) => {
    setStage("busy");
    try {
      const terms = keywords.split(/[,\n]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url
      ).toString();
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;

      const { PDFDocument, rgb } = await import("pdf-lib");
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      let total = 0;

      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const viewport = page.getViewport({ scale: 1 });
        const content = await page.getTextContent();
        const pdfPage = pdf.getPage(p - 1);
        const rects: Rect[] = [];

        for (const item of content.items) {
          const str = "str" in item ? item.str : "";
          if (!str) continue;
          const low = str.toLowerCase();
          const found = terms.find((term) => low.includes(term));
          if (!found) continue;
          const tr = (item as unknown as { transform: number[] }).transform;
          // pdfjs coords: x = tr[4], y from top = tr[5]; height = item.height
          const w = (item as unknown as { width: number }).width;
          const h = (item as unknown as { height: number }).height || 10;
          const x = tr[4];
          const yTop = tr[5];
          // convert to pdf-lib (origin bottom-left, y up), scale 1 = same units
          const pageHeight = viewport.height;
          rects.push({ x, y: pageHeight - yTop - h, w, h: h + 2 });
        }

        for (const r of rects) {
          pdfPage.drawRectangle({
            x: r.x,
            y: r.y,
            width: r.w,
            height: r.h,
            color: rgb(0, 0, 0),
          });
          total++;
        }
      }

      const bytes = await pdf.save();
      setCount(total);
      setOut(new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" }));
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  const reset = () => { setOut(null); setStage("pick"); };

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={reset} />;
  if (stage === "done" && out)
    return (
      <ResultCard onReset={reset}>
        <PdfPreview blob={out} />
        <p className="font-mono text-sm text-ink-soft">{count} term(s) redacted · {formatBytes(out.size)}</p>
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(out, "redacted.pdf")}>{t("download")}</PrimaryButton>
      </ResultCard>
    );

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-line bg-surface p-4">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Search for these words</span>
        <textarea dir="auto" value={keywords} onChange={(e) => setKeywords(e.target.value)} rows={3}
          placeholder="name, card number, phone&#10;separate with commas or lines"
          className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
      </div>
      <FileDropzone accept="application/pdf" onFiles={(f) => run(f[0])} />
      <p className="font-mono text-[11px] text-red-600">Only matching text is blacked out; underlying text is removed on export.</p>
    </div>
  );
}

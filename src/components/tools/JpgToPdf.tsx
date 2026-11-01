"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes } from "@/lib/download";
import { resolvePage, pxToPt } from "@/lib/imagePdfLayout.mjs";
import { PdfPreview } from "./PdfPreview";
import { ImagePdfOptions, type ImagePdfOrientation, type ImagePdfPageSize } from "./ImagePdfOptions";

export default function JpgToPdf() {
  const t = useTranslations("tool");
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [out, setOut] = useState<Blob | null>(null);
  const [pageSize, setPageSize] = useState<ImagePdfPageSize>("fit");
  const [orientation, setOrientation] = useState<ImagePdfOrientation>("portrait");
  const [margin, setMargin] = useState(0);

  const run = async () => {
    setStage("busy");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const marginPt = pxToPt(margin);
      for (const f of files) {
        const bytes = await f.arrayBuffer();
        const img = f.type === "image/png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        const { pageW, pageH, image } = resolvePage({
          size: pageSize,
          orientation,
          imgW: img.width,
          imgH: img.height,
          marginPt,
        });
        const page = doc.addPage([pageW, pageH]);
        page.drawImage(img, image);
      }
      const pdf = await doc.save();
      setOut(new Blob([pdf as unknown as ArrayBuffer], { type: "application/pdf" }));
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  const reset = () => { setFiles([]); setOut(null); setStage("pick"); };

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={reset} />;
  if (stage === "done" && out)
    return (
      <ResultCard onReset={reset}>
        <PdfPreview blob={out} />
        <p className="font-mono text-sm text-ink-soft">{formatBytes(out.size)}</p>
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(out, "images.pdf")}>{t("download")}</PrimaryButton>
      </ResultCard>
    );

  return (
    <div className="space-y-4">
      <FileDropzone accept="image/jpeg,image/png" multiple onFiles={(f) => setFiles((p) => [...p, ...f])} />
      {files.length > 0 && (
        <>
          <ul className="divide-y divide-line rounded-card border border-line bg-surface">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="font-mono text-xs text-ink-soft w-6">{i + 1}.</span>
                <span className="flex-1 truncate">{f.name}</span>
                <button onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} className="text-red-500" aria-label="remove">✕</button>
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
          <PrimaryButton onClick={run}>{t("run")} ({files.length})</PrimaryButton>
        </>
      )}
    </div>
  );
}

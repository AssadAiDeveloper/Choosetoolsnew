"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob } from "@/lib/download";
import { loadImage, canvasToBlob } from "@/lib/canvas";

const SIZES = [16, 32, 48, 180, 192, 512];

export default function FaviconGenerator() {
  const t = useTranslations("tool");
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [zip, setZip] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");

  const run = async (file: File) => {
    setStage("busy");
    try {
      const img = await loadImage(file);
      const JSZip = (await import("jszip")).default;
      const bundle = new JSZip();
      for (const size of SIZES) {
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingQuality = "high";
        const d = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - d) / 2, (img.height - d) / 2, d, d, 0, 0, size, size);
        const blob = await canvasToBlob(canvas, "image/png");
        const name = size === 180 ? "apple-touch-icon.png" : `favicon-${size}x${size}.png`;
        bundle.file(name, blob);
        if (size === 192) setPreview(URL.createObjectURL(blob));
      }
      bundle.file("snippet.html",
        '<link rel="icon" href="/favicon-32x32.png" sizes="32x32">\n' +
        '<link rel="icon" href="/favicon-192x192.png" sizes="192x192">\n' +
        '<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n');
      setZip(await bundle.generateAsync({ type: "blob" }));
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  const reset = () => { if (preview) URL.revokeObjectURL(preview); setPreview(""); setZip(null); setStage("pick"); };

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={reset} />;
  if (stage === "done" && zip)
    return (
      <ResultCard onReset={reset}>
        {preview && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={preview} alt="favicon preview" className="mx-auto mb-3 h-16 w-16 rounded-xl border border-line bg-surface" />
        )}
        <p className="font-mono text-xs text-ink-soft">16 · 32 · 48 · 180 · 192 · 512 px + HTML snippet</p>
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(zip, "favicons.zip")}>
          {t("downloadAll")}
        </PrimaryButton>
      </ResultCard>
    );

  return <FileDropzone accept="image/png,image/jpeg,image/webp,image/svg+xml" onFiles={(f) => run(f[0])} />;
}

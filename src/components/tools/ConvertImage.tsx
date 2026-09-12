"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SingleImageShell } from "./SingleImageShell";
import { loadImage, canvasToBlob } from "@/lib/canvas";
import { replaceExt } from "@/lib/download";

const FORMATS = [
  { label: "JPG", mime: "image/jpeg", ext: "jpg" },
  { label: "PNG", mime: "image/png", ext: "png" },
  { label: "WebP", mime: "image/webp", ext: "webp" },
];

export default function ConvertImage() {
  const t = useTranslations("tool");
  const [fmt, setFmt] = useState(FORMATS[2]);

  return (
    <SingleImageShell
      accept="image/jpeg,image/png,image/webp"
      outName={(f) => replaceExt(f.name, fmt.ext)}
      options={
        <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-4">
          <span className="text-sm font-medium">{t("format")}:</span>
          {FORMATS.map((f) => (
            <button key={f.ext} onClick={() => setFmt(f)}
              className={`rounded-lg border px-4 py-2 font-mono text-sm transition
                ${fmt.ext === f.ext ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line hover:border-brand-500"}`}>
              {f.label}
            </button>
          ))}
        </div>
      }
      process={async (file) => {
        const img = await loadImage(file);
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        if (fmt.mime === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        return canvasToBlob(canvas, fmt.mime, 0.92);
      }}
    />
  );
}

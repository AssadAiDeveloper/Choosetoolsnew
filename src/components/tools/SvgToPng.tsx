"use client";

import { useState } from "react";
import { SingleImageShell } from "./SingleImageShell";
import { canvasToBlob } from "@/lib/canvas";
import { replaceExt } from "@/lib/download";

export default function SvgToPng() {
  const [scale, setScale] = useState(2);

  return (
    <SingleImageShell
      accept=".svg,image/svg+xml"
      outName={(f) => replaceExt(f.name, "png")}
      options={
        <div className="flex gap-3 rounded-card border border-line bg-surface p-4">
          {[1, 2, 4, 8].map((s) => (
            <button key={s} onClick={() => setScale(s)}
              className={`rounded-lg border px-4 py-2 font-mono text-sm transition
                ${scale === s ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line hover:border-brand-500"}`}>
              {s}×
            </button>
          ))}
        </div>
      }
      process={async (file) => {
        const text = await file.text();
        const svgBlob = new Blob([text], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        try {
          const img = await new Promise<HTMLImageElement>((res, rej) => {
            const i = new Image();
            i.onload = () => res(i);
            i.onerror = () => rej(new Error("bad svg"));
            i.src = url;
          });
          const w = (img.naturalWidth || 512) * scale;
          const h = (img.naturalHeight || 512) * scale;
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
          return await canvasToBlob(canvas, "image/png");
        } finally {
          URL.revokeObjectURL(url);
        }
      }}
    />
  );
}

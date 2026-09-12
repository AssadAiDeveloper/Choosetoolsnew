"use client";

import { useState } from "react";
import { SingleImageShell } from "./SingleImageShell";
import { loadImage, canvasToBlob } from "@/lib/canvas";

const RATIOS = [
  { id: "1:1", w: 1, h: 1 },
  { id: "4:3", w: 4, h: 3 },
  { id: "3:4", w: 3, h: 4 },
  { id: "16:9", w: 16, h: 9 },
  { id: "9:16", w: 9, h: 16 },
];

export default function CropImage() {
  const [ratio, setRatio] = useState(RATIOS[0]);

  return (
    <SingleImageShell
      accept="image/jpeg,image/png,image/webp"
      outName={(f) => "cropped-" + f.name}
      options={
        <div className="flex flex-wrap gap-3 rounded-card border border-line bg-surface p-4">
          {RATIOS.map((r) => (
            <button key={r.id} onClick={() => setRatio(r)}
              className={`rounded-lg border px-4 py-2 font-mono text-sm transition
                ${ratio.id === r.id ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line hover:border-brand-500"}`}>
              {r.id}
            </button>
          ))}
        </div>
      }
      process={async (file) => {
        const img = await loadImage(file);
        const target = ratio.w / ratio.h;
        let cw = img.width, ch = Math.round(img.width / target);
        if (ch > img.height) { ch = img.height; cw = Math.round(img.height * target); }
        const sx = Math.round((img.width - cw) / 2);
        const sy = Math.round((img.height - ch) / 2);
        const canvas = document.createElement("canvas");
        canvas.width = cw; canvas.height = ch;
        canvas.getContext("2d")!.drawImage(img, sx, sy, cw, ch, 0, 0, cw, ch);
        const type = file.type === "image/png" ? "image/png" : file.type;
        return canvasToBlob(canvas, type, 0.95);
      }}
    />
  );
}

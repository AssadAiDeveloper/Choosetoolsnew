"use client";

import { useState } from "react";
import { SingleImageShell } from "./SingleImageShell";
import { loadImage, canvasToBlob } from "@/lib/canvas";

export default function PixelateImage() {
  const [level, setLevel] = useState(12);

  return (
    <SingleImageShell
      accept="image/jpeg,image/png,image/webp"
      outName={(f) => "pixelated-" + f.name}
      watch={[level]}
      options={
        <div className="rounded-card border border-line bg-surface p-4">
          <label className="flex items-center gap-4 text-sm font-medium">
            <input type="range" min={4} max={40} value={level}
              onChange={(e) => setLevel(+e.target.value)} className="flex-1 accent-brand-600" />
            <span className="w-10 font-mono text-brand-700">{level}</span>
          </label>
        </div>
      }
      process={async (file) => {
        const img = await loadImage(file);
        const small = document.createElement("canvas");
        small.width = Math.max(1, Math.round(img.width / level));
        small.height = Math.max(1, Math.round(img.height / level));
        small.getContext("2d")!.drawImage(img, 0, 0, small.width, small.height);
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = false; // hard pixel edges
        ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
        const type = file.type === "image/png" ? "image/png" : file.type;
        return canvasToBlob(canvas, type, 0.92);
      }}
    />
  );
}

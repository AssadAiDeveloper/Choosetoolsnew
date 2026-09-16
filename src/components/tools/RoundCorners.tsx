"use client";

import { useState } from "react";
import { SingleImageShell } from "./SingleImageShell";
import { loadImage, canvasToBlob } from "@/lib/canvas";
import { replaceExt } from "@/lib/download";

export default function RoundCorners() {
  const [radius, setRadius] = useState(24);

  return (
    <SingleImageShell
      accept="image/jpeg,image/png,image/webp"
      outName={(f) => replaceExt("rounded-" + f.name, "png")}
      watch={[radius]}
      options={
        <div className="rounded-card border border-line bg-surface p-4">
          <label className="flex items-center gap-4 text-sm font-medium">
            <input type="range" min={4} max={50} value={radius}
              onChange={(e) => setRadius(+e.target.value)} className="flex-1 accent-brand-600" />
            <span className="w-12 font-mono text-brand-700">{radius}%</span>
          </label>
        </div>
      }
      process={async (file) => {
        const img = await loadImage(file);
        const r = (Math.min(img.width, img.height) / 2) * (radius / 50);
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.beginPath();
        ctx.roundRect(0, 0, img.width, img.height, r);
        ctx.clip();
        ctx.drawImage(img, 0, 0);
        return canvasToBlob(canvas, "image/png"); // PNG keeps corner transparency
      }}
    />
  );
}

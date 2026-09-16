"use client";

import { useState } from "react";
import { SingleImageShell } from "./SingleImageShell";
import { loadImage, canvasToBlob } from "@/lib/canvas";

export default function BlurImage() {
  const [amount, setAmount] = useState(8);

  return (
    <SingleImageShell
      accept="image/jpeg,image/png,image/webp"
      outName={(f) => "blurred-" + f.name}
      watch={[amount]}
      options={
        <div className="rounded-card border border-line bg-surface p-4">
          <label className="flex items-center gap-4 text-sm font-medium">
            Blur
            <input type="range" min={1} max={40} value={amount}
              onChange={(e) => setAmount(+e.target.value)} className="flex-1 accent-brand-600" />
            <span className="w-14 font-mono text-brand-700">{amount}px</span>
          </label>
        </div>
      }
      process={async (file) => {
        const img = await loadImage(file);
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.filter = `blur(${amount}px)`;
        ctx.drawImage(img, 0, 0);
        const type = file.type === "image/png" ? "image/png" : file.type;
        return canvasToBlob(canvas, type, 0.92);
      }}
    />
  );
}

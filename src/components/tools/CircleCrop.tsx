"use client";

import { SingleImageShell } from "./SingleImageShell";
import { loadImage, canvasToBlob } from "@/lib/canvas";
import { replaceExt } from "@/lib/download";

export default function CircleCrop() {
  return (
    <SingleImageShell
      accept="image/jpeg,image/png,image/webp"
      autoRun
      outName={(f) => replaceExt("circle-" + f.name, "png")}
      process={async (file) => {
        const img = await loadImage(file);
        const d = Math.min(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = d; canvas.height = d;
        const ctx = canvas.getContext("2d")!;
        ctx.beginPath();
        ctx.arc(d / 2, d / 2, d / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, (img.width - d) / 2, (img.height - d) / 2, d, d, 0, 0, d, d);
        return canvasToBlob(canvas, "image/png"); // PNG keeps the transparent corners
      }}
    />
  );
}

"use client";

import { SingleImageShell } from "./SingleImageShell";
import { loadImage, canvasToBlob } from "@/lib/canvas";
import { replaceExt } from "@/lib/download";

export default function WebpToJpg() {
  return (
    <SingleImageShell
      accept="image/webp"
      autoRun
      outName={(f) => replaceExt(f.name, "jpg")}
      process={async (file) => {
        const img = await loadImage(file);
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        return canvasToBlob(canvas, "image/jpeg", 0.92);
      }}
    />
  );
}

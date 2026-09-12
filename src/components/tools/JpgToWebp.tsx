"use client";

import { SingleImageShell } from "./SingleImageShell";
import { loadImage, canvasToBlob } from "@/lib/canvas";
import { replaceExt } from "@/lib/download";

export default function JpgToWebp() {
  return (
    <SingleImageShell
      accept="image/jpeg,image/png"
      autoRun
      outName={(f) => replaceExt(f.name, "webp")}
      process={async (file) => {
        const img = await loadImage(file);
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        return canvasToBlob(canvas, "image/webp", 0.88);
      }}
    />
  );
}

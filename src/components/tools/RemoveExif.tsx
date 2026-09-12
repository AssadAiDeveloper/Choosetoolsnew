"use client";

import { SingleImageShell } from "./SingleImageShell";
import { loadImage, canvasToBlob } from "@/lib/canvas";

export default function RemoveExif() {
  return (
    <SingleImageShell
      accept="image/jpeg,image/png,image/webp"
      autoRun
      outName={(f) => "clean-" + f.name}
      process={async (file) => {
        // Re-encoding through a canvas drops every byte of metadata:
        // EXIF, GPS, thumbnails, XMP, IPTC — only pixels survive.
        const img = await loadImage(file);
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        const type = file.type === "image/png" ? "image/png" : "image/jpeg";
        return canvasToBlob(canvas, type, 0.95);
      }}
    />
  );
}

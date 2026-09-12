"use client";

import { useState } from "react";
import { SingleImageShell } from "./SingleImageShell";
import { loadImage, canvasToBlob } from "@/lib/canvas";

export default function FlipImage() {
  const [axis, setAxis] = useState<"h" | "v">("h");

  return (
    <SingleImageShell
      accept="image/jpeg,image/png,image/webp"
      outName={(f) => "flipped-" + f.name}
      options={
        <div className="flex gap-3 rounded-card border border-line bg-surface p-4">
          {([["h", "⇋"], ["v", "⥯"]] as const).map(([id, glyph]) => (
            <button key={id} onClick={() => setAxis(id)}
              className={`rounded-lg border px-5 py-2 text-lg transition
                ${axis === id ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line hover:border-brand-500"}`}>
              {glyph}
            </button>
          ))}
        </div>
      }
      process={async (file) => {
        const img = await loadImage(file);
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        if (axis === "h") { ctx.translate(img.width, 0); ctx.scale(-1, 1); }
        else { ctx.translate(0, img.height); ctx.scale(1, -1); }
        ctx.drawImage(img, 0, 0);
        const type = file.type === "image/png" ? "image/png" : file.type;
        return canvasToBlob(canvas, type, 0.95);
      }}
    />
  );
}

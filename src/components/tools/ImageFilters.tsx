"use client";

import { useState } from "react";
import { SingleImageShell } from "./SingleImageShell";
import { loadImage, canvasToBlob } from "@/lib/canvas";

const FILTERS = [
  { id: "grayscale", css: "grayscale(1)" },
  { id: "sepia", css: "sepia(1)" },
  { id: "invert", css: "invert(1)" },
  { id: "bright", css: "brightness(1.25)" },
  { id: "contrast", css: "contrast(1.35)" },
];

export default function ImageFilters() {
  const [filter, setFilter] = useState(FILTERS[0]);

  return (
    <SingleImageShell
      accept="image/jpeg,image/png,image/webp"
      outName={(f) => filter.id + "-" + f.name}
      watch={[filter.id]}
      options={
        <div className="flex flex-wrap gap-3 rounded-card border border-line bg-surface p-4">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f)}
              className={`rounded-lg border px-4 py-2 font-mono text-sm capitalize transition
                ${filter.id === f.id ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line hover:border-brand-500"}`}>
              {f.id}
            </button>
          ))}
        </div>
      }
      process={async (file) => {
        const img = await loadImage(file);
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.filter = filter.css;
        ctx.drawImage(img, 0, 0);
        const type = file.type === "image/png" ? "image/png" : file.type;
        return canvasToBlob(canvas, type, 0.92);
      }}
    />
  );
}

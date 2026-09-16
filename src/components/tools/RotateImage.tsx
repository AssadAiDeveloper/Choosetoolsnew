"use client";

import { useState } from "react";
import { SingleImageShell } from "./SingleImageShell";
import { loadImage, canvasToBlob } from "@/lib/canvas";

type Op = "cw" | "ccw" | "180" | "flipH" | "flipV";
const OPS: { id: Op; label: string }[] = [
  { id: "cw", label: "↻ 90°" },
  { id: "ccw", label: "↺ 90°" },
  { id: "180", label: "180°" },
  { id: "flipH", label: "⇋" },
  { id: "flipV", label: "⇵" },
];

export default function RotateImage() {
  const [op, setOp] = useState<Op>("cw");

  return (
    <SingleImageShell
      accept="image/jpeg,image/png,image/webp"
      outName={(f) => "rotated-" + f.name}
      watch={[op]}
      options={
        <div className="flex flex-wrap gap-3 rounded-card border border-line bg-surface p-4">
          {OPS.map((o) => (
            <button key={o.id} onClick={() => setOp(o.id)}
              className={`rounded-lg border px-4 py-2 font-mono text-sm transition
                ${op === o.id ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line hover:border-brand-500"}`}>
              {o.label}
            </button>
          ))}
        </div>
      }
      process={async (file) => {
        const img = await loadImage(file);
        const canvas = document.createElement("canvas");
        const swap = op === "cw" || op === "ccw";
        canvas.width = swap ? img.height : img.width;
        canvas.height = swap ? img.width : img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        if (op === "cw") ctx.rotate(Math.PI / 2);
        else if (op === "ccw") ctx.rotate(-Math.PI / 2);
        else if (op === "180") ctx.rotate(Math.PI);
        else if (op === "flipH") ctx.scale(-1, 1);
        else if (op === "flipV") ctx.scale(1, -1);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        const type = file.type === "image/png" ? "image/png" : file.type;
        return canvasToBlob(canvas, type, 0.95);
      }}
    />
  );
}

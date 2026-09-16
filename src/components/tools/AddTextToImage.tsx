"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { SingleImageShell } from "./SingleImageShell";
import { loadImage, canvasToBlob } from "@/lib/canvas";

const POSITIONS = ["top", "center", "bottom"] as const;
type Position = (typeof POSITIONS)[number];

const POS_LABEL: Record<string, Record<Position, string>> = {
  en: { top: "Top", center: "Center", bottom: "Bottom" },
  ar: { top: "أعلى", center: "وسط", bottom: "أسفل" },
  es: { top: "Arriba", center: "Centro", bottom: "Abajo" },
};

export default function AddTextToImage() {
  const locale = useLocale();
  const labels = POS_LABEL[locale] ?? POS_LABEL.en;
  const [text, setText] = useState("");
  const [position, setPosition] = useState<Position>("bottom");
  const [color, setColor] = useState("#ffffff");
  const [size, setSize] = useState(8);

  return (
    <SingleImageShell
      accept="image/jpeg,image/png,image/webp"
      outName={(f) => "text-" + f.name}
      watch={[text, position, color, size]}
      options={
        <div className="space-y-3 rounded-card border border-line bg-surface p-4">
          <input
            dir="auto"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={80}
            placeholder="…"
            className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <div className="flex flex-wrap items-center gap-3">
            {POSITIONS.map((p) => (
              <button key={p} onClick={() => setPosition(p)}
                className={`rounded-lg border px-3.5 py-1.5 text-sm transition
                  ${position === p ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line hover:border-brand-500"}`}>
                {labels[p]}
              </button>
            ))}
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded-lg border border-line" aria-label="color" />
            <label className="flex items-center gap-2 text-sm">
              <input type="range" min={4} max={16} value={size}
                onChange={(e) => setSize(+e.target.value)} className="accent-brand-600" />
              <span className="w-8 font-mono text-brand-700">{size}%</span>
            </label>
          </div>
        </div>
      }
      process={async (file) => {
        const img = await loadImage(file);
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        if (text.trim()) {
          const px = Math.round((img.height * size) / 100);
          // canvas text uses system fonts — Arabic shaping works natively
          ctx.font = `bold ${px}px "IBM Plex Sans Arabic", system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillStyle = color;
          ctx.strokeStyle = "rgba(0,0,0,0.55)";
          ctx.lineWidth = Math.max(2, px / 14);
          const x = img.width / 2;
          const y = position === "top" ? px * 1.3 : position === "center" ? img.height / 2 + px / 3 : img.height - px * 0.6;
          ctx.strokeText(text, x, y, img.width * 0.94);
          ctx.fillText(text, x, y, img.width * 0.94);
        }
        const type = file.type === "image/png" ? "image/png" : file.type;
        return canvasToBlob(canvas, type, 0.93);
      }}
    />
  );
}

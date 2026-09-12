"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { SingleImageShell } from "./SingleImageShell";
import { loadImage, canvasToBlob } from "@/lib/canvas";

// mm at 300 DPI -> px
const mm = (v: number) => Math.round((v / 25.4) * 300);

const PRESETS = [
  { id: "eu", label: { en: "EU / Schengen 35×45", ar: "الاتحاد الأوروبي / شنغن ٣٥×٤٥", es: "UE / Schengen 35×45" }, w: mm(35), h: mm(45) },
  { id: "sa", label: { en: "Saudi Arabia 40×60", ar: "السعودية ٤٠×٦٠", es: "Arabia Saudí 40×60" }, w: mm(40), h: mm(60) },
  { id: "ae", label: { en: "UAE 43×55", ar: "الإمارات ٤٣×٥٥", es: "EAU 43×55" }, w: mm(43), h: mm(55) },
  { id: "eg", label: { en: "Egypt 40×60", ar: "مصر ٤٠×٦٠", es: "Egipto 40×60" }, w: mm(40), h: mm(60) },
  { id: "us", label: { en: "USA 51×51", ar: "أمريكا ٥١×٥١", es: "EE.UU. 51×51" }, w: mm(51), h: mm(51) },
];

export default function IdPhoto() {
  const locale = (useLocale() as "en" | "ar" | "es") ?? "en";
  const [preset, setPreset] = useState(PRESETS[0]);

  return (
    <SingleImageShell
      accept="image/jpeg,image/png"
      outName={() => `id-photo-${preset.id}.jpg`}
      options={
        <div className="flex flex-wrap gap-2.5 rounded-card border border-line bg-surface p-4">
          {PRESETS.map((p) => (
            <button key={p.id} onClick={() => setPreset(p)}
              className={`rounded-lg border px-3.5 py-2 text-sm transition
                ${preset.id === p.id ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line hover:border-brand-500"}`}>
              {p.label[locale]} <span dir="ltr" className="font-mono text-xs text-ink-soft">mm</span>
            </button>
          ))}
        </div>
      }
      resultExtra={() => (
        <p dir="ltr" className="font-mono text-xs text-ink-soft">{preset.w}×{preset.h}px @ 300 DPI</p>
      )}
      process={async (file) => {
        const img = await loadImage(file);
        const target = preset.w / preset.h;
        let cw = img.width, ch = Math.round(img.width / target);
        if (ch > img.height) { ch = img.height; cw = Math.round(img.height * target); }
        const sx = Math.round((img.width - cw) / 2);
        // bias crop toward the top where the face usually is
        const sy = Math.round((img.height - ch) * 0.25);
        const canvas = document.createElement("canvas");
        canvas.width = preset.w; canvas.height = preset.h;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, sx, sy, cw, ch, 0, 0, preset.w, preset.h);
        return canvasToBlob(canvas, "image/jpeg", 0.95);
      }}
    />
  );
}

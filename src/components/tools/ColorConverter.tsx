"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "./TextAreas";

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export default function ColorConverter() {
  const [hex, setHex] = useState("#0e8a6c");

  const { rgb, hsl, valid } = useMemo(() => {
    const parsed = hexToRgb(hex);
    if (!parsed) return { rgb: "", hsl: "", valid: false };
    const [r, g, b] = parsed;
    const [h, s, l] = rgbToHsl(r, g, b);
    return { rgb: `rgb(${r}, ${g}, ${b})`, hsl: `hsl(${h}, ${s}%, ${l}%)`, valid: true };
  }, [hex]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="color" value={valid ? hex : "#000000"} onChange={(e) => setHex(e.target.value)}
          className="h-14 w-16 cursor-pointer rounded-card border border-line" aria-label="pick" />
        <input
          dir="ltr"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          className="flex-1 rounded-card border border-line bg-surface px-4 py-3 font-mono text-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>
      {valid && (
        <div className="space-y-2">
          {[["HEX", hex.startsWith("#") ? hex : "#" + hex], ["RGB", rgb], ["HSL", hsl]].map(([label, val]) => (
            <div key={label} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2.5">
              <span className="w-10 shrink-0 font-mono text-xs font-semibold text-brand-700">{label}</span>
              <span dir="ltr" className="flex-1 font-mono text-sm">{val}</span>
              <CopyButton text={val} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

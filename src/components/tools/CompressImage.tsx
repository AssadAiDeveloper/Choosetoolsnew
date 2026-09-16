"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SingleImageShell } from "./SingleImageShell";
import { formatBytes } from "@/lib/download";

export default function CompressImage() {
  const t = useTranslations("tool");
  const [quality, setQuality] = useState(70);

  return (
    <SingleImageShell
      accept="image/jpeg,image/png,image/webp"
      outName={(f) => "compressed-" + f.name}
      watch={[quality]}
      options={
        <div className="rounded-card border border-line bg-surface p-4">
          <label className="flex items-center gap-4 text-sm font-medium">
            {t("quality")}
            <input type="range" min={20} max={95} value={quality}
              onChange={(e) => setQuality(+e.target.value)} className="flex-1 accent-brand-600" />
            <span className="w-12 font-mono text-brand-700">{quality}%</span>
          </label>
        </div>
      }
      resultExtra={(original, out) => {
        const pct = Math.max(0, Math.round((1 - out.size / original.size) * 100));
        return (
          <p className="text-2xl font-bold text-brand-700">
            {pct}% {t("savings")}
            <span className="mt-1 block font-mono text-xs font-normal text-ink-soft">
              {formatBytes(original.size)} → {formatBytes(out.size)}
            </span>
          </p>
        );
      }}
      process={async (file) => {
        const imageCompression = (await import("browser-image-compression")).default;
        const out = await imageCompression(file, {
          initialQuality: quality / 100,
          useWebWorker: true,
          maxIteration: 10,
        });
        return out.size < file.size ? out : file;
      }}
    />
  );
}

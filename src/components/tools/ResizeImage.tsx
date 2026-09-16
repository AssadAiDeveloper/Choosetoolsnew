"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { SingleImageShell } from "./SingleImageShell";
import { loadImage, canvasToBlob } from "@/lib/canvas";

export default function ResizeImage() {
  const t = useTranslations("tool");
  const [w, setW] = useState<string>("");
  const [h, setH] = useState<string>("");
  const [lock, setLock] = useState(true);
  const ratio = useRef(1);

  const onW = (v: string) => {
    setW(v);
    if (lock && v) setH(String(Math.round(+v / ratio.current)));
  };
  const onH = (v: string) => {
    setH(v);
    if (lock && v) setW(String(Math.round(+v * ratio.current)));
  };

  return (
    <SingleImageShell
      accept="image/jpeg,image/png,image/webp"
      outName={(f) => "resized-" + f.name}
      watch={[w, h, lock]}
      options={
        <div className="flex flex-wrap items-end gap-4 rounded-card border border-line bg-surface p-4">
          <label className="text-sm font-medium">
            {t("width")}
            <input dir="ltr" type="number" min={1} value={w} onChange={(e) => onW(e.target.value)}
              className="mt-1 block w-28 rounded-lg border border-line px-3 py-2 font-mono" placeholder="1920" />
          </label>
          <label className="text-sm font-medium">
            {t("height")}
            <input dir="ltr" type="number" min={1} value={h} onChange={(e) => onH(e.target.value)}
              className="mt-1 block w-28 rounded-lg border border-line px-3 py-2 font-mono" placeholder="1080" />
          </label>
          <label className="flex items-center gap-2 pb-2.5 text-sm">
            <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} className="accent-brand-600" />
            {t("keepRatio")}
          </label>
        </div>
      }
      process={async (file) => {
        const img = await loadImage(file);
        ratio.current = img.width / img.height;
        const tw = +w || img.width;
        const th = +h || Math.round(tw / ratio.current);
        const canvas = document.createElement("canvas");
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, tw, th);
        const type = file.type === "image/png" ? "image/png" : file.type;
        return canvasToBlob(canvas, type, 0.92);
      }}
    />
  );
}

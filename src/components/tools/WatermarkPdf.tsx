"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { SinglePdfShell } from "./SinglePdfShell";

type Mode = "text" | "image";
// 0..8 = top-left, top-center, top-right, mid-left, center, mid-right, bottom-left, bottom-center, bottom-right
const POSITIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export default function WatermarkPdf() {
  const locale = useLocale();
  const L = useMemo(() => (locale === "ar" ? {
    text: "علامة مائية نصية", image: "علامة مائية صورة / شعار",
    textLabel: "النص", textPlaceholder: "مثال: CONFIDENTIAL أو سرّي",
    imageLabel: "صورة الشعار", imagePlaceholder: "اختر صورة PNG أو JPG",
    changeImage: "تغيير الصورة", removeImage: "إزالة الصورة",
    position: "المكان", size: "الحجم", rotation: "الزاوية", opacity: "الشفافية", color: "اللون",
    pos0: "أعلى يسار", pos1: "أعلى وسط", pos2: "أعلى يمين",
    pos3: "وسط يسار", pos4: "المنتصف", pos5: "وسط يمين",
    pos6: "أسفل يسار", pos7: "أسفل وسط", pos8: "أسفل يمين",
    sizeHint: "نسبة من عرض الصفحة", preview: "معاينة حية",
  } : {
    text: "Text watermark", image: "Image / logo watermark",
    textLabel: "Text", textPlaceholder: "e.g. CONFIDENTIAL",
    imageLabel: "Logo image", imagePlaceholder: "Choose a PNG or JPG image",
    changeImage: "Change image", removeImage: "Remove image",
    position: "Position", size: "Size", rotation: "Rotation", opacity: "Opacity", color: "Color",
    pos0: "Top left", pos1: "Top center", pos2: "Top right",
    pos3: "Middle left", pos4: "Center", pos5: "Middle right",
    pos6: "Bottom left", pos7: "Bottom center", pos8: "Bottom right",
    sizeHint: "% of page width", preview: "Live preview",
  }), [locale]);

  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("CONFIDENTIAL");
  const [color, setColor] = useState("#404040");
  const [position, setPosition] = useState(1);
  const [size, setSize] = useState(35); // % of page width
  const [rotation, setRotation] = useState(0); // degrees, 0 = none
  const [opacity, setOpacity] = useState(25); // 0-100
  const [logo, setLogo] = useState<string | null>(null); // data URL
  const fileRef = useRef<HTMLInputElement>(null);

  const positionLabels = [
    L.pos0, L.pos1, L.pos2,
    L.pos3, L.pos4, L.pos5,
    L.pos6, L.pos7, L.pos8,
  ];

  const onLogoFile = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(f);
  };

  const col = position % 3;
  const row = Math.floor(position / 3);
  const posX = col === 0 ? 5 : col === 1 ? 50 : 95;
  const posY = row === 0 ? 5 : row === 1 ? 50 : 95;
  const tx = col === 1 ? "-50%" : col === 2 ? "-100%" : "0";
  const ty = row === 1 ? "-50%" : row === 2 ? "-100%" : "0";

  const slider = (label: string, val: number, min: number, max: number, suffix: string, set: (n: number) => void) => (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      <span className="flex items-center justify-between">
        <span>{label}</span>
        <span className="font-mono text-xs text-brand-700">{val}{suffix}</span>
      </span>
      <input type="range" min={min} max={max} value={val}
        onChange={(e) => set(+e.target.value)} className="accent-brand-600" />
    </label>
  );

  return (
    <SinglePdfShell
      outName="watermarked.pdf"
      watch={[mode, text, color, position, size, rotation, opacity, logo]}
      options={
        <div className="space-y-4 rounded-card border border-slate-300 bg-surface p-4">
          {/* Live preview */}
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">{L.preview}</span>
            <div className="relative mx-auto aspect-[210/297] w-52 select-none overflow-hidden rounded-lg border border-slate-300 bg-white shadow-inner">
              {mode === "text" ? (
                <span
                  aria-hidden
                  className="absolute max-w-[90%] overflow-hidden whitespace-nowrap font-bold"
                  style={{
                    top: `${posY}%`,
                    left: `${posX}%`,
                    transform: `translate(${tx}, ${ty}) rotate(${rotation}deg)`,
                    transformOrigin: "center",
                    color,
                    opacity: opacity / 100,
                    fontSize: `${Math.max(5, (size / 100) * 37)}px`,
                  }}
                >
                  {text || " "}
                </span>
              ) : logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  aria-hidden
                  src={logo}
                  alt=""
                  className="absolute object-contain"
                  style={{
                    top: `${posY}%`,
                    left: `${posX}%`,
                    transform: `translate(${tx}, ${ty}) rotate(${rotation}deg)`,
                    transformOrigin: "center",
                    opacity: opacity / 100,
                    width: `${size}%`,
                  }}
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-slate-300">
                  {L.imagePlaceholder}
                </span>
              )}
            </div>
          </div>

          {/* Text / Image toggle */}
          <div className="flex gap-2">
            {(["text", "image"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition
                  ${mode === m ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600 hover:border-brand-500"}`}>
                {m === "text" ? L.text : L.image}
              </button>
            ))}
          </div>

          {/* Content */}
          {mode === "text" ? (
            <div className="space-y-4">
              <div>
                <span className="mb-1 block text-sm font-medium text-slate-700">{L.textLabel}</span>
                <input
                  dir="auto"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={80}
                  placeholder={L.textPlaceholder}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <span>{L.color}</span>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded border border-slate-300 bg-transparent p-1" />
              </label>
            </div>
          ) : (
            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">{L.imageLabel}</span>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={(e) => { onLogoFile(e.target.files?.[0]); e.target.value = ""; }} />
              {logo ? (
                <div className="flex items-center gap-3 rounded-lg border border-slate-300 bg-slate-50 p-3">
                  <img src={logo} alt="logo" className="h-16 w-16 rounded object-contain" />
                  <div className="flex flex-col gap-2">
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="text-sm font-medium text-brand-700 hover:text-brand-800">{L.changeImage}</button>
                    <button type="button" onClick={() => setLogo(null)}
                      className="text-sm font-medium text-red-600 hover:text-red-700">{L.removeImage}</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed border-slate-300 bg-surface px-4 py-6 text-sm text-slate-500 transition hover:border-brand-500 hover:bg-emerald-50/30 hover:text-brand-700">
                  {L.imagePlaceholder}
                </button>
              )}
            </div>
          )}

          {/* Position grid */}
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">{L.position}</span>
            <div className="grid w-32 grid-cols-3 gap-1.5">
              {POSITIONS.map((p) => (
                <button key={p} type="button" onClick={() => setPosition(p)} aria-label={positionLabels[p]}
                  className={`aspect-square rounded border transition
                    ${position === p ? "border-brand-600 bg-brand-50" : "border-slate-300 hover:border-brand-500"}`}>
                  <span className={`mx-auto block h-1.5 w-1.5 rounded-full ${position === p ? "bg-brand-600" : "bg-slate-400"}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          {slider(L.size, size, 10, 90, "%", setSize)}
          {slider(L.rotation, rotation, -90, 90, "°", setRotation)}
          {slider(L.opacity, opacity, 5, 100, "%", setOpacity)}

          <p className="font-mono text-xs text-slate-500">{L.sizeHint}</p>
        </div>
      }
      process={async (file) => {
        const { PDFDocument, StandardFonts, rgb, degrees } = await import("pdf-lib");
        const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });

        let img: { w: number; h: number; draw: (page: any, x: number, y: number, w: number, h: number) => void } | null = null;
        if (mode === "image" && logo) {
          const data = logo.split(",")[1]!;
          const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
          const isPng = logo.includes("image/png");
          const embedded = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
          img = {
            w: embedded.width,
            h: embedded.height,
            draw: (page, x, y, w, h) => page.drawImage(embedded, { x, y, width: w, height: h, opacity: opacity / 100, rotate: degrees(rotation) }),
          };
        }

        const font = await doc.embedFont(StandardFonts.HelveticaBold);
        const colorRgb = rgb(
          parseInt(color.slice(1, 3), 16) / 255,
          parseInt(color.slice(3, 5), 16) / 255,
          parseInt(color.slice(5, 7), 16) / 255,
        );

        for (const page of doc.getPages()) {
          const { width, height } = page.getSize();
          const pad = 40;

          if (logo && img) {
            const ratio = img.h / img.w;
            const finalW = Math.min((size / 100) * width, width - pad * 2);
            const finalH = finalW * ratio;
            const pos = posXY(position, width, height, pad, finalW, finalH);
            img.draw(page, pos.x, pos.y, finalW, finalH);
          } else {
            const t = text || " ";
            const fontSize = (size / 100) * Math.min(width, height) * 0.18;
            const textWidth = font.widthOfTextAtSize(t, fontSize);
            const maxW = width - pad * 2;
            const scale = textWidth > maxW ? Math.max(maxW / textWidth, 0.05) : 1;
            const finalW = textWidth * scale;
            const finalH = fontSize * scale;
            const pos = posXY(position, width, height, pad, finalW, finalH);
            const rotate = degrees(rotation);
            const flat = rotation === 0;
            page.drawText(t, {
              x: pos.x,
              y: flat ? pos.y + finalH * 0.8 : pos.y + finalH / 2,
              size: fontSize * scale,
              font,
              color: colorRgb,
              opacity: opacity / 100,
              rotate,
            });
          }
        }
        const bytes = await doc.save();
        return new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
      }}
    />
  );

  function posXY(p: number, W: number, H: number, pad: number, w: number, h: number) {
    const col = p % 3;
    const row = Math.floor(p / 3);
    const xPad = pad;
    const yPad = pad;
    const cx = col === 0 ? xPad : col === 1 ? (W - w) / 2 : W - w - xPad;
    const cy = row === 0 ? H - h - yPad : row === 1 ? (H - h) / 2 : yPad;
    return { x: cx, y: cy };
  }
}

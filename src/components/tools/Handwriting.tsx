"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Caveat, Reem_Kufi } from "next/font/google";
import { PrimaryButton } from "../ToolShell";
import { downloadBlob } from "@/lib/download";

// Decorative handwriting-style fonts — loaded only inside this tool, not site-wide.
const latinHand = Caveat({ subsets: ["latin"], weight: "600" });
const arabicHand = Reem_Kufi({ subsets: ["arabic"], weight: "500" });

const PAPER_STYLES = ["lined", "plain", "grid"] as const;
type Paper = (typeof PAPER_STYLES)[number];

export default function Handwriting() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [text, setText] = useState(isRtl ? "مرحباً بك في ChooseTools" : "Hello from ChooseTools");
  const [paper, setPaper] = useState<Paper>("lined");
  const [ink, setInk] = useState("#1d3557");

  const L = isRtl
    ? { placeholder: "اكتب نصك هنا", download: "تنزيل الصورة (PNG)", paper: { lined: "مسطّر", plain: "سادة", grid: "مربّعات" } }
    : locale === "es"
    ? { placeholder: "Escribe tu texto aquí", download: "Descargar imagen (PNG)", paper: { lined: "Rayado", plain: "Liso", grid: "Cuadrícula" } }
    : { placeholder: "Type your text here", download: "Download image (PNG)", paper: { lined: "Lined", plain: "Plain", grid: "Grid" } };

  const fontFamily = isRtl ? arabicHand.style.fontFamily : latinHand.style.fontFamily;
  const fontClass = isRtl ? arabicHand.className : latinHand.className;

  const download = async () => {
    const W = 1240, H = 1754; // A4 @ ~150dpi
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.direction = isRtl ? "rtl" : "ltr";

    ctx.fillStyle = "#fffef8";
    ctx.fillRect(0, 0, W, H);

    if (paper === "lined") {
      ctx.strokeStyle = "#c9d6e3";
      ctx.lineWidth = 1.5;
      for (let y = 140; y < H - 60; y += 70) {
        ctx.beginPath(); ctx.moveTo(50, y); ctx.lineTo(W - 50, y); ctx.stroke();
      }
    } else if (paper === "grid") {
      ctx.strokeStyle = "#dbe4ee";
      ctx.lineWidth = 1;
      for (let x = 50; x < W - 40; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x, H - 60); ctx.stroke();
      }
      for (let y = 60; y < H - 40; y += 40) {
        ctx.beginPath(); ctx.moveTo(50, y); ctx.lineTo(W - 50, y); ctx.stroke();
      }
    }

    ctx.fillStyle = ink;
    ctx.font = `56px "${fontFamily}"`;
    ctx.textAlign = isRtl ? "right" : "left";
    const startX = isRtl ? W - 70 : 70;
    const maxWidth = W - 140;
    const lineHeight = 70;
    let y = 190;

    // Manual word-wrap so long lines break naturally onto the ruled paper
    for (const paragraph of text.split("\n")) {
      const words = paragraph.split(" ");
      let line = "";
      for (const word of words) {
        const test = line ? line + " " + word : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          ctx.fillText(line, startX, y);
          line = word;
          y += lineHeight;
        } else {
          line = test;
        }
      }
      ctx.fillText(line, startX, y);
      y += lineHeight;
    }

    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
    downloadBlob(blob, "handwriting.png");
  };

  return (
    <div className="space-y-4">
      {/* Hidden element forces the decorative font's @font-face to load in the browser */}
      <span className={fontClass} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}>‌</span>

      <textarea
        dir={isRtl ? "rtl" : "ltr"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder={L.placeholder}
        className="w-full resize-y rounded-card border border-line bg-surface p-4 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />

      <div className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-surface p-4">
        <div className="flex gap-2">
          {PAPER_STYLES.map((p) => (
            <button key={p} onClick={() => setPaper(p)}
              className={`rounded-lg border px-3.5 py-1.5 text-sm transition
                ${paper === p ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line hover:border-brand-500"}`}>
              {L.paper[p]}
            </button>
          ))}
        </div>
        <input type="color" value={ink} onChange={(e) => setInk(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-lg border border-line" aria-label="ink color" />
      </div>

      <div
        className="rounded-card border border-line p-8 text-center text-3xl leading-relaxed"
        style={{ background: "#fffef8", color: ink, fontFamily: `"${fontFamily}"` }}
      >
        {text || "…"}
      </div>

      <PrimaryButton onClick={download}>{L.download}</PrimaryButton>
    </div>
  );
}

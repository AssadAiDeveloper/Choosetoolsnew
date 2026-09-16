"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PrimaryButton } from "../ToolShell";

const ACCENT_COLORS = ["#0e8a6c", "#1a1a2e", "#e05555", "#2a6fdb", "#16a34a", "#9333ea", "#0d9488"];

export default function QrWithLogo() {
  const t = useTranslations("tool");
  const [text, setText] = useState("https://");
  const [fg, setFg] = useState("#0e8a6c");
  const [logoData, setLogoData] = useState<string>("");
  const [dataUrl, setDataUrl] = useState("");

  const onLogo = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setLogoData(reader.result as string);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    let live = true;
    const timer = setTimeout(async () => {
      if (!text.trim()) { setDataUrl(""); return; }
      const QRCode = (await import("qrcode")).default;
      const matrix = QRCode.create(text, { errorCorrectionLevel: "H" }).modules;
      const size = matrix.size;
      const scale = 14;
      const quiet = 2;
      const dim = (size + quiet * 2) * scale;
      const canvas = document.createElement("canvas");
      canvas.width = dim;
      canvas.height = dim;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = fg;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (matrix.get(r, c)) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
        }
      }
      // logo
      if (logoData) {
        const img = new Image();
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = logoData; });
        const logoSize = canvas.width * 0.22;
        const lx = (canvas.width - logoSize) / 2;
        const ly = (canvas.height - logoSize) / 2;
        ctx.fillStyle = "#fff";
        ctx.fillRect(lx - 8, ly - 8, logoSize + 16, logoSize + 16);
        ctx.drawImage(img, lx, ly, logoSize, logoSize);
      }
      if (live) setDataUrl(canvas.toDataURL("image/png"));
    }, 250);
    return () => { live = false; clearTimeout(timer); };
  }, [text, fg, logoData]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <textarea dir="auto" value={text} onChange={(e) => setText(e.target.value)} rows={5} autoFocus
          placeholder="https://example.com"
          className="w-full resize-y rounded-card border border-line bg-surface p-4 font-mono text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
        <div>
          <span className="mb-1 block text-xs font-medium text-ink-soft">Color</span>
          <div className="flex flex-wrap items-center gap-2">
            {ACCENT_COLORS.map((c) => (
              <button key={c} onClick={() => setFg(c)}
                className={`h-7 w-7 rounded-full transition ${fg === c ? "ring-2 ring-ink ring-offset-2" : ""}`}
                style={{ background: c }} aria-label={c} />
            ))}
            <input type="color" value={fg} onChange={(e) => setFg(e.target.value)}
              className="h-7 w-9 cursor-pointer rounded border border-line bg-surface p-0.5" />
          </div>
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium text-ink-soft">Logo (optional, center)</span>
          <div className="flex items-center gap-3">
            <button onClick={() => document.getElementById("qr-logo-input")?.click()}
              className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-brand-500">
              {logoData ? "Change logo" : "Upload logo"}
            </button>
            {logoData && (
              <button onClick={() => setLogoData("")} className="text-xs text-red-500 hover:underline">Remove</button>
            )}
            <input id="qr-logo-input" type="file" accept="image/png,image/jpeg"
              className="hidden" onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])} />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface p-6">
        {dataUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt="QR code with logo" className="h-56 w-56 rounded-lg border border-line" />
            <PrimaryButton onClick={() => {
              const a = document.createElement("a");
              a.href = dataUrl;
              a.download = "qr-with-logo.png";
              a.click();
            }}>
              {t("download")} PNG
            </PrimaryButton>
          </>
        ) : (
          <div className="h-56 w-56 rounded-lg border border-dashed border-line opacity-40" />
        )}
      </div>
    </div>
  );
}

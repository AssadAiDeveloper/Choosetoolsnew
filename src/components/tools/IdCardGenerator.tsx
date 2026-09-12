"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PrimaryButton } from "../ToolShell";
import { downloadBlob } from "@/lib/download";

interface IdData {
  name: string;
  title: string;
  hireDate: string;
  idNumber: string;
  company: string;
  photoUrl: string | null;
  logoUrl: string | null;
}

export default function IdCardGenerator() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("tools.id-card-generator.ui");
  const L = {
    name: t("name"), title: t("title"), hireDate: t("hireDate"), idNumber: t("idNumber"),
    company: t("company"), photo: t("photo"), uploadPhoto: t("uploadPhoto"),
    capturePhoto: t("capturePhoto"), cancel: t("cancel"), removePhoto: t("removePhoto"),
    logo: t("logo"), uploadLogo: t("uploadLogo"), removeLogo: t("removeLogo"),
    wmIntensity: t("wmIntensity"), wmSizeLabel: t("wmSizeLabel"), placeholder: t("placeholder"),
    titlePlaceholder: t("titlePlaceholder"), idPlaceholder: t("idPlaceholder"),
    save: t("save"), print: t("print"), reset: t("reset"), hint: t("hint"),
    emptyName: t("emptyName"), scanHint: t("scanHint"), qrName: t("qrName"),
    qrTitle: t("qrTitle"), qrCompany: t("qrCompany"), qrHire: t("qrHire"),
    scanDataLabel: t("scanDataLabel"), employeeId: t("employeeId"), hire: t("hire"),
    color: t("color"), preview: t("preview"), size: t("size"), processing: t("processing"),
    cameraUnsupported: t("cameraUnsupported"), cameraDenied: t("cameraDenied"),
    createInvoice: t("createInvoice"),
  };

  const [data, setData] = useState<IdData>({
    name: "",
    title: "",
    hireDate: "",
    idNumber: "",
    company: "",
    photoUrl: null,
    logoUrl: null,
  });
  const invoiceHref = useMemo(() => {
    const q = new URLSearchParams();
    if (data.company) q.set("fromName", data.company);
    if (data.name) q.set("toName", data.name);
    if (data.title) q.set("toContact", data.title);
    if (data.idNumber) q.set("invoiceNum", data.idNumber);
    if (data.hireDate) q.set("invDate", data.hireDate);
    q.set("lang", locale);
    q.set("src", "idcard");
    const qs = q.toString();
    return `/${locale}/text/invoice-generator${qs ? `?${qs}` : ""}`;
  }, [data, locale]);
  const [primary, setPrimary] = useState("#0e8a6c");
  const [wmOpacity, setWmOpacity] = useState(0.08);
  const [wmSize, setWmSize] = useState(76);
  const [printed, setPrinted] = useState(false);
  const [busy, setBusy] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [barcodeUrl, setBarcodeUrl] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrZoom, setQrZoom] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
    setCameraError(null);
  };

  const openCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      captureInputRef.current?.click();
      return;
    }
    setCameraOpen(true);
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 600 }, height: { ideal: 900 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 600 }, height: { ideal: 900 } },
          audio: false,
        });
      }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera access denied:", err);
      setCameraError(L.cameraDenied);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const DW = 300, DH = 450;
    const canvas = document.createElement("canvas");
    canvas.width = DW; canvas.height = DH;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, DW, DH);
    const scale = Math.max(DW / video.videoWidth, DH / video.videoHeight);
    const sw = DW / scale, sh = DH / scale;
    const sx = (video.videoWidth - sw) / 2, sy = (video.videoHeight - sh) / 2;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, DW, DH);
    setData((d) => ({ ...d, photoUrl: canvas.toDataURL("image/jpeg", 0.9) }));
    closeCamera();
  };

  useEffect(() => {
    if (!qrZoom) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setQrZoom(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [qrZoom]);

  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const hasName = data.name.trim().length > 0;
  const showCard = printed && hasName;
  const companyText = data.company.trim() || "COMPANY";

  useEffect(() => {
    let alive = true;

    if (data.idNumber.trim()) {
      (async () => {
        try {
          let JsBarcode = (window as any).JsBarcode;
          if (!JsBarcode) {
            const m = await import("jsbarcode");
            JsBarcode = (m as any).default || m;
            (window as any).JsBarcode = JsBarcode;
          }
          const barCanvas = document.createElement("canvas");
          (JsBarcode as (e: HTMLCanvasElement, v: string, o: Record<string, unknown>) => void)(barCanvas, data.idNumber, {
            format: "CODE128", displayValue: false, height: 60, margin: 0,
          });
          if (alive) setBarcodeUrl(barCanvas.toDataURL("image/png"));
        } catch { if (alive) setBarcodeUrl(null); }
      })();
    } else {
      setBarcodeUrl(null);
    }

    (async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const url = await QRCode.toDataURL(qrPayload(), { width: 120, margin: 0, errorCorrectionLevel: "M" });
        if (alive) setQrUrl(url);
      } catch { if (alive) setQrUrl(null); }
    })();
    return () => { alive = false; };
  }, [data.idNumber, data.name, data.title, data.company, data.hireDate, isRtl]);

  const input = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500";

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Center-crop to a 4×6 portrait (standard ID photo), flattened on white
        const canvas = document.createElement("canvas");
        const DW = 300, DH = 450;
        canvas.width = DW;
        canvas.height = DH;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, DW, DH);
        const scale = Math.max(DW / img.width, DH / img.height);
        const sw = DW / scale;
        const sh = DH / scale;
        const sx = (img.width - sw) / 2;
        const sy = (img.height - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, DW, DH);
        setData((d) => ({ ...d, photoUrl: canvas.toDataURL("image/jpeg", 0.9) }));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(f);
  };

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Flatten onto a small canvas to normalize size, keeping transparency for the watermark.
        const scale = Math.min(1, 600 / Math.max(img.width, img.height));
        const cw = Math.max(1, Math.round(img.width * scale));
        const ch = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, cw, ch);
        setData((d) => ({ ...d, logoUrl: canvas.toDataURL("image/png") }));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(f);
  };

  const CARD_W = 85.6;
  const CARD_H = 54;

  // Builds a human-readable multi-field payload for the QR code.
  // Name is always the FIRST line so even a truncated scan shows it.
  const qrPayload = () => {
    const n = "\n";
    return [
      `${L.qrName}: ${data.name}`,
      `${L.qrTitle}: ${data.title}`,
      `${L.qrCompany}: ${data.company}`,
      `${L.qrHire}: ${data.hireDate}`,
      `${L.employeeId}: ${data.idNumber}`,
    ]
      .filter((line) => line.split(": ")[1] !== "")
      .join(n);
  };

  // Renders the full card onto a canvas with barcode + QR, then exports as PDF.
  const buildPdf = async () => {
    setBusy(true);
    try {
      const dpi = 300;
      const W = Math.round((CARD_W / 25.4) * dpi);
      const H = Math.round((CARD_H / 25.4) * dpi);
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      const padX = W * 0.04;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);

      // ── Header band ────────────────────────────────────────────────
      const headerH = H * 0.24;
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, W, headerH);

      // Company name — larger, bolder, perfectly centered (both axes)
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${Math.round(H * 0.06)}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(companyText, W / 2, headerH * 0.52);

      // ── Watermark — company logo or name, perfectly centered ──────
      const bodyTop = headerH;
      const bodyBottom = H;
      ctx.save();
      ctx.translate(W / 2, (bodyTop + bodyBottom) / 2);
      ctx.globalAlpha = wmOpacity;
      const wmScale = wmSize / 76;
      if (data.logoUrl) {
        const logo = await loadImage(data.logoUrl);
        const logoMax = H * 0.5 * wmScale;
        const ls = Math.min(logoMax / logo.width, logoMax / logo.height);
        const lw = logo.width * ls;
        const lh = logo.height * ls;
        ctx.drawImage(logo, -lw / 2, -lh / 2, lw, lh);
      } else {
        ctx.fillStyle = primary;
        ctx.font = `800 ${Math.round(H * 0.16 * wmScale)}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(companyText, 0, 0);
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      // ── Photo (tall 4×6 portrait, rounded slot, bigger) ────────────
      const photoH = H * 0.53 * 0.94;
      const photoW = photoH / 1.5;
      const photoRadius = photoW * 0.12;
      const photoX = isRtl ? W - padX - photoW : padX;
      const photoY = headerH + (H * 0.53 - photoH) / 2;
      const roundRectPath = (px: number, py: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(px + r, py);
        ctx.arcTo(px + w, py, px + w, py + h, r);
        ctx.arcTo(px + w, py + h, px, py + h, r);
        ctx.arcTo(px, py + h, px, py, r);
        ctx.arcTo(px, py, px + w, py, r);
        ctx.closePath();
      };
      if (data.photoUrl) {
        const img = await loadImage(data.photoUrl);
        const target = photoW / photoH;
        const iw = img.width, ih = img.height;
        const iA = iw / ih;
        let sw = iw, sh = ih, sx = 0, sy = 0;
        if (iA > target) { sw = ih * target; sx = (iw - sw) / 2; }
        else { sh = iw / target; sy = (ih - sh) / 2; }
        ctx.save();
        roundRectPath(photoX, photoY, photoW, photoH, photoRadius);
        ctx.clip();
        ctx.drawImage(img, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
        ctx.restore();
        roundRectPath(photoX, photoY, photoW, photoH, photoRadius);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        roundRectPath(photoX, photoY, photoW, photoH, photoRadius);
        ctx.fillStyle = "#e2e8f0";
        ctx.fill();
        roundRectPath(photoX, photoY, photoW, photoH, photoRadius);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // ── Text details ───────────────────────────────────────────────
      const textX = isRtl ? padX : photoX + photoW + W * 0.07;
      const textAreaW = W - textX - padX - (isRtl ? photoW + W * 0.05 : 0);
      ctx.textAlign = isRtl ? "right" : "left";
      ctx.textBaseline = "alphabetic";

      // Name — larger for balance
      ctx.fillStyle = "#111827";
      ctx.font = `800 ${Math.round(H * 0.058)}px Arial, sans-serif`;
      ctx.fillText(data.name || L.name, textX, photoY + H * 0.15, textAreaW);

      // Job title — larger for balance
      ctx.fillStyle = primary;
      ctx.font = `700 ${Math.round(H * 0.042)}px Arial, sans-serif`;
      ctx.fillText(data.title || L.title, textX, photoY + H * 0.235, textAreaW);

      // Divider
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(textX, photoY + H * 0.28);
      ctx.lineTo(textX + textAreaW, photoY + H * 0.28);
      ctx.stroke();

      // Labels — darker, medium-heavy for legibility
      const labelY = photoY + H * 0.31;
      ctx.fillStyle = "#475569";
      ctx.font = `600 ${Math.round(H * 0.026)}px Arial, sans-serif`;
      ctx.fillText(L.employeeId, textX, labelY, textAreaW);
      ctx.fillStyle = "#111827";
      ctx.font = `700 ${Math.round(H * 0.034)}px Arial, sans-serif`;
      ctx.fillText(data.idNumber || "—", textX, labelY + H * 0.055, textAreaW);

      ctx.fillStyle = "#475569";
      ctx.font = `600 ${Math.round(H * 0.026)}px Arial, sans-serif`;
      ctx.fillText(L.hire, textX, labelY + H * 0.115, textAreaW);
      ctx.fillStyle = "#111827";
      ctx.font = `700 ${Math.round(H * 0.034)}px Arial, sans-serif`;
      ctx.fillText(data.hireDate || "—", textX, labelY + H * 0.17, textAreaW);

      // ── Company logo — full color, centered directly above the QR code ──
      if (data.logoUrl) {
        const blogo = await loadImage(data.logoUrl);
        const qrSize = H * 0.24;
        const qrTop = H - H * 0.035 - qrSize;
        const qrCenterX = isRtl ? padX + qrSize / 2 : W - padX - qrSize / 2;
        const bMaxH = H * 0.53 * 0.48;
        const bMaxW = W * 0.34;
        const bls = Math.min(bMaxW / blogo.width, bMaxH / blogo.height);
        const blw = blogo.width * bls;
        const blh = blogo.height * bls;
        const blx = qrCenterX - blw / 2;
        const bly = qrTop - blh - H * 0.005;
        ctx.drawImage(blogo, blx, bly, blw, blh);
      }

      // ── Barcode + QR (balanced bottom strip) ──────────────────────
      const barH = H * 0.15;
      const barW = W * 0.42;
      const barX = isRtl ? W - padX - barW : padX;
      const barY = H - barH - H * 0.03;
      if (data.idNumber) {
        const barcode = await renderBarcode(data.idNumber);
        const scale = Math.min(barW / barcode.width, barH / barcode.height);
        const dw = barcode.width * scale;
        const dh = barcode.height * scale;
        ctx.drawImage(barcode, barX, barY + (barH - dh) / 2, dw, dh);
      }

      try {
        const QRCode = (await import("qrcode")).default;
        const qrPayloadStr = qrPayload();
        const qrUrl = await QRCode.toDataURL(qrPayloadStr, { width: 160, margin: 0, errorCorrectionLevel: "M" });
        const qrImg = await loadImage(qrUrl);
        // Larger QR so the printed modules stay scannable (>= ~0.28 mm each)
        const qrSize = H * 0.24;
        const qrX = isRtl ? padX : W - padX - qrSize;
        const qrY = H - H * 0.035 - qrSize;
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      } catch {
        /* QR optional */
      }

      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (!blob) return;

      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const png = await doc.embedPng(await blob.arrayBuffer());
      const page = doc.addPage([(CARD_W * 72) / 25.4, (CARD_H * 72) / 25.4]);
      page.drawImage(png, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
      const bytes = await doc.save();
      downloadBlob(new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" }), "id-card.pdf");
    } finally {
      setBusy(false);
    }
  };

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });
  }

  function renderBarcode(value: string): Promise<HTMLCanvasElement> {
    return new Promise((res) => {
      const JsBarcode = (window as any).JsBarcode;
      const render = () => {
        const barCanvas = document.createElement("canvas");
        (window as any).JsBarcode(barCanvas, value, {
          format: "CODE128",
          displayValue: false,
          height: 50,
          margin: 0,
        });
        res(barCanvas);
      };
      if (JsBarcode) render();
      else {
        import("jsbarcode").then((m) => {
          (window as any).JsBarcode = m.default || m;
          render();
        }).catch(() => res(document.createElement("canvas")));
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">{L.name}</span>
              <input className={input} value={data.name}
                onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))} placeholder={L.placeholder} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">{L.title}</span>
              <input className={input} value={data.title}
                onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))} placeholder={L.titlePlaceholder} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">{L.hireDate}</span>
              <input type="date" className={input} value={data.hireDate}
                onChange={(e) => setData((d) => ({ ...d, hireDate: e.target.value }))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">{L.idNumber}</span>
              <input className={input} value={data.idNumber}
                onChange={(e) => setData((d) => ({ ...d, idNumber: e.target.value }))} placeholder={L.idPlaceholder} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-ink-soft">{L.company}</span>
              <input className={input} value={data.company}
                onChange={(e) => setData((d) => ({ ...d, company: e.target.value }))} placeholder={L.company} />
            </label>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-white">
              {data.photoUrl ? (
                <img src={data.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300">
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <span className="mb-1 block text-xs text-ink-soft">{L.photo}</span>
              <div className="flex gap-2">
                <button onClick={() => photoInputRef.current?.click()}
                  className="rounded-md border border-line bg-slate-50 px-3 py-1.5 text-xs font-medium hover:border-brand-500 hover:text-brand-700">
                  {L.uploadPhoto}
                </button>
                <button onClick={openCamera}
                  className="rounded-md border border-line bg-slate-50 px-3 py-1.5 text-xs font-medium hover:border-brand-500 hover:text-brand-700">
                  {L.capturePhoto}
                </button>
                {data.photoUrl && (
                  <button onClick={() => setData((d) => ({ ...d, photoUrl: null }))}
                    className="rounded-md border border-line px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">
                    {L.removePhoto}
                  </button>
                )}
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              <input ref={captureInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-white">
              {data.logoUrl ? (
                <img src={data.logoUrl} alt="" className="h-full w-full object-contain" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300">
                  <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <span className="mb-1 block text-xs text-ink-soft">{L.logo}</span>
              <div className="flex gap-2">
                <button onClick={() => logoInputRef.current?.click()}
                  className="rounded-md border border-line bg-slate-50 px-3 py-1.5 text-xs font-medium hover:border-brand-500 hover:text-brand-700">
                  {L.uploadLogo}
                </button>
                {data.logoUrl && (
                  <button onClick={() => setData((d) => ({ ...d, logoUrl: null }))}
                    className="rounded-md border border-line px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">
                    {L.removeLogo}
                  </button>
                )}
              </div>
              <span className="mb-1 mt-3 block text-xs text-ink-soft">{L.wmIntensity}</span>
              <div className="flex items-center gap-2">
                <input type="range" min={2} max={30} value={Math.round(wmOpacity * 100)}
                  onChange={(e) => setWmOpacity(Number(e.target.value) / 100)}
                  className="h-1.5 flex-1 cursor-pointer" style={{ accentColor: primary }} />
                <span className="w-9 text-right text-xs font-semibold text-slate-700">{Math.round(wmOpacity * 100)}%</span>
              </div>
              <span className="mb-1 mt-3 block text-xs text-ink-soft">{L.wmSizeLabel}</span>
              <div className="flex items-center gap-2">
                <input type="range" min={35} max={100} value={wmSize}
                  onChange={(e) => setWmSize(Number(e.target.value))}
                  className="h-1.5 flex-1 cursor-pointer" style={{ accentColor: primary }} />
                <span className="w-9 text-right text-xs font-semibold text-slate-700">{wmSize}%</span>
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">{L.color}</span>
            <div className="flex items-center gap-2">
              <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-line p-1" />
              <input className={input} value={primary} onChange={(e) => setPrimary(e.target.value)} />
            </div>
          </label>

          <div className="flex flex-wrap gap-3 pt-1">
            <PrimaryButton onClick={() => setPrinted(true)}>{L.save}</PrimaryButton>
            {showCard && (
              <button onClick={buildPdf} disabled={busy}
                className="rounded-xl border border-brand-500 bg-white px-6 py-3 font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-50">
                {busy ? L.processing : L.print}
              </button>
            )}
            <a href={invoiceHref}
              className="rounded-xl border border-emerald-600 bg-white px-6 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-50">
              {L.createInvoice}
            </a>
          </div>
          <p className="text-xs text-ink-soft">{L.hint}</p>
        </div>

        <div className="space-y-3">
          <span className="text-xs font-medium text-ink-soft">{L.preview}</span>
          {showCard ? (
            <>
<div className="flex flex-col justify-between overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200"
                style={{ aspectRatio: `${CARD_W} / ${CARD_H}` }}>
              <div className="relative flex flex-shrink-0 items-center justify-center px-2"
                style={{ height: "23%", backgroundColor: primary }}>
                <span className="text-center text-[clamp(13px,2.4vw,19px)] font-extrabold uppercase tracking-wide text-white" dir="auto">
                  {companyText}
                </span>
              </div>

              <div className="relative flex flex-shrink-0 overflow-hidden px-[5%] py-[0.5%]"
                style={{ height: "53%" }}>
                <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1] flex -translate-x-1/2 -translate-y-1/2 select-none items-center justify-center"
                  style={{ opacity: wmOpacity, width: `${wmSize}%`, height: `${Math.round(wmSize * 0.82)}%` }}>
                  {data.logoUrl ? (
                    <img src={data.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-center font-extrabold leading-tight" dir="auto"
                      style={{ color: primary, fontSize: "clamp(14px,2.4vw,30px)", letterSpacing: "0.08em" }}>
                      {companyText}
                    </span>
                  )}
                </div>

                <div className="relative z-[2] flex h-full items-center bg-transparent" style={{ gap: "4%" }}>
                  <div className="flex-shrink-0" style={{ height: "98%", aspectRatio: "4 / 6" }}>
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg border-2 border-slate-300 bg-white ring-1 ring-slate-100">
                      {data.photoUrl ? (
                        <img src={data.photoUrl} alt="" style={{ objectFit: "cover", objectPosition: "center" }}
                          className="h-full w-full object-cover" />
                      ) : (
                        <svg width="30%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300">
                          <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden" dir="auto"
                    style={{ paddingInlineStart: "14px" }}>
                    <div className="flex h-full flex-col overflow-hidden"
                      style={{ justifyContent: "space-between", minHeight: 0 }}>
                      <div className="flex flex-col">
<div className="text-[clamp(13px,2.4vw,19px)] font-extrabold leading-tight text-slate-900">{data.name || L.name}</div>
                      <div className="mt-[2px] text-[clamp(9px,1.6vw,13px)] font-bold" style={{ color: primary }}>{data.title || L.title}</div>
                      </div>
                      <div className="mb-[8px] flex flex-col">
                        <div className="text-[clamp(6px,1vw,8px)] font-semibold uppercase tracking-wide text-slate-600">{L.employeeId}</div>
                        <div className="mt-[3px] text-[clamp(8px,1.3vw,11px)] font-bold text-slate-900">{data.idNumber || "—"}</div>
                      </div>
                      <div className="flex flex-col">
                        <div className="text-[clamp(6px,1vw,8px)] font-semibold uppercase tracking-wide text-slate-600">{L.hire}</div>
                        <div className="mt-[3px] text-[clamp(8px,1.3vw,11px)] font-bold text-slate-900">{data.hireDate || "—"}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex h-full flex-shrink-0 flex-col items-center justify-between overflow-hidden"
                    style={{ width: "22%", minHeight: 0 }}>
                    {data.logoUrl && (
                      <div className="flex min-h-0 w-full items-center justify-center overflow-hidden"
                        style={{ flex: "1 1 auto", maxHeight: "48%" }}>
                        <img src={data.logoUrl} alt="logo" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                    {qrUrl && (
                      <button onClick={() => setQrZoom(true)} title={L.scanHint}
                        className="cursor-zoom-in"
                        style={{ width: "60%", aspectRatio: "1 / 1", flexShrink: 0 }}>
                        <img src={qrUrl} alt="qr" className="h-full w-full" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-shrink-0 items-stretch justify-center px-[5%]"
                style={{ height: "24%" }}>
                {barcodeUrl && (
                  <img src={barcodeUrl} alt="barcode"
                    style={{ height: "68%", maxWidth: "40%", alignSelf: "center" }}
                    className="object-contain" />
                )}
              </div>
            </div>

            {qrZoom && qrUrl && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                onClick={() => setQrZoom(false)}>
                <div className="flex max-h-full flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}>
                  <img src={qrUrl} alt="qr" className="w-56 rounded-lg bg-white" />
                  <div className="max-w-xs text-center text-sm font-medium text-slate-800" dir="auto">
                    {qrPayload().split("\n").map((line, i) => <div key={i} className="whitespace-pre-wrap">{line}</div>)}
                  </div>
                  <button onClick={() => setQrZoom(false)}
                    className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                    aria-label="close">×</button>
                </div>
              </div>
            )}
            </>
          ) : (
            <div className="flex aspect-[85.6/54] items-center justify-center rounded-xl border-2 border-dashed border-line bg-slate-50 px-4 text-center text-sm text-ink-soft">
              {hasName ? L.hint : L.emptyName}
            </div>
          )}
          <p className="text-xs text-ink-soft">{L.size}: 85.6 × 54 mm · ISO ID-1</p>
          {showCard && (
            <div className="rounded-lg border border-line bg-slate-50 p-3">
              <div className="mb-1 text-xs font-semibold text-ink-soft">{L.scanDataLabel}</div>
              <div className="text-xs leading-5 text-slate-700" dir="auto">
                {qrPayload().split("\n").map((line, i) => <div key={i}>{line}</div>)}
              </div>
            </div>
          )}
          <p className="text-xs text-ink-soft">{L.scanHint}</p>
        </div>
      </div>

      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeCamera}>
          <div className="flex max-h-full flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            {cameraError ? (
              <div className="flex flex-col items-center gap-4">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-500">
                  <path d="M4 8h10l3-3h3v14H4z" /><circle cx="12" cy="13" r="3" />
                </svg>
                <p className="max-w-xs text-center text-sm font-medium text-red-600" dir="auto">{cameraError}</p>
                <button onClick={closeCamera}
                  className="rounded-lg bg-red-500 px-5 py-2 text-sm font-medium text-white hover:bg-red-600">
                  {L.cancel}
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el && streamRef.current && !el.srcObject) el.srcObject = streamRef.current;
                  }}
                  autoPlay playsInline muted
                  className="max-h-[55vh] w-full max-w-sm rounded-lg bg-black object-cover" />
                <div className="flex gap-3">
                  <button onClick={capturePhoto}
                    className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700">
                    {L.capturePhoto}
                  </button>
                  <button onClick={closeCamera}
                    className="rounded-lg bg-red-500 px-5 py-2 text-sm font-medium text-white hover:bg-red-600">
                    {L.cancel}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
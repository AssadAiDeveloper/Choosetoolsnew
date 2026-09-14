"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton } from "../ToolShell";
import { downloadBlob } from "@/lib/download";
import { useLocale } from "next-intl";

interface Tx { id: string; text: string; size: number; color: string; x: number; y: number; }

let nextId = 1;
function makeId() { return String(nextId++); }

const DEBOUNCE_MS = 350;

export default function PdfEditor() {
  const t = useTranslations("tool");
  const locale = useLocale();
  const [file, setFile] = useState<File | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageTexts, setPageTexts] = useState<Record<number, Tx[]>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [out, setOut] = useState<Blob | null>(null);
  const [applying, setApplying] = useState(false);
  const [zoom, setZoom] = useState(100);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageBaseRef = useRef<HTMLCanvasElement | null>(null);
  const pdfRef = useRef<any>(null);
  const pageCountRef = useRef(1);
  const [pageReady, setPageReady] = useState(false);
  const pdfDimsRef = useRef({ pw: 0, ph: 0 });

  const originalBytesRef = useRef<ArrayBuffer | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; startPx: number; startPy: number } | null>(null);

  const currentTexts = pageTexts[pageNum] || [];

  useEffect(() => {
    if (!file) { originalBytesRef.current = null; return; }
    let cancelled = false;
    file.arrayBuffer().then((buf) => { if (!cancelled) originalBytesRef.current = buf; });
    return () => { cancelled = true; };
  }, [file]);

  useEffect(() => {
    let cancelled = false;
    if (!file) return;
    (async () => {
      try {
        const pdfjsLib: any = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
        const data = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        pageCountRef.current = pdf.numPages || 1;
        pdfRef.current = pdf;
        if (cancelled) return;
        setPageNum(1);
        await loadPage(pdf, 1);
      } catch {
        setPageReady(false);
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  useEffect(() => {
    if (!pdfRef.current) return;
    let cancelled = false;
    (async () => {
      await loadPage(pdfRef.current, pageNum);
      if (!cancelled) setEditingId(null);
    })();
    return () => { cancelled = true; };
  }, [pageNum]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingId) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        removeText(selectedId);
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setEditingId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, editingId]);

  async function loadPage(pdf: any, num: number) {
    try {
      const page = await pdf.getPage(Math.min(Math.max(num, 1), pdf.numPages));
      const vp1 = page.getViewport({ scale: 1 });
      pdfDimsRef.current = { pw: vp1.width, ph: vp1.height };
      const maxW = Math.min(900, window.innerWidth - 64);
      const viewport = page.getViewport({ scale: maxW / vp1.width });
      const c = document.createElement("canvas");
      c.width = viewport.width;
      c.height = viewport.height;
      await page.render({ canvasContext: c.getContext("2d")!, viewport } as never).promise;
      pageBaseRef.current = c;
      setPageReady(true);
    } catch {
      setPageReady(false);
    }
  }

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const base = pageBaseRef.current;
    if (!canvas || !base) return;
    canvas.width = base.width;
    canvas.height = base.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(base, 0, 0);

    const { pw, ph } = pdfDimsRef.current;
    if (pw === 0 || ph === 0) return;
    const scaleX = base.width / pw;
    const scaleY = base.height / ph;

    for (const tx of currentTexts) {
      if (!tx.text.trim() && tx.id !== editingId) continue;
      const displayX = tx.x * scaleX;
      const displayY = (ph - tx.y) * scaleY;
      const fontSize = tx.size * scaleX;

      ctx.font = `600 ${fontSize}px Helvetica, Arial, sans-serif`;
      ctx.fillStyle = tx.color;
      ctx.textBaseline = "alphabetic";

      if (editingId === tx.id && !tx.text.trim()) {
        ctx.globalAlpha = 0.35;
        ctx.fillText("Type here...", displayX, displayY);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillText(tx.text, displayX, displayY);
      }

      if (selectedId === tx.id && editingId !== tx.id) {
        const metrics = ctx.measureText(tx.text || "…");
        const textW = metrics.width;
        const textH = fontSize;
        const pad = 6;
        ctx.strokeStyle = "#10a37f";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(displayX - pad, displayY - textH - pad, textW + pad * 2, textH + pad * 2);
        ctx.setLineDash([]);
        ctx.fillStyle = "#10a37f";
        ctx.beginPath();
        ctx.arc(displayX - pad, displayY - textH - pad, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [currentTexts, selectedId, editingId]);

  useEffect(() => { drawCanvas(); }, [drawCanvas, pageReady, pageNum]);

  const applyToPdf = useCallback(async (allTexts: Record<number, Tx[]>) => {
    if (!originalBytesRef.current) return;
    setApplying(true);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const doc = await PDFDocument.load(originalBytesRef.current.slice(0), {
        ignoreEncryption: true, throwOnInvalidObject: false,
      });
      const total = doc.getPageCount();
      if (total < 1) throw new Error("PDF has no pages");
      const font = await doc.embedFont(StandardFonts.Helvetica);
      for (const [pageStr, txs] of Object.entries(allTexts)) {
        const pgNum = Number(pageStr);
        if (pgNum < 1 || pgNum > total) continue;
        const page = doc.getPage(pgNum - 1);
        for (const tx of txs) {
          if (!tx.text.trim()) continue;
          const color = rgb(
            parseInt(tx.color.slice(1, 3), 16) / 255,
            parseInt(tx.color.slice(3, 5), 16) / 255,
            parseInt(tx.color.slice(5, 7), 16) / 255
          );
          page.drawText(tx.text, { x: tx.x, y: tx.y, size: tx.size, font, color });
        }
      }
      const bytes = await doc.save();
      setOut(new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" }));
    } catch (err) {
      console.error("[PdfEditor] applyToPdf:", err);
    } finally {
      setApplying(false);
    }
  }, []);

  useEffect(() => {
    const hasTexts = Object.values(pageTexts).some((arr) => arr.length > 0);
    if (!hasTexts) { setOut(null); return; }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => applyToPdf(pageTexts), DEBOUNCE_MS);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [pageTexts, applyToPdf]);

  function displayToPdf(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    const base = pageBaseRef.current;
    if (!canvas || !base) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const { pw, ph } = pdfDimsRef.current;
    if (pw === 0 || ph === 0) return { x: 0, y: 0 };
    const cx = ((clientX - rect.left) / rect.width) * base.width;
    const cy = ((clientY - rect.top) / rect.height) * base.height;
    return {
      x: Math.round((cx / base.width) * pw * 10) / 10,
      y: Math.round(((base.height - cy) / base.height) * ph * 10) / 10,
    };
  }

  function hitTest(clientX: number, clientY: number): string | null {
    const canvas = canvasRef.current;
    const base = pageBaseRef.current;
    if (!canvas || !base) return null;
    const rect = canvas.getBoundingClientRect();
    const { pw, ph } = pdfDimsRef.current;
    if (pw === 0 || ph === 0) return null;
    const cx = ((clientX - rect.left) / rect.width) * base.width;
    const cy = ((clientY - rect.top) / rect.height) * base.height;
    const scaleX = base.width / pw;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    for (let i = currentTexts.length - 1; i >= 0; i--) {
      const tx = currentTexts[i];
      if (!tx.text.trim()) continue;
      const fontSize = tx.size * scaleX;
      ctx.font = `600 ${fontSize}px Helvetica, Arial, sans-serif`;
      const tw = ctx.measureText(tx.text).width;
      const displayX = tx.x * scaleX;
      const displayY = (ph - tx.y) * (base.height / ph);
      if (cx >= displayX - 8 && cx <= displayX + tw + 8 && cy >= displayY - fontSize - 8 && cy <= displayY + 8) {
        return tx.id;
      }
    }
    return null;
  }

  const onCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const hit = hitTest(e.clientX, e.clientY);
    if (hit) {
      setSelectedId(hit);
      const tx = currentTexts.find((t) => t.id === hit);
      if (tx) {
        dragRef.current = { id: hit, startX: tx.x, startY: tx.y, startPx: e.clientX, startPy: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    }
  };

  const onCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    e.preventDefault();
    const { id, startX, startY, startPx, startPy } = dragRef.current;
    const canvas = canvasRef.current;
    const base = pageBaseRef.current;
    if (!canvas || !base) return;
    const rect = canvas.getBoundingClientRect();
    const { pw, ph } = pdfDimsRef.current;
    if (pw === 0 || ph === 0) return;
    const dxPdf = ((e.clientX - startPx) / rect.width) * pw;
    const dyPdf = ((e.clientY - startPy) / rect.height) * ph;
    updateText(id, {
      x: Math.max(0, Math.min(pw, Math.round((startX + dxPdf) * 10) / 10)),
      y: Math.max(0, Math.min(ph, Math.round((startY - dyPdf) * 10) / 10)),
    });
  };

  const onCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    (e.currentTarget as HTMLCanvasElement).releasePointerCapture?.(e.pointerId);
    if (drag) return;

    const hit = hitTest(e.clientX, e.clientY);
    if (hit) { setSelectedId(hit); return; }

    const pos = displayToPdf(e.clientX, e.clientY);
    const id = makeId();
    setPageTexts((prev) => ({
      ...prev,
      [pageNum]: [...(prev[pageNum] || []), { id, text: "", size: 24, color: "#e05555", x: pos.x, y: pos.y }],
    }));
    setSelectedId(id);
    setEditingId(id);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onCanvasDblClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const hit = hitTest(e.clientX, e.clientY);
    if (hit) {
      setSelectedId(hit);
      setEditingId(hit);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const updateText = (id: string, patch: Partial<Tx>) => {
    setPageTexts((prev) => ({
      ...prev,
      [pageNum]: (prev[pageNum] || []).map((tx) => tx.id === id ? { ...tx, ...patch } : tx),
    }));
  };

  const removeText = (id: string) => {
    setPageTexts((prev) => ({
      ...prev,
      [pageNum]: (prev[pageNum] || []).filter((tx) => tx.id !== id),
    }));
    if (editingId === id) setEditingId(null);
    if (selectedId === id) setSelectedId(null);
  };

  function pdfToDisplayPos(tx: Tx): { left: number; top: number } {
    const canvas = canvasRef.current;
    const base = pageBaseRef.current;
    if (!canvas || !base) return { left: 0, top: 0 };
    const { pw, ph } = pdfDimsRef.current;
    if (pw === 0 || ph === 0) return { left: 0, top: 0 };
    const scaleX = base.width / pw;
    const scaleY = base.height / ph;
    return {
      left: tx.x * scaleX,
      top: (ph - tx.y) * scaleY - tx.size * scaleX,
    };
  }

  const L = locale === "ar"
    ? {
        saving: "جاري الحفظ...",
        saved: "تم الحفظ",
        hint: "انقر على الصفحة لإضافة نص جديد",
        delete: "حذف",
        size: "الحجم",
        color: "اللون",
        dragHint: "اسحب للتحريك · اضغط مرتين للتعديل · Del للحذف",
        page: "صفحة",
        of: "من",
        zoom: "تكبير",
        fit: "ملائم",
        filename: "الملف",
        close: "إغلاق",
      }
    : {
        saving: "Saving...",
        saved: "Saved",
        hint: "Click on the page to add text",
        delete: "Delete",
        size: "Size",
        color: "Color",
        dragHint: "Drag to move · Double-click to edit · Del to remove",
        page: "Page",
        of: "of",
        zoom: "Zoom",
        fit: "Fit",
        filename: "File",
        close: "Close",
      };

  const reset = () => {
    setFile(null); setOut(null); setStage("pick"); setPageTexts({}); setSelectedId(null); setEditingId(null);
    pageBaseRef.current = null; pdfRef.current = null; setPageReady(false); setApplying(false); setZoom(100);
  };

  const onFiles = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f); setPageTexts({}); setSelectedId(null); setEditingId(null);
  };

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={reset} />;

  const selectedTx = currentTexts.find((tx) => tx.id === selectedId);
  const editingTx = currentTexts.find((tx) => tx.id === editingId);

  return (
    <div className="space-y-4">
      {!file && <FileDropzone accept="application/pdf,.pdf" onFiles={onFiles} />}

      {file && (
        <div className="space-y-3 animate-fadeIn">

          {/* Top toolbar */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">

            {/* Close / File info */}
            <button onClick={reset} title={L.close}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>

            <div className="h-5 w-px bg-slate-200" />

            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none">{L.filename}</span>
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[180px]">{file.name}</span>
            </div>

            <div className="h-5 w-px bg-slate-200" />

            {/* Page navigation */}
            <div className="flex items-center gap-1">
              <button onClick={() => { setPageNum((p) => Math.max(1, p - 1)); setSelectedId(null); setEditingId(null); }}
                disabled={pageNum <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:hover:bg-transparent">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2L4 6l4 4" />
                </svg>
              </button>
              <span className="text-xs font-semibold text-slate-600 tabular-nums min-w-[48px] text-center">
                {pageNum} <span className="text-slate-400 font-normal">{L.of}</span> {pageCountRef.current}
              </span>
              <button onClick={() => { setPageNum((p) => Math.min(pageCountRef.current, p + 1)); setSelectedId(null); setEditingId(null); }}
                disabled={pageNum >= pageCountRef.current}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:hover:bg-transparent">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 2l4 4-4 4" />
                </svg>
              </button>
            </div>

            {/* Text tools (when text selected) */}
            {selectedTx && (
              <>
                <div className="h-5 w-px bg-slate-200" />
                <div className="flex items-center gap-2 animate-dropIn">

                  {/* Font size */}
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                    <svg width="12" height="12" viewBox="0 0 12 12" className="text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <text x="1" y="10" fontSize="9" fontWeight="bold" fill="currentColor" stroke="none">T</text>
                    </svg>
                    <input type="number" min={8} max={300} value={selectedTx.size}
                      onChange={(e) => updateText(selectedTx.id, { size: Number(e.target.value) || 24 })}
                      className="w-10 bg-transparent text-center text-xs font-semibold text-slate-700 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                  </div>

                  {/* Color */}
                  <div className="relative">
                    <input type="color" value={selectedTx.color}
                      onChange={(e) => updateText(selectedTx.id, { color: e.target.value })}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 transition hover:border-slate-300">
                      <div className="h-3.5 w-3.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: selectedTx.color }} />
                    </div>
                  </div>

                  {/* Delete */}
                  <button onClick={() => removeText(selectedTx.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    title={L.delete}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M2 3h8M4.5 3V2a1 1 0 011-1h1a1 1 0 011 1v1M3 3l.5 7a1 1 0 001 1h3a1 1 0 001-1L9 3" />
                    </svg>
                  </button>
                </div>
              </>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Status + Download */}
            <div className="flex items-center gap-2">
              {applying && (
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                  {L.saving}
                </span>
              )}
              {!applying && out && (
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {L.saved}
                </span>
              )}
              {out && (
                <button onClick={() => downloadBlob(out, "edited.pdf")}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 1v8M3 6l3 3 3-3M2 10h8" />
                  </svg>
                  {t("download")}
                </button>
              )}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex justify-center">
            <div ref={containerRef} className="relative inline-block rounded-xl shadow-lg ring-1 ring-slate-200 overflow-hidden bg-white"
              style={{ maxWidth: "100%", transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
              <canvas
                ref={canvasRef}
                onPointerDown={onCanvasPointerDown}
                onPointerMove={onCanvasPointerMove}
                onPointerUp={onCanvasPointerUp}
                onDoubleClick={onCanvasDblClick}
                className="block h-auto w-full cursor-crosshair touch-none"
              />

              {editingTx && (() => {
                const pos = pdfToDisplayPos(editingTx);
                const base = pageBaseRef.current;
                const { pw } = pdfDimsRef.current;
                if (!base || pw === 0) return null;
                const scaleX = base.width / pw;
                const fontSize = editingTx.size * scaleX;
                return (
                  <textarea
                    ref={inputRef}
                    dir="auto"
                    value={editingTx.text}
                    onChange={(e) => updateText(editingTx.id, { text: e.target.value })}
                    onBlur={() => { if (!editingTx.text.trim()) removeText(editingTx.id); else setEditingId(null); }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") { setEditingId(null); e.currentTarget.blur(); }
                      if (e.key === "Delete" && e.shiftKey) { removeText(editingTx.id); }
                    }}
                    className="absolute z-30 border-2 border-emerald-500 rounded-md bg-white/95 shadow-lg shadow-emerald-500/10 px-1.5 py-0.5 outline-none resize-none backdrop-blur-sm"
                    style={{
                      left: pos.left,
                      top: pos.top,
                      color: editingTx.color,
                      fontSize: `${fontSize}px`,
                      fontWeight: 600,
                      lineHeight: 1.2,
                      fontFamily: "Helvetica, Arial, sans-serif",
                      minWidth: "80px",
                    }}
                    rows={1}
                    autoFocus
                  />
                );
              })()}
            </div>
          </div>

          {/* Bottom hints */}
          {currentTexts.length === 0 && (
            <div className="flex justify-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="5" cy="5" r="4" />
                  <path d="M5 3v4M3 5h4" />
                </svg>
                {L.hint}
              </span>
            </div>
          )}
          {currentTexts.length > 0 && (
            <div className="flex justify-center text-[11px] text-slate-400">{L.dragHint}</div>
          )}
        </div>
      )}
    </div>
  );
}

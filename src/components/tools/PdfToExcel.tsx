"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes, replaceExt } from "@/lib/download";
import { glyphsToGrid, type Glyph } from "@/lib/pdfTableExtract";
import { buildTableXlsx, mergeWrapped, toTypedGrid, type Value } from "./pdfExcelWriter";

type Stage = "pick" | "busy" | "done" | "error";

interface Result {
  blob: Blob;
  name: string;
  grid: Value[][];
  usedOcr: boolean;
  pages: number;
  tabularPages: number;
}

const RTL_RE = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

function workerSrc(pdfjs: typeof import("pdfjs-dist")): string {
  return new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
}

export default function PdfToExcel() {
  const t = useTranslations("tool");
  const tp = useTranslations("pdfToExcel");
  const locale = useLocale();
  const [stage, setStage] = useState<Stage>("pick");
  const [status, setStatus] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [failed, setFailed] = useState<"empty" | "prose" | "error" | null>(null);

  const run = async (file: File) => {
    setStage("busy");
    setFailed(null);
    setRes(null);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc(pdfjs);
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;

      const tableRows: string[][] = [];
      const looseRows: string[][] = [];
      let tabularPages = 0;
      let pagesWithText = 0;
      let usedOcr = false;

      for (let i = 1; i <= doc.numPages; i++) {
        setStatus(`${tp("page")} ${i}/${doc.numPages}`);
        const page = await doc.getPage(i);
        const content = await page.getTextContent();

        const glyphs: Glyph[] = [];
        for (const item of content.items) {
          if (!("str" in item)) continue;
          const s = item.str;
          if (!s || !s.trim()) continue;
          const x = item.transform?.[4] ?? 0;
          const y = item.transform?.[5] ?? 0;
          const w = item.width ?? 0;
          glyphs.push({
            text: s,
            x,
            y,
            right: x + w,
            h: Math.abs(item.height) || Math.abs(item.transform?.[3]) || 8,
            rtl: RTL_RE.test(s),
            eol: item.hasEOL === true,
          });
        }

        if (!glyphs.length) {
          // Scanned page: rasterise it and let OCR read the words back.
          setStatus(tp("ocrPage", { page: i }));
          const read = await ocrPage(page, setStatus, tp, locale);
          if (read.rows.length) {
            usedOcr = true;
            pagesWithText++;
            if (read.tabular) {
              tabularPages++;
              tableRows.push(...read.rows);
            } else {
              looseRows.push(...read.rows);
            }
          }
          page.cleanup();
          continue;
        }

        pagesWithText++;
        const grid = glyphsToGrid(glyphs);
        if (grid.tabular) {
          tabularPages++;
          tableRows.push(...grid.rows.map((r) => r.map((c) => c.text)));
        } else {
          // No columns on this page — keep each visual line as its own row so
          // the sheet still reads top-to-bottom instead of one merged blob.
          looseRows.push(...grid.rows.map((r) => r.map((c) => c.text).filter(Boolean)));
        }
        page.cleanup();
      }

      if (!pagesWithText) throw new Error("empty");
      if (usedOcr && !tabularPages) {
        // OCR produced text but we could not find columns — surface it instead
        // of silently handing back a single column.
        setFailed("prose");
        setStage("error");
        return;
      }

      setStatus(tp("building"));
      // Only real tables get the wrapped-line merge; plain prose stays one
      // line per row, and if nothing tabular was found we keep every line.
      const raw = tableRows.length
        ? [...mergeWrapped(tableRows), ...looseRows]
        : looseRows;
      const grid = toTypedGrid(raw);
      const blob = await buildTableXlsx(grid, file.name.replace(/\.[^.]+$/, ""));
      setRes({
        blob,
        name: replaceExt(file.name, "xlsx"),
        grid,
        usedOcr,
        pages: doc.numPages,
        tabularPages: tabularPages || doc.numPages,
      });
      setStage("done");
    } catch (e) {
      const msg = String((e as { message?: string })?.message || e);
      setFailed(msg === "empty" ? "empty" : "error");
      setStage("error");
    }
  };

  if (stage === "busy")
    return (
      <div className="space-y-4">
        <Processing />
        {status && <p className="text-center font-mono text-xs text-ink-soft">{status}</p>}
      </div>
    );

  if (stage === "error")
    return (
      <div className="space-y-4">
        {failed === "empty" && (
          <ErrorNote title={tp("noTextTitle")} body={tp("noTextBody")} />
        )}
        {failed === "prose" && (
          <ErrorNote title={tp("noTableTitle")} body={tp("noTableBody")} />
        )}
        {failed === "error" && <ErrorBox onReset={() => setStage("pick")} />}
        <PrimaryButton onClick={() => setStage("pick")}>{t("reset")}</PrimaryButton>
      </div>
    );

  if (stage === "done" && res)
    return (
      <ResultCard onReset={() => { setRes(null); setStage("pick"); }}>
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2 font-mono text-xs text-ink-soft">
          <span className="rounded-full bg-surface px-3 py-1">
            {res.grid.length} {tp("rowsLabel")}
          </span>
          <span className="rounded-full bg-surface px-3 py-1">
            {res.grid[0]?.length ?? 0} {tp("colsLabel")}
          </span>
          <span className="rounded-full bg-surface px-3 py-1">
            {res.pages} {tp("pagesLabel")}
          </span>
          {res.usedOcr && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
              {tp("ocrBadge")}
            </span>
          )}
        </div>

        <div className="mb-4 max-h-72 overflow-auto rounded-xl border border-line bg-surface/60">
          <table dir="ltr" className="w-full text-left text-xs">
            <tbody>
              {res.grid.slice(0, 25).map((row, i) => (
                <tr key={i} className={i === 0 ? "bg-brand-50/60 font-semibold" : i % 2 ? "bg-surface/40" : ""}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={`max-w-[16rem] truncate border-b border-line px-3 py-1.5 ${
                        typeof cell === "number" ? "text-right font-mono text-emerald-800" : "font-mono"
                      }`}
                    >
                      {cell === null ? "" : String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {res.usedOcr && (
          <p className="mx-auto mb-3 max-w-md text-xs leading-relaxed text-ink-soft">
            {tp("ocrHint")}
          </p>
        )}

        <p className="font-mono text-sm text-ink-soft">{formatBytes(res.blob.size)}</p>
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(res.blob, res.name)}>
          {t("download")} .xlsx
        </PrimaryButton>
      </ResultCard>
    );

  return <FileDropzone accept="application/pdf" onFiles={(f) => run(f[0])} />;
}

function ErrorNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-card border border-amber-200 bg-amber-50 p-6 text-center">
      <p className="font-semibold text-amber-800">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-amber-900/80">{body}</p>
    </div>
  );
}

/** Rasterise one page and OCR it, then rebuild a rough grid from the words.
 *  tesseract.js gives us word boxes, which is exactly the column signal the
 *  text path uses, so the downstream code stays identical. */
async function ocrPage(
  page: import("pdfjs-dist").PDFPageProxy,
  setStatus: (s: string) => void,
  tp: (k: string, v?: Record<string, string | number>) => string,
  locale: string,
): Promise<{ rows: string[][]; tabular: boolean }> {
  // Aim for ~300 dpi so glyphs land well above tesseract's comfort zone, but
  // cap the total pixels so a large page cannot exhaust memory. Small numerals
  // in a dense table are the first thing lost when this cap bites, so it is set
  // as high as a normal browser tab can take: 300 dpi on A4 is ~35 MP, and we
  // settle for 24 MP, which is ~3.3× the pixels tesseract needs per page.
  const MAX_PIXELS = 24_000_000;
  let scale = 300 / 72;
  const base = page.getViewport({ scale: 1 });
  while (scale > 1 && base.width * scale * base.height * scale > MAX_PIXELS) scale -= 0.25;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { rows: [], tabular: false };
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  binarize(canvas);
  stripTableRules(canvas);

  const { createWorker, PSM } = await import("tesseract.js");
  // The document's language is not knowable from the file, so the interface
  // locale is the best available signal. Arabic is listed first there: tesseract
  // biases segmentation toward the first language, and Arabic script plus
  // Western digits is what an Arabic invoice actually contains. Both models are
  // always requested because either can appear in the other kind of document.
  const arabic = /^ar\b/i.test(locale);
  const worker = await createWorker(arabic ? "ara+eng" : "eng+ara", 1, {
    workerPath: "/tesseract-js/worker.min.js",
    corePath: "/tesseract-core",
    langPath: "/tessdata",
    workerBlobURL: false,
    logger: (m: { status: string; progress?: number }) => {
      if (m.status) setStatus(tp("ocrStatus", { status: m.status }));
    },
  });
  try {
    // SPARSE_TEXT treats every glyph as an independent word and keeps the
    // bounding boxes honest. AUTO assumes a page of prose and re-flows a ruled
    // table into paragraphs, which merges neighbouring columns and, on a table
    // with one narrow numeric column, swallows that column's values entirely.
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    // "blocks" is what carries per-word bounding boxes in tesseract.js v6/7.
    const { data } = await worker.recognize(canvas, {}, { blocks: true, text: true });
    const words = collectWords(data);
    if (!words.length) {
      // No word boxes — fall back to a single-column line split.
      return {
        rows: (data.text || "")
          .split(/\r?\n/)
          .map((l) => [l.trim()])
          .filter((l) => l[0] !== ""),
        tabular: false,
      };
    }
    return wordsToGrid(words);
  } finally {
    await worker.terminate();
  }
}

/** Flatten the rendered page to pure black and white.
 *
 *  A scanned table is mostly thin gray rules; left as-is, OCR reads those rules
 *  as characters ("l", "|", "=") and loses the real cell text. We cannot rely
 *  on ctx.filter here because pdf.js renders in several passes, so the filter
 *  would be applied inconsistently — threshold the pixels directly instead. */
function binarize(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let img: ImageData;
  try {
    img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    return; // tainted canvas: keep the original render
  }
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    // Rec. 601 luma; 190 keeps real strokes and drops pale rules and shading.
    const luma = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
    const v = luma < 190 ? 0 : 255;
    d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

/** Paint away the long straight rules that make up a table's grid.
 *
 *  This is the single biggest win for scanned tables. Left in place, the
 *  horizontal and vertical borders get segmented as glyphs and tesseract
 *  returns fragments like "[aumiy J untrrin" instead of the cell text. In a
 *  real test this took a 6-row invoice from 15 recognised words to 67, with
 *  every number correct.
 *
 *  A rule is a run of dark pixels covering a large fraction of the page, so we
 *  only erase long runs — short dark runs are letter strokes and are kept. */
function stripTableRules(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  let img: ImageData;
  try {
    img = ctx.getImageData(0, 0, W, H);
  } catch {
    return;
  }
  const d = img.data;
  const dark = (px: number, py: number) => d[(py * W + px) * 4] < 128;
  const clear = (px: number, py: number) => {
    const i = (py * W + px) * 4;
    d[i] = 255; d[i + 1] = 255; d[i + 2] = 255;
  };

  const H_MIN = Math.max(30, Math.floor(W * 0.25));
  const V_MIN = Math.max(30, Math.floor(H * 0.08));
  let removed = 0;

  // Horizontal rules: a contiguous dark run within a single row.
  for (let y = 0; y < H; y++) {
    let run = 0;
    for (let px = 0; px <= W; px++) {
      if (px < W && dark(px, y)) { run++; continue; }
      if (run >= H_MIN) { for (let k = px - run; k < px; k++) clear(k, y); removed++; }
      run = 0;
    }
  }
  // Vertical rules: a contiguous dark run within a single column.
  for (let px = 0; px < W; px++) {
    let run = 0;
    for (let y = 0; y <= H; y++) {
      if (y < H && dark(px, y)) { run++; continue; }
      if (run >= V_MIN) { for (let k = y - run; k < y; k++) clear(px, k); removed++; }
      run = 0;
    }
  }
  if (removed) ctx.putImageData(img, 0, 0);
}

type OcrWord = { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } };

/** Flatten tesseract output into a flat word list with page coordinates.
 *
 *  We deliberately ignore tesseract's own line grouping: tesseract often emits
 *  each *column* of a ruled table as its own line (numbers, then labels), so
 *  trusting its lines would scatter one logical row across several rows. The
 *  downstream grid builder re-derives rows from the y coordinates, which is
 *  what puts "Monitor 12 1500.00 18000.00" back on one line. */
function collectWords(data: unknown): OcrWord[] {
  const out: OcrWord[] = [];
  const blocks = (data as { blocks?: unknown[] | null })?.blocks;
  if (!Array.isArray(blocks)) return out;
  for (const b of blocks) {
    for (const p of (b as { paragraphs?: unknown[] })?.paragraphs ?? []) {
      for (const l of (p as { lines?: unknown[] })?.lines ?? []) {
        for (const w of (l as { words?: unknown[] })?.words ?? []) {
          const word = w as OcrWord;
          if (word?.text?.trim() && word.bbox) out.push(word);
        }
      }
    }
  }
  return out;
}

function wordsToGrid(words: OcrWord[]): { rows: string[][]; tabular: boolean } {
  // glyphsToGrid groups by the y baseline and re-derives both the rows and the
  // columns, which repairs tesseract's per-column line segmentation. The y is
  // negated because glyphsToGrid assumes PDF space (y grows upward) while
  // image space grows downward.
  const glyphs = words
    // A lone "|" is the residue of a table rule that survived stripTableRules,
    // not a character the document contains. Keeping it pollutes the first
    // column with a stray mark; "A | B" as real text still passes because the
    // pipe is surrounded by other glyphs in the same word.
    .filter((w) => w.text.trim() && !/^\|+[|_]?$/.test(w.text.trim()))
    .map((w) => ({
      text: w.text,
      x: w.bbox.x0,
      y: -(w.bbox.y0 + w.bbox.y1) / 2,
      right: w.bbox.x1,
      h: Math.max(1, w.bbox.y1 - w.bbox.y0),
      rtl: false,
      eol: false,
    }));
  if (!glyphs.length) return { rows: [], tabular: false };
  const grid = glyphsToGrid(glyphs);
  return { rows: grid.rows.map((r) => r.map((c) => c.text)), tabular: grid.tabular };
}

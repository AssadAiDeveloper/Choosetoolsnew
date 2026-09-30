// Rasterising a page and reading it back with OCR, for PDFs that carry no text
// layer. Shared by the PDF-to-Excel and PDF-to-Word tools so the scan path has
// one implementation: the two tools must agree on what a scan looks like, or a
// document that reads correctly in one tool would come out differently in the
// other.
import { glyphsToGrid, type Glyph } from "./pdfTableExtract";

/** pdf.js ships its worker as a separate ES module; resolve it against the
 *  bundler so the version installed is the one that runs. */
export function pdfjsWorkerSrc(pdfjs: typeof import("pdfjs-dist")): string {
  return new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
}

/** Flatten the rendered page to pure black and white.
 *
 *  A scanned table is mostly thin gray rules; left as-is, OCR reads those rules
 *  as characters ("l", "|", "=") and loses the real cell text. We cannot rely
 *  on ctx.filter here because pdf.js renders in several passes, so the filter
 *  would be applied inconsistently — threshold the pixels directly instead. */
export function binarize(canvas: HTMLCanvasElement): void {
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
export function stripTableRules(canvas: HTMLCanvasElement): void {
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

export type OcrWord = { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } };

/** Flatten tesseract output into a flat word list with page coordinates.
 *
 *  We deliberately ignore tesseract's own line grouping: tesseract often emits
 *  each *column* of a ruled table as its own line (numbers, then labels), so
 *  trusting its lines would scatter one logical row across several rows. The
 *  downstream grid builder re-derives rows from the y coordinates, which is
 *  what puts "Monitor 12 1500.00 18000.00" back on one line. */
export function collectWords(data: unknown): OcrWord[] {
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

export function wordsToGrid(words: OcrWord[]): { rows: string[][]; tabular: boolean } {
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

/** OCR language for a UI locale. The document's own language is not knowable
 *  from the file, so the interface locale is the best available signal. Arabic
 *  is listed first there because tesseract biases segmentation toward the first
 *  language, and Arabic script plus Western digits is what an Arabic invoice
 *  actually contains. Both models are always requested because either can
 *  appear in the other kind of document. */
export function ocrLang(locale: string): string {
  return /^ar\b/i.test(locale) ? "ara+eng" : "eng+ara";
}

export interface OcrPageResult {
  rows: string[][];
  tabular: boolean;
}

/** Rasterise one page and OCR it, then rebuild a rough grid from the words.
 *  tesseract.js gives us word boxes, which is exactly the column signal the
 *  text path uses, so the downstream code stays identical. */
export async function ocrPage(
  page: import("pdfjs-dist").PDFPageProxy,
  setStatus: (s: string) => void,
  tp: (k: string, v?: Record<string, string | number>) => string,
  locale: string,
): Promise<OcrPageResult> {
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
  const worker = await createWorker(ocrLang(locale), 1, {
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

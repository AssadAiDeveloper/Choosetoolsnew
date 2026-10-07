import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { TextRun } from "./pdfTextScan";
import { embedFor, standardFontCanEncode, type CustomFont, type ResolvedFont } from "./pdfFonts";

/** Which face an edit should be drawn in. */
export type FontSpec =
  | { kind: "standard"; standard: StandardFonts }
  | { kind: "custom"; custom: CustomFont };

export type Align = "start" | "center" | "end";

export interface TextEdit {
  runId: string;
  /** Geometry of the original run, needed to cover it and to stay in its slot. */
  run: TextRun;
  text: string;
  font: FontSpec;
  size: number;
  /** Hex, e.g. "#111111". */
  color: string;
  bold: boolean;
  italic: boolean;
  /** Colour painted over the original text before the replacement is drawn. */
  coverColor: string;
  align: Align;
}

export class FontCannotRenderError extends Error {
  constructor(public readonly sample: string) {
    super(sample);
    this.name = "FontCannotRenderError";
  }
}

function parseColor(hex: string) {
  const h = hex.replace("#", "").trim();
  const safe = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = Number.parseInt(safe.slice(0, 6), 16);
  if (!Number.isFinite(n)) return rgb(0, 0, 0);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function cacheKey(spec: FontSpec, bold: boolean, italic: boolean) {
  return spec.kind === "standard" ? `std:${String(spec.standard)}|${bold}|${italic}` : `cus:${spec.custom.id}`;
}

/** @pdf-lib/fontkit's shaper reverses the WHOLE glyph run when the script is
 *  right-to-left (no per-token bidi), so a Latin/digit token inside Arabic
 *  comes out mirrored on paper: "عقد جديد 9911" paints "1199". Pre-reversing
 *  each LTR token in the logical string means the run reversal restores it to
 *  the correct visual order. Pure-LTR text is untouched because fontkit never
 *  reverses an ltr run; Arabic-Indic digits are part of the RTL flow and stay. */
export function preReverseLtrTokensInRtl(text: string): string {
  if (!/[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(text)) return text;
  return text.replace(
    // LTR tokens: latin letters, western digits and the ASCII punctuation that
    // belongs to them. Each maximal run is reversed as a unit.
    /[A-Za-z0-9%.,:;!?_+\-*/\\$#@&()[\]{}'"`<>~=|^]*[A-Za-z0-9]+[A-Za-z0-9%.,:;!?_+\-*/\\$#@&()[\]{}'"`<>~=|^]*/g,
    (m) => [...m].reverse().join(""),
  );
}

/** Rewrite the PDF with every edit applied.
 *
 *  Two phases per page, in this order for a reason: all covers are painted
 *  first and all text second. Doing it per edit would let a later cover
 *  rectangle erase a replacement drawn earlier when two edits overlap. */
export async function applyEdits(
  original: ArrayBuffer,
  edits: TextEdit[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(original.slice(0), {
    ignoreEncryption: true,
    throwOnInvalidObject: false,
  });

  const total = doc.getPageCount();
  const byPage = new Map<number, TextEdit[]>();
  for (const e of edits) {
    if (!e.text.trim()) continue;
    if (e.run.page < 1 || e.run.page > total) continue;
    if (e.font.kind === "standard" && !standardFontCanEncode(e.text)) {
      throw new FontCannotRenderError(firstUnsupported(e.text));
    }
    // Draw the pre-reversed form so fontkit's whole-run reversal ends up
    // painting the replacement exactly as typed. Latin text is unchanged.
    const toDraw =
      e.font.kind === "custom" ? { ...e, text: preReverseLtrTokensInRtl(e.text) } : e;
    const list = byPage.get(e.run.page) ?? [];
    list.push(toDraw);
    byPage.set(e.run.page, list);
  }

  // Embed each distinct face once. Re-embedding per edit would duplicate the
  // whole font program into the output for every line on the page.
  const fonts = new Map<string, ResolvedFont>();
  const resolve = async (spec: FontSpec, bold: boolean, italic: boolean) => {
    const key = cacheKey(spec, bold, italic);
    const hit = fonts.get(key);
    if (hit) return hit;
    const got = await embedFor(doc, spec, { bold, italic });
    fonts.set(key, got);
    return got;
  };

  // Resolve every face before touching any page, so an encoding failure leaves
  // the document untouched rather than half-painted.
  for (const e of edits) await resolve(e.font, e.bold, e.italic);

  for (const [pageNum, list] of byPage) {
    const page = doc.getPage(pageNum - 1);

    for (const e of list) {
      const b = e.run.box;
      page.drawRectangle({
        x: b.x,
        y: b.y,
        width: b.w,
        height: b.h,
        color: parseColor(e.coverColor),
        borderWidth: 0,
      });
    }

    for (const e of list) {
      const { font, canItalic, standard } = await resolve(e.font, e.bold, e.italic);
      drawRun(page, e, font, standard ? false : e.bold, canItalic ? false : e.italic);
    }
  }

  return doc.save();
}

function firstUnsupported(text: string): string {
  for (const ch of text) {
    // eslint-disable-next-line no-control-regex
    if (!/^[\x20-\x7E\xA0-\xFF]$/.test(ch)) return ch;
  }
  return text.slice(0, 1);
}

/** Draw one replacement run, keeping it inside the footprint the original
 *  occupied so surrounding content is not disturbed. */
function drawRun(page: PDFPage, e: TextEdit, font: PDFFont, fauxBold: boolean, fauxItalic: boolean) {
  const size = e.size > 0 ? e.size : e.run.height;
  const angle = e.run.angle;
  const rad = (angle * Math.PI) / 180;
  const dirX = Math.cos(rad);
  const dirY = Math.sin(rad);

  let tw: number;
  try {
    tw = font.widthOfTextAtSize(e.text, size);
  } catch {
    tw = e.run.width;
  }

  // Offsets are measured along the baseline direction, which also keeps this
  // correct for rotated text where a plain x shift would be wrong.
  let offset: number;
  const centre = (e.run.width - tw) / 2;
  if (e.align === "center") offset = centre;
  else if ((e.align === "end") !== e.run.rtl) offset = e.run.width - tw;
  else offset = 0;

  const x = e.run.x + dirX * offset;
  const y = e.run.y + dirY * offset;
  const color = parseColor(e.color);
  const rotate = degrees(angle);

  // pdf-lib cannot synthesise a slant, so an italic custom font is drawn
  // upright. The UI hides the control rather than lying about the result.
  page.drawText(e.text, { x, y, size, font, color, rotate });
  if (fauxBold) {
    // Fake weight by overprinting a hair to the right, the usual cheap trick.
    const nudge = size * 0.03;
    page.drawText(e.text, { x: x + dirX * nudge, y: y + dirY * nudge, size, font, color, rotate });
  }
  void fauxItalic;
}

/** Measure what an edit will occupy, so the UI can warn when a longer
 *  replacement spills past the space the original had. */
export function measureEdit(e: TextEdit, font: PDFFont): number {
  try {
    return font.widthOfTextAtSize(e.text, e.size > 0 ? e.size : e.run.height);
  } catch {
    return e.run.width;
  }
}

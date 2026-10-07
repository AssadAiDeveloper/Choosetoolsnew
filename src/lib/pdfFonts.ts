import { StandardFonts } from "pdf-lib";
import type { PDFDocument, PDFFont } from "pdf-lib";

/** The 14 fonts every PDF reader has built in. They need no font file, but
 *  their encoding is WinAnsi only, so they cannot draw Arabic. Anything
 *  non-Latin therefore has to come from an uploaded font. */
export interface StandardFontOption {
  kind: "standard";
  /** Value of the pdf-lib StandardFonts enum. */
  standard: StandardFonts;
  label: string;
  /** Rough CSS family used for the on-screen preview only. */
  css: string;
}

export const STANDARD_FONTS: StandardFontOption[] = [
  { kind: "standard", standard: StandardFonts.Helvetica, label: "Helvetica", css: "Helvetica, Arial, sans-serif" },
  { kind: "standard", standard: StandardFonts.HelveticaBold, label: "Helvetica Bold", css: "Helvetica, Arial, sans-serif" },
  { kind: "standard", standard: StandardFonts.HelveticaOblique, label: "Helvetica Oblique", css: "Helvetica, Arial, sans-serif" },
  { kind: "standard", standard: StandardFonts.HelveticaBoldOblique, label: "Helvetica Bold Oblique", css: "Helvetica, Arial, sans-serif" },
  { kind: "standard", standard: StandardFonts.TimesRoman, label: "Times New Roman", css: "'Times New Roman', Times, serif" },
  { kind: "standard", standard: StandardFonts.TimesRomanBold, label: "Times New Roman Bold", css: "'Times New Roman', Times, serif" },
  { kind: "standard", standard: StandardFonts.TimesRomanItalic, label: "Times New Roman Italic", css: "'Times New Roman', Times, serif" },
  { kind: "standard", standard: StandardFonts.TimesRomanBoldItalic, label: "Times New Roman Bold Italic", css: "'Times New Roman', Times, serif" },
  { kind: "standard", standard: StandardFonts.Courier, label: "Courier", css: "'Courier New', Courier, monospace" },
  { kind: "standard", standard: StandardFonts.CourierBold, label: "Courier Bold", css: "'Courier New', Courier, monospace" },
  { kind: "standard", standard: StandardFonts.CourierOblique, label: "Courier Oblique", css: "'Courier New', Courier, monospace" },
  { kind: "standard", standard: StandardFonts.CourierBoldOblique, label: "Courier Bold Oblique", css: "'Courier New', Courier, monospace" },
  { kind: "standard", standard: StandardFonts.Symbol, label: "Symbol", css: "serif" },
  { kind: "standard", standard: StandardFonts.ZapfDingbats, label: "Zapf Dingbats", css: "serif" },
];

/** A font the user supplied from their own machine. */
export interface CustomFont {
  id: string;
  /** File name with the extension removed, used as the menu label. */
  label: string;
  bytes: Uint8Array;
  /** Family name as fontkit reports it, used for the canvas preview. */
  family: string;
}

// Only the module import is worth caching. `registerFontkit` attaches to a
// single PDFDocument, so a module-level "already registered" flag made the
// second file opened in the same session fail to embed custom fonts.
let fontkitModule: Promise<Parameters<PDFDocument["registerFontkit"]>[0]> | null = null;

/** pdf-lib needs fontkit before it will embed anything that is not a standard
 *  font, and it throws FontkitNotRegisteredError otherwise. Must run for every
 *  document, not just the first. */
async function ensureFontkit(doc: PDFDocument): Promise<void> {
  fontkitModule ??= import("@pdf-lib/fontkit").then(
    (m) => m.default ?? (m as unknown as Parameters<PDFDocument["registerFontkit"]>[0]),
  );
  doc.registerFontkit(await fontkitModule);
}

export interface ResolvedFont {
  font: PDFFont;
  /** CSS family for the canvas preview. */
  css: string;
  /** True when the font is one of the built-in 14. */
  standard: boolean;
  /** Whether a real italic face exists. Standard fonts pick their variant by
   *  name, so italic is a separate entry; a custom font has no way to be
   *  slanted by pdf-lib, and the UI disables the control instead. */
  canItalic: boolean;
}

/** Embed the font an edit asked for.
 *
 *  `subset: true` is not optional. Without it pdf-lib writes the text as raw
 *  codepoints and never calls fontkit's layout(), which is what performs Arabic
 *  contextual joining — the output would be unshaped, disconnected letters. */
export async function embedFor(
  doc: PDFDocument,
  font: { kind: "standard"; standard: StandardFonts } | { kind: "custom"; custom: CustomFont },
  opts: { bold: boolean; italic: boolean },
): Promise<ResolvedFont> {
  if (font.kind === "standard") {
    const option = STANDARD_FONTS.find((f) => f.standard === font.standard) ?? STANDARD_FONTS[0];
    // The bold/italic axes are already baked into which of the 14 was picked.
    // If the user toggles bold on "Helvetica", move to the bold face rather
    // than pretending the request was satisfied.
    let target = option;
    if (opts.bold || opts.italic) {
      const swap = STANDARD_FONTS.find(
        (f) => f.standard.startsWith(option.standard.split("-")[0]) && hasAxes(f.standard, opts.bold, opts.italic),
      );
      if (swap) target = swap;
    }
    return { font: await doc.embedFont(target.standard), css: target.css, standard: true, canItalic: true };
  }

  await ensureFontkit(doc);
  const embedded = await doc.embedFont(font.custom.bytes, { subset: true });
  return {
    font: embedded,
    css: `"${font.custom.family}", sans-serif`,
    standard: false,
    // pdf-lib has no slant matrix, so a custom face cannot be made italic.
    canItalic: false,
  };
}

function hasAxes(standard: StandardFonts, bold: boolean, italic: boolean): boolean {
  const s = String(standard).toLowerCase();
  const isBold = s.includes("bold");
  const isItal = s.includes("oblique") || s.includes("italic");
  return isBold === bold && isItal === italic;
}

/** Can this text be represented at all by the chosen standard font?
 *
 *  WinAnsi covers Latin-1 plus a few extras, so this is the check that stops
 *  the user from silently dropping Arabic into Helvetica and getting an
 *  UnsupportedEncodingError at save time. */
export function standardFontCanEncode(text: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /^[\x20-\x7E\xA0-\xFF]*$/.test(text.replace(/[\r\n\t]/g, " "));
}

const FONT_EXT = /\.(ttf|otf|ttc|woff2?)$/i;

/** Validate an uploaded font file before it reaches pdf-lib, which fails with
 *  an opaque error if handed something that is not a real font. */
export async function readCustomFont(file: File): Promise<CustomFont> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length < 1000) throw new Error("fontTooSmall");
  if (!FONT_EXT.test(file.name)) throw new Error("fontType");

  // A TTF/OTF starts with 0x00010000 or "true"/"OTTO"; a WOFF starts "wOFF".
  const magic = String.fromCharCode(...bytes.slice(0, 4));
  const looksLikeFont =
    magic === "\u0000\u0001\u0000\u0000" ||
    magic === "OTTO" ||
    magic === "true" ||
    magic === "ttcf" ||
    magic === "wOFF" ||
    magic === "wOF2";
  if (!looksLikeFont) throw new Error("fontType");

  const id = `custom-${Date.now().toString(36)}`;
  return {
    id,
    label: file.name.replace(FONT_EXT, ""),
    bytes,
    family: await readFamilyName(bytes).catch(() => file.name.replace(FONT_EXT, "")),
  };
}

/** Pull the family name out of the `name` table so the preview and the menu
 *  show "IBM Plex Sans Arabic" rather than "IBM_Plex_Sans_Arabic-Regular". */
async function readFamilyName(bytes: Uint8Array): Promise<string> {
  const fontkit = await import("@pdf-lib/fontkit");
  const create = fontkit.default?.create ?? (fontkit as unknown as { create: (b: Uint8Array) => { familyName: string } }).create;
  const font = create(bytes);
  return String((font as unknown as { familyName: string }).familyName || "Custom font");
}

/** Register the uploaded font with the browser so the canvas preview can draw
 *  it. Returns a cleanup that unregisters it. */
const previewFaces = new Map<string, FontFace>();

export async function registerPreviewFont(custom: CustomFont): Promise<void> {
  if (typeof FontFace === "undefined" || previewFaces.has(custom.id)) return;
  const face = new FontFace(custom.family, custom.bytes.buffer as ArrayBuffer);
  await face.load();
  document.fonts.add(face);
  previewFaces.set(custom.id, face);
}

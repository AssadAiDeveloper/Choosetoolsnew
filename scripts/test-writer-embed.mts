// Focused test of the writer alone: several edits sharing ONE uploaded font
// must add exactly ONE embedded font program to the output, shared across
// every page, not a copy per edit or per page.
//
// Note: counting /Resources /Font keys is misleading — pdf-lib registers the
// same font object under a new key for each drawText call, so one program can
// appear as several keys. The meaningful figure is the number of distinct
// Font objects (and the FontFile stream each carries) in the output.
import { readFileSync, writeFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { PDFDocument, PDFName, type PDFDict } from "pdf-lib";
import { applyEdits } from "../src/lib/pdfEditWrite.ts";

const DIR = "C:\\Users\\sAssa\\AppData\\Local\\Temp\\opencode\\editor-e2e";
const original = readFileSync(`${DIR}\\fixture.pdf`);
const ab = original.buffer.slice(original.byteOffset, original.byteOffset + original.byteLength);

const custom = {
  id: "test-dubai",
  family: "Dubai",
  bytes: new Uint8Array(readFileSync("C:\\Windows\\Fonts\\DUBAI-REGULAR.TTF")),
};

const results: boolean[] = [];
const check = (n: string, pass: boolean, d = "") => {
  results.push(pass);
  console.log(`${pass ? "PASS" : "FAIL"}  ${n}${d ? " :: " + d : ""}`);
};

/** Distinct font objects per page (unique indirect refs) and the document-wide
 *  count of embedded font programs (objects that carry a FontFile stream). */
function analyze(bytes: Uint8Array) {
  return PDFDocument.load(bytes, { updateMetadata: false }).then((out) => {
    const pageFonts: Record<number, { ref: string; base: string; embedded: boolean }[]> = {};
    out.getPages().forEach((page, i) => {
      const res = page.node.Resources();
      const fonts = res ? res.lookup(PDFName.of("Font")) : undefined;
      if (!fonts) return;
      const seenRefs = new Map<string, { base: string; embedded: boolean }>();
      for (const [, v] of fonts.entries()) {
        if (!(v as { toString: () => string }).toString) continue;
        const refKey = (v as unknown as { toString(): string }).toString();
        if (seenRefs.has(refKey)) continue;
        const fontDict = out.context.lookup(v) as PDFDict | undefined;
        if (!fontDict || typeof fontDict.get !== "function") continue;
        let base = "?";
        try {
          base = fontDict.get(PDFName.of("BaseFont")).decodeText();
        } catch {}
        seenRefs.set(refKey, { base, embedded: descriptorHasFontProgram(out, fontDict) });
      }
      pageFonts[i + 1] = [...seenRefs.values()];
    });

    let programs = 0;
    for (const [, obj] of out.context.enumerateIndirectObjects()) {
      if (!obj || typeof (obj as { get: () => unknown }).get !== "function") continue;
      try {
        if (
          (obj as PDFDict).get(PDFName.of("FontFile2")) ||
          (obj as PDFDict).get(PDFName.of("FontFile3")) ||
          (obj as PDFDict).get(PDFName.of("FontFile"))
        ) {
          programs++;
        }
      } catch {}
    }
    return { pageFonts, programs };
  });
}

function descriptorHasFontProgram(out: ReturnType<typeof PDFDocument["create"]>, fontDict: PDFDict): boolean {
  try {
    const candidates: PDFDict[] = [];
    // /DescendantFonts is an array (possibly indirect) inside a Type0 dict;
    // the FontDescriptor with the FontFile lives on the first descendant.
    const descRef = fontDict.get(PDFName.of("DescendantFonts"));
    if (descRef) {
      const arr = out.context.lookup(descRef) as unknown as PDFDict;
      const first = arr && typeof arr.get === "function" ? (out.context.lookup(arr.get(0)) as PDFDict) : undefined;
      if (first && typeof first.get === "function") candidates.push(first);
    }
    candidates.push(fontDict);
    for (const d of candidates) {
      const fdRef = d.get(PDFName.of("FontDescriptor"));
      if (!fdRef) continue;
      const fd = out.context.lookup(fdRef) as PDFDict | undefined;
      if (!fd || typeof fd.get !== "function") continue;
      if (fd.get(PDFName.of("FontFile2")) || fd.get(PDFName.of("FontFile3")) || fd.get(PDFName.of("FontFile"))) return true;
    }
    return false;
  } catch {
    return false;
  }
}

const before = await analyze(ab);
console.log("BEFORE (fixture):");
for (const [page, fonts] of Object.entries(before.pageFonts)) {
  console.log(`  page ${page}: ${fonts.map((f) => `${f.ref}=${f.base}${f.embedded ? "[embedded]" : ""}`).join(", ")}`);
}
console.log(`  font programs document-wide: ${before.programs}`);

// Two edits — one on page 1 (Latin) and one on page 2 (Arabic) — powered by
// the SAME custom font object. The writer must embed exactly one program and
// reuse it for both.
const latinRun = {
  id: "p1-alpha",
  page: 1,
  text: "ALPHA-CORP LIMITED",
  x: 60, y: 700, width: 170, height: 15, angle: 0,
  box: { x: 58, y: 698, w: 174, h: 19 },
  rtl: false, parts: 1,
};
const arabicRun = {
  id: "p2-arabic",
  page: 2,
  text: "\u0641\u0627\u062a\u0648\u0631 \u0627\u0644\u0639\u0642\u062f 4455",
  x: 200, y: 700, width: 126.2, height: 20, angle: 0,
  box: { x: 198, y: 698, w: 130, h: 24 },
  rtl: true, parts: 1,
};

const outBytes = await applyEdits(ab, [
  { runId: latinRun.id, run: latinRun, text: "NEW HEADING TEXT", font: { kind: "custom", custom }, size: 15, color: "#111111", bold: false, italic: false, coverColor: "#ffffff", align: "start" },
  { runId: arabicRun.id, run: arabicRun, text: "\u0639\u0642\u062f \u062c\u062f\u064a\u062f 9911", font: { kind: "custom", custom }, size: 20, color: "#111111", bold: false, italic: false, coverColor: "#ffffff", align: "start" },
]);

const after = await analyze(outBytes);
writeFileSync(`${DIR}\\written-out.pdf`, outBytes);
console.log("AFTER (two edits, one uploaded font):");
for (const [page, fonts] of Object.entries(after.pageFonts)) {
  console.log(`  page ${page}: ${fonts.map((f) => `${f.ref}=${f.base}${f.embedded ? "[embedded]" : ""}`).join(", ")}`);
}
console.log(`  font programs document-wide: ${after.programs}`);

// The new face is the one that was not in the fixture. Find its names.
const beforeBases = new Set(Object.values(before.pageFonts).flat().map((f) => f.base));
const newFonts = Object.values(after.pageFonts).flat().filter((f) => !beforeBases.has(f.base));

check("new face appears on BOTH edited pages", after.pageFonts[1]!.some((f) => !beforeBases.has(f.base)) && after.pageFonts[2]!.some((f) => !beforeBases.has(f.base)), "pages share a new resource name");
check("exactly one new font PROGRAM is embedded", after.programs - before.programs === 1, `programs ${before.programs} -> ${after.programs}`);
check("every new face object is embedded", newFonts.every((f) => f.embedded), JSON.stringify(newFonts.map((f) => f.base)));

const failed = results.filter((x) => !x).length;
console.log(`\n==== ${results.length - failed}/${results.length} passed ====`);
if (failed) process.exitCode = 1;

// ---------------- painted-order guard for RTL digit runs ----------------
// @pdf-lib/fontkit reverses the WHOLE glyph run for right-to-left scripts, so
// a digit/Latin token inside Arabic would come out mirrored on paper ("9911"
// painting as "1199"). The writer pre-reverses those tokens so the final
// painted order is exactly what was typed. Verify the paint order from the
// actual content stream + /ToUnicode of the produced file.
function unicodeFor(out: ReturnType<typeof PDFDocument["create"]>, fontDict: PDFDict): Map<number, string> {
  const map = new Map<number, string>();
  const tu = out.context.lookup(fontDict.get(PDFName.of("ToUnicode")) as never);
  const rawBytes = tu && typeof (tu as unknown as { getContents: () => Uint8Array }).getContents === "function"
    ? Buffer.from((tu as unknown as { getContents: () => Uint8Array }).getContents())
    : Buffer.alloc(0);
  let raw: string;
  try {
    raw = inflateSync(rawBytes).toString("latin1");
  } catch {
    raw = rawBytes.toString("latin1");
  }
  const pairs = raw.match(/<([0-9a-fA-F]{1,4})>\s*<([0-9a-fA-F]+)>/g) ?? [];
  for (const p of pairs) {
    const m = p.match(/<([0-9a-fA-F]{1,4})>\s*<([0-9a-fA-F]+)>/);
    if (!m) continue;
    try {
      const hex = Buffer.from(m[2]!, "hex");
      const units: number[] = [];
      for (let i = 0; i + 1 < hex.length; i += 2) units.push(hex.readUInt16BE(i));
      map.set(Number.parseInt(m[1]!, 16), String.fromCharCode(...units));
    } catch {}
  }
  return map;
}

function inflateOrRaw(s: string): string {
  try {
    return inflateSync(Buffer.from(s, "latin1")).toString("latin1");
  } catch {
    return s;
  }
}

function streamBytesToLatin1(obj: unknown): string {
  const g = (obj as { getContents?: () => Uint8Array } | undefined)?.getContents?.();
  if (!g) return "";
  const b = Buffer.isBuffer(g) ? g : Buffer.from(g as Uint8Array);
  return b.toString("latin1");
}

/** Every possible (page-2 chunk, font) decode that contains Arabic. */
function paintedArabicDecodes(bytes: Uint8Array): string[] {
  return Promise.resolve(PDFDocument.load(bytes.slice(0), { updateMetadata: false })).then((out) => {
    const fonts: { base: string; map: Map<number, string> }[] = [];
    const res = out.getPage(1).node.Resources().lookup(PDFName.of("Font")) as PDFDict;
    for (const [, ref] of (res as unknown as { entries: () => [unknown, { toString: () => string }][] }).entries()) {
      const dict = out.context.lookup(ref as never) as PDFDict;
      try {
        const base = dict.get(PDFName.of("BaseFont")).decodeText();
        fonts.push({ base, map: unicodeFor(out, dict) });
      } catch {}
    }
    const contents = out.getPage(1).node.Contents();
    const isArray = contents && typeof (contents as { size: () => number }).size === "function";
    let raw = "";
    if (isArray) {
      for (let i = 0; i < (contents as { size: () => number }).size(); i++) {
        raw += inflateOrRaw(streamBytesToLatin1(out.context.lookup((contents as { get: (i: number) => unknown }).get(i) as never)));
      }
    } else {
      raw += inflateOrRaw(streamBytesToLatin1(contents));
    }
    const decodes: string[] = [];
    const re = /<([0-9a-fA-F\s]+)>\s*Tj/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(raw))) {
      const codes = (m[1]!.replace(/\s+/g, "").match(/.{4}/g) ?? []).map((c) => c.toUpperCase());
      for (const f of fonts) {
        const chars = codes.map((c) => f.map.get(Number.parseInt(c, 16)) ?? "?").join("");
        if (/[\u0600-\u06FF]/.test(chars)) decodes.push(chars);
      }
    }
    return decodes;
  });
}

const painted = await paintedArabicDecodes(outBytes);
const correct = "9911 \u062f\u064a\u062f\u062c \u062f\u0642\u0639"; // "9911 ديدج دقع" (visual, digits as typed)
const buggy = "1199 \u062f\u064a\u062f\u062c \u062f\u0642\u0639"; // "1199 ..." (mirrored digits)
check("edited RTL line paints digits in typed order (9911, not 1199)", painted.includes(correct), `painted=${JSON.stringify(painted)}`);
check("no painted line shows the mirrored digits", !painted.some((p) => p.includes(buggy)), "seen: " + painted.filter((p) => p.includes("11") || p.includes("99")).join(" | "));

const failedAll = results.filter((x) => !x).length;
console.log(`\n==== ${results.length - failedAll}/${results.length} passed ====`);
if (failedAll) process.exitCode = 1;
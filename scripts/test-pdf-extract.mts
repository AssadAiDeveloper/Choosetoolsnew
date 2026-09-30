// Generates real PDFs and runs the actual extraction algorithm over them.
// Run: npx tsx scripts/test-pdf-extract.ts
import { writeFileSync, mkdirSync } from "node:fs";

// pdf.mjs assumes a modern runtime; Node 20 has no Promise.withResolvers.
if (!(Promise as any).withResolvers) {
  (Promise as any).withResolvers = function () {
    let resolve!: (v: unknown) => void, reject!: (e: unknown) => void;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
  };
}

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { glyphsToGrid, coerce, type Glyph } from "../src/lib/pdfTableExtract";
import { pageBlocks } from "../src/lib/pdfBlocks";

const OUT = "C:/Users/sAssa/AppData/Local/Temp/opencode/pdftest";
mkdirSync(OUT, { recursive: true });

interface Row { y: number; cells: { x: number; text: string; size: number }[] }

async function makePdf(name: string, rows: Row[], width = 595) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([width, 842]);
  for (const row of rows) {
    for (const c of row.cells) {
      page.drawText(c.text, { x: c.x, y: row.y, size: c.size, font, color: rgb(0, 0, 0) });
    }
  }
  const bytes = await doc.save();
  writeFileSync(`${OUT}/${name}.pdf`, bytes);
  return `${OUT}/${name}.pdf`;
}

// Mirror what PdfToExcel does: pull glyphs out of the text layer.
async function glyphsFromPdf(path: string) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { readFileSync } = await import("node:fs");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(path)) }).promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  const glyphs: Glyph[] = [];
  for (const item of content.items as any[]) {
    if (!item.str || !item.str.trim()) continue;
    const x = item.transform[4];
    const y = item.transform[5];
    glyphs.push({
      text: item.str, x, y, right: x + (item.width || 0),
      h: Math.abs(item.height) || 8, rtl: false, eol: item.hasEOL === true,
    });
  }
  return glyphs;
}

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  const ok = a === e;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) { console.log(`   expected ${e}`); console.log(`   actual   ${a}`); }
}

// ── 1. clean 3x4 table with numbers ───────────────────────────────────────
const clean: Row[] = [];
let y = 780;
for (const line of [
  ["Item", "Qty", "Price", "Total"],
  ["Apple", "10", "1,250.00", "12500.00"],
  ["Banana", "5", "2,50", "12.50"],
  ["Orange", "20", "3.75", "75.00"],
]) {
  clean.push({ y, cells: [0, 90, 200, 320].map((x, i) => ({ x, text: line[i], size: 10 })) });
  y -= 20;
}
const p1 = await makePdf("clean", clean);
const g1 = await glyphsFromPdf(p1);
const r1 = glyphsToGrid(g1);
check("clean: 4 rows", r1.rows.length, 4);
check("clean: 4 cols", r1.rows[0].length, 4);
check("clean: tabular", r1.tabular, true);
check("clean: row0", r1.rows[0].map(c => c.text), ["Item", "Qty", "Price", "Total"]);
check("clean: row1", r1.rows[1].map(c => c.text), ["Apple", "10", "1,250.00", "12500.00"]);
check("clean: coerce 12500.00", coerce("12500.00"), 12500);
check("clean: coerce 1,250.00", coerce("1,250.00"), 1250);
check("clean: coerce 2,50 (eu)", coerce("2,50"), 2.5);
check("clean: coerce id stays text", coerce("2024-001"), "2024-001");

// -- 1b. the Word target: the same page must yield one table, not prose --
const b1 = pageBlocks(g1);
check("clean: 1 table block", b1.filter((b) => b.kind === "table").length, 1);
check("clean: no paragraphs", b1.filter((b) => b.kind === "paragraph").length, 0);
const t1 = b1.find((b) => b.kind === "table");
check("clean: table row0", t1 && t1.rows[0], ["Item", "Qty", "Price", "Total"]);
check("clean: table is 4x4", t1 && t1.rows.length, 4);
check("clean: table row1", t1 && t1.rows[1], ["Apple", "10", "1,250.00", "12500.00"]);

// ── 2. table where a cell is empty (gap must not create a column) ─────────
const gap: Row[] = [];
y = 780;
for (const line of [
  ["A", "B", "C"],
  ["1", "", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
]) {
  gap.push({ y, cells: [0, 120, 260].map((x, i) => (line[i] ? { x, text: line[i], size: 10 } : { x, text: "", size: 10 })).filter(c => c.text) });
  y -= 20;
}
const p2 = await makePdf("gap", gap);
const r2 = glyphsToGrid(await glyphsFromPdf(p2));
check("gap: 4 rows", r2.rows.length, 4);
check("gap: 3 cols (not 4)", r2.rows[0].length, 3);
check("gap: empty cell preserved", r2.rows[1][1].text, "");
check("gap: row2 aligned", r2.rows[2].map(c => c.text), ["4", "5", "6"]);

// ── 3. wide gap that IS a column boundary ────────────────────────────────
const wide = await makePdf("wide", [
  { y: 780, cells: [{ x: 0, text: "Left", size: 10 }, { x: 400, text: "Right", size: 10 }] },
  { y: 760, cells: [{ x: 0, text: "alpha", size: 10 }, { x: 400, text: "beta", size: 10 }] },
  { y: 740, cells: [{ x: 0, text: "gamma", size: 10 }, { x: 400, text: "delta", size: 10 }] },
]);
const r3 = glyphsToGrid(await glyphsFromPdf(wide));
check("wide: 2 cols", r3.rows[0].length, 2);
check("wide: values", r3.rows[1].map(c => c.text), ["alpha", "beta"]);

// ── 4. multiline cell: a row whose text wraps onto the next line ──────────
const multi = await makePdf("multi", [
  { y: 780, cells: [{ x: 0, text: "Name", size: 10 }, { x: 200, text: "Qty", size: 10 }] },
  { y: 760, cells: [{ x: 0, text: "Very long", size: 10 }, { x: 200, text: "7", size: 10 }] },
  { y: 748, cells: [{ x: 0, text: "description", size: 10 }] },
  { y: 728, cells: [{ x: 0, text: "Short", size: 10 }, { x: 200, text: "2", size: 10 }] },
]);
const r4 = glyphsToGrid(await glyphsFromPdf(multi));
check("multi: 4 visual lines", r4.rows.length, 4);
check("multi: 2 cols", r4.rows[0].length, 2);
check("multi: wrapped line has no qty", r4.rows[2][1].text, "");

// ── 5. prose, not a table (must be reported non-tabular) ──────────────────
const prose = await makePdf("prose", [
  { y: 780, cells: [{ x: 50, text: "This document explains the quarterly results", size: 11 }] },
  { y: 764, cells: [{ x: 50, text: "for the northern region in detail.", size: 11 }] },
  { y: 748, cells: [{ x: 50, text: "Revenue grew while costs stayed flat.", size: 11 }] },
]);
const r5 = glyphsToGrid(await glyphsFromPdf(prose));
check("prose: not tabular", r5.tabular, false);

// ── 6. two pages merged keep order ───────────────────────────────────────
console.log(`\ncoerce checks:`);
for (const [inp, exp] of [
  ["1,234.56", 1234.56], ["1.234,56", 1234.56], ["1.234", 1234], ["1234", 1234], ["12.5", 12.5],
  ["12%", 0.12], ["$1,500.00", 1500], ["-$250", -250], ["$99", 99], ["-", "-"], ["", null],
  ["  ", null], ["N/A", "N/A"], ["1-2", "1-2"], ["00700", "00700"], ["v1.2.3", "v1.2.3"],
  ["0.5", 0.5], ["€1.250,75", 1250.75], ["Item 12", "Item 12"],
  // Arabic-Indic and Extended Arabic-Indic digits, and the Arabic separators
  ["١٢٣٤", 1234], ["۱۲۳۴", 1234], ["١٢٫٥", 12.5], ["١٬٢٣٤", 1234],
  ["١٢٬٥٠٠٫٧٥", 12500.75], ["-٥٠٠", -500],
  // currency written after the number, as Arabic and RTL layouts write it
  ["1500.00 ر.س", 1500], ["١٢٥٠ د.إ", 1250], ["250 €", 250], ["-99.50 ر.س", -99.5],
  // bidi control marks must not defeat a parse
  ["\u200F١٢٣٤\u200C", 1234], ["\u200D18000", 18000],
  // an Arabic word next to digits stays text
  ["الإجمالي 1200", "الإجمالي 1200"], ["12 قطعة", "12 قطعة"],
] as [string, unknown][]) {
  const got = coerce(inp);
  const ok = got === exp;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  coerce(${JSON.stringify(inp)}) = ${JSON.stringify(got)}${ok ? "" : ` (expected ${JSON.stringify(exp)})`}`);
}

console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);

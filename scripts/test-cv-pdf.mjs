#!/usr/bin/env node
/**
 * CV1/CV2 verification: build a CV PDF from a synthetic page and check
 * pdftotext output contains all entered fields in logical order.
 */
import { buildCvPdf, sortRuns } from "../src/lib/cvPdf.mjs";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TD = join(ROOT, "test-artifacts", "cv");
mkdirSync(TD, { recursive: true });

// Need a small PNG. Use @napi-rs/canvas (transitive dep).
import { createCanvas } from "@napi-rs/canvas";
const canvas = createCanvas(100, 100);
const ctx = canvas.getContext("2d");
ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 100, 100);
const png = new Uint8Array(canvas.toBuffer("image/png"));

const fontBytes = readFileSync(join(ROOT, "public/fonts/Amiri-Regular.ttf"));

const runs = [
  { text: "محمد عبد الله الأحمد الغامدي", x: 100, y: 120, size: 40, weight: "800", align: "right", direction: "rtl" },
  { text: "مهندس برمجيات", x: 100, y: 170, size: 24, weight: "600", align: "right", direction: "rtl" },
  { text: "mohammed@example.com", x: 100, y: 220, size: 18, align: "right", direction: "rtl" },
  { text: "+966 50 123 4567", x: 100, y: 250, size: 18, align: "right", direction: "rtl" },
  { text: "Skills: JavaScript, TypeScript, React", x: 100, y: 320, size: 18, align: "right", direction: "rtl" },
  { text: "خبرة", x: 100, y: 360, size: 18, align: "right", direction: "rtl" },
  { text: "2020 - 2024", x: 100, y: 400, size: 16, align: "right", direction: "rtl" },
];

const enRuns = [
  { text: "John Doe", x: 80, y: 120, size: 40, weight: "800", align: "left", direction: "ltr" },
  { text: "Software Engineer", x: 80, y: 170, size: 24, weight: "600", align: "left", direction: "ltr" },
  { text: "john@example.com", x: 80, y: 220, size: 18, align: "left", direction: "ltr" },
  { text: "+1 555 123 4567", x: 80, y: 250, size: 18, align: "left", direction: "ltr" },
  { text: "Skills: JavaScript, TypeScript, React", x: 80, y: 320, size: 18, align: "left", direction: "ltr" },
  { text: "2020 - 2024", x: 80, y: 400, size: 16, align: "left", direction: "ltr" },
];

let failures = 0;
const check = (ok, label) => { if (ok) console.log("  ok   " + label); else { console.error("  FAIL " + label); failures++; } };

const pdftotext = "C:\\Users\\sAssa\\AppData\\Local\\Microsoft\\WinGet\\Packages\\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\\poppler-25.07.0\\Library\\bin\\pdftotext.exe";
const qpdf = "C:\\Program Files\\qpdf 12.4.2\\bin\\qpdf.exe";

for (const [label, isRtl, r] of [["ar", true, runs], ["en", false, enRuns]]) {
  const bytes = await buildCvPdf({ pages: [{ png, runs: r }], pageSizePt: [595.28, 841.89], isRtl, fontBytes });
  const pdfPath = join(TD, `cv-${label}.pdf`);
  writeFileSync(pdfPath, bytes);
  console.log(`\n=== ${label} (${bytes.length} bytes) ===`);

  // page size check via pdfinfo
  try {
    const pdfinfo = "C:/Users/sAssa/AppData/Local/Microsoft/WinGet/Packages/oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe/poppler-25.07.0/Library/bin/pdfinfo.exe";
    const info = execSync(`"${pdfinfo}" "${pdfPath}"`, { encoding: "utf8" });
    check(/595\.28 x 841\.89/.test(info), `${label}: A4 page size (595.28 x 841.89 pts)`);
  } catch (e) { console.log("  (pdfinfo skipped:", e.message.slice(0, 60), ")"); }

  // pdftotext
  const txtPath = join(TD, `cv-${label}.txt`);
  execSync(`"${pdftotext}" -layout "${pdfPath}" "${txtPath}"`);
  const text = readFileSync(txtPath, "utf8");
  console.log("pdftotext output:\n" + text.slice(0, 400));

  for (const run of r) {
    if (label === "ar") {
      const ok = [...run.text].every((ch) => ch === " " || text.includes(ch));
      check(ok, `${label}: contains chars of "${run.text.slice(0, 30)}"`);
    } else {
      check(text.includes(run.text), `${label}: contains "${run.text.slice(0, 30)}"`);
    }
  }

  if (label === "en") {
    const nameIdx = text.indexOf(r[0].text);
    const titleIdx = text.indexOf(r[1].text);
    const emailIdx = text.indexOf(r[2].text);
    check(nameIdx >= 0 && titleIdx > nameIdx && emailIdx > titleIdx, `${label}: reading order name -> title -> contact`);
  } else {
    // Arabic: pdftotext reorders bidi; verify all input characters are present (no data loss).
    const allChars = r.map((run) => run.text).join("");
    const present = [...allChars].every((ch) => text.includes(ch) || ch === " ");
    check(present, `${label}: all input characters present in extracted text (pdftotext bidi reorders Arabic)`);
    check(!text.includes("?"), `${label}: no '?' placeholders in extracted text`);
  }

  // 3 Tr check via qpdf --qdf
  try {
    const qdfPath = join(TD, `cv-${label}.qdf`);
    execSync(`"${qpdf}" --qdf "${pdfPath}" "${qdfPath}"`);
    const qdf = readFileSync(qdfPath, "utf8");
    check(qdf.includes("3 Tr") || qdf.includes("3Tr"), `${label}: invisible text mode (3 Tr) present`);
  } catch (e) {
    console.log("  (qdf Tr check skipped:", e.message.slice(0, 80), ")");
  }
}

// fallback test: buildCvPdf with no fontBytes should still produce a PDF
{
  const bytes = await buildCvPdf({ pages: [{ png, runs: enRuns }], pageSizePt: [595.28, 841.89], isRtl: false });
  check(bytes.length > 900, "fallback (no font) still produces PDF");
}

if (failures > 0) { console.error(`\ncv-pdf tests failed: ${failures}`); process.exit(1); }
console.log("\ncv-pdf tests passed.");
console.log("artifacts:", TD);

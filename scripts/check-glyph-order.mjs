// Decides whether the reversed digit run is only an extraction artefact or is
// actually drawn reversed, by reading the per-item transforms (x position and
// advance) of the digits as laid out on the page.
import { readFileSync } from "node:fs";

if (typeof Promise.withResolvers !== "function") {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
  };
}

const DIR = "C:\\Users\\sAssa\\AppData\\Local\\Temp\\opencode\\editor-e2e";
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

for (const [label, file] of [["fixture (drawn by pdf-lib, not the editor)", "fixture.pdf"], ["edited (editor output)", "edited.pdf"]]) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(`${DIR}\\${file}`)) }).promise;
  const page = await doc.getPage(2);
  const tc = await page.getTextContent();
  console.log(`\n=== ${label} ===`);
  for (const it of tc.items) {
    const t = it.str;
    if (!t || !t.trim()) continue;
    const [a, b, c, d, e, f] = it.transform;
    const isDigit = /^\d+$/.test(t.trim());
    const isArabic = /[\u0600-\u06FF]/.test(t);
    if (!isDigit && !isArabic) continue;
    console.log(
      `${isDigit ? "DIGIT" : "ARABIC"}  str=${JSON.stringify(t)}  x=${e.toFixed(1)} y=${f.toFixed(1)} w=${it.width.toFixed(1)}`
    );
  }
}

// Is the reversed digit run caused by the editor, or is it inherent to embedding
// a subset RTL font with fontkit? The fixture was drawn with plain pdf-lib, so
// if it shows the same reversal the editor is faithful to pdf-lib's behaviour.
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

async function page2Text(file) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(file)) }).promise;
  const p = await doc.getPage(2);
  const tc = await p.getTextContent();
  return tc.items.map((i) => i.str).join(" ").replace(/\s+/g, " ");
}

// What each file was *authored* to contain.
const authored = "فاتور العقد 4455";
// What each file yields when the text is read back.
const out = {};
out.fixture = await page2Text(`${DIR}\\fixture.pdf`);
out.edited = await page2Text(`${DIR}\\edited.pdf`);

console.log("authored :", authored);
console.log("fixture  :", out.fixture);
console.log("edited   :", out.edited);

// The Arabic word order should be identical; only the digits differ, and they
// should differ the same way in both.
const arWord = (s) => (s.match(/[\u0600-\u06FF]+/g) || []).join("|");
const digits = (s) => (s.match(/\d+/g) || []).join(",");

console.log("\nfixture words == edited words :", arWord(out.fixture) === arWord(out.edited));
console.log("fixture digits               :", digits(out.fixture), "(authored 4455)");
console.log("edited digits                :", digits(out.edited), "(authored 4455, edited to 9911)");

// The editor wrote 9911. If pdf-lib/fontkit reverses any digit run the same way
// it reversed the fixture's own 4455, the behaviour is inherited, not new.
const fixtureReversed = digits(out.fixture).includes("5544");
console.log("\nfixture's own digits reversed by fontkit round-trip:", fixtureReversed);
console.log(
  "=> verdict:",
  fixtureReversed
    ? "reversal is inherent to pdf-lib/fontkit subset embedding, present before the editor runs"
    : "reversal is introduced by the editor and must be fixed",
);

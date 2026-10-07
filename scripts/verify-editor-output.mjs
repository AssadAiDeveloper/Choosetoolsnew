// Text-level assertion on the PDF the editor produced. Confirms the edits
// really landed in the file, that untouched blocks survived, and that the
// custom font was embedded rather than silently dropped.
import { readFileSync, writeFileSync } from "node:fs";

// pdf.js v5 needs Promise.withResolvers, which landed in Node 22.
if (typeof Promise.withResolvers !== "function") {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

const DIR = "C:\\Users\\sAssa\\AppData\\Local\\Temp\\opencode\\editor-e2e";
const bytes = readFileSync(`${DIR}\\edited.pdf`);

const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? " :: " + detail : ""}`);
};

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes), useSystemFonts: false }).promise;

const perPage = [];
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const tc = await page.getTextContent();
  perPage.push(tc.items.map((i) => i.str).join(" "));
}
const all = perPage.join(" ").replace(/\s+/g, " ");

check("both pages kept", doc.numPages === 2, `pages=${doc.numPages}`);
check("edited latin text is in the file", all.includes("ZETA-HOLDING PLC"), perPage[0].slice(0, 160));
// pdf.js reverses a trailing digit run when reading back a fontkit subset, which
// the untouched fixture shows too, so compare on the Arabic words.
check("edited arabic text is in the file", all.includes("عقد جديد"), perPage[1].slice(0, 160));
check("untouched block survived", all.includes("Footer reference ZZTOP-99"));
check("other untouched block survived", all.includes("Invoice Number 2291"));
check("original latin text is still on the page (cover-and-redraw)", all.includes("ALPHA-CORP LIMITED"));

// pdf-lib writes object streams, so a raw byte scan cannot see the font
// dictionaries. Walk the parsed object graph instead and report every font the
// output actually embeds, with the stream kinds of each font descriptor.
const { PDFDocument: PLD, PDFFont } = await import("pdf-lib");
const parsed = await PLD.load(bytes, { updateMetadata: false });

const fontInfo = [];
for (const [, obj] of parsed.context.enumerateIndirectObjects()) {
  if (!(obj instanceof PDFFont)) continue;
  let name = "?";
  try { name = obj.getFontName().decodeText(); } catch {}
  const embedded = typeof obj.getFontFile === "function" && !!obj.getFontFile();
  const subtype = (() => {
    try {
      const fd = obj.getFontDescriptor();
      return fd ? String(fd.get("Subtype")) : "?";
    } catch { return "?"; }
  })();
  fontInfo.push({ name, embedded, subtype });
}
for (const f of fontInfo) {
  console.log(`  font ${f.name}  embedded=${f.embedded}  descriptor=${f.subtype}`);
}
const custom = fontInfo.filter((f) => f.embedded);
check("an embedded (uploaded) font is present in the output", custom.length > 0,
  custom.map((f) => f.name).join(", ") || "none");
check("font subsets carry a tag prefix", fontInfo.some((f) => /^[A-Z]{6}\+/.test(f.name)),
  fontInfo.map((f) => f.name).join(", "));

writeFileSync(`${DIR}\\extracted.txt`, perPage.join("\n\n---\n\n"), "utf8");
console.log("\nPAGE 1: " + perPage[0].slice(0, 300));
console.log("\nPAGE 2: " + perPage[1].slice(0, 300));

const failed = results.filter((r) => !r.pass);
console.log(`\n==== ${results.length - failed.length}/${results.length} passed ====`);
if (failed.length) process.exitCode = 1;

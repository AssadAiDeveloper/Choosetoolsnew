// Fixture for the PDF Editor E2E: a 2-page file with known text so the test can
// assert the editor found every block and that an edit landed in the output.
// Page 1 is Latin, page 2 is Arabic (needs a custom font to edit properly).
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const out = process.argv[2];
mkdirSync(out.split("\\").slice(0, -1).join("\\"), { recursive: true });

const doc = await PDFDocument.create();
doc.registerFontkit(fontkit);

// Page 1 — Latin, wide margins so a cover rectangle cannot reach other blocks.
const p1 = doc.addPage([595.28, 841.89]);
const times = await doc.embedFont(StandardFonts.TimesRoman);
const helv = await doc.embedFont(StandardFonts.Helvetica);

p1.drawText("Invoice Number 2291", {
  x: 60, y: 760, size: 22, font: times, color: rgb(0.1, 0.1, 0.35),
});
p1.drawText("ALPHA-CORP LIMITED", {
  x: 60, y: 700, size: 15, font: helv, color: rgb(0, 0, 0),
});
p1.drawText("Total Due: 4,820.00 USD", {
  x: 60, y: 660, size: 13, font: helv, color: rgb(0, 0, 0),
});
p1.drawText("Payment terms net thirty days from issue.", {
  x: 60, y: 620, size: 10, font: times, color: rgb(0.2, 0.2, 0.2),
});
// A line far from everything else, to prove blocks are not merged across the page.
p1.drawText("Footer reference ZZTOP-99", {
  x: 60, y: 60, size: 9, font: helv, color: rgb(0.4, 0.4, 0.4),
});

// Page 2 — Arabic. Needs a real TTF: the standard-14 WinAnsi faces cannot
// encode Arabic at all, which pdf-lib rejects outright.
const p2 = doc.addPage([595.28, 841.89]);
const arabicBytes = readFileSync("C:\\Windows\\Fonts\\DUBAI-REGULAR.TTF");
const arabic = await doc.embedFont(arabicBytes, { subset: true });

const a1 = "\u0641\u0627\u062a\u0648\u0631 \u0627\u0644\u0639\u0642\u062f 4455";
const a2 = "\u0627\u0644\u0645\u0634\u0631\u0643 \u0627\u0644\u0623\u0633\u0627\u0633\u064a \u2014 \u0645\u0643\u062a\u0628 \u0627\u0644\u0623\u0633\u0645\u0627\u0639";
console.log("page2 widths:", arabic.widthOfTextAtSize(a1, 20).toFixed(1), arabic.widthOfTextAtSize(a2, 14).toFixed(1));
p2.drawText(a1, { x: 200, y: 700, size: 20, font: arabic, color: rgb(0, 0, 0) });
p2.drawText(a2, { x: 150, y: 660, size: 14, font: arabic, color: rgb(0, 0, 0) });

writeFileSync(out, await doc.save());
console.log("fixture written:", out);

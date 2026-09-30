// Builds a realistic "scanned" PDF: a full A4 page of HTML rendered at 300dpi
// (scale 4.166), then embedded as the only page content (no text layer).
// Run: npx tsx scripts/make-scanned-pdf.mts
import { writeFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const puppeteer = require("C:/Users/sAssa/AppData/Local/Temp/opencode/browserdeps/node_modules/puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "C:/Users/sAssa/AppData/Local/Temp/opencode/pdftest";

// A4 at 300dpi => ~2480 x 3508 px. 96dpi CSS px * 3.125 = 300dpi px.
const CSS_W = 794; // A4 width in CSS px at 96dpi
const CSS_H = 1123;
const DPI_SCALE = 3.125;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body { margin:0; width:${CSS_W}px; min-height:${CSS_H}px; padding:56px 48px;
         font-family: Arial, Helvetica, sans-serif; background:#fff; color:#000; }
  h1 { font-size:30px; margin:0 0 8px; }
  .sub { font-size:15px; color:#333; margin:0 0 30px; }
  table { border-collapse:collapse; width:100%; }
  th, td { border:2px solid #000; padding:14px 16px; font-size:20px; text-align:left; }
  th { background:#dcdcdc; }
  td.num { text-align:right; }
</style></head><body>
  <h1>Sales Report</h1>
  <p class="sub">Quarter 1 &mdash; All Regions</p>
  <table>
    <tr><th>Product</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr>
    <tr><td>Monitor</td><td class="num">12</td><td class="num">1500.00</td><td class="num">18000.00</td></tr>
    <tr><td>Keyboard</td><td class="num">40</td><td class="num">250.00</td><td class="num">10000.00</td></tr>
    <tr><td>Mouse</td><td class="num">35</td><td class="num">120.00</td><td class="num">4200.00</td></tr>
    <tr><td>Dock</td><td class="num">8</td><td class="num">89.99</td><td class="num">719.92</td></tr>
    <tr><td>Webcam</td><td class="num">25</td><td class="num">45.00</td><td class="num">1125.00</td></tr>
  </table>
  <p class="sub" style="margin-top:30px">Prepared by the accounts department.</p>
</body></html>`;

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: "new", args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: CSS_W, height: CSS_H, deviceScaleFactor: DPI_SCALE });
await page.setContent(html, { waitUntil: "networkidle0" });
const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: CSS_W, height: CSS_H } });
await browser.close();

writeFileSync(`${OUT}/scan-source.png`, png);

const doc = await PDFDocument.create();
const img = await doc.embedPng(png);
const PAGE_W = 595.28, PAGE_H = 841.89; // real A4 in points
const pdfPage = doc.addPage([PAGE_W, PAGE_H]);
// Full-bleed image, exactly like a flatbed scan.
pdfPage.drawImage(img, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
const bytes = await doc.save();
writeFileSync(`${OUT}/scanned.pdf`, bytes);

console.log(`source png: ${(png.length / 1024).toFixed(1)} KB (${CSS_W * DPI_SCALE}x${CSS_H * DPI_SCALE})`);
console.log(`scanned.pdf: ${(bytes.length / 1024).toFixed(1)} KB — full A4, image only, no text layer`);

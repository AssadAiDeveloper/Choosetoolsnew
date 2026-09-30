// Builds a full-bleed scanned-style Arabic PDF (image only, no text layer) so
// the OCR path can be exercised on a right-to-left document, not just English.
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";

const require = createRequire(import.meta.url);
const puppeteer = require("C:/Users/sAssa/AppData/Local/Temp/opencode/browserdeps/node_modules/puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "C:/Users/sAssa/AppData/Local/Temp/opencode/pdftest";

mkdirSync(OUT, { recursive: true });

const CSS_W = 794; // A4 width in CSS px at 96dpi
const CSS_H = 1123;
const DPI_SCALE = 3.125;

const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body { margin:0; width:${CSS_W}px; min-height:${CSS_H}px; padding:56px 48px;
         font-family: "Segoe UI", "Arial", "Tahoma", sans-serif; background:#fff; color:#000; }
  h1 { font-size:30px; margin:0 0 8px; }
  .sub { font-size:15px; color:#333; margin:0 0 30px; }
  table { border-collapse:collapse; width:100%; }
  th, td { border:2px solid #000; padding:14px 16px; font-size:20px; text-align:right; }
  th { background:#dcdcdc; }
</style></head><body>
  <h1>تقرير المبيعات</h1>
  <p class="sub">الربع الأول &mdash; جميع المناطق</p>
  <table>
    <tr><th>المنتج</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr>
    <tr><td>شاشة</td><td>12</td><td>1500.00</td><td>18000.00</td></tr>
    <tr><td>لوحة مفاتيح</td><td>40</td><td>250.00</td><td>10000.00</td></tr>
    <tr><td>فأرة</td><td>35</td><td>120.00</td><td>4200.00</td></tr>
    <tr><td>قاعدة</td><td>8</td><td>89.99</td><td>719.92</td></tr>
    <tr><td>كاميرا</td><td>25</td><td>45.00</td><td>1125.00</td></tr>
  </table>
  <p class="sub" style="margin-top:30px">أعدّه قسم الحسابات.</p>
</body></html>`;

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: "new", args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: CSS_W, height: CSS_H, deviceScaleFactor: DPI_SCALE });
await page.setContent(html, { waitUntil: "networkidle0" });
const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: CSS_W, height: CSS_H } });
await browser.close();

writeFileSync(`${OUT}/scan-ar-source.png`, png);

const doc = await PDFDocument.create();
const img = await doc.embedPng(png);
const PAGE_W = 595.28, PAGE_H = 841.89; // real A4 in points
const pdfPage = doc.addPage([PAGE_W, PAGE_H]);
// Full-bleed image, exactly like a flatbed scan.
pdfPage.drawImage(img, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
const bytes = await doc.save();
writeFileSync(`${OUT}/scanned-ar.pdf`, bytes);

console.log(`source png: ${(png.length / 1024).toFixed(1)} KB (${CSS_W * DPI_SCALE}x${CSS_H * DPI_SCALE})`);
console.log(`scanned-ar.pdf: ${(bytes.length / 1024).toFixed(1)} KB — RTL, image only, no text layer`);

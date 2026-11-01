#!/usr/bin/env node
/**
 * Tests for the "Remove PDF Password" tool.
 *
 * What is covered here (no browser, no external tools):
 *   - /Encrypt detection on raw bytes
 *   - lossless re-save of an unencrypted PDF (output must not contain /Encrypt)
 *   - refusal to "succeed" on encrypted input (the original P0 bug)
 *   - clear failure on non-PDF input
 *
 * What is NOT covered here: the pdf.js raster-unlock path, which needs a real
 * browser canvas, and genuine AES-256/AES-128 fixtures. qpdf is not installed
 * in this environment; the QA commands to build those fixtures are in
 * AUDIT_FIX_REPORT.md (section T2) and the cases must be re-run there.
 */
import { PDFDocument, StandardFonts } from "pdf-lib";
import { hasEncryptDictionary, stripPdfPassword } from "../src/lib/pdfEncrypt.mjs";

let failures = 0;
function check(name, condition, detail) {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures++;
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const ascii = (s) => new TextEncoder().encode(s);

async function makePdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  page.drawText("Unlock fixture", { x: 72, y: 760, size: 18, font });
  return doc.save();
}

console.log("hasEncryptDictionary");
check("plain bytes are not encrypted", hasEncryptDictionary(ascii("hello world")) === false);
check("empty input is not encrypted", hasEncryptDictionary(new Uint8Array(0)) === false);
check("/Encrypt token is detected", hasEncryptDictionary(ascii("trailer <</Encrypt 4 0 R>>")) === true);

const plain = await makePdf();
check("pdf-lib output has no /Encrypt", hasEncryptDictionary(plain) === false);

console.log("\nstripPdfPassword — unencrypted input");
{
  const r = await stripPdfPassword(plain);
  check("returns ok", r.ok === true, JSON.stringify(r));
  if (r.ok) {
    check("output has no /Encrypt", hasEncryptDictionary(r.bytes) === false);
    const reload = await PDFDocument.load(r.bytes);
    check("output is a readable PDF", reload.getPageCount() === 1);
  }
}

console.log("\nstripPdfPassword — encrypted input (regression: must not return a file)");
{
  // Append an /Encrypt reference to a valid PDF: enough for the detector and
  // for the guard, without needing qpdf to build a real AES fixture.
  const encrypted = new Uint8Array([...plain, ...ascii("\ntrailer <</Encrypt 4 0 R>>")]);
  const r = await stripPdfPassword(encrypted);
  check("returns failure", r.ok === false, JSON.stringify(r));
  check("reason is 'encrypted'", r.ok === false && r.reason === "encrypted", JSON.stringify(r));
}

console.log("\nstripPdfPassword — invalid input");
{
  const r = await stripPdfPassword(ascii("this is not a pdf"));
  check("returns failure", r.ok === false, JSON.stringify(r));
  check("reason is 'error'", r.ok === false && r.reason === "error", JSON.stringify(r));
}

console.log("\nSKIPPED (needs qpdf, not installed): AES-256 user password, AES-128 owner password.");
console.log("  qpdf --encrypt '' owner 256 -- input.pdf encrypted-owner.pdf");
console.log("  qpdf --encrypt user owner 256 -- input.pdf encrypted-user.pdf");

if (failures > 0) {
  console.error(`\nprotect-pdf tests failed: ${failures} failure(s).`);
  process.exit(1);
}
console.log("\nprotect-pdf tests passed.");

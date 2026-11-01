#!/usr/bin/env node
/**
 * T6 guard: the invoice generator advertises 27 currencies and prints through
 * the browser (so the saved PDF keeps real, selectable text).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["en", "ar", "de", "es", "fr", "hi", "id", "nl", "pt", "ru", "tr"];

let failures = 0;
const check = (ok, label) => {
  if (ok) {
    console.log(`  ok   ${label}`);
  } else {
    console.error(`  FAIL ${label}`);
    failures++;
  }
};

// 1. The picker really offers 27 currencies.
const tsx = readFileSync(join(ROOT, "src/components/tools/InvoiceGenerator.tsx"), "utf8");
const block = /const CURRENCIES[\s\S]*?=\s*\{([\s\S]*?)\n\};/.exec(tsx);
if (!block) {
  console.error("  FAIL could not locate the CURRENCIES map");
  process.exit(1);
}
const codes = [...block[1].matchAll(/\b([A-Z]{3})\s*:/g)].map((m) => m[1]);
check(new Set(codes).size === 27, `CURRENCIES offers 27 currencies (found ${new Set(codes).size})`);

// 2. Export goes through the print dialog, not a .html/.pdf download.
check(/const printInvoice\s*=\s*\(/.test(tsx), "printInvoice() exists");
check(/frameWin\.print\(\)/.test(tsx), "printInvoice() calls window.print()");
check(/onClick=\{printInvoice\}/.test(tsx), "the primary button calls printInvoice");
check(!/onClick=\{download\}/.test(tsx), "the old download() button is gone");
check(/printSavePdf/.test(tsx), "the button label key is printSavePdf");

// 3. Copy in every locale: 27 currencies, selectable text, no "not selectable".
const NEGATIVE = [
  "not selectable",
  "nicht auswählbar",
  "no es seleccionable",
  "n'est pas sélectionnable",
  "चयन योग्य नहीं",
  "tidak dapat dipilih",
  "niet selecteerbaar",
  "não é selecionável",
  "не выделяется",
  "seçilebilir değildir",
  "غير قابل للتحديد",
];

for (const locale of LOCALES) {
  const json = JSON.parse(readFileSync(join(ROOT, "messages", `${locale}.json`), "utf8"));
  const copy = json.tools["invoice-generator"];
  check(/\b27\b/.test(copy.desc), `${locale}: desc mentions 27 currencies`);
  check(/\b27\b/.test(copy.faq2a), `${locale}: faq2a mentions 27 currencies`);
  const bad = NEGATIVE.filter((phrase) => copy.faq1a.includes(phrase));
  check(bad.length === 0, `${locale}: faq1a no longer says the text is not selectable${bad.length ? ` (${bad.join(", ")})` : ""}`);
}

if (failures > 0) {
  console.error(`\ninvoice tests failed: ${failures}`);
  process.exit(1);
}
console.log("\ninvoice tests passed.");

#!/usr/bin/env node
/**
 * T7 guard: every locale must mirror en.json (same keys, same placeholders) and
 * must not silently fall back to English. A small allowlist covers values that
 * are legitimately identical (proper nouns, acronyms, loanwords).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["ar", "de", "es", "fr", "hi", "id", "nl", "pt", "ru", "tr"];

// Keys whose value is the same in English and in the target language, or that
// must not be translated: acronyms, loanwords, proper nouns, example values.
const SAME_BY_DESIGN = new Set([
  "nav.pdf",
  "nav.blog",
  "nav.menu",
  "nav.image",
  "footer.blog",
  "home.impact1n",
  "home.impact2n",
  "home.impact3n",
  "home.impact1u",
  "pdfToExcel.ocrStatus",
  "pdfToWord.ocrStatus",
  "pdfToExcel.page",
  "pdfToExcel.pagesLabel",
  "pdfToWord.page",
  "pdfToWord.pagesLabel",
  "tool.pages",
  "tool.format",
  "pdfEditor.text",
  "pdfEditor.font",
  "cv.linkedin",
  "cv.school",
  "cv.design",
  "cv.modern",
  "cv.minimal",
  "cv.photo",
  "cv.email",
  "cv.template",
  "tools.letter-generator.ui.date",
  "tools.id-card-generator.ui.photo",
  "tools.id-card-generator.ui.idPlaceholder",
  "tools.id-card-generator.ui.qrName",
  "breadcrumb.home",
  "pages.contact.title",
  "pages.contact.emailAddress",
]);

const SAME_BY_DESIGN_PATTERN = /^pages\.donate\.orgs\.[^.]+\.name$/;

const flatten = (obj, prefix = "", out = {}) => {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) flatten(value, path, out);
    else out[path] = value;
  }
  return out;
};

const placeholders = (value) => new Set(String(value).match(/\{[a-zA-Z0-9_]+\}/g) || []);

// Some values are arrays of paragraphs (rich text); compare them as one text.
const asText = (value) => (Array.isArray(value) ? value.join("\n") : value);
const isTextLeaf = (value) =>
  typeof value === "string" ||
  (Array.isArray(value) && value.every((part) => typeof part === "string"));

const en = flatten(JSON.parse(readFileSync(join(ROOT, "messages/en.json"), "utf8")));
const enKeys = Object.keys(en);

let failures = 0;
const fail = (message) => {
  console.error(`  FAIL ${message}`);
  failures++;
};

for (const locale of LOCALES) {
  const file = join(ROOT, "messages", `${locale}.json`);
  let data;
  try {
    data = flatten(JSON.parse(readFileSync(file, "utf8")));
  } catch (err) {
    fail(`${locale}: invalid JSON (${err.message})`);
    continue;
  }

  const keys = Object.keys(data);
  const missing = enKeys.filter((key) => !(key in data));
  const extra = keys.filter((key) => !(key in en));

  if (missing.length) fail(`${locale}: ${missing.length} missing key(s): ${missing.slice(0, 8).join(", ")}`);
  if (extra.length) fail(`${locale}: ${extra.length} unexpected key(s): ${extra.slice(0, 8).join(", ")}`);

  const untranslated = [];
  const placeholderMismatch = [];
  const empty = [];
  let localFailures = 0;
  const localFail = (message) => {
    fail(message);
    localFailures++;
  };

  for (const key of enKeys) {
    const source = en[key];
    const value = data[key];
    if (!isTextLeaf(value)) {
      if (value !== undefined) localFail(`${locale}: ${key} is not text`);
      continue;
    }
    const text = asText(value);
    const sourceText = asText(source);
    if (!text.trim()) {
      empty.push(key);
      continue;
    }

    const expected = placeholders(sourceText);
    const actual = placeholders(text);
    const samePlaceholders =
      expected.size === actual.size && [...expected].every((name) => actual.has(name));
    if (!samePlaceholders) placeholderMismatch.push(key);

    if (
      text === sourceText &&
      !SAME_BY_DESIGN.has(key) &&
      !SAME_BY_DESIGN_PATTERN.test(key)
    ) {
      untranslated.push(key);
    }
  }

  if (empty.length) localFail(`${locale}: ${empty.length} empty value(s): ${empty.slice(0, 8).join(", ")}`);
  if (placeholderMismatch.length) {
    localFail(`${locale}: placeholder mismatch: ${placeholderMismatch.slice(0, 8).join(", ")}`);
  }
  if (untranslated.length) {
    localFail(`${locale}: ${untranslated.length} value(s) identical to English: ${untranslated.slice(0, 12).join(", ")}`);
  }

  if (localFailures === 0 && !missing.length && !extra.length) {
    console.log(`  ok   ${locale}: ${keys.length} keys, placeholders intact, no English fallbacks`);
  }
}

if (failures > 0) {
  console.error(`\ntranslation checks failed: ${failures}`);
  process.exit(1);
}
console.log("\ntranslation checks passed.");

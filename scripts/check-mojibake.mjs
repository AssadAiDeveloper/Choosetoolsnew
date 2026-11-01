#!/usr/bin/env node
/**
 * Fails when a JSON file contains mojibake sequences produced by decoding
 * UTF-8 bytes as Latin-1 / Windows-1252.
 *
 * Pattern (audit T1): a lead character followed by a Latin-1/C1 continuation
 * character. Bare "Ã", "Ñ" or "Â" are NOT flagged because they are legitimate
 * capital letters in Spanish and Portuguese (e.g. "AÑADIR", "NÃO").
 *
 *   /[ÃÂÐÑ][\u0080-\u00BF]|â[€†‚ƒ„…‰]/
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const MOJIBAKE_RE = /[ÃÂÐÑ][\u0080-\u00BF]|â[€†‚ƒ„…‰]/;

const ALLOW = [];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (entry.endsWith(".json")) out.push(full);
  }
  return out;
}

const targets = [
  ...walk(join(ROOT, "messages")),
  ...walk(join(ROOT, "src", "content")),
];

let failures = 0;
for (const file of targets) {
  const rel = relative(ROOT, file).split("\\").join("/");
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    const m = line.match(MOJIBAKE_RE);
    if (!m) return;
    const allowed = ALLOW.some((a) => a.file === rel && line.includes(a.match));
    if (allowed) return;
    failures++;
    console.error(`${rel}:${i + 1}: mojibake "${m[0]}" -> ${JSON.stringify(line.trim().slice(0, 120))}`);
  });
}

if (failures > 0) {
  console.error(`\nMojibake check failed: ${failures} occurrence(s).`);
  process.exit(1);
}
console.log(`Mojibake check passed (${targets.length} JSON files scanned).`);

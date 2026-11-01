#!/usr/bin/env node
/**
 * Fails when a locale/content JSON file contains typical mojibake sequences
 * produced by decoding UTF-8 bytes as Latin-1 / Windows-1252.
 *
 * Safe markers (never legitimate in our locales):
 *   - U+00D0 (Ð)            e.g. "Ð²" -> "в"
 *   - "â€" (U+00E2 U+20AC)  e.g. "â€™" -> "’"
 *   - "Ã¢â‚¬" / "ÃƒÂ"       common double-encoding chains
 * Contextual markers (only when followed by a Latin-1 continuation byte,
 * so legitimate Spanish "Ño", Portuguese "ÃO", French "Âge" are NOT flagged):
 *   - U+00C3 (Ã) + U+0080..U+00BF
 *   - U+00D1 (Ñ) + U+0080..U+00BF
 *   - U+00C2 (Â) + U+0080..U+00BF
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const SAFE_PATTERNS = [
  { name: "U+00D0 (Ð)", re: /\u00D0/ },
  { name: "â€ (mojibake quote/dash)", re: /\u00E2\u20AC/ },
  { name: "Ã¢â‚¬ chain", re: /\u00C3\u00A2\u00E2\u201A\u00AC/ },
  { name: "ÃƒÂ chain", re: /\u00C3\u0192\u00C2/ },
  { name: "Ã + continuation", re: /\u00C3[\u0080-\u00BF]/ },
  { name: "Ñ + continuation", re: /\u00D1[\u0080-\u00BF]/ },
  { name: "Â + continuation", re: /\u00C2[\u0080-\u00BF]/ },
];

/**
 * Allow-list for intentional occurrences. Add `{ file, match }` where `file`
 * is a path relative to the repo root (forward slashes) and `match` is the
 * exact offending substring.
 */
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
    for (const { name, re } of SAFE_PATTERNS) {
      const m = line.match(re);
      if (!m) continue;
      const allowed = ALLOW.some(
        (a) => a.file === rel && line.includes(a.match)
      );
      if (allowed) continue;
      failures++;
      console.error(`${rel}:${i + 1}: ${name} -> ${JSON.stringify(line.trim().slice(0, 120))}`);
    }
  });
}

if (failures > 0) {
  console.error(`\nMojibake check failed: ${failures} occurrence(s).`);
  process.exit(1);
}
console.log(`Mojibake check passed (${targets.length} JSON files scanned).`);

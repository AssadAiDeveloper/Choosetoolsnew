#!/usr/bin/env node
/**
 * Aggregates the project's check scripts so `npm test` runs them all.
 * Each entry is a script in this folder; any non-zero exit fails the run.
 */
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const CHECKS = [
  "check-mojibake.mjs",
  "test-protect-pdf.mjs",
  "test-canvas-text.mjs",
  "test-invoice.mjs",
  "check-links.mjs",
];

let failed = 0;
for (const script of CHECKS) {
  console.log(`\n=== ${script} ===`);
  const r = spawnSync(process.execPath, [join(HERE, script)], { stdio: "inherit" });
  if (r.status !== 0) failed++;
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${CHECKS.length} check(s) passed.`);

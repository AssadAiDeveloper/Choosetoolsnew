#!/usr/bin/env node
/**
 * Social links check (feat/social-links).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let failures = 0;
const check = (ok, label) => { if (ok) console.log("  ok   " + label); else { console.error("  FAIL " + label); failures++; } };

const siteSrc = readFileSync(join(ROOT, "src/lib/site.ts"), "utf8");
const footerSrc = readFileSync(join(ROOT, "src/components/Footer.tsx"), "utf8");
const layoutSrc = readFileSync(join(ROOT, "app/[locale]/layout.tsx"), "utf8");

const LI = "https://www.linkedin.com/company/choosetool/home";
const FB = "https://www.facebook.com/profile.php?id=61595194893879";

// 1. Config constant exists with both URLs
check(siteSrc.includes(LI) && siteSrc.includes(FB), "site.ts contains both social URLs");
check(/SOCIAL_LINKS/.test(siteSrc), "SOCIAL_LINKS constant defined");

// 2. Footer uses SOCIAL_LINKS, inline SVG, rel noopener, aria-labels, 44px tap target, 24px icon
check(footerSrc.includes("SOCIAL_LINKS.linkedin") && footerSrc.includes("SOCIAL_LINKS.facebook"), "Footer references both SOCIAL_LINKS");
check(footerSrc.includes('rel="noopener noreferrer me"'), "Footer links have rel=noopener noreferrer me");
check(footerSrc.includes('target="_blank"'), "Footer links open in new tab");
check(footerSrc.includes('aria-label={t("linkedin")}') && footerSrc.includes('aria-label={t("facebook")}'), "Footer uses translated aria-labels");
check(footerSrc.includes('width="24" height="24"'), "Footer icons are at least 24px");
check(footerSrc.includes("h-11 w-11"), "Footer tap targets are 44px (h-11 w-11)");
check(footerSrc.includes("focus:ring-2"), "Footer links have visible focus ring");

// 3. layout.tsx sameAs contains both URLs
check(layoutSrc.includes("sameAs: [SOCIAL_LINKS.linkedin, SOCIAL_LINKS.facebook]"), "layout.tsx sameAs contains both URLs");

// 4. Render check (if server up)
const BASE = process.env.SOCIAL_BASE || "http://localhost:3000";
let html = "";
try {
  const res = await fetch(`${BASE}/`);
  html = await res.text();
} catch (e) {
  console.log("  (server not reachable, skipping render check)");
}
if (html) {
  check(html.includes(LI), "rendered footer contains LinkedIn URL");
  check(html.includes(FB), "rendered footer contains Facebook URL");
  check(html.includes('rel="noopener noreferrer me"'), "rendered footer has rel noopener");
}

if (failures > 0) { console.error(`\nsocial-links tests failed: ${failures}`); process.exit(1); }
console.log("\nsocial-links tests passed.");

#!/usr/bin/env node
/**
 * T8 guard: image-to-PDF page geometry.
 *
 * The three converters share `src/lib/imagePdfLayout.mjs`. These tests exercise
 * that module directly (page size, centring, aspect ratio, margins) and check
 * that each converter still uses it, so the geometry cannot silently drift.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PAGE_SIZE_KEYS,
  PAGE_SIZES,
  fitPageSize,
  pageSizePt,
  placeImage,
  pxToPt,
  resolvePage,
} from "../src/lib/imagePdfLayout.mjs";

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
const near = (a, b, eps = 0.01) => Math.abs(a - b) <= eps;
const nearPair = (a, b, eps = 0.01) => near(a[0], b[0], eps) && near(a[1], b[1], eps);

// --- fixed page sizes -------------------------------------------------------
check(nearPair(pageSizePt("a4", "portrait"), [595.28, 841.89]), "A4 portrait is 595.28 x 841.89 pt");
check(nearPair(pageSizePt("a4", "landscape"), [841.89, 595.28]), "A4 landscape is rotated, not rescaled");
check(nearPair(pageSizePt("letter", "portrait"), [612, 792]), "Letter portrait is 612 x 792 pt");
check(nearPair(pageSizePt("letter", "landscape"), [792, 612]), "Letter landscape is rotated, not rescaled");
check(nearPair(pageSizePt("a4"), [595.28, 841.89]), "orientation defaults to portrait");
check(PAGE_SIZE_KEYS.join(",") === "fit,a4,letter", "the picker offers fit / A4 / Letter");
check(PAGE_SIZES.a4[0] === 595.28, "PAGE_SIZES is exposed for the UI");

// --- px -> pt ---------------------------------------------------------------
check(near(pxToPt(10), 7.5), "pxToPt(10) is 7.5 pt (96 dpi, not mm)");
check(near(pxToPt(96), 72), "pxToPt(96) is 72 pt = 1 inch");
check(pxToPt(-5) === 0, "pxToPt clamps negatives to 0");
check(pxToPt(undefined) === 0, "pxToPt treats a missing value as 0");

// --- fit to image -----------------------------------------------------------
check(nearPair(fitPageSize(800, 600), [800, 600]), "fit with no margin keeps the pixel size as points");
check(nearPair(fitPageSize(800, 600, 10), [820, 620]), "fit adds the margin on both sides");

{
  const { pageW, pageH, image } = resolvePage({ size: "fit", imgW: 800, imgH: 600 });
  check(nearPair([pageW, pageH], [800, 600]), "fit page matches the image");
  check(
    nearPair([image.x, image.y, image.width, image.height], [0, 0, 800, 600]),
    "fit draws the image edge to edge at the origin",
  );
}

{
  const { pageW, pageH, image } = resolvePage({ size: "fit", imgW: 800, imgH: 600, marginPt: 7.5 });
  check(nearPair([pageW, pageH], [815, 615]), "fit + margin grows the page by 2x margin");
  check(
    nearPair([image.x, image.y, image.width, image.height], [7.5, 7.5, 800, 600]),
    "fit + margin offsets the image by the margin",
  );
}

// --- A4 / Letter: contain, centre, never overflow ----------------------------
const CASES = [
  { size: "a4", orientation: "portrait", imgW: 1600, imgH: 400, label: "wide image on A4 portrait" },
  { size: "a4", orientation: "portrait", imgW: 400, imgH: 1600, label: "tall image on A4 portrait" },
  { size: "a4", orientation: "landscape", imgW: 1600, imgH: 400, label: "wide image on A4 landscape" },
  { size: "letter", orientation: "portrait", imgW: 400, imgH: 1600, label: "tall image on Letter portrait" },
  { size: "letter", orientation: "landscape", imgW: 1600, imgH: 400, label: "wide image on Letter landscape" },
];

for (const c of CASES) {
  const { pageW, pageH, image } = resolvePage({
    size: c.size,
    orientation: c.orientation,
    imgW: c.imgW,
    imgH: c.imgH,
    marginPt: 18,
  });
  const expected = pageSizePt(c.size, c.orientation);
  check(nearPair([pageW, pageH], expected), `${c.label}: page is ${c.size} ${c.orientation}`);

  const insideX = image.x >= 18 - 0.01 && image.x + image.width <= pageW - 18 + 0.01;
  const insideY = image.y >= 18 - 0.01 && image.y + image.height <= pageH - 18 + 0.01;
  check(insideX && insideY, `${c.label}: stays inside the margin box`);

  const centredX = near(image.x, pageW - image.x - image.width, 0.01);
  const centredY = near(image.y, pageH - image.y - image.height, 0.01);
  check(centredX && centredY, `${c.label}: is centred`);

  const ratio = image.width / image.height;
  check(near(ratio, c.imgW / c.imgH, 0.001), `${c.label}: keeps the aspect ratio`);

  const touchesBox =
    near(image.width, pageW - 36, 0.01) || near(image.height, pageH - 36, 0.01);
  check(touchesBox, `${c.label}: scales up to touch the margin box`);
}

// --- placeImage edge cases --------------------------------------------------
{
  const box = placeImage(100, 100, 100, 100, 1000);
  check(box.width > 0 && box.height > 0, "an oversized margin never produces a negative size");
  check(box.x >= 0 && box.y >= 0, "an oversized margin keeps the image on the page");
}

let threw = false;
try {
  resolvePage({ size: "a5", imgW: 10, imgH: 10 });
} catch {
  threw = true;
}
check(threw, "an unknown page size throws instead of guessing");

threw = false;
try {
  placeImage(100, 100, 0, 10);
} catch {
  threw = true;
}
check(threw, "a zero-width image throws instead of producing NaN");

// --- the converters use the shared module -----------------------------------
for (const file of ["JpgToPdf.tsx", "PngToPdf.tsx", "ImagesToPdf.tsx"]) {
  const src = readFileSync(join(ROOT, "src/components/tools", file), "utf8");
  check(/from "@\/lib\/imagePdfLayout\.mjs"/.test(src), `${file} imports the shared layout`);
  check(/resolvePage\(/.test(src), `${file} resolves pages with resolvePage()`);
  check(/pxToPt\(/.test(src), `${file} converts the margin with pxToPt()`);
  check(/<ImagePdfOptions/.test(src), `${file} renders the shared page-size control`);
}

// --- the six labels exist in every locale -----------------------------------
const KEYS = ["pageSize", "fitToImage", "orientation", "portrait", "landscape", "marginPx"];
for (const locale of LOCALES) {
  const json = JSON.parse(readFileSync(join(ROOT, "messages", `${locale}.json`), "utf8"));
  const missing = KEYS.filter((key) => typeof json.tool?.[key] !== "string" || !json.tool[key].trim());
  check(missing.length === 0, `${locale}: has all 6 page-size labels${missing.length ? ` (missing ${missing.join(", ")})` : ""}`);
}

if (failures > 0) {
  console.error(`\nimage-to-PDF tests failed: ${failures}`);
  process.exit(1);
}
console.log("\nimage-to-PDF tests passed.");

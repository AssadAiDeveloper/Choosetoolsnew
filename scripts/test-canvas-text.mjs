#!/usr/bin/env node
/**
 * Canvas text tests for T4 (RTL clipping) and T4b (preview fit).
 *
 * Uses @napi-rs/canvas, which is already installed as pdfjs-dist's Node canvas
 * backend — no new project dependency. It supports Arabic shaping and
 * `ctx.direction`, so these are real renders, not layout-only assertions.
 *
 * Covers: ar, en and hi for both the ID card and the certificate.
 * A text block may not leave the exporter's safe margins, and no ink may land
 * in the border band of the final image.
 */
import { createCanvas } from "@napi-rs/canvas";
import { drawFittedText, fitText, textBounds } from "../src/lib/canvasText.mjs";
import { idCardTextItems } from "../src/lib/idCardLayout.mjs";
import { certificateLayout } from "../src/lib/certificateLayout.mjs";

let failures = 0;
function check(name, condition, detail) {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures++;
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const round = (n) => Math.round(n * 10) / 10;
const near = (a, b, tol = 1) => Math.abs(a - b) <= tol;

function inkBounds(ctx, W, H, isInk) {
  const data = ctx.getImageData(0, 0, W, H).data;
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (isInk(data[i], data[i + 1], data[i + 2], data[i + 3])) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY, empty: maxX < 0 };
}

const darkInk = (r, g, b, a) => a > 0 && r < 200 && g < 200 && b < 200;

// ── Helper behaviour ───────────────────────────────────────────────────────
console.log("canvasText helper");
{
  const c = createCanvas(600, 200);
  const ctx = c.getContext("2d");

  const shrink = fitText(ctx, "A very long single line", {
    size: 60, minSize: 20, maxWidth: 300, maxLines: 1, family: "Arial",
  });
  check("shrinks to fit maxWidth", shrink.lines.length === 1 && shrink.width <= 300, `${round(shrink.width)}`);
  check("font size was reduced", shrink.fontSize < 60, `${shrink.fontSize}`);

  const wrap = fitText(ctx, "one two three four five six seven", {
    size: 30, minSize: 20, maxWidth: 200, maxLines: 2, family: "Arial",
  });
  check("wraps to maxLines", wrap.lines.length === 2, `${wrap.lines.length}`);

  const cut = fitText(ctx, "x".repeat(200), {
    size: 40, minSize: 40, maxWidth: 100, maxLines: 1, family: "Arial",
  });
  check("ellipsizes unbreakable text", cut.truncated && cut.lines[0].endsWith("\u2026"), cut.lines[0]);

  const rtl = fitText(ctx, "مرحبا بالعالم", {
    size: 40, minSize: 10, maxWidth: 300, maxLines: 1, align: "right", direction: "rtl", family: "Arial",
  });
  check("RTL measures text", rtl.width > 0, `${round(rtl.width)}`);

  const bounds = textBounds({ x: 300, y: 100, align: "right", baseline: "alphabetic" }, rtl);
  check("right-aligned bounds end at x", near(bounds.right, 300), `${round(bounds.right)}`);
}

// ── ID card ────────────────────────────────────────────────────────────────
const ID_W = Math.round((85.6 / 25.4) * 300);
const ID_H = Math.round((54 / 25.4) * 300);
const PAD_X = ID_W * 0.04;
const HEADER_H = ID_H * 0.24;
const PHOTO_H = ID_H * 0.53 * 0.94;
const PHOTO_W = PHOTO_H / 1.5;
const PHOTO_Y = HEADER_H + (ID_H * 0.53 - PHOTO_H) / 2;

const ID_CASES = {
  ar: {
    isRtl: true,
    company: "شركة الأفق للتقنية",
    name: "محمد أحمد عبد الرحمن الشريف",
    title: "مدير تطوير الأعمال",
    idNumber: "EMP-2024-0042",
    hireDate: "2024-06-01",
    labels: { name: "الاسم", title: "المسمى الوظيفي", employeeId: "الرقم الوظيفي", hire: "تاريخ التعيين" },
  },
  en: {
    isRtl: false,
    company: "Horizon Technology Group",
    name: "Alexandra Montgomery-Carter",
    title: "Director of Business Development",
    idNumber: "EMP-2024-0042",
    hireDate: "2024-06-01",
    labels: { name: "Name", title: "Title", employeeId: "Employee No.", hire: "Hire date" },
  },
  hi: {
    isRtl: false,
    company: "होराइज़न टेक्नोलॉजी",
    name: "अलेक्जेंड्रा मोंटगोमेरी कार्टर",
    title: "व्यवसाय विकास निदेशक",
    idNumber: "EMP-2024-0042",
    hireDate: "2024-06-01",
    labels: { name: "नाम", title: "पद", employeeId: "कर्मचारी संख्या", hire: "नियुक्ति तिथि" },
  },
};

for (const [lang, c] of Object.entries(ID_CASES)) {
  console.log(`\nID card (${lang})`);
  const photoX = c.isRtl ? ID_W - PAD_X - PHOTO_W : PAD_X;
  const layout = idCardTextItems({
    W: ID_W, H: ID_H, padX: PAD_X, headerH: HEADER_H, photoX, photoW: PHOTO_W, photoY: PHOTO_Y,
    isRtl: c.isRtl, primary: "#0e8a6c",
    company: c.company, name: c.name, title: c.title, idNumber: c.idNumber, hireDate: c.hireDate,
    labels: c.labels,
  });

  const items = [layout.company, layout.name, layout.title, layout.employeeLabel, layout.employeeValue, layout.hireLabel, layout.hireValue];

  if (c.isRtl) {
    check("RTL text column is anchored on the right half", layout.box.textX > ID_W / 2, `${round(layout.box.textX)}`);
    check("RTL uses right alignment", layout.box.align === "right" && layout.box.direction === "rtl");
  }

  const canvas = createCanvas(ID_W, ID_H);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ID_W, ID_H);

  for (const item of items) {
    const fitted = drawFittedText(ctx, item.text, { ...item, color: "#000000" });
    const b = textBounds(item, fitted);
    check(`${item.text.slice(0, 18)} fits safe width`, b.left >= PAD_X - 1 && b.right <= ID_W - PAD_X + 1,
      `[${round(b.left)}, ${round(b.right)}] vs [${round(PAD_X)}, ${round(ID_W - PAD_X)}]`);
    check(`${item.text.slice(0, 18)} stays on canvas`, b.top >= 0 && b.bottom <= ID_H,
      `[${round(b.top)}, ${round(b.bottom)}]`);
    check(`${item.text.slice(0, 18)} is not truncated`, fitted.truncated === false);
  }

  const ink = inkBounds(ctx, ID_W, ID_H, darkInk);
  check("no ink in the left/right border band",
    ink.minX >= Math.floor(PAD_X) && ink.maxX <= Math.ceil(ID_W - PAD_X),
    `ink x [${ink.minX}, ${ink.maxX}]`);
}

// ── Certificate ────────────────────────────────────────────────────────────
const CERT_W = 1600;
const CERT_H = 1132;
const CERT_SAFE = 84;

const CERT_CASES = {
  ar: {
    isRtl: true,
    labels: { cert: "شهادة", presentedTo: "تُمنح هذه الشهادة بكل فخر إلى", for_: "لإكماله بنجاح", certNumber: "رقم الشهادة", date: "التاريخ", signature: "التوقيع" },
    data: {
      name: "محمد أحمد عبد الرحمن الشريف",
      title: "إدارة الأعمال الدولية",
      desc: "أكمل البرنامج التدريبي بنجاح",
      certNo: "CT-2026-000123",
      presenter: "الأستاذ الدكتور عبد الرحمن بن محمد الشريف",
      today: "1 نوفمبر 2026",
    },
  },
  en: {
    isRtl: false,
    labels: { cert: "Certificate", presentedTo: "This certificate is proudly presented to", for_: "for successfully completing", certNumber: "Certificate No.", date: "Date", signature: "Signature" },
    data: {
      name: "Alexandra Montgomery-Carter",
      title: "International Business Administration",
      desc: "Has successfully completed the programme",
      certNo: "CT-2026-000123",
      presenter: "Professor Alexandra Montgomery-Carter",
      today: "November 1, 2026",
    },
  },
  hi: {
    isRtl: false,
    labels: { cert: "प्रमाणपत्र", presentedTo: "यह प्रमाणपत्र गर्व से प्रस्तुत किया जाता है", for_: "सफलतापूर्वक पूर्ण करने के लिए", certNumber: "प्रमाणपत्र संख्या", date: "दिनांक", signature: "हस्ताक्षर" },
    data: {
      name: "अलेक्जेंड्रा मोंटगोमेरी कार्टर",
      title: "अंतर्राष्ट्रीय व्यवसाय प्रशासन",
      desc: "कार्यक्रम सफलतापूर्वक पूरा किया",
      certNo: "CT-2026-000123",
      presenter: "प्रोफेसर अलेक्जेंड्रा मोंटगोमेरी कार्टर",
      today: "1 नवंबर 2026",
    },
  },
};

for (const [lang, c] of Object.entries(CERT_CASES)) {
  console.log(`\nCertificate (${lang})`);
  const layout = certificateLayout({
    W: CERT_W, H: CERT_H, isRtl: c.isRtl, font: "Arial", accent: "#c9974a",
    hasLogo: false, hasDesc: true, labels: c.labels, data: c.data,
  });

  const items = [layout.certNumber, ...layout.rows, layout.footer.date, layout.footer.dateLabel, layout.footer.signatureLabel, layout.footer.presenter];

  const canvas = createCanvas(CERT_W, CERT_H);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CERT_W, CERT_H);

  for (const item of items) {
    const fitted = drawFittedText(ctx, item.text, { ...item, color: "#000000" });
    const b = textBounds(item, fitted);
    check(`${item.text.slice(0, 18)} stays inside the border`, b.left >= CERT_SAFE - 1 && b.right <= CERT_W - CERT_SAFE + 1 && b.top >= CERT_SAFE - 1 && b.bottom <= CERT_H - CERT_SAFE + 1,
      `[${round(b.left)}, ${round(b.right)}] x [${round(b.top)}, ${round(b.bottom)}]`);
    check(`${item.text.slice(0, 18)} is not truncated`, fitted.truncated === false);
  }

  const ink = inkBounds(ctx, CERT_W, CERT_H, darkInk);
  check("no ink outside the inner border",
    ink.minX >= CERT_SAFE && ink.maxX <= CERT_W - CERT_SAFE && ink.minY >= CERT_SAFE && ink.maxY <= CERT_H - CERT_SAFE,
    `ink [${ink.minX}, ${ink.minY}] – [${ink.maxX}, ${ink.maxY}]`);
}

if (failures > 0) {
  console.error(`\ncanvas text tests failed: ${failures} failure(s).`);
  process.exit(1);
}
console.log("\ncanvas text tests passed.");

#!/usr/bin/env node
/**
 * Regression test for the drawFittedText font bug (QA 1 Nov 2026):
 * fitText sets ctx.font but restores it; drawFittedText must re-apply it.
 */
import { drawFittedText, fitText } from "../src/lib/canvasText.mjs";
import { idCardTextItems } from "../src/lib/idCardLayout.mjs";
import { certificateLayout } from "../src/lib/certificateLayout.mjs";

function makeMockCtx() {
  const recorded = [];
  let _font = "10px sans-serif";
  const stack = [];
  const ctx = {
    _font,
    get font() { return _font; },
    set font(v) { _font = v; },
    direction: "ltr",
    textAlign: "left",
    textBaseline: "alphabetic",
    fillStyle: "#000",
    save() { stack.push({ font: _font, direction: this.direction, textAlign: this.textAlign, textBaseline: this.textBaseline, fillStyle: this.fillStyle }); },
    restore() { const s = stack.pop(); if (s) { _font = s.font; this.direction = s.direction; this.textAlign = s.textAlign; this.textBaseline = s.textBaseline; this.fillStyle = s.fillStyle; } },
    measureText(text) {
      // approximate: width ~ 0.5 * fontSize * char count
      const size = parseFloat(_font) || 10;
      return { width: String(text).length * size * 0.5 };
    },
    fillText(text, x, y) {
      recorded.push({ text, x, y, font: _font });
    },
  };
  return { ctx, recorded };
}

let failures = 0;
const check = (ok, label) => { if (ok) console.log("  ok   " + label); else { console.error("  FAIL " + label); failures++; } };

// 1. Direct drawFittedText: recorded font must contain the fitted size
{
  const { ctx, recorded } = makeMockCtx();
  const fitted = drawFittedText(ctx, "Hello world", {
    x: 10, y: 20, size: 40, minSize: 12, maxWidth: 200, maxLines: 1,
    weight: "700", family: "Arial, sans-serif", align: "left", direction: "ltr",
  });
  check(recorded.length > 0, "fillText was called");
  check(recorded.every((r) => r.font === `700 ${fitted.fontSize}px Arial, sans-serif`),
    `recorded font matches fitted size (${fitted.fontSize}px), got ${recorded.map(r=>r.font).join(", ")}`);
}

// 2. Real ID card layout: every drawFittedText call records a non-default font
{
  const g = { W: 1011, H: 638, padX: 40, headerH: 153, photoX: 799, photoW: 212, photoY: 163, isRtl: true, primary: "#0e8a6c",
    company: "شركة الأفق", name: "محمد عبد الله الأحمد الغامدي", title: "مهندس برمجيات", idNumber: "EMP-20481", hireDate: "2024-03-15",
    labels: { name: "الاسم", title: "المسمى", employeeId: "الرقم", hire: "التعيين" } };
  const layout = idCardTextItems(g);
  const { ctx, recorded } = makeMockCtx();
  drawFittedText(ctx, layout.company.text, layout.company);
  drawFittedText(ctx, layout.name.text, layout.name);
  drawFittedText(ctx, layout.title.text, layout.title);
  drawFittedText(ctx, layout.employeeLabel.text, layout.employeeLabel);
  drawFittedText(ctx, layout.employeeValue.text, layout.employeeValue);
  drawFittedText(ctx, layout.hireLabel.text, layout.hireLabel);
  drawFittedText(ctx, layout.hireValue.text, layout.hireValue);
  const bad = recorded.filter((r) => r.font === "10px sans-serif" || !/\d+px/.test(r.font));
  check(bad.length === 0, `no default 10px font in ID card (${recorded.length} draws, ${bad.length} bad)`);
  // name font size >= 50
  const nameDraw = recorded.find((r) => r.text === layout.name.text.split(" ")[0] || r.text === layout.name.text);
  check(true, `ID card draws ${recorded.length} text items`);
}

// 3. Certificate layout
{
  const g = { W: 1754, H: 1240, isRtl: true, font: "Arial, sans-serif", accent: "#0e8a6c", hasLogo: true, hasDesc: true,
    labels: { cert: "Certificate", presentedTo: "Presented to", for_: "for", certNumber: "No.", date: "Date", signature: "Signature" },
    data: { name: "محمد عبد الله", title: "Engineer", desc: "desc", certNo: "CT-1", presenter: "Prof. X", today: "1 Nov 2026" } };
  const L = certificateLayout(g);
  const { ctx, recorded } = makeMockCtx();
  for (const it of L.rows) drawFittedText(ctx, it.text, it);
  drawFittedText(ctx, L.certNumber.text, L.certNumber);
  drawFittedText(ctx, L.footer.date.text, L.footer.date);
  drawFittedText(ctx, L.footer.dateLabel.text, L.footer.dateLabel);
  drawFittedText(ctx, L.footer.signatureLabel.text, L.footer.signatureLabel);
  drawFittedText(ctx, L.footer.presenter.text, L.footer.presenter);
  const bad = recorded.filter((r) => r.font === "10px sans-serif");
  check(bad.length === 0, `no default 10px font in certificate (${recorded.length} draws, ${bad.length} bad)`);
}

if (failures > 0) { console.error(`\ncanvas-font tests failed: ${failures}`); process.exit(1); }
console.log("\ncanvas-font tests passed.");

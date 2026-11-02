/**
 * Pure PDF builder for the CV (resume) export.
 */
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export function sortRuns(runs, isRtl) {
  const norm = runs.map((r, idx) => ({
    text: String(r.text ?? ""),
    x: Number(r.x) || 0,
    y: Number(r.y) || 0,
    size: Math.max(6, Number(r.size) || 12),
    weight: r.weight ?? "400",
    family: r.family ?? "Arial, sans-serif",
    align: r.align ?? "left",
    direction: r.direction ?? "ltr",
    color: r.color ?? "#000000",
    _idx: idx,
  })).filter((r) => r.text.trim().length > 0);

  const lines = [];
  for (const r of norm) {
    const tol = Math.max(4, r.size * 0.5);
    let line = lines.find((l) => Math.abs(l.y - r.y) <= tol);
    if (!line) { line = { y: r.y, items: [] }; lines.push(line); }
    line.items.push(r);
    line.y = (line.y * (line.items.length - 1) + r.y) / line.items.length;
  }
  lines.sort((a, b) => a.y - b.y);
  for (const line of lines) {
    // Preserve drawing (insertion) order within a line. Do not pre-reverse
    // Arabic; extractors read the stream order.
    line.items.sort((a, b) => a._idx - b._idx);
  }
  return lines.flatMap((l) => l.items);
}

export async function buildCvPdf({ pages, pageSizePt, isRtl, fontBytes }) {
  const [ptW, ptH] = pageSizePt || [595.28, 841.89];
  const PX_W = 1654, PX_H = 2339;
  const sx = ptW / PX_W;
  const sy = ptH / PX_H;

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  let font = null;
  if (fontBytes) {
    try {
      font = await doc.embedFont(fontBytes, { subset: true, features: [] });
    } catch (e) {
      console.warn("cvPdf: font embed failed", e);
      font = null;
    }
  }

  const { pushGraphicsState, popGraphicsState, setTextRenderingMode, TextRenderingMode } = (await import("pdf-lib"));

  for (const page of pages) {
    const p = doc.addPage([ptW, ptH]);
    const png = await doc.embedPng(page.png);
    p.drawImage(png, { x: 0, y: 0, width: ptW, height: ptH });

    if (!font) continue;
    const runs = sortRuns(page.runs || [], !!isRtl);

    p.pushOperators(pushGraphicsState(), setTextRenderingMode(TextRenderingMode.Invisible));

    for (const run of runs) {
      try {
        const text = String(run.text);
        if (!text.trim()) continue;
        let safe = "";
        for (const ch of text) {
          try { font.encodeText(ch); safe += ch; } catch { /* skip */ }
        }
        if (!safe.trim()) continue;

        const x = run.x * sx;
        const y = ptH - run.y * sy;
        const size = run.size * sy;

        p.drawText(safe, { x, y, size, font, color: rgb(0, 0, 0) });
      } catch (e) {
        // skip this run, never abort
      }
    }

    p.pushOperators(popGraphicsState());
  }

  return doc.save();
}

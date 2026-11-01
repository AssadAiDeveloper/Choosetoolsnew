/**
 * Text layout for the Employee ID card export.
 *
 * Geometry mirrors the drawing code in `IdCardGenerator.buildPdf`. The RTL
 * branch is the fix for the clipped card: the photo sits on the right, so the
 * text column's *right* edge is `photoX - gap` and text is right-aligned
 * there. The old code anchored right-aligned text at the left padding, which
 * pushed every line off the left edge of the canvas.
 */

/**
 * @param {{W: number, H: number, padX: number, photoX: number, photoW: number, isRtl: boolean}} g
 */
export function idCardTextBox(g) {
  const gap = g.W * 0.04;
  if (g.isRtl) {
    const right = g.photoX - gap;
    return {
      textX: right,
      textAreaW: Math.max(0, right - g.padX),
      align: /** @type {const} */ ("right"),
      direction: /** @type {const} */ ("rtl"),
    };
  }
  const left = g.photoX + g.photoW + g.W * 0.07;
  return {
    textX: left,
    textAreaW: Math.max(0, g.W - g.padX - left),
    align: /** @type {const} */ ("left"),
    direction: /** @type {const} */ ("ltr"),
  };
}

/**
 * @param {{
 *   W: number, H: number, padX: number, headerH: number, photoX: number,
 *   photoW: number, photoY: number, isRtl: boolean, primary: string,
 *   company: string, name: string, title: string, idNumber: string,
 *   hireDate: string, labels: { name: string, title: string, employeeId: string, hire: string }
 * }} g
 */
export function idCardTextItems(g) {
  const box = idCardTextBox(g);
  const base = {
    align: box.align,
    direction: box.direction,
    maxWidth: box.textAreaW,
    family: "Arial, sans-serif",
  };
  const labelSize = Math.round(g.H * 0.04);
  const valueSize = Math.round(g.H * 0.05);

  return {
    box,
    divider: g.isRtl
      ? { x1: box.textX - box.textAreaW, x2: box.textX, y: g.photoY + g.H * 0.28 }
      : { x1: box.textX, x2: box.textX + box.textAreaW, y: g.photoY + g.H * 0.28 },
    company: {
      text: g.company,
      x: g.W / 2,
      y: g.headerH * 0.52,
      size: Math.round(g.H * 0.09),
      minSize: Math.round(g.H * 0.045),
      maxWidth: g.W - g.padX * 2,
      maxLines: 1,
      weight: "800",
      align: /** @type {const} */ ("center"),
      direction: box.direction,
      baseline: /** @type {const} */ ("middle"),
      color: "#ffffff",
      family: "Arial, sans-serif",
    },
    name: {
      ...base,
      text: g.name || g.labels.name,
      x: box.textX,
      y: g.photoY + g.H * 0.15,
      size: Math.round(g.H * 0.085),
      minSize: Math.round(g.H * 0.05),
      maxLines: 2,
      weight: "800",
      baseline: /** @type {const} */ ("last"),
      color: "#111827",
    },
    title: {
      ...base,
      text: g.title || g.labels.title,
      x: box.textX,
      y: g.photoY + g.H * 0.235,
      size: Math.round(g.H * 0.063),
      minSize: Math.round(g.H * 0.036),
      maxLines: 1,
      weight: "700",
      baseline: /** @type {const} */ ("alphabetic"),
      color: g.primary,
    },
    employeeLabel: {
      ...base,
      text: g.labels.employeeId,
      x: box.textX,
      y: g.photoY + g.H * 0.31,
      size: labelSize,
      minSize: Math.round(g.H * 0.018),
      maxLines: 1,
      weight: "600",
      baseline: /** @type {const} */ ("alphabetic"),
      color: "#475569",
    },
    employeeValue: {
      ...base,
      text: g.idNumber || "\u2014",
      x: box.textX,
      y: g.photoY + g.H * 0.365,
      size: valueSize,
      minSize: Math.round(g.H * 0.02),
      maxLines: 1,
      weight: "700",
      baseline: /** @type {const} */ ("alphabetic"),
      color: "#111827",
    },
    hireLabel: {
      ...base,
      text: g.labels.hire,
      x: box.textX,
      y: g.photoY + g.H * 0.425,
      size: labelSize,
      minSize: Math.round(g.H * 0.018),
      maxLines: 1,
      weight: "600",
      baseline: /** @type {const} */ ("alphabetic"),
      color: "#475569",
    },
    hireValue: {
      ...base,
      text: g.hireDate || "\u2014",
      x: box.textX,
      y: g.photoY + g.H * 0.48,
      size: valueSize,
      minSize: Math.round(g.H * 0.02),
      maxLines: 1,
      weight: "700",
      baseline: /** @type {const} */ ("alphabetic"),
      color: "#111827",
    },
  };
}

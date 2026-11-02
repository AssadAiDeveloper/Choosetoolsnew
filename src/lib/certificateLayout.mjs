/**
 * Text layout for the Certificate export.
 *
 * The top-right certificate number used `textAlign = "left"` while still
 * drawing at `W - 130` on RTL pages, so the line ran past the right edge.
 * Here every item carries an explicit direction and a left/right/center
 * alignment that matches its anchor.
 */

/**
 * @param {{
 *   W: number, H: number, isRtl: boolean, font: string, accent: string,
 *   hasLogo: boolean, hasDesc: boolean,
 *   labels: { cert: string, presentedTo: string, for_: string, certNumber: string, date: string, signature: string },
 *   data: { name: string, title: string, desc: string, certNo: string, presenter: string, today: string }
 * }} g
 */
export function certificateLayout(g) {
  const direction = /** @type {const} */ (g.isRtl ? "rtl" : "ltr");
  const topY = g.hasLogo ? 408 : 300;
  const bottomY = 845;

  /** @type {Array<{text: string, color: string, weight: string, size: number, maxW: number}>} */
  const rows = [
    { text: g.labels.cert.toUpperCase(), color: g.accent, weight: "600", size: 76, maxW: 1500 },
    { text: g.labels.presentedTo, color: "#ffffff", weight: "400", size: 36, maxW: 1400 },
    { text: g.data.name, color: g.accent, weight: "700", size: 84, maxW: 1250 },
  ];
  if (g.hasDesc) {
    rows.push({ text: g.data.desc, color: "#d5dbe0", weight: "400", size: 30, maxW: 1450 });
  }
  rows.push({ text: g.labels.for_, color: "#e3e8ec", weight: "400", size: 33, maxW: 1400 });
  rows.push({ text: g.data.title, color: "#ffffff", weight: "600", size: 58, maxW: 1300 });

  const step = (bottomY - topY) / rows.length;

  const items = rows.map((r, i) => ({
    text: r.text,
    x: g.W / 2,
    y: topY + step * i + step / 2,
    size: r.size,
    minSize: Math.max(18, Math.round(r.size * 0.4)),
    maxWidth: r.maxW,
    maxLines: 1,
    weight: r.weight,
    family: g.font,
    align: /** @type {const} */ ("center"),
    direction,
    baseline: /** @type {const} */ ("middle"),
    color: r.color,
  }));

  const footY = 924;

  return {
    direction,
    rows: items,
    certNumber: {
      text: `${g.labels.certNumber}: ${g.data.certNo}`.toUpperCase(),
      x: g.W - 130,
      y: 128,
      size: 28,
      minSize: 14,
      maxWidth: Math.round(g.W * 0.36),
      maxLines: 1,
      weight: "400",
      family: g.font,
      align: /** @type {const} */ ("right"),
      direction,
      baseline: /** @type {const} */ ("alphabetic"),
      color: g.accent,
    },
    divider: { y: 890, x1: g.W / 2 - 280, x2: g.W / 2 + 280 },
    footer: {
      date: {
        text: g.data.today,
        x: g.W / 2 - 330,
        y: footY - 32,
        size: 32,
        minSize: 20,
        maxWidth: 320,
        maxLines: 1,
        weight: "400",
        family: g.font,
        align: /** @type {const} */ ("center"),
        direction,
        baseline: /** @type {const} */ ("alphabetic"),
        color: "#c9d2da",
      },
      dateLabel: {
        text: g.labels.date,
        x: g.W / 2 - 330,
        y: footY + 42,
        size: 32,
        minSize: 20,
        maxWidth: 320,
        maxLines: 1,
        weight: "400",
        family: g.font,
        align: /** @type {const} */ ("center"),
        direction,
        baseline: /** @type {const} */ ("alphabetic"),
        color: "#c9d2da",
      },
      signatureLabel: {
        text: g.labels.signature,
        x: g.W / 2 + 330,
        y: footY + 42,
        size: 32,
        minSize: 20,
        maxWidth: 320,
        maxLines: 1,
        weight: "400",
        family: g.font,
        align: /** @type {const} */ ("center"),
        direction,
        baseline: /** @type {const} */ ("alphabetic"),
        color: "#c9d2da",
      },
      presenter: {
        text: g.data.presenter,
        x: g.W / 2 + 330,
        y: footY + 96,
        size: 34,
        minSize: 16,
        maxWidth: 520,
        maxLines: 1,
        weight: "600",
        family: g.font,
        align: /** @type {const} */ ("center"),
        direction,
        baseline: /** @type {const} */ ("alphabetic"),
        color: "#ffffff",
      },
      signatureLine: { y: footY, x1: g.W / 2 + 200, x2: g.W / 2 + 460 },
      dateLine: { y: footY, x1: g.W / 2 - 460, x2: g.W / 2 - 200 },
    },
  };
}

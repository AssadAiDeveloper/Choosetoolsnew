/**
 * Shared canvas text layout for every image/PDF exporter.
 *
 * The bug this fixes: exporters inherited the page's RTL direction and mixed
 * `textAlign` with a left-based x, so Arabic text ran off the left edge (ID
 * card) or off the right edge (certificate). Rules enforced here:
 *
 *   - `ctx.direction` is always set explicitly.
 *   - only `left` / `right` / `center` alignment is used (never start/end).
 *   - every string is measured with `measureText`, then shrunk and/or wrapped
 *     until it fits inside the caller's safe width.
 *
 * Pure layout only: no DOM, so it can be unit-tested with @napi-rs/canvas.
 */

/**
 * @typedef {"ltr" | "rtl"} Direction
 * @typedef {"left" | "right" | "center"} Align
 * @typedef {"top" | "middle" | "alphabetic" | "last"} Baseline
 *
 * @typedef {object} FitOptions
 * @property {number} size            starting font size in px
 * @property {number} maxWidth        widest allowed line, in px
 * @property {number} [maxLines]      default 1
 * @property {number} [minSize]       stop shrinking here (default 10)
 * @property {string|number} [weight] font weight (default "400")
 * @property {string} [family]        font family (default "Arial, sans-serif")
 * @property {Align} [align]          default "left"
 * @property {Direction} [direction]  default "ltr"
 * @property {number} [lineHeight]    line-height multiplier (default 1.15)
 *
 * @typedef {object} FitResult
 * @property {string[]} lines
 * @property {number} fontSize
 * @property {number} lineHeight
 * @property {number} width           width of the widest line
 * @property {boolean} truncated      true when text had to be cut with an ellipsis
 */

const ELLIPSIS = "\u2026";

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string|number} weight
 * @param {number} size
 * @param {string} family
 */
function setFont(ctx, weight, size, family) {
  ctx.font = `${weight} ${size}px ${family}`;
}

/**
 * Greedy word wrap. A single word wider than maxWidth is returned on its own
 * line; the caller ellipsizes it afterwards.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 * @returns {string[]}
 */
function wrapWords(ctx, text, maxWidth) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  /** @type {string[]} */
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (!current || ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Shorten `text` with an ellipsis so it fits maxWidth at the current font.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 * @returns {string}
 */
function ellipsize(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1) {
    out = out.slice(0, -1);
    const candidate = out.trimEnd() + ELLIPSIS;
    if (ctx.measureText(candidate).width <= maxWidth) return candidate;
  }
  return ELLIPSIS;
}

/**
 * Fit `text` into `maxWidth` × `maxLines` by shrinking, then wrapping, then
 * ellipsizing. Never returns a line wider than maxWidth.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {FitOptions} opts
 * @returns {FitResult}
 */
export function fitText(ctx, text, opts) {
  const maxLines = Math.max(1, opts.maxLines ?? 1);
  const minSize = Math.max(1, opts.minSize ?? 10);
  const weight = opts.weight ?? "400";
  const family = opts.family ?? "Arial, sans-serif";
  const lineHeight = opts.lineHeight ?? 1.15;
  const start = Math.max(minSize, opts.size);

  ctx.save();
  ctx.direction = opts.direction ?? "ltr";

  /** @type {string[]} */
  let lines = [];
  let size = start;
  let found = false;

  for (; size >= minSize; size -= 1) {
    setFont(ctx, weight, size, family);
    lines = wrapWords(ctx, text, opts.maxWidth);
    const fits =
      lines.length <= maxLines &&
      lines.every((line) => ctx.measureText(line).width <= opts.maxWidth);
    if (fits) {
      found = true;
      break;
    }
  }

  if (!found) {
    size = minSize;
    setFont(ctx, weight, size, family);
    lines = wrapWords(ctx, text, opts.maxWidth);
  }

  let truncated = false;
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    truncated = true;
  }
  if (lines.length > 0) {
    const last = lines[lines.length - 1];
    if (ctx.measureText(last).width > opts.maxWidth) {
      lines[lines.length - 1] = ellipsize(ctx, last, opts.maxWidth);
      truncated = true;
    }
  }

  const width = lines.reduce((w, line) => Math.max(w, ctx.measureText(line).width), 0);
  ctx.restore();

  return { lines, fontSize: size, lineHeight: size * lineHeight, width, truncated };
}

/**
 * Fit and draw. Returns the fitted metrics so callers can assert bounds.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {FitOptions & {x: number, y: number, color?: string, baseline?: Baseline}} opts
 * @returns {FitResult}
 */
export function drawFittedText(ctx, text, opts) {
  const fitted = fitText(ctx, text, opts);
  const baseline = opts.baseline ?? "alphabetic";
  const n = fitted.lines.length;

  ctx.save();
  ctx.direction = opts.direction ?? "ltr";
  ctx.font = `${opts.weight ?? "400"} ${fitted.fontSize}px ${opts.family ?? "Arial, sans-serif"}`;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = baseline === "top" ? "top" : baseline === "middle" ? "middle" : "alphabetic";
  ctx.fillStyle = opts.color ?? "#000000";

  fitted.lines.forEach((line, i) => {
    let y;
    if (baseline === "top") y = opts.y + i * fitted.lineHeight;
    else if (baseline === "middle") y = opts.y + (i - (n - 1) / 2) * fitted.lineHeight;
    else if (baseline === "last") y = opts.y - (n - 1 - i) * fitted.lineHeight;
    else y = opts.y + i * fitted.lineHeight;
    ctx.fillText(line, opts.x, y);
  });

  ctx.restore();
  return fitted;
}

/**
 * Axis-aligned box of a drawn text block, in canvas pixels.
 * @param {FitOptions & {x: number, y: number, baseline?: Baseline}} opts
 * @param {FitResult} fitted
 * @returns {{left: number, right: number, top: number, bottom: number}}
 */
export function textBounds(opts, fitted) {
  const align = opts.align ?? "left";
  const n = Math.max(1, fitted.lines.length);
  const left =
    align === "right" ? opts.x - fitted.width : align === "center" ? opts.x - fitted.width / 2 : opts.x;
  const right = left + fitted.width;

  const baseline = opts.baseline ?? "alphabetic";
  let top;
  if (baseline === "top") top = opts.y;
  else if (baseline === "middle") top = opts.y - (n * fitted.lineHeight) / 2;
  else if (baseline === "last") top = opts.y - (n - 1) * fitted.lineHeight - fitted.fontSize;
  else top = opts.y - fitted.fontSize;

  return { left, right, top, bottom: top + n * fitted.lineHeight };
}

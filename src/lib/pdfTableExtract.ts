/** Table extraction for "PDF to Excel".
 *
 *  A PDF has no table model — only glyphs with positions. Rebuilding the grid
 *  means grouping glyph runs into lines, lines into rows, and then finding the
 *  column boundaries that the rows agree on. The steps below deliberately work
 *  from the *union* of all rows rather than per-row gaps, because a single row
 *  cannot tell a wide gap from a missing cell.
 */

export interface Glyph {
  text: string;
  /** left edge, pdf user space */
  x: number;
  /** baseline, pdf user space (grows upward) */
  y: number;
  /** right edge, derived from x + width */
  right: number;
  /** font height, used as the row-clustering tolerance */
  h: number;
  /** RTL script (Arabic/Hebrew) */
  rtl: boolean;
  /** explicit end-of-line flag reported by pdf.js */
  eol: boolean;
}

export interface Grid {
  rows: Cell[][];
  /** true when the page looks like a real table rather than loose prose */
  tabular: boolean;
}

export interface Cell {
  text: string;
  row: number;
  col: number;
}

/** Map a glyph run onto a row/column grid using page-wide column boundaries. */
export function glyphsToGrid(glyphs: Glyph[]): Grid {
  if (!glyphs.length) return { rows: [], tabular: false };

  const lines = groupLines(glyphs);
  if (!lines.length) return { rows: [], tabular: false };

  const bounds = columnBounds(lines);
  const rows: Cell[][] = lines.map((line, r) => {
    const cells: Cell[] = [];
    for (let c = 0; c < bounds.length; c++) {
      const lo = bounds[c];
      const hi = c + 1 < bounds.length ? bounds[c + 1] : Infinity;
      const text = joinRun(pick(line, lo, hi));
      cells.push({ text, row: r, col: c });
    }
    return cells;
  });

  // A page is "tabular" when several rows split into a similar number of
  // non-empty columns — that is the signal we use to decide whether the file
  // contained a table at all (vs. an invoice or an article).
  const colCount = bounds.length;
  const multiCell = rows.filter((r) => r.filter((c) => c.text).length >= 2).length;
  const nonEmpty = rows.filter((r) => r.some((c) => c.text)).length;
  const tabular = colCount >= 2 && nonEmpty > 0 && multiCell / nonEmpty >= 0.6;

  return { rows, tabular };
}

/** Group glyphs into visual lines, using hasEOL as a hard break and the
 *  baseline distance as a soft one (PDFs often omit hasEOL). */
function groupLines(glyphs: Glyph[]): Glyph[][] {
  const sorted = [...glyphs].sort((a, b) => (b.y - a.y) || (a.x - b.x));
  const lines: Glyph[][] = [];
  let current: Glyph[] = [];
  let anchorY = 0;
  let tolerance = 0;

  for (const g of sorted) {
    if (!current.length) {
      current = [g];
      anchorY = g.y;
      tolerance = g.h * 0.5;
      continue;
    }
    const ref = current[0];
    const sameLine = Math.abs(anchorY - g.y) <= Math.max(tolerance, ref.h * 0.5, 1);
    if (sameLine) {
      current.push(g);
    } else {
      lines.push(current);
      current = [g];
      anchorY = g.y;
      tolerance = g.h * 0.5;
    }
    // pdf.js flags a hard break at the end of a visual line
    if (g.eol) {
      lines.push(current);
      current = [];
    }
  }
  if (current.length) lines.push(current);
  return lines.filter((l) => l.length);
}

/** Glyphs of a line that belong to the column delimited by [lo, hi).
 *
 *  Column bounds are gap midpoints, so we classify by the glyph's *centre*
 *  rather than its left edge: a right-aligned number starts to the left of the
 *  boundary that precedes it, but its centre is unambiguously inside the cell. */
function pick(line: Glyph[], lo: number, hi: number): Glyph[] {
  return line.filter((g) => {
    const mid = (g.x + g.right) / 2;
    return mid >= lo - EPS && mid < hi - EPS;
  });
}

const EPS = 0.6;

/** Concatenate a run of glyphs, inserting spaces only where the PDF omitted
 *  them (a real gap between glyph boxes). Keeps words glued, words apart. */
function joinRun(run: Glyph[]): string {
  if (!run.length) return "";
  const ordered = run.some((g) => g.rtl)
    ? [...run].sort((a, b) => (b.x - b.right) - (a.x - a.right) || b.x - a.x)
    : [...run].sort((a, b) => a.x - b.x);

  let out = "";
  let prev: Glyph | null = null;
  for (const g of ordered) {
    if (prev) {
      const gap = g.rtl ? prev.x - g.right : g.x - prev.right;
      const needSpace =
        gap > 0.25 &&
        !/[\s-]$/.test(out) &&
        !/^[\s]/.test(g.text) &&
        !(out.endsWith("-") && g.rtl);
      if (needSpace) out += " ";
    }
    out += g.text;
    prev = g;
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Find the column boundaries, as left edges, that the rows agree on.
 *
 *  A PDF has no table model, so the grid has to be inferred from where the
 *  whitespace falls. The rule that holds up across real tables — including
 *  right-aligned numbers and wide headers — is:
 *
 *    a column boundary is an x that sits in the gap between two words on at
 *    least two different rows, and that no *widely spanning* word crosses.
 *
 *  Crossing is the discriminator. In a right-aligned numeric column the left
 *  edges drift with the digit count, so "same starting x" fails, but the gap
 *  before the column is the same gap in every row. A header wider than the
 *  values under it ("Unit Price" over right-aligned amounts) does cross such
 *  an x, and that x is correctly rejected.
 *
 *  Thresholds are fractions of the table's own width, not the font size, because
 *  glyph heights (especially OCR ones) vary far too much to calibrate against. */
function columnBounds(lines: Glyph[][]): number[] {
  if (!lines.length) return [];
  const minX = Math.min(...lines.flatMap((l) => l.map((g) => g.x)));
  const maxX = Math.max(...lines.flatMap((l) => l.map((g) => g.right)));
  const pageW = Math.max(1, maxX - minX);

  // Character width is the unit that survives both worlds: a real text layer
  // and OCR boxes, and both very small pages and 300 dpi scans. Every threshold
  // below is expressed in characters rather than in page points, because a
  // fraction of the page means something completely different at 10pt on A4
  // and at 20px glyphs on a scanned invoice.
  const charWs: number[] = [];
  for (const line of lines) for (const g of line) {
    const n = g.text.replace(/\s/g, "").length || 1;
    charWs.push((g.right - g.x) / n);
  }
  charWs.sort((a, b) => a - b);
  const charW = charWs[Math.floor(charWs.length / 2)] || 4;

  // A cell gap is a couple of characters wide; the space between two words in
  // the same cell is well under one.
  const minGap = Math.max(5, charW * 1.5);

  // Per row, the midpoints of every wide gap between consecutive words.
  const midsByRow: number[][] = lines.map((line) => {
    const ordered = [...line].sort((a, b) => a.x - b.x);
    const mids: number[] = [];
    for (let i = 0; i < ordered.length - 1; i++) {
      const lo = ordered[i].right;
      const hi = ordered[i + 1].x;
      if (hi - lo >= minGap) mids.push((lo + hi) / 2);
    }
    return mids;
  });

  // Cluster every row's gap midpoints, then count how many distinct rows each
  // cluster is supported by. Cluster first (not after) so the support count is
  // about *rows agreeing*, not about how many gaps one row happens to have.
  //
  // The tolerance absorbs per-row jitter: a cell edge sits at a fixed place on
  // the page, but the two words bounding the gap have different widths on each
  // row, so the same edge is reported a few characters apart each time.
  const tol = charW * 2.5;

  // Right-aligned values are the jittery case: the gap before them starts at
  // the *end* of the previous value, and a short number leaves a wider gap than
  // a long one. Those midpoints can drift by a few characters, so a second,
  // looser pass merges clusters that describe the same column. It is safe to be
  // loose here: two real columns are separated by a whole cell, not a few chars.
  const mergeTol = charW * 6;

  const clusters: { lo: number; hi: number; rows: Set<number> }[] = [];
  midsByRow.forEach((mids, row) => {
    for (const x of mids) {
      const hit = clusters.find((c) => x >= c.lo - tol && x <= c.hi + tol);
      if (hit) {
        hit.lo = Math.min(hit.lo, x);
        hit.hi = Math.max(hit.hi, x);
        hit.rows.add(row);
      } else {
        clusters.push({ lo: x, hi: x, rows: new Set([row]) });
      }
    }
  });

  // The header row is the one that labels the columns, so it is the row whose
  // words line up with the most detected boundaries. Its cells ("Unit Price",
  // "Sales Report") are wider than the values printed under them, so without
  // identifying it we cannot tell a real split from a label that merely spans
  // the position.
  const support = lines.map((_, i) => clusters.filter((c) => c.rows.has(i)).length);
  const headerRow = support.indexOf(Math.max(...support));

  // The body rows decide. A boundary needs agreement from at least two of them
  // and must not be straddled by a word in a row that reports a gap there.
  const bounds: number[] = [];
  for (const c of clusters) {
    const x = (c.lo + c.hi) / 2;
    const supporting = [...c.rows].filter((i) => i !== headerRow);
    if (supporting.length < 2) continue;
    // A word vetoes the boundary when it genuinely *straddles* x: a cell's own
    // text ends at its edge, so ink on both sides means the cells are not
    // separated at all. The test is "ink close enough to x to matter" — a
    // couple of characters on each side — because that is what separates a real
    // split (one cell ends here, the next begins just after) from a two-word
    // label that merely spans the position ("Unit Price" crossing a gap its own
    // short values create below it).
    const straddling = lines.some(
      (line, i) =>
        i !== headerRow &&
        c.rows.has(i) &&
        line.some(
          (g) =>
            g.x - tol < x &&
            g.right + tol > x &&
            x - g.x > charW * 2 &&
            g.right - x > charW * 2,
        ),
    );
    if (straddling) continue;
    // The header has the last word: a label straddling x means the header calls
    // this one cell, so the values below it belong to the same column.
    if (
      (lines[headerRow] ?? []).some(
        (g) =>
          g.x - tol < x && g.right + tol > x && x - g.x > charW * 2 && g.right - x > charW * 2,
      )
    ) {
      continue;
    }
    bounds.push(x);
  }
  bounds.sort((a, b) => a - b);

  // Collapse clusters that ended up adjacent.
  const merged: number[] = [];
  for (const x of bounds) {
    if (!merged.length || x - merged[merged.length - 1] > mergeTol) merged.push(x);
  }
  if (!merged.length) {
    // No usable separator: a single column, so use each row's first word.
    return [...new Set(lines.map((l) => Math.min(...l.map((g) => g.x))))].sort((a, b) => a - b);
  }
  merged.unshift(minX);
  return merged;
}

/* ── value coercion ───────────────────────────────────────────────────── */


const NUM_RE = /^-?(?:\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{1,6})?|\d+(?:[.,]\d{1,6})?)%?$/;
const CURRENCY_RE = /^(-)?\s?([$€£¥₪])\s?(\d[\d.,]*)\s?\2?$/;
/** Arabic and RTL documents put the currency after the number ("1500.00 ر.س"),
 *  often with bidi control marks around it. Only word-like tokens are taken as
 *  a currency so that "Total 1500" is not silently treated as a value. */
const CURRENCY_SUFFIX_RE = /^(-)?\s?(\d[\d.,]*)\s?(?:ريال|درهم|دينار|جنيه|فرنك|روبية|ر\.?\s?س|د\.?\s?إ|ج\.?\s?م|\$|€|£|¥|₪)$/;
const PLAIN_NUM_RE = /^-?\d+(?:\.\d+)?$/;

/** Arabic-Indic (٠-٩, U+0660) and Extended Arabic-Indic (۰-۹, U+06F0) digits,
 *  which JS `\d` does not match, plus the Arabic decimal (٫) and thousands
 *  (٬) separators. Spelled out so the offset from "0" is visible. */
const AR_DIGIT_MAP: Record<string, string> = {};
for (let d = 0; d <= 9; d++) {
  AR_DIGIT_MAP[String.fromCharCode(0x0660 + d)] = String(d);
  AR_DIGIT_MAP[String.fromCharCode(0x06f0 + d)] = String(d);
}
const AR_DIGITS = /[٠-٩۰-۹]/;
const AR_DIGITS_ALL = /[٠-٩۰-۹]/g;

/** Rewrite a cell's digits and Arabic numeric punctuation into ASCII so the
 *  existing parsers handle Arabic text without knowing about it. Also strips
 *  the bidi control marks and zero-width joiners that a right-to-left layout
 *  interleaves, which leave a string that reads correctly to a human but no
 *  regex will accept. */
function normalizeDigits(value: string): string {
  if (
    !AR_DIGITS.test(value) &&
    !/[٫٬]/.test(value) &&
    !/[\u200b-\u200f\u202a-\u202e\u2066-\u2069]/.test(value)
  ) {
    return value;
  }
  return value
    .replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(AR_DIGITS_ALL, (d) => AR_DIGIT_MAP[d] ?? d)
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");
}

/** Coerce a text cell into a real Excel value.
 *
 *  The most common complaint about "PDF to Excel" output is that everything
 *  arrives as text, so sums and filters do not work. We only convert when the
 *  value round-trips exactly, and we never touch strings that merely start
 *  with a digit: identifiers such as "2024-001" or a "00700" postcode stay
 *  text, because turning those into a number would silently drop the leading
 *  zeros. */
export function coerce(value: string): string | number | null {
  const v = normalizeDigits(value.trim()).trim();
  if (!v) return null;

  // currency: "USD 1,500.00", "-$250" — keep the sign, drop the symbol
  const cur = v.match(CURRENCY_RE);
  if (cur) {
    const n = parseNumeric(cur[3]);
    if (n !== null) return cur[1] ? -Math.abs(n) : n;
  }
  // currency written after the number, as Arabic and RTL layouts do
  const curSuffix = v.match(CURRENCY_SUFFIX_RE);
  if (curSuffix) {
    const n = parseNumeric(curSuffix[2]);
    if (n !== null) return curSuffix[1] ? -Math.abs(n) : n;
  }

  // percent
  if (/^-?\d[\d.,\s]*\s?%$/.test(v)) {
    const n = parseNumeric(v.replace(/\s?%$/, ""));
    if (n !== null) return n / 100;
  }

  // plain number, allowing 1,234.56 / 1.234,56 / 1234 / 12.5
  if (NUM_RE.test(v)) {
    // A leading zero on a whole number means an identifier (zip code, account
    // number, SKU), not a quantity — Excel would drop the zeros, so keep text.
    // A decimal such as 0.5 is a real value and must convert.
    const isDecimal = /[.,]\d/.test(v);
    const digits = v.replace(/[^0-9]/g, "");
    if (!isDecimal && digits.length > 1 && digits.startsWith("0")) return v;
    const n = parseNumeric(v);
    if (n !== null) return n;
  }

  return v;
}

function parseNumeric(raw: string): number | null {
  let s = raw.replace(/\s/g, "");
  if (!s) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // whichever separator comes last is the decimal mark
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma > -1) {
    // "1,234" is a thousands group, "1,23" is a decimal comma
    s = /^-?\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (lastDot > -1) {
    // "1.234" (EU thousands) vs "1.23" (decimal)
    s = /^-?\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, "") : s;
  }
  if (!PLAIN_NUM_RE.test(s) || s === "." || s === "-") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

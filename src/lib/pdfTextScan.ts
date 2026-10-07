/** One editable run of text found on a page.
 *
 *  Coordinates are PDF user space with the origin at the bottom-left of the
 *  page and y increasing upwards, which is what pdf-lib draws in. */
export interface TextRun {
  id: string;
  /** 1-based page number. */
  page: number;
  text: string;
  /** Baseline origin. Text starts here and runs along `angle`. */
  x: number;
  y: number;
  /** Advance width in user-space units, already measured by pdf.js. */
  width: number;
  /** Font box height, used to derive the cover rectangle. */
  height: number;
  /** Degrees clockwise-free (PDF counter-clockwise) from the +x axis. */
  angle: number;
  /** Axis-aligned bounds, used for hit-testing on screen and for covering. */
  box: { x: number; y: number; w: number; h: number };
  rtl: boolean;
  /** How many raw pdf.js items were merged into this run. */
  parts: number;
}

export interface ScannedPage {
  page: number;
  /** Page box in user space at scale 1. */
  width: number;
  height: number;
  runs: TextRun[];
  /** Rotation declared by the page itself, for rendering. */
  rotate: number;
}

const RTL_RE = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

/** Fractions of the font box above and below the baseline. Real fonts vary
 *  (ascender 0.72-0.82, descender 0.18-0.28 of the em); these slightly
 *  generous values make sure glyphs are fully covered without reaching the
 *  next line, which sits at least 1.1em away in normal documents. */
const ASCENT = 0.84;
const DESCENT = 0.26;
/** Extra slack so antialiased edges of the original glyphs do not survive. */
const COVER_PAD = 0.6;

let seq = 0;

interface RawItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  dirX: number;
  dirY: number;
  hasEOL: boolean;
}

function toRaw(item: unknown): RawItem | null {
  const it = item as {
    str?: string;
    transform?: number[];
    width?: number;
    height?: number;
    hasEOL?: boolean;
  };
  // Whitespace-only items are dropped on purpose. They carry no content, and
  // letting them through shifts every measured gap.
  if (!it.str || !it.str.trim()) return null;

  const tr = it.transform;
  if (!tr || tr.length < 6) return null;

  const a = tr[0] || 0;
  const b = tr[1] || 0;
  const len = Math.hypot(a, b) || 1;
  const width = Math.abs(it.width ?? 0);
  const height = Math.abs(it.height ?? 0) || Math.abs(tr[3]) || 10;

  return {
    text: it.str,
    x: tr[4] || 0,
    y: tr[5] || 0,
    width,
    height,
    angle: (Math.atan2(b, a) * 180) / Math.PI,
    dirX: a / len,
    dirY: b / len,
    hasEOL: it.hasEOL === true,
  };
}

/** Axis-aligned bounds of a run, built from the baseline direction rather than
 *  by scaling the local box through the text matrix. The matrix already carries
 *  the font size, so multiplying the width by it again would double the size. */
function boundsOf(x: number, y: number, width: number, height: number, dirX: number, dirY: number) {
  const upX = -dirY;
  const upY = dirX;
  const top = height * ASCENT;
  const bottom = -height * DESCENT;

  const xs: number[] = [];
  const ys: number[] = [];
  for (const [along, rise] of [
    [0, bottom],
    [width, bottom],
    [width, top],
    [0, top],
  ] as const) {
    xs.push(x + dirX * along + upX * rise);
    ys.push(y + dirY * along + upY * rise);
  }
  const minX = Math.min(...xs) - COVER_PAD;
  const minY = Math.min(...ys) - COVER_PAD;
  return {
    x: minX,
    y: minY,
    w: Math.max(...xs) - Math.min(...xs) + COVER_PAD * 2,
    h: Math.max(...ys) - Math.min(...ys) + COVER_PAD * 2,
  };
}

/** Join neighbouring items that sit on the same line.
 *
 *  A PDF usually splits a sentence into one item per word, and editing a
 *  single word is far less useful than editing the line. Two items merge when
 *  their baselines line up, their sizes match, and the gap between them is
 *  smaller than a space would be. Rotated text is left alone because a line
 *  there is not axis-aligned and merging would produce a box that hides the
 *  row underneath. */
function mergeLine(items: RawItem[], page: number): TextRun[] {
  const out: TextRun[] = [];
  const sorted = [...items].sort((p, q) => {
    if (Math.abs(p.y - q.y) > 1) return q.y - p.y;
    return p.x - q.x;
  });

  let group: RawItem[] = [];

  const flush = () => {
    if (!group.length) return;
    const first = group[0];
    const text = group
      .map((g) => g.text.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) {
      out.push({
        id: `r${page}-${++seq}`,
        page,
        text,
        x: first.x,
        y: first.y,
        width: group.reduce((n, g) => n + g.width, 0),
        height: Math.max(...group.map((g) => g.height)),
        angle: first.angle,
        box: boundsOf(
          first.x,
          first.y,
          group.reduce((n, g) => n + g.width, 0),
          Math.max(...group.map((g) => g.height)),
          first.dirX,
          first.dirY,
        ),
        rtl: RTL_RE.test(text),
        parts: group.length,
      });
    }
    group = [];
  };

  for (const cur of sorted) {
    if (!group.length) {
      group = [cur];
      continue;
    }
    const prev = group[group.length - 1];
    const upright = Math.abs(cur.angle) < 0.5 && Math.abs(prev.angle) < 0.5;
    const sameLine = upright && Math.abs(cur.y - prev.y) < Math.max(1, cur.height * 0.12);
    const sameSize = Math.abs(cur.height - prev.height) <= Math.max(0.5, prev.height * 0.06);
    const gap = cur.x - (prev.x + prev.width);
    const maxGap = Math.max(2, cur.height * 0.28);

    if (sameLine && sameSize && gap >= -1 && gap <= maxGap && !prev.hasEOL) {
      group.push(cur);
    } else {
      flush();
      group = [cur];
    }
  }
  flush();
  return out;
}

/** Read every text run on one page. */
export async function scanPage(pdf: unknown, pageNum: number): Promise<ScannedPage> {
  const doc = pdf as { getPage(n: number): Promise<unknown> };
  const page = (await doc.getPage(pageNum)) as {
    getViewport(o: { scale: number }): { width: number; height: number };
    getTextContent(): Promise<{ items: unknown[] }>;
    rotate: number;
  };

  const vp = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();

  const raw: RawItem[] = [];
  for (const item of content.items) {
    const r = toRaw(item);
    if (r) raw.push(r);
  }

  return {
    page: pageNum,
    width: vp.width,
    height: vp.height,
    runs: mergeLine(raw, pageNum),
    rotate: page.rotate ?? 0,
  };
}

/** Scan the whole document. This is the "read the file fully" step: every page
 *  is visited and every run recorded up front, so the editor can offer a text
 *  list and jump to any run without re-rendering the file each time. */
export async function scanDocument(
  pdf: unknown,
  onProgress?: (done: number, total: number) => void,
): Promise<ScannedPage[]> {
  const doc = pdf as { numPages: number };
  const pages: ScannedPage[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    pages.push(await scanPage(pdf, i));
    onProgress?.(i, doc.numPages);
    // Yield so a 500-page file does not freeze the tab.
    if (i % 4 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  return pages;
}

export function totalRuns(pages: ScannedPage[]): number {
  return pages.reduce((n, p) => n + p.runs.length, 0);
}

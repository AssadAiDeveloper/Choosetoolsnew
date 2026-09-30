// Turning a PDF page into an ordered list of blocks — paragraphs and tables —
// so a document can be rebuilt in something other than a spreadsheet. The
// spreadsheet target flattens everything into rows and columns, which loses the
// order that matters when the output is a Word document: a caption above a
// table has to stay above it.
import { glyphsToGrid, type Cell, type Glyph } from "./pdfTableExtract";

export type Block =
  | { kind: "paragraph"; text: string; rtl: boolean }
  | { kind: "table"; rows: string[][]; rtl: boolean };

const RTL_RE = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/** A row belongs to a table when most of its cells are filled. A prose line
 *  that happens to be wide registers as one giant cell, so it scores 1/N and
 *  falls out; a ruled row has ink in each cell and scores near 1. */
function rowFill(row: Cell[]): number {
  const filled = row.filter((c) => c.text.trim() !== "").length;
  return filled / Math.max(1, row.length);
}

/** Find the runs of consecutive rows that are table-like, and treat everything
 *  else as prose.
 *
 *  A page is often a heading, then a table, then a note — all on one grid. Only
 *  the middle of those should become a Word table, so the split is made on the
 *  rows themselves rather than on whether the page as a whole looks tabular. */
function splitRows(rows: Cell[][]): { table: Cell[][]; prose: Cell[][] }[] {
  const groups: { table: Cell[][]; prose: Cell[][] }[] = [];
  let cur: { table: Cell[][]; prose: Cell[][] } | null = null;
  let inTable = false;

  for (const row of rows) {
    // Two filled cells is the floor: a one-column layout is prose, and a table
    // with a single text column is indistinguishable from a paragraph.
    const isTableRow = row.length >= 2 && rowFill(row) >= 0.6;
    if (!cur || isTableRow !== inTable) {
      cur = { table: [], prose: [] };
      groups.push(cur);
      inTable = isTableRow;
    }
    (inTable ? cur.table : cur.prose).push(row);
  }
  return groups;
}

/** Join one prose row's cells back into a sentence. Cells arrive in x order,
 *  so for a right-to-left line the order is already correct, but the pieces
 *  still need spaces re-inserted because the PDF supplied them separately. */
function proseText(row: Cell[]): string {
  return row
    .map((c) => c.text.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Turn an already-gridded page into ordered blocks.
 *
 *  Shared by the text path (which grids glyphs) and the OCR path (which is handed
 *  a grid). The OCR grid is never re-gridded: synthesising fake glyph positions
 *  for cells that already have a column index only re-runs column detection on
 *  guessed coordinates, and a scanned table that came back as 4 columns from OCR
 *  would come back as 1. */
function gridToBlocks(rows: Cell[][]): Block[] {
  const out: Block[] = [];

  for (const group of splitRows(rows)) {
    if (group.prose.length) {
      // Consecutive prose lines are one paragraph: a hard line break inside a
      // wrapped sentence is not a paragraph boundary. Only a blank line, which
      // shows up as a row of empty cells, ends it.
      let buf: string[] = [];
      const flush = () => {
        const text = buf.join(" ").replace(/\s+/g, " ").trim();
        if (text) out.push({ kind: "paragraph", text, rtl: RTL_RE.test(text) });
        buf = [];
      };
      for (const row of group.prose) {
        const text = proseText(row);
        if (!text) flush();
        else buf.push(text);
      }
      flush();
    }

    if (group.table.length) {
      // A single row is a line of text that happened to be split, not a table;
      // one table row with no data row below it tells the reader nothing.
      if (group.table.length >= 2) {
        out.push({
          kind: "table",
          rows: group.table.map((r) => r.map((c) => c.text.trim())),
          rtl: RTL_RE.test(group.table.flat().map((c) => c.text).join("")),
        });
      } else {
        const text = proseText(group.table[0]);
        if (text) out.push({ kind: "paragraph", text, rtl: RTL_RE.test(text) });
      }
    }
  }

  return out;
}

/** Convert one page of glyphs into ordered blocks. */
export function pageBlocks(glyphs: Glyph[]): Block[] {
  return gridToBlocks(glyphsToGrid(glyphs).rows);
}

/** Build blocks straight from an OCR grid, which has cells but no glyphs.
 *
 *  The grid already knows its columns, so it is handed to the same row
 *  classifier as the text path. `tabular` is only used to decide whether a
 *  single-column page is worth treating as a table at all, which splitRows
 *  already handles by requiring two filled cells. */
export function gridBlocks(rows: string[][]): Block[] {
  return gridToBlocks(rows.map((r, i) => r.map((t, j) => ({ text: t, row: i, col: j }))));
}

/** Number of real tables across a page list, for the result summary. */
export function countTables(blocks: Block[]): number {
  return blocks.filter((b) => b.kind === "table").length;
}

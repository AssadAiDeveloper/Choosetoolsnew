/** Workbook writer for the "PDF to Excel" tool.
 *
 *  The shared `buildXlsx` helper stringifies everything, which is fine for
 *  CSV/JSON conversions but wrong for a PDF: extracted numbers must land in
 *  Excel as numbers or every SUM and sort breaks downstream. */
import { coerce } from "@/lib/pdfTableExtract";

export type Value = string | number | null;

/** Multi-line cell contents that continue on the next visual line belong to
 *  the same logical row, so we merge them into one cell with a line break. */
export function mergeWrapped(rows: string[][]): string[][] {
  if (rows.length < 2) return rows;
  const out: string[][] = [];
  for (const row of rows) {
    const width = row.length;
    if (width === 0) continue;
    // A row that occupies a single non-empty cell and is followed by a row
    // that is at least as wide is a wrapped continuation of the previous one.
    const filled = row.filter((c) => c !== "").length;
    const prev = out[out.length - 1];
    if (
      filled === 1 &&
      prev &&
      prev.length >= width &&
      prev.some((c) => c !== "")
    ) {
      const cell = row.findIndex((c) => c !== "");
      if (cell > -1) {
        const cur = prev[cell];
        prev[cell] = cur ? `${cur} ${row[cell]}`.trim() : row[cell];
        for (let c = 0; c < width; c++) {
          if (c !== cell && row[c] !== "" && prev[c] === "") prev[c] = row[c];
        }
        continue;
      }
    }
    out.push(row);
  }
  return out;
}

/** Convert a raw text grid into typed values, padding every row to the same
 *  width so Excel shows a proper rectangle. */
export function toTypedGrid(rows: string[][]): Value[][] {
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  return rows.map((r) => {
    const cells: Value[] = [];
    for (let c = 0; c < width; c++) cells.push(coerce(r[c] ?? ""));
    return cells;
  });
}

function displayWidth(v: Value): number {
  if (v === null) return 0;
  if (typeof v === "number") return String(v).length;
  return String(v).replace(/\n/g, " ").length;
}

export async function buildTableXlsx(
  rows: Value[][],
  sheetName = "Sheet1",
): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "ChooseTools";
  const ws = wb.addWorksheet(sheetName.slice(0, 31));

  rows.forEach((r) => ws.addRow(r));
  if (!rows.length) return new Blob([], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  // Header styling only makes sense when the first row looks like a header:
  // short, all text, and not a data row of numbers.
  const first = rows[0];
  const looksLikeHeader =
    first.length > 0 &&
    first.every((c) => c === null || typeof c === "string") &&
    first.some((c) => typeof c === "string" && c.trim() !== "");

  if (looksLikeHeader) {
    const header = ws.getRow(1);
    header.font = { bold: true };
    header.alignment = { vertical: "middle", wrapText: false };
  }

  // Autofit columns from the widest cell (displayed, not a hard cap).
  const colCount = ws.columnCount;
  for (let c = 1; c <= colCount; c++) {
    let max = 8;
    for (const r of rows) max = Math.max(max, displayWidth(r[c - 1]));
    ws.getColumn(c).width = Math.min(60, max + 2);
  }

  // Wrap only where the source had a real line break inside a cell.
  rows.forEach((r, rIdx) => {
    r.forEach((v, c) => {
      if (typeof v === "string" && v.includes("\n")) {
        ws.getCell(rIdx + 1, c + 1).alignment = { wrapText: true, vertical: "top" };
      }
    });
  });

  ws.views = [{ state: "frozen", ySplit: looksLikeHeader ? 1 : 0 }];

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

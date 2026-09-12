/** Shared helpers for the Excel tools — ExcelJS cell values can be
 *  rich objects (formulas, rich text, hyperlinks, dates); normalize to plain values. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cellValue(v: any): string | number | boolean | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("result" in v) return cellValue(v.result); // formula
    if ("richText" in v) return v.richText.map((r: { text: string }) => r.text).join("");
    if ("text" in v) return v.text; // hyperlink
    if ("error" in v) return String(v.error);
    return String(v);
  }
  return v;
}

/** Read the first worksheet of an .xlsx file into a 2D array */
export async function readSheet(file: File): Promise<(string | number | boolean | null)[][]> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("empty workbook");
  const rows: (string | number | boolean | null)[][] = [];
  ws.eachRow({ includeEmpty: true }, (row) => {
    const values: (string | number | boolean | null)[] = [];
    for (let c = 1; c <= ws.columnCount; c++) values.push(cellValue(row.getCell(c).value));
    rows.push(values);
  });
  return rows;
}

/** Build an .xlsx blob from a 2D array with a styled header row */
export async function buildXlsx(rows: (string | number | boolean | null)[][]): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1");
  rows.forEach((r) => ws.addRow(r));
  if (rows.length) {
    ws.getRow(1).font = { bold: true };
    ws.columns.forEach((col, i) => {
      const widths = rows.map((r) => String(r[i] ?? "").length);
      col.width = Math.min(40, Math.max(10, ...widths) + 2);
    });
  }
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

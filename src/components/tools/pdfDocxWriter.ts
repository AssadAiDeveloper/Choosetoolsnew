// Rendering extracted blocks into a real .docx. The point of the Word target is
// that the result stays editable, so tables go out as Word tables (sortable,
// filterable, resizable) rather than as a grid of tabs or an image.
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { Block } from "@/lib/pdfBlocks";

const CELL_MARGIN = 80;

const border = (style: (typeof BorderStyle)[keyof typeof BorderStyle]) => ({
  style,
  size: 4,
  color: "BFBFBF",
});
const CELL_BORDERS = {
  top: border(BorderStyle.SINGLE),
  bottom: border(BorderStyle.SINGLE),
  left: border(BorderStyle.SINGLE),
  right: border(BorderStyle.SINGLE),
};

/** A cell whose text parses as a number, or as a percentage, is right-aligned
 *  and kept as text: a Word table has no cell types, so alignment is the only
 *  signal a reader gets, and a run of digits in a column should not read as a
 *  sentence. */
function isNumeric(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return /^[-+(]?\s?[$€£¥₪]?[\d٠-٩۰-۹][\d.,٬٫\s]*\s?%?\)?$/.test(t);
}

function cellParagraph(text: string, rtl: boolean, bold: boolean): Paragraph {
  return new Paragraph({
    alignment: rtl ? AlignmentType.RIGHT : isNumeric(text) ? AlignmentType.RIGHT : AlignmentType.LEFT,
    bidirectional: rtl,
    children: [new TextRun({ text, bold })],
  });
}

function tableCell(text: string, rtl: boolean, bold: boolean): TableCell {
  return new TableCell({
    margins: { top: CELL_MARGIN, bottom: CELL_MARGIN, left: CELL_MARGIN, right: CELL_MARGIN },
    borders: CELL_BORDERS,
    children: [cellParagraph(text, rtl, bold)],
  });
}

/** Build one Word table, shading the first row so it reads as a header. */
function docxTable(rows: string[][], rtl: boolean): Table {
  const width = Math.max(...rows.map((r) => r.length));
  return new Table({
    // Fixed layout keeps the columns from being re-fitted to the page on open,
    // which is what turns a faithful table into a scrambled one.
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (row, r) =>
        new TableRow({
          tableHeader: r === 0,
          children: Array.from({ length: width }, (_, c) => {
            const text = (row[c] ?? "").trim();
            const cellRtl = rtl || RTL_HINT.test(text);
            return new TableCell({
              margins: { top: CELL_MARGIN, bottom: CELL_MARGIN, left: CELL_MARGIN, right: CELL_MARGIN },
              borders: CELL_BORDERS,
              shading: r === 0 ? { fill: "F2F2F2" } : undefined,
              children: [cellParagraph(text, cellRtl, r === 0)],
            });
          }),
        }),
    ),
  });
}

const RTL_HINT = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/** Assemble the document. Empty blocks are dropped so a page break never
 *  leaves a stray empty paragraph behind it. */
export async function buildDocx(blocks: Block[], title: string): Promise<Blob> {
  const body: (Paragraph | Table)[] = [];

  for (const block of blocks) {
    if (block.kind === "paragraph") {
      if (!block.text) continue;
      body.push(
        new Paragraph({
          alignment: block.rtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
          bidirectional: block.rtl,
          children: [new TextRun(block.text)],
        }),
      );
      continue;
    }
    if (block.rows.length) body.push(docxTable(block.rows, block.rtl));
  }

  const doc = new Document({
    title,
    sections: [
      {
        properties: {},
        children: body.length
          ? body
          : [new Paragraph({ children: [new TextRun("")] })],
      },
    ],
  });

  return Packer.toBlob(doc);
}

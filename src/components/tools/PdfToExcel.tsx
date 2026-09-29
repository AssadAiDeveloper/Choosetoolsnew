"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes, replaceExt } from "@/lib/download";
import { buildXlsx } from "./excelShared";

interface Cell {
  text: string;
  x: number;
  y: number;
}

/** Thresholds tuned for extracting simple tables from digital PDFs. */
const X_MERGE = 14;   // min X gap between two cells of the same row
const ROW_EPS = 5;    // max Y distance for items to share a row

function extractRows(textItems: { str: string; transform?: number[] }[]): string[][] {
  const cells: Cell[] = textItems
    .filter((it) => it.str && it.str.trim())
    .map((it) => ({
      text: it.str.replace(/\s+/g, " ").trim(),
      x: it.transform?.[4] ?? 0,
      y: it.transform?.[5] ?? 0,
    }));

  if (!cells.length) return [];

  // Group cells into rows by Y proximity (reading top→bottom).
  cells.sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const rows: Cell[][] = [];
  for (const c of cells) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(last[0].y - c.y) <= ROW_EPS) last.push(c);
    else rows.push([c]);
  }

  // pdfjs Y grows upward; reverse so the first row is the page top.
  rows.reverse();

  // Within each row, split cells by X gap: far-apart items become columns.
  return rows.map((row) => {
    row.sort((a, b) => a.x - b.x);
    const cols: string[] = [];
    let cur = "";
    let prevX = row[0].x;
    for (const c of row) {
      if (cur !== "" && c.x - prevX > X_MERGE) {
        cols.push(cur);
        cur = "";
      }
      cur = cur ? `${cur} ${c.text}` : c.text;
      prevX = c.x;
    }
    if (cur) cols.push(cur);
    return cols;
  }).filter((r) => r.some((c) => c.length > 0));
}

export default function PdfToExcel() {
  const t = useTranslations("tool");
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [out, setOut] = useState<Blob | null>(null);
  const [name, setName] = useState("table.xlsx");
  const [rows, setRows] = useState<string[][]>([]);

  const run = async (file: File) => {
    setStage("busy");
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url
      ).toString();
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const pageRows: string[][] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        pageRows.push(...extractRows(content.items as { str: string; transform?: number[] }[]));
      }
      if (!pageRows.length) throw new Error("empty");
      setRows(pageRows);
      setOut(await buildXlsx(pageRows));
      setName(replaceExt(file.name, "xlsx"));
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={() => setStage("pick")} />;
  if (stage === "done" && out)
    return (
      <ResultCard onReset={() => { setOut(null); setStage("pick"); }}>
        <div className="mb-4 max-h-64 overflow-auto rounded-xl border border-line bg-surface/60">
          <table dir="ltr" className="w-full text-left text-xs">
            <tbody>
              {rows.slice(0, 20).map((row, i) => (
                <tr key={i} className={i === 0 ? "bg-brand-50/60 font-semibold" : i % 2 ? "bg-surface/40" : ""}>
                  {row.map((cell, j) => (
                    <td key={j} className="whitespace-nowrap border-b border-line px-3 py-1.5 font-mono">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="font-mono text-sm text-ink-soft">{rows.length} rows · {formatBytes(out.size)}</p>
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(out, name)}>{t("download")} .xlsx</PrimaryButton>
      </ResultCard>
    );

  return <FileDropzone accept="application/pdf" onFiles={(f) => run(f[0])} />;
}
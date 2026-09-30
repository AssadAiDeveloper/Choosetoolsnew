"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes, replaceExt } from "@/lib/download";
import { glyphsToGrid, type Glyph } from "@/lib/pdfTableExtract";
import { ocrPage, pdfjsWorkerSrc } from "@/lib/pdfOcr";
import { buildTableXlsx, mergeWrapped, toTypedGrid, type Value } from "./pdfExcelWriter";

type Stage = "pick" | "busy" | "done" | "error";

interface Result {
  blob: Blob;
  name: string;
  grid: Value[][];
  usedOcr: boolean;
  pages: number;
  tabularPages: number;
}

const RTL_RE = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export default function PdfToExcel() {
  const t = useTranslations("tool");
  const tp = useTranslations("pdfToExcel");
  const locale = useLocale();
  const [stage, setStage] = useState<Stage>("pick");
  const [status, setStatus] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [failed, setFailed] = useState<"empty" | "prose" | "error" | null>(null);

  const run = async (file: File) => {
    setStage("busy");
    setFailed(null);
    setRes(null);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc(pdfjs);
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;

      const tableRows: string[][] = [];
      const looseRows: string[][] = [];
      let tabularPages = 0;
      let pagesWithText = 0;
      let usedOcr = false;

      for (let i = 1; i <= doc.numPages; i++) {
        setStatus(`${tp("page")} ${i}/${doc.numPages}`);
        const page = await doc.getPage(i);
        const content = await page.getTextContent();

        const glyphs: Glyph[] = [];
        for (const item of content.items) {
          if (!("str" in item)) continue;
          const s = item.str;
          if (!s || !s.trim()) continue;
          const x = item.transform?.[4] ?? 0;
          const y = item.transform?.[5] ?? 0;
          const w = item.width ?? 0;
          glyphs.push({
            text: s,
            x,
            y,
            right: x + w,
            h: Math.abs(item.height) || Math.abs(item.transform?.[3]) || 8,
            rtl: RTL_RE.test(s),
            eol: item.hasEOL === true,
          });
        }

        if (!glyphs.length) {
          // Scanned page: rasterise it and let OCR read the words back.
          setStatus(tp("ocrPage", { page: i }));
          const read = await ocrPage(page, setStatus, tp, locale);
          if (read.rows.length) {
            usedOcr = true;
            pagesWithText++;
            if (read.tabular) {
              tabularPages++;
              tableRows.push(...read.rows);
            } else {
              looseRows.push(...read.rows);
            }
          }
          page.cleanup();
          continue;
        }

        pagesWithText++;
        const grid = glyphsToGrid(glyphs);
        if (grid.tabular) {
          tabularPages++;
          tableRows.push(...grid.rows.map((r) => r.map((c) => c.text)));
        } else {
          // No columns on this page — keep each visual line as its own row so
          // the sheet still reads top-to-bottom instead of one merged blob.
          looseRows.push(...grid.rows.map((r) => r.map((c) => c.text).filter(Boolean)));
        }
        page.cleanup();
      }

      if (!pagesWithText) throw new Error("empty");
      if (usedOcr && !tabularPages) {
        // OCR produced text but we could not find columns — surface it instead
        // of silently handing back a single column.
        setFailed("prose");
        setStage("error");
        return;
      }

      setStatus(tp("building"));
      // Only real tables get the wrapped-line merge; plain prose stays one
      // line per row, and if nothing tabular was found we keep every line.
      const raw = tableRows.length
        ? [...mergeWrapped(tableRows), ...looseRows]
        : looseRows;
      const grid = toTypedGrid(raw);
      const blob = await buildTableXlsx(grid, file.name.replace(/\.[^.]+$/, ""));
      setRes({
        blob,
        name: replaceExt(file.name, "xlsx"),
        grid,
        usedOcr,
        pages: doc.numPages,
        tabularPages: tabularPages || doc.numPages,
      });
      setStage("done");
    } catch (e) {
      const msg = String((e as { message?: string })?.message || e);
      setFailed(msg === "empty" ? "empty" : "error");
      setStage("error");
    }
  };

  if (stage === "busy")
    return (
      <div className="space-y-4">
        <Processing />
        {status && <p className="text-center font-mono text-xs text-ink-soft">{status}</p>}
      </div>
    );

  if (stage === "error")
    return (
      <div className="space-y-4">
        {failed === "empty" && (
          <ErrorNote title={tp("noTextTitle")} body={tp("noTextBody")} />
        )}
        {failed === "prose" && (
          <ErrorNote title={tp("noTableTitle")} body={tp("noTableBody")} />
        )}
        {failed === "error" && <ErrorBox onReset={() => setStage("pick")} />}
        <PrimaryButton onClick={() => setStage("pick")}>{t("reset")}</PrimaryButton>
      </div>
    );

  if (stage === "done" && res)
    return (
      <ResultCard onReset={() => { setRes(null); setStage("pick"); }}>
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2 font-mono text-xs text-ink-soft">
          <span className="rounded-full bg-surface px-3 py-1">
            {res.grid.length} {tp("rowsLabel")}
          </span>
          <span className="rounded-full bg-surface px-3 py-1">
            {res.grid[0]?.length ?? 0} {tp("colsLabel")}
          </span>
          <span className="rounded-full bg-surface px-3 py-1">
            {res.pages} {tp("pagesLabel")}
          </span>
          {res.usedOcr && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
              {tp("ocrBadge")}
            </span>
          )}
        </div>

        <div className="mb-4 max-h-72 overflow-auto rounded-xl border border-line bg-surface/60">
          <table dir="ltr" className="w-full text-left text-xs">
            <tbody>
              {res.grid.slice(0, 25).map((row, i) => (
                <tr key={i} className={i === 0 ? "bg-brand-50/60 font-semibold" : i % 2 ? "bg-surface/40" : ""}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={`max-w-[16rem] truncate border-b border-line px-3 py-1.5 ${
                        typeof cell === "number" ? "text-right font-mono text-emerald-800" : "font-mono"
                      }`}
                    >
                      {cell === null ? "" : String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {res.usedOcr && (
          <p className="mx-auto mb-3 max-w-md text-xs leading-relaxed text-ink-soft">
            {tp("ocrHint")}
          </p>
        )}

        <p className="font-mono text-sm text-ink-soft">{formatBytes(res.blob.size)}</p>
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(res.blob, res.name)}>
          {t("download")} .xlsx
        </PrimaryButton>
      </ResultCard>
    );

  return <FileDropzone accept="application/pdf" onFiles={(f) => run(f[0])} />;
}

function ErrorNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-card border border-amber-200 bg-amber-50 p-6 text-center">
      <p className="font-semibold text-amber-800">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-amber-900/80">{body}</p>
    </div>
  );
}

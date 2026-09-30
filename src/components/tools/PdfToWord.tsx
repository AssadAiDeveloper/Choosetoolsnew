"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes, replaceExt } from "@/lib/download";
import { type Glyph } from "@/lib/pdfTableExtract";
import { ocrPage, pdfjsWorkerSrc } from "@/lib/pdfOcr";
import { countTables, gridBlocks, pageBlocks, type Block } from "@/lib/pdfBlocks";
import { buildDocx } from "./pdfDocxWriter";

type Stage = "pick" | "busy" | "done" | "error";

interface Result {
  blob: Blob;
  name: string;
  blocks: Block[];
  usedOcr: boolean;
  pages: number;
  tables: number;
}

const RTL_RE = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export default function PdfToWord() {
  const t = useTranslations("tool");
  const tp = useTranslations("pdfToWord");
  const locale = useLocale();
  const [stage, setStage] = useState<Stage>("pick");
  const [status, setStatus] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [failed, setFailed] = useState<"empty" | "error" | null>(null);

  const run = async (file: File) => {
    setStage("busy");
    setFailed(null);
    setRes(null);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc(pdfjs);
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;

      const blocks: Block[] = [];
      let usedOcr = false;
      let pagesWithText = 0;

      for (let i = 1; i <= doc.numPages; i++) {
        setStatus(`${tp("page")} ${i}/${doc.numPages}`);
        const page = await doc.getPage(i);
        const content = await page.getTextContent();

        const glyphs: Glyph[] = [];
        for (const item of content.items) {
          if (!("str" in item)) continue;
          const s = item.str;
          // Whitespace-only items must be dropped, not just empty ones. A space
          // glyph sits in the middle of a cell gap, so keeping it splits that
          // gap in half and neither half reaches the "wider than a space" test
          // that decides where a column ends — the page then looks like one
          // long column and every table collapses to a single cell.
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

        if (glyphs.length) {
          pagesWithText++;
          blocks.push(...pageBlocks(glyphs));
        } else {
          // No text layer — rasterise and OCR, then treat the result the same
          // way so a scanned page yields a Word table like a digital one.
          setStatus(tp("ocrPage", { page: i }));
          const read = await ocrPage(page, setStatus, tp, locale);
          if (read.rows.length) {
            usedOcr = true;
            pagesWithText++;
            blocks.push(...gridBlocks(read.rows));
          }
        }
        page.cleanup();
      }

      if (!pagesWithText) throw new Error("empty");

      setStatus(tp("building"));
      const title = file.name.replace(/\.[^.]+$/, "");
      const blob = await buildDocx(blocks, title);
      setRes({
        blob,
        name: replaceExt(file.name, "docx"),
        blocks,
        usedOcr,
        pages: doc.numPages,
        tables: countTables(blocks),
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
      <div>
        <Processing />
        {status && <p className="text-center font-mono text-xs text-ink-soft">{status}</p>}
      </div>
    );

  if (stage === "error")
    return (
      <div>
        {failed === "empty" && (
          <div className="rounded-card border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="font-semibold text-amber-800">{tp("noTextTitle")}</p>
            <p className="mt-2 text-sm leading-relaxed text-amber-900/80">{tp("noTextBody")}</p>
          </div>
        )}
        {failed === "error" && <ErrorBox onReset={() => setStage("pick")} />}
        <div className="mt-4 flex justify-center">
          <PrimaryButton onClick={() => setStage("pick")}>{t("reset")}</PrimaryButton>
        </div>
      </div>
    );

  if (stage === "done" && res)
    return (
      <ResultCard onReset={() => { setRes(null); setStage("pick"); }}>
        <ul className="mb-4 flex flex-wrap justify-center gap-2 text-xs">
          <li className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
            {tp("pagesLabel")}: {res.pages}
          </li>
          <li className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
            {tp("tablesLabel")}: {res.tables}
          </li>
          {res.usedOcr && (
            <li className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">
              {tp("ocrBadge")}
            </li>
          )}
        </ul>

        <div className="mb-4 max-h-80 overflow-auto rounded-card border border-line">
          {res.blocks.map((b, i) =>
            b.kind === "paragraph" ? (
              <p key={i} className="border-b border-line px-3 py-2 text-sm last:border-b-0">
                {b.text}
              </p>
            ) : (
              <table key={i} className="w-full border-collapse text-sm">
                <tbody>
                  {b.rows.map((row, r) => (
                    <tr key={r} className={r === 0 ? "bg-brand-50/60 font-semibold" : ""}>
                      {row.map((c, j) => (
                        <td key={j} className="border-b border-line px-3 py-1.5">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ),
          )}
        </div>

        {res.usedOcr && <p className="mx-auto mb-3 max-w-md text-xs text-ink-soft">{tp("ocrHint")}</p>}

        <p className="font-mono text-sm text-ink-soft">{formatBytes(res.blob.size)}</p>
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(res.blob, res.name)}>
          {t("download")} .docx
        </PrimaryButton>
      </ResultCard>
    );

  return <FileDropzone accept="application/pdf" onFiles={(f) => run(f[0])} />;
}

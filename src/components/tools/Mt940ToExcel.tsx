"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes, replaceExt } from "@/lib/download";
import { buildXlsx } from "./excelShared";

export interface Mt940Transaction {
  date: string; // YYYY-MM-DD
  amount: number; // signed: credits positive, debits negative
  currency: string;
  reference: string;
  description: string;
}

/** Parse SWIFT MT940 bank statement text (as exported by ING, Rabobank, ABN AMRO, etc.) */
export function parseMt940(text: string): { account: string; currency: string; transactions: Mt940Transaction[] } {
  const lines = text.split(/\r?\n/);
  let account = "";
  let currency = "";
  const transactions: Mt940Transaction[] = [];
  let currentTag = "";
  let pending: Mt940Transaction | null = null;
  let descLines: string[] = [];

  const flush = () => {
    if (pending) {
      pending.description = descLines.join(" ").replace(/\s+/g, " ").trim();
      transactions.push(pending);
      pending = null;
      descLines = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const tagMatch = line.match(/^:(\d{2}[A-Z]?):(.*)$/);

    if (!tagMatch) {
      // continuation line of the current field
      if (currentTag === "86" && line.trim()) descLines.push(line.trim());
      continue;
    }

    const [, tag, rest] = tagMatch;
    currentTag = tag;

    if (tag === "25") {
      account = rest.trim();
    } else if (tag === "60F" || tag === "60M") {
      // e.g. C260102EUR1234,56 — currency at positions 7-9
      const m = rest.match(/^[CD]\d{6}([A-Z]{3})/);
      if (m) currency = m[1];
    } else if (tag === "61") {
      flush();
      // YYMMDD [MMDD] C/D/RC/RD [funds letter] amount [Nxxx] reference
      const m = rest.match(/^(\d{6})(\d{4})?(R?[CD])([A-Z])?([\d,.]+)(?:[NFS][A-Z0-9]{3})?(.*)$/);
      if (m) {
        const [, ymd, , dc, , amountRaw, refRaw] = m;
        const year = 2000 + parseInt(ymd.slice(0, 2));
        const date = `${year}-${ymd.slice(2, 4)}-${ymd.slice(4, 6)}`;
        const amount = parseFloat(amountRaw.replace(/\./g, "").replace(",", "."));
        const sign = dc === "D" || dc === "RC" ? -1 : 1; // RC = reversed credit → money out
        pending = {
          date,
          amount: sign * amount,
          currency,
          reference: refRaw.replace(/^\/\//, "").trim(),
          description: "",
        };
      }
    } else if (tag === "86") {
      if (rest.trim()) descLines.push(rest.trim());
    }
  }
  flush();
  return { account, currency, transactions };
}

export default function Mt940ToExcel() {
  const t = useTranslations("tool");
  const locale = useLocale();
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [out, setOut] = useState<Blob | null>(null);
  const [name, setName] = useState("statement.xlsx");
  const [summary, setSummary] = useState({ count: 0, account: "" });

  const HEADERS = locale === "ar"
    ? ["التاريخ", "الوصف", "مدين", "دائن", "العملة", "المرجع"]
    : locale === "es"
    ? ["Fecha", "Descripción", "Débito", "Crédito", "Moneda", "Referencia"]
    : ["Date", "Description", "Debit", "Credit", "Currency", "Reference"];

  const run = async (file: File) => {
    setStage("busy");
    try {
      const { account, currency, transactions } = parseMt940(await file.text());
      if (!transactions.length) throw new Error("no transactions");
      const rows: (string | number | null)[][] = [
        HEADERS,
        ...transactions.map((tx) => [
          tx.date,
          tx.description || tx.reference,
          tx.amount < 0 ? Math.abs(tx.amount) : null,
          tx.amount > 0 ? tx.amount : null,
          tx.currency || currency,
          tx.reference,
        ]),
      ];
      setOut(await buildXlsx(rows));
      setName(replaceExt(file.name, "xlsx"));
      setSummary({ count: transactions.length, account });
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
        <p dir="ltr" className="font-mono text-sm text-ink-soft">
          {summary.account && <span>{summary.account} · </span>}
          {summary.count} tx · {formatBytes(out.size)}
        </p>
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(out, name)}>{t("download")} .xlsx</PrimaryButton>
      </ResultCard>
    );

  return <FileDropzone accept=".940,.mt940,.sta,.txt,.swi" onFiles={(f) => run(f[0])} />;
}

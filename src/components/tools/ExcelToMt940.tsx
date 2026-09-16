"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes, replaceExt } from "@/lib/download";
import { readSheet } from "./excelShared";

export interface ExcelTransaction {
  date: string; // YYYY-MM-DD
  debit: number | null;
  credit: number | null;
  currency: string;
  reference: string;
  description: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Convert a YYYY-MM-DD date into MT940 YYMMDD (2000-2099 assumed). */
function toYmd(date: string): string {
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  const year = parseInt(m[1]);
  if (year < 2000 || year > 2099) return "";
  return `${pad(year % 100)}${m[2]}${m[3]}`;
}

/** Format a euro-style amount: "1234,56" (no currency, RTL/other locales handled). */
function fmtAmount(n: number): string {
  const fixed = Math.abs(n).toFixed(2);
  const [int, dec] = fixed.split(".");
  const withSep = int.replace(/\d(?=(\d{3})+$)/g, "$&.");
  return `${withSep},${dec}`;
}

/** Build a full SWIFT MT940 statement from parsed transactions + statement metadata. */
export function buildMt940(rows: ExcelTransaction[], opts: {
  account: string;
  reference: string;
  statementNo: string;
  openingBalance: number;
  currency: string;
}): string {
  const statements: string[] = [];
  const withSep = opts.account.replace(/\s+/g, "");
  statements.push(":20:" + (opts.reference || "REFERENCE"));
  statements.push(":25:" + withSep);
  statements.push(":28C:" + (opts.statementNo || "1/1"));

  const startTag = opts.openingBalance >= 0 ? "D" : "C";
  statements.push(":60F:" + startTag + toYmd(rows[0]?.date || new Date().toISOString().slice(0, 10)) + (opts.currency || "EUR") + fmtAmount(opts.openingBalance));

  let closing = opts.openingBalance;
  const lines = rows.filter((tx) => tx.date && (tx.debit || tx.credit));
  for (const tx of lines) {
    const isDebit = tx.debit != null && tx.debit > 0;
    const amount = isDebit ? tx.debit! : tx.credit ?? 0;
    const sign = isDebit ? -1 : 1;
    closing += sign * amount;
    const dc = isDebit ? "D" : "C";
    const ymd = toYmd(tx.date);
    if (!ymd) continue;
    const ref = tx.reference || "NONREF";
    const amountStr = fmtAmount(amount);
    let line = `:61:${ymd}${dc}${amountStr}N${ref.trim().replace(/\s+/g, "").slice(0, 16).toUpperCase()}`;
    statements.push(line);
    let desc = (tx.description || tx.reference || "").replace(/\s+/g, " ").trim();
    if (desc) {
      statements.push(":86:" + desc.slice(0, 32));
      const rest = desc.slice(32);
      let i = 0;
      while (i < rest.length && i < 32 * 10) {
        statements.push(rest.slice(i, i + 32));
        i += 32;
      }
    }
  }

  const endTag = closing >= 0 ? "D" : "C";
  statements.push(":62F:" + endTag + toYmd(new Date().toISOString().slice(0, 10)) + (opts.currency || "EUR") + fmtAmount(closing));
  statements.push("-}");
  return statements.join("\r\n");
}

export default function ExcelToMt940() {
  const t = useTranslations("tool");
  const locale = useLocale();
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [out, setOut] = useState<Blob | null>(null);
  const [name, setName] = useState("statement.940");
  const [summary, setSummary] = useState({ count: 0, account: "" });
  const [preview, setPreview] = useState("");
  const [account, setAccount] = useState("");
  const [reference, setReference] = useState("");
  const [statementNo, setStatementNo] = useState("1/1");
  const [opening, setOpening] = useState("0");
  const [currency, setCurrency] = useState("EUR");

  const L = {
    account: locale === "ar" ? "رقم الحساب (IBAN)" : locale === "es" ? "N.º de cuenta (IBAN)" : locale === "nl" ? "Rekeningnummer (IBAN)" : locale === "fr" ? "N° de compte (IBAN)" : locale === "de" ? "Kontonummer (IBAN)" : locale === "pt" ? "Nº da conta (IBAN)" : locale === "tr" ? "Hesap numarası (IBAN)" : locale === "ru" ? "Номер счёта (IBAN)" : locale === "hi" ? "खाता संख्या (IBAN)" : locale === "id" ? "Nomor rekening (IBAN)" : "Account number (IBAN)",
    reference: locale === "ar" ? "المرجع" : locale === "es" ? "Referencia" : locale === "nl" ? "Referentie" : locale === "fr" ? "Référence" : locale === "de" ? "Referenz" : locale === "pt" ? "Referência" : locale === "tr" ? "Referans" : locale === "ru" ? "Ссылка" : locale === "hi" ? "संदर्भ" : locale === "id" ? "Referensi" : "Reference",
    statementNo: locale === "ar" ? "رقم الكشف (متسلسل/صفحة)" : locale === "es" ? "N.º de extracto (nº/pág)" : locale === "nl" ? "Afschriftnr (nr/blz)" : locale === "fr" ? "N° de relevé (n°/page)" : locale === "de" ? "Kontoauszugsnr (Nr/Blatt)" : locale === "pt" ? "Nº do extrato (nº/pág)" : locale === "tr" ? "Hesap ekstresi no (no/sayfa)" : locale === "ru" ? "№ выписки (№/стр.)" : locale === "hi" ? "विवरण संख्या (क्र./पृ.)" : locale === "id" ? "No. mutasi (no/hal)" : "Statement no (no/page)",
    openingBalance: locale === "ar" ? "الرصيد الافتتاحي" : locale === "es" ? "Saldo de apertura" : locale === "nl" ? "Openingssaldo" : locale === "fr" ? "Solde d'ouverture" : locale === "de" ? "Anfangssaldo" : locale === "pt" ? "Saldo de abertura" : locale === "tr" ? "Açılış bakiyesi" : locale === "ru" ? "Входящий остаток" : locale === "hi" ? "प्रारंभिक शेष" : locale === "id" ? "Saldo awal" : "Opening balance",
    currency: locale === "ar" ? "العملة" : locale === "es" ? "Moneda" : locale === "nl" ? "Valuta" : locale === "fr" ? "Devise" : locale === "de" ? "Währung" : locale === "pt" ? "Moeda" : locale === "tr" ? "Para birimi" : locale === "ru" ? "Валюта" : locale === "hi" ? "मुद्रा" : locale === "id" ? "Mata uang" : "Currency",
    fields: locale === "ar" ? "بيانات الحساب" : locale === "es" ? "Datos de la cuenta" : locale === "nl" ? "Rekeninggegevens" : locale === "fr" ? "Informations du compte" : locale === "de" ? "Kontodaten" : locale === "pt" ? "Dados da conta" : locale === "tr" ? "Hesap bilgileri" : locale === "ru" ? "Данные счёта" : locale === "hi" ? "खाता विवरण" : locale === "id" ? "Data rekening" : "Account details",
  };

  const inputCls = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500";

  const run = async (file: File) => {
    setStage("busy");
    try {
      const sheet = await readSheet(file);
      if (sheet.length < 2) throw new Error("empty");
      // skip header row; map 6 columns: Date, Description, Debit, Credit, Currency, Reference
      const transactions: ExcelTransaction[] = [];
      for (const row of sheet.slice(1)) {
        const [date, desc, debit, credit, cur, ref] = row;
        if (debit == null && credit == null) continue;
        transactions.push({
          date: String(date ?? ""),
          debit: debit == null || debit === "" ? null : Number(debit),
          credit: credit == null || credit === "" ? null : Number(credit),
          currency: String(cur ?? currency),
          reference: String(ref ?? ""),
          description: String(desc ?? ""),
        });
      }
      if (!transactions.length) throw new Error("empty");
      const text = buildMt940(transactions, {
        account,
        reference,
        statementNo,
        openingBalance: Number(opening) || 0,
        currency,
      });
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      setOut(blob);
      setName(replaceExt(file.name, "940"));
      setSummary({ count: transactions.length, account });
      setPreview(text);
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
        <div className="mb-4 max-h-48 overflow-auto rounded-xl border border-line bg-surface/60 p-3">
          <pre dir="ltr" className="whitespace-pre-wrap text-left font-mono text-[11px] leading-relaxed">{preview}</pre>
        </div>
        <p dir="ltr" className="font-mono text-sm text-ink-soft">{summary.count} tx · {formatBytes(out.size)}</p>
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(out, name)}>{t("download")} .940</PrimaryButton>
      </ResultCard>
    );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line p-4">
        <span className="mb-3 block text-sm font-semibold">{L.fields}</span>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-1 block text-xs text-ink-soft">{L.account}</span>
            <input dir="ltr" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="NLxx BANK xxxx xxxx xxxx" className={inputCls} /></label>
          <label className="block"><span className="mb-1 block text-xs text-ink-soft">{L.reference}</span>
            <input dir="ltr" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="REFERENCE" className={inputCls} /></label>
          <label className="block"><span className="mb-1 block text-xs text-ink-soft">{L.statementNo}</span>
            <input dir="ltr" value={statementNo} onChange={(e) => setStatementNo(e.target.value)} className={inputCls} /></label>
          <label className="block"><span className="mb-1 block text-xs text-ink-soft">{L.currency}</span>
            <input dir="ltr" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} className={inputCls} /></label>
          <label className="block"><span className="mb-1 block text-xs text-ink-soft">{L.openingBalance}</span>
            <input dir="ltr" value={opening} onChange={(e) => setOpening(e.target.value)} className={inputCls} /></label>
        </div>
        <p className="mt-3 text-xs text-ink-soft">Excel: Date | Description | Debit | Credit | Currency | Reference</p>
      </div>
      <FileDropzone accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onFiles={(f) => run(f[0])} />
    </div>
  );
}

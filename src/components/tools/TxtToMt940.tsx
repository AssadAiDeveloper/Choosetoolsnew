"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { downloadBlob, formatBytes, replaceExt } from "@/lib/download";
import { buildMt940, ExcelTransaction } from "./ExcelToMt940";

/** Detect the most likely delimiter in a CSV-ish text line. */
function detectDelimiter(line: string): string {
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = -1;
  for (const c of candidates) {
    const count = line.split(c).length - 1;
    if (count > bestCount) { bestCount = count; best = c; }
  }
  return best;
}

/** Split a delimited line respecting a simple quoted field (double quotes). */
function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === delim && !inQ) { out.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

/** Parse a delimited text/CSV file into transaction rows (Date, Description, Debit, Credit, Currency, Reference). */
export function parseTextToTransactions(text: string, defaultCurrency: string): ExcelTransaction[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const delim = detectDelimiter(lines[0]);
  const rows = lines.map((l) => splitLine(l, delim));
  const transactions: ExcelTransaction[] = [];
  for (const row of rows) {
    // tolerate a header row (first field is a known column name)
    const first = String(row[0] ?? "").toLowerCase();
    if (/^date|datum|fecha|tarih|дата|วันที่|التاريخ/i.test(first)) continue;
    const [date, desc, debit, credit, cur, ref] = row;
    if (debit == null && credit == null) continue;
    if (debit === "" && credit === "") continue;
    const num = (v: string | undefined) => {
      if (v == null || String(v).trim() === "") return null;
      return Number(String(v).replace(/[^\d.,-]/g, "").replace(",", "."));
    };
    transactions.push({
      date: String(date ?? ""),
      debit: num(debit),
      credit: num(credit),
      currency: String(cur ?? defaultCurrency),
      reference: String(ref ?? ""),
      description: String(desc ?? ""),
    });
  }
  return transactions;
}

export default function TxtToMt940() {
  const t = useTranslations("tool");
  const locale = useLocale();
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [out, setOut] = useState<Blob | null>(null);
  const [name, setName] = useState("statement.940");
  const [summary, setSummary] = useState({ count: 0, account: "" });
  const [account, setAccount] = useState("");
  const [reference, setReference] = useState("");
  const [statementNo, setStatementNo] = useState("1/1");
  const [opening, setOpening] = useState("0");
  const [currency, setCurrency] = useState("EUR");

  const L = {
    delimiter: locale === "ar" ? "الفاصل" : locale === "es" ? "Delimitador" : locale === "nl" ? "Scheidingsteken" : locale === "fr" ? "Séparateur" : locale === "de" ? "Trennzeichen" : locale === "pt" ? "Delimitador" : locale === "tr" ? "Ayraç" : locale === "ru" ? "Разделитель" : locale === "hi" ? "विभाजक" : locale === "id" ? "Pemisah" : "Delimiter",
    delimiterAuto: locale === "ar" ? "تلقائي" : locale === "es" ? "Auto" : locale === "nl" ? "Auto" : locale === "fr" ? "Auto" : locale === "de" ? "Auto" : locale === "pt" ? "Auto" : locale === "tr" ? "Otomatik" : locale === "ru" ? "Авто" : locale === "hi" ? "स्वतः" : locale === "id" ? "Otomatis" : "Auto",
    columnsHint: locale === "ar" ? "التاريخ | الوصف | المدين | الدائن | العملة | المرجع" : locale === "es" ? "Fecha | Descripción | Débito | Crédito | Moneda | Referencia" : locale === "nl" ? "Datum | Omschrijving | Debet | Credit | Valuta | Referentie" : locale === "fr" ? "Date | Description | Débit | Crédit | Devise | Référence" : locale === "de" ? "Datum | Beschreibung | Soll | Haben | Währung | Verwendungszweck" : locale === "pt" ? "Data | Descrição | Débito | Crédito | Moeda | Referência" : locale === "tr" ? "Tarih | Açıklama | Borç | Alacak | Para birimi | Referans" : locale === "ru" ? "Дата | Описание | Дебет | Кредит | Валюта | Ссылка" : locale === "hi" ? "तिथि | विवरण | डेबिट | क्रेडिट | मुद्रा | संदर्भ" : locale === "id" ? "Tanggal | Deskripsi | Debit | Kredit | Mata uang | Referensi" : "Date | Description | Debit | Credit | Currency | Reference",
    fields: locale === "ar" ? "بيانات الحساب" : locale === "es" ? "Datos de la cuenta" : locale === "nl" ? "Rekeninggegevens" : locale === "fr" ? "Informations du compte" : locale === "de" ? "Kontodaten" : locale === "pt" ? "Dados da conta" : locale === "tr" ? "Hesap bilgileri" : locale === "ru" ? "Данные счёта" : locale === "hi" ? "खाता विवरण" : locale === "id" ? "Data rekening" : "Account details",
    account: locale === "ar" ? "رقم الحساب (IBAN)" : locale === "es" ? "N.º de cuenta (IBAN)" : locale === "nl" ? "Rekeningnummer (IBAN)" : locale === "fr" ? "N° de compte (IBAN)" : locale === "de" ? "Kontonummer (IBAN)" : locale === "pt" ? "Nº da conta (IBAN)" : locale === "tr" ? "Hesap numarası (IBAN)" : locale === "ru" ? "Номер счёта (IBAN)" : locale === "hi" ? "खाता संख्या (IBAN)" : locale === "id" ? "Nomor rekening (IBAN)" : "Account number (IBAN)",
    reference: locale === "ar" ? "المرجع" : locale === "es" ? "Referencia" : locale === "nl" ? "Referentie" : locale === "fr" ? "Référence" : locale === "de" ? "Referenz" : locale === "pt" ? "Referência" : locale === "tr" ? "Referans" : locale === "ru" ? "Ссылка" : locale === "hi" ? "संदर्भ" : locale === "id" ? "Referensi" : "Reference",
    statementNo: locale === "ar" ? "رقم الكشف" : locale === "es" ? "N.º de extracto" : locale === "nl" ? "Afschriftnr" : locale === "fr" ? "N° de relevé" : locale === "de" ? "Kontoauszugsnr" : locale === "pt" ? "Nº do extrato" : locale === "tr" ? "Ekstre no" : locale === "ru" ? "№ выписки" : locale === "hi" ? "विवरण संख्या" : locale === "id" ? "No. mutasi" : "Statement no",
    openingBalance: locale === "ar" ? "الرصيد الافتتاحي" : locale === "es" ? "Saldo de apertura" : locale === "nl" ? "Openingssaldo" : locale === "fr" ? "Solde d'ouverture" : locale === "de" ? "Anfangssaldo" : locale === "pt" ? "Saldo de abertura" : locale === "tr" ? "Açılış bakiyesi" : locale === "ru" ? "Входящий остаток" : locale === "hi" ? "प्रारंभिक शेष" : locale === "id" ? "Saldo awal" : "Opening balance",
    currency: locale === "ar" ? "العملة" : locale === "es" ? "Moneda" : locale === "nl" ? "Valuta" : locale === "fr" ? "Devise" : locale === "de" ? "Währung" : locale === "pt" ? "Moeda" : locale === "tr" ? "Para birimi" : locale === "ru" ? "Валюта" : locale === "hi" ? "मुद्रा" : locale === "id" ? "Mata uang" : "Currency",
  };

  const inputCls = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500";

  const run = async (file: File) => {
    setStage("busy");
    try {
      const text = await file.text();
      const transactions = parseTextToTransactions(text, currency);
      if (!transactions.length) throw new Error("empty");
      const mt940 = buildMt940(transactions, {
        account,
        reference,
        statementNo,
        openingBalance: Number(opening) || 0,
        currency,
      });
      setOut(new Blob([mt940], { type: "text/plain;charset=utf-8" }));
      setName(replaceExt(file.name, "940"));
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
        <p className="mt-3 text-xs text-ink-soft">{L.columnsHint}</p>
      </div>
      <FileDropzone accept=".txt,.csv,.tsv,.log,.940,.sta" onFiles={(f) => run(f[0])} />
    </div>
  );
}

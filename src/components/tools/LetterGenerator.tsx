"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PrimaryButton } from "../ToolShell";
import { downloadBlob } from "@/lib/download";

type LetterType = "resignation" | "leave" | "complaint" | "appeal" | "transfer" | "job";

export default function LetterGenerator() {
  const locale = useLocale();
  const t = useTranslations("tools.letter-generator");
  const L = {
    name: t("ui.name"), company: t("ui.company"), position: t("ui.position"),
    date: t("ui.date"), copy: t("ui.copy"), copied: t("ui.copied"), download: t("ui.download"),
    types: {
      resignation: t("ui.typeResignation"), leave: t("ui.typeLeave"),
      complaint: t("ui.typeComplaint"), appeal: t("ui.typeAppeal"),
      transfer: t("ui.typeTransfer"), job: t("ui.typeJob"),
    },
  };

  const [type, setType] = useState<LetterType>("resignation");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [date, setDate] = useState(() =>
    new Date().toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })
  );
  const [copied, setCopied] = useState(false);

  const types: LetterType[] = ["resignation", "leave", "complaint", "appeal", "transfer", "job"];
  const letter = useMemo(() => {
    const raw = t.raw(`body.${type}`) as string;
    return raw
      .replaceAll("{name}", name.trim() || "----------")
      .replaceAll("{company}", company.trim() || "[Company]")
      .replaceAll("{position}", position.trim() || "[Position]")
      .replaceAll("{date}", date || "[Date]");
  }, [t, type, name, company, position, date]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const input = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500";
  const label = "mb-1 block text-xs font-medium text-ink-soft";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {types.map((lt) => (
          <button key={lt} onClick={() => setType(lt)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${type === lt ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line hover:border-brand-500"}`}>
            {L.types[lt]}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block"><span className={label}>{L.name}</span>
          <input dir="auto" value={name} onChange={(e) => setName(e.target.value)} className={input} /></label>
        <label className="block"><span className={label}>{L.company}</span>
          <input dir="auto" value={company} onChange={(e) => setCompany(e.target.value)} className={input} /></label>
        <label className="block"><span className={label}>{L.position}</span>
          <input dir="auto" value={position} onChange={(e) => setPosition(e.target.value)} className={input} /></label>
      </div>
      <label className="block"><span className={label}>{L.date}</span>
        <input dir="ltr" value={date} onChange={(e) => setDate(e.target.value)} className={input} /></label>
      <textarea dir="auto" readOnly value={letter} rows={16}
        className="w-full rounded-card border border-brand-100 bg-brand-50/40 p-4 text-sm leading-relaxed" />
      <div className="flex flex-wrap gap-3">
        <PrimaryButton onClick={copy}>{copied ? L.copied : L.copy}</PrimaryButton>
        <button onClick={() => downloadBlob(new Blob([letter], { type: "text/plain;charset=utf-8" }), "letter.txt")}
          className="rounded-xl border border-line bg-surface px-6 py-3 font-medium text-ink hover:border-brand-500 hover:text-brand-700">
          {L.download} .txt
        </button>
      </div>
    </div>
  );
}
"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { CopyButton } from "./TextAreas";

export default function TimestampConverter() {
  const locale = useLocale();
  const [input, setInput] = useState(String(Math.floor(Date.now() / 1000)));

  const rows = useMemo(() => {
    const trimmed = input.trim();
    let date: Date | null = null;
    if (/^\d{10}$/.test(trimmed)) date = new Date(parseInt(trimmed) * 1000);
    else if (/^\d{13}$/.test(trimmed)) date = new Date(parseInt(trimmed));
    else if (trimmed) {
      const d = new Date(trimmed);
      if (!Number.isNaN(d.getTime())) date = d;
    }
    if (!date) return null;
    const fmtLocale = locale === "ar" ? "ar" : locale === "es" ? "es" : "en";
    return [
      ["Unix (s)", String(Math.floor(date.getTime() / 1000))],
      ["Unix (ms)", String(date.getTime())],
      ["ISO 8601", date.toISOString()],
      ["Local", new Intl.DateTimeFormat(fmtLocale, { dateStyle: "full", timeStyle: "medium" }).format(date)],
    ] as [string, string][];
  }, [input, locale]);

  return (
    <div className="space-y-4">
      <input
        dir="ltr"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="1751896800 / 2026-07-07T12:00:00Z"
        className="w-full rounded-card border border-line bg-surface px-5 py-3.5 font-mono outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      {rows && (
        <div className="space-y-2">
          {rows.map(([label, val]) => (
            <div key={label} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2.5">
              <span className="w-20 shrink-0 font-mono text-xs font-semibold text-brand-700">{label}</span>
              <span dir="ltr" className="flex-1 truncate font-mono text-sm">{val}</span>
              <CopyButton text={val} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

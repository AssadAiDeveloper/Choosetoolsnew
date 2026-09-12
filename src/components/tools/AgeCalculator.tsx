"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";

function diffYMD(from: Date, to: Date) {
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  if (days < 0) {
    months--;
    days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
  }
  if (months < 0) { years--; months += 12; }
  return { years, months, days };
}

export default function AgeCalculator() {
  const locale = useLocale();
  const [birth, setBirth] = useState("");

  const L = locale === "ar"
    ? { years: "سنة", months: "شهر", days: "يوم", total: "إجمالي الأيام", hijri: "تاريخ الميلاد بالهجري", next: "يوم الميلاد القادم بعد" }
    : locale === "es"
    ? { years: "años", months: "meses", days: "días", total: "Días totales", hijri: "Fecha de nacimiento (hégira)", next: "Próximo cumpleaños en" }
    : { years: "years", months: "months", days: "days", total: "Total days", hijri: "Birth date (Hijri)", next: "Next birthday in" };

  const result = useMemo(() => {
    if (!birth) return null;
    const b = new Date(birth + "T00:00:00");
    const now = new Date();
    if (Number.isNaN(b.getTime()) || b > now) return null;
    const age = diffYMD(b, now);
    const totalDays = Math.floor((now.getTime() - b.getTime()) / 86400000);
    const hijri = new Intl.DateTimeFormat(
      (locale === "ar" ? "ar" : "en") + "-u-ca-islamic-umalqura",
      { day: "numeric", month: "long", year: "numeric" }
    ).format(b);
    let next = new Date(now.getFullYear(), b.getMonth(), b.getDate());
    if (next < now) next = new Date(now.getFullYear() + 1, b.getMonth(), b.getDate());
    const daysToNext = Math.ceil((next.getTime() - now.getTime()) / 86400000);
    return { age, totalDays, hijri, daysToNext };
  }, [birth, locale]);

  const fmt = new Intl.NumberFormat(locale === "ar" ? "ar" : "en");

  return (
    <div className="space-y-4">
      <input
        type="date"
        value={birth}
        onChange={(e) => setBirth(e.target.value)}
        max={new Date().toISOString().slice(0, 10)}
        className="w-full rounded-card border border-line bg-surface px-5 py-3.5 font-mono text-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              [result.age.years, L.years],
              [result.age.months, L.months],
              [result.age.days, L.days],
            ].map(([n, label]) => (
              <div key={label} className="rounded-card border border-brand-100 bg-brand-50/60 py-5">
                <p className="text-3xl font-bold text-brand-800">{fmt.format(n as number)}</p>
                <p className="mt-1 text-sm text-ink-soft">{label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2 rounded-card border border-line bg-surface p-5 text-sm">
            <p className="flex justify-between gap-4"><span className="text-ink-soft">{L.total}</span><span className="font-mono">{fmt.format(result.totalDays)}</span></p>
            <p className="flex justify-between gap-4"><span className="text-ink-soft">{L.hijri}</span><span>{result.hijri}</span></p>
            <p className="flex justify-between gap-4"><span className="text-ink-soft">{L.next}</span><span className="font-mono">{fmt.format(result.daysToNext)} {L.days}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}

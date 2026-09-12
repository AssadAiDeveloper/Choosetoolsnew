"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";

const CAL = "islamic-umalqura";

function hijriParts(date: Date): { y: number; m: number; d: number } {
  const fmt = new Intl.DateTimeFormat(`en-u-ca-${CAL}`, {
    year: "numeric", month: "numeric", day: "numeric",
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? "0");
  return { y: get("year"), m: get("month"), d: get("day") };
}

/** Find the Gregorian date matching a Hijri Y/M/D (Umm al-Qura) by estimate + local scan */
function hijriToGregorian(y: number, m: number, d: number): Date | null {
  const HIJRI_EPOCH = Date.UTC(622, 6, 19);
  const days = (y - 1) * 354.36667 + (m - 1) * 29.5305 + (d - 1);
  const est = new Date(HIJRI_EPOCH + days * 86400000);
  for (let off = -4; off <= 4; off++) {
    const candidate = new Date(est.getTime() + off * 86400000);
    const h = hijriParts(candidate);
    if (h.y === y && h.m === m && h.d === d) return candidate;
  }
  return null;
}

const HIJRI_MONTHS_AR = ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"];
const HIJRI_MONTHS_EN = ["Muharram", "Safar", "Rabiʿ I", "Rabiʿ II", "Jumada I", "Jumada II", "Rajab", "Shaʿban", "Ramadan", "Shawwal", "Dhu al-Qiʿdah", "Dhu al-Hijjah"];

export default function HijriGregorian() {
  const locale = useLocale();
  const today = useMemo(() => new Date(), []);
  const [gDate, setGDate] = useState(today.toISOString().slice(0, 10));
  const [hY, setHY] = useState(() => hijriParts(today).y);
  const [hM, setHM] = useState(() => hijriParts(today).m);
  const [hD, setHD] = useState(() => hijriParts(today).d);

  const L = {
    g2h: locale === "ar" ? "ميلادي ← هجري" : locale === "es" ? "Gregoriano → Hégira" : "Gregorian → Hijri",
    h2g: locale === "ar" ? "هجري ← ميلادي" : locale === "es" ? "Hégira → Gregoriano" : "Hijri → Gregorian",
    year: locale === "ar" ? "السنة" : locale === "es" ? "Año" : "Year",
    month: locale === "ar" ? "الشهر" : locale === "es" ? "Mes" : "Month",
    day: locale === "ar" ? "اليوم" : locale === "es" ? "Día" : "Day",
    invalid: locale === "ar" ? "تاريخ غير صالح" : locale === "es" ? "Fecha no válida" : "Invalid date",
  };
  const months = locale === "ar" ? HIJRI_MONTHS_AR : HIJRI_MONTHS_EN;

  // Gregorian -> Hijri
  const g2hResult = useMemo(() => {
    const dt = new Date(gDate + "T12:00:00Z");
    if (isNaN(dt.getTime())) return null;
    return new Intl.DateTimeFormat(`${locale}-u-ca-${CAL}`, {
      weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
    }).format(dt);
  }, [gDate, locale]);

  // Hijri -> Gregorian
  const h2gResult = useMemo(() => {
    const g = hijriToGregorian(hY, hM, hD);
    if (!g) return null;
    return new Intl.DateTimeFormat(locale, {
      weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
    }).format(g);
  }, [hY, hM, hD, locale]);

  const inputCls = "mt-1 block w-full rounded-lg border border-line px-3 py-2 font-mono";

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-card border border-line bg-surface p-5">
        <h3 className="font-semibold text-brand-700">{L.g2h}</h3>
        <input dir="ltr" type="date" value={gDate} onChange={(e) => setGDate(e.target.value)}
          className={inputCls + " mt-4"} />
        <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-center text-lg font-semibold text-ink">
          {g2hResult ?? L.invalid}
        </p>
      </section>

      <section className="rounded-card border border-line bg-surface p-5">
        <h3 className="font-semibold text-brand-700">{L.h2g}</h3>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <label className="text-sm font-medium">
            {L.day}
            <input dir="ltr" type="number" min={1} max={30} value={hD} onChange={(e) => setHD(+e.target.value)} className={inputCls} />
          </label>
          <label className="text-sm font-medium col-span-1">
            {L.month}
            <select value={hM} onChange={(e) => setHM(+e.target.value)} className={inputCls}>
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            {L.year}
            <input dir="ltr" type="number" min={1} max={1600} value={hY} onChange={(e) => setHY(+e.target.value)} className={inputCls} />
          </label>
        </div>
        <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-center text-lg font-semibold text-ink">
          {h2gResult ?? L.invalid}
        </p>
      </section>
    </div>
  );
}

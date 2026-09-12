"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { CopyButton } from "./TextAreas";

const ONES = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
const TEENS = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
const TENS = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const HUNDREDS = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

/** words for 1..999 */
function threeDigits(n: number): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) parts.push(HUNDREDS[h]);
  if (rest) {
    if (rest < 10) parts.push(ONES[rest]);
    else if (rest < 20) parts.push(TEENS[rest - 10]);
    else {
      const t = Math.floor(rest / 10);
      const o = rest % 10;
      parts.push(o ? `${ONES[o]} و${TENS[t]}` : TENS[t]);
    }
  }
  return parts.join(" و");
}

interface Scale {
  singular: string; // ألف
  dual: string; // ألفان
  plural: string; // آلاف (for 3–10)
  accusative: string; // ألفاً (for 11+)
}

const SCALES: Scale[] = [
  { singular: "", dual: "", plural: "", accusative: "" },
  { singular: "ألف", dual: "ألفان", plural: "آلاف", accusative: "ألفاً" },
  { singular: "مليون", dual: "مليونان", plural: "ملايين", accusative: "مليوناً" },
  { singular: "مليار", dual: "ملياران", plural: "مليارات", accusative: "ملياراً" },
];

function groupWords(n: number, scale: Scale): string {
  if (!scale.singular) return threeDigits(n);
  if (n === 1) return scale.singular;
  if (n === 2) return scale.dual;
  if (n <= 10) return `${threeDigits(n)} ${scale.plural}`;
  return `${threeDigits(n)} ${scale.accusative}`;
}

export function tafqit(n: number): string {
  if (!Number.isFinite(n) || n < 0 || n > 999_999_999_999) return "";
  if (n === 0) return "صفر";
  const groups: number[] = [];
  let x = Math.floor(n);
  while (x > 0) { groups.push(x % 1000); x = Math.floor(x / 1000); }
  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i]) parts.push(groupWords(groups[i], SCALES[i]));
  }
  return parts.join(" و");
}

const CURRENCIES = [
  { id: "", label: { en: "Plain number", ar: "بدون عملة", es: "Solo número" }, word: "" },
  { id: "sar", label: { en: "SAR", ar: "ريال سعودي", es: "SAR" }, word: "ريال سعودي" },
  { id: "aed", label: { en: "AED", ar: "درهم إماراتي", es: "AED" }, word: "درهم إماراتي" },
  { id: "egp", label: { en: "EGP", ar: "جنيه مصري", es: "EGP" }, word: "جنيه مصري" },
  { id: "usd", label: { en: "USD", ar: "دولار أمريكي", es: "USD" }, word: "دولار أمريكي" },
  { id: "eur", label: { en: "EUR", ar: "يورو", es: "EUR" }, word: "يورو" },
];

export default function Tafqit() {
  const locale = (useLocale() as "en" | "ar" | "es") ?? "en";
  const [value, setValue] = useState("15750");
  const [currency, setCurrency] = useState(CURRENCIES[1]);

  const result = useMemo(() => {
    const clean = value.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[,\s]/g, "");
    const n = parseInt(clean || "0");
    const words = tafqit(n);
    if (!words) return "";
    return currency.word
      ? `${words} ${currency.word} فقط لا غير`
      : words;
  }, [value, currency]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <input
          dir="ltr"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded-card border border-line bg-surface px-5 py-3.5 font-mono text-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          placeholder="15750"
        />
        <select
          value={currency.id}
          onChange={(e) => setCurrency(CURRENCIES.find((c) => c.id === e.target.value)!)}
          className="rounded-card border border-line bg-surface px-4 py-3.5 text-sm"
        >
          {CURRENCIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label[locale]}</option>
          ))}
        </select>
      </div>
      <div className="rounded-card border border-brand-100 bg-brand-50/60 p-6">
        <p dir="rtl" className="text-center text-xl font-semibold leading-relaxed text-ink">
          {result || "—"}
        </p>
        {result && (
          <div className="mt-4 text-center">
            <CopyButton text={result} />
          </div>
        )}
      </div>
    </div>
  );
}

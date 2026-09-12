"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { CopyButton } from "./TextAreas";

const RATE = 0.025; // 2.5%

export default function ZakatCalculator() {
  const locale = useLocale();
  const [cash, setCash] = useState("");
  const [gold, setGold] = useState("");
  const [debts, setDebts] = useState("");
  const [nisab, setNisab] = useState("");

  const L = locale === "ar"
    ? { cash: "النقد والحسابات البنكية", gold: "قيمة الذهب والفضة والأسهم", debts: "الديون المستحقة عليك (تُخصم)", nisab: "قيمة النصاب اليوم (اختياري)", base: "الوعاء الزكوي", due: "الزكاة الواجبة (2.5٪)", below: "المجموع أقل من النصاب — لا زكاة واجبة", note: "النصاب = قيمة 85 غرام ذهب. أدخل قيمته بعملتك حسب سعر الذهب اليوم." }
    : locale === "es"
    ? { cash: "Efectivo y cuentas bancarias", gold: "Valor de oro, plata y acciones", debts: "Deudas que debes (se restan)", nisab: "Valor del nisab hoy (opcional)", base: "Base de zakat", due: "Zakat a pagar (2,5%)", below: "El total está por debajo del nisab: no se debe zakat", note: "Nisab = valor de 85 g de oro. Introdúcelo en tu moneda según el precio actual." }
    : { cash: "Cash & bank accounts", gold: "Value of gold, silver & stocks", debts: "Debts you owe (deducted)", nisab: "Today's nisab value (optional)", base: "Zakat base", due: "Zakat due (2.5%)", below: "Total is below the nisab — no zakat due", note: "Nisab = value of 85g of gold. Enter it in your currency at today's gold price." };

  const { base, due, belowNisab } = useMemo(() => {
    const n = (s: string) => parseFloat(s.replace(/[,\s]/g, "")) || 0;
    const b = Math.max(0, n(cash) + n(gold) - n(debts));
    const nis = n(nisab);
    return { base: b, due: b * RATE, belowNisab: nis > 0 && b < nis };
  }, [cash, gold, debts, nisab]);

  const fmt = new Intl.NumberFormat(locale === "ar" ? "ar" : locale === "es" ? "es" : "en", { maximumFractionDigits: 2 });
  const inputClass = "w-full rounded-lg border border-line px-3 py-2.5 font-mono outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-card border border-line bg-surface p-5">
        {[
          { label: L.cash, value: cash, set: setCash },
          { label: L.gold, value: gold, set: setGold },
          { label: L.debts, value: debts, set: setDebts },
          { label: L.nisab, value: nisab, set: setNisab },
        ].map((f) => (
          <label key={f.label} className="block">
            <span className="mb-1 block text-sm font-medium text-ink-soft">{f.label}</span>
            <input dir="ltr" inputMode="decimal" value={f.value} onChange={(e) => f.set(e.target.value)} className={inputClass} placeholder="0" />
          </label>
        ))}
        <p className="text-xs leading-relaxed text-ink-soft">{L.note}</p>
      </div>
      <div className="rounded-card border border-brand-100 bg-brand-50/60 p-6 text-center">
        {belowNisab ? (
          <p className="font-medium text-ink-soft">{L.below}</p>
        ) : (
          <>
            <p className="text-sm text-ink-soft">{L.base}: <span className="font-mono">{fmt.format(base)}</span></p>
            <p className="mt-2 text-2xl font-bold text-brand-800">
              {L.due}: <span dir="ltr" className="font-mono">{fmt.format(due)}</span>
            </p>
            {due > 0 && <div className="mt-3"><CopyButton text={due.toFixed(2)} /></div>}
          </>
        )}
      </div>
    </div>
  );
}

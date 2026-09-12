"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";

type Op = { type: "same" | "add" | "del"; line: string };

/** Simple LCS-based line diff — fine for texts up to a few thousand lines */
function diffLines(a: string[], b: string[]): Op[] {
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: Op[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ type: "same", line: a[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: "del", line: a[i] }); i++; }
    else { out.push({ type: "add", line: b[j] }); j++; }
  }
  while (i < n) out.push({ type: "del", line: a[i++] });
  while (j < m) out.push({ type: "add", line: b[j++] });
  return out;
}

export default function TextDiff() {
  const locale = useLocale();
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");

  const ops = useMemo(() => {
    if (!left && !right) return [];
    return diffLines(left.split(/\r?\n/), right.split(/\r?\n/));
  }, [left, right]);

  const L = {
    a: locale === "ar" ? "النص الأول" : locale === "es" ? "Texto A" : "Text A",
    b: locale === "ar" ? "النص الثاني" : locale === "es" ? "Texto B" : "Text B",
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { label: L.a, value: left, set: setLeft },
          { label: L.b, value: right, set: setRight },
        ].map((s) => (
          <div key={s.label}>
            <label className="mb-1.5 block text-sm font-medium text-ink-soft">{s.label}</label>
            <textarea dir="auto" value={s.value} onChange={(e) => s.set(e.target.value)} rows={8}
              className="w-full resize-y rounded-card border border-line bg-surface p-4 font-mono text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          </div>
        ))}
      </div>
      {ops.length > 0 && (
        <pre dir="auto" className="max-h-96 overflow-auto rounded-card border border-line bg-surface p-4 text-sm leading-relaxed">
          {ops.map((op, i) => (
            <div key={i} className={
              op.type === "add" ? "bg-brand-50 text-brand-900" :
              op.type === "del" ? "bg-red-50 text-red-800 line-through decoration-red-300" : ""
            }>
              <span className="me-2 inline-block w-4 select-none font-mono text-xs text-ink-soft">
                {op.type === "add" ? "+" : op.type === "del" ? "−" : " "}
              </span>
              {op.line || " "}
            </div>
          ))}
        </pre>
      )}
    </div>
  );
}

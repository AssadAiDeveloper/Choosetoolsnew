"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CopyButton } from "./TextAreas";
import { PrimaryButton } from "../ToolShell";

const SETS = {
  lower: "abcdefghijkmnopqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  digits: "23456789",
  symbols: "!@#$%^&*-_=+?",
};

export default function PasswordGenerator() {
  const t = useTranslations("tool");
  const [len, setLen] = useState(20);
  const [opts, setOpts] = useState({ lower: true, upper: true, digits: true, symbols: true });
  const [pw, setPw] = useState("");

  const generate = useCallback(() => {
    const pool = (Object.keys(SETS) as (keyof typeof SETS)[])
      .filter((k) => opts[k])
      .map((k) => SETS[k])
      .join("");
    if (!pool) return;
    const buf = new Uint32Array(len);
    crypto.getRandomValues(buf);
    setPw(Array.from(buf, (n) => pool[n % pool.length]).join(""));
  }, [len, opts]);

  useEffect(() => { generate(); }, [generate]);

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-line bg-surface p-6">
        <p dir="ltr" className="break-all text-center font-mono text-xl font-semibold tracking-wide text-ink">
          {pw}
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <PrimaryButton onClick={generate}>{t("generate")}</PrimaryButton>
          <CopyButton text={pw} />
        </div>
      </div>
      <div className="rounded-card border border-line bg-surface p-4 space-y-4">
        <label className="flex items-center gap-4 text-sm font-medium">
          {t("length")}
          <input type="range" min={8} max={64} value={len} onChange={(e) => setLen(+e.target.value)} className="flex-1 accent-brand-600" />
          <span className="w-10 font-mono text-brand-700">{len}</span>
        </label>
        <div className="flex flex-wrap gap-5 text-sm">
          {(Object.keys(SETS) as (keyof typeof SETS)[]).map((k) => (
            <label key={k} className="flex items-center gap-2">
              <input type="checkbox" checked={opts[k]} onChange={(e) => setOpts((o) => ({ ...o, [k]: e.target.checked }))} className="accent-brand-600" />
              <span className="font-mono">{k === "lower" ? "abc" : k === "upper" ? "ABC" : k === "digits" ? "123" : "#$%"}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CopyButton } from "./TextAreas";
import { PrimaryButton } from "../ToolShell";

export default function UuidGenerator() {
  const t = useTranslations("tool");
  const [count, setCount] = useState(5);
  const [list, setList] = useState<string[]>(() => []);

  const generate = () =>
    setList(Array.from({ length: count }, () => crypto.randomUUID()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <PrimaryButton onClick={generate}>{t("generate")}</PrimaryButton>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input type="range" min={1} max={50} value={count}
            onChange={(e) => setCount(+e.target.value)} className="accent-brand-600" />
          <span className="w-8 font-mono text-brand-700">{count}</span>
        </label>
        {list.length > 0 && <CopyButton text={list.join("\n")} />}
      </div>
      {list.length > 0 && (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface">
          {list.map((id) => (
            <li key={id} dir="ltr" className="px-4 py-2.5 font-mono text-sm">{id}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { CopyButton } from "./TextAreas";
import { PrimaryButton } from "../ToolShell";

const WORDS = ("lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor " +
  "incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation " +
  "ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit " +
  "voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non " +
  "proident sunt culpa qui officia deserunt mollit anim id est laborum").split(" ");

function sentence(): string {
  const len = 8 + Math.floor(Math.random() * 10);
  const words = Array.from({ length: len }, () => WORDS[Math.floor(Math.random() * WORDS.length)]);
  return words[0][0].toUpperCase() + words.join(" ").slice(1) + ".";
}

function paragraph(): string {
  return Array.from({ length: 4 + Math.floor(Math.random() * 3) }, sentence).join(" ");
}

export default function LoremIpsum() {
  const locale = useLocale();
  const [count, setCount] = useState(3);
  const [text, setText] = useState("");

  const label = locale === "ar" ? "عدد الفقرات" : locale === "es" ? "Párrafos" : "Paragraphs";
  const btn = locale === "ar" ? "توليد" : locale === "es" ? "Generar" : "Generate";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <PrimaryButton onClick={() => setText(Array.from({ length: count }, paragraph).join("\n\n"))}>{btn}</PrimaryButton>
        <label className="flex items-center gap-3 text-sm font-medium">
          {label}
          <input type="range" min={1} max={10} value={count} onChange={(e) => setCount(+e.target.value)} className="accent-brand-600" />
          <span className="w-6 font-mono text-brand-700">{count}</span>
        </label>
        {text && <CopyButton text={text} />}
      </div>
      {text && (
        <div dir="ltr" className="whitespace-pre-wrap rounded-card border border-line bg-surface p-5 text-sm leading-relaxed text-ink-soft">{text}</div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "./TextAreas";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip Latin diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-") // keep Arabic letters — modern URLs support them
    .replace(/^-+|-+$/g, "");
}

export default function TextToSlug() {
  const [input, setInput] = useState("");
  const slug = useMemo(() => slugify(input), [input]);

  return (
    <div className="space-y-4">
      <input
        dir="auto"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoFocus
        className="w-full rounded-card border border-line bg-surface px-5 py-3.5 text-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      <div className="flex items-center gap-3 rounded-card border border-brand-100 bg-brand-50/60 px-5 py-4">
        <code dir="ltr" className="flex-1 break-all font-mono text-brand-800">{slug || "—"}</code>
        {slug && <CopyButton text={slug} />}
      </div>
    </div>
  );
}

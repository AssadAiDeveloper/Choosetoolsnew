"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";

export default function WordCounter() {
  const locale = useLocale();
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const chars = [...text].length;
    const charsNoSpace = [...text.replace(/\s/g, "")].length;
    let words = 0;
    if (text.trim()) {
      if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
        const seg = new Intl.Segmenter(locale, { granularity: "word" });
        for (const s of seg.segment(text)) if (s.isWordLike) words++;
      } else {
        words = text.trim().split(/\s+/).length;
      }
    }
    const sentences = (text.match(/[.!?؟…]+/g) ?? []).length || (text.trim() ? 1 : 0);
    const minutes = Math.max(1, Math.round(words / 200));
    return { chars, charsNoSpace, words, sentences, minutes: text.trim() ? minutes : 0 };
  }, [text, locale]);

  const labels: Record<string, Record<string, string>> = {
    en: { words: "Words", chars: "Characters", nospace: "No spaces", sentences: "Sentences", read: "Min read" },
    ar: { words: "كلمات", chars: "حروف", nospace: "بدون مسافات", sentences: "جُمل", read: "دقائق قراءة" },
    es: { words: "Palabras", chars: "Caracteres", nospace: "Sin espacios", sentences: "Frases", read: "Min lectura" },
  };
  const L = labels[locale] ?? labels.en;

  const cells: [string, number][] = [
    [L.words, stats.words],
    [L.chars, stats.chars],
    [L.nospace, stats.charsNoSpace],
    [L.sentences, stats.sentences],
    [L.read, stats.minutes],
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {cells.map(([label, value]) => (
          <div key={label} className="rounded-card border border-line bg-surface p-4 text-center">
            <p className="font-mono text-2xl font-semibold text-brand-700">{value.toLocaleString(locale)}</p>
            <p className="mt-1 text-xs text-ink-soft">{label}</p>
          </div>
        ))}
      </div>
      <textarea
        dir="auto"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        autoFocus
        className="w-full resize-y rounded-card border border-line bg-surface p-4 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton } from "../ToolShell";
import { downloadBlob } from "@/lib/download";

export default function PdfToAudio() {
  const locale = useLocale();
  const t = useTranslations("tool");
  const L =
    locale === "ar"
      ? { listen: "تشغيل", stop: "إيقاف", speed: "السرعة", downloadTxt: "تنزيل النص", done: "تم استخراج النص" }
      : locale === "es"
      ? { listen: "Reproducir", stop: "Detener", speed: "Velocidad", downloadTxt: "Descargar texto", done: "Texto extraído" }
      : { listen: "Listen", stop: "Stop", speed: "Speed", downloadTxt: "Download .txt", done: "Extracted text" };

  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [text, setText] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [rate, setRate] = useState(1);

  const run = async (file: File) => {
    setStage("busy");
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url
      ).toString();
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const parts: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const line = content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        parts.push(line);
      }
      setText(parts.join("\n\n"));
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  const reset = () => { setText(""); setStage("pick"); };

  const toggleSpeak = () => {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    if (!text.trim()) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = document.documentElement.lang || "en";
    u.rate = rate;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    setSpeaking(true);
  };

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={reset} />;
  if (stage === "done")
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton onClick={toggleSpeak}>{speaking ? L.stop : L.listen}</PrimaryButton>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            {L.speed}
            <input type="range" min={0.5} max={2} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="accent-brand-600" />
            <span className="font-mono text-xs">{rate}x</span>
          </label>
          <button onClick={() => downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), "listening-text.txt")}
            className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-brand-500 hover:text-brand-700">
            {L.downloadTxt}
          </button>
          <button onClick={reset} className="ms-auto text-sm text-ink-soft hover:text-red-600">✕</button>
        </div>
        <textarea dir="auto" readOnly value={text} rows={16}
          className="w-full rounded-card border border-brand-100 bg-brand-50/40 p-4 text-sm leading-relaxed" />
      </div>
    );

  return <FileDropzone accept="application/pdf" onFiles={(f) => run(f[0])} />;
}

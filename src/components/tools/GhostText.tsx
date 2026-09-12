"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { PrimaryButton } from "../ToolShell";
import { CopyButton } from "./TextAreas";

// Zero-width characters used as an invisible binary alphabet
const ZW0 = "\u200B"; // zero-width space  -> bit 0
const ZW1 = "\u200C"; // zero-width non-joiner -> bit 1
const ZW_END = "\u200D"; // zero-width joiner -> end marker

function textToBits(s: string): string {
  return [...new TextEncoder().encode(s)].map((b) => b.toString(2).padStart(8, "0")).join("");
}
function bitsToText(bits: string): string {
  const bytes = bits.match(/.{1,8}/g)?.map((b) => parseInt(b, 2)) ?? [];
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export default function GhostText() {
  const locale = useLocale();
  const [cover, setCover] = useState("");
  const [secret, setSecret] = useState("");
  const [output, setOutput] = useState("");
  const [revealed, setRevealed] = useState("");
  const [notFound, setNotFound] = useState(false);

  const L = locale === "ar"
    ? { cover: "النص الظاهر", secret: "الرسالة السرية", hide: "إخفاء الرسالة", reveal: "كشف الرسالة", revealed: "الرسالة المستخرجة", none: "لا توجد رسالة مخفية في هذا النص" }
    : locale === "es"
    ? { cover: "Texto visible", secret: "Mensaje secreto", hide: "Ocultar mensaje", reveal: "Revelar mensaje", revealed: "Mensaje extraído", none: "No hay ningún mensaje oculto en este texto" }
    : { cover: "Visible text", secret: "Secret message", hide: "Hide message", reveal: "Reveal message", revealed: "Extracted message", none: "No hidden message found in this text" };

  const hide = () => {
    const bits = textToBits(secret) ;
    const hidden = [...bits].map((b) => (b === "0" ? ZW0 : ZW1)).join("") + ZW_END;
    // Insert the invisible payload right after the first visible character
    const visible = cover || " ";
    setOutput(visible[0] + hidden + visible.slice(1));
  };

  const reveal = () => {
    const zwChars = [...cover].filter((c) => c === ZW0 || c === ZW1 || c === ZW_END);
    const endIdx = zwChars.indexOf(ZW_END);
    if (endIdx === -1) { setNotFound(true); setRevealed(""); return; }
    const bits = zwChars.slice(0, endIdx).map((c) => (c === ZW1 ? "1" : "0")).join("");
    setRevealed(bitsToText(bits));
    setNotFound(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-card border border-line bg-surface p-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">{L.cover}</span>
          <textarea dir="auto" value={cover} onChange={(e) => setCover(e.target.value)} rows={3}
            className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">{L.secret}</span>
          <input dir="auto" value={secret} onChange={(e) => setSecret(e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
        </label>
        <div className="flex flex-wrap gap-3">
          <PrimaryButton onClick={hide} disabled={!cover || !secret}>{L.hide}</PrimaryButton>
          <button onClick={reveal} disabled={!cover}
            className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium transition hover:border-brand-500 hover:text-brand-700 disabled:opacity-40">
            {L.reveal}
          </button>
        </div>
      </div>

      {output && (
        <div className="flex items-center gap-3 rounded-card border border-brand-100 bg-brand-50/60 p-4">
          <code dir="auto" className="flex-1 break-all">{output}</code>
          <CopyButton text={output} />
        </div>
      )}

      {revealed && (
        <div className="rounded-card border border-brand-100 bg-brand-50/60 p-4">
          <p className="text-sm font-medium text-ink-soft">{L.revealed}</p>
          <p dir="auto" className="mt-1 text-lg">{revealed}</p>
        </div>
      )}
      {notFound && <p className="text-sm text-red-600">{L.none}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { PrimaryButton, ResultCard, ErrorBox, Processing } from "../ToolShell";
import { downloadBlob } from "@/lib/download";
import { loadImage } from "@/lib/canvas";

// Classic least-significant-bit encoding: the message length (32 bits) then the
// message bytes are written one bit at a time into the red channel's LSB of each pixel.
function encodeLSB(data: Uint8ClampedArray, message: string) {
  const bytes = new TextEncoder().encode(message);
  const lenBits = bytes.length.toString(2).padStart(32, "0");
  const msgBits = [...bytes].map((b) => b.toString(2).padStart(8, "0")).join("");
  const bits = lenBits + msgBits;
  if (bits.length > data.length / 4) throw new Error("message too long for this image");
  for (let i = 0; i < bits.length; i++) {
    const pixelIndex = i * 4; // red channel of pixel i
    data[pixelIndex] = (data[pixelIndex] & 0xfe) | Number(bits[i]);
  }
}

function decodeLSB(data: Uint8ClampedArray): string {
  const readBit = (i: number) => data[i * 4] & 1;
  let lenBits = "";
  for (let i = 0; i < 32; i++) lenBits += readBit(i);
  const len = parseInt(lenBits, 2);
  if (!len || len > data.length / 4) return "";
  let msgBits = "";
  for (let i = 32; i < 32 + len * 8; i++) msgBits += readBit(i);
  const bytes = msgBits.match(/.{1,8}/g)?.map((b) => parseInt(b, 2)) ?? [];
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export default function Steganography() {
  const locale = useLocale();
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [message, setMessage] = useState("");
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [out, setOut] = useState<Blob | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);

  const L = locale === "ar"
    ? { encode: "إخفاء رسالة", decode: "كشف رسالة", message: "الرسالة", download: "تنزيل الصورة", found: "الرسالة المخفاة", none: "لا توجد رسالة مخفية في هذه الصورة" }
    : locale === "es"
    ? { encode: "Ocultar mensaje", decode: "Revelar mensaje", message: "Mensaje", download: "Descargar imagen", found: "Mensaje oculto", none: "No hay ningún mensaje oculto en esta imagen" }
    : { encode: "Hide message", decode: "Reveal message", message: "Message", download: "Download image", found: "Hidden message", none: "No hidden message found in this image" };

  const run = async (file: File) => {
    setStage("busy");
    try {
      const img = await loadImage(file);
      const canvas = document.createElement("canvas");
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (mode === "encode") {
        encodeLSB(imageData.data, message);
        ctx.putImageData(imageData, 0, 0);
        const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
        setOut(blob);
      } else {
        const text = decodeLSB(imageData.data);
        setRevealed(text || null);
      }
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  const reset = () => { setOut(null); setRevealed(null); setStage("pick"); };

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={reset} />;
  if (stage === "done" && mode === "encode" && out)
    return (
      <ResultCard onReset={reset}>
        <PrimaryButton onClick={() => downloadBlob(out, "hidden-message.png")}>{L.download}</PrimaryButton>
      </ResultCard>
    );
  if (stage === "done" && mode === "decode")
    return (
      <ResultCard onReset={reset}>
        {revealed ? (
          <>
            <p className="text-sm font-medium text-ink-soft">{L.found}</p>
            <p dir="auto" className="mt-2 text-lg">{revealed}</p>
          </>
        ) : (
          <p className="text-sm text-red-600">{L.none}</p>
        )}
      </ResultCard>
    );

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {(["encode", "decode"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition
              ${mode === m ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line hover:border-brand-500"}`}>
            {L[m]}
          </button>
        ))}
      </div>
      {mode === "encode" && (
        <input dir="auto" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={L.message}
          className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
      )}
      <FileDropzone
        accept="image/png"
        onFiles={(f) => run(f[0])}
      />
      {mode === "encode" && (
        <p className="text-xs text-ink-soft">PNG only — JPEG&apos;s lossy compression destroys the hidden bits.</p>
      )}
    </div>
  );
}

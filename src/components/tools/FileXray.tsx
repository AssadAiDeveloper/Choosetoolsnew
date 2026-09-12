"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { formatBytes } from "@/lib/download";

// A short list of common magic-number signatures, checked against the first bytes of the file
const SIGNATURES: { hex: string; type: string }[] = [
  { hex: "25504446", type: "PDF Document" },
  { hex: "89504e47", type: "PNG Image" },
  { hex: "ffd8ff", type: "JPEG Image" },
  { hex: "47494638", type: "GIF Image" },
  { hex: "504b0304", type: "ZIP / Office (docx, xlsx, pptx)" },
  { hex: "52494646", type: "RIFF (WAV / AVI)" },
  { hex: "00000018667479", type: "MP4 Video" },
  { hex: "494433", type: "MP3 Audio" },
  { hex: "377abcaf271c", type: "7-Zip Archive" },
  { hex: "1f8b08", type: "GZIP Archive" },
];

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function FileXray() {
  const locale = useLocale();
  const [info, setInfo] = useState<{
    name: string; size: number; mime: string; detected: string; hexDump: string; dims: string | null;
  } | null>(null);

  const L = locale === "ar"
    ? { name: "الاسم", size: "الحجم", mime: "نوع MIME المُعلن", detected: "النوع الحقيقي المكتشف", dims: "الأبعاد", hex: "أول 64 بايت (Hex)", unknown: "غير معروف" }
    : locale === "es"
    ? { name: "Nombre", size: "Tamaño", mime: "MIME declarado", detected: "Tipo real detectado", dims: "Dimensiones", hex: "Primeros 64 bytes (Hex)", unknown: "Desconocido" }
    : { name: "Name", size: "Size", mime: "Declared MIME", detected: "Detected true type", dims: "Dimensions", hex: "First 64 bytes (Hex)", unknown: "Unknown" };

  const analyze = async (file: File) => {
    const buf = new Uint8Array(await file.slice(0, 64).arrayBuffer());
    const hex = toHex(buf);
    const match = SIGNATURES.find((s) => hex.startsWith(s.hex));

    let dims: string | null = null;
    if (file.type.startsWith("image/")) {
      dims = await new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(`${img.naturalWidth} × ${img.naturalHeight}px`);
        img.onerror = () => resolve("—");
        img.src = URL.createObjectURL(file);
      });
    }

    setInfo({
      name: file.name,
      size: file.size,
      mime: file.type || L.unknown,
      detected: match?.type ?? L.unknown,
      hexDump: hex.match(/.{1,2}/g)?.join(" ") ?? "",
      dims,
    });
  };

  if (info)
    return (
      <div className="space-y-4">
        <div className="grid gap-3 rounded-card border border-line bg-surface p-5 sm:grid-cols-2">
          {[
            [L.name, info.name],
            [L.size, formatBytes(info.size)],
            [L.mime, info.mime],
            [L.detected, info.detected],
            ...(info.dims ? [[L.dims, info.dims]] : []),
          ].map(([label, value]) => (
            <div key={label as string}>
              <p className="text-xs text-ink-soft">{label}</p>
              <p dir="ltr" className="font-mono text-sm">{value}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-1.5 text-xs text-ink-soft">{L.hex}</p>
          <pre dir="ltr" className="overflow-x-auto rounded-card border border-line bg-surface p-4 font-mono text-xs leading-relaxed text-ink-soft">
            {info.hexDump}
          </pre>
        </div>
        <button onClick={() => setInfo(null)} className="text-sm text-ink-soft hover:text-red-600">✕</button>
      </div>
    );

  return <FileDropzone accept="*" onFiles={(f) => analyze(f[0])} />;
}

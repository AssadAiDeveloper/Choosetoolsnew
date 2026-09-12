"use client";

import { useRef, useState } from "react";
import { FileDropzone } from "../FileDropzone";
import { CopyButton } from "./TextAreas";
import { loadImage } from "@/lib/canvas";

interface Picked { hex: string; rgb: string }

export default function ColorPicker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [colors, setColors] = useState<Picked[]>([]);

  const onFiles = async (files: File[]) => {
    const img = await loadImage(files[0]);
    const canvas = canvasRef.current!;
    const maxW = 900;
    const scale = Math.min(1, maxW / img.width);
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    setReady(true);
  };

  const pick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * canvas.height);
    const [r, g, b] = canvas.getContext("2d")!.getImageData(x, y, 1, 1).data;
    const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
    setColors((c) => [{ hex, rgb: `rgb(${r}, ${g}, ${b})` }, ...c.slice(0, 11)]);
  };

  return (
    <div className="space-y-4">
      {!ready && <FileDropzone accept="image/*" onFiles={onFiles} />}
      <canvas
        ref={canvasRef}
        onClick={pick}
        className={`w-full cursor-crosshair rounded-card border border-line bg-surface ${ready ? "" : "hidden"}`}
      />
      {colors.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {colors.map((c, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2">
              <span className="h-8 w-8 rounded-lg border border-line" style={{ background: c.hex }} />
              <span dir="ltr" className="flex-1 font-mono text-sm">{c.hex} · {c.rgb}</span>
              <CopyButton text={c.hex} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

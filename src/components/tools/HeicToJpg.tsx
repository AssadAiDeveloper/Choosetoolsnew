"use client";

import { SingleImageShell } from "./SingleImageShell";
import { replaceExt } from "@/lib/download";

export default function HeicToJpg() {
  return (
    <SingleImageShell
      accept=".heic,.heif,image/heic,image/heif"
      autoRun
      outName={(f) => replaceExt(f.name, "jpg")}
      process={async (file) => {
        const heic2any = (await import("heic2any")).default;
        const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
        return Array.isArray(out) ? out[0] : out;
      }}
    />
  );
}

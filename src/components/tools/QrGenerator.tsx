"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PrimaryButton } from "../ToolShell";

export default function QrGenerator() {
  const t = useTranslations("tool");
  const [text, setText] = useState("https://");
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let live = true;
    const timer = setTimeout(async () => {
      if (!text.trim()) { setDataUrl(""); return; }
      const QRCode = (await import("qrcode")).default;
      const url = await QRCode.toDataURL(text, { width: 1024, margin: 2 });
      if (live) setDataUrl(url);
    }, 250);
    return () => { live = false; clearTimeout(timer); };
  }, [text]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <textarea
          dir="auto"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          autoFocus
          className="w-full resize-y rounded-card border border-line bg-surface p-4 font-mono text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface p-6">
        {dataUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt="QR code" className="h-52 w-52 rounded-lg border border-line" />
            <PrimaryButton onClick={() => {
              const a = document.createElement("a");
              a.href = dataUrl;
              a.download = "qr-code.png";
              a.click();
            }}>
              {t("download")} PNG
            </PrimaryButton>
          </>
        ) : (
          <div className="vault-border h-52 w-52 rounded-lg opacity-40" />
        )}
      </div>
    </div>
  );
}

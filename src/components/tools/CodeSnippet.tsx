"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { PrimaryButton } from "../ToolShell";
import { downloadBlob } from "@/lib/download";

const THEMES = [
  { id: "dark", bg: "#1e1e2e", panel: "#181825", text: "#cdd6f4", keyword: "#cba6f7", string: "#a6e3a1", comment: "#6c7086", num: "#fab387" },
  { id: "light", bg: "#ffffff", panel: "#f4f4f5", text: "#1e1e2e", keyword: "#7c3aed", string: "#16a34a", comment: "#9ca3af", num: "#ea580c" },
];

const KEYWORDS = /\b(function|const|let|var|return|if|else|for|while|import|export|from|class|extends|new|await|async|try|catch|def|public|private|static|void|int|string|null|true|false|this|self)\b/g;

function highlight(code: string, theme: typeof THEMES[0]) {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let out = escape(code);
  out = out.replace(/(&quot;.*?&quot;|'.*?'|`.*?`)/g, (m) => `<span style="color:${theme.string}">${m}</span>`);
  out = out.replace(/(\/\/.*$)/gm, (m) => `<span style="color:${theme.comment}">${m}</span>`);
  out = out.replace(KEYWORDS, (m) => `<span style="color:${theme.keyword}">${m}</span>`);
  out = out.replace(/\b(\d+)\b/g, (m) => `<span style="color:${theme.num}">${m}</span>`);
  return out;
}

export default function CodeSnippet() {
  const locale = useLocale();
  const [code, setCode] = useState("function greet(name) {\n  return `Hello, ${name}!`;\n}");
  const [title, setTitle] = useState("snippet.js");
  const [theme, setTheme] = useState(THEMES[0]);

  const L = locale === "ar"
    ? { placeholder: "الصق الكود هنا", download: "تنزيل الصورة (PNG)" }
    : locale === "es"
    ? { placeholder: "Pega tu código aquí", download: "Descargar imagen (PNG)" }
    : { placeholder: "Paste your code here", download: "Download image (PNG)" };

  const download = async () => {
    const lines = code.split("\n");
    const padX = 40, padTop = 70, lineH = 28, fontSize = 16;
    const width = Math.max(480, Math.max(...lines.map((l) => l.length)) * (fontSize * 0.6) + padX * 2);
    const height = padTop + lines.length * lineH + 30;

    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);

    // Panel background with rounded corners
    ctx.fillStyle = theme.bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 14);
    ctx.fill();

    // Title bar
    ctx.fillStyle = theme.panel;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, 44, [14, 14, 0, 0]);
    ctx.fill();

    // Traffic-light dots
    ["#ff5f56", "#ffbd2e", "#27c93f"].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(24 + i * 22, 22, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = theme.comment;
    ctx.font = "13px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(title, width / 2, 27);

    // Code lines — simple token coloring done manually per-token (no HTML/DOM rasterization needed)
    ctx.textAlign = "left";
    ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    lines.forEach((line, i) => {
      const y = padTop + i * lineH;
      const tokens = line.split(/(\/\/.*$|"[^"]*"|'[^']*'|`[^`]*`|\b\d+\b|\b(?:function|const|let|var|return|if|else|for|while|import|export|from|class|new|await|async)\b)/);
      let x = padX;
      for (const tok of tokens) {
        if (!tok) continue;
        if (/^\/\//.test(tok)) ctx.fillStyle = theme.comment;
        else if (/^["'`]/.test(tok)) ctx.fillStyle = theme.string;
        else if (/^\d+$/.test(tok)) ctx.fillStyle = theme.num;
        else if (/^(function|const|let|var|return|if|else|for|while|import|export|from|class|new|await|async)$/.test(tok)) ctx.fillStyle = theme.keyword;
        else ctx.fillStyle = theme.text;
        ctx.fillText(tok, x, y);
        x += ctx.measureText(tok).width;
      }
    });

    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
    downloadBlob(blob, title.replace(/\.[a-z]+$/, "") + "-snippet.png");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input dir="ltr" value={title} onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 font-mono text-sm" />
        {THEMES.map((th) => (
          <button key={th.id} onClick={() => setTheme(th)}
            className={`h-8 w-8 rounded-full border-2 ${theme.id === th.id ? "border-brand-600" : "border-line"}`}
            style={{ background: th.bg }} aria-label={th.id} />
        ))}
      </div>
      <textarea
        dir="ltr"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={10}
        placeholder={L.placeholder}
        className="w-full resize-y rounded-card border border-line bg-surface p-4 font-mono text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      <div
        className="overflow-hidden rounded-2xl p-1"
        style={{ background: theme.bg }}
      >
        <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ background: theme.panel }}>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
          <span className="ms-auto font-mono text-xs" style={{ color: theme.comment }}>{title}</span>
        </div>
        <pre dir="ltr" className="overflow-x-auto p-5 font-mono text-sm leading-relaxed"
          style={{ color: theme.text }}
          dangerouslySetInnerHTML={{ __html: highlight(code, theme) }} />
      </div>
      <PrimaryButton onClick={download}>{L.download}</PrimaryButton>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton } from "../ToolShell";
import { downloadBlob } from "@/lib/download";
import { PdfPreview } from "./PdfPreview";

const FIELDS = ["title", "author", "subject", "keywords"] as const;
type Field = (typeof FIELDS)[number];

const LABELS: Record<string, Record<Field, string>> = {
  en: { title: "Title", author: "Author", subject: "Subject", keywords: "Keywords" },
  ar: { title: "العنوان", author: "المؤلف", subject: "الموضوع", keywords: "الكلمات المفتاحية" },
  es: { title: "Título", author: "Autor", subject: "Asunto", keywords: "Palabras clave" },
};

export default function PdfMetadata() {
  const t = useTranslations("tool");
  const locale = useLocale();
  const labels = LABELS[locale] ?? LABELS.en;
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<Record<Field, string>>({ title: "", author: "", subject: "", keywords: "" });
  const [pageCount, setPageCount] = useState(0);
  const [stage, setStage] = useState<"pick" | "busy" | "edit" | "error">("pick");

  const load = async (f: File) => {
    setStage("busy");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true, updateMetadata: false });
      setMeta({
        title: doc.getTitle() ?? "",
        author: doc.getAuthor() ?? "",
        subject: doc.getSubject() ?? "",
        keywords: doc.getKeywords() ?? "",
      });
      setPageCount(doc.getPageCount());
      setFile(f);
      setStage("edit");
    } catch {
      setStage("error");
    }
  };

  const save = async () => {
    if (!file) return;
    setStage("busy");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      doc.setTitle(meta.title);
      doc.setAuthor(meta.author);
      doc.setSubject(meta.subject);
      doc.setKeywords(meta.keywords.split(",").map((k) => k.trim()).filter(Boolean));
      const bytes = await doc.save();
      downloadBlob(new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" }), file.name);
      setStage("edit");
    } catch {
      setStage("error");
    }
  };

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={() => setStage("pick")} />;
  if (stage === "edit")
    return (
      <div className="space-y-4">
        <p className="font-mono text-xs text-ink-soft">{file?.name} · {pageCount} pages</p>
        {file && <PdfPreview blob={file} />}
        <div className="space-y-3 rounded-card border border-line bg-surface p-5">
          {FIELDS.map((field) => (
            <label key={field} className="block">
              <span className="mb-1 block text-sm font-medium text-ink-soft">{labels[field]}</span>
              <input
                dir="auto"
                value={meta[field]}
                onChange={(e) => setMeta({ ...meta, [field]: e.target.value })}
                className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>
          ))}
        </div>
        <PrimaryButton onClick={save}>{t("download")}</PrimaryButton>
      </div>
    );

  return <FileDropzone accept="application/pdf" onFiles={(f) => load(f[0])} />;
}

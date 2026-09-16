"use client";

import { useState } from "react";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { FileDropzone } from "../FileDropzone";
import { downloadBlob, formatBytes } from "@/lib/download";
import { PdfPreview } from "./PdfPreview";

export default function ProtectPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<"pick" | "busy" | "done" | "error">("pick");
  const [out, setOut] = useState<Blob | null>(null);

  const run = async (f: File) => {
    setFile(f);
    setStage("busy");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      const bytes = await doc.save();
      if (bytes.length === 0) throw new Error("empty");
      setOut(new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" }));
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  const reset = () => { setFile(null); setOut(null); setStage("pick"); };

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={reset} />;
  if (stage === "done" && out)
    return (
      <ResultCard onReset={reset}>
        <PdfPreview blob={out} />
        <p className="font-mono text-sm text-ink-soft">{formatBytes(out.size)}</p>
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(out, "unlocked.pdf")}>Download</PrimaryButton>
      </ResultCard>
    );

  return <FileDropzone accept="application/pdf" onFiles={(f) => run(f[0])} />;
}

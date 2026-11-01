"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Processing, ErrorBox, PrimaryButton, ResultCard } from "../ToolShell";
import { FileDropzone } from "../FileDropzone";
import { downloadBlob, formatBytes } from "@/lib/download";
import { PdfPreview } from "./PdfPreview";
import { unlockPdf } from "@/lib/pdfUnlock";

export default function ProtectPdf() {
  const t = useTranslations("tool");
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<"pick" | "busy" | "password" | "done" | "error">("pick");
  const [out, setOut] = useState<Blob | null>(null);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [wrongPassword, setWrongPassword] = useState(false);
  const bytesRef = useRef<Uint8Array | null>(null);

  const finish = (bytes: Uint8Array) => {
    setOut(new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" }));
    setStage("done");
  };

  const attempt = async (bytes: Uint8Array, pw?: string) => {
    setStage("busy");
    const result = await unlockPdf(bytes, pw);
    if (result.ok) return finish(result.bytes);
    if (result.reason === "password-required") {
      setWrongPassword(false);
      return setStage("password");
    }
    if (result.reason === "wrong-password") {
      setWrongPassword(true);
      return setStage("password");
    }
    setMessage(result.reason === "encrypted" ? t("encryptedPdf") : undefined);
    setStage("error");
  };

  const run = async (f: File) => {
    setFile(f);
    setStage("busy");
    setMessage(undefined);
    setPassword("");
    setWrongPassword(false);
    const bytes = new Uint8Array(await f.arrayBuffer());
    bytesRef.current = bytes;
    await attempt(bytes);
  };

  const reset = () => {
    setFile(null);
    setOut(null);
    setMessage(undefined);
    setPassword("");
    setWrongPassword(false);
    bytesRef.current = null;
    setStage("pick");
  };

  if (stage === "busy") return <Processing />;
  if (stage === "error") return <ErrorBox onReset={reset} message={message} />;

  if (stage === "password")
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (bytesRef.current && password) void attempt(bytesRef.current, password);
        }}
        className="rounded-card border border-line bg-surface p-6"
      >
        <p className="font-semibold text-ink">{file?.name}</p>
        <label htmlFor="pdf-password" className="mt-4 block text-sm font-medium text-ink">
          {t("pdfPassword")}
        </label>
        <input
          id="pdf-password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setWrongPassword(false);
          }}
          className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-brand-500"
        />
        {wrongPassword && <p className="mt-2 text-sm text-red-700">{t("wrongPassword")}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <PrimaryButton type="submit" disabled={!password}>
            {t("unlock")}
          </PrimaryButton>
          <button type="button" onClick={reset} className="text-sm font-medium text-ink-soft underline hover:text-brand-700">
            {t("reset")}
          </button>
        </div>
      </form>
    );

  if (stage === "done" && out)
    return (
      <ResultCard onReset={reset}>
        <PdfPreview blob={out} />
        <p className="font-mono text-sm text-ink-soft">{formatBytes(out.size)}</p>
        <p className="mt-2 text-sm text-ink-soft">{t("pdfUnlockRasterNote")}</p>
        <PrimaryButton className="mt-3" onClick={() => downloadBlob(out, "unlocked.pdf")}>
          {t("download")}
        </PrimaryButton>
      </ResultCard>
    );

  return <FileDropzone accept="application/pdf" onFiles={(f) => run(f[0])} />;
}

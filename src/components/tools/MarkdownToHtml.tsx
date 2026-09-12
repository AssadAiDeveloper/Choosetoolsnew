"use client";

import { useState } from "react";
import { InOut } from "./TextAreas";
import { PrimaryButton } from "../ToolShell";
import { useLocale } from "next-intl";

export default function MarkdownToHtml() {
  const locale = useLocale();
  const [input, setInput] = useState("# Hello\n\nThis is **markdown**.");
  const [output, setOutput] = useState("");

  const run = async () => {
    const { marked } = await import("marked");
    setOutput(await marked.parse(input, { async: true }));
  };

  const btn = locale === "ar" ? "تحويل إلى HTML" : locale === "es" ? "Convertir a HTML" : "Convert to HTML";

  return (
    <div className="space-y-4">
      <PrimaryButton onClick={run}>{btn}</PrimaryButton>
      <InOut input={input} setInput={setInput} output={output} inputDir="ltr" outputDir="ltr" />
    </div>
  );
}

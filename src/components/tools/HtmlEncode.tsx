"use client";

import { useState } from "react";
import { InOut } from "./TextAreas";

const ENTITIES: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
};

export default function HtmlEncode() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const encode = () => setOutput(input.replace(/[&<>"']/g, (ch) => ENTITIES[ch]));

  const decode = () => {
    const doc = new DOMParser().parseFromString(input, "text/html");
    setOutput(doc.documentElement.textContent ?? "");
  };

  const btnClass = "rounded-lg border border-line bg-surface px-4 py-2 font-mono text-sm transition hover:border-brand-500 hover:text-brand-700";

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button className={btnClass} onClick={encode}>{"Encode → &lt;"}</button>
        <button className={btnClass} onClick={decode}>{"&lt; → Decode"}</button>
      </div>
      <InOut input={input} setInput={setInput} output={output} inputDir="ltr" outputDir="ltr" />
    </div>
  );
}

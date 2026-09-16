"use client";

import { useState } from "react";
import { SinglePdfShell } from "./SinglePdfShell";
import { parsePageList } from "@/lib/download";

export default function DeletePdfPages() {
  const [list, setList] = useState("");

  return (
    <SinglePdfShell
      outName="pages-removed.pdf"
      watch={[list]}
      options={
        <div className="rounded-card border border-line bg-surface p-4">
          <input
            dir="ltr"
            value={list}
            onChange={(e) => setList(e.target.value)}
            placeholder="2, 5-7, 10"
            className="w-full rounded-lg border border-line px-3 py-2 font-mono"
          />
        </div>
      }
      process={async (file) => {
        const { PDFDocument } = await import("pdf-lib");
        const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
        const remove = new Set(parsePageList(list, doc.getPageCount()));
        if (remove.size === 0 || remove.size >= doc.getPageCount()) throw new Error("bad range");
        for (let i = doc.getPageCount() - 1; i >= 0; i--) {
          if (remove.has(i + 1)) doc.removePage(i);
        }
        const bytes = await doc.save();
        return new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" });
      }}
    />
  );
}

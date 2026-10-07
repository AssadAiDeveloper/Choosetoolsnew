"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { StandardFonts } from "pdf-lib";
import { FileDropzone } from "../FileDropzone";
import { Processing, ErrorBox, PrimaryButton } from "../ToolShell";
import { downloadBlob, formatBytes, replaceExt } from "@/lib/download";
import { pdfjsWorkerSrc } from "@/lib/pdfOcr";
import { scanDocument, totalRuns, type ScannedPage, type TextRun } from "@/lib/pdfTextScan";
import {
  STANDARD_FONTS,
  readCustomFont,
  registerPreviewFont,
  standardFontCanEncode,
  type CustomFont,
} from "@/lib/pdfFonts";
import { applyEdits, FontCannotRenderError, type Align, type FontSpec, type TextEdit } from "@/lib/pdfEditWrite";

type Stage = "pick" | "scanning" | "edit" | "saving" | "error";

/** The mutable state of one edited run. The original run is kept so the text
 *  can always be restored and the cover rectangle stays the right size. */
interface RunState {
  text: string;
  font: FontSpec;
  size: number;
  color: string;
  bold: boolean;
  italic: boolean;
  coverColor: string;
  align: Align;
}

const DEFAULT_STANDARD = STANDARD_FONTS[0];

/** Build the state a freshly selected run starts from.
 *
 *  A run whose text a standard font cannot encode (any Arabic, and most
 *  non-Latin scripts) would otherwise default to Helvetica and then fail the
 *  export with a font error. If the user has already uploaded a font, start
 *  that run on it instead. */
function initialState(run: TextRun, customFonts: CustomFont[] = []): RunState {
  const needsCustom = !standardFontCanEncode(run.text);
  return {
    text: run.text,
    font:
      needsCustom && customFonts.length > 0
        ? { kind: "custom", custom: customFonts[0] }
        : { kind: "standard", standard: DEFAULT_STANDARD.standard },
    size: Math.round(run.height * 10) / 10,
    color: "#111111",
    bold: false,
    italic: false,
    coverColor: "#ffffff",
    align: "start",
  };
}

const RTL_RE = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

interface DocState {
  /** runId -> state. Only edited runs are present, so an untouched document
   *  never triggers a rewrite. */
  edits: Record<string, RunState>;
  /** Snapshots of `edits` before each change. */
  history: Record<string, RunState>[];
  /** Snapshots undone from history, replayed by redo. */
  future: Record<string, RunState>[];
}

const INITIAL_DOC: DocState = { edits: {}, history: [], future: [] };

type DocAction =
  | { type: "reset" }
  | { type: "set"; runId: string; run: TextRun; state: RunState }
  | { type: "revert"; runId: string; run: TextRun }
  | { type: "undo" }
  | { type: "redo" };

function docReducer(s: DocState, a: DocAction): DocState {
  switch (a.type) {
    case "reset":
      return INITIAL_DOC;
    case "set": {
      const current = s.edits[a.runId];
      // First touch of a run: there is no earlier state to return to.
      if (!current) {
        return { edits: { ...s.edits, [a.runId]: a.state }, history: s.history, future: [] };
      }
      return {
        edits: { ...s.edits, [a.runId]: a.state },
        history: [...s.history, s.edits],
        future: [],
      };
    }
    case "revert": {
      if (!s.edits[a.runId]) return s;
      const edits = { ...s.edits };
      delete edits[a.runId];
      // A removed key is only representable because the whole map is snapshotted.
      return { edits, history: [...s.history, s.edits], future: [] };
    }
    case "undo": {
      if (!s.history.length) return s;
      return {
        edits: s.history[s.history.length - 1],
        history: s.history.slice(0, -1),
        future: [s.edits, ...s.future],
      };
    }
    case "redo": {
      if (!s.future.length) return s;
      return {
        edits: s.future[0],
        history: [...s.history, s.edits],
        future: s.future.slice(1),
      };
    }
  }
}

export default function PdfEditor() {
  const t = useTranslations("tool");
  const tp = useTranslations("pdfEditor");
  const locale = useLocale();
  const isRtlUi = locale.startsWith("ar");

  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("pick");
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [pageNum, setPageNum] = useState(1);
  const [scanProgress, setScanProgress] = useState(0);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [fontError, setFontError] = useState<string | null>(null);

  // runId -> state, plus the undo/redo stacks, live in ONE reducer.
  //
  // They were three separate useState calls before, and the setters were nested
  // inside each other (setHistory called from inside a setEdits updater). React
  // updaters must be pure, so undo silently did nothing. Keeping all three in a
  // single atomic state also lets a snapshot express a *removed* run, which a
  // shallow merge of two snapshots can never do.
  const [doc, dispatch] = useReducer(docReducer, INITIAL_DOC);
  const { edits, history, future } = doc;
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [out, setOut] = useState<Blob | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const pdfRef = useRef<{ getPage(n: number): Promise<unknown>; numPages: number; destroy(): void } | null>(null);
  const bytesRef = useRef<ArrayBuffer | null>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);

  const page = pages[pageNum - 1] ?? null;
  const allRuns = useMemo(() => pages.flatMap((p) => p.runs), [pages]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allRuns;
    return allRuns.filter((r) => r.text.toLowerCase().includes(q));
  }, [allRuns, query]);

  const editedCount = Object.keys(edits).length;
  const canUndo = history.length > 0;
  const canRedo = future.length > 0;

  // ---------------------------------------------------------------- loading

  const load = useCallback(async (f: File) => {
    setFile(f);
    setStage("scanning");
    setScanProgress(0);
    dispatch({ type: "reset" });
    setSelected(null);
    setOut(null);
    setNotice(null);
    setQuery("");

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc(pdfjs);
      const data = await f.arrayBuffer();
      bytesRef.current = data;
      // pdf.js may transfer the buffer to its worker, so hand it a copy and
      // keep the original intact for the export step.
      const doc = await pdfjs.getDocument({ data: data.slice(0) }).promise;
      pdfRef.current = doc as never;
      const scanned = await scanDocument(doc, (done, total) => setScanProgress(Math.round((done / total) * 100)));
      setPages(scanned);
      setPageNum(1);
      if (!totalRuns(scanned)) {
        // A scanned page has no text layer at all. Say so plainly instead of
        // presenting an empty editor.
        setNotice("noText");
        setStage("error");
        return;
      }
      setStage("edit");
    } catch (err) {
      // A silent catch here previously hid a missing pdf.js worker: the editor
      // just showed "could not be processed" with nothing in the console.
      if (process.env.NODE_ENV !== "production") {
        console.error("PDF Editor failed to open the file:", err);
      }
      setStage("error");
    }
  }, []);

  const reset = useCallback(() => {
    pdfRef.current?.destroy();
    pdfRef.current = null;
    bytesRef.current = null;
    baseRef.current = null;
    setFile(null);
    setPages([]);
    setPageNum(1);
    dispatch({ type: "reset" });
    setSelected(null);
    setOut(null);
    setNotice(null);
    setQuery("");
    setCustomFonts([]);
    setStage("pick");
  }, []);

  // ------------------------------------------------------------ page render

  useEffect(() => {
    if (stage !== "edit" || !page || !pdfRef.current) return;
    let cancelled = false;

    (async () => {
      const doc = pdfRef.current;
      if (!doc) return;
      const pdfPage = (await doc.getPage(pageNum)) as {
        getViewport(o: { scale: number }): { width: number; height: number };
        render(o: unknown): { promise: Promise<void> };
      };
      const vp1 = pdfPage.getViewport({ scale: 1 });
      const width = Math.min(1000, Math.max(320, window.innerWidth - 420));
      const scale = width / vp1.width;
      const viewport = pdfPage.getViewport({ scale });

      const c = document.createElement("canvas");
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.floor(viewport.width * dpr);
      c.height = Math.floor(viewport.height * dpr);
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      await pdfPage.render({ canvasContext: ctx, viewport }).promise;
      if (cancelled) return;
      baseRef.current = c;
      draw();
    })();

    return () => {
      cancelled = true;
    };
    // draw is stable enough via refs; re-render on page or edits only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum, stage, pages]);

  // --------------------------------------------------------------- drawing

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const base = baseRef.current;
    const pg = pages[pageNum - 1];
    if (!canvas || !base || !pg) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = base.width;
    canvas.height = base.height;
    canvas.style.width = `${base.width / dpr}px`;
    canvas.style.height = `${base.height / dpr}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(base, 0, 0);

    // Viewport at scale 1 is the page box with the origin top-left; PDF user
    // space has it bottom-left, so y is flipped on the way to the canvas.
    const sx = canvas.width / pg.width;
    const sy = canvas.height / pg.height;

    for (const run of pg.runs) {
      const st = edits[run.id];
      const bx = run.box.x * sx;
      const by = (pg.height - run.box.y - run.box.h) * sy;
      const bw = run.box.w * sx;
      const bh = run.box.h * sy;

      if (st) {
        // Preview the cover and the replacement so what the user sees matches
        // what will be written.
        ctx.fillStyle = st.coverColor;
        ctx.fillRect(bx, by, bw, bh);
        const css = fontCss(st.font, customFonts);
        const size = (st.size > 0 ? st.size : run.height) * sx;
        ctx.font = `${st.bold && st.font.kind === "custom" ? 700 : 400} ${size}px ${css}`;
        ctx.fillStyle = st.color;
        ctx.textBaseline = "alphabetic";
        const tx = run.x * sx;
        const ty = (pg.height - run.y) * sy;
        let tw = ctx.measureText(st.text).width;
        const centre = (run.width * sx - tw) / 2;
        const off = st.align === "center" ? centre : (st.align === "end") !== run.rtl ? run.width * sx - tw : 0;
        if (tw > run.width * sx * 1.12) {
          // Too long for the original slot; mark it rather than let it
          // silently run over the neighbouring content.
          ctx.strokeStyle = "#e11d48";
          ctx.setLineDash([3, 2]);
          ctx.lineWidth = 1;
          ctx.strokeRect(bx - 1, by - 1, bw + 2, bh + 2);
          ctx.setLineDash([]);
        }
        ctx.fillText(st.text, tx + off, ty);
        void tw;
      }

      if (run.id === selected) {
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = Math.max(1.5, dpr);
        ctx.strokeRect(bx - 2, by - 2, bw + 4, bh + 4);
      } else if (!st) {
        // Faint hit targets so the page looks untouched but is clickable.
        ctx.strokeStyle = "rgba(37,99,235,0.16)";
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);
      }
    }
  }, [pages, pageNum, edits, selected, customFonts]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ------------------------------------------------------------- hit test

  /** Which run is under a point given in CSS pixels relative to the canvas. */
  const hitRun = useCallback(
    (cssX: number, cssY: number): TextRun | null => {
      const canvas = canvasRef.current;
      const pg = pages[pageNum - 1];
      if (!canvas || !pg) return null;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cx = cssX * dpr;
      const cy = cssY * dpr;
      const sx = canvas.width / pg.width;
      const sy = canvas.height / pg.height;
      // Topmost first: later runs paint over earlier ones.
      for (let i = pg.runs.length - 1; i >= 0; i--) {
        const run = pg.runs[i];
        const bx = run.box.x * sx;
        const by = (pg.height - run.box.y - run.box.h) * sy;
        if (cx >= bx && cx <= bx + run.box.w * sx && cy >= by && cy <= by + run.box.h * sy) return run;
      }
      return null;
    },
    [pages, pageNum],
  );

  const pick = useCallback(
    (ev: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = ev.currentTarget.getBoundingClientRect();
      const run = hitRun(ev.clientX - rect.left, ev.clientY - rect.top);
      setSelected(run ? run.id : null);
    },
    [hitRun],
  );

  // ------------------------------------------------------------ edit model

  const commit = useCallback(
    (runId: string, state: RunState) => {
      const run = allRuns.find((r) => r.id === runId);
      if (!run) return;
      dispatch({ type: "set", runId, run, state });
      setOut(null);
    },
    [allRuns],
  );

  const startEditing = useCallback((runId: string) => setSelected(runId), []);

  const undo = useCallback(() => {
    dispatch({ type: "undo" });
    setOut(null);
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "redo" });
    setOut(null);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (k === "y" || (k === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const activeRun = selected ? (allRuns.find((r) => r.id === selected) ?? null) : null;
  // Show the original values for a run that is selected but not yet changed, so
  // the panel is usable the moment a run is clicked.
  const active = selected && activeRun ? (edits[selected] ?? initialState(activeRun, customFonts)) : null;
  const activeCustom = active?.font.kind === "custom" ? active.font.custom : null;

  const update = (patch: Partial<RunState>) => {
    if (!selected || !activeRun) return;
    // `active` is always a complete RunState, so spreading it fills the
    // required fields that `patch` leaves out.
    commit(selected, { ...active, ...patch } as RunState);
  };

  // ----------------------------------------------------------------- fonts

  const onFontFile = useCallback(async (f: File | undefined) => {
    if (!f) return;
    setFontError(null);
    try {
      const custom = await readCustomFont(f);
      await registerPreviewFont(custom);
      setCustomFonts((prev) => [...prev, custom]);
      if (selected && active) {
        commit(selected, { ...active, font: { kind: "custom", custom }, italic: false });
      }
    } catch (err) {
      setFontError(err instanceof Error && err.message.startsWith("font") ? err.message : "fontType");
    }
  }, [selected, active, commit]);

  const fontWarning = useMemo(() => {
    if (!active || !active.text) return null;
    if (active.font.kind === "standard" && !standardFontCanEncode(active.text)) {
      return isRtlUi ? "arabicNeedsFont" : "latinNeedsFont";
    }
    return null;
  }, [active, isRtlUi]);

  // ----------------------------------------------------------------- save

  const save = useCallback(async () => {
    if (!bytesRef.current) return;
    setStage("saving");
    setNotice(null);
    try {
      const list: TextEdit[] = [];
      for (const [runId, st] of Object.entries(edits)) {
        const run = allRuns.find((r) => r.id === runId);
        if (!run) continue;
        list.push({ runId, run, ...st });
      }
      const bytes = await applyEdits(bytesRef.current, list);
      setOut(new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }));
      setStage("edit");
    } catch (err) {
      setNotice(err instanceof FontCannotRenderError ? "fontCannotRender" : "saveFailed");
      setStage("edit");
    }
  }, [allRuns, edits]);

  // ----------------------------------------------------------------- views

  if (stage === "scanning") {
    return (
      <div className="space-y-4">
        <Processing />
        <p className="text-center text-sm text-ink-soft">
          {tp("scanning", { percent: scanProgress })}
        </p>
      </div>
    );
  }

  if (stage === "error" && notice === "noText") {
    return (
      <div className="space-y-4">
        <ErrorBox onReset={reset} />
        <p className="text-center text-sm text-ink-soft">{tp("noTextBody")}</p>
      </div>
    );
  }

  if (stage === "error") return <ErrorBox onReset={reset} />;

  if (stage === "pick" || !page) {
    return (
      <FileDropzone
        accept="application/pdf"
        onFiles={(f) => load(f[0])}
      />
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPageNum((n) => Math.max(1, n - 1))}
            disabled={pageNum === 1}
            className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-40"
          >
            {tp("prev")}
          </button>
          <span className="text-sm text-ink-soft">
            {tp("pageOf", { page: pageNum, total: pages.length })}
          </span>
          <button
            type="button"
            onClick={() => setPageNum((n) => Math.min(pages.length, n + 1))}
            disabled={pageNum === pages.length}
            className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-40"
          >
            {tp("next")}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-40"
          >
            {tp("undo")}
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-40"
          >
            {tp("redo")}
          </button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="overflow-auto rounded-card border border-line bg-slate-50 p-3">
          <canvas
            ref={canvasRef}
            onMouseDown={pick}
            onDoubleClick={(e) => {
              pick(e);
              const rect = e.currentTarget.getBoundingClientRect();
              const run = hitRun(e.clientX - rect.left, e.clientY - rect.top);
              if (run) startEditing(run.id);
            }}
            className="mx-auto cursor-text shadow-sm"
          />
          <p className="mt-3 text-center text-xs text-ink-soft">{tp("clickHint")}</p>
        </div>

        <aside className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="pdfeditor-search">
              {tp("findText")}
            </label>
            <input
              id="pdfeditor-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tp("findPlaceholder")}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-ink-soft">
              {tp("matches", { count: matches.length, total: allRuns.length })}
            </p>
            <ul className="mt-2 max-h-48 space-y-1 overflow-auto">
              {matches.slice(0, 200).map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (r.page !== pageNum) setPageNum(r.page);
                      setSelected(r.id);
                    }}
                    className={`w-full truncate rounded px-2 py-1 text-left text-xs hover:bg-brand-50 ${
                      r.id === selected ? "bg-brand-100 font-semibold" : ""
                    } ${r.id in edits ? "text-brand-700" : ""}`}
                    dir={RTL_RE.test(r.text) ? "rtl" : "ltr"}
                  >
                    {r.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-card border border-line p-3">
            <h3 className="mb-2 text-sm font-semibold">{tp("properties")}</h3>
            {!activeRun || !active ? (
              <p className="text-xs text-ink-soft">{tp("noSelection")}</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium" htmlFor="pdfeditor-text">
                    {tp("text")}
                  </label>
                  <textarea
                    id="pdfeditor-text"
                    value={active.text}
                    onChange={(e) => update({ text: e.target.value })}
                    rows={3}
                    dir={RTL_RE.test(active.text) ? "rtl" : "ltr"}
                    className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium" htmlFor="pdfeditor-font">
                    {tp("font")}
                  </label>
                  <select
                    id="pdfeditor-font"
                    value={active.font.kind === "standard" ? `std:${active.font.standard}` : `cus:${active.font.custom.id}`}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v.startsWith("std:")) {
                        update({ font: { kind: "standard", standard: v.slice(4) as StandardFonts } });
                      } else {
                        const custom = customFonts.find((c) => `cus:${c.id}` === v);
                        if (custom) update({ font: { kind: "custom", custom }, italic: false });
                      }
                    }}
                    className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
                  >
                    <optgroup label={tp("standardFonts")}>
                      {STANDARD_FONTS.map((f) => (
                        <option key={f.standard} value={`std:${f.standard}`}>
                          {f.label}
                        </option>
                      ))}
                    </optgroup>
                    {customFonts.length > 0 && (
                      <optgroup label={tp("yourFonts")}>
                        {customFonts.map((c) => (
                          <option key={c.id} value={`cus:${c.id}`}>
                            {c.label}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <input
                    ref={fontInputRef}
                    type="file"
                    accept=".ttf,.otf,.ttc,.woff,.woff2,font/ttf,font/otf"
                    hidden
                    onChange={(e) => {
                      void onFontFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fontInputRef.current?.click()}
                    className="mt-1 w-full rounded-lg border border-dashed border-line px-2 py-1.5 text-xs text-ink-soft hover:border-brand-500 hover:text-brand-700"
                  >
                    {tp("uploadFont")}
                  </button>
                  {fontError && <p className="mt-1 text-xs text-red-600">{tp(fontError)}</p>}
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium" htmlFor="pdfeditor-size">
                      {tp("size")}
                    </label>
                    <input
                      id="pdfeditor-size"
                      type="number"
                      min={1}
                      max={400}
                      step={0.5}
                      value={active.size}
                      onChange={(e) => update({ size: Number(e.target.value) || 1 })}
                      className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium" htmlFor="pdfeditor-color">
                      {tp("color")}
                    </label>
                    <input
                      id="pdfeditor-color"
                      type="color"
                      value={active.color}
                      onChange={(e) => update({ color: e.target.value })}
                      className="h-9 w-14 rounded border border-line bg-surface"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => update({ bold: !active.bold })}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                      active.bold ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line"
                    }`}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    disabled={activeCustom !== null}
                    title={activeCustom ? tp("italicUnavailable") : undefined}
                    onClick={() => update({ italic: !active.italic })}
                    className={`rounded-lg border px-2.5 py-1 text-xs italic ${
                      active.italic ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line"
                    } disabled:opacity-40`}
                  >
                    I
                  </button>
                  <div className="ms-auto flex gap-1">
                    {(["start", "center", "end"] as Align[]).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => update({ align: a })}
                        className={`rounded border px-2 py-1 text-[10px] ${
                          active.align === a ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line"
                        }`}
                      >
                        {a === "start" ? "â—€" : a === "center" ? "â–¬" : "â–¶"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium" htmlFor="pdfeditor-cover">
                    {tp("coverColor")}
                  </label>
                  <input
                    id="pdfeditor-cover"
                    type="color"
                    value={active.coverColor}
                    onChange={(e) => update({ coverColor: e.target.value })}
                    className="h-9 w-14 rounded border border-line bg-surface"
                  />
                </div>

                {fontWarning && <p className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">{tp(fontWarning)}</p>}

                <button
                  type="button"
                  onClick={() => {
                    if (!selected) return;
                    const run = allRuns.find((r) => r.id === selected);
                    if (run) dispatch({ type: "revert", runId: selected, run });
                    setOut(null);
                  }}
                  className="w-full rounded-lg border border-red-200 px-2 py-1.5 text-xs text-red-700 hover:bg-red-50"
                >
                  {tp("revertRun")}
                </button>
              </div>
            )}
          </div>

          {notice && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{tp(notice)}</p>
          )}

          <div className="rounded-card border border-line p-3">
            <p className="text-sm text-ink-soft">
              {tp("editedSummary", { count: editedCount })}
            </p>
            {out && (
              <p className="mt-1 font-mono text-xs text-ink-soft">
                {tp("savedSize", { size: formatBytes(out.size) })}
              </p>
            )}
            <PrimaryButton
              className="mt-3 w-full"
              onClick={() => void save()}
              disabled={stage === "saving" || editedCount === 0}
            >
              {stage === "saving" ? tp("saving") : t("download")}
            </PrimaryButton>
            {out && file && (
              <button
                type="button"
                onClick={() => downloadBlob(out, replaceExt(file.name, "pdf"))}
                className="mt-2 w-full rounded-xl border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
              >
                {tp("downloadFile")}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function fontCss(spec: FontSpec, customs: CustomFont[]): string {
  if (spec.kind === "custom") {
    const known = customs.find((c) => c.id === spec.custom.id);
    return known ? `"${known.family}", sans-serif` : "sans-serif";
  }
  return STANDARD_FONTS.find((f) => f.standard === spec.standard)?.css ?? "sans-serif";
}

"use client";

import { useState } from "react";
import { InOut } from "./TextAreas";

const MORSE: Record<string, string> = {
  a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....",
  i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.",
  q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-",
  y: "-.--", z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--",
  "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "!": "-.-.--", "/": "-..-.", "@": ".--.-.",
};
const REVERSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

export default function MorseCode() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const encode = () =>
    setOutput(
      input.toLowerCase().split(" ").map((word) =>
        [...word].map((ch) => MORSE[ch] ?? "").filter(Boolean).join(" ")
      ).filter(Boolean).join(" / ")
    );

  const decode = () =>
    setOutput(
      input.trim().split(/\s*\/\s*/).map((word) =>
        word.trim().split(/\s+/).map((code) => REVERSE[code] ?? "").join("")
      ).join(" ")
    );

  const btnClass = "rounded-lg border border-line bg-surface px-4 py-2 font-mono text-sm transition hover:border-brand-500 hover:text-brand-700";

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button className={btnClass} onClick={encode}>ABC → ·−</button>
        <button className={btnClass} onClick={decode}>·− → ABC</button>
      </div>
      <InOut input={input} setInput={setInput} output={output} inputDir="ltr" outputDir="ltr" />
    </div>
  );
}

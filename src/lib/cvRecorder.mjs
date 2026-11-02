// Recorder wrapper for canvas 2d context. Intercepts fillText to record runs.
// Everything else delegates to the real context.
export function recordCtx(realCtx, runs) {
  const state = { font: realCtx.font, direction: realCtx.direction, textAlign: realCtx.textAlign, fillStyle: realCtx.fillStyle };
  const stack = [];
  return new Proxy(realCtx, {
    get(target, prop) {
      if (prop === "fillText") {
        return (text, x, y) => {
          if (text !== null && text !== undefined && String(text).trim() !== "") {
            const m = String(state.font).match(/(\d+(?:\.\d+)?)\s*px/);
            const size = m ? parseFloat(m[1]) : 12;
            const weightMatch = String(state.font).match(/^(\S+)\s+\d/);
            const weight = weightMatch ? weightMatch[1] : "400";
            runs.push({
              text: String(text),
              x: x,
              y: y,
              size: size,
              weight: weight,
              family: "Arial, sans-serif",
              align: state.textAlign || "left",
              direction: state.direction || "ltr",
              color: state.fillStyle || "#000",
            });
          }
          return target.fillText(text, x, y);
        };
      }
      if (prop === "save") {
        return () => { stack.push({ font: state.font, direction: state.direction, textAlign: state.textAlign, fillStyle: state.fillStyle }); target.save(); };
      }
      if (prop === "restore") {
        return () => { const s = stack.pop(); if (s) { state.font = s.font; state.direction = s.direction; state.textAlign = s.textAlign; state.fillStyle = s.fillStyle; target.font = s.font; target.direction = s.direction; target.textAlign = s.textAlign; target.fillStyle = s.fillStyle; } target.restore(); };
      }
      if (prop === "font") return state.font;
      if (prop === "direction") return state.direction;
      if (prop === "textAlign") return state.textAlign;
      if (prop === "fillStyle") return state.fillStyle;
      const v = target[prop];
      return typeof v === "function" ? v.bind(target) : v;
    },
    set(target, prop, value) {
      if (prop === "font") { state.font = value; target.font = value; }
      else if (prop === "direction") { state.direction = value; target.direction = value; }
      else if (prop === "textAlign") { state.textAlign = value; target.textAlign = value; }
      else if (prop === "fillStyle") { state.fillStyle = value; target.fillStyle = value; }
      else { target[prop] = value; }
      return true;
    },
  });
}

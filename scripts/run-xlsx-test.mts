// Compiles the two real source files to a temp dir so bare specifiers
// (exceljs) resolve from disk, then runs the assertions against that build.
// Run: npx tsx scripts/run-xlsx-test.mts
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { relative, resolve } from "node:path";

const TMP = "C:/Users/sAssa/AppData/Local/Temp/opencode/pdftest/build";
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const ROOT = process.cwd();
const tsc = `${ROOT}/node_modules/typescript/bin/tsc`;

// Compile with path mapping so "@/lib/..." becomes a relative require.
const cfg = {
  compilerOptions: {
    target: "ES2022",
    module: "CommonJS",
    moduleResolution: "node",
    outDir: TMP,
    rootDir: ROOT,
    esModuleInterop: true,
    skipLibCheck: true,
    strict: false,
    baseUrl: ROOT,
    paths: { "@/*": ["./src/*"] },
    types: [],
    ignoreDeprecations: "6.0",
  },
  files: [
    `${ROOT}/src/lib/pdfTableExtract.ts`,
    `${ROOT}/src/components/tools/pdfExcelWriter.ts`,
  ],
};
// The config must sit at the repo root so baseUrl/paths resolve there.
const cfgPath = `${ROOT}/tsconfig.pdfxlsx-test.json`;
writeFileSync(cfgPath, JSON.stringify(cfg));

execFileSync(process.execPath, [tsc, "-p", cfgPath], { stdio: "inherit" });
rmSync(cfgPath, { force: true });

// Flatten: tsc keeps the src/ tree under outDir.
const src = readFileSync(`${TMP}/src/lib/pdfTableExtract.js`, "utf8");
writeFileSync(`${TMP}/pdfTableExtract.js`, src);
const writer = readFileSync(`${TMP}/src/components/tools/pdfExcelWriter.js`, "utf8")
  .replace(/require\("@\/lib\/pdfTableExtract"\)/g, 'require("./pdfTableExtract.js")')
  .replace(/require\("exceljs"\)/g, `require(${JSON.stringify(`${ROOT}/node_modules/exceljs`)})`);
writeFileSync(`${TMP}/pdfExcelWriter.js`, writer);

writeFileSync(
  `${TMP}/test.js`,
  `
const { writeFileSync } = require("node:fs");
const { mergeWrapped, toTypedGrid, buildTableXlsx } = require("./pdfExcelWriter.js");
// Resolved by absolute path: this test file lives outside the repo tree.
const ExcelJS = require(${JSON.stringify(`${ROOT}/node_modules/exceljs`)});

const OUT = "C:/Users/sAssa/AppData/Local/Temp/opencode/pdftest";
let failures = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log((ok ? "PASS  " : "FAIL  ") + label + "  = " + JSON.stringify(actual) +
    (ok ? "" : " (expected " + JSON.stringify(expected) + ")"));
}

(async () => {
  const lines = [
    ["Item", "Qty", "Price", "Total"],
    ["Apple", "10", "1,250.00", "12500.00"],
    ["Banana", "5", "2,50", "12.50"],
    ["Total", "15", "", "12537.50"],
  ];
  const grid = toTypedGrid(mergeWrapped(lines));
  const blob = await buildTableXlsx(grid, "Invoice");
  const bytes = Buffer.from(await blob.arrayBuffer());
  const p = OUT + "/out.xlsx";
  writeFileSync(p, bytes);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(p);
  const ws = wb.getWorksheet("Invoice");

  check("sheet exists", !!ws, true);
  check("row count", ws.rowCount, 4);
  check("col count", ws.columnCount, 4);
  check("B2 is number", typeof ws.getCell("B2").value, "number");
  check("B2 value", ws.getCell("B2").value, 10);
  check("C2 is number", typeof ws.getCell("C2").value, "number");
  check("C2 value 1,250.00", ws.getCell("C2").value, 1250);
  check("D2 is number", typeof ws.getCell("D2").value, "number");
  check("D2 value", ws.getCell("D2").value, 12500);
  check("C3 EU decimal 2,50", ws.getCell("C3").value, 2.5);
  check("A4 text stays text", ws.getCell("A4").value, "Total");
  check("empty cell is null", ws.getCell("C4").value, null);
  check("A1 bold header", ws.getCell("A1").font && ws.getCell("A1").font.bold, true);
  check("frozen pane", ws.views && ws.views[0] && ws.views[0].ySplit, 1);
  check("col A width", ws.getColumn(1).width > 0, true);

  const total = ws.getColumn(4).values.slice(1)
    .reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
  check("column D sums numerically", total, 25050);

  console.log("\\nworkbook: " + p + " (" + (bytes.length / 1024).toFixed(1) + " KB)");
  console.log(failures === 0 ? "ALL PASSED" : failures + " FAILURE(S)");
  process.exit(failures === 0 ? 0 : 1);
})();
`,
);

// Run from the project root so node_modules resolves.
execFileSync(process.execPath, [`${TMP}/test.js`], { stdio: "inherit", cwd: ROOT });

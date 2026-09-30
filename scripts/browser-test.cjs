// Drives the real page in headless Chrome: upload a PDF, read the preview,
// click download, and inspect the downloaded .xlsx bytes.
// Run: npx puppeteer-core with system Chrome
const puppeteer = require("C:/Users/sAssa/AppData/Local/Temp/opencode/browserdeps/node_modules/puppeteer-core");
const fs = require("node:fs");
const path = require("node:path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = "http://localhost:3999/en/pdf/pdf-to-excel";
const DL = "C:\\Users\\sAssa\\AppData\\Local\\Temp\\opencode\\dl";
const PDF = process.argv[2] || "C:\\Users\\sAssa\\AppData\\Local\\Temp\\opencode\\pdftest\\clean.pdf";

(async () => {
  fs.rmSync(DL, { recursive: true, force: true });
  fs.mkdirSync(DL, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error") errors.push(t);
    if (/^(OCR|GRID|BOUNDS|CB )/.test(t)) console.log(t);
  });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

  const client = await page.target().createCDPSession();
  await client.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: DL });

  await page.goto(URL, { waitUntil: "networkidle2", timeout: 90000 });
  console.log("title:", await page.title());

  const input = await page.$("input[type=file]");
  if (!input) { console.log("FAIL: no file input"); await browser.close(); process.exit(1); }
  await input.uploadFile(PDF);
  console.log("uploaded:", path.basename(PDF));

  // wait for either a result table or an error box
  await page.waitForFunction(
    () => document.querySelector("table") || document.body.innerText.includes("No readable text") ||
          document.body.innerText.includes("no table"),
    { timeout: 120000 }
  );

  const preview = await page.evaluate(() => {
    const rows = [...document.querySelectorAll("table tr")].slice(0, 8).map((tr) =>
      [...tr.querySelectorAll("td")].map((td) => td.textContent.trim())
    );
    const body = document.body.innerText;
    return {
      rows,
      text: body.slice(0, 400),
      badges: [...document.querySelectorAll("span")].map((s) => s.textContent.trim())
        .filter((t) => /rows|columns|pages|OCR/i.test(t)).slice(0, 6),
      hasError: /No readable text|no table detected|Error|error/i.test(body) &&
        !document.querySelector("table"),
      size: (body.match(/[\d.]+\s*KB/) || [])[0] || null,
    };
  });
  console.log("badges:", JSON.stringify(preview.badges));
  console.log("size:", preview.size);
  console.log("hasError:", preview.hasError);
  console.log("visible text:", JSON.stringify(preview.text));
  console.log("preview rows:");
  preview.rows.forEach((r) => console.log("   ", JSON.stringify(r)));

  // click the download button and confirm a real xlsx lands on disk
  const btn = await page.evaluateHandle(() =>
    [...document.querySelectorAll("button")].find((b) => /download/i.test(b.textContent))
  );
  if (btn && (await btn.jsonValue())) {
    await btn.asElement().click();
    await new Promise((r) => setTimeout(r, 4000));
    const files = fs.readdirSync(DL).filter((f) => f.endsWith(".xlsx"));
    if (files.length) {
      const buf = fs.readFileSync(path.join(DL, files[0]));
      const isZip = buf[0] === 0x50 && buf[1] === 0x4b;
      console.log(`downloaded: ${files[0]} (${buf.length} bytes) validZip=${isZip}`);
    } else {
      console.log("download: NO FILE — files present:", JSON.stringify(fs.readdirSync(DL)));
    }
  } else {
    console.log("FAIL: no download button found");
  }

  console.log("console errors:", errors.length ? JSON.stringify(errors.slice(0, 5)) : "none");
  await browser.close();
})();

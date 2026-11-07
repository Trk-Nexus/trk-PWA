// SPDX-License-Identifier: GPL-3.0-or-later
/* trk312：読書テーマ 30 種の読みやすさ（書斎の読書面の文字と背景の対比）。手で動かす（npm run check には入れない）。README §9。
   各テーマに切り替え、読書面（#studyTextPage）の文字色と、背景（色・グラデーション・半透明）の中で一番弱い対比を測る。
   背景がグラデーションのときは、色の停止点すべてを見て最も弱い値を使う（安全側）。
   合格：全テーマで 4.5:1 以上。SMOKE_URL で配信先を指定できる（既定は 127.0.0.1:8770）。 */
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
const URL = process.env.SMOKE_URL || "http://127.0.0.1:8770/index.html";
const browser = await puppeteer.launch({
  args: chromium.args, executablePath: await chromium.executablePath(), headless: true,
  defaultViewport: { width: 1280, height: 900 },
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(String(e)));
  await page.goto(URL, { waitUntil: "load" });
  await new Promise(r => setTimeout(r, 1200));
  const rows = await page.evaluate(async () => {
    const sel = document.getElementById("studyTheme");
    const themes = [...sel.options].map(o => o.value);
    const parse = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    const over = (top, base) => ({ r: top.r * top.a + base.r * (1 - top.a), g: top.g * top.a + base.g * (1 - top.a), b: top.b * top.a + base.b * (1 - top.a), a: 1 });
    const stageEl = document.getElementById("studyTextStage"), pageEl = document.getElementById("studyTextPage");
    const out = [];
    for (const t of themes) {
      sel.value = t; sel.dispatchEvent(new Event("change", { bubbles: true }));
      await new Promise(r => setTimeout(r, 60));
      const cs = getComputedStyle(pageEl), ss = getComputedStyle(stageEl);
      const stageC = parse(ss.backgroundColor) || { r: 0, g: 0, b: 0, a: 1 };
      const base = stageC.a < 1 ? over(stageC, { r: 0, g: 0, b: 0, a: 1 }) : stageC;
      const txt = parse(cs.color) || { r: 0, g: 0, b: 0, a: 1 };
      const bgParts = [cs.backgroundColor, cs.backgroundImage].join(" ");
      const bgs = (bgParts.match(/rgba?\([^)]+\)/g) || []).map(parse).filter(Boolean);
      const pageC = parse(cs.backgroundColor);
      const layers = [];
      if (bgs.length === 0 || (pageC && pageC.a === 0 && !cs.backgroundImage.includes("gradient"))) layers.push(base);
      for (const c of bgs) layers.push(c.a < 1 ? over(c, base) : c);
      if (layers.length === 0) layers.push(base);
      const worst = Math.min(...layers.map(bg => ratio(over(txt.a < 1 ? txt : txt, bg), bg)));
      out.push({ theme: t, ratio: Math.round(worst * 100) / 100, pass: worst >= 4.5, text: cs.color, bg: cs.backgroundColor.slice(0, 40), grad: cs.backgroundImage !== "none" });
    }
    return out;
  });
  let bad = 0;
  for (const r of rows) {
    if (!r.pass) bad++;
    console.log(`${r.pass ? "OK  " : "LOW "} ${r.theme.padEnd(10)} ${String(r.ratio).padStart(6)}:1  文字 ${r.text}  背景 ${r.bg}${r.grad ? " (グラデ)" : ""}`);
  }
  console.log(`\n${rows.length} テーマ / 4.5:1 未満 ${bad}`);
  console.log(errors.length ? `errors: ${errors.join(" | ")}` : "errors 0");
  process.exitCode = bad || errors.length ? 1 : 0;
} finally {
  browser.process()?.kill("SIGKILL");
  process.exit(process.exitCode || 0);
}

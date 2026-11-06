// SPDX-License-Identifier: GPL-3.0-or-later
/* trk309：未確認の作品の題字（開発用の受け子）。手で動かす（npm run check には入れない）。README §8。
   既定：未確認の作品は題字に当たらない。window.TrkReModernDev.setUnverifiedPaint(true) で当たる。false で戻る。
   SMOKE_URL で配信先を指定できる（既定は 127.0.0.1:8770）。 */
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
const URL = process.env.SMOKE_URL || "http://127.0.0.1:8770/index.html";
const ID = "trk-re-modern-dev-smoke";
const browser = await puppeteer.launch({
  args: chromium.args, executablePath: await chromium.executablePath(), headless: true,
  defaultViewport: { width: 1280, height: 900 },
});
const wait = ms => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, ok, extra = "") => { results.push(ok); console.log(`${ok ? "OK  " : "NG  "} ${name}${extra ? "  " + extra : ""}`); };
let errors = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", e => errors.push(String(e)));
  await page.goto(URL, { waitUntil: "load" });
  await wait(1200);
  await page.evaluate((id) => {
    const core = window.Trk.core;
    core.settings.remodernWorks = [{ id, name: "Dev smoke", author: "x", license: "OFL-1.1",
      regions: ["common"], colors: { text: "#e0e8ff", accent: "#1040c0" } }];
    core.settings.remodern = { version: 1, common: { mode: "own", work: id },
      study: { mode: "keep", work: null }, base: { mode: "keep", work: null } };
    core.settings.remodernDevPaint = false;
    core.saveUserPrefs();
  }, ID);
  await page.reload({ waitUntil: "load" });
  await wait(1500);
  const titleStyle = () => page.evaluate(() => { const h = document.querySelector(".brand h1"); return h ? h.getAttribute("style") || "" : "NOH1"; });
  const s0 = await titleStyle();
  check("既定：未確認の作品は題字に当たらない", !/color/.test(s0), `style="${s0}"`);
  await page.evaluate(() => window.TrkReModernDev.setUnverifiedPaint(true));
  await wait(300);
  const s1 = await titleStyle();
  check("開発用の切り替えを入れると、題字に当たる", /color/.test(s1), `style="${s1}"`);
  await page.evaluate(() => window.TrkReModernDev.setUnverifiedPaint(false));
  await wait(300);
  const s2 = await titleStyle();
  check("切り替えを戻すと、当たらない", !/color/.test(s2), `style="${s2}"`);
  check("エラーなし", errors.length === 0, errors.join(" | "));
} catch (e) {
  check("実行できた", false, String(e));
} finally {
  const bad = results.filter(x => !x).length;
  console.log(`\n${results.length - bad} OK / ${bad} NG`);
  browser.process()?.kill("SIGKILL");
  process.exit(bad ? 1 : 0);
}

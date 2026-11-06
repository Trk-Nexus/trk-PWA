// SPDX-License-Identifier: GPL-3.0-or-later
/* trk305：作品の色が共通の題字に当たるかの確認（手で動かす。npm run check には入れない）。
   手順は tools/smoke/README.md。SMOKE_URL で配信先を指定できる（既定は 127.0.0.1:8770）。 */
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
const URL = process.env.SMOKE_URL || "http://127.0.0.1:8770/index.html";
const browser = await puppeteer.launch({
  args: chromium.args, executablePath: await chromium.executablePath(), headless: true,
  defaultViewport: { width: 1280, height: 900 },
});
const errors = [];
const page = await browser.newPage();
page.on("pageerror", e => errors.push(String(e)));
await page.goto(URL, { waitUntil: "load" });
await new Promise(r => setTimeout(r, 1500));
const before = await page.evaluate(() => {
  const h1 = document.querySelector(".brand h1");
  return { color: h1.style.color, span: h1.querySelector("span").style.color, computed: getComputedStyle(h1).color };
});
// 作品を保存して読み直す（設定の保存 → 再読み込みの経路）
await page.evaluate(() => {
  const core = window.Trk.core;
  core.settings.remodernWorks = [{ id: "trk-re-modern-smoke", name: "Smoke", author: "x", license: "OFL-1.1",
    regions: ["common"], colors: { text: "#e0e8ff", accent: "#202020" } }];
  core.settings.remodern = { version: 1, common: { mode: "own", work: "trk-re-modern-smoke" },
    study: { mode: "keep", work: null }, base: { mode: "keep", work: null } };
  core.saveUserPrefs();
});
await page.reload({ waitUntil: "load" });
await new Promise(r => setTimeout(r, 1500));
const applied = await page.evaluate(() => {
  const h1 = document.querySelector(".brand h1");
  return { color: h1.style.color, span: h1.querySelector("span").style.color, computed: getComputedStyle(h1).color };
});
await page.evaluate(() => {
  const core = window.Trk.core;
  core.settings.remodern = { version: 1, common: { mode: "keep", work: null }, study: { mode: "keep", work: null }, base: { mode: "keep", work: null } };
  core.saveUserPrefs();
});
await page.reload({ waitUntil: "load" });
await new Promise(r => setTimeout(r, 1500));
const cleared = await page.evaluate(() => {
  const h1 = document.querySelector(".brand h1");
  return { color: h1.style.color, span: h1.querySelector("span").style.color };
});
await page.screenshot({ path: "/home/user/smoke-paint.png" });
console.log(JSON.stringify({ before, applied, cleared, errors }, null, 2));
try { browser.process()?.kill("SIGKILL"); } catch (_) {}   // 終了待ちで止まることがあるため、直接止める
process.exit(0);

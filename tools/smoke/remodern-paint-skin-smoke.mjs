// SPDX-License-Identifier: GPL-3.0-or-later
/* trk306：作品を選んだあとに通常のスキンを変えると、題字の色が判定し直されるか（手で動かす。npm run check には入れない）。
   手順は tools/smoke/README.md の 5。SMOKE_URL で配信先を指定できる（既定は 127.0.0.1:8770）。 */
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
const wait = ms => new Promise(r => setTimeout(r, ms));
await page.goto(URL, { waitUntil: "load" });
await wait(1500);
// 作品（文字色だけ明るい）を保存して、共通を「独立」にして読み直す
await page.evaluate(() => {
  const core = window.Trk.core;
  core.settings.remodernWorks = [{ id: "trk-re-modern-skin-smoke", name: "Skin smoke", author: "x", license: "OFL-1.1",
    regions: ["common"], colors: { text: "#e0e8ff", accent: "#202020" } }];
  core.settings.remodern = { version: 1, common: { mode: "own", work: "trk-re-modern-skin-smoke" },
    study: { mode: "keep", work: null }, base: { mode: "keep", work: null } };
  core.saveUserPrefs();
});
await page.reload({ waitUntil: "load" });
await wait(1500);
const readTitle = () => page.evaluate(() => {
  const h1 = document.querySelector(".brand h1");
  return { color: h1.style.color, span: h1.querySelector("span").style.color };
});
const applied = await readTitle();
// 背景が明るい通常のスキンを探して当てる（作品の色は読めなくなるはず）
const light = await page.evaluate(() => {
  const core = window.Trk.core, data = window.Trk.data, P = window.TrkReModernPaint;
  const h1 = document.querySelector(".brand h1");
  const prev = core.settings.skin;
  for (const id of Object.keys(data.SKINS)) {
    if (data.SKINS[id].locked) continue;
    core.applySkin(id, false);
    const bg = P.effectiveBg(h1);
    if (bg && P.luminance(bg) > 0.5) return id;
  }
  core.applySkin(prev, false);
  return null;
});
const afterLight = light ? await readTitle() : null;
// 暗いスキンに戻すと、もう一度当たる
await page.evaluate(() => window.Trk.core.applySkin("shadow", false));
await wait(300);
const backDark = await readTitle();
await page.evaluate(() => {
  const core = window.Trk.core;
  core.settings.remodern = { version: 1, common: { mode: "keep", work: null }, study: { mode: "keep", work: null }, base: { mode: "keep", work: null } };
  core.saveUserPrefs();
});
console.log(JSON.stringify({ applied, lightSkin: light, afterLight, backDark, errors }, null, 2));
try { browser.process()?.kill("SIGKILL"); } catch (_) {}   // 終了待ちで止まることがあるため、直接止める（README の注意）
process.exit(0);

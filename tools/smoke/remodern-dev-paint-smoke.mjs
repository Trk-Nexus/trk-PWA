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
  /* trk310：切り替えが入っている間は印（文字・ボタン）が出る。ボタンで切れる */
  await page.evaluate(() => window.TrkReModernDev.setUnverifiedPaint(true));
  await wait(300);
  const badge = await page.evaluate(() => { const b = document.getElementById("remodernDevBadge"); return b && !b.hidden ? b.textContent : ""; });
  check("印が出る（入っている間）", badge.length > 0, `「${badge.slice(0, 30)}」`);
  await page.evaluate(() => document.querySelector("#remodernDevBadge .remodernDevOff").click());
  await wait(300);
  const off = await page.evaluate(() => ({ on: window.TrkReModernDev.isUnverifiedPaint(), hidden: document.getElementById("remodernDevBadge").hidden }));
  check("印のボタンで切れ、印が隠れる", off.on === false && off.hidden === true, JSON.stringify(off));
  /* trk311：保存失敗（setItem が QuotaExceededError）。①初回のオン失敗 ②印が隠れている間のオン失敗。
     どちらも切り替えは元に戻り、console に警告が残り、設定の状態の行に文言が出る */
  const warns = [];
  page.on("console", m => { if (m.type() === "warn" && m.text().includes("保存できませんでした")) warns.push(m.text()); });
  await page.evaluate(() => {
    const orig = Storage.prototype.setItem;
    window.__origSetItem = orig;
    Storage.prototype.setItem = function (k, v) {
      if (window.__failSave) throw new DOMException("quota", "QuotaExceededError");
      return orig.call(this, k, v);
    };
  });
  await page.evaluate(() => { window.__failSave = true; });
  const r1 = await page.evaluate(() => window.TrkReModernDev.setUnverifiedPaint(true));
  await wait(300);
  const st1 = await page.evaluate(() => ({ on: window.TrkReModernDev.isUnverifiedPaint(), status: document.getElementById("remodernStatus").textContent }));
  check("①初回のオン失敗：オフのまま戻る", r1 === false && st1.on === false, JSON.stringify(st1));
  check("①初回のオン失敗：設定の状態の行に文言", st1.status.length > 0, `「${st1.status}」`);
  check("①初回のオン失敗：console に警告", warns.length >= 1, `warnings=${warns.length}`);

  await page.evaluate(() => { window.__failSave = false; window.TrkReModernDev.setUnverifiedPaint(true); });
  await wait(300);
  await page.evaluate(() => { window.TrkReModernDev.setUnverifiedPaint(false); });
  await wait(300);
  const hidden = await page.evaluate(() => document.getElementById("remodernDevBadge").hidden);
  await page.evaluate(() => { window.__failSave = true; });
  const before2 = warns.length;
  const r2 = await page.evaluate(() => window.TrkReModernDev.setUnverifiedPaint(true));
  await wait(300);
  const st2 = await page.evaluate(() => ({ on: window.TrkReModernDev.isUnverifiedPaint(), status: document.getElementById("remodernStatus").textContent }));
  check("②印が隠れた後のオン失敗：オフのまま戻る", hidden === true && r2 === false && st2.on === false, JSON.stringify({ hidden, r2, on: st2.on }));
  check("②印が隠れた後の失敗：console に警告（追加分）", warns.length > before2, `+${warns.length - before2}`);
  check("②印が隠れた後の失敗：設定の状態の行に文言", st2.status.length > 0, `「${st2.status}」`);
  await page.evaluate(() => { window.__failSave = false; Storage.prototype.setItem = window.__origSetItem; });
  check("エラーなし", errors.length === 0, errors.join(" | "));
} catch (e) {
  check("実行できた", false, String(e));
} finally {
  const bad = results.filter(x => !x).length;
  console.log(`\n${results.length - bad} OK / ${bad} NG`);
  browser.process()?.kill("SIGKILL");
  process.exit(bad ? 1 : 0);
}

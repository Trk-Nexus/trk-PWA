// SPDX-License-Identifier: GPL-3.0-or-later
/* trk308：書斎への「適用」「戻す」（手で動かす。npm run check には入れない）。手順は tools/smoke/README.md の 7。
   見張ること：選んだだけでは変わらない／適用で変わる／戻すで戻る／後で変えたら戻さず知らせる。
   SMOKE_URL で配信先を指定できる（既定は 127.0.0.1:8770）。 */
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
const URL = process.env.SMOKE_URL || "http://127.0.0.1:8770/index.html";
const ID = "trk-re-modern-apply-smoke";
const browser = await puppeteer.launch({
  args: chromium.args, executablePath: await chromium.executablePath(), headless: true,
  defaultViewport: { width: 1280, height: 900 },
});
const wait = ms => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, ok, extra = "") => { results.push({ name, ok }); console.log(`${ok ? "OK  " : "NG  "} ${name}${extra ? "  " + extra : ""}`); };
let errors = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", e => errors.push(String(e)));
  await page.goto(URL, { waitUntil: "load" });
  await wait(1200);
  await page.evaluate((id) => {
    const core = window.Trk.core;
    core.settings.remodernWorks = [{ id, name: "Apply smoke", author: "x", license: "OFL-1.1",
      regions: ["common", "study", "base"], colors: { text: "#e0e8ff", accent: "#1040c0" } }];
    core.settings.remodern = { version: 1, common: { mode: "keep", work: null },
      study: { mode: "keep", work: null }, base: { mode: "keep", work: null } };
    core.settings.remodernLast = null;
    core.saveUserPrefs();
  }, ID);
  await page.reload({ waitUntil: "load" });
  await wait(1500);
  const pick = async (sel, value) => page.evaluate((s, v) => {
    const el = document.querySelector(s); el.value = v; el.dispatchEvent(new Event("change", { bubbles: true }));
  }, sel, value);
  const state = () => page.evaluate(() => ({ s: JSON.parse(JSON.stringify(window.Trk.core.settings.remodern)), last: window.Trk.core.settings.remodernLast }));
  const btn = id => page.evaluate((i) => { const b = document.getElementById(i); if (b && !b.disabled) b.click(); return !!b; }, id);

  // 1) 選んだだけでは変わらない
  await pick("#remodern-study-mode", "own");
  await pick("#remodern-study-work", ID);
  await wait(200);
  let st = await state();
  check("選んだだけでは保存されない", st.s.study.mode === "keep", `mode=${st.s.study.mode}`);
  const impact = await page.evaluate(() => document.getElementById("remodern-study-impact").textContent);
  check("適用の前に影響範囲が出る", impact.length > 0, `「${impact}」`);
  check("適用ボタンが押せる", await page.evaluate(() => !document.getElementById("remodern-study-apply").disabled));

  // 2) 適用
  await btn("remodern-study-apply");
  await wait(300);
  st = await state();
  check("適用で書斎が変わる", st.s.study.mode === "own" && st.s.study.work === ID);
  check("適用の前の状態を覚える", !!st.last && st.last.region === "study" && st.last.before.mode === "keep");
  check("他の領域は変わらない", st.s.common.mode === "keep" && st.s.base.mode === "keep");
  check("戻すが使える", await page.evaluate(() => !document.getElementById("remodern-study-undo").disabled));

  // 3) 戻す
  await btn("remodern-study-undo");
  await wait(300);
  st = await state();
  check("戻すで直前へ戻る", st.s.study.mode === "keep" && st.last === null);

  // 4) 競合：適用後に利用者が変えたら戻さない
  await pick("#remodern-study-mode", "own");
  await pick("#remodern-study-work", ID);
  await btn("remodern-study-apply");
  await wait(300);
  await page.evaluate(() => { const c = window.Trk.core; c.settings.remodern = { ...c.settings.remodern, study: { mode: "keep", work: null } }; c.saveUserPrefs(); });
  await btn("remodern-study-undo");
  await wait(300);
  st = await state();
  check("変わっていれば戻さない（競合）", st.s.study.mode === "keep" && st.last !== null);

  // 5) リセットで記録も消える
  await page.evaluate(() => { const r = document.getElementById("remodernResetBtn"); if (r) r.click(); });
  await wait(300);
  st = await state();
  check("リセットで直前の記録も消える", st.last === null);
} catch (e) {
  check("実行できた", false, String(e));
} finally {
  check("エラーなし", errors.length === 0, errors.join(" | "));
  const bad = results.filter(r => !r.ok).length;
  console.log(`\n${results.length - bad} OK / ${bad} NG`);
  browser.process()?.kill("SIGKILL");
  process.exit(bad ? 1 : 0);
}

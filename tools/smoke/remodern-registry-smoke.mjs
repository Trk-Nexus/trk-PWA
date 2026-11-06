// SPDX-License-Identifier: GPL-3.0-or-later
/* trk307：登録簿との照合（手で動かす。npm run check には入れない）。手順は tools/smoke/README.md の 6。
   A：登録簿が空（同梱の写し）→ 作品は「未確認」、題字には当てない。
   B：登録簿に ID がある（読み込みだけ差し替える）→ 「登録済み」、題字に当たる。
   SMOKE_URL で配信先を指定できる（既定は 127.0.0.1:8770）。 */
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
const URL = process.env.SMOKE_URL || "http://127.0.0.1:8770/index.html";
const ID = "trk-re-modern-skin-smoke";
const browser = await puppeteer.launch({
  args: chromium.args, executablePath: await chromium.executablePath(), headless: true,
  defaultViewport: { width: 1280, height: 900 },
});
const wait = ms => new Promise(r => setTimeout(r, ms));

async function run(registryIds) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(String(e)));
  if (registryIds) {
    /* 読み込みだけ差し替える（同梱の写しは変えない） */
    await page.evaluateOnNewDocument((ids) => {
      const f = window.fetch.bind(window);
      window.fetch = (u, o) => String(u).includes("data/re-modern-registry.json")
        ? Promise.resolve(new Response(JSON.stringify({ format: "trk-re-modern-registry", version: 1, ids }), { status: 200 }))
        : f(u, o);
    }, registryIds);
  }
  await page.goto(URL, { waitUntil: "load" });
  await wait(1200);
  await page.evaluate((id) => {
    const core = window.Trk.core;
    core.settings.remodernWorks = [{ id, name: "Registry smoke", author: "x", license: "OFL-1.1",
      regions: ["common"], colors: { text: "#e0e8ff", accent: "#1040c0" } }];
    core.settings.remodern = { version: 1, common: { mode: "own", work: id },
      study: { mode: "keep", work: null }, base: { mode: "keep", work: null } };
    core.saveUserPrefs();
  }, ID);
  await page.reload({ waitUntil: "load" });
  await wait(1500);
  const result = await page.evaluate(() => {
    const h1 = document.querySelector(".brand h1");
    const sel = document.getElementById("remodern-common-work");
    const opt = sel && [...sel.options].find(o => o.value);
    return { title: h1.style.color, label: opt ? opt.textContent : null, errors: 0 };
  });
  result.errors = errors.length;
  await page.close();
  return result;
}

const a = await run(null);
const b = await run([ID]);
console.log(JSON.stringify({ A_empty_registry: a, B_registered: b }, null, 2));
try { browser.process()?.kill("SIGKILL"); } catch (_) {}
process.exit(0);

import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
const URL = process.env.SMOKE_URL || "http://127.0.0.1:8770/index.html";
const exe = await chromium.executablePath();
const out = [];
const log = (...a) => { console.log(...a); };
async function run(vw, vh, mobile) {
  const b = await puppeteer.launch({ executablePath: exe, args: chromium.args, headless: true });
  const p = await b.newPage();
  await p.setViewport({ width: vw, height: vh, isMobile: mobile, hasTouch: mobile });
  await p.evaluateOnNewDocument(() => {
    localStorage.setItem("shadow_taiko_preferences_v2", JSON.stringify({ remodernIcons: true, welcomeSeen: true, language: "ja" }));
  });
  const errors = [];
  p.on("pageerror", e => errors.push(String(e.message || e)));
  await p.goto(URL, { waitUntil: "load" });
  await new Promise(r => setTimeout(r, 2500));
  const state = s => p.evaluate(s => {
    const d = document.getElementById("remodernDialog");
    const r = d.getBoundingClientRect(), cs = getComputedStyle(d);
    return { open: d.open, modal: d.matches(":modal"), w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, color: cs.color, parentIsBody: d.parentElement === document.body };
  });
  // 基地
  await p.evaluate(() => document.getElementById("mediaOpenBtn").click());
  await new Promise(r => setTimeout(r, 900));
  const mb = await p.evaluate(() => { const b = document.querySelector(".remodernOpenMedia"); return { exists: !!b, hidden: b && b.hidden, text: b && b.textContent }; });
  log(`[${vw}x${vh} mobile=${mobile}] base button`, JSON.stringify(mb));
  await p.evaluate(() => document.querySelector(".remodernOpenMedia").click());
  await new Promise(r => setTimeout(r, 300));
  log(`[${vw}] base dialog`, JSON.stringify(await state()));
  await p.evaluate(() => document.getElementById("remodernDlgClose").click());
  await new Promise(r => setTimeout(r, 300));
  log(`[${vw}] base dialog after close`, JSON.stringify(await state()));
  // 書斎
  await p.evaluate(() => document.getElementById("studyOpenBtn").click());
  await new Promise(r => setTimeout(r, 900));
  await p.evaluate(() => document.getElementById("studyRemodernBtn").click());
  await new Promise(r => setTimeout(r, 300));
  log(`[${vw}] study dialog`, JSON.stringify(await state()));
  await p.evaluate(() => document.getElementById("remodernDlgClose").click());
  await new Promise(r => setTimeout(r, 300));
  log(`[${vw}] study dialog after close`, JSON.stringify(await state()));
  log(`[${vw}] page errors`, errors.length, errors.slice(0, 3));
  await p.screenshot({ path: `/home/user/smoke-${vw}.png` });
  await b.close();
}
await run(1280, 900, false);
await run(390, 844, true);

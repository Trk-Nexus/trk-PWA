// SPDX-License-Identifier: GPL-3.0-or-later
/* trk301：レビュー（trk-Nexus-review-trk300-remodern-2026-11-06）への対応。
   見張ること：
   ・ダイアログは設定画面の外（body の直下）。見えない modal で画面を塞がない（レビュー 1）
   ・ダイアログは系の地と文字（スキンの色）を使う
   ・基地のボタンは出し入れを render が行い、文言は data-i18n（レビュー R2）
   ・作品の名前から書字方向の制御文字を取り除く（レビュー R4）
   ・ハッシュはファイル全体（レビュー R3）
   ・作品はまだ画面に反映されないことを、4 言語の文言で明記（レビュー M3） */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const ui = read("js/remodern-ui.js");
const css = read("css/style.css");
const i18n = read("js/i18n.js");

test("ダイアログは body の直下へ移す（設定の display:none に入れない）", () => {
  assert.ok(ui.includes('if (dlg && dlg.parentElement !== document.body) document.body.append(dlg);'));
});

test("ダイアログは系の地と文字を使い、背景の幕もある", () => {
  assert.ok(/\.remodernDialog \{[^}]*background: var\(--ui-panel\);[^}]*color: var\(--ui-text\);/.test(css));
  assert.ok(css.includes(".remodernDialog::backdrop"));
});

test("基地のボタンの出し入れは render が行う（一度だけ作られる画面への対応）", () => {
  assert.ok(ui.includes('document.querySelectorAll(".remodernOpenMedia").forEach(b => { b.hidden = core.settings.remodernIcons !== true; });'));
});

test("作品名から書字方向の制御文字を取り除く", () => {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(read("js/remodern-regions.js"), ctx);
  vm.runInContext(read("js/remodern-work.js"), ctx);
  const W = ctx.TrkReModernWork;
  const raw = { format: "shadow-taiko-pack", name: "\u202Eevil\u2066x\u2069\u200f", license: "OFL-1.1",
    remodern: { version: 1, id: "trk-re-modern-rtl", regions: ["base"] } };
  const r = W.checkManifest(raw);
  assert.equal(r.ok, true);
  assert.equal(r.work.name, "evilx");
});

test("ハッシュはファイル全体（.stpack の中身）", () => {
  assert.ok(ui.includes("const hash = await sha256Hex(await file.arrayBuffer());"));
  assert.ok(ui.includes('const digest = await crypto.subtle.digest("SHA-256", buf);'));
});

test("作品はまだ画面に反映されないと 4 言語で明記する", () => {
  const phrases = { ja: "まだ画面に反映されません", en: "not applied to the screen yet", zh: "尚未应用到画面上", ko: "아직 화면에 반영되지 않습니다" };
  const blocks = ["ja", "en", "zh", "ko"].map(l => {
    const start = i18n.indexOf(`\n  ${l}: {`);
    assert.ok(start > 0, `${l} の塊`);
    return i18n.slice(start);
  });
  ["ja", "en", "zh", "ko"].forEach((l, i) => {
    const hint = blocks[i].match(new RegExp(`remodernDlgHint:"[^"\\n]*${phrases[l]}`));
    assert.ok(hint, `${l} の remodernDlgHint に明記`);
  });
});

/* ユーザーの判断（2026-11-06）への対応：M4＝色は 14 個、R1＝見出しは作品があるときだけ、R6＝知らせは本文の色＋「✓」 */
test("M4：作品の色は Avatar の 14 個（スキンと同じ鍵）。frame などは落ちる", () => {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(read("js/remodern-regions.js"), ctx);
  vm.runInContext(read("js/remodern-work.js"), ctx);
  const W = ctx.TrkReModernWork;
  assert.deepEqual([...W.COLOR_KEYS], ["stage", "ink", "text", "muted", "bg", "panel", "field", "button", "accent", "onAccent", "gold", "border", "don", "ka"]);
  const r = W.checkManifest({ format: "shadow-taiko-pack", name: "x", license: "OFL-1.1",
    remodern: { version: 1, id: "trk-re-modern-c", regions: ["base"], colors: { stage: "#101010", frame: "#ffffff" } } });
  assert.equal(r.ok, true);
  assert.deepEqual(JSON.parse(JSON.stringify(r.work.colors)), { stage: "#101010" });
});

test("R1：見出しの枠は、作品の見出しを当てる処理が入るまで効かせない", () => {
  const typo = read("js/typography.js");
  assert.ok(typo.includes("const HEADING_FROM_WORK = false;"));
  assert.ok(typo.includes("if (vars.heading && HEADING_FROM_WORK) body.classList.add(\"trk-typo-heading\")"));
});

test("R6：知らせは本文の色。文字があるときだけ「✓」", () => {
  const css = read("css/style.css");
  assert.ok(css.includes(".status{color:var(--ui-text);font-weight:700}"));
  assert.ok(css.includes('.status:not(:empty)::before{content:"✓ "}'));
  assert.ok(!css.includes(".status{color:var(--ui-gold)"));
});

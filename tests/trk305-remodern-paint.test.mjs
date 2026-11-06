// SPDX-License-Identifier: GPL-3.0-or-later
/* trk305：作品の色を共通の題字へ当てる（段階2・M3）。
   見張ること：
   ・当てるのは共通の題字（.brand h1）だけ。書斎・基地は当てない
   ・使う色は text と accent の 2 つだけ。#rrggbb の形だけ
   ・背景との対比が 4.5:1 に届かない色は使わない（既定のまま）
   ・作品が無い・外れたら、当てた色を消して既定へ戻す
   ・画面の値は保存しない（保存は設定の作品一覧のまま） */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");

function loadPaint(extra = {}) {
  const ctx = { ...extra };
  vm.createContext(ctx);
  vm.runInContext(read("js/remodern-paint.js"), ctx);
  return ctx.TrkReModernPaint;
}

const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

test("対比の計算：白と黒は 21:1、同じ色は 1:1", () => {
  const P = loadPaint();
  assert.ok(Math.abs(P.ratio(WHITE, BLACK) - 21) < 1e-9);
  assert.ok(Math.abs(P.ratio(WHITE, WHITE) - 1) < 1e-9);
  assert.equal(P.MIN_RATIO, 4.5);
});

test("色の読み取り：#rrggbb と rgb()／rgba() だけ。それ以外は null", () => {
  const P = loadPaint();
  assert.deepEqual([...P.hexToRgb("#10ff00")], [16, 255, 0]);
  assert.equal(P.hexToRgb("red"), null);
  assert.equal(P.hexToRgb("#fff"), null);
  assert.equal(P.hexToRgb("url(x)"), null);
  assert.deepEqual([...P.parseRgb("rgb(14, 16, 24)")], [14, 16, 24, 1]);
  assert.deepEqual([...P.parseRgb("rgba(14, 16, 24, 0.5)")], [14, 16, 24, 0.5]);
  assert.equal(P.parseRgb("transparent"), null);
});

test("題字の色：対比が 4.5 以上なら当て、足りなければ落とす。text と accent だけ使う", () => {
  const P = loadPaint();
  const work = { colors: { text: "#101010", accent: "#1040c0", stage: "#000000", gold: "#202020" } };
  const onWhite = P.titlePaint(work, WHITE);
  assert.equal(onWhite.text, "#101010");
  assert.equal(onWhite.accent, "#1040c0");
  assert.deepEqual([...onWhite.skipped], []);
  const onBlack = P.titlePaint(work, BLACK);
  assert.equal(onBlack.text, null);
  assert.equal(onBlack.accent, null);
  assert.deepEqual([...onBlack.skipped], ["text", "accent"]);
});

test("題字の色：背景が分からない・色が無い・形が違う値は当てない", () => {
  const P = loadPaint();
  const work = { colors: { text: "#101010", accent: "javascript:1" } };
  const noBg = P.titlePaint(work, null);
  assert.equal(noBg.text, null);
  assert.equal(noBg.accent, null);
  const onWhite = P.titlePaint(work, WHITE);
  assert.equal(onWhite.text, "#101010");
  assert.equal(onWhite.accent, null);
  const none = P.titlePaint({}, WHITE);
  assert.equal(none.text, null);
  assert.equal(none.accent, null);
});

test("背景：半透明の層を下から重ねる（不透明な基準は #000）", () => {
  const node = (bg, parent) => ({ nodeType: 1, parentElement: parent, __bg: bg });
  const root = node("rgb(255, 255, 255)", null);
  const panel = node("rgba(0, 0, 0, 0.5)", root);
  const h1 = node("transparent", panel);
  const P = loadPaint({
    getComputedStyle: el => ({ backgroundColor: el.__bg })
  });
  assert.deepEqual([...P.effectiveBg(h1)], [128, 128, 128]);
});

test("題字へ当てる・消す：h1 と「!」（span）だけに inline の color を置く", () => {
  const P = loadPaint();
  const span = { style: { color: "" } };
  const h1 = { style: { color: "" }, querySelector: sel => (sel === "span" ? span : null) };
  P.applyTitle(h1, { text: "#101010", accent: "#ff0000", skipped: [] });
  assert.equal(h1.style.color, "#101010");
  assert.equal(span.style.color, "#ff0000");
  P.clearTitle(h1);
  assert.equal(h1.style.color, "");
  assert.equal(span.style.color, "");
});

test("画面側：共通の独立・作品があるときだけ題字へ当て、それ以外は消す（書斎・基地は当てない）", () => {
  const ui = read("js/remodern-ui.js");
  const fn = ui.slice(ui.indexOf("function paintTitle(view)"), ui.indexOf("function render()"));
  assert.ok(fn.includes('view.common && view.common.source === "own" && view.common.work'));
  assert.ok(fn.includes('document.querySelector(".brand h1")'));
  assert.ok(fn.includes("PAINT.clearTitle(h1)"));
  assert.ok(!/study|base/.test(fn), "paintTitle は書斎・基地を見ない");
  assert.ok(ui.includes("    paintTitle(view);\n"), "render から呼ぶ");
});

test("読み込み順：remodern-paint.js は remodern-ui.js より前に読む。版は trk305", () => {
  const html = read("index.html");
  const paint = html.indexOf('<script src="js/remodern-paint.js">');
  const ui = html.indexOf('<script src="js/remodern-ui.js">');
  assert.ok(paint > 0 && ui > 0);
  assert.ok(paint < ui, "paint は ui より前");
  assert.match(html, /name="trk-build" content="trk305"/);
  assert.match(read("sw.js"), /const CACHE = "trk-v2026\.11\.04-trk305";/);
});

test("設定の作品欄の文言：4 言語とも、題字だけに反映されると書く", () => {
  const i18n = read("js/i18n.js");
  const phrases = { ja: "共通の題字（trk!）だけに反映されます", en: "only to the common title (trk!)", zh: "只应用于通用标题（trk!）", ko: "공통 제목(trk!)에만 반영됩니다" };
  for (const l of ["ja", "en", "zh", "ko"]) {
    const start = i18n.indexOf(`\n  ${l}: {`);
    assert.ok(start > 0, `${l} の塊`);
    assert.ok(i18n.slice(start).includes(`remodernWorkHint:"`), `${l} の remodernWorkHint`);
    const hint = i18n.slice(start).match(/remodernWorkHint:"[^"\n]*"/);
    assert.ok(hint && hint[0].includes(phrases[l]), `${l} の文言`);
  }
});

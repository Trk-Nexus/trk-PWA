// SPDX-License-Identifier: GPL-3.0-or-later
/* trk309：未確認の作品に色を当てる開発用の受け子（置き場所は Avatar 側と相談中）。
   見張ること：
   ・既定は「当てない」（登録済みだけ当たる）
   ・開発用の切り替えを入れたときだけ、未確認にも当たる
   ・題字の判定は mayPaint を通る（ほかの経路で直接当てない）
   ・画面には切り替えを出さない（window.TrkReModernDev だけ）
   ・文言は 4 言語そろう */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
function loadR() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(read("js/remodern-regions.js"), ctx);
  return ctx.TrkReModernRegions;
}

test("判定：既定（開発用なし）は登録済みだけ当たる", () => {
  const R = loadR();
  assert.equal(R.mayPaint("registered", false), true);
  assert.equal(R.mayPaint("unverified", false), false);
  assert.equal(R.mayPaint("unverified", undefined), false);
  assert.equal(R.mayPaint("unverified", "yes"), false, "true 以外は当てない");
});

test("判定：開発用の切り替えを入れたときだけ、未確認にも当たる", () => {
  const R = loadR();
  assert.equal(R.mayPaint("unverified", true), true);
  assert.equal(R.mayPaint("registered", true), true);
});

test("保存：core.js は開発用の切り替えを読み込む（既定は false）", () => {
  assert.match(read("js/core.js"), /remodernDevPaint:\s*prefs\.remodernDevPaint === true/);
});

test("題字：判定は mayPaint を通り、受け子は画面に出さない", () => {
  const ui = read("js/remodern-ui.js");
  assert.match(ui, /R\.mayPaint\(statusOfWork\(pick\.id\), core\.settings\.remodernDevPaint === true\)/);
  assert.match(ui, /window\.TrkReModernDev = Object\.freeze\(/);
  assert.match(ui, /setUnverifiedPaint\(on\)/);
  assert.doesNotMatch(read("index.html"), /remodernDevPaint/, "画面の切り替えは作らない（置き場所は相談中）");
});

test("文言：影響範囲の開発用の文言は 4 言語そろう", () => {
  const n = (read("js/i18n.js").match(/\bremodernImpactDev:/g) || []).length;
  assert.equal(n, 4);
});

test("版：trk309（index.html・sw.js）", () => {
  assert.match(read("index.html"), /name="trk-build" content=\"trk315\"/);
  assert.match(read("sw.js"), /const CACHE = "trk-v2026\.11\.04-trk315";/);
});

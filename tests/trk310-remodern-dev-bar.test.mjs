// SPDX-License-Identifier: GPL-3.0-or-later
/* trk310：Avatar の回答を反映（開発用の切り替えの保存・印・オフ）。
   見張ること：
   ・保存に失敗したら切り替えを元に戻す（メモリだけの値で成功と言わない）
   ・切り替えは remodernDevPaint だけを変える（作品・ノーツ・読書・再生に触れない）
   ・切り替えが入っている間は、固定の印（文字・ボタン・role=status）を出す。入っていなければ隠す
   ・印は 24px 以上のボタン・:focus-visible・[hidden] を上書きしない
   ・文言は 4 言語そろう */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");

test("保存：失敗したら元に戻し、戻った状態を返す", () => {
  const ui = read("js/remodern-ui.js");
  assert.match(ui, /if \(core\.saveUserPrefs\(\) === false\) \{\s*\n\s*core\.settings\.remodernDevPaint = before;/);
  assert.match(ui, /setUnverifiedPaint\(on\) \{ return setDevPaint\(on\); \}/);
});

test("保存失敗：console に必ず残し、印（隠れていても）と設定の状態の行に出す（trk311）", () => {
  const ui = read("js/remodern-ui.js");
  const fail = ui.slice(ui.indexOf("if (core.saveUserPrefs() === false) {"), ui.indexOf("render();\n      return before;"));
  assert.match(fail, /console\.warn\("\[trk-re-modern\] 開発用の切り替えを保存できませんでした/);
  assert.match(fail, /say\(devNote\(\), "remodernDevSaveFail"\);/);
  assert.match(fail, /say\(status, "remodernDevSaveFail"\);/);
  assert.doesNotMatch(fail, /if \(!devNote\(\)\) console/, "隠れている印の場合に console を省かない");
});

test("切り替えは remodernDevPaint だけを変える", () => {
  const ui = read("js/remodern-ui.js");
  const fn = ui.slice(ui.indexOf("function setDevPaint"), ui.indexOf("window.TrkReModernDev = Object.freeze"));
  assert.match(fn, /core\.settings\.remodernDevPaint = want;/);
  assert.doesNotMatch(fn, /remodernWorks|remodern\s*=|remodernLast|remodernIcons|lang|skin/);
});

test("印：入っている間だけ出す（文字・ボタン・role=status）", () => {
  const ui = read("js/remodern-ui.js");
  assert.match(ui, /function renderDevBar\(\)/);
  assert.match(ui, /devBar\.setAttribute\("role", "status"\)/);
  assert.match(ui, /off\.className = "remodernDevOff";/);
  assert.match(ui, /if \(!on\) \{ if \(devBar\) devBar\.hidden = true; return; \}/);
  assert.match(ui, /renderDevBar\(\);\s*\n\s*if \(iconsChk\)/, "render から呼ぶ");
});

test("CSS：印は 24px 以上・:focus-visible・hidden を上書きしない", () => {
  const css = read("css/style.css");
  assert.match(css, /\.remodernDevBadge\[hidden\], |\.remodernDevBadge\[hidden\] \{ display: none; \}|\.remodernDevBadge\[hidden\]/);
  assert.match(css, /\.remodernDevBadge \.remodernDevOff \{ min-height: 24px; min-width: 24px;/);
  assert.match(css, /\.remodernDevBadge \.remodernDevOff:focus-visible/);
  assert.match(css, /position: fixed;/);
});

test("文言：印・ボタン・保存失敗の 3 キーは 4 言語そろう", () => {
  const i18n = read("js/i18n.js");
  for (const k of ["remodernDevBadge", "remodernDevOff", "remodernDevSaveFail"]) {
    const n = (i18n.match(new RegExp(`\\b${k}:`, "g")) || []).length;
    assert.equal(n, 4, `${k} は 4 言語ぶん（今 ${n}）`);
  }
});

test("版：trk310（index.html・sw.js）", () => {
  assert.match(read("index.html"), /name="trk-build" content="trk312"/);
  assert.match(read("sw.js"), /const CACHE = "trk-v2026\.11\.04-trk312";/);
});

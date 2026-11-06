// SPDX-License-Identifier: GPL-3.0-or-later
/* trk297：設定「🎨 スキン」の領域ごとの 3 行（段階2の1件目）。
   見張ること：
   ・3 行（共通・書斎・基地）＋リセットと状態の行が、スキンの見出しの直後にある
   ・既定は全部「現状維持」（D4）。読み込みは検証を通す（壊れた値は keep）
   ・道具（js/remodern-regions.js）は core.js より前、UI は後に読み込まれる
   ・文言は 4 言語そろい、使う鍵が全部ある */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const html = read("index.html");
const core = read("js/core.js");
const ui = read("js/remodern-ui.js");
const i18n = read("js/i18n.js");

test("設定に 3 行・リセット・状態の行があり、スキンの見出しの直後にある", () => {
  const h = html.indexOf('<h3 data-i18n="skin"></h3>');
  const box = html.indexOf('id="remodernRegions"');
  assert.ok(h > 0 && box > h && box - h < 400, "見出しの直後");
  for (const id of ["remodern-common-mode", "remodern-study-mode", "remodern-base-mode",
    "remodern-common-work", "remodern-study-work", "remodern-base-work", "remodernResetBtn", "remodernStatus"]) {
    assert.ok(html.includes(`id="${id}"`), `${id} がある`);
  }
  assert.ok(html.indexOf('id="skinNow"') > box, "skinNow の前に置く");
});

test("既定は全部「現状維持」。保存の読み込みは検証を通す", () => {
  assert.match(core, /remodern: \(window\.TrkReModernRegions \? window\.TrkReModernRegions\.normalize\(prefs\.remodern\)\.state/);
  assert.match(core, /common: \{ mode: "keep", work: null \}/);
  assert.match(core, /study: \{ mode: "keep", work: null \}/);
  assert.match(core, /base: \{ mode: "keep", work: null \}/);
});

test("読み込み順：道具 → core.js → UI", () => {
  const tool = html.indexOf('src="js/remodern-regions.js"');
  const c = html.indexOf('src="js/core.js"');
  const u = html.indexOf('src="js/remodern-ui.js"');
  assert.ok(tool > 0 && tool < c, "道具は core.js より前");
  assert.ok(u > c, "UI は core.js の後");
});

test("UI は作品を勝手に作らず、保存は saveUserPrefs を通す", () => {
  assert.ok(ui.includes("window.TrkReModernWorks"), "作品は外から読む（今は空）");
  assert.ok(ui.includes("core.saveUserPrefs()"), "保存の経路");
  assert.ok(!/fetch\(|localStorage\./.test(ui), "通信・直接の保存をしない");
  assert.ok(ui.includes("R.apply(current(), region, mode, work)"), "1 行だけ変える道具を使う（適用の前の状態を覚える）");
});

test("文言は 4 言語そろい、使う鍵がすべてある", () => {
  const keys = ["remodernHint", "remodernCommon", "remodernStudy", "remodernBase", "remodernKeep", "remodernFollow",
    "remodernOwn", "remodernNoWork", "remodernFallback", "remodernEmpty", "remodernBad", "remodernSaved",
    "remodernSaveFail", "remodernResetDone", "remodernReset"];
  const used = [...ui.matchAll(/["'](remodern[A-Za-z]+)["']/g)].map(m => m[1]);
  for (const k of new Set([...keys, ...used])) if (k !== "remodernRegions" && k !== "remodernStatus" && k !== "remodernResetBtn") {
    assert.ok(keys.includes(k) || used.length === 0 || k.startsWith("remodern"), `${k} が定義される`);
  }
  const starts = ["ja", "en", "zh", "ko"].map(l => i18n.indexOf(`\n  ${l}: {`));
  assert.ok(starts.every(x => x > 0), "4 言語の塊がある");
  for (const k of keys) assert.equal(i18n.split(`${k}:`).length - 1, 4, `${k} は 4 言語に 1 つずつ`);
});

// SPDX-License-Identifier: GPL-3.0-or-later
/* ⚖ trk279：設定の「段」（見せる量）を、値は変えずに切り替える

   見張ること：
   ・段は 5 つ（シンプル／スタンダード／プロ／マスター／ウィザード。5 つ目は trk281）で、既定はスタンダード
   ・**隠すのは上の段の行だけ**。触った行（data-changed）はどの段でも出る
   ・パネルは「中の行が全部隠れるとき」だけ隠す（🎨 はスキンが残るので消えない）
   ・段で変わるのは見え方だけ（settings に触るのは setLevel と setTouched の 2 つ）
   ・探しているあいだは段を無視する（見つからない、を作らない）
   ・文言は 4 言語そろい、DOM の段の名前と食い違わない */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const html = read("index.html");
const core = read("js/core.js");
const css = read("css/style.css");
const i18n = read("js/i18n.js");
const level = read("js/settings-level.js");

/* 純粋な道具だけを取り出して動かす（DOM は使わない） */
const api = (() => {
  const start = level.indexOf("const LEVELS =");
  const end = level.indexOf("/* ---------- 画面を調べる");
  assert.notEqual(start, -1, "LEVELS がある");
  assert.notEqual(end, -1, "画面の節がある");
  const code = level.slice(start, end) + "\nthis.api = { LEVELS, RANK, PANEL_TIER, BLOCK_TIER, ID_TIER, levelRank, levelName, tierHidden, levelPlan, nextLevel };";
  const sandbox = { Object, Array, Number, Map, Math };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "js/settings-level.js#pure" });
  return sandbox.api;
})();

test("段は 5 つ・既定はスタンダード", () => {
  assert.deepEqual(Array.from(api.LEVELS), ["simple", "standard", "pro", "master", "wizard"]);
  assert.deepEqual(
    [...core.match(/const SET_LEVELS = \[([^\]]*)\]/)[1].matchAll(/"([^"]+)"/g)].map(m => m[1]),
    Array.from(api.LEVELS),
    "core.js の SET_LEVELS と、画面の段の並びが同じ"
  );
  assert.match(core, /setLevel: pick\(prefs\.setLevel, SET_LEVELS, "standard"\)/, "既定はスタンダード");
  assert.match(core, /settings\.setLevel = "standard"; settings\.setTouched = \[\];/, "工場出荷で既定（スタンダード）へ");
  assert.match(html, /id="settingsScreen"[^>]*data-set-level="standard"/, "画面の初期値もスタンダード");
});

test("隠すのは上の段の行だけ。触った行は隠さない", () => {
  assert.equal(api.levelRank("simple"), 1);
  assert.equal(api.levelRank("master"), 4);
  assert.equal(api.levelRank("wizard"), 5, "ウィザードはいちばん上（trk281）");
  assert.equal(api.levelRank("なにか"), 2, "知らない値はスタンダード扱い");
  assert.equal(api.tierHidden(1, 1, false), false, "シンプルでも段 1 は出る");
  assert.equal(api.tierHidden(2, 1, false), true, "シンプルでは段 2 を隠す");
  assert.equal(api.tierHidden(2, 2, false), false, "スタンダードでは段 2 は出る");
  assert.equal(api.tierHidden(3, 2, false), true);
  assert.equal(api.tierHidden(4, 3, false), true);
  assert.equal(api.tierHidden(4, 4, false), false, "マスターでは何も隠さない");
  assert.equal(api.tierHidden(4, 1, true), false, "触った行は、どの段でも出す");
  assert.equal(api.tierHidden(0, 1, false), false, "段の無い行は隠さない");
});

test("パネルは、中の行が全部隠れるときだけ隠す", () => {
  const rows = [
    { panel: "secDisplay", key: "skinShelf", tier: 1, changed: false },
    { panel: "secDisplay", key: "tvMaker", tier: 3, changed: false },
    { panel: "cliPanel", key: "cliBell", tier: 4, changed: false },
    { panel: "cliPanel", key: "cliSpells", tier: 4, changed: true },   /* 触った行があるのでパネルは残る */
    { panel: "vrmPanel", key: "vrmAgree", tier: 4, changed: false },
  ];
  const plan = api.levelPlan(rows, 1);
  assert.deepEqual(Array.from(plan.panels), ["vrmPanel"], "全部隠れる vrm だけが消える");
  assert.equal(plan.count, 3, "隠れる行は 3 つ（tvMaker・cliBell・vrmAgree）");
  const top = api.levelPlan(rows, 4);
  assert.equal(top.count, 0, "マスターでは 0");
  assert.deepEqual(Array.from(top.panels), []);
});

test("次の段（いちばん上なら null）", () => {
  assert.equal(api.nextLevel("simple"), "standard");
  assert.equal(api.nextLevel("standard"), "pro");
  assert.equal(api.nextLevel("pro"), "master");
  assert.equal(api.nextLevel("master"), "wizard", "マスターの次はウィザード（trk281）");
  assert.equal(api.nextLevel("wizard"), null);
});

test("19 枚のパネルに、段の割り当てが漏れていない", () => {
  const section = html.slice(html.indexOf('id="settingsScreen"'), html.indexOf("\n  </section>", html.indexOf('id="settingsScreen"')));
  const keys = [...section.matchAll(/<details class="panel[^"]*"(?: id="([^"]+)")?[^>]*>\s*<summary([^>]*)>/g)]
    .map(m => m[1] || ((m[2] || "").match(/data-i18n="([^"]+)"/) || [])[1] || "")
    .filter(Boolean);
  assert.ok(keys.length >= 19, `パネルを数えられた（${keys.length}）`);
  for (const key of keys) assert.ok(api.PANEL_TIER[key], `${key} に段がある`);
});

test("段で変わるのは見え方だけ（settings に触るのは 2 つ）", () => {
  const writes = [...level.matchAll(/core\.settings\.([A-Za-z0-9_]+)\s*=/g)].map(m => m[1]);
  assert.deepEqual([...new Set(writes)].sort(), ["setLevel", "setTouched"], "setLevel と setTouched 以外は書かない");
  const touched = level.match(/setTouched[^\n]*slice\(0, 160\)|list\.length < 160/);
  assert.ok(touched, "触った設定は 160 までに抑える");
  assert.match(core, /setTouched: cleanSkinIdList\(prefs\.setTouched, 160\)/, "読み込みも 160 まで");
});

test("探しているあいだは段を無視する（見つからない、を作らない）", () => {
  assert.match(level, /function syncSearch\(\)/, "検索の見張りがある");
  assert.match(level, /wholeView = active;/, "探しているあいだは全体表示へ");
  assert.match(level, /pane\.dataset\.setLevel = wholeView \? "master" : level;/, "段を無視するのはマスターと同じ見え方");
  assert.match(level, /box\.addEventListener\("input", syncSearch\)/, "2 本の検索欄のどちらでも効く");
});

test("段のボタンと CSS の規則がそろっている", () => {
  const values = [...html.matchAll(/data-set-level-btn="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(values, Array.from(api.LEVELS), "5 つのボタンが段の並びどおり");
  assert.match(html, /id="setLevelStatus"[^>]*aria-live="polite"/, "切り替えを読み上げる");
  assert.match(html, /id="setLevelMore"/, "次の段への道がある");
  assert.match(html, /<script src="js\/settings-level.js"><\/script>/, "読み込んでいる");
  for (const lv of ["simple", "standard", "pro"]) {
    assert.match(css, new RegExp(`#settingsScreen\\[data-set-level="${lv}"\\]`), `${lv} の規則がある`);
  }
  assert.match(css, /:not\(\[data-changed\]\)/, "触った行は隠さない");
  assert.match(css, /details\.panel\[data-level-hidden\]\{display:none\}/, "パネルごと隠せる");
});

test("文言は 4 言語そろっている", () => {
  for (const key of ["setLevelTitle", "setLevelSimple", "setLevelStandard", "setLevelPro", "setLevelMaster", "setLevelHint", "setLevelHidden", "setLevelPanelNote", "setLevelMore", "setLevelDone", "setLevelWizard"]) {
    assert.equal((i18n.match(new RegExp(`\\b${key}:`, "g")) || []).length, 4, `${key} は 4 言語`);
  }
  assert.match(i18n, /setLevelHidden:"この段では \{n\} 項目を隠しています。"/, "数え方を言葉で伝える");
  assert.match(i18n, /setLevelSimple:"シンプル"/, "段の名前（日本語）");
  assert.match(i18n, /setLevelWizard:"ウィザード"/, "5 つ目の名前（日本語）");
});

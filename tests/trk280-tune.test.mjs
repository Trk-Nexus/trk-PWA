// SPDX-License-Identifier: GPL-3.0-or-later
/* ⚖ trk280：体力の数字を読みやすくし、TRUCK の揺れを既定オフにし、既定の棚からウィザードを外す

   見張ること：
   ・スタンダード：開始 20・上限 30・10 コンボごとに 1 回復（**モードで変えない**）
   ・ナイト：開始 30・上限 30・回復なし／チキン：1／インフィニット：0
   ・曲の長さ・モードで数字が動かない（読めない難しさを作らない）
   ・TRUCK のレーンの揺れは**既定オフ**（ビート揺れ・ヒット揺れの設定は残す）
   ・既定の棚は「定番」だけ（ウィザードは巻を選んだとき・ALL で見える） */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const modes = read("js/modes.js");
const truck = read("js/truck.js");
const core = read("js/core.js");
const i18n = read("js/i18n.js");

function extractFn(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${marker} がある`);
  const end = source.indexOf("\n}\n", start);
  assert.notEqual(end, -1, `${marker} の閉じかっこがある`);
  return source.slice(start, end + 3);
}

/* 体力ルールだけを取り出して、モードと曲の長さを振って動かす */
const life = (lives, playMode) => {
  const code = [
    modes.slice(modes.indexOf("const LIFE_RULES ="), modes.indexOf("const LIFE_TAGS")),
    extractFn(modes, "function lifeRule("),
  ].join("\n") + "\nthis.lifeRule = lifeRule;";
  const core = { settings: { lives, playMode }, chart: [] };
  const sandbox = { core, Object, Math };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "js/modes.js#life" });
  return sandbox.lifeRule();
};

test("スタンダード：開始 20・上限 30・10 コンボごとに 1 回復", () => {
  const r = life("standard", "truck");
  assert.deepEqual({ ...r }, { start: 20, max: 30, heal: 10 });
});

test("体力の数字はモードで変わらない（TRUCK の 3 はもう無い）", () => {
  for (const mode of ["truck", "orbit", "stage", "catch", "manual", undefined]) {
    assert.deepEqual({ ...life("standard", mode) }, { start: 20, max: 30, heal: 10 }, `standard／${mode}`);
    assert.deepEqual({ ...life("knight", mode) }, { start: 30, max: 30, heal: 0 }, `knight／${mode}`);
  }
});

test("ナイトは 30 からで回復なし。チキンは 1。インフィニットは 0", () => {
  assert.deepEqual({ ...life("knight", "truck") }, { start: 30, max: 30, heal: 0 });
  assert.deepEqual({ ...life("chicken", "truck") }, { start: 1, max: 1, heal: 0 });
  assert.deepEqual({ ...life("none", "truck") }, { start: 0, max: 0, heal: 0 });
});

test("知らない値はスタンダード（保存が壊れても遊べる）", () => {
  assert.deepEqual({ ...life("なにか", "truck") }, { start: 20, max: 30, heal: 10 });
  assert.deepEqual({ ...life(undefined, "truck") }, { start: 20, max: 30, heal: 10 });
});

test("曲の長さで数字が動かない（傾斜を廃止）", () => {
  const rule = extractFn(modes, "function lifeRule(");
  assert.doesNotMatch(rule, /factor/, "ノーツ数で伸ばさない");
  assert.doesNotMatch(rule, /core\.chart/, "曲の長さを見ない");
  assert.doesNotMatch(modes, /MANUAL_LIFE_RULES|ORBIT_LIFE_RULES/, "モード別の表は残さない");
});

test("TRUCK のレーンの揺れは既定オフ（設定は残す）", () => {
  assert.match(truck, /core\.settings\.swayTruck = core\.prefs\.swayTruck === true;/, "既定オフ（オンにした人だけ揺れる）");
  assert.match(truck, /if \(m === "truck"\) return core\.settings\.swayTruck !== false;/, "オンなら揺れる");
  assert.match(truck, /core\.settings\.swayBeat = core\.prefs\.swayBeat !== false;/, "ビート揺れの設定はそのまま");
  assert.match(truck, /core\.settings\.swayHit = core\.prefs\.swayHit !== false;/);
});

test("既定の棚からウィザードを外した（巻で選べば見える）", () => {
  /* ⚖ trk281：5 つ目の段（ウィザード）だけは、既定の棚に戻します */
  assert.match(core, /if \(defaultVol && !inUse && o\.level !== "wizard" && skinCatList\(s\)\.includes\("wizard"\)\) continue;/);
  assert.match(core, /if \(!g \|\| g\.id === "other"\) continue;/, "既定＝定番（other）だけ");
  assert.equal((i18n.match(/skinVolDefault:"定番"/g) || []).length, 1, "巻の名前も「定番」");
  for (const key of ["skinVolDefault", "skinVolUnknown"]) {
    assert.equal((i18n.match(new RegExp(`\\b${key}:`, "g")) || []).length, 4, `${key} は 4 言語`);
  }
});

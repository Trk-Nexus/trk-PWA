// SPDX-License-Identifier: GPL-3.0-or-later
/* ⚖ trk281：段（プリセット）でスキンの棚を絞る・⭐ を先頭へ・揺れを全員オフへ

   見張ること：
   ・段は 5 つ（シンプル／スタンダード／プロ／マスター／ウィザード）で、
     段ごとに既定の棚へ出すカテゴリが決まっている（ご相談 2026-11-03）
   ・シンプル〜プロ＝定番・書体・ダーク・ライト・グラデ／プロ＝＋遊び心／
     マスター＝＋みやすさ・生活／ウィザード＝＋ウィザード（wizard の巻も既定へ戻る）
   ・巻を選んだとき・ALL のときは段で絞らない（選んだものは全部見せる）
   ・⭐ を付けたスキンは棚の先頭（隠さない・並べ方を選んだときはその並びを尊重）
   ・TRUCK の揺れは、一回だけ全員オフへ（印は docs/MIGRATIONS.md に登録） */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const coreSrc = fs.readFileSync(path.join(ROOT, "js/core.js"), "utf8");
const truckSrc = fs.readFileSync(path.join(ROOT, "js/truck.js"), "utf8");
const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const migrations = fs.readFileSync(path.join(ROOT, "docs/MIGRATIONS.md"), "utf8");

/* ---------- 画面なしで data.js ＋ 生成物を読む ---------- */
function loadWorld() {
  const sandbox = {
    console, Math, JSON, Object, Array, String, Number, Set, Map, Date, RegExp, Intl,
    parseInt, parseFloat, isNaN, isFinite,
    TEXT: { ja: {}, en: {}, zh: {}, ko: {} }, tr: () => "",
    document: {
      documentElement: { style: { setProperty() {} } }, getElementById: () => null,
      createElement: () => ({ style: {}, append() {}, addEventListener() {} }),
    },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const f of ["js/data.js", "js/characters/miku.js", "js/skins-wizard.js", "js/skins-volumes.js"]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), sandbox, { filename: f });
  }
  return sandbox.window.Trk.data;
}
const D = loadWorld();
const S = JSON.parse(JSON.stringify(D.SKINS));
const V = JSON.parse(JSON.stringify(D.SKIN_VOLUMES || []));

/* ---------- 棚の判定（core.js の純粋な部分だけ） ---------- */
function extractFn(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${marker} がある`);
  const end = source.indexOf("\n}\n", start);
  assert.notEqual(end, -1, `${marker} の閉じかっこがある`);
  return source.slice(start, end + 3);
}
const tableSrc = coreSrc.slice(coreSrc.indexOf("const SKIN_LEVEL_CATS = {"),
  coreSrc.indexOf("\n};", coreSrc.indexOf("const SKIN_LEVEL_CATS = {")) + 3);
const api = (() => {
  const code = [
    extractFn(coreSrc, "const skinCatList = s =>").replace(/;$/, "") + ";",
    coreSrc.match(/const SKIN_ID_RE = .*;/)[0],
    extractFn(coreSrc, "function cleanSkinIdList("),
    extractFn(coreSrc, "function cleanSkinMap("),
    extractFn(coreSrc, "function skinSearchText("),
    extractFn(coreSrc, "function skinMatchesQuery("),
    tableSrc,
    extractFn(coreSrc, "function skinLevelAllows("),
    extractFn(coreSrc, "function skinShelfEntries("),
  ].join("\n") + "\nthis.api = { skinShelfEntries, SKIN_LEVEL_CATS, skinLevelAllows };";
  const sandbox = { console, Math, JSON, Object, Array, String, Number, Set, Map, Date };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "core.js#level-shelf" });
  return sandbox.api;
})();
const shelf = extra => Array.from(api.skinShelfEntries(S, {
  locale: "ja", fav: [], hidden: [], use: {}, last: {}, volumes: V, ...extra,
}), p => p[0]);

/* ==================== 段の表 ==================== */
test("段の表：5 つの段と、段ごとのカテゴリがご相談どおり", () => {
  const T = api.SKIN_LEVEL_CATS;
  assert.deepEqual(Object.keys(T), ["simple", "standard", "pro", "master", "wizard"]);
  assert.deepEqual(Array.from(T.simple), ["basic", "type", "dark", "light", "grad"]);
  assert.deepEqual(Array.from(T.standard), Array.from(T.simple), "スタンダードは定番の 5 カテゴリ");
  assert.deepEqual(Array.from(T.pro), [...T.standard, "fun"], "プロで遊び心");
  assert.deepEqual(Array.from(T.master), [...T.pro, "access", "life"], "マスターでみやすさ・生活");
  assert.deepEqual(Array.from(T.wizard), [...T.master, "wizard"], "ウィザードでウィザード");
  /* ミクの 4 種は basic に同梱されている（miku というカテゴリは無い） */
  const miku = Object.entries(S).filter(([, s]) => (s.cat || []).includes("basic") && /miku/i.test(s.label && (s.label.ja || "")));
  for (const [id, s] of miku) assert.ok(api.skinLevelAllows(s.cat || ["basic"], "simple"), `${id} はシンプルでも出る`);
  /* 知らない段はスタンダード扱い（保存が壊れても遊べる） */
  assert.deepEqual(Array.from(api.SKIN_LEVEL_CATS[undefined] || T.standard), Array.from(T.standard));
  assert.equal(api.skinLevelAllows(["wizard"], undefined), false, "知らない段では wizard を出さない");
  assert.equal(api.skinLevelAllows([], "simple"), true, "カテゴリが無いスキンは定番扱い");
});

/* ==================== 既定の棚の枚数 ==================== */
test("既定の棚：段が上がるほど増える（44 → 53 → 114）", () => {
  const n = lv => shelf({ level: lv });
  assert.equal(n("simple").length, 44);
  assert.equal(n("standard").length, 44, "スタンダード（既定）");
  assert.equal(n("pro").length, 44, "遊び心は定番の巻には居ない（巻を選べば出る）");
  assert.equal(n("master").length, 53, "みやすさ・生活が加わる");
  assert.equal(n("wizard").length, 114, "ウィザードで 定番＋wizard の巻（差し戻しの 1 種を除く）");
  /* ウィザードは 5 つ目の段でだけ出る */
  assert.equal(n("standard").some(id => (S[id].cat || []).includes("wizard")), false);
  assert.ok(n("wizard").includes("wizard-cli"));
  /* 段の絞りより「いま使っているスキン」が優先（消えたように見せない） */
  assert.ok(shelf({ level: "simple", current: "wizard-cli" }).includes("wizard-cli"));
});

test("巻を選んだとき・ALL のときは、段で絞らない", () => {
  const vol2 = V.find(g => g.id === "vol-02");
  assert.equal(shelf({ level: "simple", vol: "vol-02" }).length, vol2.ids.length);
  assert.equal(shelf({ level: "simple", vol: "all" }).length, Object.keys(S).length);
  /* プロの「遊び心」は、巻を選ぶとちゃんと出る */
  assert.ok(shelf({ level: "pro", vol: "all" }).some(id => (S[id].cat || []).includes("fun")));
});

/* ==================== ⭐ は先頭 ==================== */
test("⭐ を付けたスキンは棚の先頭（隠さない・並べ方を選んだら従う）", () => {
  const fav = ["shadow", "typeMincho"];
  const def = shelf({ level: "master", fav });
  assert.deepEqual(def.slice(0, 2).sort(), fav.slice().sort(), "⭐ が先頭 2 枚");
  assert.equal(def.length, shelf({ level: "master" }).length, "隠さない（枚数は同じ）");
  assert.ok(!shelf({ level: "master" }).slice(0, 2).every(id => fav.includes(id)), "⭐ が無ければ先頭は動かない");
  /* 名前順・よく使う順を選んだら、その並びを尊重する */
  const byName = shelf({ level: "master", fav, sort: "name" });
  const names = byName.map(id => String((S[id].label && (S[id].label.ja || S[id].label.en)) || id));
  assert.deepEqual(names, names.slice().sort((a, b) => a.localeCompare(b, "ja")), "名前順のまま");
  const used = shelf({ level: "master", fav, sort: "used", use: { neon: 9 } });
  assert.equal(used[0], "neon", "よく使う順のまま");
});

/* ==================== 画面の 5 つ目のボタン ==================== */
test("画面：5 つ目のボタンと、core.js の SET_LEVELS がそろっている", () => {
  const buttons = [...indexHtml.matchAll(/data-set-level-btn="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(buttons, ["simple", "standard", "pro", "master", "wizard"]);
  assert.match(indexHtml, /id="setLevelWizard"[^>]*data-i18n="setLevelWizard"/);
  const coreLevels = [...coreSrc.match(/const SET_LEVELS = \[([^\]]*)\]/)[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(coreLevels, buttons);
  const i18n = fs.readFileSync(path.join(ROOT, "js/i18n.js"), "utf8");
  assert.equal((i18n.match(/\bsetLevelWizard:/g) || []).length, 4, "段の名前は 4 言語");
  /* 棚は段を渡している（渡し忘れると、段を上げても増えない） */
  assert.equal((coreSrc.match(/level: settings\.setLevel/g) || []).length, 2, "棚と巻の枚数の 2 か所");
});

/* ==================== 揺れは全員オフへ（一回限り） ==================== */
test("TRUCK の揺れ：一回だけ静かな道へ寄せ、印を登録簿に載せる", () => {
  assert.match(truckSrc, /core\.settings\.swayTruckOff1 !== 1/, "一回限りの印を見る");
  /* 🛣 trk282：オフに固定するのではなく「高速道路（揺れない道）」へ寄せます（あとから本人が選べる） */
  assert.match(truckSrc, /core\.settings\.swayRoad = "highway";/, "保存済みの人も静かな道へ");
  assert.match(truckSrc, /if \(Object\.keys\(core\.prefs \|\| \{\}\)\.length\)/, "保存が空の人は「おまかせ」のまま");
  assert.match(truckSrc, /core\.settings\.swayTruckOff1 = 1;/, "印を立てる（二度と掛からない）");
  assert.match(coreSrc, /swayTruckOff1: prefs\.swayTruckOff1 === 1 \? 1 : 0/, "印は settings の中");
  /* 登録簿：名前・種類・削除予定日・場所がそろっている */
  const row = migrations.split("\n").find(l => l.startsWith("| `swayTruckOff1`"));
  assert.ok(row, "docs/MIGRATIONS.md に 1 行ある");
  assert.match(row, /\| 一回限りの印 \|/);
  assert.match(row, /\| trk281 \|/);
  assert.match(row, /\| 20\d\d-\d\d-\d\d \|/, "削除予定日がある");
  assert.match(row, /js\/truck\.js/);
});

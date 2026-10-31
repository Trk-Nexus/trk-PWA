// SPDX-License-Identifier: GPL-3.0-or-later
/* 🧺 trk229：見た目のスキンが 53 種になったので、棚で「さがす・並べる・⭐・🚫」できるようにする。
 *
 *   利用者の相談：「今の状態では見た目のスキン数を整理する機能は確か作っていなかった筈」
 *   方針：判定と並べ替えは純粋関数（core.js の skinMatchesQuery／skinShelfEntries）にして、
 *         この検査から同じ関数を動かす。保存値は端末の中だけ（新しい保存キーは prefs の中）。
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const coreSrc = read("js/core.js");
const i18nSrc = read("js/i18n.js");
const html = read("index.html");
const css = read("css/style.css");

/* js/data.js の SKINS（+ ミク4種）を、テストと同じ順で読む */
const sandbox = {
  console, Math, Array, Object, Number, String, JSON, Set, Map, Date,
  window: {}, TEXT: { ja:{}, en:{}, zh:{}, ko:{} }, tr: () => "",
  document: { getElementById: () => null },
};
vm.createContext(sandbox);
vm.runInContext(read("js/data.js"), sandbox, { filename: "js/data.js" });
vm.runInContext(read("js/characters/miku.js"), sandbox, { filename: "js/characters/miku.js" });
const SKINS = sandbox.window.Trk.data.SKINS;

function extractFn(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${marker} がある`);
  const end = source.indexOf("\n}", start);
  assert.notEqual(end, -1, `${marker} の閉じかっこがある`);
  return source.slice(start, end + 2);
}
function runIn(code, globals) {
  const s = { ...globals, console };
  vm.createContext(s);
  vm.runInContext(code, s);
  return s;
}

/* core.js から、棚の判定・並べ替え・掃除に使う部分だけを抜き出して動かす */
const catListSrc = extractFn(coreSrc, "const skinCatList = s =>").replace(/;$/, "");
const idRe = coreSrc.match(/const SKIN_ID_RE = .*;/)[0];
const shelfApi = runIn(
  [catListSrc + ";", idRe, extractFn(coreSrc, "function cleanSkinIdList("), extractFn(coreSrc, "function cleanSkinMap("),
   extractFn(coreSrc, "function skinSearchText("), extractFn(coreSrc, "function skinMatchesQuery("),
   extractFn(coreSrc, "function skinShelfEntries(")].join("\n") +
  "\nthis.api = { skinMatchesQuery, skinShelfEntries, cleanSkinIdList, cleanSkinMap };",
  { SKINS }
).api;

/* vm の配列は realm が違うので、こちらの配列へ写してから比べる */
const ids = arr => Array.from(arr, pair => pair[0]);

describe("trk229 スキンの棚の整理：さがす", () => {
  test("空の検索語は、すべてに当たる", () => {
    for (const id of Object.keys(SKINS)) assert.equal(shelfApi.skinMatchesQuery(id, SKINS[id], "  "), true, id);
  });

  test("名前は4言語のどれでも当たる（例：明朝・Mincho・明朝书卷）", () => {
    assert.ok(shelfApi.skinMatchesQuery("typeMincho", SKINS.typeMincho, "明朝"));
    assert.ok(shelfApi.skinMatchesQuery("typeMincho", SKINS.typeMincho, "mincho"));
    assert.ok(shelfApi.skinMatchesQuery("typeMincho", SKINS.typeMincho, "书卷"));
    assert.ok(shelfApi.skinMatchesQuery("typeMincho", SKINS.typeMincho, "명조"));
    assert.equal(shelfApi.skinMatchesQuery("typeMincho", SKINS.typeMincho, "ねこ"), false);
  });

  test("id とカテゴリの言葉でも当たる（dark で暗いスキンが拾える）", () => {
    assert.ok(shelfApi.skinMatchesQuery("typeGothicHeavy", SKINS.typeGothicHeavy, "dark"));
    assert.ok(shelfApi.skinMatchesQuery("typeGothicHeavy", SKINS.typeGothicHeavy, "typego"));
  });

  test("空白で区切った語は、すべて含むものだけ（「type dark」は書体でも明るいものは外れる）", () => {
    assert.ok(shelfApi.skinMatchesQuery("typeKaisho", SKINS.typeKaisho, "type dark"));
    assert.equal(shelfApi.skinMatchesQuery("typeMincho", SKINS.typeMincho, "type dark"), false);
  });
});

describe("trk229 スキンの棚の整理：絞り込みと並べ替え", () => {
  const opt = extra => ({ cat:"all", only:"", query:"", sort:"default", locale:"ja", ...extra, skins:undefined });

  test("カテゴリで絞れる（type は書体の9種）", () => {
    const list = shelfApi.skinShelfEntries(SKINS, { ...opt(), cat:"type" });
    assert.equal(list.length, 9);
    for (const [, s] of list) assert.ok(s.cat.includes("type"));
  });

  test("⭐ は付けたものだけ、🕒 は使った日時があるものだけ", () => {
    const fav = shelfApi.skinShelfEntries(SKINS, { ...opt(), only:"fav", fav:["shadow", "typeMincho"] });
    assert.deepEqual(ids(fav).sort(), ["shadow", "typeMincho"]);
    assert.equal(ids(fav).length, 2);
    const recent = shelfApi.skinShelfEntries(SKINS, { ...opt(), only:"recent", last:{ shadow:1 } });
    assert.deepEqual(ids(recent), ["shadow"]);
  });

  test("🚫 を付けたスキンは、ふだんの棚から消える（「🚫 隠した」を見ているときだけ出る）", () => {
    const hidden = ["typePop", "neon"];
    const normal = shelfApi.skinShelfEntries(SKINS, { ...opt(), hidden });
    assert.equal(ids(normal).some(id => hidden.includes(id)), false);
    assert.equal(normal.length, Object.keys(SKINS).length - hidden.length);
    const onlyHidden = shelfApi.skinShelfEntries(SKINS, { ...opt(), only:"hidden", hidden });
    assert.deepEqual(ids(onlyHidden).sort(), hidden.slice().sort());
  });

  test("並び順：名前順・よく使う順・最近使った順（同数なら名前順）", () => {
    const byName = shelfApi.skinShelfEntries(SKINS, { ...opt(), sort:"name" });
    const names = byName.map(([id, s]) => s.label.ja || s.label.en);
    assert.deepEqual(names, names.slice().sort((a, b) => a.localeCompare(b, "ja")));

    const used = shelfApi.skinShelfEntries(SKINS, { ...opt(), sort:"used", use:{ neon:5, shadow:5, typePop:9 } });
    assert.deepEqual(ids(used).slice(0, 3), ["typePop", ...ids(used).slice(1, 3)]);
    assert.equal(ids(used)[0], "typePop");

    const recent = shelfApi.skinShelfEntries(SKINS, { ...opt(), sort:"recent", last:{ typeMincho:100, neon:200 } });
    assert.deepEqual(ids(recent).slice(0, 2), ["neon", "typeMincho"]);
  });

  test("絞り込みと並べ替えは組み合わせられる", () => {
    const list = shelfApi.skinShelfEntries(SKINS, { ...opt(), cat:"type", only:"fav", sort:"name",
      fav:["typePop", "typeKaisho", "shadow"] });
    assert.deepEqual(ids(list).sort(), ["typeKaisho", "typePop"]);
  });
});

describe("trk229 スキンの棚の整理：保存値の掃除", () => {
  test("おかしな id・重複・多すぎる件数を落とす", () => {
    assert.deepEqual([...shelfApi.cleanSkinIdList(["shadow", "shadow", "a b", 5, null, "x/y", "typeMincho"])],
      ["shadow", "typeMincho"]);
    assert.equal(shelfApi.cleanSkinIdList(Array.from({ length: 500 }, (_, i) => "s" + i)).length, 400);
    assert.deepEqual([...shelfApi.cleanSkinIdList("shadow")], []);
  });

  test("回数の表は、数値だけを残して丸める", () => {
    const m = shelfApi.cleanSkinMap({ shadow: 3.6, neon: -1, bad: "x", "a b": 2, typePop: 1e12 });
    assert.equal(m.shadow, 4);
    assert.equal(Object.prototype.hasOwnProperty.call(m, "neon"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(m, "bad"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(m, "a b"), false);
    assert.equal(m.typePop, 1e9);
  });
});

describe("trk229 スキンの棚の整理：配線", () => {
  const keys = ["skinSearchLabel", "skinSearchHint", "skinSortLabel", "skinSortDefault", "skinSortName",
    "skinSortUsed", "skinSortRecent", "skinOnlyFav", "skinOnlyRecent", "skinOnlyHidden", "skinCountShown",
    "skinNoMatch", "skinManageTitle", "skinManageHint", "skinUsedTimes", "skinNever", "skinFavOn",
    "skinFavOff", "skinHideAction", "skinShowAction"];

  test("20の言葉が4言語にある", () => {
    for (const k of keys) {
      const n = (i18nSrc.match(new RegExp(`\\b${k}:`, "g")) || []).length;
      assert.equal(n, 4, `${k} が4言語そろっていない（${n}）`);
    }
  });

  test("保存の既定値と、工場出荷状態の戻し先がある", () => {
    assert.match(coreSrc, /skinShelfOnly: pick\(prefs\.skinShelfOnly, \["", "fav", "recent", "hidden"\], ""\)/);
    assert.match(coreSrc, /skinSort: pick\(prefs\.skinSort, \["default", "name", "used", "recent"\], "default"\)/);
    for (const k of ["skinFav", "skinHidden"]) assert.match(coreSrc, new RegExp(`${k}: cleanSkinIdList\\(prefs\\.${k}\\)`));
    for (const k of ["skinUse", "skinLast"]) assert.match(coreSrc, new RegExp(`${k}: cleanSkinMap\\(prefs\\.${k}\\)`));
    assert.match(coreSrc, /settings\.skinFav = \[\]; settings\.skinHidden = \[\];/);
    assert.match(coreSrc, /settings\.skinUse = \{\}; settings\.skinLast = \{\};/);
  });

  test("カテゴリの記憶に type がある（書体のチップが選ばれたまま残る）", () => {
    assert.match(coreSrc, /skinShelfCat: pick\(prefs\.skinShelfCat, \["all","basic","type","miku"/);
  });

  test("index.html に さがす・並べる・整理 の欄がある", () => {
    for (const id of ["skinSearch", "skinSort", "skinNoMatch", "skinManage", "skinManageList"]) {
      assert.ok(html.includes(`id="${id}"`), `${id} がない`);
    }
    for (const v of ["default", "name", "used", "recent"]) assert.ok(html.includes(`<option value="${v}"`), v);
  });

  test("棚は、見つからないときに理由を出す（空の格子を出さない）", () => {
    assert.match(coreSrc, /noMatch\.hidden = list\.length > 0/);
    assert.match(css, /#skinGrid:empty\{display:none\}/);
  });

  test("使った回数と日時は、スキンを当てたときだけ数える（起動時の復元では数えない）", () => {
    assert.match(coreSrc, /if \(persist\) \{\s*\n\s*settings\.skinUse\[settings\.skin\]/);
    assert.match(coreSrc, /settings\.skinLast\[settings\.skin\] = Date\.now\(\)/);
  });

  test("棚の件数は、絞り込んだときだけ「表示／全体」になる", () => {
    assert.match(coreSrc, /list\.length === total \? `（\$\{total\}）` : tr\("skinCountShown"/);
  });
});

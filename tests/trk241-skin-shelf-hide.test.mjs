// SPDX-License-Identifier: GPL-3.0-or-later
/* 🧺 trk241：スキンの棚を「要るものだけ見える」形に作り直す。
 *
 *   利用者の相談：「スキンの数を作ると、デフォルトで入っている使わないものに煩わしさを与えてしまう」
 *                  「削除ではなく、一時的にスキン毎に非表示を適用出来る形が良い」
 *   決めたこと（docs/SKIN-SHELF-TRK241-2026-11-01.md）：
 *     ・隠すのはこの端末の設定だけ（スキンそのものは消えない・当てられる）
 *     ・いま使っているスキンは、隠しても棚に残す（当たっているのに消えたように見せない）
 *     ・最後の 1 種は隠せない（棚が空になると「消えた」に見える）
 *     ・整理の一覧にも さがす・絞り込み・まとめて（使っていないものを隠す／全部戻す）
 *   判定は core.js の純粋関数（skinCanHide／skinManageRows／skinBulkPlan／skinShelfEntries）で、
 *   この検査から同じものを動かします。
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
/* vm の値は realm が違うので、こちらの配列へ写してから比べる */
const plain = x => JSON.parse(JSON.stringify(x));
const ids = arr => plain(arr).map(pair => (Array.isArray(pair) ? pair[0] : pair));

const catListSrc = extractFn(coreSrc, "const skinCatList = s =>").replace(/;$/, "");
const idRe = coreSrc.match(/const SKIN_ID_RE = .*;/)[0];
const filters = coreSrc.match(/const SKIN_MANAGE_FILTERS = .*;/)[0];
const api = runIn(
  [catListSrc + ";", idRe, filters,
   extractFn(coreSrc, "function cleanSkinIdList("), extractFn(coreSrc, "function cleanSkinMap("),
   extractFn(coreSrc, "function skinSearchText("), extractFn(coreSrc, "function skinMatchesQuery("),
   extractFn(coreSrc, "function skinShelfEntries("), extractFn(coreSrc, "function skinCanHide("),
   extractFn(coreSrc, "function skinManageRows("), extractFn(coreSrc, "function skinBulkPlan(")].join("\n") +
  "\nthis.api = { skinMatchesQuery, skinShelfEntries, skinCanHide, skinManageRows, skinBulkPlan, SKIN_MANAGE_FILTERS };",
  { SKINS }
).api;

/* 3 種だけの小さな棚（判定の筋を見るため） */
const TINY = {
  a: { label:{ ja:"あ", en:"A" }, ui:{}, game:{} },
  b: { label:{ ja:"い", en:"B" }, ui:{}, game:{} },
  c: { label:{ ja:"う", en:"C" }, ui:{}, game:{} },
};

describe("trk241 隠す／戻すの決まり", () => {
  test("隠していないスキンは隠せる", () => {
    const r = plain(api.skinCanHide(TINY, "a", [], "a"));
    assert.deepEqual(r, { ok:true, reason:"" });
  });

  test("いま使っているスキンも隠せる（棚には使用中の印つきで残るため）", () => {
    assert.equal(plain(api.skinCanHide(TINY, "a", [], "a")).ok, true);
  });

  test("いま使っているスキンを隠しても、棚には残るので断らない", () => {
    assert.equal(plain(api.skinCanHide(TINY, "a", ["b", "c"], "a")).ok, true);
  });

  test("最後の 1 種は隠せない（棚が空にならない）", () => {
    const r = plain(api.skinCanHide(TINY, "a", ["b", "c"], ""));
    assert.deepEqual(r, { ok:false, reason:"last" });
  });

  test("もう隠しているものは「隠す」で断らない（戻す側の操作なので）", () => {
    assert.equal(plain(api.skinCanHide(TINY, "b", ["b"], "a")).ok, true);
  });

  test("知らない id は隠せない", () => {
    assert.equal(plain(api.skinCanHide(TINY, "zzz", [], "a")).ok, false);
  });

  test("本物のスキンでも、最後の 1 種だけは残る（全部隠そうとしても 1 種は見える）", () => {
    const all = Object.keys(SKINS);
    const hidden = all.slice(0, all.length - 1);
    const last = all[all.length - 1];
    assert.equal(plain(api.skinCanHide(SKINS, last, hidden, "")).ok, false);
    /* いま使っているスキンなら、隠しても棚に 1 種は残るので隠せる */
    assert.equal(plain(api.skinCanHide(SKINS, last, hidden, last)).ok, true);
  });
});

describe("trk241 隠したスキンの棚での扱い", () => {
  const base = { cat:"all", only:"", query:"", sort:"default", locale:"ja", fav:[], use:{}, last:{} };

  test("隠したスキンは、ふつうの棚から外れる", () => {
    const list = ids(api.skinShelfEntries(TINY, { ...base, hidden:["b"] }));
    assert.deepEqual(list, ["a", "c"]);
  });

  test("いま使っているスキンは、隠しても棚に残る（消えたように見せない）", () => {
    const list = ids(api.skinShelfEntries(TINY, { ...base, hidden:["b"], current:"b" }));
    assert.deepEqual(list, ["a", "b", "c"]);
  });

  test("「🚫 隠した」を見ているときは、隠したものだけが出る", () => {
    const list = ids(api.skinShelfEntries(TINY, { ...base, hidden:["b", "c"], only:"hidden" }));
    assert.deepEqual(list, ["b", "c"]);
  });

  test("隠したものは、当てることもできる（スキンを外してはいない）", () => {
    /* 棚の判定と当てる処理は別。判定側で「隠した＝使えない」にしていないことを確かめる */
    assert.ok(!/skinHidden[\s\S]{0,200}applySkin/.test(coreSrc), "隠す設定が当てる処理を止めていない");
    assert.ok(coreSrc.includes("if (has(window.Trk.data.SKINS, id) && window.Trk.data.SKINS[id].locked"), "当てる処理はそのまま");
  });
});

describe("trk241 整理の一覧（さがす・絞る）", () => {
  const opt = { locale:"ja", fav:["a"], hidden:["c"], use:{ a:2 } };

  test("すべて：名前順に並ぶ", () => {
    assert.deepEqual(plain(api.skinManageRows(TINY, { ...opt, filter:"all" })), ["a", "b", "c"]);
  });

  test("⭐ だけ・🚫 だけ・まだ使っていない、で絞れる", () => {
    assert.deepEqual(plain(api.skinManageRows(TINY, { ...opt, filter:"fav" })), ["a"]);
    assert.deepEqual(plain(api.skinManageRows(TINY, { ...opt, filter:"hidden" })), ["c"]);
    assert.deepEqual(plain(api.skinManageRows(TINY, { ...opt, filter:"unused" })), ["b", "c"]);
  });

  test("絞り込みと検索は重ねられる", () => {
    assert.deepEqual(plain(api.skinManageRows(TINY, { ...opt, filter:"unused", query:"う" })), ["c"]);
    assert.deepEqual(plain(api.skinManageRows(TINY, { ...opt, filter:"fav", query:"う" })), []);
  });

  test("知らない絞り込みは「すべて」に倒す（保存値が壊れても空にならない）", () => {
    assert.deepEqual(plain(api.skinManageRows(TINY, { ...opt, filter:"nope" })), ["a", "b", "c"]);
  });

  test("本物のスキンでも、🚫 の数と一覧の数が合う", () => {
    const hidden = Object.keys(SKINS).slice(0, 3);
    const rows = plain(api.skinManageRows(SKINS, { locale:"ja", hidden, filter:"hidden" }));
    assert.deepEqual(rows.sort(), hidden.slice().sort());
  });
});

describe("trk241 まとめて隠す／戻す", () => {
  test("使っていないものだけを隠す（いま使っている・⭐・もう隠したものは除く）", () => {
    const plan = plain(api.skinBulkPlan(TINY, { mode:"unused", hidden:["c"], fav:["b"], use:{ a:1 }, current:"a" }));
    assert.deepEqual(plan.ids, []);
    const plan2 = plain(api.skinBulkPlan(SKINS, { mode:"unused", hidden:[], fav:["typeMincho"], use:{ shadow:3 }, current:"shadow" }));
    assert.ok(plan2.ids.length > 0, "使っていないスキンは見つかる");
    assert.ok(!plan2.ids.includes("shadow"), "いま使っているスキンは入らない");
    assert.ok(!plan2.ids.includes("typeMincho"), "⭐ は入らない");
  });

  test("隠したあとに棚が空にならない（最後の 1 種は残す）", () => {
    const plan = plain(api.skinBulkPlan(TINY, { mode:"unused", hidden:[], fav:[], use:{}, current:null }));
    assert.ok(plan.ids.length <= 2, `隠すのは ${plan.ids.length} 種まで`);
    assert.ok(3 - plan.ids.length >= 1, "1 種以上は棚に残る");
  });

  test("戻す：隠しているものを全部返す", () => {
    const plan = plain(api.skinBulkPlan(TINY, { mode:"restore", hidden:["a", "c"] }));
    assert.deepEqual(plan.ids, ["a", "c"]);
  });

  test("戻すものが無ければ空（ボタンを押しても何も起きない）", () => {
    assert.deepEqual(plain(api.skinBulkPlan(TINY, { mode:"restore", hidden:[] })).ids, []);
  });

  test("本物のスキンで「使っていないものを隠す」→「全部戻す」で元に戻る", () => {
    const plan = plain(api.skinBulkPlan(SKINS, { mode:"unused", hidden:[], fav:[], use:{}, current:"shadow" }));
    const hidden = plan.ids.slice();
    const back = plain(api.skinBulkPlan(SKINS, { mode:"restore", hidden }));
    assert.deepEqual(back.ids.sort(), hidden.sort());
  });
});

describe("trk241 画面と保存", () => {
  test("棚の下に「隠している数と戻す」がある", () => {
    assert.match(html, /id="skinHiddenNote"/);
    assert.match(html, /id="skinHiddenNoteText"/);
    assert.match(html, /id="skinHiddenRestore"/);
  });

  test("整理の一覧に さがす・絞り込み・まとめて がある", () => {
    for (const id of ["skinManageSearch", "skinManageFilter", "skinManageHideUnused", "skinManageRestoreAll", "skinManageCount", "skinManageNothing"])
      assert.ok(html.includes(`id="${id}"`), id);
    for (const v of ["all", "fav", "hidden", "unused"]) assert.match(html, new RegExp(`<option value="${v}"`), v);
  });

  test("カードの上から ⭐／🚫 を押せる（当てるのとは別のボタン）", () => {
    assert.match(coreSrc, /const quick = el\("div", "skinQuick"\)/);
    assert.match(coreSrc, /qFav\.addEventListener\("click", \(\) => toggleSkinList\("skinFav", id\)\)/);
    assert.match(coreSrc, /qHide\.addEventListener\("click"/);
    assert.match(css, /\.skinQuickBtn\{/);
  });

  test("新しく保存するキーは無い（skinHidden は trk229 からのもの）", () => {
    assert.match(coreSrc, /skinHidden: cleanSkinIdList\(prefs\.skinHidden\)/);
    assert.ok(!/skinManageQuery:\s*|skinManageFilter:\s*settings/.test(coreSrc), "整理の検索語と絞り込みは保存しない");
  });

  test("隠したままでも、スキンを当てる処理は変わらない", () => {
    const apply = coreSrc.slice(coreSrc.indexOf("function applySkin("), coreSrc.indexOf("function applySkin(") + 900);
    assert.ok(!apply.includes("skinHidden"), "当てる処理は隠す設定を見ない");
  });

  test("4 言語ぶんの文言がある（数を添える・隠した数の案内・最後の 1 種）", () => {
    for (const key of ["skinOnlyFavN", "skinOnlyHiddenN", "skinHiddenNote", "skinHiddenRestore", "skinCantHideLast",
                       "skinInUseMark", "skinManageFilterLabel", "skinManageHideUnused", "skinManageRestoreAll",
                       "skinManageCount", "skinBulkNone", "skinHiddenDone", "skinRestoredDone"]) {
      const n = (i18nSrc.match(new RegExp(`\\b${key}:`, "g")) || []).length;
      assert.equal(n, 4, `${key} は 4 言語`);
    }
  });

  test("案内の文は「消えない」ことを言っている（削除と誤解されない）", () => {
    assert.match(i18nSrc, /skinHiddenNote:"🚫 隠しているスキンが \{n\} 種あります（スキンは消えていません）。"/);
    assert.match(i18nSrc, /🚫 hides it from the shelf \(restore it here; the skin itself is not deleted\)/);
  });
});

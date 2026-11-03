// SPDX-License-Identifier: GPL-3.0-or-later
/* ⌨ trk276：📚 をキーで動かす（アサイン・使わない・縦読み）

   見張ること：
   ・4 方向が「見た目の格子」に沿って動く（幅で列数が変わっても壊れない）
   ・縦書きでは ↓ が「次」、列の端は次の列の先頭へ
   ・端では止まる（回り込まない）
   ・キーは 4 つとも別々にアサインでき、重なったら入れ替える
   ・「使わない」にすると、キーでは動かない
   ・選ばれている 1 枚だけ Tab で止まる（roving tabindex） */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const html = read("index.html");
const css = read("css/style.css");
const core = read("js/core.js");
const i18n = read("js/i18n.js");
const sw = read("sw.js");

function extractFn(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${marker} がある`);
  const end = source.indexOf("\n}\n", start);
  assert.notEqual(end, -1, `${marker} の閉じかっこがある`);
  return source.slice(start, end + 3);
}
const api = (() => {
  const code = [
    extractFn(core, "function volLayout("),
    extractFn(core, "function volMove("),
  ].join("\n") + "\nthis.api = { volLayout, volMove };";
  const sandbox = { console, Math, JSON, Object, Array, String, Number, Set, Map };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "core.js#volkeys" });
  return sandbox.api;
})();

/* 格子を作る（列数 × 行数。最後の行は少なくてもよい） */
const grid = (cols, rows, lastRow) => {
  const out = [];
  for (let r = 0; r < rows; r++) {
    const n = r === rows - 1 && lastRow !== undefined ? lastRow : cols;
    for (let c = 0; c < n; c++) out.push({ left: c * 160, top: r * 60 });
  }
  return out;
};

test("格子の読み方：行と列を、見た目から数える（幅で列数が変わっても同じ）", () => {
  const six = api.volLayout(grid(3, 2));
  assert.equal(six.rows.length, 2);
  assert.equal(six.cols, 3);
  assert.deepEqual([...six.byRow], [0, 1, 2, 3, 4, 5]);
  /* 縦書きの読み順＝列ごと（上から下、次の列へ） */
  assert.deepEqual([...six.byCol], [0, 3, 1, 4, 2, 5]);
  const two = api.volLayout(grid(2, 3, 1));
  assert.equal(two.rows.length, 3);
  assert.equal(two.cols, 2);
});

test("横書き：← → が読み順、↑ ↓ は同じ列の前後の行", () => {
  const g = grid(3, 2), move = (i, m) => api.volMove(g, i, m, "row");
  assert.equal(move(0, "right"), 1);
  assert.equal(move(2, "right"), 3, "行の端は次の行の先頭へ");
  assert.equal(move(3, "left"), 2, "行の先頭は前の行の末尾へ");
  assert.equal(move(0, "down"), 3, "同じ列の次の行");
  assert.equal(move(4, "up"), 1);
  assert.equal(move(0, "up"), -1, "端では止まる");
  assert.equal(move(4, "down"), -1, "端では止まる");
  /* 最後の行が少ないとき（390px の 2 列で 5 枚） */
  const g2 = grid(2, 3, 1), m2 = (i, m) => api.volMove(g2, i, m, "row");
  assert.equal(m2(3, "down"), 4, "下の行に 1 枚しかなくても、そこへ");
  assert.equal(m2(4, "down"), -1);
  assert.equal(m2(3, "right"), 4);
});

test("縦書き：↓ が「次」、列の端は次の列の先頭へ（縦読みの人）", () => {
  const g = grid(3, 2), move = (i, m) => api.volMove(g, i, m, "col");
  assert.equal(move(0, "down"), 3, "↓ が次（同じ列の下）");
  assert.equal(move(3, "down"), 1, "列の端は次の列の先頭へ");
  assert.equal(move(1, "up"), 3, "列の先頭は前の列の末尾へ");
  assert.equal(move(0, "up"), -1, "端では止まる");
  assert.equal(move(4, "left"), 3, "← は同じ行の前の列");
  assert.equal(move(4, "right"), 5, "→ は同じ行の次の列");
  assert.equal(move(5, "right"), -1, "端では止まる（動かない）");
});

test("フォーカスが無い・空のときも壊れない", () => {
  assert.equal(api.volMove([], 0, "right", "row"), -1);
  assert.equal(api.volMove(grid(2, 2), -1, "right", "row"), 0);
  assert.equal(api.volMove(grid(1, 1), 0, "down", "row"), -1);
});

/* ==================== 設定 ==================== */
test("設定：使わない・読み方向・4 つのキー（新しい保存キーは増やさない）", () => {
  assert.match(core, /skinVolNav: prefs\.skinVolNav === "off" \? "off" : "on"/);
  assert.match(core, /skinVolDir: prefs\.skinVolDir === "col" \? "col" : "row"/);
  assert.match(core, /\.\.\.volKeyBoot\(prefs\)/);
  assert.match(core, /const VOL_KEY_DEFAULTS = \{ L: "ArrowLeft", R: "ArrowRight", U: "ArrowUp", D: "ArrowDown" \};/);
  /* 工場出荷でも戻る */
  assert.match(core, /settings\.skinVolNav = "on"; settings\.skinVolDir = "row";/);
  assert.doesNotMatch(core, /localStorage\.setItem\("skinVolKey/, "キーは settings の中（新しい保存キーを作らない）");
});

test("4 つのキーは重ならない（重なっていたら既定へ戻す）", () => {
  const defaults = core.match(/const VOL_KEY_DEFAULTS = \{.*?\};/)[0];
  const code = defaults + "\n" + extractFn(core, "function volKeyBoot(") + "\nthis.api = { volKeyBoot };";
  const sandbox = { validCode: k => typeof k === "string" && /^[A-Za-z0-9]{1,24}$/.test(k) };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "core.js#boot" });
  const ok = sandbox.api.volKeyBoot({ skinVolKeyL: "KeyJ", skinVolKeyR: "KeyK", skinVolKeyU: "ArrowUp", skinVolKeyD: "ArrowDown" });
  assert.deepEqual({ ...ok }, { skinVolKeyL: "KeyJ", skinVolKeyR: "KeyK", skinVolKeyU: "ArrowUp", skinVolKeyD: "ArrowDown" });
  const dup = sandbox.api.volKeyBoot({ skinVolKeyL: "KeyJ", skinVolKeyR: "KeyJ", skinVolKeyU: "", skinVolKeyD: null });
  assert.equal(new Set(Object.values(dup)).size, 4, "4 つとも別のキー");
  const none = sandbox.api.volKeyBoot(null);
  assert.deepEqual({ ...none }, { skinVolKeyL: "ArrowLeft", skinVolKeyR: "ArrowRight", skinVolKeyU: "ArrowUp", skinVolKeyD: "ArrowDown" });
});

test("アサイン：重なったら入れ替える・Esc は取り消し", () => {
  assert.match(core, /function setSkinVolKey\(kind, code\)/);
  assert.match(core, /if \(name !== key && settings\[name\] === code\) settings\[name\] = old;/);
  assert.match(core, /if \(e\.key === "Escape"\) \{ volKeyListening = ""; renderSkinVolKeys\(\); return; \}/);
  /* 設定を閉じる Esc（M1 の分岐）より先に受け取る＝capture で待つ */
  assert.match(core, /\}, true\);\n  renderSkinVolKeys\(\);/);
});

/* ==================== 動かす ==================== */
test("矢印：フォーカスだけ動かす（決めるのは Enter／Space＝button の標準）", () => {
  const kd = core.slice(core.indexOf('list.addEventListener("keydown"'), core.indexOf('list.addEventListener("focusin"'));
  assert.match(kd, /if \(settings\.skinVolNav === "off"\) return;/, "使わないときは動かない");
  assert.match(kd, /const from = cards\.indexOf\(document\.activeElement\);/);
  assert.match(kd, /cards\[to\]\.focus\(\);/, "フォーカスを移すだけ");
  assert.doesNotMatch(kd, /setSkinVol\(/, "矢印では決めない（棚を作り直さない）");
  assert.match(kd, /if \(to < 0\) \{ e\.preventDefault\(\); return; \}/, "端では止まる");
  assert.match(kd, /e\.preventDefault\(\);\s*\n\s*cards\.forEach/, "ページのスクロールを止める");
});

test("roving tabindex：選ばれている 1 枚だけ Tab で止まる", () => {
  assert.match(core, /b\.tabIndex = \(settings\.skinShelfVol \|\| ""\) === value \? 0 : -1;/);
  assert.match(core, /if \(!list\.querySelector\('\[role="radio"\]\[tabindex="0"\]'\)\)/);
  assert.match(core, /cards\.forEach\(\(c, k\) => \{ c\.tabIndex = k === i \? 0 : -1; \}\);/);
});

test("読み方向の切替と入切のボタンが配線されている", () => {
  assert.match(core, /document\.querySelectorAll\("\[data-volnav\]"\)\.forEach\(b => b\.addEventListener\("click"/);
  assert.match(core, /document\.querySelectorAll\("\[data-voldir\]"\)\.forEach\(b => b\.addEventListener\("click"/);
  assert.match(core, /document\.querySelectorAll\("\[data-volkey\]"\)\.forEach\(b => b\.addEventListener\("click"/);
  assert.match(core, /wireSkinVolKeys\(\);/);
});

/* ==================== 画面 ==================== */
test("📚 のパネルに、キーの入口（入切・読み方向・4 つ）がある", () => {
  const box = html.slice(html.indexOf('id="skinVolKeyBox"'), html.indexOf('id="skinVolKeyBox"') + 2400);
  assert.match(box, /data-volnav="on"/);
  assert.match(box, /data-volnav="off"/);
  assert.match(box, /data-voldir="row"/);
  assert.match(box, /data-voldir="col"/);
  for (const k of ["L", "R", "U", "D"]) assert.match(box, new RegExp(`data-volkey="${k}"`), `${k} のボタン`);
  assert.match(box, /data-i18n-aria="skinVolKeyLeft"/, "読み上げ名がある");
  assert.match(css, /\.volKeyPad\{display:flex;/);
  assert.match(css, /\.volKey\.listening\{border-color:var\(--ui-accent\)/);
});

test("4 言語のキーがそろう（11 キー×4）", () => {
  for (const k of ["skinVolKeysTitle", "skinVolKeysOn", "skinVolKeysOff", "skinVolDirTitle", "skinVolDirRowLabel", "skinVolDirColLabel",
    "skinVolWrapTitle", "skinVolWrapStop", "skinVolWrapLoop",
    "skinVolKeysHint", "skinVolKeysListening", "skinVolKeyLeft", "skinVolKeyRight", "skinVolKeyUp", "skinVolKeyDown"]) {
    assert.equal((i18n.match(new RegExp("\\b" + k + ":", "g")) || []).length, 4, `${k} は 4 言語`);
  }
});

test("版とキャッシュ：版名は sw.js と index.html で揃っている", () => {
  const v = (sw.match(/const CACHE = "trk-v[\d.]+-(trk\d+)";/) || [])[1];
  assert.match(html, new RegExp(`<meta name="trk-build" content="${v}">`));
});

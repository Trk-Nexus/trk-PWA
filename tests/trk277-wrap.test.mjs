// SPDX-License-Identifier: GPL-3.0-or-later
/* 🔁 trk277：📚 の「端から反対側へ回り込む」を設定に足す

   見張ること：
   ・回り込みは**設定**（既定は端で止まる）。読み方向（横書き・縦書き）どちらでも効く
   ・4 方向すべてで、端の次は反対側の端へ（同じ所に留まらない）
   ・最後の行が少ないときも壊れない
   ・言葉は「端で止まる」「反対側へ回り込む」（伝わる言い方） */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const html = read("index.html");
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
  const code = [extractFn(core, "function volLayout("), extractFn(core, "function volMove(")].join("\n") +
    "\nthis.api = { volLayout, volMove };";
  const sandbox = { console, Math, JSON, Object, Array, String, Number, Set, Map };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "core.js#wrap" });
  return sandbox.api;
})();
const grid = (cols, rows, lastRow) => {
  const out = [];
  for (let r = 0; r < rows; r++) {
    const n = r === rows - 1 && lastRow !== undefined ? lastRow : cols;
    for (let c = 0; c < n; c++) out.push({ left: c * 160, top: r * 60 });
  }
  return out;
};

test("横書き：回り込みで、端の次は反対側の端へ", () => {
  const g = grid(3, 2), move = (i, m) => api.volMove(g, i, m, "row", true);
  assert.equal(move(0, "left"), 5, "いちばん左の前は、いちばん右");
  assert.equal(move(5, "right"), 0, "いちばん右の次は、いちばん左");
  assert.equal(move(0, "up"), 3, "上の行の前は、下の行の同じ列");
  assert.equal(move(3, "up"), 0, "いちばん上の前は、いちばん下");
  assert.equal(move(4, "down"), 1, "いちばん下の次は、いちばん上");
  /* 止まる設定（既定）では動かない */
  assert.equal(api.volMove(g, 0, "left", "row", false), -1);
  assert.equal(api.volMove(g, 5, "right", "row", false), -1);
});

test("縦書き：回り込みでも ↓ が「次」のまま、列の端は反対側へ", () => {
  const g = grid(3, 2), move = (i, m) => api.volMove(g, i, m, "col", true);
  assert.equal(move(5, "down"), 0, "いちばん下（最後の列の末尾）の次は、最初の列の先頭");
  assert.equal(move(0, "up"), 5);
  assert.equal(move(0, "left"), 2, "いちばん左の前は、いちばん右の列");
  assert.equal(move(2, "right"), 0, "いちばん右の次は、いちばん左の列");
  assert.equal(move(3, "right"), 4, "同じ行の次の列");
});

test("最後の行が少ないとき（390px の 2 列で 5 枚）も回り込める", () => {
  const g = grid(2, 3, 1), move = (i, m, w = true) => api.volMove(g, i, m, "row", w);
  assert.equal(move(4, "down"), 0, "いちばん下の次は、いちばん上");
  assert.equal(move(0, "up"), 4, "いちばん上の前は、いちばん下");
  assert.equal(move(3, "right"), 4, "行の端は次の行の先頭（読み順）");
  assert.equal(move(4, "right"), 0, "最後の次は、最初へ");
  assert.equal(move(0, "left"), 4);
});

test("設定：既定は「端で止まる」・工場出荷で戻る・新しい保存キーは増やさない", () => {
  assert.match(core, /skinVolWrap: prefs\.skinVolWrap === "chain" \? "chain"/);
  assert.match(core, /\? "wrap" : "stop"/, "端で止まるが既定");
  assert.match(core, /settings\.skinVolNav = "on"; settings\.skinVolDir = "row"; settings\.skinVolWrap = "stop";/);
  assert.match(core, /function setSkinVolWrap\(mode\) \{/);
  assert.match(core, /document\.querySelectorAll\("\[data-volwrap\]"\)\.forEach\(b => b\.addEventListener\("click"/);
  assert.match(core, /settings\.skinVolWrap === "wrap"|volMove\(rects, from, move, dir, true\)/, "回り込む設定を見ている");
  assert.doesNotMatch(core, /localStorage\.setItem\("skinVolWrap/, "settings の中（新しい保存キーを作らない）");
});

test("📚 のパネルに、言葉つきで並んでいる（読み方向 → 端の動き）", () => {
  const box = html.slice(html.indexOf('id="skinVolKeyBox"'), html.indexOf('id="skinVolKeyBox"') + 2400);
  const dir = box.indexOf('data-i18n="skinVolDirTitle"');
  const dirBtn = box.indexOf('data-voldir="row"');
  const wrap = box.indexOf('data-i18n="skinVolWrapTitle"');
  const wrapBtn = box.indexOf('data-volwrap="stop"');
  assert.ok(dir >= 0 && dir < dirBtn, "「読み方向」の見出しが、選択より前にある");
  assert.ok(wrap > dirBtn && wrap < wrapBtn, "「端まで行ったとき」の見出しが、選択より前にある");
  assert.match(box, /data-volwrap="stop"/);
  assert.match(box, /data-volwrap="wrap"/);
  assert.match(box, /data-volwrap="chain"/);
  /* 言葉は言い換えずに、そのまま伝わる形で */
  assert.match(i18n, /skinVolWrapStop:"端で止まる"/);
  assert.match(i18n, /skinVolWrapLoop:"反対側へ回り込む"/);
  assert.match(i18n, /skinVolDirTitle:"読み方向（どちらの向きに読み進めますか）"/);
  assert.match(i18n, /skinVolWrapTitle:"端まで行ったとき"/);
});

test("4 言語のキーがそろう（5 キー×4）", () => {
  for (const k of ["skinVolDirTitle", "skinVolWrapTitle", "skinVolWrapStop", "skinVolWrapLoop", "skinVolWrapChain"]) {
    assert.equal((i18n.match(new RegExp("\\b" + k + ":", "g")) || []).length, 4, `${k} は 4 言語`);
  }
  assert.equal((i18n.match(/\bskinVolKeysHint:/g) || []).length, 4, "説明文も 4 言語（重複なし）");
});

test("版とキャッシュ：版名は sw.js と index.html で揃っている", () => {
  const v = (sw.match(/const CACHE = "trk-v[\d.]+-(trk\d+)";/) || [])[1];
  assert.match(html, new RegExp(`<meta name="trk-build" content="${v}">`));
});

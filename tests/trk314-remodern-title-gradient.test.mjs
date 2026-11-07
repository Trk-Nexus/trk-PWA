// SPDX-License-Identifier: GPL-3.0-or-later
/* trk314：題字の背景の判定（グラデーションの停止点・間の色まで見る）。
   見張ること：
   ・画像（url）・判定できない関数・mix-blend／filter／backdrop／透明度は、当てない（null）
   ・グラデーションの停止点を候補にし、どれか一つでも対比が 4.5:1 に届かなければ当てない
   ・停止点の間の色（白と黒の間の灰色など）も見る
   ・候補が多すぎるときは判定しない（null） */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");

// 偽の DOM：要素の連鎖（parentElement）と、computed style の値だけを持つ
function node(cs, parent = null) {
  return { nodeType: 1, parentElement: parent, cs: { backgroundColor: "rgba(0, 0, 0, 0)", backgroundImage: "none", opacity: "1", mixBlendMode: "normal", filter: "none", backdropFilter: "none", ...cs } };
}
function load(el) {
  const ctx = { getComputedStyle: n => n.cs };
  vm.createContext(ctx);
  vm.runInContext(read("js/remodern-paint.js"), ctx);
  return { P: ctx.TrkReModernPaint, el };
}
const WORK = { colors: { text: "#444444", accent: "#ffffff" } };
// vm の中で作られた配列・オブジェクトは別の実行環境のもの。比べるときは素の値にする
const plain = x => JSON.parse(JSON.stringify(x));

test("単色の背景：候補は一つ、対比が足りる色は当たる", () => {
  const { P, el } = load(node({ backgroundColor: "rgb(255, 255, 255)" }));
  assert.deepEqual(plain(P.effectiveBgs(el)), [[255, 255, 255]]);
  const paint = P.titlePaint({ colors: { text: "#767676", accent: "#000000" } }, P.effectiveBgs(el));
  assert.equal(paint.text, "#767676");
  assert.equal(paint.accent, "#000000");
});

test("画像（url）があれば判定しない（null）", () => {
  const { P, el } = load(node({ backgroundColor: "rgb(0, 0, 0)", backgroundImage: "url(\"x.png\")" }));
  assert.equal(P.effectiveBgs(el), null);
  assert.deepEqual(plain(P.titlePaint(WORK, null)), { text: null, accent: null, skipped: [] });
});

test("判定できない関数・重ね方・filter・透明度があれば null", () => {
  const img = load(node({ backgroundColor: "rgb(0, 0, 0)", backgroundImage: "image-set(\"a\" 1x)" }));
  assert.equal(img.P.effectiveBgs(img.el), null);
  const blend = load(node({ backgroundColor: "rgb(0, 0, 0)", mixBlendMode: "multiply" }));
  assert.equal(blend.P.effectiveBgs(blend.el), null);
  const filt = load(node({ backgroundColor: "rgb(0, 0, 0)", filter: "blur(2px)" }));
  assert.equal(filt.P.effectiveBgs(filt.el), null);
  const op = load(node({ backgroundColor: "rgb(0, 0, 0)", opacity: "0.5" }));
  assert.equal(op.P.effectiveBgs(op.el), null);
});

test("祖先の層を外側から重ねる（半透明の赤を黒の上に）", () => {
  const root = node({ backgroundColor: "rgb(0, 0, 0)" });
  const mid = node({ backgroundColor: "rgba(255, 0, 0, 0.5)" }, root);
  const { P, el } = load(node({}, mid));
  const list = P.effectiveBgs(el);
  assert.equal(list.length, 1);
  assert.ok(Math.abs(list[0][0] - 127.5) <= 1 && list[0][1] === 0 && list[0][2] === 0);
});

test("グラデーションの停止点を候補にする：暗い停止点があれば、その色で測る", () => {
  // 白の上に、黒の停止点を持つグラデーション → 候補に黒が入る → #444 は当たらない
  const { P, el } = load(node({ backgroundColor: "rgb(255, 255, 255)", backgroundImage: "radial-gradient(at 50% 50%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0) 62%)" }));
  const list = P.effectiveBgs(el);
  assert.ok(list.length >= 2);
  assert.ok(list.some(c => c[0] === 0 && c[1] === 0 && c[2] === 0));
  assert.equal(P.titlePaint(WORK, list).text, null);
  assert.deepEqual(plain(P.titlePaint(WORK, list).skipped), ["text", "accent"]);
});

test("停止点の間の色も見る：白と黒の両端では通る #767676 も、中間の灰で落ちる", () => {
  const P = load(node({})).P;
  const paint = P.titlePaint({ colors: { text: "#767676", accent: "#767676" } }, [[255, 255, 255], [0, 0, 0]]);
  assert.equal(paint.text, null);
  assert.equal(paint.accent, null);
  // 端だけなら通ってしまうことを確かめる（間の色の検査が効いている証拠）
  assert.ok(P.ratio([118, 118, 118], [255, 255, 255]) >= 4.5);
  assert.ok(P.ratio([118, 118, 118], [0, 0, 0]) >= 4.5);
});

test("候補が多すぎるときは判定しない（null）", () => {
  let el = node({ backgroundColor: "rgb(0, 0, 0)" });
  const stops = Array.from({ length: 8 }, (_, i) => `rgba(${(i * 37) % 256}, ${(i * 91) % 256}, ${(i * 151) % 256}, 0.5)`).join(", ");
  for (let i = 0; i < 3; i++) el = node({ backgroundImage: `linear-gradient(${stops})` }, el);
  const { P } = load(el);
  assert.equal(P.effectiveBgs(el), null);
});

test("titlePaint は単色（[r,g,b]）も候補の配列も受け付ける", () => {
  const P = load(node({})).P;
  assert.equal(P.titlePaint({ colors: { text: "#000000" } }, [255, 255, 255]).text, "#000000");
  assert.equal(P.titlePaint({ colors: { text: "#000000" } }, [[255, 255, 255]]).text, "#000000");
});

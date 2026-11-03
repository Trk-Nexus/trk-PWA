// SPDX-License-Identifier: GPL-3.0-or-later
/* 📖 trk278：端の次を「次の本（巻）」へつなぐ連読 ＋ 回り込んだときの一言

   見張ること：
   ・「端まで行ったとき」は 3 つ（端で止まる／反対側へ回り込む／次の本へ続ける）
   ・連読は**読み軸の向きだけ**（横書き＝← →、縦書き＝↑ ↓）で、次の本の先頭／末尾へ
   ・端は反対側へつなぐ（最後の本の次は最初の本）・本が決まらない既定／ALL では回り込みへ
   ・回り込んだら「先頭に戻りました」「末尾に戻りました」と言う
   ・連読のときは**パネルを閉じない**（続けて読める） */
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
  const code = extractFn(core, "function volChainTarget(") + "\nthis.api = { volChainTarget };";
  const sandbox = { console, Math, JSON, Object, Array, String, Number, Set, Map };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "core.js#chain" });
  return sandbox.api;
})();

const BOOKS = ["vol-01", "vol-02", "vol-03", "glitch", "wizard", "other"];

test("連読：次の本へ（端は反対側へつなぐ）", () => {
  assert.equal(api.volChainTarget(BOOKS, "vol-01", true), "vol-02");
  assert.equal(api.volChainTarget(BOOKS, "vol-03", true), "glitch");
  assert.equal(api.volChainTarget(BOOKS, "other", true), "vol-01", "最後の本の次は最初の本");
  assert.equal(api.volChainTarget(BOOKS, "vol-01", false), "other", "最初の本の前は最後の本");
  assert.equal(api.volChainTarget(BOOKS, "wizard", false), "glitch");
});

test("連読：本が決まらないとき（既定・ALL・知らない名前）は移らない", () => {
  assert.equal(api.volChainTarget(BOOKS, "", true), "", "定番＋ウィザードは「本」ではない");
  assert.equal(api.volChainTarget(BOOKS, "all", true), "");
  assert.equal(api.volChainTarget(BOOKS, "vol-99", true), "");
  assert.equal(api.volChainTarget([], "vol-01", true), "");
  assert.equal(api.volChainTarget(null, "vol-01", true), "");
});

test("設定：3 つ（stop／wrap／chain）・既定は stop・工場出荷で戻る", () => {
  assert.match(core, /const SKIN_VOL_WRAP_IDS = \["stop", "wrap", "chain"\];/);
  assert.match(core, /function setSkinVolWrap\(mode\) \{/);
  assert.match(core, /settings\.skinVolWrap = pick\(mode, SKIN_VOL_WRAP_IDS, "stop"\);/);
  assert.match(core, /settings\.skinVolNav = "on"; settings\.skinVolDir = "row"; settings\.skinVolWrap = "stop";/);
  /* 前の版の "on" も「回り込む」として読む（保存の互換） */
  assert.match(core, /prefs\.skinVolWrap === "wrap" \|\| prefs\.skinVolWrap === "on"/);
});

test("📚 のパネルに 3 つの選択肢がある", () => {
  const box = html.slice(html.indexOf('id="skinVolWrapRow"'), html.indexOf('id="skinVolWrapRow"') + 700);
  assert.match(box, /data-volwrap="stop"/);
  assert.match(box, /data-volwrap="wrap"/);
  assert.match(box, /data-volwrap="chain"/);
  assert.match(box, /data-i18n="skinVolWrapStop"/);
  assert.match(box, /data-i18n="skinVolWrapLoop"/);
  assert.match(box, /data-i18n="skinVolWrapChain"/);
  assert.match(i18n, /skinVolWrapChain:"次の本へ続ける"/);
});

test("連読は読み軸の向きだけ・パネルは閉じない・次の本の先頭／末尾へ", () => {
  const step = extractFn(core, "function volChainStep(");
  assert.match(step, /selectSkinVol\(target\);/, "巻を切り替える（パネルは閉じない）");
  assert.doesNotMatch(step, /hidePopover/, "連読では閉じない（続けて読める）");
  assert.match(step, /focusVolCard\(cards, forward \? 0 : cards\.length - 1\)/, "先頭／末尾へフォーカス");
  assert.match(step, /skinVolChainedNext|skinVolChainedPrev/, "移ったことを言う");
  /* 矢印の分岐：読み軸の向きだけ連読へ */
  const kd = core.slice(core.indexOf('list.addEventListener("keydown"'), core.indexOf('list.addEventListener("focusin"'));
  assert.match(kd, /const forward = dir === "col" \? move === "down" : move === "right";/);
  assert.match(kd, /const backward = dir === "col" \? move === "up" : move === "left";/);
  assert.match(kd, /if \(\(forward \|\| backward\) && volChainStep\(forward\)\) return;/);
  assert.match(kd, /if \(mode === "stop"\) return;/, "止まる設定では何もしない");
});

test("回り込んだら「先頭に戻りました」「末尾に戻りました」と言う", () => {
  assert.match(core, /function announceVolText\(text\)/);
  assert.match(core, /tr\(forward \|\| move === "down" \|\| move === "right" \? "skinVolWrappedTop" : "skinVolWrappedBottom"\)/);
  assert.match(i18n, /skinVolWrappedTop:"先頭に戻りました"/);
  assert.match(i18n, /skinVolWrappedBottom:"末尾に戻りました"/);
  /* 状態の行は aria-live のまま */
  assert.match(html, /id="skinVolStatus"[^>]*aria-live="polite"/);
});

test("4 言語のキーがそろう（5 キー×4）", () => {
  for (const k of ["skinVolWrapChain", "skinVolWrappedTop", "skinVolWrappedBottom", "skinVolChainedNext", "skinVolChainedPrev"]) {
    assert.equal((i18n.match(new RegExp("\\b" + k + ":", "g")) || []).length, 4, `${k} は 4 言語`);
  }
  for (const m of i18n.matchAll(/skinVolChainedNext:"([^"]*)"/g)) {
    assert.match(m[1], /\{name\}/);
    assert.match(m[1], /\{n\}/);
  }
});

test("版とキャッシュ：版名は sw.js と index.html で揃っている", () => {
  const v = (sw.match(/const CACHE = "trk-v[\d.]+-(trk\d+)";/) || [])[1];
  assert.match(html, new RegExp(`<meta name="trk-build" content="${v}">`));
});

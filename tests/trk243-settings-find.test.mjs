// SPDX-License-Identifier: GPL-3.0-or-later
/* 🔍 trk243：設定のさがす。
 *
 *   ⚙ 設定のパネルが 19 枚になり、目当ての項目を**目で探すしかない**状態でした
 *   （🎨 見た目・🎮 操作・📦 パック・💾 端末の保存・📤 共有・🔊 音・🎭 キャラクター・
 *    🧺 お気に入り・🛟 緊急復旧…）。言葉で絞れるようにします。
 *
 *   決めたこと（docs/SETTINGS-FIND-TRK243-2026-11-01.md）：
 *     ・探す相手は**いま画面に出ている言葉**（`textContent`）＝4 言語のどれでも当たる
 *     ・空白（全角も）で区切った語は**すべて含むもの**（AND）
 *     ・当たったパネルは**開いて**出す／当たらないパネルは**その場では隠す**（消さない）
 *     ・**もともと隠れているものは、検索でも出さない**（🍎 iPhone・開発用・条件付き）
 *     ・空に戻すと**元の開閉**へ。**保存は増やさない**（検索語も残さない）
 *   判定は js/settings-find.js の純粋関数（`setFindTerms`／`setFindHit`／`setFindPlan`）で、
 *   この検査から同じものを動かします。
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const src = read("js/settings-find.js");
const html = read("index.html");
const css = read("css/style.css");
const i18nSrc = read("js/i18n.js");
const swSrc = read("sw.js");

function extractFn(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${marker} がある`);
  const end = source.indexOf("\n  }", start);
  assert.notEqual(end, -1, `${marker} の閉じかっこがある`);
  return source.slice(start, end + 4);
}
function runIn(code) {
  const s = { console };
  vm.createContext(s);
  vm.runInContext(code, s);
  return s;
}
const api = runIn(
  [extractFn(src, "function setFindTerms("),
   extractFn(src, "function setFindHit("),
   extractFn(src, "function setFindPlan("),
   "this.api = { setFindTerms, setFindHit, setFindPlan };"
].join("\n")).api;

/* 実際の設定パネルに近い形（本物は index.html の details.panel） */
const PANELS = [
  { id:"0", text:"🎨 見た目 スキン スキンの棚 書体 明朝 音量", hidden:false },
  { id:"1", text:"🔊 音 音量 エフェクト 効果音", hidden:false },
  { id:"2", text:"💾 端末の保存 バックアップ 書き出し", hidden:false },
  { id:"3", text:"🍎 iPhone / iPad の案内", hidden:true },
  { id:"4", text:"🧪 開発用", hidden:true },
];

describe("trk243 検索語の分け方", () => {
  test("空白（全角も）で分ける・小文字にそろえる", () => {
    assert.deepEqual(Array.from(api.setFindTerms("  スキン　書体 ")), ["スキン", "書体"]);
    assert.deepEqual(Array.from(api.setFindTerms("BACKUP font")), ["backup", "font"]);
  });

  test("空・null・undefined は語なし", () => {
    for (const q of ["", "   ", "　", null, undefined]) assert.equal(api.setFindTerms(q).length, 0, String(q));
  });
});

describe("trk243 当たるかどうか", () => {
  test("空の検索語は、すべてに当たる", () => {
    assert.equal(api.setFindHit("なんでも", ""), true);
  });

  test("部分一致（英字は大文字小文字を問わない）", () => {
    assert.equal(api.setFindHit("💾 端末の保存 バックアップ", "保存"), true);
    assert.equal(api.setFindHit("💾 Backup and restore", "backup"), true);
    assert.equal(api.setFindHit("💾 Backup and restore", "BACKUP"), true);
    assert.equal(api.setFindHit("💾 端末の保存", "書体"), false);
  });

  test("空白で区切った語は、すべて含むものだけ（AND）", () => {
    assert.equal(api.setFindHit("🎨 見た目 スキン 書体", "見た目 書体"), true);
    assert.equal(api.setFindHit("🎨 見た目 スキン", "見た目 書体"), false);
  });

  test("全角空白でも AND になる", () => {
    assert.equal(api.setFindHit("🔊 音 音量", "音　音量"), true);
    assert.equal(api.setFindHit("🔊 音 エフェクト", "音　音量"), false);
  });
});

describe("trk243 どのパネルを出すか", () => {
  test("検索していないときは active:false で、隠れていないものを全部出す", () => {
    const plan = api.setFindPlan(PANELS, "");
    assert.equal(plan.active, false);
    assert.deepEqual(Array.from(plan.show), ["0", "1", "2"]);
    assert.deepEqual(Array.from(plan.hide), ["3", "4"]);
    assert.equal(plan.count, 0);
  });

  test("当たったパネルだけを出す（件数も返す）", () => {
    const plan = api.setFindPlan(PANELS, "音量");
    assert.equal(plan.active, true);
    assert.deepEqual(Array.from(plan.show), ["0", "1"]);
    assert.deepEqual(Array.from(plan.hide), ["2", "3", "4"]);
    assert.equal(plan.count, 2);
  });

  test("もともと隠れているものは、言葉が当たっても出さない", () => {
    const plan = api.setFindPlan(PANELS, "iPhone");
    assert.deepEqual(Array.from(plan.show), []);
    assert.deepEqual(Array.from(plan.hide), ["0", "1", "2", "3", "4"]);
    assert.equal(plan.count, 0);
  });

  test("当たらなければ count 0（「見つかりません」を出す側の判断）", () => {
    const plan = api.setFindPlan(PANELS, "ねこ");
    assert.equal(plan.count, 0);
    assert.deepEqual(Array.from(plan.show), []);
  });

  test("AND は効くが、別のパネルに分かれた語では当たらない", () => {
    const plan = api.setFindPlan(PANELS, "音量 バックアップ");
    assert.deepEqual(Array.from(plan.show), []);
  });

  test("おかしな入力でも落ちない", () => {
    assert.equal(api.setFindPlan(null, "音").count, 0);
    assert.equal(api.setFindPlan(undefined).active, false);
  });
});

describe("trk243 画面と約束", () => {
  test("設定の見出しの下に検索がある", () => {
    assert.match(html, /id="setFind" class="setFind"/);
    assert.match(html, /id="setFindInput" type="search" data-i18n-placeholder="setFindHint"/);
    assert.match(html, /id="setFindClear"/);
    assert.match(html, /id="setFindNothing" hidden data-i18n="setFindNothing"/);
    assert.ok(html.includes('<script src="js/settings-find.js"></script>'));
  });

  test("探す相手はいま出ている言葉（辞書のキーを別に持たない）", () => {
    assert.match(src, /text: el\.textContent/);
    assert.ok(!/text: tr\(/.test(src), "キーから組み立てない");
  });

  test("当たったパネルは開いて出し、当たらなければ hidden（消さない）", () => {
    assert.match(src, /if \(hit\.has\(el\.dataset\.setFindId\)\) \{ el\.hidden = false; el\.open = true; \}/);
    assert.match(src, /else el\.hidden = true;/);
  });

  test("空に戻すと、元の開閉へ戻す", () => {
    assert.match(src, /function restore\(\)/);
    assert.match(src, /el\.hidden = state\.hidden; el\.open = state\.open;/);
  });

  test("もともと隠れているものを、検索で出すことはない", () => {
    assert.match(src, /if \(panel\.hidden\) \{ hide\.push\(panel\.id\); continue; \}/);
  });

  test("設定を開くたび、まっさらから（検索語を残さない）", () => {
    assert.match(src, /core\.on\("settings", \(\) => \{ clear\(\); \}\)/);
    assert.match(src, /core\.on\("settingsClose", \(\) => \{ clear\(\); \}\)/);
  });

  test("新しい保存キーを作らない", () => {
    assert.ok(!/localStorage|sessionStorage|indexedDB/.test(src), "保存を使わない");
  });

  test("Esc で絞るのをやめる", () => {
    assert.match(src, /event\.key === "Escape"/);
  });

  test("ことばは 4 言語そろっている", () => {
    for (const key of ["setFindLabel", "setFindHint", "setFindCount", "setFindClear", "setFindNothing"]) {
      const n = (i18nSrc.match(new RegExp(`\\b${key}:`, "g")) || []).length;
      assert.equal(n, 4, `${key} は 4 言語`);
    }
  });

  test("見た目（CSS）と cache の版", () => {
    assert.match(css, /\.setFind\{/);
    assert.match(css, /#setFindNothing\[hidden\]\{display:none\}/);
    const cur = swSrc.match(/const CACHE = "([^"]+)";/)[1];
    assert.ok(/trk24[3-9]|trk(2[5-9]\d|[3-9]\d\d)/.test(cur), cur);
  });
});

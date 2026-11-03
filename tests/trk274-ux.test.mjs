// SPDX-License-Identifier: GPL-3.0-or-later
/* 📚 trk274：画面の手当て 4 つ（modern-web-guidance-src から採ったもの）

   U4-A で決めた 4 つが、**消えずに残っている**ことだけを見ます。
   ・G-1 `popover`（モーダルにしない・light-dismiss）＋ 効かないブラウザでは隠す
   ・G-2 `@starting-style` ＋ `transition-behavior: allow-discrete`
   ・G-3 `aria-live` の結果の読み上げ
   ・G-4 `content-visibility: auto` ＋ `contain-intrinsic-size`
   見た目そのもの（色・余白）はここでは見ません（実機と目で確かめる所）。 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const html = read("index.html");
const css = read("css/style.css");
const core = read("js/core.js");
const i18n = read("js/i18n.js");

/* ==================== G-1 popover ==================== */
test("G-1 巻のパネルは popover（モーダルにしない・light-dismiss はブラウザが持つ）", () => {
  assert.match(html, /<div id="skinVolPanel" popover[ >]/, "popover 属性がある");
  assert.match(html, /<button[^>]*id="skinVolBtn"[^>]*popovertarget="skinVolPanel"/, "ボタンから開く");
  assert.doesNotMatch(html, /<dialog[^>]*id="skinVolPanel"/, "dialog（モーダル）にはしない");
  assert.match(css, /#skinVolPanel::backdrop\{/, "外側は ::backdrop で薄くする");
  /* 効かないブラウザでは、出しっぱなしにせず隠す（<select> で代わりに選べる） */
  assert.match(core, /typeof volPanel\.showPopover !== "function"/);
  assert.match(core, /if \(volBtn\) volBtn\.hidden = true/);
  assert.match(html, /<select id="skinVol"/, "popover が無くても選べる入口がある");
});

/* ==================== G-2 入場 ==================== */
test("G-2 出るとき・消えるときは @starting-style と allow-discrete で", () => {
  assert.match(css, /@starting-style\{[^}]*#skinVolPanel:popover-open\{/);
  assert.match(css, /transition:[^;]*display \.18s allow-discrete/);
  assert.match(css, /transition:[^;]*overlay \.18s allow-discrete/);
  assert.match(css, /#skinVolPanel\{opacity:0;transform:translateY\(6px\)\}/);
  assert.match(css, /#skinVolPanel:popover-open\{opacity:1;transform:none\}/);
  /* 動きを減らす設定では 0（既存の 1 行がそのまま効く） */
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\*,?\*::before,\*::after\{animation-duration:\.01ms!important;transition:none!important\}\}/);
});

/* ==================== G-3 aria-live ==================== */
test("G-3 巻を切り替えた結果は、見た目と同時に読み上げる", () => {
  assert.match(html, /id="skinVolStatus"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(core, /function announceSkinVol\(/);
  assert.match(core, /box\.textContent = "";\s*\/\* 同じ文でも読み上げ直されるように、いったん空へ \*\//);
  assert.match(core, /requestAnimationFrame\(\(\) => \{ box\.textContent = text; \}\)/);
  /* 選んだときに呼ばれる（保存 → 作り直し → 読み上げ の順） */
  assert.match(core, /buildSkinGrid\(\);\s*announceSkinVol\(settings\.skinShelfVol\);/);
  /* 読み上げる文は 4 言語にあり、{name} と {n} を受ける */
  for (const key of ["skinVolShown", "skinVolDefault", "skinVolAll", "skinVolItems", "skinVolLabel", "skinVolOpen", "skinVolHint"]) {
    assert.equal((i18n.match(new RegExp("\\b" + key + ":", "g")) || []).length, 4, `${key} は 4 言語`);
  }
  for (const m of i18n.matchAll(/skinVolShown:"([^"]*)"/g)) {
    assert.match(m[1], /\{name\}/, "名前を差し込む");
    assert.match(m[1], /\{n\}/, "数を差し込む");
  }
});

/* ==================== G-4 描画の手当て ==================== */
test("G-4 棚の画面の外は描かない（content-visibility＋contain-intrinsic-size）", () => {
  /* trk275（レビュー R1）：118px は実測（1280px 幅で 58〜79px）と離れていて、
     下まで送ったときに棚が大きく跳ねました。実測の真ん中あたりへ。
     `auto` を付けてあるので、一度描いたあとは覚えた実寸が使われます。 */
  const m = /#skinGrid>\.skinCell\{content-visibility:auto;contain-intrinsic-size:auto (\d+)px\}/.exec(css);
  assert.ok(m, "content-visibility と contain-intrinsic-size が 1 行で入っている");
  const h = Number(m[1]);
  assert.ok(h >= 58 && h <= 79, `${h}px は実測（58〜79px）の範囲`);
  /* 棚の一覧だけに当てる（設定のパネル・再生バーには当てない） */
  const matches = [...css.matchAll(/content-visibility:auto/g)];
  assert.equal(matches.length, 1, "content-visibility は 1 か所だけ");
});

/* ==================== 既定は「定番＋ウィザード」 ==================== */
test("保存は既存の settings の中（localStorage のキーは増やさない）", () => {
  assert.match(core, /skinShelfVol: typeof prefs\.skinShelfVol === "string"/);
  assert.doesNotMatch(core, /localStorage\.setItem\("skinVol/, "新しい保存キーを作らない");
  /* 工場出荷にも戻す */
  assert.match(core, /settings\.skinShelfVol = "";/);
  /* 目録（js/skins-volumes.js）が無くても動く */
  assert.match(core, /const v = window\.Trk && window\.Trk\.data && window\.Trk\.data\.SKIN_VOLUMES;\s*return Array\.isArray\(v\) \? v : \[\];/);
});

test("版とキャッシュ：trk274 で上がっている", () => {
  /* trk275（レビュー対応）で trk275 へ。版名は sw.js と index.html で揃っていることだけ見る */
  assert.match(html, /<meta name="trk-build" content="trk275">/);
  assert.match(read("sw.js"), /const CACHE = "trk-v2026\.11\.03-trk275";/);
  assert.match(html, /<script src="js\/skins-volumes\.js"><\/script>/);
  /* 依存の順：data.js → 目録（typography／characters／wizard／volumes）→ core.js */
  const at = s => html.indexOf(`<script src="${s}"></script>`);
  assert.ok(at("js/data.js") < at("js/skins-volumes.js"));
  assert.ok(at("js/skins-volumes.js") < at("js/core.js"));
});

// SPDX-License-Identifier: GPL-3.0-or-later
/* ✨ trk255：小粒の仕上げ（判断項目 U1〜U7）。
 *
 *   ・U1 🔤 に「この組が合う曲」を1行出す（目録の trkUse。名前は日本語のまま・翻訳は増やさない）
 *   ・U2 更新の帯の「あとで」を24時間覚える＋設定に「知らせを出す」を置く（optout）
 *   ・U3 いまの版は設定（🔄 アプリの更新）だけに出す（帯には出さない）
 *   ・U4 表示の密度を下の再生バーにも効かせる（font-size は変えない）
 *   ・U5 設定のさがすを `/` で開く（入力中・IME・修飾キー付きは無視・検索語は保存しない）
 *   ・U7 英語だけだった読み上げ名 13 個を4言語にそろえる
 *
 *   保存は増やさない：swUpdateNotice／swUpdateSnooze は core.settings の中だけ。
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const src = read("js/sw-update.js");
const findSrc = read("js/settings-find.js");
const prefsSrc = read("js/ui-prefs.js");
const coreSrc = read("js/core.js");
const studySrc = read("js/study-room.js");
const i18nSrc = read("js/i18n.js");
const typoSrc = read("js/typography.js");
const html = read("index.html");
const barCss = read("css/player-bar.css");
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
const count = (text, re) => (text.match(re) || []).length;

describe("trk255 ことば（4言語そろっている）", () => {
  const keys = ["typoUse", "swUpdateNoticeChk", "swUpdateNoticeHint", "swUpdateVersion",
                "ariaSeek", "ariaFullscreen", "ariaMasterRush"];
  for (const key of keys) {
    test(`${key} は 4 言語`, () => {
      assert.equal(count(i18nSrc, new RegExp(`\\b${key}:`, "g")), 4, key);
    });
  }

  test("書斎の読み上げ名も 4 言語（study-room.js の自前の辞書）", () => {
    for (const key of ["studyA11yShelf", "studyA11yZoom", "studyA11yZoomOut", "studyA11yZoomIn",
                       "studyA11yTextSize", "studyA11yLineSpacing", "studyA11yMargins",
                       "studyA11yTv", "studyA11yImageReader", "studyA11yPage"]) {
      assert.equal(count(studySrc, new RegExp(`\\b${key}:`, "g")), 4, key);
    }
  });

  test("「あとで」は24時間であることを、ことばでも伝える", () => {
    assert.match(i18nSrc, /swUpdateLaterStatus:"[^"]*24時間/);
    assert.match(i18nSrc, /swUpdateLaterStatus:"[^"]*24 hours/);
  });
});

describe("trk255 U1 書体の組み合わせに「合う曲」を出す", () => {
  test("目録の14組すべてに trkUse がある（空の行を出さない）", () => {
    assert.equal(count(typoSrc, /"id":/g), 14);
    assert.equal(count(typoSrc, /"trkUse":"[^"]+"/g), 14);
  });

  test("選んだ組の説明の下に1行（選んでいなければ隠す）", () => {
    assert.match(html, /id="typoState"/);
    assert.match(html, /id="typoUse" class="hint" hidden/);
    assert.ok(html.indexOf('id="typoState"') < html.indexOf('id="typoUse"'), "説明の下に置く");
    assert.match(prefsSrc, /const use = document\.getElementById\("typoUse"\)/);
    assert.match(prefsSrc, /tr\("typoUse", \{ use: p\.trkUse \}\)/);
    assert.match(prefsSrc, /use\.hidden = !useText/);
  });
});

describe("trk255 U2 更新の知らせを止められる・「あとで」を覚える", () => {
  const api = runIn([
    src.match(/const SNOOZE_MS = .*;/)[0],
    extractFn(src, "function swNoticeFor("),
    "this.api = { swNoticeFor, SNOOZE_MS };"
  ].join("\n")).api;

  test("「あとで」は24時間", () => {
    assert.equal(api.SNOOZE_MS, 24 * 60 * 60 * 1000);
  });

  test("24時間のあいだは出さない（待っていても・入れ替わっても）", () => {
    assert.equal(api.swNoticeFor({ hasController: true, waiting: true, snoozed: true }), "none");
    assert.equal(api.swNoticeFor({ hasController: true, changed: true, snoozed: true }), "none");
  });

  test("設定で止めていれば出さない（オフのときだけ・既定は出す）", () => {
    assert.equal(api.swNoticeFor({ hasController: true, waiting: true, enabled: false }), "none");
    assert.equal(api.swNoticeFor({ hasController: true, waiting: true, enabled: true }), "waiting");
    assert.equal(api.swNoticeFor({ hasController: true, waiting: true }), "waiting");
  });

  test("止めていても「新しい版を確かめる」は使える（ことばの案内つき）", () => {
    assert.match(i18nSrc, /swUpdateNoticeHint/);
    assert.match(src, /const noticeEnabled = \(\) =>/);
    assert.match(src, /core\.settings\.swUpdateNotice === false/);
    assert.match(src, /function setSnooze\(until\)/);
    assert.match(src, /setSnooze\(Date\.now\(\) \+ SNOOZE_MS\)/);
    assert.match(src, /const noticeChk = document\.getElementById\("swUpdateNoticeChk"\)/);
    assert.match(src, /core\.settings\.swUpdateNotice = noticeChk\.checked/);
  });

  test("チェックは設定の中にあり、保存は core.settings だけ（新しい保存キーを作らない）", () => {
    assert.match(html, /<input id="swUpdateNoticeChk" type="checkbox">/);
    assert.match(html, /data-i18n="swUpdateNoticeChk"/);
    assert.match(html, /data-i18n="swUpdateNoticeHint"/);
    assert.ok(!/localStorage|sessionStorage|indexedDB/.test(src), "保存 API を直接使わない");
    assert.match(coreSrc, /swUpdateNotice: prefs\.swUpdateNotice !== false/);
    assert.match(coreSrc, /swUpdateSnooze: num\(prefs\.swUpdateSnooze, 0, 8\.64e15, 0\)/);
    assert.match(coreSrc, /settings\.swUpdateNotice = true; settings\.swUpdateSnooze = 0;/);
  });

  test("自分で「確かめる」を押して新しい版があったときは、眠りを解いて知らせる", () => {
    assert.match(src, /if \(outcome === "ready"\) \{ setSnooze\(0\); dismissed = false; \}/);
  });
});

describe("trk255 U3 いまの版は設定だけに出す", () => {
  test("版は meta に1か所だけ（trk の番号を持つ）", () => {
    /* ⚠ 版は上げるたびに変わるので、番号そのものは書かない（trk256 で実際に赤くなった）。
       番号は下の「CACHE とそろっている」が見ます。 */
    assert.match(html, /<meta name="trk-build" content="trk\d+">/);
    assert.equal(count(html, /name="trk-build"/g), 1);
  });

  test("sw.js の CACHE と meta の番号がそろっている", () => {
    const cache = swSrc.match(/const CACHE = "([^"]+)";/)[1];
    const build = html.match(/<meta name="trk-build" content="([^"]+)">/)[1];
    assert.equal(cache.match(/trk(\d+)$/)[1], build.match(/trk(\d+)$/)[1], `${cache} / ${build}`);
  });

  test("出すのは「🔄 アプリの更新」の中だけ（帯には出さない）", () => {
    assert.match(html, /id="swUpdateVersion"/);
    assert.match(src, /document\.querySelector\('meta\[name="trk-build"\]'\)/);
    assert.match(src, /tr\("swUpdateVersion", \{ v: buildName \}\)/);
    const panel = html.slice(html.indexOf('id="updatePanel"'), html.indexOf('id="updatePanel"') + 1200);
    assert.ok(panel.includes('id="swUpdateVersion"'), "設定のパネルの中にある");
    const bar = html.slice(html.indexOf('id="swUpdateBar"'), html.indexOf('id="swUpdateBar"') + 900);
    assert.ok(!bar.includes("swUpdateVersion"), "帯には出さない");
  });
});

describe("trk255 U4 表示の密度を再生バーにも効かせる", () => {
  test("密度の受け口を再生バー側に引き、余白・間隔・高さの床を詰める", () => {
    assert.match(barCss, /--trk-pb-dens-pad: 1; --trk-pb-dens-gap: 1; --trk-pb-dens-h: 1;/);
    assert.match(barCss, /body\.trk-density-dense \{ --trk-pb-dens-pad: \.5; --trk-pb-dens-gap: \.65; --trk-pb-dens-h: \.84; \}/);
    assert.match(barCss, /min-height: calc\(60px \* var\(--trk-pb-dens-h, 1\)\)/);
    assert.match(barCss, /gap: calc\(12px \* var\(--trk-pb-dens-gap, 1\)\)/);
    assert.match(barCss, /padding: calc\(9px \* var\(--trk-pb-dens-pad, 1\)\)/);
  });

  test("密度の規則で font-size は変えない（trk244 の約束）", () => {
    const block = barCss.slice(barCss.indexOf(":root { --trk-pb-dens-pad"), barCss.indexOf(".trk-playerbar {"));
    assert.ok(block.length > 0);
    assert.ok(!/font-size/.test(block), "font-size を触らない");
  });

  test("クラス名は core が付けるものと同じ", () => {
    for (const level of ["roomy", "normal", "compact", "dense"])
      assert.match(coreSrc, new RegExp(`"trk-density-"|trk-density-\\$\\{`), level);
    assert.match(barCss, /body\.trk-density-roomy/);
    assert.match(barCss, /body\.trk-density-compact/);
  });
});

describe("trk255 U5 `/` で設定のさがすへ飛ぶ", () => {
  const api = runIn([
    extractFn(findSrc, "function slashAllowed("),
    "this.api = { slashAllowed };"
  ].join("\n")).api;

  test("`/` だけを受け付ける", () => {
    assert.equal(api.slashAllowed({ key: "/", target: { tagName: "BODY" } }), true);
    assert.equal(api.slashAllowed({ key: "/", target: {} }), true);
    assert.equal(api.slashAllowed({ key: "a" }), false);
    assert.equal(api.slashAllowed({ key: "Enter" }), false);
    assert.equal(api.slashAllowed(), false);
  });

  test("入力中の欄・修飾キー・IME の変換中は横取りしない", () => {
    for (const tagName of ["INPUT", "TEXTAREA", "SELECT"])
      assert.equal(api.slashAllowed({ key: "/", target: { tagName } }), false, tagName);
    assert.equal(api.slashAllowed({ key: "/", target: { tagName: "DIV", isContentEditable: true } }), false);
    for (const mod of ["ctrlKey", "metaKey", "altKey"])
      assert.equal(api.slashAllowed({ key: "/", [mod]: true, target: { tagName: "BODY" } }), false, mod);
    assert.equal(api.slashAllowed({ key: "/", isComposing: true, target: { tagName: "BODY" } }), false);
  });

  test("設定のパネルを開いているときだけ・検索語は保存しない", () => {
    assert.match(findSrc, /if \(!pane \|\| pane\.hidden\) return;/);
    assert.match(findSrc, /if \(!slashAllowed\(event\)\) return;/);
    assert.ok(!/localStorage|sessionStorage|indexedDB/.test(findSrc), "検索語を残さない");
    assert.match(findSrc, /slash: slashAllowed/);
  });
});

describe("trk255 U7 読み上げ名を4言語にそろえる", () => {
  test("英語の aria-label を index.html に直書きしない（全部 data-i18n-aria 経由）", () => {
    assert.equal(count(html, /aria-label="/g), 0);
    for (const key of ["ariaSeek", "ariaFullscreen", "ariaMasterRush"])
      assert.match(html, new RegExp(`data-i18n-aria="${key}"`), key);
    for (const key of ["studyA11yShelf", "studyA11yZoom", "studyA11yZoomOut", "studyA11yZoomIn",
                       "studyA11yTextSize", "studyA11yLineSpacing", "studyA11yMargins",
                       "studyA11yTv", "studyA11yImageReader", "studyA11yPage"])
      assert.match(html, new RegExp(`data-i18n-aria="${key}"`), key);
  });

  test("英語から置き換えた 13 個が、それぞれ1か所ずつある", () => {
    const added = ["ariaSeek", "ariaFullscreen", "ariaMasterRush", "studyA11yShelf", "studyA11yZoom",
                   "studyA11yZoomOut", "studyA11yZoomIn", "studyA11yTextSize", "studyA11yLineSpacing",
                   "studyA11yMargins", "studyA11yTv", "studyA11yImageReader", "studyA11yPage"];
    let n = 0;
    for (const key of added) n += count(html, new RegExp(`data-i18n-aria="${key}"`, "g"));
    assert.equal(n, 13);
  });
});

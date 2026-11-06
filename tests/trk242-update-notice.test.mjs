// SPDX-License-Identifier: GPL-3.0-or-later
/* 🔄 trk242：新しい版の知らせ。
 *
 *   これまで `sw.js` は登録していた（オフライン用の殻をキャッシュする）が、**新しい版が入ったことを
 *   画面で知らせる仕組みが無かった**（`grep updatefound` で 0 件）。開き直すまで古い画面のまま
 *   気づけない状態でした。
 *
 *   この版で決めたこと（docs/UPDATE-NOTICE-TRK242-2026-11-01.md）：
 *     ・出すのは**画面の下の小さな帯**（窓で覆わない・遊びを止めない）
 *     ・**初回のインストールでは出さない**（前の版が無い＝入れ替わりの通知ではない）
 *     ・**遊んでいる途中は出さない**。タイトルへ戻ったとき（判定は `swDeferNotice`）
 *     ・「あとで」はこの画面のあいだだけ（**新しい保存キーは作らない**）
 *     ・「いま更新する」は開き直すだけ（勝手に開き直さない）
 *   判定は js/sw-update.js の純粋関数（`swNoticeFor`／`swDeferNotice`／`swCheckDue`／`swCheckOutcome`）で、
 *   この検査から同じものを動かします。
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const src = read("js/sw-update.js");
const mainSrc = read("js/main.js");
const swSrc = read("sw.js");
const html = read("index.html");
const css = read("css/style.css");
const i18nSrc = read("js/i18n.js");

function extractFn(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${marker} がある`);
  const end = source.indexOf("\n  }", start);
  assert.notEqual(end, -1, `${marker} の閉じかっこがある`);
  return source.slice(start, end + 4);
}
function runIn(code, globals = {}) {
  const s = { ...globals, console };
  vm.createContext(s);
  vm.runInContext(code, s);
  return s;
}

const gapSrc = src.match(/const CHECK_GAP_MS = .*;/)[0];
const api = runIn(
  [gapSrc,
   extractFn(src, "function swNoticeFor("),
   extractFn(src, "function swDeferNotice("),
   extractFn(src, "function swCheckDue("),
   extractFn(src, "function swCheckOutcome("),
   "this.api = { swNoticeFor, swDeferNotice, swCheckDue, swCheckOutcome, CHECK_GAP_MS };"
].join("\n")).api;

describe("trk242 知らせを出すかどうか", () => {
  test("初回のインストールでは出さない（前の版が無い）", () => {
    assert.equal(api.swNoticeFor({ hasController:false, waiting:true }), "none");
    assert.equal(api.swNoticeFor({ hasController:false, changed:true }), "none");
  });

  test("新しい版が待っているときは出す", () => {
    assert.equal(api.swNoticeFor({ hasController:true, waiting:true }), "waiting");
  });

  test("入れ替わった（controllerchange）ときも出す", () => {
    assert.equal(api.swNoticeFor({ hasController:true, changed:true }), "swapped");
  });

  test("何も起きていなければ出さない", () => {
    assert.equal(api.swNoticeFor({ hasController:true }), "none");
    assert.equal(api.swNoticeFor({}), "none");
    assert.equal(api.swNoticeFor(), "none");
  });

  test("「あとで」を押したら、その画面では出さない（待っていても・入れ替わっても）", () => {
    assert.equal(api.swNoticeFor({ hasController:true, waiting:true, dismissed:true }), "none");
    assert.equal(api.swNoticeFor({ hasController:true, changed:true, dismissed:true }), "none");
  });
});

describe("trk242 遊んでいる途中は後回し", () => {
  test("タイトルのときだけ、その場で出す", () => {
    assert.equal(api.swDeferNotice("title"), false);
  });

  test("遊んでいる途中・一時停止・設定の外では後回し", () => {
    for (const phase of ["playing", "paused", "", null, undefined, "ready", "result"])
      assert.equal(api.swDeferNotice(phase), true, String(phase));
  });
});

describe("trk242 確かめる間隔", () => {
  const H = 60 * 60 * 1000;

  test("まだ一度も確かめていなければ、確かめる", () => {
    assert.equal(api.swCheckDue({ now: 10 * H, last: 0, hidden: false }), true);
  });

  test("30分に1回まで（29分では確かめない・30分で確かめる）", () => {
    const now = 100 * H;
    assert.equal(api.swCheckDue({ now, last: now - 29 * 60 * 1000, hidden: false }), false);
    assert.equal(api.swCheckDue({ now, last: now - 30 * 60 * 1000, hidden: false }), true);
  });

  test("画面が見えていないときは確かめない（通信を無駄にしない）", () => {
    assert.equal(api.swCheckDue({ now: 100 * H, last: 0, hidden: true }), false);
  });

  test("間隔は 30 分", () => {
    assert.equal(api.CHECK_GAP_MS, 30 * 60 * 1000);
  });
});

describe("trk242 「新しい版を確かめる」の結果", () => {
  test("確かめられなかった／新しい版がある／いまが最新", () => {
    assert.equal(api.swCheckOutcome({ ok:false }), "failed");
    assert.equal(api.swCheckOutcome({ ok:true, waiting:true }), "ready");
    assert.equal(api.swCheckOutcome({ ok:true, waiting:false }), "latest");
    assert.equal(api.swCheckOutcome(), "failed");
  });
});

describe("trk242 つなぎ方（画面と登録）", () => {
  test("Service Worker の登録は js/sw-update.js に移した（main.js では登録しない）", () => {
    assert.match(src, /navigator\.serviceWorker\.register\("\.\/sw\.js", \{ scope: "\.\/", updateViaCache: "none" \}\)/);
    assert.ok(!/navigator\.serviceWorker\.register\(/.test(mainSrc), "main.js に二重の登録を残さない");
    assert.match(mainSrc, /js\/sw-update\.js へ移しました/);
  });

  test("index.html が js/sw-update.js を読み、帯と設定の入口がある", () => {
    assert.ok(html.includes('<script src="js/sw-update.js"></script>'));
    for (const id of ["swUpdateBar", "swUpdateBarText", "swUpdateNow", "swUpdateLater",
                      "updatePanel", "swUpdateCheckBtn", "swUpdateStatus"])
      assert.ok(html.includes(`id="${id}"`), id);
  });

  test("帯は最初は隠れていて、窓ではない（role=status・aria-live）", () => {
    assert.match(html, /id="swUpdateBar" class="swUpdateBar" role="status" aria-live="polite" hidden/);
    assert.ok(!/id="swUpdateBar"[^>]*aria-modal/.test(html), "窓（モーダル）にしない");
    assert.match(css, /\.swUpdateBar\[hidden\]\{display:none\}/);
  });

  test("遊びを止めない：開き直すのはボタンを押したときだけ", () => {
    assert.match(src, /if \(nowBtn\) nowBtn\.addEventListener\("click"/);
    const reloads = src.match(/location\.reload\(\)/g) || [];
    assert.equal(reloads.length, 1, `開き直すのは 1 か所（${reloads.length}）`);
  });

  test("見張りは updatefound と controllerchange の両方を見る", () => {
    assert.match(src, /addEventListener\("updatefound"/);
    assert.match(src, /addEventListener\("controllerchange"/);
    assert.match(swSrc, /skipWaiting\(\)/, "新しい版は待たずに入れ替わる（帯で開き直しを勧める）");
  });

  test("新しい保存キーを作らない（「あとで」は画面のあいだだけ）", () => {
    assert.ok(!/localStorage|sessionStorage|indexedDB/.test(src), "保存を使わない");
  });

  test("file: では登録しない（これまでどおり）", () => {
    assert.match(src, /const hasSW = "serviceWorker" in navigator && location\.protocol !== "file:"/);
  });

  test("見た目の確認用の入口（?update=1）は、保存も通信もしない", () => {
    assert.match(src, /new URLSearchParams\(location\.search\)\.get\("update"\) === "1"/);
    const slice = src.slice(src.indexOf('get("update")'), src.indexOf('get("update")') + 420);
    assert.ok(!/localStorage|fetch\(|reload\(/.test(slice), "確認用の入口で保存・通信・開き直しをしない");
  });

  test("ことばは 4 言語そろっている", () => {
    for (const key of ["secUpdate", "swUpdateHint", "swUpdateCheck", "swUpdateChecking", "swUpdateLatest",
                       "swUpdateReady", "swUpdateFailed", "swUpdateBarText", "swUpdateNow", "swUpdateLater",
                       "swUpdateLaterStatus"]) {
      const n = (i18nSrc.match(new RegExp(`\\b${key}:`, "g")) || []).length;
      assert.equal(n, 4, `${key} は 4 言語`);
    }
  });

  test("帯のことばは data-i18n で読み込む（言語を変えても追いつく）", () => {
    assert.match(html, /id="swUpdateBarText" data-i18n="swUpdateBarText"/);
    assert.match(html, /id="swUpdateNow" type="button" data-i18n="swUpdateNow"/);
    assert.match(html, /summary data-i18n="secUpdate"/);
  });

  test("sw.js の cache は trk242 以降（この版で殻が変わった）", () => {
    const cur = swSrc.match(/const CACHE = "([^"]+)";/)[1];
    assert.ok(/trk24[2-9]|trk(2[5-9]\d|[3-9]\d\d)/.test(cur), cur);
  });
});

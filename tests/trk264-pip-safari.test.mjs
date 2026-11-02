// SPDX-License-Identifier: GPL-3.0-or-later
/* 📌 trk264：Safari でも画中画を使えるようにする、の見張り。
 *
 * ブラウザーを起動しないテストなので、`js/media-player-mode.js` の中の
 * 「純粋な計算（trk264）」の範囲（目印で囲んだ所）を切り出して vm で読みます。
 * 配線（2つの API・Safari のイベント・押せない理由の言葉）は、本文に目印があるかで確かめます。
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const src = read("js/media-player-mode.js");

const START = "/* ==== 純粋な計算（trk264";
const END = "/* ==== 純粋な計算（trk264）ここまで ==== */";
const from = src.indexOf(START), to = src.indexOf(END);
assert.ok(from > 0 && to > from, "「純粋な計算（trk264）」の目印が見つかる");
const sandbox = { Object };
vm.createContext(sandbox);
vm.runInContext(src.slice(from, to) + `
;globalThis.P = { pipBackend, pipRunning };
`, sandbox, { filename: "js/media-player-mode.js#pure264" });
const P = sandbox.P;

describe("trk264：どの API で画中画に入るか", () => {
  test("標準 API があるなら、まず標準（U1＝standard_first）", () => {
    assert.equal(P.pipBackend({ standard: true, standardEnabled: true, webkit: true }), "standard");
    assert.equal(P.pipBackend({ standard: true, standardEnabled: undefined, webkit: false }), "standard");
  });

  test("標準が使えず webkit があるなら webkit（Safari の古い版・ホーム画面アプリ）", () => {
    assert.equal(P.pipBackend({ standard: false, webkit: true }), "webkit");
    assert.equal(P.pipBackend({ standard: true, standardEnabled: false, webkit: true }), "webkit",
      "pictureInPictureEnabled が false なら標準は使わない");
  });

  test("要素に聞いて「だめ」と言われたら webkit も使わない（ホーム画面アプリの唯一の答え）", () => {
    assert.equal(P.pipBackend({ standard: false, webkit: true, webkitProbe: false }), "");
    assert.equal(P.pipBackend({ standard: true, standardEnabled: false, webkit: true, webkitProbe: false }), "");
  });

  test("「まだ分からない」（undefined）は使える扱いにする（読み込み前の false を信じない）", () => {
    assert.equal(P.pipBackend({ standard: false, webkit: true, webkitProbe: undefined }), "webkit");
    assert.equal(P.pipBackend({ standard: true, webkit: true, webkitProbe: undefined }), "standard");
  });

  test("前回通ったほうを覚える（2回目から同じ道）", () => {
    assert.equal(P.pipBackend({ standard: true, webkit: true, prefer: "webkit" }), "webkit");
    assert.equal(P.pipBackend({ standard: true, webkit: true, prefer: "standard" }), "standard");
  });

  test("覚えたほうが使えなければ、もう一方へ戻る", () => {
    assert.equal(P.pipBackend({ standard: true, webkit: true, webkitProbe: false, prefer: "webkit" }), "standard");
    assert.equal(P.pipBackend({ standard: false, webkit: true, prefer: "standard" }), "webkit");
  });

  test("どちらも使えなければ空（押せない）", () => {
    assert.equal(P.pipBackend({ standard: false, webkit: false }), "");
    assert.equal(P.pipBackend(), "");
    assert.equal(P.pipBackend({}), "");
  });
});

describe("trk264：小窓が出ているかの見え方（2つの API）", () => {
  test("標準は document.pictureInPictureElement、webkit は webkitPresentationMode", () => {
    assert.equal(P.pipRunning({ stdElement: true }), true);
    assert.equal(P.pipRunning({ webkitMode: "picture-in-picture" }), true);
  });

  test("出ていないとき", () => {
    assert.equal(P.pipRunning({ stdElement: false, webkitMode: "inline" }), false);
    assert.equal(P.pipRunning({ webkitMode: "" }), false);
    assert.equal(P.pipRunning(), false);
    assert.equal(P.pipRunning({}), false);
  });
});

describe("trk264：配線（本文の目印）", () => {
  test("ホーム画面アプリ（standalone）を見分ける", () => {
    assert.ok(src.includes("function pipStandaloneApp()"), "trk265（レビュー Q4）で名前を実態に合わせた");
    assert.ok(src.includes("navigator.standalone === true"));
    assert.ok(src.includes('matchMedia("(display-mode: standalone)")'));
  });

  test("Safari の webkit API を、要素に聞いてから使う", () => {
    assert.ok(src.includes("function pipWebkitProbe()"));
    assert.ok(src.includes('v.webkitSupportsPresentationMode("picture-in-picture")'));
    assert.ok(src.includes("if (!(v.readyState >= 1)) return undefined;"), "読み込み前の false は「分からない」");
    assert.ok(src.includes("function pipState()"));
    assert.ok(src.includes("!(pipStandaloneApp() && probe === false)"), "standalone のアプリでは標準 API を切る");
  });

  test("入る・出るの両方を実装している", () => {
    assert.ok(src.includes("async function pipEnterStandard()"));
    assert.ok(src.includes("await core.video.requestPictureInPicture()"));
    assert.ok(src.includes("async function pipEnterWebkit()"));
    assert.ok(src.includes('v.webkitSetPresentationMode("picture-in-picture")'));
    assert.ok(src.includes('v.webkitSetPresentationMode("inline")'), "webkit で出る（trk265 で leavePipBoth に寄せた）");
    assert.ok(src.includes("document.exitPictureInPicture()"));
  });

  test("標準で断られたら、その場で webkit を試す", () => {
    assert.ok(src.includes("async function enterPip()"));
    assert.ok(src.includes("if (await pipEnterStandard()) return true;"));
    assert.ok(src.includes("if (st.webkit === true && st.webkitProbe !== false) return pipEnterWebkit();"));
    assert.ok(src.includes("pipPrefer = \"standard\";") && src.includes("pipPrefer = \"webkit\";"),
      "通ったほうを覚える");
  });

  test("Safari の出入り（webkitpresentationmodechanged）も拾う", () => {
    assert.ok(src.includes('core.video.addEventListener("webkitpresentationmodechanged"'));
    assert.ok(src.includes('pipActive = core.video.webkitPresentationMode === "picture-in-picture";'));
    assert.ok(src.includes('core.video.addEventListener("enterpictureinpicture"'));
    assert.ok(src.includes('core.video.addEventListener("leavepictureinpicture"'));
  });

  test("閉じるときも、標準と webkit の両方で出る", () => {
    const helper = src.slice(src.indexOf("async function leavePipBoth()"), src.indexOf("function waitWebkitPip("));
    assert.ok(helper.includes("document.exitPictureInPicture()"), "標準で閉じる");
    assert.ok(helper.includes('v.webkitSetPresentationMode("inline")'), "webkit でも閉じる");
    const close = src.slice(src.indexOf("function closeMedia("), src.indexOf("function openMedia("));
    assert.ok(close.includes("leavePipBoth();"), "closeMedia は 1 か所に寄せた（trk265・レビュー M1）");
  });

  test("押せない理由は、ホーム画面アプリだけ言い方を変える", () => {
    assert.ok(src.includes("function pipUnsupportedKey()"));
    assert.ok(src.includes('pipNode.title = pipOk ? "" : tr(pipUnsupportedKey());'));
    assert.ok(src.includes("return pipStandaloneApp() && pipWebkitProbe() === false ? \"mediaPipHomeApp\" : \"mediaPipUnsupported\";"));
  });

  test("開けなかったときは「非対応」ではなく「開けなかった」と言う（U3）", () => {
    assert.ok(src.includes('tr(pipSupported() ? "mediaPipFailed" : pipUnsupportedKey())'));
  });
});

describe("trk264：4言語の文言", () => {
  const keys = ["mediaPipHomeApp", "mediaPipFailed", "mediaPipHint", "mediaPipUnsupported"];
  for (const key of keys) {
    test(`${key} が 4 言語ぶんある`, () => {
      assert.equal((src.match(new RegExp(`${key}:"`, "g")) || []).length, 4);
    });
  }

  test("「スマホは非対応」の古い説明が残っていない", () => {
    assert.ok(!src.includes("スマホは非対応"));
    assert.ok(!src.includes("not on phones"));
  });
});

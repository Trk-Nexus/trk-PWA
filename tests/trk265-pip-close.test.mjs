// SPDX-License-Identifier: GPL-3.0-or-later
/* 📌 trk265：trk264 レビューの手当て（M1 閉じる側・R1 待ち方・R3 見える理由）の見張り。
 *
 * ブラウザーを起動しないテストなので、`js/media-player-mode.js` の中の
 * 「閉じる順番と待ち方（trk265）」の範囲を切り出し、document / core / タイマーの代役を渡して動かします。
 * 配線（2か所の押さえ・理由の1行・読み上げ）は本文の目印で確かめます。
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const src = read("js/media-player-mode.js");
const css = read("css/style.css");

const PURE264_START = "/* ==== 純粋な計算（trk264";
const PURE264_END = "/* ==== 純粋な計算（trk264）ここまで ==== */";
const START = "/* ==== 画中画の出入り（trk265";
const END = "/* ==== 出入り（閉じる順番と待ち方） ここまで ==== */";
const p264a = src.indexOf(PURE264_START), p264b = src.indexOf(PURE264_END);
const from = src.indexOf(START), to = src.indexOf(END);
assert.ok(p264a > 0 && p264b > p264a, "「純粋な計算（trk264）」の目印が見つかる");
assert.ok(from > 0 && to > from, "「画中画の出入り（trk265）」の目印が見つかる");

/* 切り出した範囲を、document / core / タイマーの代役つきで動かす */
function makeSandbox({ stdElement = null, webkitMode = "inline", exitError = null } = {}) {
  const calls = { exit: 0, inline: 0, entered: 0 };
  const listeners = new Map();
  const video = {
    webkitPresentationMode: webkitMode,
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
    removeEventListener(type, fn) {
      const arr = listeners.get(type) || [];
      const i = arr.indexOf(fn);
      if (i >= 0) arr.splice(i, 1);
    },
    emit(type) { for (const fn of [...(listeners.get(type) || [])]) fn(); },
    listenerCount(type) { return (listeners.get(type) || []).length; },
    webkitSetPresentationMode(mode) {
      calls.entered++;
      if (mode === "inline") { calls.inline++; video.webkitPresentationMode = "inline"; }
      else { video.webkitPresentationMode = mode; }
      video.emit("webkitpresentationmodechanged");
    },
  };
  const document = {
    pictureInPictureElement: stdElement,
    exitPictureInPicture() {
      calls.exit++;
      if (exitError) return Promise.reject(exitError);
      document.pictureInPictureElement = null;
      return Promise.resolve();
    },
  };
  const sandbox = {
    document, core: { video }, console, setTimeout, clearTimeout, Promise, Object,
    pipPrefer: "", pipActive: false,
  };
  vm.createContext(sandbox);
  vm.runInContext(src.slice(p264a, p264b) + "\n" + src.slice(from, to) + `
;globalThis.P = { pipRunning, pipBackend, pipActuallyOn, leavePipBoth, waitWebkitPip, pipEnterWebkit };
;globalThis.setPrefer = v => { pipPrefer = v; };
;globalThis.getPrefer = () => pipPrefer;
`, sandbox, { filename: "js/media-player-mode.js#trk265" });
  return { P: sandbox.P, video, document, calls, sandbox };
}

describe("trk265 M1：閉じる側は、標準と webkit の両方を順に試す", () => {
  test("標準だけで出ているとき：標準で閉じ、webkit は触らない", async () => {
    const { P, document, calls } = makeSandbox({ stdElement: {}, webkitMode: "inline" });
    await P.leavePipBoth();
    assert.equal(calls.exit, 1, "標準で閉じる");
    assert.equal(calls.inline, 0, "webkit は出ていないので触らない");
    assert.equal(document.pictureInPictureElement, null);
  });

  test("webkit だけで出ているとき：webkit を inline に戻す", async () => {
    const { P, video, calls } = makeSandbox({ stdElement: null, webkitMode: "picture-in-picture" });
    await P.leavePipBoth();
    assert.equal(calls.exit, 0, "標準は出ていないので呼ばない");
    assert.equal(calls.inline, 1, "webkit で閉じる");
    assert.equal(video.webkitPresentationMode, "inline");
  });

  test("両方が立っていて標準が失敗しても、webkit を試す（レビュー M1 の再現）", async () => {
    const { P, video, calls } = makeSandbox({ stdElement: {}, webkitMode: "picture-in-picture", exitError: new Error("NotSupportedError") });
    await P.leavePipBoth();   /* 例外は投げない（未処理の reject も出さない） */
    assert.equal(calls.exit, 1, "標準を試した");
    assert.equal(calls.inline, 1, "失敗しても webkit を試す（昔は else if で試さなかった）");
    assert.equal(video.webkitPresentationMode, "inline", "小窓が残らない");
  });

  test("どちらも出ていなければ、何もしない", async () => {
    const { P, calls } = makeSandbox({ stdElement: null, webkitMode: "inline" });
    await P.leavePipBoth();
    assert.deepEqual([calls.exit, calls.inline], [0, 0]);
  });

  test("「いま出ているか」は、標準と webkit の両方の見え方で決まる", () => {
    assert.equal(makeSandbox({ stdElement: {} }).P.pipActuallyOn(), true);
    assert.equal(makeSandbox({ webkitMode: "picture-in-picture" }).P.pipActuallyOn(), true);
    assert.equal(makeSandbox({ webkitMode: "inline" }).P.pipActuallyOn(), false);
  });
});

describe("trk265 R1：webkit は「変わった」の知らせを待つ", () => {
  test("すぐ知らせが来たら、待たずに true（時間で決め打ちしない）", async () => {
    const { P, video } = makeSandbox({ webkitMode: "inline" });
    const t0 = Date.now();
    const ok = await P.pipEnterWebkit();
    assert.equal(ok, true);
    assert.equal(video.webkitPresentationMode, "picture-in-picture");
    assert.ok(Date.now() - t0 < 200, "1.2 秒のポーリングをしていない");
    assert.equal(video.listenerCount("webkitpresentationmodechanged"), 0, "待ち終わったら外す");
  });

  test("入れたら、次回のために webkit を覚える", async () => {
    const { P, sandbox } = makeSandbox({ webkitMode: "inline" });
    await P.pipEnterWebkit();
    assert.equal(sandbox.getPrefer(), "webkit");
  });

  test("知らせが来ないときは、上限で実際の状態を見る（出ていれば true）", async () => {
    const { P, video } = makeSandbox({ webkitMode: "inline" });
    /* 知らせは来ないが、実際には出ている（時間切れのときに状態を見る道） */
    video.webkitPresentationMode = "picture-in-picture";
    const ok = await P.waitWebkitPip(20);
    assert.equal(ok, true, "時間切れでも、実際に出ていれば true");
    assert.equal(video.listenerCount("webkitpresentationmodechanged"), 0);
  });

  test("知らせも来ず、出てもいないときは false（そこで「開けませんでした」）", async () => {
    const { P, video } = makeSandbox({ webkitMode: "inline" });
    video.webkitSetPresentationMode = () => {};   /* 何も起きない（知らせも来ない・出てもいない） */
    assert.equal(await P.waitWebkitPip(20), false);
    assert.equal(await P.pipEnterWebkit(), false);
  });
});

describe("trk265 配線（本文の目印）", () => {
  test("M1：閉じるのは 1 か所（exitPip と closeMedia の両方から呼ぶ）", () => {
    assert.equal((src.match(/await leavePipBoth\(\);/g) || []).length, 1, "exitPip から");
    assert.ok(src.includes("leavePipBoth();   /* 📌 trk265（M1）"), "closeMedia から");
    assert.ok(!/else if \(core\.video && typeof core\.video\.webkitSetPresentationMode/.test(src),
      "if / else の取りこぼしが残っていない");
    assert.ok(src.includes("pipActive = pipActuallyOn();"), "閉じたあとは実際の状態に合わせる");
    assert.ok(src.includes("const pipOk = pipSupported();"));
  });

  test("R1：待ち方をイベントにし、遅れて出た場合に「開けませんでした」と言わない", () => {
    assert.ok(src.includes("function waitWebkitPip(ms = 2500)"));
    assert.ok(src.includes("const waiting = waitWebkitPip();"), "呼ぶ前に待ち始める");
    assert.ok(src.includes("const ok = await waiting;"));
    assert.ok(src.includes("pipActive = ok || pipIsOn();"));
    assert.ok(src.includes("if (!pipActive) {"));
    assert.ok(!src.includes("for (let i = 0; i < 12"), "1.2 秒のポーリングをやめた");
  });

  test("R3：押せない理由は、見える1行＋読み上げ", () => {
    assert.ok(src.includes('pipWhy = core.el("p", "mediaPipWhy hint")'));
    assert.ok(src.includes('pipWhy.id = "mediaPipWhy"'));
    assert.ok(src.includes("controls.after(pipWhy);"));
    assert.ok(src.includes('pipNode.setAttribute("aria-describedby", "mediaPipWhy")'));
    /* trk266（F1）：行を出すかは pipWhyVisible が決める（Firefox で出しっぱなしにしない） */
    assert.ok(src.includes("const whyOn = pipWhyVisible({ ok: pipOk, ready, key: whyKey });"));
    assert.ok(css.includes(".mediaPipWhy{"), "見える文字の体裁");
    assert.ok(css.includes(".mediaPipWhy[hidden]{display:none!important}"));
  });

  test("Q4：名前を実態に合わせた（UA では見分けない）", () => {
    assert.ok(src.includes("function pipStandaloneApp()"));
    assert.ok(!src.includes("pipHomeApp"), "古い名前が残っていない");
    assert.ok(src.includes("macOS の Dock"), "コメントが macOS も含む");
    assert.ok(src.includes('matchMedia("(display-mode: standalone)")'), "判定そのものは変えない");
  });

  test("4言語：押せない理由は、ホーム画面と Dock の両方に触れる", () => {
    assert.equal((src.match(/mediaPipHomeApp:"/g) || []).length, 4);
    assert.ok(src.includes("ホーム画面や Dock"));
    assert.ok(src.includes("Home Screen or Dock"));
    assert.ok(src.includes("主屏幕或 Dock"));
    assert.ok(src.includes("홈 화면이나 Dock"));
  });
});

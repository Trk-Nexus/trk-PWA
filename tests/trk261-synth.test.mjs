// SPDX-License-Identifier: GPL-3.0-or-later
/* 🎹 trk261：シンセの鍵盤（25／49／61／88 鍵・幅の合わせ方）と MIDI 入力の見張り
 *
 * ブラウザを起動しないテストなので、`js/synth-mode.js` の中の
 * 「純粋な計算」の範囲（目印で囲んだ所）を切り出して vm で読みます。
 * 配線（Web MIDI の受け口・設定の保存）は、本文に目印があるかで確かめます。
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const synthSrc = read("js/synth-mode.js");
const coreSrc = read("js/core.js");
const html = read("index.html");

const START = "/* ==== 純粋な計算（trk261";
const END = "/* ==== 純粋な計算 ここまで ==== */";
const from = synthSrc.indexOf(START), to = synthSrc.indexOf(END);
assert.ok(from > 0 && to > from, "「純粋な計算」の目印が見つかる");
const sandbox = { Object, Array, Math, Number, String, Set, Map, JSON };
vm.createContext(sandbox);
vm.runInContext(synthSrc.slice(from, to) + `
;globalThis.P = { KEY_RANGES, KEY_RANGE_IDS, KEY_FIT_IDS, keyRangeFor, whiteKeyCount, pianoLayoutFor,
  parseMidiMessage, bendOffsetFromValue, keyMapFromLegacy, sanitizeKeyMap, keyMapMidiFor, isMappableKeyCode };
`, sandbox, { filename: "js/synth-mode.js#pure" });
const P = sandbox.P;

describe("trk261：鍵盤の広さ", () => {
  test("25／49／61／88 鍵の範囲と白鍵の本数", () => {
    assert.deepEqual([...P.KEY_RANGE_IDS], ["25", "49", "61", "88"]);
    const first = { "25": 48, "49": 36, "61": 36, "88": 21 };
    const last = { "25": 72, "49": 84, "61": 96, "88": 108 };
    const whites = { "25": 15, "49": 29, "61": 36, "88": 52 };
    for (const id of P.KEY_RANGE_IDS) {
      const r = P.keyRangeFor(id);
      assert.equal(r.first, first[id], `${id} 鍵の最低音`);
      assert.equal(r.last, last[id], `${id} 鍵の最高音`);
      assert.equal(P.whiteKeyCount(r), whites[id], `${id} 鍵の白鍵`);
    }
    /* 88 鍵は A0（21）から C8（108）。白鍵 52 本は実物と同じ */
    assert.equal(P.whiteKeyCount(P.keyRangeFor("88")), 52);
  });

  test("知らない値・未設定は従来の25鍵（C3–C5）に落ちる", () => {
    for (const bad of ["", "0", "37", "76", null, undefined, "abc"]) {
      const r = P.keyRangeFor(bad);
      assert.equal(r.first, 48); assert.equal(r.last, 72);
    }
  });
});

describe("trk261：鍵盤の幅の合わせ方（fit／scroll／shrink）", () => {
  test("fit：収まるなら広げ、はみ出すなら縮める", () => {
    /* 25 鍵（630px）が 1200px の画面に収まる → 1.28 倍まで広げる */
    const wide = P.pianoLayoutFor(15, 1200, "fit");
    assert.equal(wide.scale, 1.28); assert.equal(wide.scroll, false);
    /* 88 鍵（2184px）が 1200px → 縮めて収める（横スクロールなし） */
    const fitted = P.pianoLayoutFor(52, 1200, "fit");
    assert.ok(fitted.scale > 0.5 && fitted.scale < 1, `scale=${fitted.scale}`);
    assert.equal(fitted.scroll, false);
    assert.ok(2184 * fitted.scale <= 1200 + 1);
    /* スマホ幅（390px）では下限 0.45 倍まで縮め、それでも入らないので横スクロール */
    const phone = P.pianoLayoutFor(52, 390, "fit");
    assert.equal(phone.scale, 0.45); assert.equal(phone.scroll, true);
  });

  test("scroll：いつも等倍・入らなければ横スクロール", () => {
    const phone = P.pianoLayoutFor(52, 390, "scroll");
    assert.equal(phone.scale, 1); assert.equal(phone.scroll, true);
    const wide = P.pianoLayoutFor(15, 1200, "scroll");
    assert.equal(wide.scale, 1); assert.equal(wide.scroll, false);
  });

  test("shrink：いつも1画面（下限 0.28 倍）", () => {
    const phone = P.pianoLayoutFor(52, 390, "shrink");
    assert.ok(phone.scale >= 0.28 && phone.scale < 0.3);
    assert.equal(phone.scroll, false);
    assert.equal(P.pianoLayoutFor(15, 900, "shrink").scale, 1);
  });

  test("幅が測れない（0）ときは等倍・スクロールなし", () => {
    assert.deepEqual({ ...P.pianoLayoutFor(52, 0, "fit") }, { scale: 1, scroll: false });
  });
});

describe("trk261：MIDI の読み取り", () => {
  test("ノートオン・ノートオフ（ベロシティ0はオフ扱い）", () => {
    assert.deepEqual({ ...P.parseMidiMessage([0x90, 60, 100]) }, { type:"noteon", note:60, velocity:100, channel:1 });
    assert.deepEqual({ ...P.parseMidiMessage([0x90, 60, 0]) }, { type:"noteoff", note:60, velocity:0, channel:1 });
    assert.deepEqual({ ...P.parseMidiMessage([0x80, 62, 12]) }, { type:"noteoff", note:62, velocity:12, channel:1 });
    /* チャンネルは 1 始まり。0x95 は 6 チャンネル */
    assert.equal(P.parseMidiMessage([0x95, 72, 1]).channel, 6);
  });

  test("サステイン（CC64）とオールノートオフ（CC123）", () => {
    assert.deepEqual({ ...P.parseMidiMessage([0xB0, 64, 127]) }, { type:"cc", controller:64, value:127, channel:1 });
    assert.equal(P.parseMidiMessage([0xB0, 123, 0]).controller, 123);
  });

  test("ピッチベンド（14bit）", () => {
    assert.equal(P.parseMidiMessage([0xE0, 0x00, 0x40]).value, 8192);
    assert.equal(P.parseMidiMessage([0xE0, 0x7f, 0x7f]).value, 16383);
    assert.equal(P.parseMidiMessage([0xE0, 0x00, 0x00]).value, 0);
  });

  test("関係ないメッセージ・短すぎるデータは無視する", () => {
    assert.equal(P.parseMidiMessage([0x90]), null);
    assert.equal(P.parseMidiMessage([]), null);
    assert.equal(P.parseMidiMessage(null), null);
    assert.equal(P.parseMidiMessage([0xF8, 0, 0]), null);   /* クロック */
    assert.equal(P.parseMidiMessage([0xC0, 5]), null);      /* プログラムチェンジ（音は出ない） */
  });

  test("ベンドの半音換算（既定 ±2半音）", () => {
    assert.equal(P.bendOffsetFromValue(8192), 0);
    assert.ok(Math.abs(P.bendOffsetFromValue(16383) - 2) < 0.01);
    assert.ok(Math.abs(P.bendOffsetFromValue(0) + 2) < 0.01);
    assert.ok(Math.abs(P.bendOffsetFromValue(99999) - 2) < 0.01);   /* 範囲外は丸める */
  });
});

describe("trk261：キー割り当て（音番号で持つ）", () => {
  const legacy = ["KeyZ", "KeyS", "KeyX", "KeyD", "KeyC", "", "", "", "", "", "", "",
    "KeyQ", "Digit2", "KeyW"];

  test("旧い配列（C3 基準・25 個）を音番号へ読み替える", () => {
    const full = P.keyMapFromLegacy(["KeyZ", "KeyS", "KeyX", "KeyD", "KeyC", "KeyV", "KeyG", "KeyB", "KeyH", "KeyN", "KeyJ", "KeyM",
      "KeyQ", "Digit2", "KeyW", "Digit3", "KeyE", "KeyR", "Digit5", "KeyT", "Digit6", "KeyY", "Digit7", "KeyU", "KeyI"]);
    assert.equal(full[48], "KeyZ");   /* C3 */
    assert.equal(full[60], "KeyQ");   /* C4（13 個目） */
    assert.equal(full[72], "KeyI");   /* C5 */
    assert.equal(full[47], undefined);
  });

  test("移行しても、以前の割り当てが消えない", () => {
    const map = P.sanitizeKeyMap(legacy.concat(Array(10).fill("")));
    assert.equal(map[48], "KeyZ");
    assert.equal(map[52], "KeyC");
    assert.equal(map[60], "KeyQ");
    assert.equal(P.keyMapMidiFor(map, "KeyQ"), 60);
  });

  test("壊れた値は捨てる（範囲外・予約キー・重複・知らない形）", () => {
    assert.deepEqual({ ...P.sanitizeKeyMap({ "60": "KeyA", "61": "KeyA" }) }, { 60: "KeyA" });
    assert.deepEqual({ ...P.sanitizeKeyMap({ "60": "Escape" }) }, {});
    assert.deepEqual({ ...P.sanitizeKeyMap({ "60": "F5" }) }, {});
    assert.deepEqual({ ...P.sanitizeKeyMap({ "60": "Numpad1" }) }, {});
    assert.deepEqual({ ...P.sanitizeKeyMap({ "200": "KeyA" }) }, {});
    assert.deepEqual({ ...P.sanitizeKeyMap({ "abc": "KeyA" }) }, {});
    assert.equal(P.sanitizeKeyMap([1, 2, 3]), null);
    assert.equal(P.sanitizeKeyMap("KeyZ"), null);
    assert.deepEqual({ ...P.sanitizeKeyMap({}) }, {});
  });
});

describe("trk261：配線（本文の目印）", () => {
  test("鍵盤は設定の広さを使う（固定の 48〜72 ではない）", () => {
    assert.ok(!/FIRST_MIDI\s*=\s*48/.test(synthSrc), "固定の範囲が残っていない");
    assert.ok(synthSrc.includes("keyRangeFor(core.settings.synthModeKeyRange)"));
    assert.ok(synthSrc.includes("core.settings.synthModeKeyFit"));
  });

  test("Web MIDI の受け口と、閉じている間の停止がある", () => {
    assert.ok(synthSrc.includes("navigator.requestMIDIAccess"));
    assert.ok(synthSrc.includes("onmidimessage"));
    assert.ok(synthSrc.includes("statechange"));
    assert.ok(synthSrc.includes("if (overlay.hidden) return;"), "閉じている間は鳴らさない");
    assert.ok(synthSrc.includes("sustainedTokens"), "サステインで延ばす音を持つ");
    assert.ok(synthSrc.includes("bendValue"), "ピッチベンドを持つ");
  });

  test("設定の3つは、読み込み・初期化・セーフモード・保存の4か所に出る", () => {
    for (const key of ["synthModeKeyRange", "synthModeKeyFit", "synthMidiAuto"]) {
      const n = (coreSrc.match(new RegExp(key, "g")) || []).length;
      assert.ok(n >= 4, `${key} が ${n} か所しかない`);
    }
  });

  test("4言語すべてに、鍵盤と MIDI の文言がある", () => {
    const keys = ["instKeyboardRange", "instKeyboardFit", "instKeyboardFitScroll", "instMidiTitle", "instMidiConnect",
      "instMidiNone", "instMidiUnsupported", "instMidiDenied", "instMidiConnected", "instMidiMonitor"];
    for (const key of keys) {
      const n = (synthSrc.match(new RegExp(`${key}:`, "g")) || []).length;
      assert.equal(n, 4, `${key} が ${n} 言語しかない`);
    }
  });

  test("index.html は core.js の後で synth-mode.js を読む", () => {
    assert.ok(html.indexOf('src="js/core.js"') < html.indexOf('src="js/synth-mode.js"'));
  });
});

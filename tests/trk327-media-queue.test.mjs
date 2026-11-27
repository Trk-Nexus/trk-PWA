// SPDX-License-Identifier: GPL-3.0-or-later
/* 🎧 trk327：メディアプレイヤー点検表の P1（実装ぶん）の検算。

   守りたい約束：
     ・手動キュー（次に再生／最後へ）は「key だけ」を settings.mediaQueueNext に持ち、100 曲まで・重複なし。
     ・次へ進むときは手動キューを先に消化し、消化したら消える（曲が無くなった key は黙って捨てる）。
     ・「このキューでプレイリストを作る」は押したときだけ・重複を畳む・500 曲まで・保存に失敗したら巻き戻す。
     ・ギャップレス／クロスフェードは**既定オフ**（設定が true のときだけ動く）。
     ・読み込みの表示は無期限にしない（終われば消す・失敗したら理由と再試行）。
     ・文言は 4 言語そろえる。 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const coreSrc = fs.readFileSync(path.join(ROOT, "js/core.js"), "utf8");
const libSrc = fs.readFileSync(path.join(ROOT, "js/library.js"), "utf8");
const playerSrc = fs.readFileSync(path.join(ROOT, "js/media-player-mode.js"), "utf8");

/* vm の中で作られた配列・オブジェクトは「別の世界」のもの。deepStrictEqual は中身が同じでも
   参照の型が違うと落ちるので、こちらの世界の値へ写してから比べる。 */
const plain = v => JSON.parse(JSON.stringify(v));
const pick = (src, re, label) => {
  const m = src.match(re);
  assert.ok(m, `${label} を抜き出せる`);
  return m[0];
};

/* ---------- core.js の掃除 ---------- */
describe("保存値の掃除（core.js）", () => {
  const sandbox = { console, Math, Number, String, Array, Set, Object };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`${pick(coreSrc, /function cleanMediaQueue\(v, max = 100\) \{[\s\S]*?\n\}/, "cleanMediaQueue()")}
${pick(coreSrc, /function clampCrossfade\(v\) \{[\s\S]*?\n\}/, "clampCrossfade()")}
window.__clean = cleanMediaQueue; window.__cf = clampCrossfade;`, sandbox, { filename: "js/core.js#trk327" });

  test("cleanMediaQueue(): 文字列だけ・重複なし・上限あり・壊れた値は空", () => {
    const clean = sandbox.window.__clean;
    assert.deepEqual(plain(clean(null)), []);
    assert.deepEqual(plain(clean("A")), []);
    assert.deepEqual(plain(clean(["A", "A", "B", 3, "", null, "A"])), ["A", "B"]);
    assert.deepEqual(plain(clean(["x".repeat(201), "ok"])), ["ok"], "長すぎる key は捨てる");
    assert.equal(clean(Array.from({ length: 130 }, (_, i) => `k${i}`)).length, 100, "既定は 100 曲まで");
    assert.equal(clean(Array.from({ length: 10 }, (_, i) => `k${i}`), 4).length, 4, "上限は引数で変えられる");
  });

  test("clampCrossfade(): 0〜12 の整数・0 はオフ・壊れた値は 0", () => {
    const cf = sandbox.window.__cf;
    assert.equal(cf(0), 0);
    assert.equal(cf(-3), 0);
    assert.equal(cf("8"), 8);
    assert.equal(cf(30), 12);
    assert.equal(cf(4.6), 5);
    assert.equal(cf(NaN), 0);
    assert.equal(cf(undefined), 0);
  });

  test("既定はどちらもオフ（規定オフ）", () => {
    assert.match(coreSrc, /mediaGapless: prefs\.mediaGapless === true/);
    assert.match(coreSrc, /mediaCrossfade: num\(prefs\.mediaCrossfade, 0, 12, 0\)/);
    /* 既定値の確認（既定オフ）。true / 正の数を既定にしない */
    assert.equal(/mediaGapless:\s*true/.test(coreSrc), false, "ギャップレスの既定は false");
    assert.match(coreSrc, /mediaQueueNext:/);
  });
});

/* ---------- 手動キュー ---------- */
describe("手動の「次に再生」キュー（media-player-mode.js）", () => {
  const bodies = [
    pick(playerSrc, /const manualQueue = \(\) => [\s\S]*?;\n/, "manualQueue()"),
    pick(playerSrc, /function saveManualQueue\(list\) \{[\s\S]*?\n\}/, "saveManualQueue()"),
    pick(playerSrc, /function enqueueNext\(key\) \{[\s\S]*?\n\}/, "enqueueNext()"),
    pick(playerSrc, /function enqueueLast\(key\) \{[\s\S]*?\n\}/, "enqueueLast()"),
    pick(playerSrc, /function dequeueManual\(key\) \{[\s\S]*?\n\}/, "dequeueManual()"),
    pick(playerSrc, /function peekNextMediaSong\(dir = 1\) \{[\s\S]*?\n\}/, "peekNextMediaSong()"),
    pick(playerSrc, /function nextMediaSong\(dir = 1\) \{[\s\S]*?\n\}/, "nextMediaSong()"),
  ].join("\n");

  function ctx(seed, songs) {
    const core = { settings: { mediaQueueNext: seed || [] }, currentSong: null, saveUserPrefs: () => true };
    const sandbox = {
      console, Math, Number, String, Array,
      core, songs, shuffle: false,
      renderQueue() {}, showMediaStatus(k, v) { (sandbox.status = sandbox.status || []).push({ k, v }); },
      mpSongs: () => songs,
      mediaCandidates: () => songs,
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(`${bodies}\nwindow.__api = { manualQueue, enqueueNext, enqueueLast, dequeueManual, peekNextMediaSong, nextMediaSong, saveManualQueue };`,
      sandbox, { filename: "js/media-player-mode.js#queue" });
    return sandbox;
  }
  const songs = [{ key: "A" }, { key: "B" }, { key: "C" }];

  test("次に再生＝先頭へ、最後へ＝末尾へ。同じ曲は二重に入れない", () => {
    const s = ctx([], songs);
    const api = s.window.__api;
    assert.deepEqual(plain(api.manualQueue()), []);
    api.enqueueLast("C");
    api.enqueueNext("A");
    assert.deepEqual(plain(api.manualQueue()), ["A", "C"]);
    api.enqueueNext("C");                 /* すでに居る → 先頭へ移す（重複は作らない） */
    assert.deepEqual(plain(api.manualQueue()), ["C", "A"]);
    assert.equal(s.core.settings.mediaQueueNext.length, 2);
    assert.equal(s.status.at(-1).k, "mediaQueueAdded");
    assert.equal(s.status.at(-1).v.n, 2);
  });

  test("外す（dequeueManual）と、知らない値は受け付けない", () => {
    const s = ctx(["A", "B"], songs);
    const api = s.window.__api;
    api.dequeueManual("A");
    assert.deepEqual(plain(api.manualQueue()), ["B"]);
    api.dequeueManual("Z");
    assert.deepEqual(plain(api.manualQueue()), ["B"], "居ない key で壊れない");
    assert.equal(api.enqueueNext(""), false);
    assert.equal(api.enqueueNext(null), false);
    assert.deepEqual(plain(api.manualQueue()), ["B"]);
  });

  test("nextMediaSong() はキューを先に消化し、消化したら消す（無い曲は捨てる）", () => {
    const s = ctx(["gone", "C", "A"], songs);
    const api = s.window.__api;
    assert.equal(api.peekNextMediaSong(1).key, "C", "先読みはキューを減らさない");
    assert.deepEqual(plain(api.manualQueue()), ["gone", "C", "A"]);
    assert.equal(api.nextMediaSong(1).key, "C");
    assert.deepEqual(plain(s.core.settings.mediaQueueNext), ["A"], "gone は捨て、C は消費");
    assert.equal(api.nextMediaSong(1).key, "A");
    assert.deepEqual(plain(s.core.settings.mediaQueueNext), []);
    /* キューが空になったら通常の順番（先頭）へ戻る */
    assert.equal(api.nextMediaSong(1).key, "A");
  });

  test("キューは保存される（core.saveUserPrefs）・100 曲まで", () => {
    let saved = 0;
    const s = ctx([], songs);
    s.core.saveUserPrefs = () => { saved++; return true; };
    const api = s.window.__api;
    api.enqueueNext("A");
    assert.equal(saved, 1);
    api.saveManualQueue(Array.from({ length: 130 }, (_, i) => `k${i}`));
    assert.equal(s.core.settings.mediaQueueNext.length, 100);
  });
});

/* ---------- キューからプレイリスト ---------- */
describe("キューからプレイリストを作る（library.createPlaylistFromSongs）", () => {
  const body = pick(libSrc, /function createPlaylistFromSongs\(name, keys\) \{[\s\S]*?\n\}/, "createPlaylistFromSongs()");

  function ctx(saveOk = true) {
    const sandbox = {
      console, Math, Date, Number, String, Array, Set,
      core: { settings: { playlists: [] }, saveUserPrefs: () => saveOk },
      renderLib() {},
      plSanitize: p => (p && p.songs.length ? Object.assign({}, p, { songs: [...new Set(p.songs)] }) : null),
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(`${body}\nwindow.__mk = createPlaylistFromSongs;`, sandbox, { filename: "js/library.js#pl-from-queue" });
    return sandbox;
  }

  test("押したときだけ作る（重複は畳む・名前は 40 文字まで）", () => {
    const s = ctx();
    const r = s.window.__mk("  キュー  ", ["A", "A", "B", "", 3]);
    assert.equal(r.ok, true);
    assert.equal(r.count, 2);
    assert.equal(r.name, "キュー");
    assert.equal(s.core.settings.playlists.length, 1);
    const p = s.core.settings.playlists[0];
    assert.deepEqual(plain(p.songs), ["A", "B"]);
    assert.equal(p.tags.includes("queue"), true);
  });

  test("空・壊れた入力では作らない", () => {
    const s = ctx();
    assert.deepEqual(plain(s.window.__mk("x", [])), { ok: false, reason: "empty" });
    assert.deepEqual(plain(s.window.__mk("x", "A")), { ok: false, reason: "empty" });
    assert.deepEqual(plain(s.window.__mk("x", [null, 4, ""])), { ok: false, reason: "empty" });
    assert.equal(s.core.settings.playlists.length, 0);
  });

  test("500 曲まで・名前が空なら既定の名前", () => {
    const s = ctx();
    const r = s.window.__mk("", Array.from({ length: 620 }, (_, i) => `k${i}`));
    assert.equal(r.ok, true);
    assert.equal(r.count, 500);
    assert.equal(r.name, "Queue");
  });

  test("保存に失敗したら巻き戻す（リストを増やさない）", () => {
    const s = ctx(false);
    const r = s.window.__mk("n", ["A"]);
    assert.equal(r.ok, false);
    assert.equal(r.reason, "save");
    assert.equal(s.core.settings.playlists.length, 0);
  });
});

/* ---------- 画面の配線 ---------- */
describe("画面の配線と既定オフの担保", () => {
  test("キューの行には「次に再生」「最後へ」「外す」、見出しにはプレイリスト化がある", () => {
    assert.match(playerSrc, /function queueRow\(it, opts\)/);
    assert.match(playerSrc, /enqueueNext\(it\.key\)/);
    assert.match(playerSrc, /enqueueLast\(it\.key\)/);
    assert.match(playerSrc, /dequeueManual\(it\.key\)/);
    assert.match(playerSrc, /createPlaylistFromSongs\(name, list\)/);
    assert.match(playerSrc, /mediaQueuePlaylist/);
  });

  test("ギャップレスは設定が true のときだけ動き、曲が変われば先読みを捨てる", () => {
    assert.match(playerSrc, /if \(core\.settings\.mediaGapless !== true\) \{ disposeGapless\(\); return; \}/);
    assert.match(playerSrc, /core\.on\("beforeLoad", \(\) => \{[^}]*disposeGapless\(\)/);
    assert.match(playerSrc, /timeupdate[^\n]*preloadNextForGapless\(\)/);
  });

  test("クロスフェードは曲を重ねない（2 本目の再生を作らない）・曲の終わりで静かに閉じる", () => {
    const fadeOut = pick(playerSrc, /function applyFadeOut\(\) \{[\s\S]*?\n\}/, "applyFadeOut()");
    assert.match(fadeOut, /core\.video\.volume/);
    const crossfadeBlock = pick(playerSrc, /\/\* 🎧 trk327：クロスフェード[\s\S]*?function applyFadeOut/, "クロスフェードの節");
    assert.equal(/createElement\("audio"\)/.test(crossfadeBlock), false, "曲を重ねない（要素を増やさない）");
    assert.match(playerSrc, /timeupdate[^\n]*applyFadeOut\(\)/);
  });

  test("読み込み中・詰まり・失敗と再試行が配線されている（無期限にしない）", () => {
    assert.match(playerSrc, /addEventListener\("waiting", \(\) => \{ if \(mediaActive\(\)\) showBuffer\("mediaBuffering"\)/);
    assert.match(playerSrc, /addEventListener\("stalled"[\s\S]{0,260}mediaStalled/);
    assert.match(playerSrc, /addEventListener\("canplay", \(\) => \{ clearBuffer\(\); \}\)/);
    assert.match(playerSrc, /addEventListener\("error"[\s\S]{0,160}mediaPlaybackFailed/);
    assert.match(playerSrc, /wirePlaybackHealth\(\);/);
    assert.match(playerSrc, /function retryPlayback\(\)/);
  });

  test("MediaSession は再生状態と 2 サイズの絵を持つ", () => {
    assert.match(playerSrc, /playbackState/);
    assert.match(playerSrc, /icons\/icon-192\.png/);
    assert.match(playerSrc, /icons\/icon-512\.png/);
  });
});

/* ---------- 4 言語 ---------- */
describe("文言は ja/en/zh/ko の 4 言語そろえる", () => {
  const keys = [
    "mediaBuffering", "mediaStalled", "mediaPlaybackFailed", "mediaRetrying", "mediaRetry",
    "mediaRetryNoSource", "mediaResumed", "mediaResumedRewind",
    "mediaQueueNextTitle", "mediaQueueNextHint", "mediaQueueRest", "mediaQueuePlayNext",
    "mediaQueueAdd", "mediaQueueRemove", "mediaQueueAdded",
    "mediaQueuePlaylist", "mediaQueuePlaylistName", "mediaQueuePlaylistDefault",
    "mediaQueuePlaylistDone", "mediaQueuePlaylistEmpty", "mediaQueuePlaylistFail",
    "mediaCrossfadeLabel", "mediaCrossfadeOff", "mediaCrossfadeHint", "mediaCrossfadeSet",
    "mediaGaplessLabel", "mediaGaplessHint",
  ];
  for (const k of keys) {
    test(`${k} は 4 言語ぶんある`, () => {
      const n = (playerSrc.match(new RegExp(`\\n  ${k}:"`, "g")) || []).length;
      assert.equal(n, 4, `${k} が ${n} 言語しか無い`);
    });
  }
});

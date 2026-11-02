// SPDX-License-Identifier: GPL-3.0-or-later
/* ============================================================================
   trk! viewer-chrome.js — 🎬 映像を見るときの「操作パネルの出かた」と「字幕の置き場所」
   trk262。映像のまわりに何を出すかを、**純粋な計算だけ**で決める小さな部品。

   ・🖥 全画面ビューア（js/video-max.js）と ▶ メディアプレーヤー（js/media-player-mode.js）が
     同じ設定（core.settings.videoMaxChrome）を見て、同じ判断を使う。
   ・暗くする膜は作りません（バーは半透明の帯だけ）。設定の値は 4 つ：
       full   触れると上（曲名）＋下（操作）を出す … 今までどおり
       bottom 触れると下（操作）だけを出す
       always 下（操作）を出しっぱなし
       none   何も出さない（映像だけ）
   ・none でも閉じられるように、**触れたら出す逃げ道**を判断の中に入れておく
     （上端・下端の細い帯／一時停止中／ESC は呼び出し側がそのまま受ける）。
   ・字幕の置き場所（下・中央・上）と大きさ（小・中・大）も、文字列の寄せ方だけをここで決める。
   ============================================================================ */
"use strict";
(() => {
  const MODES = ["full", "bottom", "always", "none"];
  const SUBS_POS = ["bottom", "middle", "top"];
  const SUBS_SIZE = ["small", "normal", "large"];
  const IDLE_MS = 2600;      /* 触らないと消えるまで（従来と同じ） */
  const REVEAL_MS = 3000;    /* none のとき、端に触れてから出しておく長さ */
  const EDGE_PX = 24;        /* 「端」とみなす帯の太さ（上端・下端） */

  /* 知らない値・未設定は今までどおり（full）へ寄せる */
  function mode(value) { return MODES.includes(value) ? value : "full"; }
  function subsPos(value) { return SUBS_POS.includes(value) ? value : "bottom"; }
  function subsSize(value) { return SUBS_SIZE.includes(value) ? value : "normal"; }

  /* バーの出かた。
     options = { touched:触れたばかり, revealing:端に触れて出している最中, paused:止まっている }
     → { top:曲名の帯, bottom:操作の帯 } */
  function bars(modeValue, options) {
    const m = mode(modeValue);
    const o = options || {};
    const touched = !!o.touched;
    const revealing = !!o.revealing;
    const paused = !!o.paused;
    if (paused) return { top: m === "full", bottom: true };   /* 止めている間は必ず操作できる */
    if (m === "always") return { top: false, bottom: true };
    if (m === "bottom") return { top: false, bottom: touched || revealing };
    if (m === "none") return { top: false, bottom: revealing };
    return { top: touched, bottom: touched };                 /* full */
  }

  /* ▶ メディアプレーヤー：操作列を触らないと隠すか。
     全画面と同じ設定を使うが、あちらは「操作列が唯一の入口」なので
     bottom と none は同じ扱い（再生中だけ隠し、触れたら出す・止めたら出す）。 */
  function mediaAutoHide(modeValue, playing) {
    return (mode(modeValue) === "bottom" || mode(modeValue) === "none") && !!playing;
  }

  /* 字幕の大きさ（CSS の font-size に掛ける倍率） */
  function subsScale(sizeValue) {
    const s = subsSize(sizeValue);
    return s === "small" ? 0.8 : s === "large" ? 1.35 : 1;
  }

  /* 字幕の見た目を data 属性で渡す（CSS 側が [data-pos]／[data-size] で拾う） */
  function subsAttrs(posValue, sizeValue) {
    return { pos: subsPos(posValue), size: subsSize(sizeValue), scale: subsScale(sizeValue) };
  }

  window.Trk = window.Trk || {};
  window.Trk.viewerChrome = Object.freeze({
    MODES, SUBS_POS, SUBS_SIZE, IDLE_MS, REVEAL_MS, EDGE_PX,
    mode, bars, mediaAutoHide, subsPos, subsSize, subsScale, subsAttrs
  });
})();
/* ✅ viewer-chrome.js 完了 */

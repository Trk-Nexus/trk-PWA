// SPDX-License-Identifier: GPL-3.0-or-later
/* 🎬 trk262：映像の操作パネルの出かた（full／bottom／always／none）と、
 * 字幕の置き場所（下・中央・上）・大きさ（小・中・大）の見張り。
 *
 * ブラウザを起動しないテストなので、`js/viewer-chrome.js`（純粋な計算だけの小さな部品）を
 * vm で読み、判断の戻り値をそのまま確かめます。配線は本文の目印と CSS で確かめます。
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const chromeSrc = read("js/viewer-chrome.js");
const vmSrc = read("js/video-max.js");
const mediaSrc = read("js/media-player-mode.js");
const coreSrc = read("js/core.js");
const css = read("css/style.css");
const html = read("index.html");
const i18n = read("js/i18n.js");

const sandbox = { window: {}, Object, Array, Math, Number, String, Boolean };
vm.createContext(sandbox);
vm.runInContext(chromeSrc, sandbox, { filename: "js/viewer-chrome.js" });
const VC = sandbox.window.Trk.viewerChrome;

describe("trk262：操作パネルの出かた（4つ）", () => {
  test("選択肢は full／bottom／always／none。知らない値は full へ", () => {
    assert.deepEqual([...VC.MODES], ["full", "bottom", "always", "none"]);
    for (const bad of ["", "bottoms", null, undefined, 0, "FULL", {}]) assert.equal(VC.mode(bad), "full");
    for (const ok of VC.MODES) assert.equal(VC.mode(ok), ok);
  });

  test("full：触れると上下。触れていないと出さない（今までどおり）", () => {
    assert.deepEqual({ ...VC.bars("full", { touched: true }) }, { top: true, bottom: true });
    assert.deepEqual({ ...VC.bars("full", { touched: false }) }, { top: false, bottom: false });
  });

  test("bottom：触れると下だけ。上（曲名）は出さない", () => {
    assert.deepEqual({ ...VC.bars("bottom", { touched: true }) }, { top: false, bottom: true });
    assert.deepEqual({ ...VC.bars("bottom", { touched: false }) }, { top: false, bottom: false });
    /* 端に触れて出している最中も下だけ */
    assert.deepEqual({ ...VC.bars("bottom", { touched: false, revealing: true }) }, { top: false, bottom: true });
  });

  test("always：下のバーは出しっぱなし（上は出さない）", () => {
    assert.deepEqual({ ...VC.bars("always", { touched: false }) }, { top: false, bottom: true });
    assert.deepEqual({ ...VC.bars("always", { touched: true }) }, { top: false, bottom: true });
  });

  test("none：何も出さない。ただし端に触れて出している間と、止めている間は出せる（逃げ道）", () => {
    assert.deepEqual({ ...VC.bars("none", { touched: true }) }, { top: false, bottom: false }, "触れても出さない");
    assert.deepEqual({ ...VC.bars("none", { touched: true, revealing: true }) }, { top: false, bottom: true });
    assert.deepEqual({ ...VC.bars("none", { touched: false, paused: true }) }, { top: false, bottom: true }, "止めたら出る");
    assert.deepEqual({ ...VC.bars("full", { touched: false, paused: true }) }, { top: true, bottom: true });
    assert.deepEqual({ ...VC.bars("bottom", { touched: false, paused: true }) }, { top: false, bottom: true });
  });

  test("引数なしでも落ちない（呼び出し側の取り違えに耐える）", () => {
    assert.equal(VC.bars().bottom, false);
    assert.deepEqual({ ...VC.bars("full") }, { top: false, bottom: false });
  });
});

describe("trk262：▶ メディアプレーヤーで操作列を隠す条件", () => {
  test("bottom／none のときだけ、再生中に隠す", () => {
    assert.equal(VC.mediaAutoHide("bottom", true), true);
    assert.equal(VC.mediaAutoHide("none", true), true);
    assert.equal(VC.mediaAutoHide("bottom", false), false, "止まっているときは出しておく");
    assert.equal(VC.mediaAutoHide("full", true), false, "今までどおり");
    assert.equal(VC.mediaAutoHide("always", true), false);
    assert.equal(VC.mediaAutoHide("なにか", true), false);
  });

  test("消えるまで 2.6 秒・端の帯 24px・出しておくのは 3 秒", () => {
    assert.equal(VC.IDLE_MS, 2600);
    assert.equal(VC.EDGE_PX, 24);
    assert.equal(VC.REVEAL_MS, 3000);
  });
});

describe("trk262：字幕の置き場所と大きさ", () => {
  test("置き場所は bottom／middle／top。知らない値は bottom へ", () => {
    assert.deepEqual([...VC.SUBS_POS], ["bottom", "middle", "top"]);
    for (const bad of ["", "center", null, undefined, "BOTTOM"]) assert.equal(VC.subsPos(bad), "bottom");
    assert.equal(VC.subsPos("top"), "top");
  });

  test("大きさは small／normal／large と倍率（0.8／1／1.35）", () => {
    assert.deepEqual([...VC.SUBS_SIZE], ["small", "normal", "large"]);
    assert.equal(VC.subsSize("huge"), "normal");
    assert.equal(VC.subsScale("small"), 0.8);
    assert.equal(VC.subsScale("normal"), 1);
    assert.equal(VC.subsScale("large"), 1.35);
    assert.equal(VC.subsScale(undefined), 1);
    assert.deepEqual({ ...VC.subsAttrs("top", "large") }, { pos: "top", size: "large", scale: 1.35 });
  });
});

describe("trk262：配線（本文の目印）", () => {
  test("🖥 全画面ビューアに下のバー・出し入れ・逃げ道がある", () => {
    for (const mark of [
      'bottomBar = core.el("div", "videoMaxBottom")',
      "seekRange.type = \"range\"",
      "seekRange.className = \"videoMaxSeekRange\"",
      "function syncChrome()",
      "function revealChrome()",
      "function insideEdgeZone(",
      "function onViewerMove(",
      "vc.bars(m, { touched: !idle, revealing: momentarilyRevealing(), paused: !!videoEl.paused })",
      "root.dataset.chrome = m",
      "root.classList.toggle(\"chromeShown\", !!show.bottom)"
    ]) assert.ok(vmSrc.includes(mark), mark);
    /* 操作は 1 か所（上と下で二重に持たない） */
    assert.ok(vmSrc.includes('tools.append(playNode, zoomChip, fsNode, closeNode)'));
    assert.ok(vmSrc.includes("bottomBar.append(backNode, fwdNode, seekRange, timeNode, tools)"));
    assert.ok(vmSrc.includes("topBar.append(titleNode)"));
  });

  test("映像の外・ESC・端・一時停止が逃げ道として残っている", () => {
    assert.ok(vmSrc.includes('if (e.code === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); closeMax(); return; }'));
    assert.ok(vmSrc.includes("if (e.target === stage || e.target === noteNode) { closeMax(); return; }"));
    assert.ok(vmSrc.includes("if (chromeMode() === \"none\" && insideEdgeZone(e.clientY)) revealChrome();"));
    assert.ok(vmSrc.includes("paused: !!videoEl.paused"));
  });

  test("▶ メディアプレーヤーは、触れたら戻し・再生中だけ隠す", () => {
    assert.ok(mediaSrc.includes("function syncMediaChrome()"));
    assert.ok(mediaSrc.includes("function pokeMediaChrome()"));
    assert.ok(mediaSrc.includes("function syncSubsLook()"));
    assert.ok(mediaSrc.includes('dialog.classList.add("mediaChromeIdle")'));
    assert.ok(mediaSrc.includes('dialog.addEventListener("pointermove", pokeMediaChrome)'));
    assert.ok(mediaSrc.includes("vc.mediaAutoHide(mediaChromeMode(), playingNow())"));
    assert.ok(mediaSrc.includes("clearTimeout(mediaChromeTimer); mediaChromeTimer = 0;"));
  });

  test("字幕パネルに置き場所・大きさの選択と ℹ の案内がある", () => {
    assert.ok(mediaSrc.includes("subsPosNode = document.createElement(\"select\")"));
    assert.ok(mediaSrc.includes("subsSizeNode = document.createElement(\"select\")"));
    assert.ok(mediaSrc.includes('core.el("details", "mediaSubsAuto")'));
    assert.ok(mediaSrc.includes('subsOverlay.dataset.pos = pos'));
    assert.ok(mediaSrc.includes('subsOverlay.dataset.size = size'));
    assert.ok(vmSrc.includes('subsNode.dataset.pos = pos'));
    assert.ok(vmSrc.includes('subsNode.dataset.size = size'));
  });

  test("設定は読み込み・初期化・リセットの3か所にあり、画面の選択とつながっている", () => {
    for (const key of ["videoMaxChrome", "mediaSubsPos", "mediaSubsSize"]) {
      const n = (coreSrc.match(new RegExp(key, "g")) || []).length;
      assert.ok(n >= 3, `${key} が ${n} か所しかない`);
    }
    assert.ok(html.includes('<select id="videoMaxChrome">'));
    for (const v of ["full", "bottom", "always", "none"]) assert.ok(html.includes(`<option value="${v}"`), v);
    assert.ok(read("js/main.js").includes('core.$("videoMaxChrome").addEventListener("change"'));
    /* 読み込み順：viewer-chrome.js は video-max.js より先（core.js の後） */
    assert.ok(html.indexOf('src="js/core.js"') < html.indexOf('src="js/viewer-chrome.js"'));
    assert.ok(html.indexOf('src="js/viewer-chrome.js"') < html.indexOf('src="js/video-max.js"'));
  });

  test("CSS が置き場所・大きさ・操作列の隠し方を持つ", () => {
    assert.ok(css.includes('.videoMaxSubs[data-pos="middle"]'));
    assert.ok(css.includes('.videoMaxSubs[data-pos="top"]'));
    assert.ok(css.includes('.videoMaxSubs[data-size="large"]'));
    assert.ok(css.includes('.mediaSubs[data-pos="middle"]'));
    assert.ok(css.includes('.mediaSubs[data-size="small"]'));
    assert.ok(css.includes(".mediaDialog.mediaChromeIdle .mediaControls"));
    assert.ok(css.includes(".videoMaxBottom{position:absolute"));
    assert.ok(css.includes("#videoMaxView.chromeShown .videoMaxSubs[data-pos=\"bottom\"]"));
  });

  test("4言語の文言（設定の4択・字幕の3択・自動字幕の案内）", () => {
    for (const key of ["videoMaxChrome", "videoChromeFull", "videoChromeBottom", "videoChromeAlways", "videoChromeNone", "videoChromeHint"]) {
      const n = (i18n.match(new RegExp(`${key}:`, "g")) || []).length;
      assert.equal(n, 4, `${key} が ${n} 言語しかない`);
    }
    for (const key of ["mediaSubsPos", "mediaSubsPosBottom", "mediaSubsPosMiddle", "mediaSubsPosTop",
      "mediaSubsSize", "mediaSubsSizeSmall", "mediaSubsSizeNormal", "mediaSubsSizeLarge",
      "mediaSubsAutoTitle", "mediaSubsAutoHint"]) {
      const n = (mediaSrc.match(new RegExp(`${key}:`, "g")) || []).length;
      assert.equal(n, 4, `${key} が ${n} 言語しかない`);
    }
  });

  test("自動字幕の案内は、trk が音を聞かないことを4言語で書いている", () => {
    assert.equal((mediaSrc.match(/Windows＋Ctrl＋L|Windows\+Ctrl\+L/g) || []).length >= 4, true);
    assert.equal((mediaSrc.match(/ライブキャプション|Live Captions|实时字幕|라이브 캡션/g) || []).length >= 4, true);
    assert.ok(!mediaSrc.includes("getUserMedia("), "trk はマイクを取らない");
  });
});

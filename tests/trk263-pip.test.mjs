// SPDX-License-Identifier: GPL-3.0-or-later
/* 📌 trk263：画中画をメディアプレーヤーの外でも残す／画中画の間はこちらの映像を隠す、の見張り。
 *
 * ブラウザーを起動しないテストなので、`js/media-player-mode.js` の中の
 * 「純粋な計算」の範囲（目印で囲んだ所）を切り出して vm で読みます。
 * 配線（閉じるときの判断・案内の1行・設定の保存）は、本文に目印があるかで確かめます。
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const src = read("js/media-player-mode.js");
const coreSrc = read("js/core.js");
const css = read("css/style.css");

const START = "/* ==== 純粋な計算（trk263";
const END = "/* ==== 純粋な計算 ここまで ==== */";
const from = src.indexOf(START), to = src.indexOf(END);
assert.ok(from > 0 && to > from, "「純粋な計算」の目印が見つかる");
const sandbox = { Object };
vm.createContext(sandbox);
vm.runInContext(src.slice(from, to) + `
;globalThis.P = { pipExitPlan, stageVisible, pipNoticeVisible };
`, sandbox, { filename: "js/media-player-mode.js#pure" });
const P = sandbox.P;

describe("trk263：閉じても画中画を残すか", () => {
  test("設定オン＋小窓が出ている＋手で閉じた＋タイトル画面 → 残す", () => {
    assert.equal(P.pipExitPlan({ keep: true, pip: true, close: true, phase: "title" }), "keep");
  });

  test("設定がオフなら閉じる（今までどおり）", () => {
    assert.equal(P.pipExitPlan({ keep: false, pip: true, close: true, phase: "title" }), "exit");
    assert.equal(P.pipExitPlan({ keep: undefined, pip: true, close: true, phase: "title" }), "exit");
  });

  test("小窓が出ていなければ閉じる（何もしない）", () => {
    assert.equal(P.pipExitPlan({ keep: true, pip: false, close: true, phase: "title" }), "exit");
  });

  test("ゲーム開始など手で閉じたのでなければ閉じる（ゲームの曲が小窓に出ない）", () => {
    assert.equal(P.pipExitPlan({ keep: true, pip: true, close: false, phase: "title" }), "exit");
    assert.equal(P.pipExitPlan({ keep: true, pip: true, close: true, phase: "playing" }), "exit");
  });

  test("引数なし・空でも落ちない", () => {
    assert.equal(P.pipExitPlan(), "exit");
    assert.equal(P.pipExitPlan({}), "exit");
  });
});

describe("trk263：画中画の間に、こちらの映像を出すか", () => {
  test("閉じている／開いていても画中画が出ていれば隠す（設定オン）", () => {
    assert.equal(P.stageVisible({ open: false }), false);
    assert.equal(P.stageVisible({ open: true, pip: false, hideOnPip: true }), true);
    assert.equal(P.stageVisible({ open: true, pip: true, hideOnPip: true }), false);
  });

  test("「ここにも表示」を押したときだけ出す", () => {
    assert.equal(P.stageVisible({ open: true, pip: true, hideOnPip: true, shownHere: true }), true);
  });

  test("設定がオフなら、画中画でもそのまま出す（今までどおり）", () => {
    assert.equal(P.stageVisible({ open: true, pip: true, hideOnPip: false }), true);
    assert.equal(P.stageVisible({ open: true, pip: true, hideOnPip: undefined }), true);
  });

  test("案内（1行）は、開いていて・画中画が出ていて・設定オンのときだけ", () => {
    assert.equal(P.pipNoticeVisible({ open: true, pip: true, hideOnPip: true }), true);
    assert.equal(P.pipNoticeVisible({ open: false, pip: true, hideOnPip: true }), false);
    assert.equal(P.pipNoticeVisible({ open: true, pip: false, hideOnPip: true }), false);
    assert.equal(P.pipNoticeVisible({ open: true, pip: true, hideOnPip: false }), false);
  });
});

describe("trk263：配線（本文の目印）", () => {
  test("閉じるときに判断を通し、残すときは止めない", () => {
    assert.ok(src.includes("const keepPip = pipExitPlan({"));
    assert.ok(src.includes("keep: core.settings.mediaPipKeep !== false"));
    assert.ok(src.includes("close: restore === true"));
    assert.ok(src.includes('if (keepPip) exitPlan = "keep";'), "残すときは再生を続ける");
    assert.ok(src.includes("if (exitPlan !== \"keep\") core.video.pause();"));
    assert.ok(src.includes("exitPlan === \"keep\" && !keepPip"), "画中画の間は音量を下げない");
  });

  test("映像の出し入れは、純粋な計算と同じ道を通る", () => {
    assert.ok(src.includes("stageVisible({ open: mediaOpen, pip, hideOnPip, shownHere: pipStageShown })"));
    assert.ok(src.includes("pipNoticeVisible({ open: mediaOpen, pip, hideOnPip })"));
    assert.ok(src.includes("function pipIsOn()"));
    assert.ok(src.includes("pipNotice = core.el(\"div\", \"mediaPipNotice\")"));
    assert.ok(src.includes("pipHereNode.addEventListener(\"click\", () => { pipStageShown = !pipStageShown; syncMediaStage(); })"));
    assert.ok(src.includes("pipStopNode.addEventListener(\"click\", () => { exitPip(); })"));
  });

  test("画中画の出入りと、小窓を閉じたときの後始末", () => {
    assert.ok(src.includes('core.video.addEventListener("enterpictureinpicture"'));
    assert.ok(src.includes('core.video.addEventListener("leavepictureinpicture"'));
    /* trk265（レビュー M1）：閉じたあとは「実際に出ているか」に合わせる（まだ出ていれば true のまま） */
    assert.ok(src.includes("pipActive = pipActuallyOn();"), "✕ でも同じ後始末（実際の状態に合わせる）");
    assert.ok(/async function exitPip\(\) \{\n  await leavePipBoth\(\);/.test(src), "閉じる順番は 1 か所（trk265）");
    assert.ok(src.includes("async function exitPip()"));
  });

  test("設定は読み込み・リセットの2か所にあり、設定画面のチェックとつながっている", () => {
    for (const key of ["mediaPipKeep", "mediaPipHideStage"]) {
      const n = (coreSrc.match(new RegExp(key, "g")) || []).length;
      assert.ok(n >= 2, `${key} が ${n} か所しかない`);
      assert.ok(src.includes(`core.settings.${key}`), `${key} を読んでいない`);
    }
    assert.ok(src.includes('core.el("details", "subPanel mediaPipPanel")'));
    assert.ok(src.includes("pipKeepCheck.addEventListener(\"change\""));
    assert.ok(src.includes("pipHideCheck.addEventListener(\"change\""));
    assert.ok(src.includes("wavePanel.after(pipPanel)"));
  });

  test("4言語すべてに、画中画の設定と案内の文言がある", () => {
    const keys = ["mediaPipTitle", "mediaPipHint", "mediaPipKeep", "mediaPipHideStage", "mediaPipKeepOn",
      "mediaPipNotice", "mediaPipShowHere", "mediaPipHideHere"];
    for (const key of keys) {
      const n = (src.match(new RegExp(`${key}:`, "g")) || []).length;
      assert.equal(n, 4, `${key} が ${n} 言語しかない`);
    }
  });

  test("案内の見た目（CSS）がある", () => {
    assert.ok(css.includes(".mediaPipNotice{display:flex"));
    assert.ok(css.includes(".mediaPipNotice[hidden]{display:none!important}"));
  });
});

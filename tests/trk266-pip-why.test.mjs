// SPDX-License-Identifier: GPL-3.0-or-later
/* 📌 trk266：trk265 レビューの小さな推奨 3 点（F1 理由の行・F2 二度押し・F3 説明文）の見張り。
 *
 * ブラウザーを起動しないテストなので、`js/media-player-mode.js` の中の
 * 「純粋な計算（trk266）」の範囲を vm で読み、配線は本文の目印で確かめます。
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const src = read("js/media-player-mode.js");

const START = "/* ==== 純粋な計算（trk266";
const END = "/* ==== 純粋な計算（trk266）ここまで ==== */";
const from = src.indexOf(START), to = src.indexOf(END);
assert.ok(from > 0 && to > from, "「純粋な計算（trk266）」の目印が見つかる");
const sandbox = { Object };
vm.createContext(sandbox);
vm.runInContext(src.slice(from, to) + `
;globalThis.P = { pipWhyVisible };
`, sandbox, { filename: "js/media-player-mode.js#pure266" });
const P = sandbox.P;

describe("trk266 F1：押せない理由を、見える行として出すか", () => {
  test("ホーム画面／Dock のアプリで、動画を読み込んでいれば出す", () => {
    assert.equal(P.pipWhyVisible({ ok: false, ready: true, key: "mediaPipHomeApp" }), true);
  });

  test("普通の非対応（Firefox など）では出さない＝行が出しっぱなしにならない", () => {
    assert.equal(P.pipWhyVisible({ ok: false, ready: true, key: "mediaPipUnsupported" }), false);
    assert.equal(P.pipWhyVisible({ ok: false, ready: false, key: "mediaPipUnsupported" }), false);
  });

  test("動画を読み込む前は出さない（まだ分からないことを、使えないと書かない）", () => {
    assert.equal(P.pipWhyVisible({ ok: false, ready: false, key: "mediaPipHomeApp" }), false);
  });

  test("押せるときは、どの組み合わせでも出さない", () => {
    assert.equal(P.pipWhyVisible({ ok: true, ready: true, key: "mediaPipHomeApp" }), false);
    assert.equal(P.pipWhyVisible({ ok: true, ready: true, key: "" }), false);
  });

  test("引数なし・空でも落ちない", () => {
    assert.equal(P.pipWhyVisible(), false);
    assert.equal(P.pipWhyVisible({}), false);
  });
});

describe("trk266 F2：待っている間の二度押しを防ぐ", () => {
  test("待ちのフラグがあり、押されたら何もしない", () => {
    assert.ok(src.includes("let pipBusy = false;"));
    assert.ok(src.includes("if (pipBusy) return;"), "togglePip の先頭で無視する");
  });

  test("true にするのは入る直前、戻すのは finally（例外でも戻す）", () => {
    const startAt = src.indexOf("async function togglePip()");
    const body = src.slice(startAt, src.indexOf("\n}\n", startAt) + 3);
    assert.ok(body.indexOf("pipBusy = true;") > body.indexOf("if (pipIsOn()) { await exitPip(); return; }"),
      "閉じる操作は邪魔しない");
    assert.ok(body.includes("} finally {"), "finally で戻す");
    assert.ok(body.includes("pipBusy = false;"));
    assert.ok(body.indexOf("pipBusy = true;") < body.indexOf("await enterPip()"), "待つ前に立てる");
    assert.equal((body.match(/pipBusy = false;/g) || []).length, 1, "戻すのは 1 か所（finally）");
  });
});

describe("trk266 F1・F3 配線（本文の目印）", () => {
  test("理由の行は pipWhyVisible の判断を通す（hidden = pipOk をやめた）", () => {
    assert.ok(src.includes("const whyOn = pipWhyVisible({ ok: pipOk, ready, key: whyKey });"));
    assert.ok(src.includes("pipWhy.hidden = !whyOn;"));
    assert.ok(!src.includes("pipWhy.hidden = pipOk;"), "常に出す・常に隠すの書き方が残っていない");
  });

  test("読み上げ（aria-describedby）は、行を出しているときだけ", () => {
    const block = src.slice(src.indexOf("if (pipWhy) {"), src.indexOf("pipNode.classList.toggle(\"selected\", pipOn);"));
    assert.ok(block.includes('pipNode.setAttribute("aria-describedby", "mediaPipWhy");'));
    assert.ok(block.includes('pipNode.removeAttribute("aria-describedby");'));
  });

  test("F3：設定の説明文に、4 言語とも Dock が入っている", () => {
    const hints = src.match(/mediaPipHint:"[^"]*"/g) || [];
    assert.equal(hints.length, 4, "4 言語ぶんある");
    for (const h of hints) assert.ok(/Dock/.test(h), h.slice(0, 40));
    assert.ok(!src.includes("iPhone・iPad のホーム画面のアプリでは使えないことがあります"), "古い言い方が残っていない");
    assert.ok(!src.includes("the Home Screen app on iPhone and iPad)"), "英語の古い言い方が残っていない");
  });
});

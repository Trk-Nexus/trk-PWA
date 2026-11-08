// SPDX-License-Identifier: GPL-3.0-or-later
/* ⌨ trk291：呼び出しキーの既定はオフ（""）。使う人が ⚙ で決める。Backspace・Delete でオフに戻せる。
 * ⌨ ボタン（cliOpenBtn）からは、いつも開ける。 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./helpers/browser-data.mjs";
import { cliSource } from "./helpers/cli-src.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const core = read("js/core.js");
const cli = cliSource();

describe("trk291：呼び出しキーの既定はオフ", () => {
  test("保存のない人の既定は \"\"（オフ）。保存の Backquote は印が無いときオフへ", () => {
    assert.match(core, /cliKey: prefs\.cliKey === "" \? "" : /);
    assert.match(core, /settings\.cliKey = ""; settings\.cliShift = false;/, "工場出荷でもオフ");
    assert.match(cli, /const cliKeyCode = \(\) => \(core\.validCode\(core\.settings\.cliKey\) \? core\.settings\.cliKey : ""\)/);
  });

  test("オフのときは、修飾キーとキーの組み合わせを見ても開かない", () => {
    const at = cli.indexOf("if (!cliKeyCode()) return;");
    const mod = cli.indexOf("if (!cliModPressed(e)) return;");
    assert.ok(at > 0 && mod > at, "オフの判定は、修飾キーの判定より前");
  });

  test("割り当て中に Backspace・Delete で、オフにして保存する（⌨ ボタンは残す）", () => {
    assert.match(cli, /if \(code === "Backspace" \|\| code === "Delete"\) \{/);
    assert.match(cli, /syncCliKeyUI\(tr\("cliKeyOffSaved"\)\);/);
    assert.match(cli, /const openBtn = document\.getElementById\("cliOpenBtn"\);/, "ボタンの配線は変えない");
  });

  test("表示と案内は、4 言語とも「オフ」の文言と Backspace の案内を持つ", () => {
    for (const key of ["cliKeyOff:", "cliKeyOffSaved:"]) {
      assert.equal(cli.split(key).length - 1, 4, `${key} は 4 言語ぶん`);
    }
    assert.equal(cli.split("Backspace でオフ").length - 1, 1, "日本語の案内");
    assert.equal(cli.split("Backspace for off").length - 1, 1, "英語の案内");
    assert.equal(cli.split("Backspace 关闭").length - 1, 1, "中国語の案内");
    assert.equal(cli.split("Backspace 로 끔").length - 1, 1, "韓国語の案内");
  });

  test("版：trk291（cache とビルド表示をそろえる）", () => {
    assert.match(read("index.html"), /name="trk-build" content=\"trk320\"/);
    assert.match(read("sw.js"), /const CACHE = "trk-v2026\.11\.04-trk320";/);
  });
});

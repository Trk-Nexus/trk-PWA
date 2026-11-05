// SPDX-License-Identifier: GPL-3.0-or-later
/* ⌨ trk290：再チェック（trk-Nexus-recheck-2026-11-06.zip）の推奨 1・4・5 を見張る。
 * 1：保存済みの予約キーは起動時に Period に戻す ／ 2：Ctrl＋Space は予約 ／ 4・5：低い画面の境と高さの順 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";
import { cliSource } from "./helpers/cli-src.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const pureSrc = read("js/cli-pure.js");
const cli = cliSource();
const css = read("css/style.css");

const sandbox = { window: { Trk: {} }, Object, Math, Number, String, Array, JSON, RegExp, Error };
vm.createContext(sandbox);
vm.runInContext(pureSrc, sandbox, { filename: "js/cli-pure.js" });
const P = sandbox.window.Trk.cliPure;

describe("trk290：推奨 1 保存済みの予約キーを起動時に Period に戻す", () => {
  test("起動時に予約なら Period にして保存する（wireSettings より前）", () => {
    const at = cli.indexOf('core.settings.cliKey = "Period"; core.saveUserPrefs(); }');
    assert.ok(at > 0, "起動時の見張りがある");
    assert.match(cli, /if \(cliKeyReserved\(cliKeyCode\(\), cliMod\(\), core\.settings\.cliShift === true\)\) \{ core\.settings\.cliKey = "Period"/);
    assert.ok(at < cli.indexOf("  wireSettings();\n"), "配線より前");
  });
  test("貼り付けの Ctrl＋V（保存の KeyV）は予約、Alt＋V は登録できる", () => {
    assert.equal(P.cliKeyReserved("KeyV", "ctrlOrMeta", false), true);
    assert.equal(P.cliKeyReserved("KeyV", "alt", false), false);
  });
});

describe("trk290：推奨 2 Ctrl＋Space は予約", () => {
  test("Ctrl／⌘＋Space は予約（Shift を足しても）。Alt＋Space は登録できる", () => {
    assert.equal(P.cliKeyReserved("Space", "ctrlOrMeta", false), true);
    assert.equal(P.cliKeyReserved("Space", "ctrl", true), true);
    assert.equal(P.cliKeyReserved("Space", "alt", false), false);
  });
});

describe("trk290：推奨 4・5 低い画面の境と高さの順", () => {
  test("低い画面の規則は 600px（320×568 を含む）", () => {
    assert.match(css, /@media \(max-height:600px\)\{\n  dialog\.cliDialog>\.cliTypingBadge/);
    assert.doesNotMatch(css, /@media \(max-height:520px\)/, "520px の規則は残っていない");
  });
  test("低い画面では tall（88dvh）が half（80dvh）より低くならない", () => {
    const at = css.indexOf('dialog.cliDialog[data-size="tall"]{height:88dvh}');
    assert.ok(at > css.indexOf("@media (max-height:600px){\n  dialog.cliDialog>.cliLog"), "600px の規則の中");
    assert.ok(at > css.indexOf('dialog.cliDialog[data-size="half"]{height:80dvh}'), "half の後に置く（同じ強さ）");
  });
});

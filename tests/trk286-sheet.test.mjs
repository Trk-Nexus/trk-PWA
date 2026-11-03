// SPDX-License-Identifier: GPL-3.0-or-later
/* ⌨ trk286：ターミナルを「下から持ち上がるボトムシート」にした回の見張り。
 *
 * 見るのは 4 つ。
 *   1. 重ね表示は自前の div ではなく **ネイティブの <dialog> ＋ showModal()**
 *      （modern-web-guidance の ui-components/dialog / animate-to-from-top-layer）。
 *   2. 出し入れは CSS のアニメーション（@starting-style ＋ allow-discrete ＋ overlay）で、
 *      高さは 52%／70%／92% の 3 段（設定で選べて、覚える）。
 *   3. スキンは**端末の中だけ**（後ろの曲リストの色は変えない）。
 *   4. 既定は**実行しても閉じない**・`help` は短く、全部は `help all`。
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const cli = read("js/cli.js");
const core = read("js/core.js");
const html = read("index.html");
const css = read("css/style.css");

/* ==================== 1. <dialog> ＋ showModal ==================== */
describe("trk286：自前のオーバーレイをやめて <dialog> にする", () => {
  test("作るのは <dialog>（role/aria-modal を手で書かない）", () => {
    assert.match(cli, /dialog = core\.el\("dialog", "cliDialog"\)/);
    assert.match(cli, /dialog\.setAttribute\("aria-labelledby", "cliTitle"\)/);
    assert.doesNotMatch(cli, /overlay = core\.el\("div", "instOverlay cliOverlay"\)/, "自前の重ね div は作らない");
    assert.doesNotMatch(cli, /setAttribute\("role", "dialog"\)/, "role はブラウザーが付ける");
    assert.doesNotMatch(cli, /aria-modal/, "aria-modal もブラウザーが付ける");
  });

  test("開くのは showModal()・閉じるのは close()", () => {
    assert.match(cli, /if \(typeof overlay\.showModal === "function"\) \{/);
    assert.match(cli, /overlay\.showModal\(\)/);
    assert.match(cli, /overlay\.open && typeof overlay\.close === "function"/);
    assert.match(cli, /overlay\.close\(\)/);
    assert.match(html, /aria-controls="cliMode"/, "⚙ のボタンは板を指す");
  });

  test("Esc は自前で拾わない・閉じたあとは 1 か所で片づける", () => {
    assert.doesNotMatch(cli, /if \(e\.key === "Escape"\) \{ e\.preventDefault\(\); closeCli\(\); \}/);
    assert.match(cli, /dialog\.addEventListener\("close", \(\) => finishClose\(\)\)/);
    assert.match(cli, /function finishClose\(\)/);
    assert.match(cli, /if \(window\.Trk && window\.Trk\.overlay && window\.Trk\.overlay\.set\) window\.Trk\.overlay\.set\("cli", false\)/);
  });

  test("背景クリックでも閉じる（closedby が無いブラウザーの手当てつき）", () => {
    assert.match(cli, /if \(typeof HTMLDialogElement !== "undefined" && "closedBy" in HTMLDialogElement\.prototype\) dialog\.setAttribute\("closedby", "any"\)/);
    assert.match(cli, /dialog\.addEventListener\("pointerup", e => \{ if \(pressOutside && outside\(e\)\) closeCli\(\); pressOutside = false; \}\)/);
  });
});

/* ==================== 2. 見た目（下から持ち上がる） ==================== */
describe("trk286：下から押し上げる・高さは 3 段", () => {
  test("板の CSS が @starting-style と allow-discrete を使う", () => {
    assert.match(css, /dialog\.cliDialog\{position:fixed;inset:auto 0 0 0;/);
    assert.match(css, /@starting-style\{dialog\.cliDialog\[open\]\{transform:translateY\(100%\);opacity:0\}\}/);
    assert.match(css, /transition-behavior:allow-discrete/, "display／overlay を遷移させる");
    assert.match(css, /transition:[^;]*display \.3s,overlay \.3s;/, "shorthand のあとに allow-discrete");
    assert.match(css, /dialog\.cliDialog:not\(\[open\]\)\{display:none;transform:translateY\(100%\);opacity:0\}/, "閉じている間は出さない");
    assert.match(css, /dialog\.cliDialog::backdrop\{/);
    assert.match(css, /dialog\.cliDialog:modal\{overscroll-behavior:contain\}/);
  });

  test("高さは half／tall／full（既定 tall）で、覚える", () => {
    assert.match(css, /dialog\.cliDialog\[data-size="half"\]\{height:52dvh\}/);
    assert.match(css, /dialog\.cliDialog\[data-size="tall"\]\{height:70dvh\}/);
    assert.match(css, /dialog\.cliDialog\[data-size="full"\]\{height:92dvh\}/);
    assert.match(core, /cliSheetSize: pick\(prefs\.cliSheetSize, \["half", "tall", "full"\], "tall"\)/);
    assert.match(core, /settings\.cliSheetSize = "tall";/, "工場出荷でも ふつう へ戻す");
    assert.match(cli, /const SHEET_SIZES = \["half", "tall", "full"\];/);
    assert.match(cli, /overlay\.dataset\.size = size;/);
    assert.match(cli, /core\.settings\.cliSheetSize = SHEET_SIZES\.includes\(sheetSel\.value\) \? sheetSel\.value : "tall";/);
    assert.match(cli, /core\.saveUserPrefs\(\);\n        if \(state\.open\) syncSheet\(\);/, "選ぶと保存して、開いていれば合わせる");
  });

  test("⚙ に高さの選択がある（3 択）", () => {
    assert.match(html, /id="cliSheetSize"/);
    for (const v of ["half", "tall", "full"]) {
      assert.match(html, new RegExp(`<option value="${v}" data-i18n="cliSheet`), `${v} の選択肢`);
    }
    assert.match(html, /id="cliSheetSizeLabel" data-i18n="cliSheetSizeLabel"/);
  });

  test("上端につまみ・スマホの安全領域・動きを減らす人への配慮", () => {
    assert.match(cli, /const handle = core\.el\("div", "cliSheetHandle"\)/);
    assert.match(css, /\.cliSheetHandle\{/);
    assert.match(css, /padding:0 0 env\(safe-area-inset-bottom,0px\)/);
    assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{dialog\.cliDialog,dialog\.cliDialog::backdrop\{transition:none\}\}/);
  });
});

/* ==================== 3. スキンは端末の中だけ ==================== */
describe("trk286：スキンは端末の中だけに当てる", () => {
  test("板の CSS 変数を差し替える（背景は触らない）", () => {
    assert.match(cli, /function applySheetSkin\(\)/);
    assert.match(cli, /overlay\.removeAttribute\("style"\)/, "まず素に戻す");
    assert.match(cli, /overlay\.style\.setProperty\(k, v\)/);
    assert.match(cli, /overlay\.dataset\.cliSkin = id;/);
    /* 当てる関数の中では、アプリ全体のスキンを変えない */
    const body = cli.slice(cli.indexOf("function applySheetSkin()"), cli.indexOf("function syncSheet()"));
    assert.doesNotMatch(body, /core\.applySkin\(/, "開いたときに画面全体のスキンを当て直さない");
  });

  test("合図の名前も板のスキンを見る（後ろのスキンではない）", () => {
    assert.match(cli, /const key = id \|\| state\.sheetSkin \|\| core\.settings\.skin;/);
    assert.match(cli, /if \(state\.open\) syncSheet\(\); else state\.sheetSkin = "";/);
  });

  test("当てたことを状態行に出す", () => {
    assert.match(cli, /const sheet = syncSheet\(\);/);
    assert.match(cli, /tr\("cliSheetSkin", \{ id: sheet \}\)/);
  });
});

/* ==================== 4. 閉じない・help は短い ==================== */
describe("trk286：既定は閉じない・help は短く", () => {
  test("実行しても閉じないのが既定（入れた人だけ閉じる）", () => {
    assert.match(core, /cliAutoClose: prefs\.cliAutoClose === true/);
    assert.match(cli, /if \(res\.action && core\.settings\.cliAutoClose === true\) \{/);
    assert.match(cli, /autoChk\.checked = core\.settings\.cliAutoClose === true;/);
  });

  test("help は 5 本＋案内、help all で全部", () => {
    assert.match(cli, /const CLI_HELP_SHORT = \["play", "next", "back", "list", "help"\];/);
    assert.match(cli, /if \(only === "all"\) \{/);
    assert.match(cli, /push\("out", "  " \+ t\("cliHelpAll", \{ n: CLI_HELP\.length \}\)\)/);
  });
});

/* ==================== 5. 文言（4 言語） ==================== */
describe("trk286：文言", () => {
  test("キーの見出しはウィザード風（Terminal Key Setting）", () => {
    assert.match(cli, /cliKeyLabel: "🪄 Terminal Key Setting（Ctrl／⌘ ＋ このキー）"/);
    assert.match(cli, /cliKeyLabel: "🪄 Terminal Key Setting \(Ctrl \/ ⌘ \+ this key\)"/);
  });

  test("新しい文言は 4 言語そろっている", () => {
    const keys = ["cliHelpAll", "cliSheetSizeLabel", "cliSheetHalf", "cliSheetTall", "cliSheetFull",
      "cliSheetHint", "cliSheetSkin"];
    for (const key of keys) {
      assert.equal((cli.match(new RegExp(`\\b${key}:`, "g")) || []).length, 4, `${key} は 4 言語`);
    }
  });
});

/* ==================== 6. 呼び出しキーの割り当て（追いかけ） ==================== */
describe("trk286：呼び出しキーの割り当てが、ちゃんと決まる", () => {
  test("既定の見た目は「いまのスキンのまま」", () => {
    assert.match(core, /cliSkin: pick\(prefs\.cliSkin, \["auto", "terminal", "keep"\], "keep"\)/);
    assert.match(core, /settings\.cliSkin = "keep";/);
    assert.match(cli, /cliSkinKeep: "いまのスキンのまま"/);
  });

  test("修飾キーだけ・Esc・Tab では決めない（Ctrl+Ctrl にならない）", () => {
    assert.match(cli, /const CLI_KEY_MODIFIERS = \["ControlLeft", "ControlRight", "ShiftLeft", "ShiftRight", "AltLeft", "AltRight",/);
    assert.match(cli, /const cliKeyUsable = code => !!code && code !== "Escape" && code !== "Tab" && !CLI_KEY_MODIFIERS\.includes\(code\) && core\.validCode\(code\);/);
    assert.match(cli, /if \(!cliKeyUsable\(code\)\) \{ syncCliKeyUI\(tr\("cliKeyBadKey"\)\); return false; \}/, "待ちは続ける");
    assert.match(cli, /if \(!code \|\| code === "Escape"\) \{ cliKeyBinding = null; syncCliKeyUI\(""\); return false; \}/);
  });

  test("ほかの操作と重なるキーは受けない（📚 の音量キーも見る）", () => {
    assert.match(cli, /function cliKeyUsed\(code\) \{/);
    assert.match(cli, /S\.skinVolKeyL, S\.skinVolKeyR, S\.skinVolKeyU, S\.skinVolKeyD/);
    assert.match(cli, /if \(cliKeyUsed\(code\)\) \{ toastNote\(tr\("cliKeyTaken"\)\); syncCliKeyUI\(tr\("cliKeyTaken"\)\); return false; \}/);
  });

  test("待ちっぱなしにしない（押し直し・ほかを触る・Esc で取り消し）", () => {
    assert.match(cli, /cliKeyBinding = cliKeyBinding === null \? 0 : null;/, "ボタンをもう一度押したら取り消し");
    assert.match(cli, /document\.addEventListener\("pointerdown", e => \{/, "外を触ったら取り消し");
    assert.match(cli, /if \(t && t\.closest && t\.closest\("#cliKeyAssign"\)\) return;/);
    assert.match(cli, /if \(cliKeyBinding !== null\) \{\n      e\.preventDefault\(\); e\.stopPropagation\(\);\n      if \(!e\.repeat\) captureCliKey\(core\.keyCodeOf\(e\)\);/);
  });

  test("決まったこと・駄目だったことを、その場に出す（読み上げつき）", () => {
    assert.match(html, /id="cliKeyStatus" aria-live="polite"/);
    assert.match(cli, /button\.setAttribute\("aria-pressed", String\(on\)\)/);
    assert.match(cli, /syncCliKeyUI\(tr\("cliKeySaved", \{ mod: modShort\(\), key: core\.formatKey\(code\) \}\)\)/);
    for (const key of ["cliKeyWaiting", "cliKeyBadKey", "cliKeySaved"]) {
      assert.equal((cli.match(new RegExp(`\\b${key}:`, "g")) || []).length, 4, `${key} は 4 言語`);
    }
  });
});

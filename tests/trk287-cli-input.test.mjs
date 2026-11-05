// SPDX-License-Identifier: GPL-3.0-or-later
/* ⌨ trk287：ターミナルの入力で文字が落ちる件と、修飾キー（Win／⌘ = Super）の選択。
 *
 * 見るのは 4 つ。
 *   1. 端末に入力しているあいだは、**端末がキーボードを握る**。
 *      入力欄にフォーカスがあっても、文字は**こちらで入れる**ので、
 *      ブラウザーやほかの処理が preventDefault しても p や : が落ちない。
 *   2. 端末の外の操作（P＝一時停止・/＝設定の検索・`＝リトライ）には渡さない。
 *   3. 辞書の入力欄・Tab（フォーカス移動）・出力の読み返し（矢印）は邪魔しない。
 *   4. 呼び出しキーの修飾キーを **Ctrl／⌘（既定）・Win／⌘（Super）・Ctrl・Alt** から選べる。
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";
import { cliSource } from "./helpers/cli-src.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const src = cliSource();
const core = read("js/core.js");
const html = read("index.html");

/* 純粋な計算の範囲だけを vm で読む（DOM は触らない） */
const START = "/* ==================== 純粋な計算（trk267）";
const END = "/* ==================== 純粋な計算（trk267）ここまで";
const from = src.indexOf(START), to = src.indexOf(END);
assert.ok(from > 0 && to > from, "「純粋な計算（trk267）」の目印が見つかる");
const sandbox = { Object, Math, Number, String, Array, JSON };
vm.createContext(sandbox);
vm.runInContext(src.slice(from, to) + `
;globalThis.C = { insertTextAt, parseClock, promptText };
`, sandbox, { filename: "js/cli.js#pure287" });
const C = sandbox.C;

describe("trk287：1 文字を、カーソルの位置に入れる", () => {
  test("末尾・途中・選択の置き換え", () => {
    assert.deepEqual({ ...C.insertTextAt("pla", "y", 3, 3) }, { value: "play", caret: 4 });
    assert.deepEqual({ ...C.insertTextAt("seek 130", ":", 6, 6) }, { value: "seek 1:30", caret: 7 }, ": が入る");
    assert.deepEqual({ ...C.insertTextAt("ab", "x", 0, 2) }, { value: "x", caret: 1 }, "選択は置き換える");
    assert.deepEqual({ ...C.insertTextAt("", "p", 0, 0) }, { value: "p", caret: 1 });
  });

  test("範囲がおかしくても落ちない", () => {
    assert.deepEqual({ ...C.insertTextAt("abc", "x", 99, 99) }, { value: "abcx", caret: 4 });
    assert.deepEqual({ ...C.insertTextAt("abc", "x", -5, -1) }, { value: "xabc", caret: 1 });
    assert.deepEqual({ ...C.insertTextAt("abc", "x", 2, 1) }, { value: "abxc", caret: 3 }, "start > end でも壊れない");
    assert.deepEqual({ ...C.insertTextAt(null, null, null, null) }, { value: "", caret: 0 });
  });

  test("p も : も、そのまま入る（文字を選り分けていない）", () => {
    for (const ch of ["p", ":", "P", ";", "/", "`", "1", " "]) {
      assert.equal(C.insertTextAt("", ch, 0, 0).value, ch, `${JSON.stringify(ch)} が入る`);
    }
  });

  test(": は時刻として読める（全角でも）", () => {
    assert.equal(C.parseClock("1:30"), 90);
    assert.equal(C.parseClock("１：３０"), 90, "全角のコロンも NFKC で通す");
  });
});

describe("trk287：端末がキーボードを握る", () => {
  test("入力欄にフォーカスがあっても、文字はこちらで入れる", () => {
    assert.match(src, /const isTypeable = e => typeof e\.key === "string" && e\.key\.length === 1 &&\n    !e\.ctrlKey && !e\.metaKey && !e\.altKey;/);
    /* trk288（R2）：入れるのは insertOwn（ほかの処理が止めたときに、bubble の段から呼ぶ） */
    assert.match(src, /function insertOwn\(ch\) \{[\s\S]*?const r = insertTextAt\(inputNode\.value, ch, inputNode\.selectionStart, inputNode\.selectionEnd\);/);
    assert.match(src, /inputNode\.value = r\.value;/);
    assert.match(src, /inputNode\.setSelectionRange\(r\.caret, r\.caret\)/);
    assert.match(src, /e\.preventDefault\(\);\n      e\.stopPropagation\(\);/);
    /* 前の形（defaultPrevented を見て諦める）は残っていない */
    assert.doesNotMatch(src, /if \(cliKeyBinding !== null \|\| e\.defaultPrevented\) return;/);
  });

  test("端末の外の操作には渡さない（1 文字を二重にしない）", () => {
    assert.match(src, /const inside = !!\(t && t\.closest && t\.closest\("#cliMode"\)\);/);
    assert.match(src, /e\.stopPropagation\(\);   \/\* 外の操作に渡さない（1 文字を二重にしない） \*\//);
  });

  test("辞書・Tab・出力の読み返しは邪魔しない", () => {
    assert.match(src, /if \(t && t\.closest && t\.closest\("#cliSpellPanel"\)\) return;/);
    assert.match(src, /if \(e\.key === "Tab"\) return;/, "Tab はフォーカス移動に譲る");
    assert.match(src, /if \(t && t\.closest && t\.closest\("#cliLog"\) && \/\^\(Arrow\|Page\|Home\|End\)\/\.test\(e\.key\)\) return;/);
  });

  test("IME の変換中は渡す（二重に入れない）", () => {
    assert.match(src, /if \(compositionBlocked\(e\.isComposing, e\.keyCode\)\) return;   \/\* IME の変換中は、そのまま渡す \*\//);
  });
});

describe("trk287：修飾キーを選べる（Win／⌘ = Super）", () => {
  test("4 つから選んで覚える（既定は Ctrl か ⌘／Win）", () => {
    assert.match(core, /cliMod: pick\(prefs\.cliMod, \["ctrlOrMeta", "meta", "ctrl", "alt"\], "ctrlOrMeta"\)/);
    assert.match(core, /settings\.cliMod = "ctrlOrMeta";/, "工場出荷でも戻す");
    assert.match(src, /const CLI_MODS = \["ctrlOrMeta", "meta", "ctrl", "alt"\];/);
    assert.match(src, /const next = CLI_MODS\.includes\(modSel\.value\) \? modSel\.value : "ctrlOrMeta";/);
    assert.match(src, /core\.settings\.cliMod = next;/, "予約になる組み合わせは受けない（trk289・N3）");
    assert.match(src, /core\.saveUserPrefs\(\);\n        syncCliKeyUI\(\);/, "選ぶと保存して表示も合わせる");
  });

  test("押された修飾キーが、選んだものと合うか", () => {
    assert.match(src, /if \(m === "meta"\) return e\.metaKey === true && !e\.ctrlKey && !e\.altKey;/);
    assert.match(src, /if \(m === "ctrl"\) return e\.ctrlKey === true && !e\.metaKey && !e\.altKey;/);
    assert.match(src, /if \(m === "alt"\) return e\.altKey === true && !e\.ctrlKey && !e\.metaKey;/);
    assert.match(src, /return \(e\.ctrlKey === true \|\| e\.metaKey === true\) && !e\.altKey;/, "既定は Ctrl か ⌘／Win");
  });

  test("呼び出しの判定と、いまのキーの表示に使う", () => {
    assert.match(src, /if \(!cliModPressed\(e\)\) return;/);
    assert.match(src, /if \(value\) value\.textContent = cliKeyCode\(\) \? modLabel\(\) \+ " \+ " \+ core\.formatKey\(cliKeyCode\(\)\) : tr\("cliKeyOff"\);/);
    assert.match(src, /const CLI_MOD_SHORT = \{ ctrlOrMeta: "Ctrl／⌘", meta: "Win／⌘", ctrl: "Ctrl", alt: "Alt" \};/);
    assert.match(src, /if \(modSel\) modSel\.value = cliMod\(\);/);
  });

  test("⚙ に選択がある（4 択）", () => {
    assert.match(html, /id="cliModSel"/);
    for (const v of ["ctrlOrMeta", "meta", "ctrl", "alt"]) {
      assert.match(html, new RegExp(`<option value="${v}" data-i18n="cliMod`), `${v} の選択肢`);
    }
    assert.match(html, /id="cliModLabel" data-i18n="cliModLabel"/);
  });

  test("公開している（確認・テスト用）", () => {
    for (const name of ["cliMod", "cliModPressed", "insertTextAt"]) {
      assert.match(src, new RegExp(`^    ${name},$`, "m"), `${name} を公開`);
    }
  });

  test("文言は 4 言語そろっている", () => {
    const keys = ["cliModLabel", "cliModCtrlOrMeta", "cliModMeta", "cliModCtrl", "cliModAlt", "cliModHint"];
    for (const key of keys) {
      assert.equal((src.match(new RegExp(`\\b${key}:`, "g")) || []).length, 4, `${key} は 4 言語`);
    }
    assert.equal((src.match(/\{mod\}/g) || []).length, 4, "保存の文言は {mod} を使う");
  });
});

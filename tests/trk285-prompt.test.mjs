// SPDX-License-Identifier: GPL-3.0-or-later
/* ⌨ trk285：端末の入力の合図（プロンプト）と、入力を奪う形

   見張ること：
   ・既定は Linux 系の「<スキン名(English)> ~ %」（例：The Art of War ~ % / Key of Solomon ~ %）
   ・ほかのよく見る形（bash・root・fish・PowerShell・シンプル・スキンに任せる）も選べる
   ・スキン名は **English の表記**（label.en）。無ければ ja → id の順に落とす
   ・端末を開いているあいだは、画面のどこにフォーカスがあっても入力を奪う（1 文字目も落とさない）
     ただし端末の入力欄と辞書（`#cliForm`・`#cliSpellPanel`）は邪魔しない */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const cli = read("js/cli.js");
const core = read("js/core.js");
const html = read("index.html");
const css = read("css/style.css");
const wizard = read("js/skins-wizard.js");

const START = "/* ==================== 純粋な計算（trk267）";
const END = "/* ==================== 純粋な計算（trk267）ここまで";
const from = cli.indexOf(START), to = cli.indexOf(END);
assert.ok(from > 0 && to > from, "「純粋な計算（trk267）」の目印が見つかる");
const sandbox = { Object, Math, Number, String, Array, JSON };
vm.createContext(sandbox);
vm.runInContext(cli.slice(from, to) + `
;globalThis.C = { promptText, PROMPT_STYLES };
`, sandbox, { filename: "js/cli.js#trk285" });
const C = sandbox.C;

test("既定の合図は「<スキン名(English)> ~ %」", () => {
  assert.equal(C.promptText("linux", "The Art of War"), "The Art of War ~ % ");
  assert.equal(C.promptText("linux", "Key of Solomon"), "Key of Solomon ~ % ");
  assert.equal(C.promptText(undefined, "Shadow"), "Shadow ~ % ", "形が無ければ Linux 系");
  assert.equal(C.promptText("nope", "Shadow"), "Shadow ~ % ", "知らない形も Linux 系");
  assert.equal(C.promptText("linux", ""), "trk ~ % ", "名前が空でも壊れない");
  assert.equal(C.promptText("linux", null), "trk ~ % ");
});

test("よく見る形を 7 つから選べる", () => {
  assert.deepEqual(Array.from(C.PROMPT_STYLES), ["linux", "bash", "root", "fish", "ps", "plain", "skin"]);
  assert.equal(C.promptText("bash", "Shadow"), "Shadow:~$ ");
  assert.equal(C.promptText("root", "Shadow"), "Shadow:~# ");
  assert.equal(C.promptText("fish", "Shadow"), "Shadow ~> ");
  assert.equal(C.promptText("ps", "Shadow"), "PS Shadow> ");
  assert.equal(C.promptText("plain", "Shadow"), "> ");
  assert.equal(C.promptText("skin", "Shadow"), "", "スキンの --cli-prompt に任せる（空）");
});

test("スキン名は English の表記（label.en）を使う", () => {
  assert.match(cli, /const label = def\.label \|\| \{\};/, "スキンの label を見る");
  assert.match(cli, /return String\(label\.en \|\| label\.ja \|\| key \|\| "trk"\);/, "en → ja → id の順");
  /* ご相談の例が、実在のスキン名（English）であること */
  assert.match(wizard, /"en":"The Art of War"/);
  assert.match(wizard, /"en":"Key of Solomon"/);
});

test("既定は Linux 系・選んだ形は保存される", () => {
  assert.match(core, /cliPromptStyle: pick\(prefs\.cliPromptStyle, \["linux", "bash", "root", "fish", "ps", "plain", "skin"\], "linux"\)/);
  assert.match(core, /settings\.cliPromptStyle = "linux";/, "工場出荷でも Linux 系へ戻す");
  assert.match(cli, /core\.settings\.cliPromptStyle = PROMPT_STYLES\.includes\(promptSel\.value\) \? promptSel\.value : "linux";/);
  assert.match(cli, /core\.saveUserPrefs\(\);/, "選ぶと保存する");
});

test("⚙ に「入力の合図」と「いまの見え方」がある", () => {
  assert.match(html, /id="cliPromptSel"/);
  for (const v of ["linux", "bash", "root", "fish", "ps", "plain", "skin"]) {
    assert.match(html, new RegExp(`<option value="${v}" data-i18n="cliPrompt`), `${v} の選択肢`);
  }
  assert.match(html, /id="cliPromptPreview"/, "いまの見え方を出す");
  assert.match(cli, /preview\.textContent = tr\("cliPromptPreview", \{ text \}\);/);
  /* スキン・言語が変わったら、見え方も作り直す */
  assert.match(cli, /core\.on\("skin", \(\) => \{/);
  assert.match(cli, /if \(state\.open\) syncSheet\(\); else state\.sheetSkin = "";/, "⌨ trk286：板に当て直す");
  assert.match(cli, /if \(state\.open \|\| promptNode\) updatePrompt\(\);/, "見え方も作り直す");
  assert.match(cli, /updatePrompt\(\);   \/\* ⌨ trk285：当てたスキンの English 名で「<name> ~ %」を出す \*\//);
});

test("開いている間は、どこにフォーカスがあっても入力を奪う（1 文字目も落とさない）", () => {
  assert.match(cli, /if \(typeof e\.key === "string" && e\.key\.length === 1\) \{/, "打った 1 文字を拾う");
  assert.match(cli, /inputNode\.value \+= e\.key;/, "入力欄へ足す");
  assert.match(cli, /try \{ inputNode\.setSelectionRange\(inputNode\.value\.length, inputNode\.value\.length\); \} catch \(_\) \{\}/, "カーソルは末尾へ");
  assert.match(cli, /if \(t && t\.closest && t\.closest\("#cliForm, #cliSpellPanel"\)\) return;/, "端末の入力欄・辞書は邪魔しない");
  assert.match(cli, /if \(t && \["INPUT", "TEXTAREA", "SELECT"\]\.includes\(t\.tagName\)\) return;/);
  assert.match(cli, /if \(compositionBlocked\(e\.isComposing, e\.keyCode\)\) return;/, "IME の変換中は奪わない");
  assert.match(cli, /if \(e\.ctrlKey \|\| e\.metaKey \|\| e\.altKey\) return;/, "修飾キー付きは奪わない（呼び出しキーを壊さない）");
});

test("合図は文字で出し、読み上げ名にも入れる（空ならスキンの記号）", () => {
  assert.match(cli, /promptNode\.textContent = text;/, "文字で出す");
  assert.match(cli, /promptNode\.dataset\.text = text \? "1" : "0";/, "空のときは CSS の記号へ");
  assert.match(cli, /inputNode\.setAttribute\("aria-label", \(text \? text\.trim\(\) \+ " … " : ""\) \+ tr\("cliPromptLabel"\)\);/);
  assert.match(css, /\.cliPromptChar\[data-text="1"\]::before\{content:none\}/, "文字のときは ::before を消す");
  assert.match(css, /\.cliPromptChar\[data-text="1"\]\{white-space:pre;/, "空白を保つ");
  assert.match(css, /@media \(max-width:520px\)\{\.cliPromptChar\[data-text="1"\]/, "狭い画面では詰める");
});

test("合図の文言は 4 言語そろっている", () => {
  const keys = ["cliPromptStyleLabel", "cliPromptLinux", "cliPromptBash", "cliPromptRoot", "cliPromptFish",
    "cliPromptPs", "cliPromptPlain", "cliPromptSkin", "cliPromptPreview", "cliPromptHint"];
  for (const key of keys) {
    assert.equal((cli.match(new RegExp(`\\b${key}:`, "g")) || []).length, 4, `${key} は 4 言語`);
  }
});

// SPDX-License-Identifier: GPL-3.0-or-later
/* ⌨ trk284：ターミナルの置き場所・入力の取りこぼし・辞書登録の GUI

   見張ること：
   ・⌨ の設定パネルは**設定のいちばん上**（画面・再生バーより上）
   ・IME の変換中は Enter／Tab／矢印を端末の操作に使わない（書きかけを唱えない）
   ・Tab は「打っている文字がある・Shift でない」ときだけ補完（フォーカスを閉じ込めない）
   ・全角で打ってしまった呪文（ｐｌａｙ・５０・１：３０）も通す
   ・出力を読み返す／辞書を書く、の邪魔をしない（フォーカスを奪い返さない）
   ・端末のいちばん下に**辞書登録（呪文）の GUI**があり、そこから足す・消すができる */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const cli = read("js/cli.js");
const html = read("index.html");
const css = read("css/style.css");

const START = "/* ==================== 純粋な計算（trk267）";
const END = "/* ==================== 純粋な計算（trk267）ここまで";
const from = cli.indexOf(START), to = cli.indexOf(END);
assert.ok(from > 0 && to > from, "「純粋な計算（trk267）」の目印が見つかる");
const sandbox = { Object, Math, Number, String, Array, JSON };
vm.createContext(sandbox);
vm.runInContext(cli.slice(from, to) + `
;globalThis.C = { execute, parseClock, clampPercent, normalizeCommand, compositionBlocked,
  tabShouldComplete, spellDraftProblem, SPELL_MAX, SPELL_ID_MAX };
`, sandbox, { filename: "js/cli.js#trk284" });
const C = sandbox.C;

function fakeDeps(over = {}) {
  const calls = [];
  const deps = {
    calls,
    t: (key, vars) => (vars ? `${key}${JSON.stringify(vars)}` : key),
    name: it => it.title,
    src: it => it.source,
    tracks: () => [{ key: "a", title: "夜の曲", source: "folder" }],
    play: it => { calls.push(["play", it.key]); return Promise.resolve({ ok: true }); },
    playSpecial: kind => { calls.push(["special", kind]); return Promise.resolve({ ok: true, name: "曲" }); },
    restart: () => ({ ok: true, name: "夜の曲" }),
    current: () => ({ skin: "shadow", volume: 70, track: "" }),
    skins: () => [],
    applySkin: () => ({ ok: true }),
    volume: pct => { calls.push(["volume", pct]); return { ok: true }; },
    seek: sec => { calls.push(["seek", sec]); return { ok: true }; },
    repeat: () => ({ ok: true }),
    shuffle: () => ({ ok: true }),
    spells: () => ({}),
    saveSpell: () => ({ ok: true }),
    delSpell: () => ({ ok: true }),
    listLimit: 40,
    ...over
  };
  return deps;
}
const run = async (line, deps = fakeDeps()) => ({ res: await C.execute(line, deps), deps });

/* ==================== 置き場所 ==================== */
test("⌨ のパネルは設定のいちばん上（画面・再生バーより上）", () => {
  const cliAt = html.indexOf('id="cliPanel"');
  const uiAt = html.indexOf('id="uiPanel"');
  const gridAt = html.indexOf('<div class="grid">');
  const findAt = html.indexOf('id="setFind"');
  assert.ok(cliAt > 0 && uiAt > 0, "どちらのパネルもある");
  assert.ok(cliAt < uiAt, "画面（uiPanel）より上");
  assert.ok(cliAt < gridAt, "2 列の並び（grid）より上＝全幅で先頭");
  assert.ok(findAt < cliAt, "探す欄（setFind）よりは下");
  /* 再生バーの設定は uiPanel の中にあるので、その上でもある */
  assert.ok(html.indexOf('id="playerBarMode"') > cliAt, "再生バーの設定より上");
});

/* ==================== 入力の取りこぼし ==================== */
test("IME の変換中は端末の操作をしない", () => {
  assert.equal(C.compositionBlocked(true, undefined), true, "isComposing を見る");
  assert.equal(C.compositionBlocked(false, 229), true, "keyCode 229（IME）も見る");
  assert.equal(C.compositionBlocked(false, 13), false);
  assert.equal(C.compositionBlocked(undefined, undefined), false);
  /* 画面側：入力欄の composition を追い、Enter の submit と keydown でも弾く */
  assert.match(cli, /inputNode\.addEventListener\("compositionstart", \(\) => \{ state\.composing = true; \}\)/);
  assert.match(cli, /inputNode\.addEventListener\("compositionend", \(\) => \{ state\.composing = false; \}\)/);
  assert.match(cli, /form\.addEventListener\("submit", e => \{ e\.preventDefault\(\); if \(state\.composing\) return; void submit\(\); \}\)/);
  assert.match(cli, /async function submit\(\) \{\n    if \(!inputNode \|\| state\.composing\) return;/);
  assert.match(cli, /if \(compositionBlocked\(e\.isComposing, e\.keyCode\)\) return;/, "keydown でも弾く");
});

test("Tab は打っている文字があるときだけ補完（フォーカスを閉じ込めない）", () => {
  assert.equal(C.tabShouldComplete("he", false, true), true);
  assert.equal(C.tabShouldComplete("", false, true), false, "空ならフォーカスを動かす");
  assert.equal(C.tabShouldComplete("   ", false, true), false);
  assert.equal(C.tabShouldComplete("he", true, true), false, "Shift+Tab は戻る");
  assert.equal(C.tabShouldComplete("he", false, false), false, "スキンが補完オフなら何もしない");
  assert.match(cli, /if \(!tabShouldComplete\(inputNode\.value, e\.shiftKey, completionOn\(\)\)\) return;/);
});

test("全角で打ってしまった呪文も通す", async () => {
  assert.equal(C.normalizeCommand("　ＰＬＡＹ　"), "play");
  assert.equal(C.normalizeCommand("Ｈｅｌｐ"), "help");
  assert.equal(C.normalizeCommand(null), "");
  const { deps, res } = await run("ｐｌａｙ 夜");
  assert.deepEqual(deps.calls, [["play", "a"]], "全角の play で曲が鳴る");
  assert.equal(res.out[0].kind, "out");
  /* 数字も全角で通す */
  assert.equal(C.parseClock("１：３０"), 90);
  assert.equal(C.parseClock("９０"), 90);
  assert.equal(C.clampPercent("５０"), 50);
  const v = await run("ｖｏｌｕｍｅ ５０");
  assert.deepEqual(v.deps.calls, [["volume", 50]]);
});

test("読み返す・辞書を書く、の邪魔をしない（フォーカスを奪い返さない）", () => {
  assert.match(cli, /if \(t\.closest && t\.closest\("#cliLog, #cliSpellPanel"\)\) return;/);
  assert.match(cli, /if \(\["INPUT", "TEXTAREA", "SELECT", "BUTTON"\]\.includes\(t\.tagName\)\) return;/);
});

/* ==================== 辞書登録（呪文）の GUI ==================== */
test("辞書の下書きの検査（名前・中身・最初から入っているもの・上限）", () => {
  assert.equal(C.spellDraftProblem("night", "skin terminal; volume 30", { count: 0 }), "");
  assert.equal(C.spellDraftProblem("Night", "echo hi", { count: 0 }), "", "大文字は小文字へ寄せる");
  assert.equal(C.spellDraftProblem("", "echo hi"), "id");
  assert.equal(C.spellDraftProblem("a b", "echo hi"), "id", "空白はだめ");
  assert.equal(C.spellDraftProblem("-x", "echo hi"), "id", "先頭は英数字");
  assert.equal(C.spellDraftProblem("a".repeat(C.SPELL_ID_MAX + 1), "echo hi"), "id", "24 文字まで");
  assert.equal(C.spellDraftProblem("a".repeat(C.SPELL_ID_MAX), "echo hi"), "", "24 文字はよい");
  assert.equal(C.spellDraftProblem("night", "  "), "body", "中身は空にできない");
  assert.equal(C.spellDraftProblem("midnight", "echo hi", { builtin: true }), "builtin");
  assert.equal(C.spellDraftProblem("night", "echo hi", { count: C.SPELL_MAX }), "full");
  assert.equal(C.spellDraftProblem("night", "echo hi", { count: C.SPELL_MAX - 1 }), "", "上限の手前はよい");
});

test("端末のいちばん下に辞書の GUI がある（form を入れ子にしない）", () => {
  for (const id of ["cliSpellPanel", "cliSpellList", "cliSpellIdInput", "cliSpellBodyInput", "cliSpellAddBtn", "cliSpellStatus"]) {
    assert.match(cli, new RegExp(`"${id}"`), `${id} を作る`);
  }
  assert.match(cli, /dialog\.append\(handle, header, logNode, typingBadge, form, hint, spellBox\)/, "端末の最後に足す");
  assert.match(cli, /core\.el\("details", "cliSpellPanel"\)/, "折りたためる（読みたい人だけ開く）");
  assert.doesNotMatch(cli, /core\.el\("form"[^)]*cliSpell/, "form を入れ子にしない");
  assert.match(cli, /node\.addEventListener\("keydown", e => \{\n\s+if \(compositionBlocked\(e\.isComposing, e\.keyCode\)\) return;/, "GUI の Enter も変換中は無視");
  /* 足す・消す・描き直し */
  assert.match(cli, /function addSpellFromGui\(\)/);
  assert.match(cli, /const r = saveSpell\(key, body\);/, "端末の呪文と同じ保存を使う");
  assert.match(cli, /const r = delSpell\(id\);/, "削除も同じ");
  assert.match(cli, /if \(builtin\) \{ del\.disabled = true; del\.title = tr\("cliSpellBuiltin"\); \}/, "最初から入っているものは消せない");
  assert.match(cli, /renderSpells\(\);\n    ensureFocus\(0\);/, "開いたときに辞書を描き直す");
  assert.match(cli, /renderSpells\(\);   \/\* 呪文を唱えて増減したときも、辞書の GUI を合わせる \*\//);
  assert.match(cli, /renderSpells\(\);   \/\* ⌨ trk284：辞書の「削除」など、GUI が作る文言も入れ替える \*\//, "言語の切り替えでも描き直す");
  assert.match(css, /\.cliSpellPanel\{/, "見た目がある");
  assert.match(css, /\.cliSpellRow\{/);
});

test("辞書の文言は 4 言語そろっている", () => {
  const keys = ["cliSpellPanelTitle", "cliSpellPanelHint", "cliSpellId", "cliSpellBody",
    "cliSpellAddBtn", "cliSpellDelBtn", "cliSpellCount", "cliSpellFull"];
  for (const key of keys) {
    assert.equal((cli.match(new RegExp(`\\b${key}:`, "g")) || []).length, 4, `${key} は 4 言語`);
  }
});

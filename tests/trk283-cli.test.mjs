// SPDX-License-Identifier: GPL-3.0-or-later
/* ⌨ trk283：ターミナルの入口まわり（スキン・入力・段・キー・自動で閉じる）

   見張ること：
   ・ターミナルは**ウィザードの段から**（マスターでは隠す＝段の差を作る）
   ・開くとき、スキンを当てたことを状態行に出す（当てられなければ知らせる・locked は当てない）
   ・「文字が打てる状態か」を検めて、設定で バッジ／状態行／打てないときだけ を選べる（既定はバッジ）
   ・呼び出しキーは **Ctrl／⌘ + 選んだキー**（同じキーで開閉・既定 `）。Esc で取り消し・重なりは受けない
   ・**実行したら閉じる**が既定（オフにすると開いたまま）。help・list のような読むコマンドでは閉じない
   ・`next`／`back`／`re` の短い呼び名が最初から使える */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";
import { cliSource } from "./helpers/cli-src.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const cli = cliSource();
const core = read("js/core.js");
const html = read("index.html");
const css = read("css/style.css");
const levels = read("js/settings-level.js");

/* ---- 純粋な計算（trk267 の範囲）を vm で動かす ---- */
const START = "/* ==================== 純粋な計算（trk267）";
const END = "/* ==================== 純粋な計算（trk267）ここまで";
const from = cli.indexOf(START), to = cli.indexOf(END);
assert.ok(from > 0 && to > from, "「純粋な計算（trk267）」の目印が見つかる");
const sandbox = { Object, Math, Number, String, Array, JSON };
vm.createContext(sandbox);
vm.runInContext(cli.slice(from, to) + `
;globalThis.C = { CLI_COMMANDS, CLI_HELP, pickCliSkin, execute };
`, sandbox, { filename: "js/cli.js#trk283" });
const C = sandbox.C;

const plain = v => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
function fakeDeps(over = {}) {
  const calls = [];
  const deps = {
    calls,
    t: (key, vars) => (vars ? `${key}${JSON.stringify(vars)}` : key),
    name: it => it.title,
    src: it => it.source,
    tracks: () => [{ key: "a", title: "夜の曲", source: "folder" }, { key: "b", title: "朝の曲", source: "file" }],
    play: it => { calls.push(["play", it.key]); return Promise.resolve({ ok: true }); },
    playSpecial: kind => { calls.push(["special", kind]); return Promise.resolve({ ok: true, name: "曲" }); },
    restart: () => { calls.push(["restart"]); return { ok: true, name: "夜の曲" }; },
    current: () => ({ skin: "shadow", volume: 70, track: "" }),
    skins: () => [{ id: "shadow", cats: ["basic"] }, { id: "wizard-cli", cats: ["wizard"] }],
    applySkin: id => { calls.push(["skin", id]); return { ok: true }; },
    volume: pct => { calls.push(["volume", pct]); return { ok: true }; },
    seek: sec => { calls.push(["seek", sec]); return { ok: true }; },
    repeat: mode => { calls.push(["repeat", mode]); return { ok: true }; },
    shuffle: on => { calls.push(["shuffle", on]); return { ok: true }; },
    spells: () => ({}),
    saveSpell: () => ({ ok: true }),
    delSpell: () => ({ ok: true }),
    listLimit: 40,
    ...over
  };
  return deps;
}
const run = async (line, deps = fakeDeps()) => ({ res: await C.execute(line, deps), deps });

/* ==================== 段：ウィザードから ==================== */
test("ターミナルはウィザードの段から（マスターでは隠す）", () => {
  const tier = levels.match(/^\s*cliPanel: (\d+),/m);
  assert.ok(tier, "PANEL_TIER に cliPanel がある");
  assert.equal(Number(tier[1]), 5, "cliPanel は 5（ウィザード）");
  /* ほかの「作り込む人向け」のパネルはマスターのまま（段の差を作る） */
  for (const id of ["vrmPanel", "iosPanel", "addonPanel", "emergencyPanel"]) {
    assert.match(levels, new RegExp(`${id}: 4,`), `${id} はマスターのまま`);
  }
  /* ウィザードの段のスキン（wizard カテゴリ）は既定の棚に出る（trk281） */
  assert.match(core, /wizard:\s+\["basic", "type", "dark", "light", "grad", "fun", "access", "life", "wizard"\]/,
    "ウィザードの段は wizard スキンも既定");
  assert.match(core, /master:\s+\["basic", "type", "dark", "light", "grad", "fun", "access", "life"\]/,
    "マスターには wizard スキンを出さない");
});

/* ==================== 短い呼び名のコマンド ==================== */
test("next／back／re が最初から使える", () => {
  for (const cmd of ["next", "back", "re"]) {
    assert.ok(C.CLI_COMMANDS.includes(cmd), `${cmd} がコマンドにある`);
    assert.ok(C.CLI_HELP.some(([word]) => word === cmd), `${cmd} が help にある`);
  }
});

test("next は次の曲・back は前の曲・re は最初から", async () => {
  const n = await run("next");
  assert.deepEqual(n.deps.calls, [["special", "next"]]);
  assert.equal(n.res.action, true, "何かをした＝実行後に閉じてよい");
  const b = await run("back");
  assert.deepEqual(b.deps.calls, [["special", "prev"]]);
  const r = await run("re");
  assert.deepEqual(r.deps.calls, [["restart"]]);
  assert.equal(r.res.out[0].kind, "out");
  /* 鳴らしていないときは、そう言う */
  const none = await run("re", fakeDeps({ restart: () => ({ ok: false, reason: "none" }) }));
  assert.equal(none.res.out[0].text, "cliRestartNone");
  assert.equal(none.res.action, false);
});

/* ==================== 実行したら閉じる（action の印） ==================== */
test("何かをするコマンドだけ action が立つ（読むだけのコマンドは立たない）", async () => {
  const acting = [["play 夜", 1], ["play next", 1], ["next", 1], ["back", 1], ["re", 1],
    ["skin terminal", 1], ["volume 50", 1], ["repeat all", 1], ["shuffle on", 1]];
  for (const [line] of acting) {
    const { res } = await run(line);
    assert.equal(res.action, true, `${line} は action`);
  }
  for (const line of ["help", "list", "pwd", "history", "grimoire", "echo hi", "spell"]) {
    const { res } = await run(line);
    assert.equal(res.action, false, `${line} は読むだけ＝閉じない`);
  }
  /* パイプ（続けて唱える）でも、action はどれか 1 つが立っていれば立つ */
  const { res } = await run("volume 30 | help");
  assert.equal(res.action, true);
  /* 空行は何もしない */
  const empty = await run("   ");
  assert.equal(empty.res.action, false);
});

test("閉じるかどうかは設定（cliAutoClose）で決まり、既定は オフ（⌨ trk286）", () => {
  assert.match(core, /cliAutoClose: prefs\.cliAutoClose === true/, "既定オフ（自分で入れた人だけ閉じる）");
  assert.match(cli, /if \(res\.action && core\.settings\.cliAutoClose === true\)/, "action のときだけ閉じる");
  assert.match(cli, /toastNote\(say\)/, "閉じたあと、同じ 1 行をトーストで出す");
  assert.match(html, /id="cliAutoCloseChk"/, "⚙ に切り替えがある");
  assert.match(html, /data-i18n="cliAutoClose"/);
});

/* ==================== 呼び出しキー ==================== */
test("呼び出しキーは Ctrl／⌘ + 選んだキー（既定 Ctrl+.）で、同じキーで開閉", () => {
  assert.match(core, /cliKey: validCode\(prefs\.cliKey\) \? prefs\.cliKey : "Period"/, "既定は Period（Ctrl+.）／trk288 で Backquote から変更");
  assert.match(cli, /const cliKeyCode = \(\) => \(core\.validCode\(core\.settings\.cliKey\) \? core\.settings\.cliKey : "Period"\)/);
  /* ⌨ trk287：修飾キーは選べる（既定は Ctrl か ⌘／Win） */
  assert.match(cli, /if \(!cliModPressed\(e\)\) return;/, "選んだ修飾キーと一緒に押す");
  assert.match(cli, /if \(state\.open\) closeCli\(\);/, "開いていれば閉じる（トグル）");
  /* 割り当て：押されたキーを覚える・Esc は取り消し・遊ぶキーと重なるキーは受けない */
  assert.match(cli, /function captureCliKey\(code, shift\)/);
  /* ⌨ trk286：Esc は取り消し・修飾キーだけや Tab は受けない・ほかの操作と重なるキーも受けない */
  assert.match(cli, /if \(!code \|\| code === "Escape"\) \{ cliKeyBinding = null; syncCliKeyUI\(""\); return false; \}/);
  assert.match(cli, /const cliKeyUsable = code => !!code && code !== "Escape" && code !== "Tab"/);
  assert.match(cli, /if \(cliKeyReserved\(code\)\) \{ toastNote\(tr\("cliKeyReserved"\)\); syncCliKeyUI\(tr\("cliKeyReserved"\)\); return false; \}/, "予約キーは拒む（trk288）");
  assert.match(cli, /core\.settings\.cliKey = code;/, "覚えたら設定に入れる");
  assert.match(cli, /core\.saveUserPrefs\(\);/, "保存する");
  assert.match(html, /id="cliKeyAssign"/, "⚙ に割り当てボタン");
  assert.match(html, /id="cliKeyValue"/, "いまのキーを出す");
  /* Esc では閉じる操作も残す（端末の中のキー） */
  /* ⌨ trk286：Esc は <dialog> が閉じるので、自前のハンドラは置かない */
  assert.doesNotMatch(cli, /if \(e\.key === "Escape"\) \{ e\.preventDefault\(\); closeCli\(\); \}/);
  assert.match(cli, /dialog\.addEventListener\("close", \(\) => finishClose\(\)\)/);
});

/* ==================== 入力できるかのチェック ==================== */
test("打てる状態かを検めて、設定で見せ方を選べる（既定はバッジ）", () => {
  assert.match(cli, /function typableState\(\)/, "検める関数がある");
  assert.match(cli, /const focused = document\.activeElement === inputNode;/, "フォーカスを見る");
  assert.match(cli, /inputNode\.disabled === true \|\| inputNode\.readOnly === true/, "使えない入力欄を弾く");
  assert.match(cli, /inputNode\.offsetParent/, "見えているかも見る");
  assert.match(core, /cliTypingCheck: pick\(prefs\.cliTypingCheck, \["badge", "status", "quiet"\], "badge"\)/, "3 つから選ぶ・既定はバッジ");
  assert.match(cli, /if \(typingBadge\) \{/, "バッジを出す");
  assert.match(cli, /typingBadge\.setAttribute\("aria-live", "polite"\)/, "読み上げにも出す");
  assert.match(cli, /if \(!announce\) return st;|if \(announce\) \{/, "状態行にも出せる");
  assert.match(cli, /if \(st\.ok && mode === "quiet"\) return st;/, "静かにしたい人には黙る");
  /* フォーカスが逃げたら戻す・描画直後は少しだけ試す */
  assert.match(cli, /overlay\.addEventListener\("focusin"/);
  assert.match(cli, /function ensureFocus\(tries\)/);
  assert.match(cli, /if \(\(!st\.ok \|\| !st\.focused\) && left < 2\)/, "入らなければ少しだけ試す");
  assert.match(html, /id="cliTypingSel"/, "⚙ に 3 択");
  for (const v of ["badge", "status", "quiet"]) {
    assert.match(html, new RegExp(`<option value="${v}" data-i18n="cliTyping`), `${v} の選択肢`);
  }
  assert.match(css, /\.cliTypingBadge/, "バッジの見た目");
});

/* ==================== スキンの適用 ==================== */
test("開いたときのスキン：当てたことを出す・locked は当てない・個別に選べる", () => {
  const list = [{ id: "shadow", cats: ["basic"] }, { id: "terminal", cats: ["basic"] },
    { id: "wizard-cli", cats: ["wizard"] }, { id: "grad", cats: ["grad"], locked: true }];
  assert.equal(C.pickCliSkin(list, "auto"), "wizard-cli", "端末向けを当てる");
  assert.equal(C.pickCliSkin([{ id: "grad", cats: ["wizard"], locked: true }, { id: "terminal", cats: ["basic"] }], "auto"),
    "terminal", "locked は飛ばす");
  assert.equal(C.pickCliSkin(list, "auto", "shadow"), "shadow", "個別指定が優先");
  assert.equal(C.pickCliSkin(list, "keep", "shadow"), "", "「いまのスキンのまま」は最優先");
  assert.equal(C.pickCliSkin(list, "auto", "nope"), "wizard-cli", "知らない id は無視");
  /* 画面側：当てた（当てられない）ことを状態行に出す */
  assert.match(cli, /function chooseCliSkin\(\)/);
  assert.match(cli, /core\.settings\.cliSkinPickOn === true \? core\.settings\.cliSkinPick : ""/);
  /* ⌨ trk286：スキンは端末の中だけに当てる（背景は変えない） */
  assert.match(cli, /function applySheetSkin\(\)/);
  assert.match(cli, /overlay\.style\.setProperty\(k, v\)/, "板の CSS 変数だけ差し替える");
  assert.match(cli, /tr\("cliSheetSkin", \{ id: sheet \}\)/, "当てたスキンを状態行に出す");
  assert.match(html, /id="cliSkinPickChk"/, "個別に選ぶチェック");
  assert.match(html, /id="cliSkinPickSel"/, "スキンの選択");
  assert.match(cli, /function fillSkinPick\(sel\)/, "スキン名を並べる");
});

/* ==================== 文言（4 言語） ==================== */
test("新しい文言は 4 言語そろっている", () => {
  const keys = ["cliKeyLabel", "cliKeyHint", "cliKeyTaken", "cliAutoClose", "cliAutoCloseHint",
    "cliSkinPickChk", "cliSkinPickLabel", "cliSkinPickAuto", "cliSkinApplied", "cliSkinAppliedFail",
    "cliTypingLabel", "cliTypingBadge", "cliTypingStatus", "cliTypingQuiet", "cliTypingHint",
    "cliTypable", "cliNotTypable", "cliTypableLog", "cliNotTypableLog",
    "cliHelpNext", "cliHelpBack", "cliHelpRe", "cliRestartNone", "cliRestartDone"];
  for (const key of keys) {
    assert.equal((cli.match(new RegExp(`\\b${key}:`, "g")) || []).length, 4, `${key} は 4 言語`);
  }
});

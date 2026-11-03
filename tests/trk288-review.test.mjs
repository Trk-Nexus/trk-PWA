// SPDX-License-Identifier: GPL-3.0-or-later
/* ⌨ trk288：レビュー（trk287 の ⌨ ターミナル・CLI 設定）への対応を見張る。
 *
 * ・純粋な計算（js/cli-pure.js）は vm で読み、入力 → 出力だけを確かめる（ブラウザーは使わない）。
 * ・画面の配線（板の高さ・キーボードの取り方・⚙ の部品）は、本文の目印で確かめる。
 * 実機（iPhone・Android のキーボード、JIS の IME）で見る項目は docs/REVIEW-RESPONSE-TRK287-2026-11-04.md に分けて書いた。 */
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
const core = read("js/core.js");
const html = read("index.html");
const css = read("css/style.css");

/* js/cli-pure.js を vm で読み、公開された名前（window.Trk.cliPure）を取り出す */
const sandbox = { window: { Trk: {} }, Object, Math, Number, String, Array, JSON, RegExp, Error };
vm.createContext(sandbox);
vm.runInContext(pureSrc, sandbox, { filename: "js/cli-pure.js" });
const P = sandbox.window.Trk.cliPure;
const plain = v => JSON.parse(JSON.stringify(v));

/* 偽の端末の外側（trk267 と同じ形。呼ばれた記録を覚える） */
function fakeDeps(over = {}) {
  const calls = [];
  return {
    calls,
    t: (key, vars) => (vars ? `${key}${JSON.stringify(vars)}` : key),
    name: it => it.title,
    src: it => it.source,
    tracks: () => [],
    play: () => Promise.resolve({ ok: true }),
    playSpecial: () => Promise.resolve({ ok: true }),
    current: () => ({ skin: "shadow", volume: 70, track: "" }),
    skins: () => [],
    applySkin: id => { calls.push(["skin", id]); return { ok: true }; },
    volume: pct => { calls.push(["volume", pct]); return { ok: true }; },
    seek: () => ({ ok: true }),
    repeat: () => ({ ok: true }),
    shuffle: () => ({ ok: true }),
    spells: () => ({ "repeat-all": "repeat all", night: "skin terminal; volume 20" }),
    saveSpell: (id, body) => { calls.push(["save", id, body]); return { ok: true }; },
    delSpell: id => { calls.push(["del", id]); return { ok: true }; },
    listLimit: 40,
    ...over,
  };
}

describe("trk288：起動時に落ちない（ROAD の定数は truck.js から公開）", () => {
  test("catch.js の一覧に ROAD_IDS・ROAD_WEIGHTS は無い。truck.js が公開する", () => {
    const catchSrc = read("js/catch.js");
    assert.doesNotMatch(catchSrc, /window\.Trk\.modes = Object\.assign\([^;]*\bROAD_IDS\b/, "catch.js の一覧に書かない");
    assert.match(read("js/truck.js"), /window\.Trk\.modes = Object\.assign\(window\.Trk\.modes \|\| \{\}, \{ ROAD_IDS, ROAD_WEIGHTS \}\);/);
  });
});

describe("trk288：ターミナルの本文を 2 つに分けた（R8）", () => {
  test("cli-pure.js を cli.js より先に読む（index.html の順）", () => {
    const iPure = html.indexOf('src="js/cli-pure.js"');
    const iCli = html.indexOf('src="js/cli.js"');
    assert.ok(iPure > 0 && iCli > iPure, "cli-pure.js が先");
  });
  test("cli.js は純粋な名前を window.Trk.cliPure から取り出す", () => {
    assert.match(cli, /const \{ [^}]*\bexecute\b[^}]* \} = window\.Trk\.cliPure;/);
    assert.match(pureSrc, /window\.Trk\.cliPure = \{ [^}]*\bexecute\b[^}]*\};/);
  });
  test("純粋な側は DOM も core も触らない", () => {
    assert.doesNotMatch(pureSrc, /\bdocument\b|\bcore\./);
  });
});

describe("trk288：辞書の名前は、どの言語の文字でもよい（Q8）", () => {
  test("日本語・全角・小文字化を通す", () => {
    assert.equal(P.spellDraftProblem("夜", "volume 20", {}), "", "日本語");
    assert.equal(P.spellIdKey("ＮＩＧＨＴ"), "night", "全角は半角に寄せる（NFKC）");
    assert.equal(P.spellDraftProblem("ＮＩＧＨＴ", "volume 20", {}), "", "全角の英字も登録できる");
    assert.equal(P.spellDraftProblem("밤", "volume 20", {}), "", "ハングル");
    assert.equal(P.spellDraftProblem("夜-散歩", "volume 20", {}), "", "文字と - を混ぜてよい");
  });
  test("先頭の - や空白、長すぎる名前は拒む", () => {
    assert.equal(P.spellDraftProblem("-x", "volume 20", {}), "id");
    assert.equal(P.spellDraftProblem("a b", "volume 20", {}), "id");
    assert.equal(P.spellDraftProblem("", "volume 20", {}), "id");
    assert.equal(P.spellDraftProblem("a".repeat(24), "volume 20", {}), "", "24 字まで");
    assert.equal(P.spellDraftProblem("a".repeat(25), "volume 20", {}), "id", "25 字は拒む");
  });
  test("本文・上限・内蔵の扱いは従来どおり", () => {
    assert.equal(P.spellDraftProblem("night", "  ", {}), "body");
    assert.equal(P.spellDraftProblem("night", "volume 20", { builtin: true }), "builtin");
    assert.equal(P.spellDraftProblem("night", "volume 20", { count: 24 }), "full");
  });
  test("読み込みの規則（cli.js）も同じ正規表現・同じ正規化を使う", () => {
    assert.match(cli, /const id = spellIdKey\(rawId\);/, "保存された辞書も NFKC で読む");
    assert.match(cli, /if \(!SPELL_ID_RE\.test\(id\)\) continue;/);
    assert.doesNotMatch(cli, /\/\^\[a-z0-9\]\[a-z0-9-\]\{0,23\}\$\//, "英小文字だけの古い規則は残っていない");
  });
});

describe("trk288：cast で辞書の名前も唱える（R1）", () => {
  test("cast night は spell night と同じく唱える", () => {
    const deps = fakeDeps();
    return P.execute("cast night", deps).then(res => {
      assert.deepEqual(plain(deps.calls), [["skin", "terminal"], ["volume", 20]], "辞書の中身を順に唱える");
      assert.equal(res.out.some(o => o.kind === "err"), false, "その呪文は分かりません、にならない");
    });
  });
  test("コマンドの名前は辞書より優先（cast volume 30 は volume）", async () => {
    const deps = fakeDeps({ spells: () => ({ volume: "skin terminal" }) });
    await P.execute("cast volume 30", deps);
    assert.deepEqual(plain(deps.calls), [["volume", 30]]);
  });
  test("cast の中で cast は使えない（従来どおり）", async () => {
    const deps = fakeDeps();
    const res = await P.execute("cast cast volume 1", deps);
    assert.ok(res.out.some(o => o.kind === "err"));
  });
  test("cast は 12 件まで（CAST_MAX）", async () => {
    const deps = fakeDeps();
    await P.execute("cast " + Array.from({ length: 20 }, () => "volume 1").join("; "), deps);
    assert.equal(deps.calls.filter(c => c[0] === "volume").length, P.CAST_MAX);
  });
});

describe("trk288：呼び出しキーの予約（C3）", () => {
  test("ブラウザー・OS が先に取るキーは拒む", () => {
    for (const code of ["KeyW", "KeyT", "KeyN", "KeyQ", "KeyR", "KeyL", "KeyF", "KeyP", "KeyS", "KeyH", "KeyJ", "KeyD", "KeyE", "KeyG", "KeyO", "KeyU",
      "Tab", "Escape", "Digit1", "Digit9", "Digit0", "Numpad5", "F1", "F5", "F11", "F12", "Minus", "Equal", "NumpadAdd"]) {
      assert.equal(P.cliKeyReserved(code), true, `${code} は予約`);
    }
  });
  test("遊びに使える・ブラウザーが取らないキーは通す（. などの既定の候補）", () => {
    for (const code of ["KeyA", "KeyM", "Period", "Slash", "Backquote", "Space", "Semicolon", "Comma", "BracketLeft"]) {
      assert.equal(P.cliKeyReserved(code, "ctrlOrMeta", false), false, `${code} は登録できる`);
    }
  });
  test("Ctrl（⌘）＋K はブラウザーの検索に残す（予約）。Shift 付きと Alt 付きは登録できる", () => {
    for (const mod of ["ctrlOrMeta", "ctrl", "meta"]) assert.equal(P.cliKeyReserved("KeyK", mod, false), true, `${mod}+K は予約`);
    assert.equal(P.cliKeyReserved("KeyK", "ctrlOrMeta", true), false, "Ctrl+Shift+K は登録できる");
    assert.equal(P.cliKeyReserved("KeyK", "alt", false), false, "Alt+K は登録できる");
  });
  test("割り当ての中で、予約キーは拒み・重なりは拒まない・Shift は覚える", () => {
    assert.match(cli, /if \(cliKeyReserved\(code, cliMod\(\), shift === true\)\) \{ toastNote/, "予約キーを拒む");
    assert.doesNotMatch(cli, /if \(cliKeyUsed\(code\)\)/, "遊ぶキーとの重なりでは拒まない");
    assert.match(cli, /core\.settings\.cliShift = shift === true;/, "Shift の有無を覚える");
    assert.match(cli, /captureCliKey\(core\.keyCodeOf\(e\), e\.shiftKey === true\)/);
  });
  test("呼び出しは、登録した Shift の有無と合うときだけ（Ctrl+Shift+K も登録できる）", () => {
    assert.match(cli, /if \(\(e\.shiftKey === true\) !== \(core\.settings\.cliShift === true\)\) return;/);
    assert.match(cli, /const modLabel = \(\) => modShort\(\) \+ \(core\.settings\.cliShift === true \? " \+ Shift" : ""\);/);
  });
  test("既定の呼び出しキーは Period（Ctrl+.）。保存のない人だけ変わる", () => {
    assert.match(core, /cliKey: validCode\(prefs\.cliKey\) \? prefs\.cliKey : "Period"/);
    assert.match(core, /cliShift: prefs\.cliShift === true,/);
    assert.match(cli, /core\.validCode\(core\.settings\.cliKey\) \? core\.settings\.cliKey : "Period"/);
  });
});

describe("trk288：入力の入れ方（R2）と、キーボードでの押し方（C1）", () => {
  test("既定は native（ブラウザーに任せる）。exec を選べば execCommand で入れる", () => {
    assert.match(core, /cliInsert: pick\(prefs\.cliInsert, \["native", "exec"\], "native"\)/);
    assert.match(cli, /if \(core\.settings\.cliInsert !== "exec"\) return;/);
    assert.match(cli, /document\.execCommand\("insertText", false, ch\) === true/);
  });
  test("bubble の段：ほかの処理が止めた 1 文字だけ、端末が入れる（p・: を落とさない）", () => {
    assert.match(cli, /if \(!e\.defaultPrevented \|\| !isTypeable\(e\)/);
    assert.match(cli, /insertOwn\(e\.key\);/);
  });
  test("ボタン・選択・リンクの上では、Space・Enter を奪わない（C1）", () => {
    assert.match(cli, /const CLI_CONTROL_SEL = "button, summary, select, a, \[role=button\]";/);
    assert.match(cli, /if \(t && t\.closest && t\.closest\(CLI_CONTROL_SEL\)\) return;/);
  });
  test("⚙ に、入れ方の選択と、音の注記がある", () => {
    assert.match(html, /<select id="cliInsertSel"/);
    assert.match(html, /<option value="native" data-i18n="cliInsertNative">/);
    assert.match(html, /<option value="exec" data-i18n="cliInsertExec">/);
    assert.match(html, /id="cliBellNote" hidden data-i18n="cliBellSkinOff"/);
    assert.match(cli, /note\.hidden = cli\.bell === true;/, "音はアプリのいまのスキン（beep と同じ）で決める");
  });
});

describe("trk288：低い画面・キーボードが出たとき（C2）", () => {
  test("入力欄を押し出さない（子は縮まない・ログだけが縮む）", () => {
    assert.match(css, /dialog\.cliDialog>\*\{flex:none\}/);
    assert.match(css, /dialog\.cliDialog>\.cliLog\{flex:1 1 0;min-height:72px\}/);
  });
  test("低い画面では案内・バッジ・つまみを畳み、辞書の欄を抑える", () => {
    assert.match(css, /@media \(max-height:520px\)\{[\s\S]*?\.cliTypingBadge,dialog\.cliDialog>\.cliHintText,dialog\.cliDialog>\.cliSheetHandle\{display:none\}/);
    assert.match(css, /dialog\.cliDialog>\.cliSpellPanel\{max-height:22vh\}/);
  });
  test("visualViewport に合わせて、上限と底を決める（applySheetSkin で消えても当て直す）", () => {
    assert.match(cli, /function fitToViewport\(\)/);
    assert.match(cli, /overlay\.style\.setProperty\("max-height", h \+ "px"\);/);
    assert.match(cli, /overlay\.style\.setProperty\("bottom", bottom \+ "px"\);/);
    assert.match(cli, /window\.visualViewport\.addEventListener\("resize", fitToViewport\);/);
    assert.match(cli, /overlay\.removeAttribute\("style"\);\n    fitToViewport\(\);/);
  });
});

describe("trk288：4 言語の文言がそろっている", () => {
  test("新しい文言は、4 言語すべてにある", () => {
    for (const key of ["cliKeyReserved", "cliBellSkinOff", "cliInsertLabel", "cliInsertNative", "cliInsertExec", "cliInsertHint"]) {
      assert.equal((cli.match(new RegExp(`\\b${key}:`, "g")) || []).length, 4, `${key} は 4 言語`);
    }
  });
  test("案内の既定キーは Ctrl+.（4 言語）", () => {
    assert.equal((cli.match(/Ctrl\+\. /g) || []).length >= 3, true);
    assert.doesNotMatch(cli, /Ctrl\+` \//, "旧い Ctrl+` の案内は残っていない");
  });
});

describe("trk288：日本語の辞書の名前を、登録・唱える・消す", () => {
  test("spell add 夜 … は登録され、spell 夜 で唱えられる（全角の名前も同じ鍵）", async () => {
    const deps = fakeDeps({ spells: () => ({}) });
    const add = await P.execute("spell add 夜 volume 20", deps);
    assert.deepEqual(plain(deps.calls), [["save", "夜", "volume 20"]]);
    assert.equal(add.out.some(o => o.kind === "err"), false);
    const deps2 = fakeDeps({ spells: () => ({ "夜": "volume 20" }) });
    await P.execute("spell ＹＯＲＵ", deps2);
    assert.deepEqual(plain(deps2.calls), [], "別の名前は唱えない（ＹＯＲＵ は 夜 ではない）");
    await P.execute("spell 夜", deps2);
    assert.deepEqual(plain(deps2.calls), [["volume", 20]]);
  });
  test("全角の名前は半角に寄せて登録される（ＮＩＧＨＴ → night）", async () => {
    const deps = fakeDeps({ spells: () => ({}) });
    await P.execute("spell add ＮＩＧＨＴ volume 5", deps);
    assert.deepEqual(plain(deps.calls), [["save", "night", "volume 5"]]);
  });
  test("del も同じ鍵で消す", async () => {
    const deps = fakeDeps({ spells: () => ({ "夜": "volume 20" }) });
    await P.execute("spell del 夜", deps);
    assert.deepEqual(plain(deps.calls), [["del", "夜"]]);
  });
});

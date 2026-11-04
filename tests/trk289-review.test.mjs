// SPDX-License-Identifier: GPL-3.0-or-later
/* ⌨ trk289：レビュー（trk288 の確認・trk-Nexus-review-trk288-2026-11-04.zip）への対応を見張る。
 *
 * ・N1 日本語の辞書の名前が、読み込みで消えない（core.js の cleanCliSpells は vm で取り出して動かす）
 * ・N2 Ctrl（⌘）と組む編集キー（A・C・V・X・Z・Y）と、Shift 付きの I・C・J は予約
 * ・N3 修飾キーを後から変えて、予約のキーになる組み合わせは受けない（本文の目印で確かめる）
 * ・R-b 背の低い画面（520px 以下）で、出力の最小が入力欄を押し出さない（CSS の後ろ順）
 * ・R-c 注記の版番号は、この版（trk288 の上の trk289）に揃える */
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
const css = read("css/style.css");

const sandbox = { window: { Trk: {} }, Object, Math, Number, String, Array, JSON, RegExp, Error };
vm.createContext(sandbox);
vm.runInContext(pureSrc, sandbox, { filename: "js/cli-pure.js" });
const P = sandbox.window.Trk.cliPure;

/* core.js から、辞書の名前の検査（CLI_SPELL_ID_RE・cliSpellKey・cleanCliSpells）だけを取り出す */
function extractCore() {
  const start = core.indexOf("const CLI_SPELL_ID_RE");
  const fnAt = core.indexOf("function cleanCliSpells");
  assert.ok(start >= 0 && fnAt > start, "core.js に辞書の検査がある");
  const end = core.indexOf("\n}\n", fnAt);
  return core.slice(start, end + 3);
}
const coreSandbox = { Object, Math, Number, String, Array, JSON, RegExp, Error };
vm.createContext(coreSandbox);
vm.runInContext(extractCore(), coreSandbox, { filename: "js/core.js" });

describe("trk289：N1 日本語の辞書の名前が、読み込みで消えない", () => {
  test("保存されていた日本語・全角の名前は、読み込みで残る（NFKC・小文字）", () => {
    const out = coreSandbox.cleanCliSpells({ "朝": "volume 50", "Ｎight": "volume 25", "bad id": "x", "夜": "  " });
    assert.deepEqual(JSON.parse(JSON.stringify(out)), { "朝": "volume 50", "night": "volume 25" });
  });
  test("core の規則と cli-pure の規則は同じ（片方だけ変わったら落ちる）", () => {
    const coreRe = core.match(/const CLI_SPELL_ID_RE = (\/.*\/u);/);
    const pureRe = pureSrc.match(/const SPELL_ID_RE = (\/.*\/u);/);
    assert.ok(coreRe && pureRe, "両方に正規表現がある");
    assert.equal(coreRe[1], pureRe[1]);
    assert.match(core, /const id = cliSpellKey\(id0\);/, "読み込みでも NFKC・小文字に揃える");
  });
  test("読み込んだ鍵と、spell add で入れた鍵が同じ（往復）", () => {
    for (const name of ["朝", "Ｎight", "NIGHT", "夜-1"]) {
      const key = P.spellIdKey(name);
      assert.equal(coreSandbox.cliSpellKey(name), key, name);
      assert.equal(coreSandbox.cleanCliSpells({ [key]: "volume 1" })[key], "volume 1", `${name} は往復で残る`);
    }
  });
});

describe("trk289：N2 Ctrl（⌘）と組む編集キーは予約", () => {
  test("Ctrl＋A・C・V・X・Z・Y は予約（Shift を足しても）", () => {
    for (const code of ["KeyA", "KeyC", "KeyV", "KeyX", "KeyZ", "KeyY"]) {
      assert.equal(P.cliKeyReserved(code, "ctrlOrMeta", false), true, `Ctrl+${code}`);
      assert.equal(P.cliKeyReserved(code, "ctrl", false), true, `ctrl+${code}`);
      assert.equal(P.cliKeyReserved(code, "meta", false), true, `meta+${code}`);
    }
    assert.equal(P.cliKeyReserved("KeyZ", "ctrlOrMeta", true), true, "やり直し（Ctrl+Shift+Z）");
    assert.equal(P.cliKeyReserved("KeyV", "ctrlOrMeta", true), true, "Ctrl+Shift+V");
  });
  test("Ctrl＋Shift＋I・C・J は開発者ツール（予約）", () => {
    for (const code of ["KeyI", "KeyC", "KeyJ"]) {
      assert.equal(P.cliKeyReserved(code, "ctrlOrMeta", true), true, `Ctrl+Shift+${code}`);
    }
  });
  test("Ctrl＋Shift＋K は登録できる（ユーザーの判断）。Alt と組む編集キーも登録できる", () => {
    assert.equal(P.cliKeyReserved("KeyK", "ctrlOrMeta", true), false);
    assert.equal(P.cliKeyReserved("KeyA", "alt", false), false, "Alt+A は登録できる");
    assert.equal(P.cliKeyReserved("KeyV", "alt", true), false, "Alt+Shift+V は登録できる");
    assert.equal(P.cliKeyReserved("KeyI", "alt", true), false, "Alt+Shift+I は登録できる");
  });
  test("遊びのキー・記号は、Ctrl と組んでも登録できる", () => {
    for (const code of ["KeyB", "KeyM", "Period", "Slash", "Semicolon", "Comma"]) {
      assert.equal(P.cliKeyReserved(code, "ctrlOrMeta", false), false, code);
    }
  });
});

describe("trk289：N3 修飾キーを後から変えても、予約は通す", () => {
  test("修飾キーの変更は、予約になる組み合わせを受けない（元に戻して案内する）", () => {
    assert.match(cli, /const next = CLI_MODS\.includes\(modSel\.value\) \? modSel\.value : "ctrlOrMeta";/);
    assert.match(cli, /if \(cliKeyReserved\(cliKeyCode\(\), next, core\.settings\.cliShift === true\)\) \{\s*\n\s*modSel\.value = cliMod\(\);/,
      "予約なら、選び直した欄を元に戻す");
    assert.match(cli, /toastNote\(tr\("cliModReserved"\)\);/, "案内を出す");
  });
  test("案内の文は、4 言語すべてにある", () => {
    const m = cli.match(/cliModReserved: "/g) || [];
    assert.equal(m.length, 4, "ja・en・zh・ko の 4 つ");
  });
  test("Alt＋K を登録したあと Ctrl に変えると、Ctrl＋K（予約）にならず、元の Alt に戻る", () => {
    const next = "ctrl", key = "KeyK", shift = false;
    assert.equal(P.cliKeyReserved(key, next, shift), true, "この組み合わせは予約で、受けない");
    assert.equal(P.cliKeyReserved(key, "alt", shift), false, "Alt のままなら登録できている");
  });
});

describe("trk289：R-b 背の低い画面で、出力の最小が入力欄を押し出さない", () => {
  test("520px 以下の規則は、幅 560px 以下の規則より後ろにある（同じ強さなので後ろが勝つ）", () => {
    const narrow = css.indexOf("@media (max-width:560px){");
    const shortRule = css.indexOf("dialog.cliDialog>.cliLog{min-height:48px}");
    assert.ok(narrow >= 0, "560px の規則がある");
    assert.ok(shortRule > narrow, "48px の規則は 560px の規則より後ろ");
    assert.match(css.slice(shortRule - 40, shortRule), /@media \(max-height:520px\)\{/, "520px の中にある");
  });
  test("背の低い画面では「半分」の板を 80dvh にして、見出し・入力の行が入る（実機の 390×360 で入力欄が出なかった）", () => {
    const at = css.indexOf('dialog.cliDialog[data-size="half"]{height:80dvh}');
    assert.ok(at > css.indexOf("@media (max-height:520px){\n  dialog.cliDialog>.cliLog{min-height:48px}"), "520px の中");
    assert.ok(css.indexOf('dialog.cliDialog[data-size="half"]{height:52dvh}') < at, "通常の 52dvh は残す（上書きは 520px の中だけ）");
  });
});

describe("trk289：R-c 注記の版番号を揃える", () => {
  test("C1・C2 の注記は trk288（この版の前段）。別の版番号は残らない", () => {
    assert.doesNotMatch(cli, /trk290/);
    assert.doesNotMatch(css, /trk290/);
    assert.doesNotMatch(cli, /trk289（C[12]）/, "C1・C2 は trk288 の内容");
    assert.match(cli, /trk288（C1）/);
    assert.match(cli, /trk288（C2）/);
  });
});

describe("trk289：R-a 保存済みの Backquote を一度だけ Period にする", () => {
  test("印（cliKeyPeriod1）が無い保存の Backquote だけを移す。印の後の Backquote は残す", () => {
    assert.match(core, /cliKey: \(validCode\(prefs\.cliKey\) && !\(prefs\.cliKey === "Backquote" && prefs\.cliKeyPeriod1 !== true\)\) \? prefs\.cliKey : "Period",/);
    assert.match(core, /cliKeyPeriod1: true,/, "印を立てる（次の保存で残る）");
  });
  test("一回限りの印として登録簿に載っている（docs/MIGRATIONS.md）", () => {
    const reg = read("docs/MIGRATIONS.md");
    assert.match(reg, /\| `cliKeyPeriod1` \| 一回限りの印 \| trk289 \| 2027-02-28 \|/);
  });
});

// SPDX-License-Identifier: GPL-3.0-or-later
/* 🗓 trk260（2026-11-02）：**開いた直後が「枠だけ・文字なし・ボタンが効かない」** の見張り
 *
 *   起きたこと（利用者からの報告・trk-standalone-2026-11-01-trk248.zip）：
 *     画面の枠と色は出るが、`data-i18n` の文字が全部空のまま。曲リストも空、ようこそも出ない。
 *     フッターのリンクだけは押せる（HTML の <a> なので JS が死んでいても動く）。
 *   原因：
 *     js/core.js の **先頭** で `fitStage()` を呼んでいた。fitStage は
 *     `libListHeight()` → `const LIB_LIST_MIN`（同じファイルの 1800 行台）を使うので、
 *     宣言より先に触って `ReferenceError: Cannot access 'LIB_LIST_MIN' before initialization`（TDZ）。
 *     core.js は IIFE なので、そこで **ファイルの残り全部**（settings・言語の差し込み・画面の配線）が止まり、
 *     後続のライブラリも `window.Trk.core` が無いことで次々に落ちていました。
 *   直し方：
 *     最初の `fitStage()` を **ファイルの最後**（定義を読み終えた後）へ移す。
 *
 *   このテストは、同じ罠（**読み込み時に走る呼び出しが、後ろで宣言する const を使う**）を
 *   依存パッケージ無しで見張ります。ブラウザを起動しないので速い代わりに、
 *   「トップレベルの `NAME();` から、たどれる範囲の関数」だけを見ます。
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const JS_DIR = path.join(ROOT, "js");
const jsFiles = fs.readdirSync(JS_DIR).filter(f => f.endsWith(".js")).sort();
const coreSrc = read("js/core.js");
const coreLines = coreSrc.split("\n");

/* トップレベルの宣言（行頭が const / let / function）の位置を集める */
function topLevelNames(lines) {
  const consts = [];   /* { name, line } : 後ろで宣言する = 先に触ると TDZ */
  const funcs = new Map();  /* name -> { line, end } */
  lines.forEach((line, i) => {
    const decl = line.match(/^(?:const|let)\s/);
    if (decl) {
      /* 宣言文を ; までつなぐ（複数行の宣言にも当てる） */
      let stmt = line;
      for (let j = i + 1; !/;\s*$/.test(stmt) && j < lines.length && j < i + 12; j++) stmt += " " + lines[j];
      const cut = stmt.indexOf(";");
      stmt = cut >= 0 ? stmt.slice(0, cut + 1) : stmt;
      if (/^(?:const|let)\s*[[{]/.test(stmt)) return;   /* 分割代入は対象外（名前が増えない） */
      for (const m of stmt.matchAll(/(?:^|,)\s*([A-Za-z_$][\w$]*)\s*=/g)) consts.push({ name: m[1], line: i + 1 });
    }
    const fn = line.match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (fn) funcs.set(fn[1], { line: i + 1, end: lines.length });
  });
  /* 関数の本体は「次のトップレベル宣言」まで（行頭の function/const/let/var） */
  for (const [name, info] of funcs) {
    for (let j = info.line; j < lines.length; j++) {
      if (j > info.line && /^(?:function|const|let|var)\s/.test(lines[j])) { info.end = j; break; }
      if (j > info.line && /^\}\)\(\);/.test(lines[j])) { info.end = j; break; }
    }
    funcs.set(name, info);
  }
  return { consts, funcs };
}

/* 関数の中で使っている名前（後ろで宣言する const を踏んでいないか）を、呼び出しをたどって集める */
function refsFrom(fnName, funcs, lines, depth = 0, seen = new Set()) {
  if (depth > 3 || seen.has(fnName) || !funcs.has(fnName)) return new Set();
  seen.add(fnName);
  const { line, end } = funcs.get(fnName);
  const body = lines.slice(line - 1, end).join("\n");
  const out = new Set();
  for (const m of body.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
    if (!funcs.has(m[1])) continue;
    out.add(m[1]);
    for (const r of refsFrom(m[1], funcs, lines, depth + 1, seen)) out.add(r);
  }
  return out;
}

/* ファイルごとに「トップレベルで呼んでいる NAME();」を拾い、後ろの const を踏んでいたら報告 */
function hazardsIn(file) {
  const lines = read(path.join("js", file)).split("\n");
  const { consts, funcs } = topLevelNames(lines);
  const found = [];
  lines.forEach((line, i) => {
    const call = line.match(/^([A-Za-z_$][\w$]*)\(\);\s*$/);
    if (!call || !funcs.has(call[1])) return;
    const at = i + 1;
    const used = refsFrom(call[1], funcs, lines);
    for (const c of consts) {
      if (c.line <= at) continue;
      const body = used.has(c.name) || new RegExp("(?<![.\\w$])" + c.name.replace(/\$/g, "\\$") + "(?![\\w$])")
        .test(lines.slice(funcs.get(call[1]).line - 1, funcs.get(call[1]).end).join("\n"));
      if (body) found.push({ file, call: call[1], at, name: c.name, declared: c.line });
    }
  });
  return found;
}

describe("trk260：起動の順番（読み込み時の TDZ）", () => {
  test("どの js も、後ろで宣言する const を読み込み時に触っていない", () => {
    const bad = jsFiles.flatMap(hazardsIn);
    assert.deepEqual(
      bad.map(b => `${b.file}: L${b.at} ${b.call}() → ${b.name}（L${b.declared} で宣言）`),
      [],
      "読み込み時に走る呼び出しが、後ろで宣言する const を触っています（TDZ で**ファイルの残りが丸ごと止まります**）"
    );
  });

  test("js/core.js の最初の fitStage() は、定義を読み終えたファイルの最後にある", () => {
    const calls = coreLines.map((l, i) => [l, i + 1]).filter(([l]) => l === "fitStage();");
    assert.equal(calls.length, 1, "トップレベルの fitStage() は 1 回だけ");
    const at = calls[0][1];
    const libConst = coreLines.findIndex(l => l.startsWith("const LIB_LIST_PAD")) + 1;
    const densityConst = coreLines.findIndex(l => l.startsWith("const UI_DENSITY_CHOICES")) + 1;
    assert.ok(libConst > 0 && densityConst > 0, "目印の const が見つかる");
    assert.ok(at > libConst, `fitStage()（L${at}）は LIB_LIST_MIN（L${libConst}）より後ろで呼ぶ`);
    assert.ok(at > densityConst, `fitStage()（L${at}）は UI_DENSITY_CHOICES（L${densityConst}）より後ろで呼ぶ`);
    /* 先頭の addEventListener は残す（窓の大きさが変わったら合わせ直す） */
    assert.ok(coreSrc.includes('addEventListener("resize", fitStage);'), "resize の登録は残っている");
  });

  test("core.js の中で fitStage() を先に呼んでいない（先頭 100 行に無い）", () => {
    const head = coreLines.slice(0, 100);
    assert.ok(!head.some(l => /^fitStage\(\);/.test(l)), "先頭で fitStage() を呼ぶと TDZ で core.js が止まる");
  });
});

/* 言語の差し込みが「読み込み時に落ちない」ための、最低限の目印。
   （ブラウザを起動しないテストなので、実際の起動確認は実機の用紙で行う） */
describe("trk260：起動の入口", () => {
  const html = read("index.html");
  test("core.js は data.js の後ろで読む（window.Trk.data を使うため）", () => {
    const data = html.indexOf('src="js/data.js"');
    const core = html.indexOf('src="js/core.js"');
    assert.ok(data > 0 && core > 0, "どちらも index.html にある");
    assert.ok(data < core, "data.js → core.js の順");
  });
  test("言語の欄と、文章の差し込み先がある", () => {
    assert.ok(html.includes('id="language"'), "言語の select");
    assert.ok(html.includes('data-i18n="language"'), "言語の見出し");
    assert.ok(html.includes('data-i18n="tagline"'), "題（applyLanguage が最初に埋める）");
  });
});

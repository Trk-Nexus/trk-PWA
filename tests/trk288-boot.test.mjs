// SPDX-License-Identifier: GPL-3.0-or-later
/* ⌨ trk288：起動時の例外（ROAD_IDS is not defined）の見張り。
 *
 * 事故の形：window.Trk.modes = Object.assign(…, { 名前, … }) の一覧に、そのファイルの中で
 * 宣言されていない名前（別ファイルの const など）が混ざると、代入の行ごと ReferenceError で落ち、
 * Trk.modes が空になる。1714 本の単体テストは通るのに、ページは落ちていた。
 * ここでは、一覧の名前が「同じファイルの宣言」か「window に出す名前」のどちらかで解決できることを確かめる。
 * （ブラウザーは使わない。実際のページ読み込みでの確認は tools/smoke-browser.mjs が担う） */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./helpers/browser-data.mjs";

const JS_DIR = path.join(ROOT, "js");
const files = fs.readdirSync(JS_DIR).filter(f => f.endsWith(".js")).sort();
const text = Object.fromEntries(files.map(f => [f, fs.readFileSync(path.join(JS_DIR, f), "utf8")]));

/* 「window に出している」名前（window.X = や defineProperty(window, "X")） */
const windowNames = new Set();
for (const src of Object.values(text)) {
  for (const m of src.matchAll(/(?<![.\w$])(?:window|globalThis|self)\s*\.\s*([A-Za-z_$][\w$]*)\s*=(?!=)/g)) windowNames.add(m[1]);
  for (const m of src.matchAll(/defineProperty\(\s*(?:window|globalThis|self)\s*,\s*"([A-Za-z_$][\w$]*)"/g)) windowNames.add(m[1]);
}

/* window.Trk.modes = Object.assign(…, { … }) の中身の名前一覧 */
function modesNames(src) {
  const out = [];
  for (const m of src.matchAll(/window\.Trk\.modes\s*=\s*Object\.assign\(\s*window\.Trk\.modes\s*\|\|\s*\{\}\s*,\s*\{([^}]*)\}/g)) {
    const body = m[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    for (const part of body.split(",")) {
      const id = part.trim();
      if (id) out.push(id);
    }
  }
  return out;
}

describe("trk288：起動時に落ちない（Trk.modes の一覧は解決できる）", () => {
  test("Trk.modes の一覧の名前は、同じファイルの宣言か window の名前で解決できる", () => {
    const bad = [];
    for (const [file, src] of Object.entries(text)) {
      const names = modesNames(src);
      for (const name of names) {
        const declared = new RegExp(`(?<![\\w$.])(?:const|let|var|function\\*?|class)\\s+${name.replace(/\$/g, "\\$")}(?![\\w$])`).test(src);
        if (!declared && !windowNames.has(name)) bad.push(`${file}: ${name}`);
      }
    }
    assert.deepEqual(bad, [], "宣言されていない名前が Trk.modes の一覧にある（起動時に ReferenceError で落ちる）");
  });

  test("道の抽選の名前（ROAD_IDS・ROAD_WEIGHTS）は truck.js から公開されている", () => {
    const truck = text["truck.js"];
    const names = modesNames(truck);
    assert.ok(names.includes("ROAD_IDS") && names.includes("ROAD_WEIGHTS"), "truck.js が公開する");
    assert.ok(!modesNames(text["catch.js"]).includes("ROAD_IDS"), "catch.js の一覧には書かない（別ファイルからは見えない）");
  });

  test("一覧を読めたこと自体を確かめる（空振りで通らないように）", () => {
    assert.ok(modesNames(text["catch.js"]).length > 40, "catch.js の一覧は 40 件を超える");
    assert.ok(modesNames(text["truck.js"]).length >= 2, "truck.js の一覧が読める");
  });
});

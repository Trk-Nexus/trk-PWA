// SPDX-License-Identifier: GPL-3.0-or-later
/* 📥 trk231：倉庫の目録まわりを「導入しやすい・確かめやすい・消しやすい」に
 *
 *   利用者の相談（2026-11-01）：
 *     「こちら側が導入しやすい形や、ユーザーが確かめやすい形、導入や消去の簡略化などを検討して、
 *       開発案を整えるのも良いかもしれません」
 *
 *   この版で入れたもの：
 *     ・📥 まとめて入れる（目録＋パックをまとめて選ぶ／まとめてドロップ。名前で突き合わせる）
 *     ・導入済み・使用中・大きさ違いの表示（目録の一覧の1か所で分かる）
 *     ・その場で「使う・消す」（消すときは、使っていれば先に外す）
 *     ・🔎 中身（ファイル・大きさ・sha256・書体とライセンス）を入れる前に見られる
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const src = read("js/pack-catalog.js");
const customSrc = read("js/custom.js");
const i18nSrc = read("js/i18n.js");
const html = read("index.html");

/* index.html と同じく、スクリプトを読み込んだだけの状態を作る */
function loadModule() {
  const sandbox = {
    window: {}, console, crypto, Promise, JSON, Math, Number, String, Object, Array, Set, Map, Error, Blob, Uint8Array, Date,
    document: { readyState: "complete", getElementById: () => null, createElement: () => ({ style:{}, append(){}, addEventListener(){} }) },
    addEventListener: () => {}, confirm: () => true, CSS: { escape: s => s }, tr: k => k,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: "js/pack-catalog.js" });
  return sandbox.window.Trk.packCatalog;
}
const api = loadModule();

describe("trk231 同じパックかどうかの判定（名前と作者）", () => {
  test("前後の空白・大文字小文字の違いは同じとみなす", () => {
    assert.equal(api.samePackAs({ name:"丸ゴのお茶目", author:"trk" }, { name:" 丸ゴのお茶目 ", author:"TRK" }), true);
  });
  test("名前か作者が違えば別（作者が空どうしは同じ）", () => {
    assert.equal(api.samePackAs({ name:"A", author:"x" }, { name:"A", author:"y" }), false);
    assert.equal(api.samePackAs({ name:"A", author:"" }, { name:"A" }), true);
    assert.equal(api.samePackAs({ name:"A", author:"x" }, { name:"B", author:"x" }), false);
  });
  test("null や欠けた項目でも落ちない", () => {
    assert.equal(api.samePackAs(null, { name:"", author:"" }), true);
    assert.equal(api.samePackAs(undefined, undefined), true);
  });
});

describe("trk231 一括導入の配線", () => {
  test("目録＋パックをまとめて選ぶ欄がある（multiple）", () => {
    assert.ok(html.includes('id="catalogBundle"'));
    assert.match(html, /id="catalogBundle"[^>]*multiple/);
    assert.ok(html.includes('data-i18n="catalogBundleOpen"'));
    assert.ok(html.includes('data-i18n="catalogBundleHint"'));
  });

  test("まとめて入れる処理がある（目録を読み、名前で突き合わせ、1件ずつ照合して入れる）", () => {
    assert.match(src, /async function importBundle\(files\)/);
    assert.match(src, /const json = all\.find\(f => \/\\\.json\$\/i\.test\(f\.name\)\)/);
    assert.match(src, /packs\.find\(e => e\.file\.split\("\/"\)\.pop\(\)\.toLowerCase\(\) === base\)/);
    assert.match(src, /installFromCatalog\(entry, file, \{ silent: true \}\)/);
    /* すでに入っているものは入れ直さない */
    assert.match(src, /installed\.some\(rec => samePack\(entry, rec\)\)/);
  });

  test("まとめてドロップは、custom.js が受け止めずに目録の側へ渡す", () => {
    assert.match(customSrc, /if \(list\.length > 1 \|\| list\.some\(x => \/\\\.json\$\/i\.test\(x\.name\)\)\) return;/);
    assert.match(src, /if \(files\.some\(f => \/\\\.json\$\/i\.test\(f\.name\)\)\) importBundle\(files\)/);
  });

  test("外部へ取りに行かない（trk230 の約束を保つ）", () => {
    assert.equal(/\bfetch\s*\(/.test(src), false);
    assert.equal(/XMLHttpRequest/.test(src), false);
    assert.equal(/["'`]https?:\/\//.test(src), false);
  });
});

describe("trk231 導入済み・使う・消す", () => {
  test("アプリ側（custom.js）が、使う・外す・消す・一覧を公開している", () => {
    for (const name of ["activatePack", "deactivatePack", "deletePackById", "listInstalledPacks"]) {
      assert.match(customSrc, new RegExp(`\\{ initPacks[^}]*${name}`), `${name} が window.Trk.custom に無い`);
    }
  });

  test("消すときは、使っているパックなら先に外す（設定に packPrev を残さない）", () => {
    const i = customSrc.indexOf("async function deletePackById");
    const block = customSrc.slice(i, i + 700);
    assert.match(block, /if \(wasActive\) deactivatePack\(\);/);
    assert.ok(block.indexOf("deactivatePack") < block.indexOf("packDB.del"), "外してから消す");
  });

  test("目録の一覧から、使う・消す・中身を見られる", () => {
    assert.match(src, /api\.activatePack\(st\.hit\.id\)/);
    assert.match(src, /api\.deletePackById\(st\.hit\.id\)/);
    assert.match(src, /tr\("catalogDetails"\)/);
    assert.match(src, /tr\("catalogFontLine"/);
  });

  test("状態（未導入・導入済み・使用中）を出し分ける", () => {
    assert.match(src, /hit\.active \? \{ key:"catalogStateActive"/);
    assert.match(src, /return \{ key:"catalogStateNew"/);
  });
});

describe("trk231 言葉（4言語）", () => {
  const keys = ["catalogBundleOpen", "catalogBundleHint", "catalogLoadedInstalled", "catalogStateNew",
    "catalogStateInstalled", "catalogStateActive", "catalogStateOther", "catalogDetails", "catalogDetailsLine",
    "catalogFontLine", "catalogUse", "catalogInUse", "catalogRemove", "catalogAlreadyIn", "catalogBundleNoJson",
    "catalogBundleNoPack", "catalogBundleDone", "catalogBundleAll", "catalogBundleSome"];

  test("19の言葉が4言語にある", () => {
    for (const k of keys) {
      const n = (i18nSrc.match(new RegExp(`\\b${k}:`, "g")) || []).length;
      assert.equal(n, 4, `${k} が4言語そろっていない（${n}）`);
    }
  });
});

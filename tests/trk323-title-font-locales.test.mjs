// SPDX-License-Identifier: GPL-3.0-or-later
/* trk323: 題字の書体の文言（zh・ko）の確認
   守りたい約束：
     - zh・ko には ja と同じ tf* キー（題字の書体の文言）がすべてある（無ければ英語へ落ちて混ざる）
     - 変数（{name} {files} {n}）は ja と同じ組で、抜けや余りがない
     - 空の文言がない
   注：zh・ko の文言は話者による確認前（草案の翻訳）。ここでは形の確認だけで、言葉の自然さは保証しない */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import { ROOT } from "./helpers/browser-data.mjs";

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(`${ROOT}/js/i18n.js`, "utf8") + ";globalThis.__TEXT = TEXT;", ctx);
const TEXT = JSON.parse(JSON.stringify(ctx.__TEXT));
const tfKeys = L => Object.keys(TEXT[L]).filter(k => k.startsWith("tf")).sort();
const vars = s => [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(",");

describe("題字の書体の文言（zh・ko）", () => {
  test("zh・ko に ja と同じ tf* キーがある", () => {
    const ja = tfKeys("ja");
    assert.ok(ja.length >= 59, `ja の tf* は ${ja.length}`);
    for (const L of ["zh", "ko"]) assert.deepEqual(tfKeys(L), ja, `${L} の tf* キー`);
  });
  test("変数の組は ja と一致し、空の文言はない", () => {
    for (const L of ["zh", "ko"]) for (const k of tfKeys("ja")) {
      assert.equal(vars(TEXT[L][k]), vars(TEXT.ja[k]), `${L}.${k} の変数`);
      assert.ok(String(TEXT[L][k]).trim().length > 0, `${L}.${k} が空`);
    }
  });
  test("削除の確認（使用中ではない場合）と「保存は消さない」の約束が残っている", () => {
    assert.ok(TEXT.zh.tfRemoveEffectHidden.includes("未显示") || TEXT.zh.tfRemoveEffectHidden.includes("表示"), TEXT.zh.tfRemoveEffectHidden);
    assert.ok(TEXT.ko.tfWorksRemoveConfirm.includes("유지"), TEXT.ko.tfWorksRemoveConfirm);
    assert.ok(TEXT.zh.tfWorksRemoveConfirm.includes("保留"), TEXT.zh.tfWorksRemoveConfirm);
  });
});

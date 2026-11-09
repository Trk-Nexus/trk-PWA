// SPDX-License-Identifier: GPL-3.0-or-later
/* trk324: Avatar 40 の確認への対応（作品ごとの書体の指定の保存）
   守りたい約束：
     1. 読めない項目（長すぎる・空・"__proto__" の作品キー）は、別の作品を書き換えても消えない
     2. 既存の項目の未知の値（将来の形式）は、font と on を変えても残る
     3. 削除は作品の指定を読んだときの保存と同じときだけ（確認のあとに変わっていたら消さない）
     4. "__proto__" のキーで既定の値を汚さない
     5. 文言：tfHowTo は「中身が同じなら名前が違ってもよい」に揃える。invalid 用の確認文がある */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import vm from "node:vm";
import fs from "node:fs";
import { ROOT } from "./helpers/browser-data.mjs";

const realSrc = fs.readFileSync(`${ROOT}/js/title-font.js`, "utf8");
const WORKS = "trkTitleFontWorks";
const GAL = "galmuri", PRESS = "press";

function harness() {
  const storage = {};
  const sandbox = {
    console, setTimeout, clearTimeout,
    localStorage: {
      getItem: k => (k in storage ? storage[k] : null),
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: k => { delete storage[k]; }
    },
    indexedDB: { open() { return {}; } },
    crypto: crypto.webcrypto,
    navigator: undefined,
    document: {
      readyState: "complete",
      getElementById: () => null,
      fonts: { add() { }, delete() { return true; } },
      body: { classList: { add() { }, remove() { } } },
      documentElement: { style: { setProperty() { }, removeProperty() { } } }
    },
    FontFace: class { constructor(f) { this.family = f; } load() { return new Promise(() => { }); } },
    Uint8Array, ArrayBuffer, Date, Promise, Set, Object, Array, JSON, Math, Number, String, Error, Buffer
  };
  sandbox.addEventListener = () => { };
  sandbox.window = sandbox;
  vm.runInNewContext(realSrc, sandbox);
  return { api: sandbox.Trk.titleFont, storage };
}
const plain = o => JSON.parse(JSON.stringify(o));
const long = "x".repeat(70);

describe("1. 読めない項目を、別の作品を書くときに消さない", () => {
  test("長すぎる・空・\"__proto__\" のキーは残る", () => {
    const h = harness();
    h.storage[WORKS] = `{"${long}":{"font":"${GAL}","on":true},"":1,"__proto__":{"x":1},"a":{"font":"${GAL}","on":false}}`;
    assert.equal(h.api.setWorkFont("b", PRESS), true);
    const saved = JSON.parse(h.storage[WORKS]);
    assert.deepEqual(plain(saved[long]), { font: GAL, on: true });
    assert.equal(saved[""], 1);
    assert.ok(Object.prototype.hasOwnProperty.call(saved, "__proto__"), "__proto__ の項目は自分のプロパティとして残る");
    assert.equal(saved["__proto__"].x, 1);
    assert.deepEqual(plain(saved.b), { font: PRESS, on: false });
    assert.equal(({}).x, undefined, "既定の値を汚さない");
  });
});

describe("2. 既存の項目の未知の値を残す", () => {
  test("連携のオン・オフで、未知の値（note）が残る", () => {
    const h = harness();
    h.storage[WORKS] = JSON.stringify({ a: { font: GAL, on: false, note: "keep" } });
    assert.equal(h.api.setWorkLink("a", true), true);
    const saved = JSON.parse(h.storage[WORKS]);
    assert.deepEqual(plain(saved.a), { font: GAL, on: true, note: "keep" });
  });
  test("候補の変更で、未知の値（note）が残り、on は変わらない", () => {
    const h = harness();
    h.storage[WORKS] = JSON.stringify({ a: { font: GAL, on: true, note: "keep" } });
    assert.equal(h.api.setWorkFont("a", PRESS), true);
    const saved = JSON.parse(h.storage[WORKS]);
    assert.deepEqual(plain(saved.a), { font: PRESS, on: true, note: "keep" });
  });
  test("旧形式の文字列から書くときは、新しい項目になる（on は既定のオフ）", () => {
    const h = harness();
    h.storage[WORKS] = JSON.stringify({ a: GAL });
    assert.equal(h.api.setWorkFont("a", PRESS), true);
    assert.deepEqual(plain(JSON.parse(h.storage[WORKS]).a), { font: PRESS, on: false });
  });
});

describe("3. 作品の指定だけを消す", () => {
  test("候補を空にすると、その作品だけ消え、読めない項目は残る", () => {
    const h = harness();
    h.storage[WORKS] = JSON.stringify({ a: { font: GAL, on: true }, b: { font: PRESS, on: false }, "": 2 });
    assert.equal(h.api.setWorkFont("a", ""), true);
    const saved = JSON.parse(h.storage[WORKS]);
    assert.equal("a" in saved, false);
    assert.deepEqual(plain(saved.b), { font: PRESS, on: false });
    assert.equal(saved[""], 2);
  });
});

describe("4. 削除は、確認のときに見た保存と同じときだけ", () => {
  test("見た後に保存が変わっていたら消さず、changed を返す", () => {
    const h = harness();
    const seen = JSON.stringify({ a: { font: GAL, on: true } });
    h.storage[WORKS] = JSON.stringify({ a: { font: GAL, on: true }, b: { font: PRESS, on: false } });
    assert.deepEqual(plain(h.api.removeWorksSettings(seen)), { ok: false, reason: "changed" });
    assert.ok(WORKS in h.storage, "消さない");
  });
  test("見た保存と同じなら消す", () => {
    const h = harness();
    const seen = JSON.stringify({ a: { font: GAL, on: true } });
    h.storage[WORKS] = seen;
    assert.deepEqual(plain(h.api.removeWorksSettings(seen)), { ok: true, reason: "" });
    assert.equal(WORKS in h.storage, false);
  });
});

describe("5. \"__proto__\" の作品キーで既定の値を汚さない", () => {
  test("読むときも数えるときも、有効な作品 ID だけを見る", () => {
    const h = harness();
    h.storage[WORKS] = '{"__proto__":{"font":"galmuri","on":true}}';
    assert.equal(h.api.linkedWorkCount(GAL), 0);
    assert.equal(h.api.fontForWork("__proto__"), "");
    assert.equal(({}).font, undefined);
  });
});

describe("6. 文言（4 言語）", () => {
  const i18n = fs.readFileSync(`${ROOT}/js/i18n.js`, "utf8");
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(i18n + ";globalThis.__TEXT = TEXT;", ctx);
  const TEXT = plain(ctx.__TEXT);
  test("tfHowTo は、中身が同じなら名前が違ってもよいと書く（実装と一致）", () => {
    assert.match(TEXT.ja.tfHowTo, /ファイル名が違っても構いません/);
    assert.match(TEXT.en.tfHowTo, /file name may differ/);
    assert.match(TEXT.zh.tfHowTo, /文件名不同也可以/);
    assert.match(TEXT.ko.tfHowTo, /파일 이름이 달라도 됩니다/);
    assert.doesNotMatch(TEXT.ja.tfHowTo, /ファイル名の違う|ファイル名の違うもの/);
  });
  test("読めない形式の保存を消す確認は、通常の確認と別の文（退避を勧める）", () => {
    for (const L of ["ja", "en", "zh", "ko"]) {
      assert.ok(TEXT[L].tfWorksRemoveInvalidConfirm, L);
      assert.notEqual(TEXT[L].tfWorksRemoveInvalidConfirm, TEXT[L].tfWorksRemoveConfirm, L);
      assert.ok(TEXT[L].tfWorksOther.includes("{n}"), L);
      assert.ok(TEXT[L].tfWorksRemoveChanged, L);
    }
  });
});

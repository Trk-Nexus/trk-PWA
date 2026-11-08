// SPDX-License-Identifier: GPL-3.0-or-later
/* trk322: 作品ごとの書体の指定の保存を「一度だけ読む」（Avatar 39 の修正依頼）
   守りたい約束：
     1. 判定・件数・書き込みは、同じ 1 回の読み取り（snapshot）で行う。途中の読み取りだけ失敗しても、既存の指定を消して上書きしない
     2. 読めない・壊れた・空文字の保存には書き込まない。件数は不明（null）
     3. 退避は読めたときだけ、生の値を封筒にして返す。削除は作品の指定だけを消す（読めないときは消さない） */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import vm from "node:vm";
import fs from "node:fs";
import { ROOT } from "./helpers/browser-data.mjs";

const realSrc = fs.readFileSync(`${ROOT}/js/title-font.js`, "utf8");
const WORKS = "trkTitleFontWorks";

/* failFrom：作品の保存の読み取りのうち、この番号（1 から）以降を例外にする。0 なら失敗させない */
function harness({ failFrom = 0, failRemove = false } = {}) {
  const storage = {};
  let reads = 0;
  let removes = 0;
  const sandbox = {
    console, setTimeout, clearTimeout,
    localStorage: {
      getItem(k) {
        if (k === WORKS) { reads++; if (failFrom && reads >= failFrom) throw new Error("denied"); }
        return k in storage ? storage[k] : null;
      },
      setItem(k, v) { storage[k] = String(v); },
      removeItem(k) { removes++; if (failRemove && k === WORKS) throw new Error("denied"); delete storage[k]; }
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
  const api = sandbox.Trk.titleFont;
  return { api, storage, reads: () => reads, removes: () => removes };
}
/* vm の値を、このテストの realm の普通の値に直す */
const plain = o => JSON.parse(JSON.stringify(o));
const GAL = "galmuri", PRESS = "press";

describe("1. 判定と書き込みは一度の読み取りで行う", () => {
  test("途中の読み取り（2 回目以降）が失敗しても、既存の指定は消えず新しい指定だけが加わる", () => {
    const h = harness({ failFrom: 2 });
    h.storage[WORKS] = JSON.stringify({ a: { font: GAL, on: true } });
    assert.equal(h.api.setWorkFont("b", PRESS), true);
    const saved = JSON.parse(h.storage[WORKS]);
    assert.deepEqual(saved.a, { font: GAL, on: true }, "既存の作品 a を消さない");
    assert.deepEqual(saved.b, { font: PRESS, on: false });
    assert.equal(h.reads(), 1, "読み取りは 1 回だけ");
  });
  test("未知の項目・新しい形式の値は、書き換えるまで維持する", () => {
    const h = harness();
    h.storage[WORKS] = JSON.stringify({ a: { font: GAL, on: true, future: 7 }, z: "unknown-font" });
    assert.equal(h.api.setWorkFont("b", PRESS), true);
    const saved = JSON.parse(h.storage[WORKS]);
    assert.equal(saved.a.future, 7);
    assert.equal(saved.z, "unknown-font");
  });
  test("連携のオン・オフも一度の読み取りで行う", () => {
    const h = harness({ failFrom: 2 });
    h.storage[WORKS] = JSON.stringify({ a: { font: GAL, on: false }, b: { font: PRESS, on: false } });
    assert.equal(h.api.setWorkLink("a", true), true);
    const saved = JSON.parse(h.storage[WORKS]);
    assert.deepEqual(saved.a, { font: GAL, on: true });
    assert.deepEqual(saved.b, { font: PRESS, on: false });
  });
});

describe("2. 読めない・壊れた保存には書き込まない", () => {
  test("読み取りが最初から例外：書き込まず、件数は不明（null）", () => {
    const h = harness({ failFrom: 1 });
    h.storage[WORKS] = JSON.stringify({ a: { font: GAL, on: true } });
    assert.equal(h.api.setWorkFont("b", PRESS), false);
    assert.equal(h.api.setWorkLink("a", false), false);
    assert.equal(h.api.linkedWorkCount(GAL), null);
    assert.equal(h.storage[WORKS], JSON.stringify({ a: { font: GAL, on: true } }));
  });
  test("空文字の保存は、正常な空として扱わず書き込まない（不在とは区別）", () => {
    const h = harness();
    h.storage[WORKS] = "";
    assert.equal(h.api.setWorkFont("b", PRESS), false);
    assert.equal(h.storage[WORKS], "");
    assert.equal(h.api.linkedWorkCount(GAL), null);
  });
  test("JSON でない・配列の保存は書き込まない", () => {
    for (const bad of ["{broken", "[1,2]", "42"]) {
      const h = harness();
      h.storage[WORKS] = bad;
      assert.equal(h.api.setWorkFont("b", PRESS), false, bad);
      assert.equal(h.storage[WORKS], bad);
    }
  });
  test("保存されていない（不在）なら新しく作る", () => {
    const h = harness();
    assert.equal(h.api.setWorkFont("a", GAL), true);
    assert.deepEqual(plain(JSON.parse(h.storage[WORKS])), { a: { font: GAL, on: false } });
  });
});

describe("3. 件数と旧形式", () => {
  test("件数は、その書体を指定している作品の数（旧形式の文字列も数える）", () => {
    const h = harness();
    h.storage[WORKS] = JSON.stringify({ a: { font: GAL, on: false }, b: GAL, c: { font: PRESS, on: true }, d: "no-such" });
    assert.equal(h.api.linkedWorkCount(GAL), 2);
    assert.equal(h.api.linkedWorkCount(PRESS), 1);
  });
  test("旧形式の値は、連携オフのまま読む（自動でオンにしない）", () => {
    const h = harness();
    h.storage[WORKS] = JSON.stringify({ a: GAL });
    assert.equal(h.api.fontForWork("a"), "", "連携オフなので題字は変わらない");
    assert.equal(h.api.setWorkLink("a", true), true);
    assert.deepEqual(plain(JSON.parse(h.storage[WORKS])), { a: { font: GAL, on: true } });
  });
});

describe("4. 退避", () => {
  test("未設定は退避できないと返す", () => {
    const r = plain(harness().api.backupWorks());
    assert.deepEqual(r, { ok: false, reason: "absent" });
  });
  test("読めない保存は退避できないと返す（推測で中身を出さない）", () => {
    const h = harness({ failFrom: 1 });
    h.storage[WORKS] = "x";
    assert.deepEqual(plain(h.api.backupWorks()), { ok: false, reason: "read" });
  });
  test("読めた保存は、生の値をそのまま封筒に入れる（空文字や壊れた値も証拠として残せる）", () => {
    for (const raw of [JSON.stringify({ a: { font: GAL, on: true } }), "", "{broken"]) {
      const h = harness();
      h.storage[WORKS] = raw;
      const r = plain(h.api.backupWorks());
      assert.equal(r.ok, true);
      const env = JSON.parse(r.text);
      assert.equal(env.format, "trk-title-font-works-backup");
      assert.equal(env.version, 1);
      assert.equal(env.raw, raw);
      assert.equal(env.state, raw === "" || raw === "{broken" ? "invalid" : "ok");
      assert.equal(h.storage[WORKS], raw, "退避では保存を書き換えない");
    }
  });
});

describe("5. 削除は作品の指定だけ", () => {
  test("作品の指定だけを消し、書体の選択や他の保存は消さない", () => {
    const h = harness();
    h.storage[WORKS] = JSON.stringify({ a: { font: GAL, on: true } });
    h.storage.trkTitleFont = GAL;
    h.storage.other = "keep";
    assert.deepEqual(plain(h.api.removeWorksSettings()), { ok: true, reason: "" });
    assert.equal(WORKS in h.storage, false);
    assert.equal(h.storage.trkTitleFont, GAL);
    assert.equal(h.storage.other, "keep");
  });
  test("読めないときは消さない（removeItem も呼ばない）", () => {
    const h = harness({ failFrom: 1 });
    h.storage[WORKS] = "x";
    assert.deepEqual(plain(h.api.removeWorksSettings()), { ok: false, reason: "read" });
    assert.equal(h.storage[WORKS], "x");
    assert.equal(h.removes(), 0);
  });
  test("削除そのものが失敗したら save、保存は残る", () => {
    const h = harness({ failRemove: true });
    h.storage[WORKS] = JSON.stringify({ a: { font: GAL, on: true } });
    assert.deepEqual(plain(h.api.removeWorksSettings()), { ok: false, reason: "save" });
    assert.ok(WORKS in h.storage);
  });
  test("未設定なら何もせず成功", () => {
    const h = harness();
    assert.deepEqual(plain(h.api.removeWorksSettings()), { ok: true, reason: "" });
    assert.equal(h.removes(), 0);
  });
});

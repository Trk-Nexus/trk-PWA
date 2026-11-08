// SPDX-License-Identifier: GPL-3.0-or-later
/* trk318: 題字の書体の競合と旧形式（Avatar 35 の A・B への対応）
   守りたい約束：
     A. 準備の途中で後から「使わない」や別の選択が始まったら、古い準備の結果は保存も適用もしない
     B. 旧形式の作品の指定 { 作品ID: 候補ID } は、連携オフのまま読み、別の作品を保存しても消さない
        知らない候補や壊れた値も、書き換えるまで消さない */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import vm from "node:vm";
import fs from "node:fs";
import { ROOT } from "./helpers/browser-data.mjs";

const realSrc = fs.readFileSync(`${ROOT}/js/title-font.js`, "utf8");

function candidatesFromSource() {
  const start = realSrc.indexOf("const CANDIDATES = [");
  const end = realSrc.indexOf("];", start);
  return vm.runInNewContext("(" + realSrc.slice(start + "const CANDIDATES = ".length, end + 1) + ")");
}
const sha = buf => crypto.createHash("sha256").update(buf).digest("hex");
/* vm の中で作られた値を、このテストの実行環境の値に直す */
const plain = o => JSON.parse(JSON.stringify(o));
const tick = () => new Promise(r => setTimeout(r, 0));
async function waitFor(pred) {
  for (let i = 0; i < 500 && !pred(); i++) await tick();
  assert.ok(pred(), "待ち時間を超えた");
}

/* 固定版のハッシュを、模擬のファイルの中身のハッシュに差し替えたソースを作る（実際の書体は使わない） */
function harness({ withFiles = true } = {}) {
  const galmuri = candidatesFromSource().find(c => c.id === "galmuri");
  let src = realSrc;
  const fake = new Map();
  for (const spec of galmuri.files) {
    const buf = Buffer.from("fake-font-" + spec.key);
    fake.set(spec.key, buf);
    src = src.split(spec.sha256).join(sha(buf));
  }
  const records = new Map();
  if (withFiles) for (const spec of galmuri.files) {
    const buf = fake.get(spec.key);
    const ab = new Uint8Array(buf).buffer;
    records.set(spec.key, { key: spec.key, sha256: sha(buf), bytes: buf.length, buf: ab, savedAt: 0 });
  }
  const storage = {};
  const pending = [];
  const classes = new Set();
  const sandbox = {
    console, setTimeout, clearTimeout,
    window: {},
    localStorage: {
      getItem: k => (k in storage ? storage[k] : null),
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: k => { delete storage[k]; }
    },
    indexedDB: {
      open() {
        const req = {};
        setTimeout(() => {
          req.result = {
            objectStoreNames: { contains: () => true },
            close() { },
            transaction() {
              const tx = {};
              const done = () => setTimeout(() => { if (tx.oncomplete) tx.oncomplete(); }, 0);
              const store = {
                get(key) { const r = {}; setTimeout(() => { r.result = records.get(key); done(); }, 0); return r; },
                put(rec) { const r = {}; setTimeout(() => { records.set(rec.key, rec); done(); }, 0); return r; },
                delete(key) { const r = {}; setTimeout(() => { records.delete(key); done(); }, 0); return r; }
              };
              tx.objectStore = () => store;
              return tx;
            }
          };
          if (req.onsuccess) req.onsuccess();
        }, 0);
        return req;
      }
    },
    crypto: crypto.webcrypto,
    document: {
      readyState: "complete",
      getElementById: () => null,
      fonts: { add() { }, delete() { return true; } },
      body: { classList: { add: c => classes.add(c), remove: c => classes.delete(c) } },
      documentElement: { style: { setProperty() { }, removeProperty() { } } }
    },
    /* 読み込みは呼び出し側が解決する（競合の途中を作るため） */
    FontFace: class { constructor(family) { this.family = family; } load() { return new Promise(r => pending.push(r)); } },
    Uint8Array, ArrayBuffer, Date, Promise, Set, Object, Array, JSON, Math, Number, String, Error, Buffer
  };
  sandbox.addEventListener = () => { };
  sandbox.window = sandbox;
  vm.runInNewContext(src, sandbox);
  return { api: sandbox.Trk.titleFont, storage, pending, classes, records };
}

describe("A. 準備の途中で後から始まった操作を優先する", () => {
  test("選択→使わない：古い選択は保存も適用もしない（後のオフが残る）", async () => {
    const h = harness();
    const p1 = h.api.choose("galmuri");
    await waitFor(() => h.pending.length > 0);
    const r2 = await h.api.choose("");
    assert.deepEqual(plain(r2), { ok: true, reason: "" });
    while (h.pending.length) { h.pending.shift()(); await tick(); }
    const r1 = await p1;
    assert.equal(r1.ok, false);
    assert.equal(r1.reason, "superseded");
    assert.equal(h.storage.trkTitleFont, undefined, "後のオフが残っている");
    assert.equal(h.classes.has(h.api.CLASS_ON), false, "適用されていない");
  });

  test("対照：割り込みがなければ選択は保存され、適用される", async () => {
    const h = harness();
    const p = h.api.choose("galmuri");
    await waitFor(() => h.pending.length > 0);
    while (h.pending.length) { h.pending.shift()(); await tick(); }
    const r = await p;
    assert.deepEqual(plain(r), { ok: true, reason: "" });
    assert.equal(h.storage.trkTitleFont, "galmuri");
    assert.equal(h.classes.has(h.api.CLASS_ON), true);
  });

  test("準備の途中で別の選択が始まると、古い方は保存しない", async () => {
    const h = harness();
    const p1 = h.api.choose("galmuri");
    await waitFor(() => h.pending.length > 0);
    /* 2 回目の選択は、同じ候補の準備を始める（後から始まった方が残る） */
    const p2 = h.api.choose("galmuri");
    await waitFor(() => h.pending.length > 1);
    while (h.pending.length) { h.pending.shift()(); await tick(); }
    const r1 = await p1;
    const r2 = await p2;
    assert.equal(r1.reason, "superseded");
    assert.deepEqual(plain(r2), { ok: true, reason: "" });
    assert.equal(h.storage.trkTitleFont, "galmuri");
  });
});

describe("B. 旧形式の作品の指定を消さない", () => {
  test("旧形式（候補IDの文字列）は連携オフのまま読む。自動でオンにはしない", () => {
    const h = harness({ withFiles: false });
    h.storage[h.api.WORKS_KEY] = JSON.stringify({ "pixel-console": "galmuri" });
    assert.equal(h.api.fontForWork("pixel-console"), "", "自動でオンにしない");
    assert.equal(h.api.setWorkLink("pixel-console", true), true, "明示的にオンへ");
    assert.equal(h.api.fontForWork("pixel-console"), "galmuri");
  });

  test("別の作品の指定を保存しても、旧形式の項目は消えない", () => {
    const h = harness({ withFiles: false });
    h.storage[h.api.WORKS_KEY] = JSON.stringify({ "old-work": "galmuri" });
    assert.equal(h.api.setWorkFont("new-work", "dotneo"), true);
    const saved = JSON.parse(h.storage[h.api.WORKS_KEY]);
    assert.ok(saved["old-work"], "旧形式の項目が残っている");
    assert.equal(h.api.fontForWork("old-work"), "", "残っても使わない");
    assert.equal(saved["new-work"].font, "dotneo");
  });

  test("知らない候補・壊れた値も、書き換えるまで消さない", () => {
    const h = harness({ withFiles: false });
    const before = { future: { font: "future-font", on: true }, broken: 42, "old-work": "unknown-font" };
    h.storage[h.api.WORKS_KEY] = JSON.stringify(before);
    assert.equal(h.api.setWorkFont("new-work", "press"), true);
    const saved = JSON.parse(h.storage[h.api.WORKS_KEY]);
    assert.deepEqual(saved.future, before.future);
    assert.equal(saved.broken, 42);
    assert.equal(saved["old-work"], "unknown-font");
    assert.equal(h.api.setWorkLink("future", false), false, "知らない候補の連携は触らない");
    assert.deepEqual(JSON.parse(h.storage[h.api.WORKS_KEY]).future, before.future);
  });

  test("連携のオン・オフは対象の作品だけを書き換える", () => {
    const h = harness({ withFiles: false });
    h.storage[h.api.WORKS_KEY] = JSON.stringify({ a: { font: "galmuri", on: false }, b: "dotneo" });
    assert.equal(h.api.setWorkLink("a", true), true);
    const saved = JSON.parse(h.storage[h.api.WORKS_KEY]);
    assert.deepEqual(saved.a, { font: "galmuri", on: true });
    assert.equal(saved.b, "dotneo", "ほかの作品は元のまま");
  });

  test("理由 superseded の文言が ja・en にある", () => {
    const i18n = fs.readFileSync(`${ROOT}/js/i18n.js`, "utf8");
    assert.equal((i18n.match(/tfReasonSuperseded:/g) || []).length, 2);
  });
});

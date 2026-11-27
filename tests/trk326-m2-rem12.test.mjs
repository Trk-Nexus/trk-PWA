// SPDX-License-Identifier: GPL-3.0-or-later
/* 🔤 trk326 M2：Avatar 倉庫の受け子 R-REM-1（作品ごとの題字の書体を当てる）と R-REM-2（退避の読み戻し）

   守りたい約束：
     ・作品ごとの指定は、全体の設定が空のときだけ使う（全体の設定を黙って差し替えない）。
     ・書体ファイルが揃っていなければ当てない（部分適用をしない）。外すと元の見た目へ戻る。
     ・退避は trk-title-font-works-backup v1 だけ。state=invalid（読めなかった保存）は戻さない。
     ・戻すときは検証してから書く（__proto__ や知らない候補は落とす）。読めないものを書き戻さない。
     ・画面から使えること（applyForWork を 🎨 の側が呼ぶ）を配線で確かめる。 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const titleFontSrc = read("js/title-font.js");
const remodernSrc = read("js/remodern-ui.js");

function load(seed) {
  const store = new Map(Object.entries(seed || {}));
  const localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: k => { store.delete(k); }
  };
  const sandbox = { console, JSON, Math, Object, Array, String, Number, Boolean, Date, Set, Map, Error, RegExp, Promise, setTimeout, clearTimeout, parseInt, parseFloat, isNaN, isFinite, URL, Blob, Event, localStorage };
  sandbox.window = sandbox;
  sandbox.document = {
    body: { classList: { add() { }, remove() { }, contains: () => false } },
    documentElement: { style: { setProperty() { }, removeProperty() { } } },
    fonts: { add() { }, delete() { } },
    getElementById: () => null, querySelector: () => null,
    createElement: () => ({ style: { }, appendChild() { }, setAttribute() { }, addEventListener() { }, classList: { add() { } } })
  };
  sandbox.addEventListener = () => { };
  vm.createContext(sandbox);
  vm.runInContext(titleFontSrc, sandbox, { filename: "js/title-font.js" });
  return { tf: sandbox.Trk.titleFont, store, sandbox };
}

const envelope = (rawObj, over) => Object.assign({
  format: "trk-title-font-works-backup", version: 1, state: "ok", raw: JSON.stringify(rawObj)
}, over || {});

describe("R-REM-1：作品ごとの題字の書体", () => {
  test("全体の設定が空のときだけ、作品の指定（on）を使う", () => {
    const { tf, store } = load({ trkTitleFontWorks: JSON.stringify({ "trk-re-modern-pixel-console": { font: "galmuri", on: true }, "w-off": { font: "press", on: false } }) });
    assert.equal(tf.fontForWork("trk-re-modern-pixel-console"), "galmuri");
    assert.equal(tf.fontForWork("w-off"), "", "連携オフの指定は使わない");
    assert.equal(tf.fontForWork("unknown"), "");
    /* 全体の設定が選ばれていれば、そちら（作品の指定へ乗り換えない） */
    store.set("trkTitleFont", "press");
    assert.equal(tf.fontForWork("trk-re-modern-pixel-console"), "press");
  });

  test("当てる側（applyForWork）は、ファイルが揃っていなければ当てない（部分適用をしない）", async () => {
    const { tf, sandbox } = load({ trkTitleFontWorks: JSON.stringify({ w1: { font: "galmuri", on: true } }) });
    const id = await tf.applyForWork("w1");
    assert.equal(id, "galmuri", "当てる候補としては選ばれる");
    const st = tf.state();
    assert.notEqual(st.status, "active", "IndexedDB が無いので当たらない");
    assert.equal(sandbox.document.body.classList.contains("trk-title-font-on"), false);
    /* 作品が無くなったら、全体の設定（ここでは空）へ戻る */
    assert.equal(await tf.applyForWork(""), "");
    assert.equal(tf.state().status, "off");
  });

  test("画面の側（🎨）が fontForWork を使い、作品を変えたら当て直す配線になっている", () => {
    assert.ok(remodernSrc.includes("function fontForWork(workId)"));
    assert.ok(remodernSrc.includes("tf.applyForWork(id)"));
    assert.ok(remodernSrc.includes('addEventListener("trk-title-font"'));
    /* 「まだ画面からは使わず、適用もしない」という古い但し書きは消す（使うようになったため） */
    assert.equal(titleFontSrc.includes("まだ画面からは使わず、適用もしない"), false);
    assert.ok(titleFontSrc.includes("applyForWork"));
  });
});

describe("R-REM-2：退避（trk-title-font-works-backup v1）から戻す", () => {
  test("正しい退避を戻す。知らない候補・危険なキーは落として書く", () => {
    const { tf, store } = load();
    const r = tf.restoreWorks(envelope({
      "trk-re-modern-pixel-console": { font: "galmuri", on: true },
      "__proto__": { font: "galmuri", on: true },
      "w-bad": { font: "no-such-font", on: true }
    }));
    assert.equal(r.ok, true, r.reason);
    assert.equal(r.count, 1);
    const saved = JSON.parse(store.get("trkTitleFontWorks"));
    assert.deepEqual(Object.keys(saved), ["trk-re-modern-pixel-console"]);
    assert.equal(saved["trk-re-modern-pixel-console"].on, true);
  });

  test("state=invalid（読めなかった保存）・書式違い・版違い・JSON でないものは戻さない", () => {
    const { tf, store } = load({ trkTitleFontWorks: '{"old":{"font":"press","on":true}}' });
    const before = store.get("trkTitleFontWorks");
    const inv = tf.restoreWorks(envelope({ w: { font: "galmuri", on: true } }, { state: "invalid" }));
    assert.deepEqual({ ok: inv.ok, reason: inv.reason }, { ok: false, reason: "invalid" });
    assert.equal(store.get("trkTitleFontWorks"), before, "壊れた保存の退避では保存を変えない");
    assert.equal(tf.restoreWorks(envelope({}, { format: "other" })).reason, "format");
    assert.equal(tf.restoreWorks(envelope({}, { version: 2 })).reason, "format");
    assert.equal(tf.restoreWorks("{not json").reason, "parse");
    assert.equal(tf.restoreWorks(envelope({}, { raw: "[1,2,3]" })).reason, "format", "配列は作品の表ではない");
    assert.equal(tf.restoreWorks(envelope({}, { raw: "" })).reason, "format");
  });

  test("ファイル（.json）から戻せる。大きすぎるファイルは読まずに断る", async () => {
    const { tf, store } = load();
    const text = JSON.stringify(envelope({ w1: { font: "galmuri", on: true } }));
    const ok = await tf.importWorksBackup({ size: text.length, text: async () => text });
    assert.equal(ok.ok, true, ok.reason);
    assert.equal(JSON.parse(store.get("trkTitleFontWorks")).w1.font, "galmuri");
    const big = await tf.importWorksBackup({ size: 256 * 1024 + 1, text: async () => "" });
    assert.equal(big.reason, "size");
    const brokenRead = await tf.importWorksBackup({ size: 10, text: async () => { throw new Error("x"); } });
    assert.equal(brokenRead.reason, "read");
    assert.equal((await tf.importWorksBackup(null)).reason, "format");
  });

  test("画面に「退避から戻す」があり、結果の文言が 4 言語そろっている", () => {
    assert.ok(titleFontSrc.includes('t("tfRestore")'));
    assert.ok(titleFontSrc.includes("importWorksBackup"));
    const i18n = read("js/i18n.js");
    for (const key of ["tfRestore", "tfRestoreDone", "tfRestoreInvalid", "tfRestoreSize", "tfRestoreSaveFail", "tfRestoreFormat"]) {
      assert.equal((i18n.match(new RegExp(`\\b${key}:`, "g")) || []).length, 4, key);
    }
  });
});

describe("補遺：re-modern の作品の一覧の退避（trk-re-modern-works-backup v1）", () => {
  function withCore(works) {
    const { tf, sandbox } = load();
    let saved = null;
    sandbox.Trk.core = {
      settings: { remodernWorks: works },
      saveUserPrefs() { saved = JSON.stringify(sandbox.Trk.core.settings.remodernWorks); return true; }
    };
    sandbox.dispatchEvent = () => { };
    return { tf, saved: () => saved };
  }

  test("書き出しと読み戻しが対になっている", () => {
    const works = [{ id: "trk-re-modern-pixel-console", name: "ピクセル・コンソール", regions: ["common"] }];
    const a = withCore(works);
    const text = a.tf.exportRemodernWorks();
    const env = JSON.parse(text);
    assert.equal(env.format, "trk-re-modern-works-backup");
    assert.equal(env.version, 1);
    assert.equal(env.works.length, 1);

    const b = withCore([]);
    const r = b.tf.restoreRemodernWorks(text);
    assert.equal(r.ok, true, r.reason);
    assert.equal(r.count, 1);
    assert.equal(JSON.parse(b.saved())[0].id, "trk-re-modern-pixel-console");
  });

  test("書式違い・壊れた JSON は入れない（保存も変えない）", () => {
    const b = withCore([{ id: "keep" }]);
    assert.equal(b.tf.restoreRemodernWorks("{oops").reason, "parse");
    assert.equal(b.tf.restoreRemodernWorks(JSON.stringify({ format: "x", version: 1, works: [] })).reason, "format");
    assert.equal(b.tf.restoreRemodernWorks(JSON.stringify({ format: "trk-re-modern-works-backup", version: 2, works: [] })).reason, "format");
    assert.equal(b.saved(), null);
  });
});

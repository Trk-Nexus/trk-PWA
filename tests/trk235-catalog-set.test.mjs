// SPDX-License-Identifier: GPL-3.0-or-later
/* 📦 trk235：セット（.stlib / .zip）を、選ぶだけで入れる
 *
 *   倉庫（trk-Avatar-Library）の「はじめてセット」は 1 つの ZIP です（中身は目録＋packs/＋font-packs/＋任意の set.json）。
 *   この版で入れたもの：
 *     ・`.stlib` でも `.zip` でも、選ぶだけで中身をまとめて入れる（拡張子ではなく、中身が ZIP かで判定）
 *     ・入れる前に「何パック・何 MB・見つからない数」を出す
 *     ・1 本ずつ、中の実バイトで sha256 を照合してから入れる（合わなければ入れない）
 *     ・set.json は任意（無い・壊れていても目録だけで動く）
 *
 *   ここでは、目録を探す所・入れる前の数え上げ・形の検査を中心に確かめます
 *   （画面の操作は js/pack-catalog.js と js/custom.js の配線を文字で確かめます）。
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const src = read("js/pack-catalog.js");
const zipSrc = read("js/zip-io.js");
const customSrc = read("js/custom.js");
const i18nSrc = read("js/i18n.js");
const html = read("index.html");

/* index.html と同じ順（zip-io → pack-catalog）で読み込んだ状態を作る */
function loadModules() {
  const sandbox = {
    window: {}, console, crypto, Promise, JSON, Math, Number, String, Object, Array, Set, Map, Error,
    Blob, File, Uint8Array, DataView, ArrayBuffer, BigInt, Uint32Array, TextEncoder, TextDecoder, Response,
    CompressionStream, DecompressionStream, Date,
    document: { readyState: "complete", getElementById: () => null, createElement: () => ({ style:{}, append(){}, addEventListener(){} }) },
    addEventListener: () => {}, confirm: () => true, CSS: { escape: s => s }, tr: k => k,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(zipSrc, sandbox, { filename: "js/zip-io.js" });
  vm.runInContext(src, sandbox, { filename: "js/pack-catalog.js" });
  return { api: sandbox.window.Trk.packCatalog, Z: sandbox.window.Trk.zipIO };
}
const { api, Z } = loadModules();

const bytes = n => "x".repeat(n);
const catalogOf = (over = {}) => ({
  format: "trk-avatar-library", version: 1, name: "はじめてセット", updatedAt: "2026-11-01",
  packs: [
    { id: "maru-go", name: "丸ゴのお茶目", author: "trk", version: "1.1.0", file: "font-packs/maru-go.stpack",
      sha256: "a".repeat(64), bytes: 7, fonts: [{ family: "TrkZenMaru", file: "fonts/ZenMaruGothic-Regular.woff2", license: "OFL-1.1" }] },
    { id: "sample", name: "明朝の本", author: "trk", version: "1.0.0", file: "packs/sample-mincho.stpack",
      sha256: "b".repeat(64), bytes: 5, fonts: [] },
  ],
  ...over,
});

/* 実際のセットと同じ並びで ZIP を組み立てる（目録・2 パック・set.json） */
async function makeSet(opts = {}) {
  const prefix = opts.prefix || "";
  const entries = [];
  if (opts.catalog !== null) {
    entries.push({ name: `${prefix}catalog/index.json`, blob: new Blob([typeof opts.catalog === "string" ? opts.catalog : JSON.stringify(opts.catalog || catalogOf())]) });
  }
  for (const [name, size] of opts.packs || [["packs/sample-mincho.stpack", 5], ["font-packs/maru-go.stpack", 7]]) {
    entries.push({ name: prefix + name, blob: new Blob([bytes(size)]) });
  }
  if (opts.set !== undefined) {
    entries.push({ name: `${prefix}set.json`, blob: new Blob([typeof opts.set === "string" ? opts.set : JSON.stringify(opts.set)]) });
  }
  entries.push(...(opts.extra || []));
  const blob = await Z.zipWrite(entries);
  return new File([blob], opts.fileName || "trk-first-set-2026-11-01-r4.stlib", { type: "application/octet-stream" });
}
const SETINFO = { format: "trk-set", version: 1, name: "trk! はじめてセット", release: "r4", rev: "r4", packs: ["packs/sample-mincho.stpack"], note: "セットの説明" };

describe("trk235 セットの形（set.json）", () => {
  test("trk-set / version 1 だけを受ける（名前と版を取り出す）", () => {
    const info = api.sanitizeSetInfo(SETINFO);
    assert.deepEqual(JSON.parse(JSON.stringify(info)), { format:"trk-set", version:1, name:"trk! はじめてセット", release:"r4", note:"セットの説明", packs:["packs/sample-mincho.stpack"] });
  });
  test("形式が違う・version が新しい・入れ物でないものは null（目録だけで動く）", () => {
    assert.equal(api.sanitizeSetInfo({ ...SETINFO, format: "zip" }), null);
    assert.equal(api.sanitizeSetInfo({ ...SETINFO, version: 2 }), null);
    assert.equal(api.sanitizeSetInfo(null), null);
    assert.equal(api.sanitizeSetInfo("set"), null);
  });
  test("release が無ければ rev で代用し、長すぎる名前は切る", () => {
    const info = api.sanitizeSetInfo({ format: "trk-set", version: 1, name: "あ".repeat(200), rev: "r4" });
    assert.equal(info.release, "r4");
    assert.equal([...info.name].length, 80);
  });
});

describe("trk235 中身が ZIP かどうか（拡張子は信じない）", () => {
  test("ZIP は true・ただの文は false", async () => {
    assert.equal(await api.looksLikeZip(await makeSet()), true);
    assert.equal(await api.looksLikeZip(new File([new Blob(["hello"])], "x.stlib")), false);
    assert.equal(await api.looksLikeZip(null), false);
  });
  test("空の ZIP（終端レコードだけ）は ZIP とみなし、短すぎるファイルは落ちない", async () => {
    assert.equal(await api.looksLikeZip(new File([new Blob([new Uint8Array([0x50, 0x4b, 0x05, 0x06])])], "empty.zip")), true);
    assert.equal(await api.looksLikeZip(new File([new Blob([new Uint8Array([0x50])])], "short.stlib")), false);
    assert.equal(await api.looksLikeZip(new File([new Blob([])], "zero.stlib")), false);
  });
});

describe("trk235 セットを開いて目録を読む", () => {
  test("根の catalog/index.json と set.json を読む", async () => {
    const opened = await api.openSet(await makeSet({ set: SETINFO }));
    assert.equal(opened.ok, true);
    assert.equal(opened.prefix, "");
    assert.equal(opened.catalog.packs.length, 2);
    assert.equal(opened.name, "trk! はじめてセット");
    assert.equal(opened.release, "r4");
  });
  test("1 段だけ包まれたセットも読める（展開したフォルダを再圧縮した .zip）", async () => {
    const opened = await api.openSet(await makeSet({ prefix: "first-set/", set: SETINFO }));
    assert.equal(opened.ok, true);
    assert.equal(opened.prefix, "first-set/");
    assert.equal(opened.release, "r4");
  });
  test("目録が無い ZIP は「セットではない」で止まる（パックの .zip を壊さない）", async () => {
    const opened = await api.openSet(await makeSet({ catalog: null, fileName: "maru-go.zip" }));
    assert.equal(opened.ok, false);
    assert.equal(opened.reason, "catalogSetNoCatalog");
  });
  test("目録が 2 つ以上あるときは止まる（どれを使うか決めない）", async () => {
    const opened = await api.openSet(await makeSet({ prefix: "a/", extra: [{ name: "b/catalog/index.json", blob: new Blob([JSON.stringify(catalogOf())]) }] }));
    assert.equal(opened.ok, false);
    assert.equal(opened.reason, "catalogSetAmbiguous");
  });
  test("目録が壊れていても、読めない理由を返して止まる", async () => {
    const opened = await api.openSet(await makeSet({ catalog: "{\"format\":\"trk-avatar-library\"," }));
    assert.equal(opened.ok, false);
    assert.equal(opened.reason, "catalogBad");
  });
  test("set.json が壊れていても目録だけで開ける", async () => {
    const opened = await api.openSet(await makeSet({ set: "{oops" }));
    assert.equal(opened.ok, true);
    assert.equal(opened.info, null);
    assert.equal(opened.release, "");
    assert.equal(opened.name, "はじめてセット");
  });
  test("ZIP でないファイルは「ZIP ではない」で止まる", async () => {
    const opened = await api.openSet(new File([new Blob(["not a zip"])], "x.stlib"));
    assert.equal(opened.ok, false);
    assert.equal(opened.reason, "catalogSetNotZip");
  });
  test("セットが上限（1 GiB）を超えたら、開く前に止まる", async () => {
    assert.equal(api.SET_LIMITS.set, 1024 * 1048576);
    const opened = await api.openSet({ size: api.SET_LIMITS.set + 1, slice: () => ({ arrayBuffer: async () => new ArrayBuffer(4) }) });
    assert.equal(opened.ok, false);
    assert.equal(opened.reason, "catalogSetTooBig");
  });
});

describe("trk235 入れる前の数え上げと、1 本ごとの検査", () => {
  test("目録の packs[].file のパスで中を探し、合計サイズと見つからない数を出す", async () => {
    const setFile = await makeSet({ set: SETINFO });
    const opened = await api.openSet(setFile);
    const plan = api.planSet(opened);
    assert.equal(plan.packs.length, 2);
    assert.equal(plan.missing.length, 0);
    assert.equal(plan.bytes, 12);                       /* 7 + 5（目録の bytes） */
    assert.deepEqual([...plan.packs.map(p => p.entry.file)], ["font-packs/maru-go.stpack", "packs/sample-mincho.stpack"]);
  });
  test("目録にあるが中に無い 1 本は「見つからない」に回す（入れる側には出さない）", async () => {
    const setFile = await makeSet({ packs: [["packs/sample-mincho.stpack", 5]] });
    const plan = api.planSet(await api.openSet(setFile));
    assert.equal(plan.packs.length, 1);
    assert.equal(plan.missing.length, 1);
    assert.equal(plan.missing[0].file, "font-packs/maru-go.stpack");
  });
  test("大きさが目録と違う 1 本は sizeMismatch（入れない）", () => {
    assert.equal(api.setEntryCheck({ bytes: 10 }, { usize: 7 }).reason, "sizeMismatch");
    assert.equal(api.setEntryCheck({ bytes: 0 }, { usize: 7 }).ok, true);          /* 目録に大きさが無ければ通す */
    assert.equal(api.setEntryCheck({ bytes: 7 }, { usize: 7 }).ok, true);
    assert.equal(api.setEntryCheck({ bytes: 7 }, null).reason, "missing");
  });
  test("1 本 500 MB を超えるものは tooBig（セット全体 1 GiB とは別に止める）", () => {
    assert.equal(api.SET_LIMITS.pack, 500 * 1048576);
    const r = api.setEntryCheck({ bytes: 0 }, { usize: api.SET_LIMITS.pack + 1 });
    assert.equal(r.reason, "tooBig");
  });
});

describe("trk235 画面の配線", () => {
  test("セットを選ぶ欄がある（.stlib と .zip を受け、隠しておく）", () => {
    assert.match(html, /id="catalogSet"[^>]*type="file"/);
    assert.match(html, /id="catalogSet"[^>]*accept="[^"]*\.stlib[^"]*\.zip/);
    assert.ok(html.includes('data-i18n="catalogSetOpen"'));
    assert.ok(html.includes('data-i18n="catalogSetHint"'));
  });
  test("選ばれたら importSetFile に渡し、ドロップは tryImportSet から受ける", () => {
    assert.ok(src.includes("$(\"catalogSet\")"));
    assert.ok(src.includes("importSetFile(f)"));
    assert.ok(src.includes("window.Trk.packCatalog.importSetFile = importSetFile"));
    assert.ok(src.includes("window.Trk.packCatalog.tryImportSet = tryImportSet"));
  });
  test("custom.js は .stlib（と目録入りの .zip）を目録側へ渡し、パックなら今までどおり入れる", () => {
    assert.ok(customSrc.includes("stpack|zip|stlib"));
    assert.ok(customSrc.includes("cat.tryImportSet(f)"));
    assert.ok(customSrc.includes("if (core.phase === \"title\") installAndUse(f)"));
  });
  test("ZIP を読む道具（js/zip-io.js）を使う＝新しい解凍器を増やさない", () => {
    assert.ok(src.includes("window.Trk.zipIO"));
    assert.ok(src.includes("zipEntryBlob"));
    assert.equal(src.includes("DecompressionStream"), false);
  });
});

describe("trk235 ことば（4 言語）と、前の版の言い回し", () => {
  const keys = ["catalogSetOpen", "catalogSetHint", "catalogSetOpening", "catalogSetSummary", "catalogSetSummaryNoRelease",
    "catalogSetConfirm", "catalogSetProgress", "catalogSetDone", "catalogSetSome", "catalogSetAll", "catalogSetEmpty",
    "catalogSetNoZip", "catalogSetNotZip", "catalogSetBad", "catalogSetEncrypted", "catalogSetTooBig", "catalogSetTooMany",
    "catalogSetCorrupt", "catalogSetMethod", "catalogSetNoCatalog", "catalogSetAmbiguous", "catalogSetEntryBad",
    "catalogSetEntryBig", "catalogSetMissingNote"];
  test("足した文言が 4 言語そろっている", () => {
    for (const key of keys) {
      const n = (i18nSrc.match(new RegExp(`\\b${key}:`, "g")) || []).length;
      assert.equal(n, 4, `${key} は 4 言語に必要（いま ${n}）`);
    }
  });
  test("前の版の文言（trk230〜trk234）は消していない", () => {
    for (const key of ["catalogTitle", "catalogBundleOpen", "catalogBundleHint", "catalogRemoveAllLabel", "catalogTotalBytes", "catalogHashBad"]) {
      assert.ok(new RegExp(`\\b${key}:`).test(i18nSrc), `${key} が消えています`);
    }
  });
});

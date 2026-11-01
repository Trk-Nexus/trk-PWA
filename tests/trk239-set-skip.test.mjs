// SPDX-License-Identifier: GPL-3.0-or-later
/* 📦 trk239：r6 の 2 分割（はじめてセット＋書体セット）を、アプリの判定だけで通す
 *
 *   倉庫（trk-Avatar-Library）の返事6（2026-11-01）で決まったこと：
 *     ・r6 は「はじめてセット」（見本＋目録＋書体 5 本・約 7 MB）と「書体セット（全部）」（書体 29 本）の 2 つ
 *     ・**はじめてセットの 5 本は、書体セットにも入る**（「全部」を名乗るため）
 *     ・セットの `catalog/index.json` は**そのセットに入っているパックだけ**に絞る（「見つからない」を出さない）
 *
 *   ここで確かめるのは、その 2 つを続けて選んだときにアプリが何と言うか：
 *     ① 絞った目録なら「見つからない」が 0（trk235 の planSet のまま）
 *     ② 2 つ目（書体セット）で聞くのは **これから入る分だけ**（重なりを大きさに数えない）＝trk239
 *     ③ 版が違えば「入れる」に戻る（更新を取り逃さない）
 *     ④ 目録が絞られていなくても（倉庫の目録をそのまま入れても）止まらない
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
const i18nSrc = read("js/i18n.js");

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

/* 倉庫の r6 の形（書体セットは 7 本、はじめてセットはそのうち 3 本＋見本 1 本）を小さく再現する */
const FONT = (id, family, size) => ({
  id, name: id, author: "trk", version: "1.0.0", file: `font-packs/${id}.stpack`,
  sha256: String(id).padEnd(64, "0").slice(0, 64), bytes: size,
  fonts: [{ family, file: `fonts/${family}.woff2`, license: "OFL-1.1", weight: 400, cmap: 6800, bytes: size }],
});
const SAMPLE = { id: "sample-mincho", name: "見本", author: "trk", version: "1.0.0", file: "packs/sample-mincho.stpack",
  sha256: "1".repeat(64), bytes: 900, fonts: [] };

const FIRST_PACKS = ["zen-kaku", "dotgothic", "yusei-magic"].map((id, i) => FONT(id, `Trk${i}`, 1000 + i));
const ALL_FONTS = [...FIRST_PACKS, ...["mochiy-pop", "shippori-mincho", "klee-one", "zen-old-mincho"].map((id, i) => FONT(id, `TrkX${i}`, 2000 + i))];

const entryCatalog = (packs) => ({ format: "trk-avatar-library", version: 1, name: "目録", updatedAt: "2026-11-01", packs });

async function makeSet({ name, release, packs, catalogPacks, withSetJson = true }) {
  const entries = [];
  if (catalogPacks !== null) {
    entries.push({ name: "catalog/index.json", blob: new Blob([JSON.stringify(entryCatalog(catalogPacks || packs))]) });
  }
  for (const p of packs) entries.push({ name: p.file, blob: new Blob(["x".repeat(p.bytes)]) });
  if (withSetJson) entries.push({ name: "set.json", blob: new Blob([JSON.stringify({ format: "trk-set", version: 1, name, release })]) });
  return new File([await Z.zipWrite(entries)], `${name}.stlib`, { type: "application/octet-stream" });
}

/* 入っているパックの記録（packDB の 1 行に相当） */
/* custom.listInstalledPacks() と同じ形（{id,name,author,release,bytes,active}） */
const rec = (entry, release) => ({ id: entry.id, name: entry.name, author: entry.author, release, bytes: entry.bytes, active: false });

describe("trk239 r6 の 2 分割（はじめて → 書体）", () => {
  const firstSet = () => makeSet({ name: "trk! はじめてセット", release: "r6", packs: [...FIRST_PACKS, SAMPLE], catalogPacks: [...FIRST_PACKS, SAMPLE] });
  const fontSet = () => makeSet({ name: "trk! 書体セット（全部）", release: "r6", packs: ALL_FONTS, catalogPacks: ALL_FONTS });

  test("はじめてセット：目録が絞ってあるので「見つからない」は 0", async () => {
    const opened = await api.openSet(await firstSet());
    assert.equal(opened.ok, true);
    assert.equal(opened.name, "trk! はじめてセット");
    assert.equal(opened.release, "r6");
    const plan = api.planSet(opened);
    assert.equal(plan.packs.length, 4);            /* 書体 3 本＋見本 1 本 */
    assert.equal(plan.missing.length, 0);
    assert.equal(plan.bytes, 1000 + 1001 + 1002 + 900);
  });

  test("はじめてセットを入れた直後：4 本とも「これから入る」", async () => {
    const plan = api.planSet(await api.openSet(await firstSet()));
    const pend = api.setPending(plan, []);
    assert.equal(pend.pending.length, 4);
    assert.equal(pend.skip.length, 0);
    assert.equal(pend.bytes, plan.bytes);
  });

  test("書体セットを続けて選ぶ：重なった 3 本は飛ばし、聞くのは残りだけ（trk239）", async () => {
    const plan = api.planSet(await api.openSet(await fontSet()));
    const installed = FIRST_PACKS.map(p => rec(p, "1.0.0"));   /* はじめてセットで入れた 3 本 */
    const pend = api.setPending(plan, installed);
    assert.equal(plan.packs.length, 7);
    assert.equal(pend.skip.length, 3);
    assert.equal(pend.pending.length, 4);                       /* 新しく入るのは残り 4 本 */
    assert.equal(pend.bytes, 2000 + 2001 + 2002 + 2003);        /* 合計は水増ししない（重なった 3 本を数えない） */
    assert.ok(pend.bytes < plan.bytes);
  });

  test("2 回目に「入れる」と言われるのは、初めて入る 4 本だけ（順番も保つ）", async () => {
    const plan = api.planSet(await api.openSet(await fontSet()));
    const pend = api.setPending(plan, FIRST_PACKS.map(p => rec(p, "1.0.0")));
    const ids = list => JSON.parse(JSON.stringify(list)).map(p => p.entry.id);   /* ⚠ 別 realm の配列はそのまま比べない */
    assert.deepEqual(ids(pend.pending), ["mochiy-pop", "shippori-mincho", "klee-one", "zen-old-mincho"]);
    assert.deepEqual(ids(pend.skip), ["zen-kaku", "dotgothic", "yusei-magic"]);
  });

  test("版が違えば飛ばさない（更新を取り逃がさない）", async () => {
    const plan = api.planSet(await api.openSet(await fontSet()));
    const installed = FIRST_PACKS.map((p, i) => rec(p, i === 0 ? "0.9.0" : "1.0.0"));
    const pend = api.setPending(plan, installed);
    assert.equal(pend.skip.length, 2);
    assert.equal(pend.pending.length, 5);
    assert.equal(pend.pending[0].entry.id, "zen-kaku");
  });

  test("同じセットをもう一度選ぶと、全部「飛ばす」で確認は出ない（pending 0）", async () => {
    const plan = api.planSet(await api.openSet(await fontSet()));
    const pend = api.setPending(plan, ALL_FONTS.map(p => rec(p, "1.0.0")));
    assert.equal(pend.pending.length, 0);
    assert.equal(pend.skip.length, 7);
    assert.equal(pend.bytes, 0);
  });

  test("目録が絞られていなくても止まらない（倉庫の目録をそのまま入れた場合）", async () => {
    const full = [...ALL_FONTS, SAMPLE];
    const opened = await api.openSet(await makeSet({ name: "絞らない書体セット", release: "r6", packs: ALL_FONTS, catalogPacks: full }));
    const plan = api.planSet(opened);
    assert.equal(plan.packs.length, 7);
    assert.equal(plan.missing.length, 1);           /* 見本は「セットに入っていません」と出るだけ（止まらない） */
    assert.equal(plan.missing[0].id, "sample-mincho");
    assert.equal(api.setPending(plan, []).pending.length, 7);
  });

  test("set.json が無くても、目録だけで 2 つのセットを見分けられる", async () => {
    const a = await api.openSet(await makeSet({ name: "x", release: "r6", packs: FIRST_PACKS, catalogPacks: FIRST_PACKS, withSetJson: false }));
    const b = await api.openSet(await makeSet({ name: "y", release: "r6", packs: ALL_FONTS, catalogPacks: ALL_FONTS, withSetJson: false }));
    assert.equal(a.ok && b.ok, true);
    assert.equal(a.release, "");
    assert.equal(a.catalog.packs.length, 3);
    assert.equal(b.catalog.packs.length, 7);
  });
});

describe("trk239 画面の言い方と配線", () => {
  test("「すでに入っていて版も同じものは飛ばす」と、入る分の大きさで聞く", () => {
    assert.ok(src.includes("const pend = setPending(plan, installed);"));
    assert.equal(src.includes("skipNow"), false);   /* 古い書き方が残っていない */
    assert.ok(src.includes('tr(pend.skip.length ? "catalogSetConfirmSkip" : "catalogSetConfirm"'));
    assert.ok(src.includes("size:formatBytes(pend.bytes)"));
  });
  test("文言が 4 言語そろっている（既存の確認文は残す）", () => {
    for (const key of ["catalogSetConfirm", "catalogSetConfirmSkip"]) {
      const n = (i18nSrc.match(new RegExp(`\\b${key}:`, "g")) || []).length;
      assert.equal(n, 4, `${key} は 4 言語に必要（いま ${n}）`);
    }
    assert.ok(i18nSrc.includes("catalogSetConfirmSkip"));
    for (const lang of ["{skip}", "飛ば", "skipped", "跳过", "건너뜁니다"]) {
      assert.ok(i18nSrc.includes(lang), `${lang} が無い`);
    }
  });
  test("trk235 の約束は変えていない（上限・sha256・自動適用しない）", () => {
    assert.ok(src.includes('SET_LIMITS') && src.includes("sha256Hex"));
    assert.ok(src.includes("/* 📦 trk235"));
    assert.ok(src.includes("自動"));                 /* 「自動では適用しない」の注記は残す */
  });
});

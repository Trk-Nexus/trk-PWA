#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/* 📦 セット（.stlib / .zip）を「アプリの判定そのもの」で受け入れる（2026-11-01・trk239／trk240 で --json）

   なぜ要るか：
   倉庫（trk-Avatar-Library）の `tools/verify-set.mjs` は倉庫側の決めごとで検査します。
   こちらは **アプリのコード（js/zip-io.js と js/pack-catalog.js）をそのまま読み込んで**
   同じセットを開き、アプリが何と表示するかを先に出しておくための道具です。
   食い違い（＝アプリでは「見つからない」「入れません」になる）を受け取る前に見つけます。

   使い方：
     node tools/check-set.mjs <セット.stlib | セット.zip> [--hash] [--have=<目録.json>] [--json]
       --hash   1 本ずつの実バイトの sha256 も確かめる（重い・既定は大きさだけ）
       --have   すでに入っているパックの目録（同じ形の index.json）。2 つ目を選んだときの
                「これから入る分／飛ばす分」を、アプリと同じ数え方（setPending）で出します
       --json   人が読む文の代わりに、1 行の JSON を出す（`tool`／`version` つき・機械向け）

   終了コード：0＝アプリで開けて、目録の全パックがそろい、大きさも合う／1＝食い違いあり／2＝開けない

   ⚠ 外へは取りに行きません。読むのは渡されたファイルだけです。

   ── これは「決まりごと」です（trk240）──────────────────────────────
   倉庫の CI（`tools/check-set-app.mjs`）が、**この道具をそのまま呼びます**（写しを持たない）。
   ですから、**この 4 つは勝手に変えません**：
     ① 呼び方（`node tools/check-set.mjs <ファイル> [--hash] [--have=<目録>]`）
     ② 終了コード（0／1／2 の意味）
     ③ `--json` の `tool`・`version`・`ok`・`problems` の意味
     ④ `--have` に渡す目録の形（`{packs:[{id,name,author,version,bytes}]}` か、その配列）
   増やすとき（新しいフラグ・新しい項目）は **先に書面で知らせます**。減らす・意味を変えるときは、
   相手の CI が赤になるので、**必ず先に相談**します（`docs/ROLES-TRK240-2026-11-01.md` §4）。
   ────────────────────────────────────────────────────────────── */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOOL = "check-set";
const VERSION = 2;      /* 1＝trk239（人が読む文だけ）／2＝trk240（--json を足した） */

function loadApp() {
  /* index.html と同じ順で読む（zip-io → pack-catalog）。画面が無いので document は空の偽物 */
  const sandbox = {
    window: {}, console, crypto, Promise, JSON, Math, Number, String, Object, Array, Set, Map, Error,
    Blob, File, Uint8Array, DataView, ArrayBuffer, BigInt, Uint32Array, TextEncoder, TextDecoder, Response,
    CompressionStream, DecompressionStream, Date, URL,
    document: { readyState:"complete", getElementById:() => null, createElement:() => ({ style:{}, append(){}, addEventListener(){} }) },
    addEventListener: () => {}, confirm: () => true, CSS: { escape: s => s }, tr: k => k,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const rel of ["js/zip-io.js", "js/pack-catalog.js"]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), sandbox, { filename: rel });
  }
  return { api: sandbox.window.Trk.packCatalog, Z: sandbox.window.Trk.zipIO };
}

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith("--"));
const wantHash = args.includes("--hash");
const wantJson = args.includes("--json");
const haveArg = (args.find(a => a.startsWith("--have=")) || "").slice("--have=".length);

/* 機械向けの結果（--json のときはこれだけを出す。人が読む文は stderr に出さない） */
const report = {
  tool: TOOL, version: VERSION,
  file: file ? path.basename(file) : "", bytes: 0,
  ok: false, reason: null,
  name: "", release: "", entries: 0,
  catalog: { packs: 0, dropped: 0 },
  packs: [], missing: [], pending: null,
  problems: 0,
};

function finish(code) {
  report.ok = code === 0;
  report.problems = countProblems();
  if (wantJson) process.stdout.write(JSON.stringify(report) + "\n");
  process.exit(code);
}
const countProblems = () => report.packs.reduce((n, p) => n + (p.ok ? 0 : 1), 0) + report.missing.length;
function fail(reason, code) {
  report.reason = reason;
  if (wantJson) { finish(code); return; }
  console.error(code === 2
    ? `❌ アプリでは開けません：${reason}（${report.file}・${report.bytes} B）`
    : `❌ ${reason}`);
  finish(code);
}

if (!file) {
  console.error("使い方：node tools/check-set.mjs <セット.stlib | セット.zip> [--hash] [--have=<目録.json>] [--json]");
  process.exit(2);
}
report.file = path.basename(file);
if (!fs.existsSync(file)) fail("ファイルがありません", 2);

const { api, Z } = loadApp();
const buf = fs.readFileSync(file);
report.bytes = buf.length;
const setFile = new File([buf], report.file, { type: "application/octet-stream" });

const opened = await api.openSet(setFile);
if (!opened.ok) fail(opened.reason || "catalogSetBad", 2);

const plan = api.planSet(opened);
const bytesOf = n => api.formatBytes(n);
report.name = opened.name || "";
report.release = opened.release || "";
report.entries = opened.zip.entries.length;
report.catalog = { packs: opened.catalog.packs.length, dropped: Number(opened.catalog.dropped) || 0 };

/* 1 本ずつ：大きさ（と、--hash のときは実バイトの sha256）を目録と比べる */
for (const item of plan.packs) {
  const chk = api.setEntryCheck(item.entry, item.zipEntry);
  const row = { id: item.entry.id, file: item.entry.file, bytes: Number(item.zipEntry.usize) || 0, ok: chk.ok, reason: chk.ok ? "" : chk.reason };
  if (chk.ok && wantHash) {
    let got = null;
    try {
      const blob = await Z.zipEntryBlob(opened.zip, item.zipEntry, api.SET_LIMITS.pack, false);
      got = await api.sha256Hex(blob);
    } catch (_) { got = null; }
    if (got === null) { row.sha256 = "unknown"; }
    else if (got !== item.entry.sha256) { row.ok = false; row.reason = "sha256Mismatch"; row.sha256 = got; }
    else { row.sha256 = "match"; }
  }
  report.packs.push(row);
}
for (const entry of plan.missing) report.missing.push({ id: entry.id, file: entry.file });

/* 「すでに入っている」を渡されたら、2 つ目を選んだときの数え方を出す（trk239） */
if (haveArg && fs.existsSync(haveArg)) {
  const raw = JSON.parse(fs.readFileSync(haveArg, "utf8"));
  const installed = (Array.isArray(raw) ? raw : raw.packs || []).map(p => ({
    id: String(p.id || ""), name: String(p.name || ""), author: String(p.author || ""),
    release: String(p.version || p.release || ""), bytes: Number(p.bytes) || 0, active: false,
  }));
  const pend = api.setPending(plan, installed);
  report.pending = {
    installed: installed.length,
    count: pend.pending.length,
    bytes: pend.bytes,
    ids: pend.pending.map(p => p.entry.id),
    skip: pend.skip.length,
  };
}

const bad = countProblems();
if (wantJson) finish(bad ? 1 : 0);

console.log(`✅ 開けました：${report.file}（${bytesOf(buf.length)}）`);
console.log(`   セット名：「${report.name}」${report.release ? `（${report.release}）` : "（set.json なし）"}／中身 ${report.entries} エントリ`);
console.log(`   目録 ${report.catalog.packs} 本 → 入れる ${plan.packs.length} 本（合計 ${bytesOf(plan.bytes)}）` +
  `／形が合わず外した ${report.catalog.dropped} 本／入っていない ${report.missing.length} 本`);

for (const row of report.packs) {
  let line = `   ${row.ok ? "・" : "❌"} ${row.id}（${bytesOf(row.bytes)}）`;
  if (!row.ok && row.reason === "sha256Mismatch") line += ` ← sha256 不一致（中身 ${String(row.sha256).slice(0, 12)}…）`;
  else if (!row.ok) line += ` ← ${row.reason}`;
  else if (row.sha256 === "match") line += "／sha256 一致";
  else if (row.sha256 === "unknown") line += "／sha256 計算できず";
  console.log(line);
}
for (const entry of report.missing) console.log(`   ❌ 入っていません：${entry.id}（目録の ${entry.file}）`);

if (report.pending) {
  const p = report.pending;
  console.log(`🔁 すでに入っている目録（${p.installed} 本）と突き合わせました`);
  console.log(`   これから入る ${p.count} 本（${bytesOf(p.bytes)}）／飛ばす ${p.skip} 本`);
  if (p.count) console.log(`   入る：${p.ids.join("・")}`);
}

console.log(bad ? `❌ 食い違い ${bad} 件（アプリでは入れられない／入れない）` : "✅ 目録と中身がそろっています（アプリでそのまま入れられます）");
finish(bad ? 1 : 0);

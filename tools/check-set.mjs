#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/* 📦 セット（.stlib / .zip）を「アプリの判定そのもの」で受け入れる（2026-11-01・trk239）

   なぜ要るか：
   倉庫（trk-Avatar-Library）の `tools/verify-set.mjs` は倉庫側の決めごとで検査します。
   こちらは **アプリのコード（js/zip-io.js と js/pack-catalog.js）をそのまま読み込んで**
   同じセットを開き、アプリが何と表示するかを先に出しておくための道具です。
   食い違い（＝アプリでは「見つからない」「入れません」になる）を受け取る前に見つけます。

   使い方：
     node tools/check-set.mjs <セット.stlib | セット.zip> [--hash] [--have=<目録.json>]
       --hash   1 本ずつの実バイトの sha256 も確かめる（重い・既定は大きさだけ）
       --have   すでに入っているパックの目録（同じ形の index.json）。2 つ目を選んだときの
                「これから入る分／飛ばす分」を、アプリと同じ数え方（setPending）で出します

   終了コード：0＝アプリで開けて、目録の全パックがそろい、大きさも合う／1＝食い違いあり／2＝開けない

   ⚠ 外へは取りに行きません。読むのは渡されたファイルだけです。 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
const haveArg = (args.find(a => a.startsWith("--have=")) || "").slice("--have=".length);

if (!file) {
  console.error("使い方：node tools/check-set.mjs <セット.stlib | セット.zip> [--hash] [--have=<目録.json>]");
  process.exit(2);
}
if (!fs.existsSync(file)) {
  console.error(`❌ ファイルがありません：${file}`);
  process.exit(2);
}

const { api, Z } = loadApp();
const name = path.basename(file);
const buf = fs.readFileSync(file);
const setFile = new File([buf], name, { type: "application/octet-stream" });

const opened = await api.openSet(setFile);
if (!opened.ok) {
  console.error(`❌ アプリでは開けません：${opened.reason}（${name}・${api.formatBytes(buf.length)}）`);
  process.exit(2);
}

const plan = api.planSet(opened);
const bytesOf = n => api.formatBytes(n);
console.log(`✅ 開けました：${name}（${bytesOf(buf.length)}）`);
console.log(`   セット名：「${opened.name}」${opened.release ? `（${opened.release}）` : "（set.json なし）"}／中身 ${opened.zip.entries.length} エントリ`);
console.log(`   目録 ${opened.catalog.packs.length} 本 → 入れる ${plan.packs.length} 本（合計 ${bytesOf(plan.bytes)}）` +
  `／形が合わず外した ${opened.catalog.dropped} 本／入っていない ${plan.missing.length} 本`);

let bad = 0;
/* 1 本ずつ：大きさ（と、--hash のときは実バイトの sha256）を目録と比べる */
for (const item of plan.packs) {
  const chk = api.setEntryCheck(item.entry, item.zipEntry);
  let line = `   ${chk.ok ? "・" : "❌"} ${item.entry.id}（${bytesOf(item.zipEntry.usize)}）`;
  if (!chk.ok) { bad++; line += ` ← ${chk.reason}${chk.want ? `（目録 ${bytesOf(chk.want)}／中身 ${bytesOf(chk.got)}）` : ""}`; }
  if (wantHash) {
    let got = null;
    try {
      const blob = await Z.zipEntryBlob(opened.zip, item.zipEntry, api.SET_LIMITS.pack, false);
      got = await api.sha256Hex(blob);
    } catch (e) { got = null; }
    if (got === null) line += "／sha256 計算できず";
    else if (got !== item.entry.sha256) { bad++; line += ` ← sha256 不一致（目録 ${String(item.entry.sha256).slice(0, 12)}…／中身 ${got.slice(0, 12)}…）`; }
    else line += "／sha256 一致";
  }
  console.log(line);
}

/* 目録にあるが、セットの中に無いもの */
for (const entry of plan.missing) {
  bad++;
  console.log(`   ❌ 入っていません：${entry.id}（目録の ${entry.file}）`);
}

/* 「すでに入っている」を渡されたら、2 つ目を選んだときの数え方を出す（trk239） */
if (haveArg) {
  const raw = JSON.parse(fs.readFileSync(haveArg, "utf8"));
  const installed = (Array.isArray(raw) ? raw : raw.packs || []).map(p => ({
    id: String(p.id || ""), name: String(p.name || ""), author: String(p.author || ""),
    release: String(p.version || p.release || ""), bytes: Number(p.bytes) || 0, active: false,
  }));
  const pend = api.setPending(plan, installed);
  console.log(`🔁 すでに入っている目録（${installed.length} 本）と突き合わせました`);
  console.log(`   これから入る ${pend.pending.length} 本（${bytesOf(pend.bytes)}）／飛ばす ${pend.skip.length} 本`);
  if (pend.pending.length) console.log(`   入る：${pend.pending.map(p => p.entry.id).join("・")}`);
}

console.log(bad ? `❌ 食い違い ${bad} 件（アプリでは入れられない／入れない）` : "✅ 目録と中身がそろっています（アプリでそのまま入れられます）");
process.exit(bad ? 1 : 0);

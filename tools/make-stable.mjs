#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/* 📦 安定版 `trk` を「いまの trk-PWA の中身」にそろえる道具（2026-11-02・trk253・レビュー推奨 A-1）

   なにをする人か：
   上流 `Trk-Nexus/trk`（利用者さんに配る安定版）は、**ここで直接開発しません**。
   trk-PWA の main が本番で、安定版はそこから作ります（二重管理をなくすため）。
   この道具は「trk-PWA が追跡しているファイルを、上流クローンへ写して、住所を反転して、差分を出す」ところまでを
   機械的にやります。**push・PR・merge はしません**（下の次のコマンドを見てください）。

   使い方：
     git clone https://github.com/Trk-Nexus/trk.git ../trk
     node tools/make-stable.mjs --repo=../trk                  # 見るだけ（1行も書き換えない）
     node tools/make-stable.mjs --repo=../trk --apply          # 写す
     node tools/make-stable.mjs --repo=../trk --apply --prune  # 上流専用に残ったファイルも消す
     # → cd ../trk && npm run check && git checkout -b trk-stable-YYYY-MM-DD && commit/push → PR

   ・住所の反転：`trk-PWA` → `trk`（テキスト拡張子だけ）。`docs/`・`tests/`・`tools/` も同じ規則で直すので、
     trk249 の「オリジンの記述を縛る検査」など**この倉庫の検査ごと持っていったまま通ります**（実測）。
   ・①（スコープ印を見る掃除）と④（設定保存のマージ）は trk-PWA の実体に入っているので、
     **この写し方だと上流へ自動で入ります**（`tools/backport-trk-scope-tag.mjs` は「上流を触らず直す」用の道具）。
   ・`--public-only` は standalone ZIP と同じ集合（公開物だけ）でやる指定です。上流の `tests/`・`tools/` が
     そのまま残るので、上流側の検査は trk-PWA の版とズレます（ふつうは鏡のほうを使ってください）。
   ・`--cache=NAME` で写したあとの `sw.js` の版名を書き換えられます（既定では trk-PWA の番号のまま。
     上流は自分たちの `1.1.8（trk219）` の番号体系なので、**どっちの番号で出すか決めてから**入れてください）。 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { includeRel } from "./pack-standalone.mjs";

const args = process.argv.slice(2);
const has = f => args.includes(`--${f}`);
const getArg = (name, dflt) => {
  const hit = args.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
};
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");   // trk-PWA
const TARGET = path.resolve(getArg("repo", "../trk"));
const TODAY = getArg("date", new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" }));
const APPLY = has("apply");
const FLIP = !has("no-flip");
const TEXT_EXT = /\.(html|js|mjs|cjs|css|md|txt|json|webmanifest|yml|yaml|xml|svg|ts|serviceworker)$/i;

const log = (...a) => console.log(...a);
let failed = 0;
const bad = msg => { failed++; console.error("⚠ " + msg); };

function trackedIn(dir) {
  try {
    return execFileSync("git", ["-C", dir, "ls-files", "-z"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
      .split("\0").filter(Boolean);
  } catch (e) { bad("git ls-files が失敗しました（" + dir + "）：" + e.message); return null; }
}

const srcFiles = trackedIn(ROOT);
const dstFiles = trackedIn(TARGET);
if (srcFiles === null || dstFiles === null) process.exit(1);
const set = FLIPSET();
function FLIPSET() {
  const all = srcFiles.slice();
  return has("public-only") ? all.filter(includeRel) : all;
}
/* 反転する形：`trk-PWA`（URL・リポジトリ名）と `trk-pwa`（スコープ印・キャッシュ名の末尾）。
   どちらも語の切れ目まで見て、`trk-PWA-foo` のような別物には触りません。 */
const FLIP_RULES = [[/trk-PWA(?![-\w])/g, "trk"], [/trk-pwa(?![-\w])/g, "trk"]];

const add = [], upd = [], same = [];
let flipFiles = 0, flipCount = 0;
const written = new Set();
for (const rel of set) {
  const srcAbs = path.join(ROOT, rel);
  if (!fs.existsSync(srcAbs)) { bad("追跡しているのに実体がありません：" + rel); continue; }
  let body = fs.readFileSync(srcAbs);
  if (FLIP && TEXT_EXT.test(rel)) {
    let text = body.toString("utf8");
    let n = 0;
    for (const [re, to] of FLIP_RULES) { n += (text.match(re) || []).length; text = text.replace(re, to); }
    if (n) { body = Buffer.from(text, "utf8"); flipFiles++; flipCount += n; }
  }
  const dstAbs = path.join(TARGET, rel);
  const old = fs.existsSync(dstAbs) ? fs.readFileSync(dstAbs) : null;
  written.add(rel);
  if (old === null) add.push(rel);
  else if (old.equals(body)) same.push(rel);
  else upd.push(rel);
  if (APPLY && (old === null || !old.equals(body))) {
    fs.mkdirSync(path.dirname(dstAbs), { recursive: true });
    fs.writeFileSync(dstAbs, body);
  }
}

/* 版名（sw.js の CACHE）を差し替える指定 */
let cacheNote = "";
const wantCache = getArg("cache", "");
if (wantCache) {
  const swRel = "sw.js";
  const swAbs = path.join(TARGET, swRel);
  if (fs.existsSync(swAbs)) {
    const text = fs.readFileSync(swAbs, "utf8");
    const m = text.match(/const CACHE = "[^"]+";/);
    if (!m) bad("--cache を指定しましたが、sw.js の `const CACHE = \"…\";` が見つかりません");
    else {
      const out = text.replace(m[0], `const CACHE = "${wantCache}";`);
      if (APPLY) fs.writeFileSync(swAbs, out);
      cacheNote = `版名：${m[0]} → const CACHE = "${wantCache};"`;
    }
  } else bad("写し先の sw.js がありません");
} else cacheNote = "版名：trk-PWA のものをそのまま持っていく（上げるなら --cache= を使う）";

/* 上流専用に存在するファイル（写し集合に無い追跡ファイル） */
const extra = dstFiles.filter(rel => !written.has(rel));
if (has("prune") && APPLY) {
  for (const rel of extra) { fs.rmSync(path.join(TARGET, rel), { force: true }); }
}

/* --apply のあとは git の index にも入れます（この倉庫の検査は `git ls-files` で見るため、
   untracked のままだと「vendor が追跡されていない」と出て失敗します。commit はしません） */
if (APPLY) {
  try { execFileSync("git", ["-C", TARGET, "add", "-A"], { stdio: "ignore" }); }
  catch (e) { bad("git add -A に失敗：" + e.message); }
}

log(`写す集合：${set.length} ファイル（${has("public-only") ? "公開物だけ" : "追跡している全部＝鏡"}）／住所の反転：${FLIP ? "する（trk-PWA → trk）" : "しない"}`);
log(`  追加 ${add.length}・更新 ${upd.length}・同一 ${same.length}` + (FLIP ? `／反転したファイル ${flipFiles} 件（語 ${flipCount}）` : ""));
if (extra.length) log(`  上流専用（写し集合に無い）：${extra.length} 件` + (has("prune") && APPLY ? " → 消しました" : " → そのまま残します（見るだけ／消すなら --prune --apply）"));
if (add.length) log("    追加の例：" + add.slice(0, 6).join(", ") + (add.length > 6 ? " …" : ""));
if (upd.length) log("    更新の例：" + upd.slice(0, 6).join(", ") + (upd.length > 6 ? " …" : ""));
if (extra.length) log("    残る例：" + extra.slice(0, 8).join(", ") + (extra.length > 8 ? " …" : ""));
log("  " + cacheNote);
log("\n" + (APPLY ? `✅ 当てました：${TARGET}` : `👀 見ています（--apply を付けると書き換えます）：${TARGET}`));
log("   次：cd " + TARGET + " && npm run check        （この倉庫の検査ごと持っていくので trk-PWA と同じ結果が期待値）");
log("       git checkout -b trk-stable-" + TODAY + " && git add -A && git commit");
log("       gh pr create --repo Trk-Nexus/trk --base main --fill   （**main に直接 push しない**）");
log("       ※ og.png を焼き直す人だけ：ブラウザで tools/make-icons.html を開いて作り直す（住所は焼き込まない版になっています）");
if (failed) { log("\n⚠ " + failed + " 件で止まりました"); process.exitCode = 1; }

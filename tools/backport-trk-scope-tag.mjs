#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/* 🔧 trk-PWA 側でやった「置き場所の印」の掃除を、上流 `trk` へ当ててための道具（2026-11-02・trk252）

   なぜこれがあるか：
   同じオリジン（`*.github.io`）に上流 `/trk/` と trk-PWA `/trk-PWA/` が並ぶと、
   上流 `sw.js` の activate が「`trk-` 始まりは全部消す」を無条件にやるため、
   **trk-PWA のオフライン用の殻・3D vendor・📥共有の一時置き場まで消えます**。
   trk-PWA 側は trk252 で自分の名前を `trkPWA-` 始まりに変えて逃げました（自衛）。
   本筋は上流側の掃除を直すことで、その差し替えを**手で打ち込まなくて済む**ようにするのがこの道具です
   （2026-11-02 時点で、この作業セッションの GitHub App が `Trk-Nexus/trk` に ref を作れないため、
   PR を代行できませんでした＝`docs/UPSTREAM-TRK-SCOPE-TAG-2026-11-02.md`）。

   使い方：
     git clone https://github.com/Trk-Nexus/trk.git ../trk
     node tools/backport-trk-scope-tag.mjs --repo=../trk          # 当てる
     node tools/backport-trk-scope-tag.mjs --repo=../trk --check  # 当たり方の確認だけ（書き換えない）
     cd ../trk && npm run check && git add -A && git commit && git push  → PR

   ・`--dry-run`（＝`--check`）では 1 行も書き換えません。
   ・**このスクリプトは上流のファイルを「期待した形のまま見つけたときだけ」直します**
     （見つからない・もう当たっている場合はそこで止めて、何をすべきか表示します）。
   ・trk-PWA 自身の `sw.js` は対象外です（うちは trk252 で `trkPWA-` 接頭辞方式に切り替え済み）。*/
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const getArg = (name, dflt) => {
  const hit = args.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
};
const checkOnly = args.includes("--check") || args.includes("--dry-run");
const ROOT = path.resolve(getArg("repo", "../trk"));

const log = (...a) => console.log(...a);
let failed = 0;
const bad = msg => { failed++; console.error(`⚠ ${msg}`); };

const rd = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const wr = (rel, s) => { if (!checkOnly) fs.writeFileSync(path.join(ROOT, rel), s); };

/* ---------- ① sw.js：activate の掃除にスコープ印の条件を足す ---------- */
const SW_OLD = `self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE && key !== SHARE_CACHE).map(key => caches.delete(key)));`;

const SW_NEW = `/* 🧭 置き場所の印（trk-PWA の trk223/trk252 と組む形・2026-11-02）：
   CacheStorage はオリジン（scheme + host + port）共有なので、同じホストに別の trk!
   （例 /trk-PWA/）が在ると、上の無条件削除が相手のオフライン用キャッシュまで消します。
   そこで「印（@<スコープ>）が付いている名前は、自分のパスと合うときだけ片付ける」ようにします。
   印の無い名前はこのアプリ自身の古い版なので、これまでどおり片付けます。 */
function scopeTagOf(pathname) {
  const path = String(pathname || "/").replace(/\\/+$/, "");
  if (!path) return "root";
  return path.slice(1).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "root";
}
const SCOPE_TAG = scopeTagOf(SCOPE.pathname);
function cacheIsOurs(key) {
  if (key === CACHE || key === SHARE_CACHE) return true;
  const at = key.lastIndexOf("@");
  if (at === -1) return true;
  return key.slice(at + 1) === SCOPE_TAG;
}

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && cacheIsOurs(key) && key !== CACHE && key !== SHARE_CACHE).map(key => caches.delete(key)));`;

{
  let s;
  try { s = rd("sw.js"); } catch { bad("sw.js が読めません（--repo= の場所を確認してください）"); s = null; }
  if (s !== null) {
    if (s.includes("cacheIsOurs(key)")) log("① sw.js: もう入っています（スキップ）");
    else if (!s.includes(SW_OLD)) bad("① sw.js: 想定した activate の塊が見つかりませんでした（上流が変わった可能性。手で確認してください）");
    else { wr("sw.js", s.replace(SW_OLD, SW_NEW, 1)); log("① sw.js: activate の掃除をスコープ対応に"); }
  }
}

/* ---------- ② URL 記述を 組織 Trk-Nexus / 新ホストへ ---------- */
const URL_FILES = ["index.html", "README.md", "credits.html", "privacy.html", "js/library.js",
  "CONTRIBUTING.md", "docs/SECURITY.md", "docs/guide/en.md", "docs/guide/start.md", ".github/ISSUE_TEMPLATE/config.yml"];
const REPOS = [
  [/(https:\/\/github\.com\/)TonbokiriRaikiriMuramasa-Taikoubou\/trk(?![-\w])/g, "$1Trk-Nexus/trk"],
  [/tonbokiriraikirimuramasa-taikoubou\.github\.io\/trk(?![-\w])/g, "trk-nexus.github.io/trk"],
];
let urlCount = 0;
for (const rel of URL_FILES) {
  let s;
  try { s = rd(rel); } catch { continue; }
  const before = s;
  for (const [re, rep] of REPOS) s = s.replace(re, rep);
  const n = (before.match(REPOS[0][0]) || []).length + (before.match(REPOS[1][0]) || []).length;
  if (n) { wr(rel, s); urlCount += n; log(`② ${rel}: ${n} 件`); }
}
if (!urlCount) log("② URL: 変更なし（すでに新住所かも）");

/* ---------- ③ og.png に住所を焼き込まない ---------- */
{
  let s;
  try { s = rd("tools/make-icons.html"); } catch { s = null; }
  if (s !== null) {
    const re = /^([ \t]*)x\.font = `600 22px \$\{FONT\}`; x\.fillStyle = "#8a8d9c"; x\.fillText\("[^"]*github\.io\/trk", \d+, \d+\);\n/m;
    if (!re.test(s)) log("③ tools/make-icons.html: 住所の描画は見つかりませんでした（スキップ）");
    else {
      wr("tools/make-icons.html", s.replace(re,
        "$1/* 住所（URL）は描き込みません（2026-11-02 の判断）。焼き込むと、Pages のホストを変えるたびに画像を作り直すはめになります。 */\n", 1));
      log("③ tools/make-icons.html: URL 描画を削除（**既存の docs/og.png の焼き込みは別で作成し直しです**）");
    }
  }
}

/* ---------- 結果 ---------- */
if (failed) {
  log("\n⚠ " + failed + " 件で止まりました。" + (checkOnly ? "（--check なので書き換えはしていません）" : "書き換えた部分が残っている可能性があるので git diff を確認してください"));
  process.exitCode = 1;
} else {
  log(`\n✅ ${checkOnly ? "当たります（--check：書き換えはしていません）" : "当てました"}：${ROOT}`);
  log("   次： cd " + ROOT + " && npm run check   （Static・Security・a11y・tests が全部通ることを確認）");
  log("   いつからでも： ブランチを作って push → PR（`gh pr create --repo Trk-Nexus/trk --base main`）");
  log("   版名（sw.js の CACHE）は上げなくてよいです。掃除の条件だけの変えで、殻の中身は無変更だからです。");
}

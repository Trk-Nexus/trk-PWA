#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/* 🔁 trk-Avatar-Library の目録（catalog/typography.json）を、このアプリの写しに反映する道具
   （2026-11-02・返事15 §2「trk-PWA の写しは自動では届きません」への答え・trk254）

   何をするか：
   1. 相手の `catalog/typography.json` を読む（ローカルの clone か、GitHub の ref から）
   2. `tests/fixtures/` に**固定版（vendored）としてそのまま**置き、sha256 と ref をメタに記録
   3. `js/typography.js` の `const PAIRINGS = [...]` を、その固定版から**機械的に作り直す**
      （写しを目録から手で書き写さない。ズレの元を1つ消す）
   4. `tests/trk254-typography-copy.test.mjs`（同席で走る検査）が、
      「固定版の sha256 がメタと合うか」「写し＝固定版から作ったものか」を見る

   使い方：
     node tools/sync-typography-catalog.mjs --from=../trk-Avatar-Library/catalog/typography.json --ref=<sha>
     node tools/sync-typography-catalog.mjs --against=main            # GitHub の main から取ってくる（通信が必要）
     node tools/sync-typography-catalog.mjs --check                   # 書き換えずに、ズレだけ報告
     node tools/sync-typography-catalog.mjs --against=main --check    # 先方だけが進んでいないかを見る（CI 向き）

   ・`--check` は 1 行も書き換えません。
   ・写しの形（`packs` から `font-packs/` を落とす・役ごとに tracking/leading を畳む）は
     trk246 からの約束です。中の**値**はこの道具が目録どおりに作るので、人は触りません。*/
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const has = f => args.includes("--" + f);
const getArg = (name, dflt) => {
  const hit = args.find(a => a.startsWith("--" + name + "="));
  return hit ? hit.slice(name.length + 3) : dflt;
};
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const FIX = path.join(ROOT, "tests", "fixtures");
const CAT = path.join(FIX, "avatar-library-typography.json");
const META = path.join(FIX, "avatar-library-typography.meta.json");
const TYPO = path.join(ROOT, "js", "typography.js");
const ROLES = ["display", "heading", "body", "caption", "numeral", "accent"];
const log = (...a) => console.log(...a);
let failed = 0;
const bad = m => { failed++; console.error("⚠ " + m); };

/* ---------- 1. 目録を読む ---------- */
function fetchFromRef(ref) {
  const b64 = execFileSync("gh", ["api", "repos/Trk-Nexus/trk-Avatar-Library/contents/catalog/typography.json?ref=" + ref,
    "--jq", ".content"], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }).trim();
  return Buffer.from(b64.replace(/\s+/g, ""), "base64").toString("utf8");
}
let text = null, srcLabel = "";
if (getArg("from", "")) {
  srcLabel = path.resolve(ROOT, getArg("from"));
  try { text = fs.readFileSync(srcLabel, "utf8"); } catch (e) { bad("--from が読めません：" + e.message); }
} else if (getArg("against", "")) {
  srcLabel = "Trk-Nexus/trk-Avatar-Library@" + getArg("against");
  try { text = fetchFromRef(getArg("against")); } catch (e) { bad("--against から取れませんでした：" + e.message); }
} else if (fs.existsSync(CAT)) {
  srcLabel = CAT; text = fs.readFileSync(CAT, "utf8");
  log("（--from / --against が無いので、いま固定してある版で照合だけします）");
} else { bad("--from=<ファイル> か --against=<ref> を付けてください（まだ固定版がありません）"); }
if (text === null) process.exit(1);

let cat;
try { cat = JSON.parse(text); } catch (e) { bad("目録が JSON として読めません：" + e.message); process.exit(1); }
const pairs = cat.pairings || [];
if (pairs.length !== 14) bad("目録の組数が " + pairs.length + " です（14 を想定）。相手の形が変わった可能性があるので、この道具も見直しが必要です");
const sha256 = crypto.createHash("sha256").update(text, "utf8").digest("hex");

/* ---------- 2. 写しを作る（値はすべて目録から） ---------- */
function derive() {
  return pairs.map(p => {
    const out = { id: p.id, name: p.name, why: p.why, useFor: p.useFor };
    if (p.trkUse) out.trkUse = p.trkUse;
    out.tags = p.tags; out.scale = String(p.scale);
    const trk = p.tracking || {}, led = p.leading || {};
    for (const role of ROLES) {
      const s = (p.slots || {})[role];
      if (!s) continue;
      const one = { family: s.family, weight: s.weight };
      if (typeof trk[role] === "number") one.tracking = trk[role];
      if (typeof led[role] === "number") one.leading = led[role];
      out[role] = one;
    }
    out.packs = (p.packs || []).map(x => String(x).replace(/^font-packs\//, ""));
    return out;
  });
}
const derived = derive();
const line = "  const PAIRINGS = " + JSON.stringify(derived) + ";";

/* ---------- 3. 書き換え（--check はここまでで止まる） ---------- */
const cur = fs.readFileSync(TYPO, "utf8");
const re = /^ {2}const PAIRINGS = \[.*\];$/m;
if (!re.test(cur)) { bad("js/typography.js の `const PAIRINGS = [...];` の1行が見つかりません（形が変わった可能性）"); }
const next = cur.replace(re, () => line);
const changedPairs = [];
try {
  const before = JSON.parse(cur.match(/const PAIRINGS = (\[.*\]);/m)[1]);
  for (const p of derived) {
    const o = before.find(x => x.id === p.id) || {};
    const keys = new Set([...Object.keys(p), ...Object.keys(o)]);
    const diff = [...keys].filter(k => JSON.stringify(p[k]) !== JSON.stringify(o[k]));
    if (diff.length) changedPairs.push(p.id + "（" + diff.join("・") + "）");
  }
} catch (e) { bad("いまの写しが読めません：" + e.message); }

if (has("check")) {
  log("👀 照合だけ（書き換えません）：" + srcLabel);
  log("   目録の sha256：" + sha256);
  const meta = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, "utf8")) : null;
  if (!meta) log("   （固定版のメタがありません）");
  else log("   固定してある版：" + meta.sha256.slice(0, 12) + "…（" + meta.ref + "）→ " + (meta.sha256 === sha256 ? "同じです" : "**先方が進んでいます**"));
  log("   写しとの差：" + (changedPairs.length ? changedPairs.length + " 組（" + changedPairs.join("／") + "）" : "ありません"));
  if (changedPairs.length) process.exitCode = 1;
  process.exit(failed ? 1 : 0);
}

fs.writeFileSync(TYPO, next);
fs.mkdirSync(FIX, { recursive: true });
fs.writeFileSync(CAT, text);
fs.writeFileSync(META, JSON.stringify({
  source: "Trk-Nexus/trk-Avatar-Library",
  file: "catalog/typography.json",
  ref: getArg("ref", getArg("against", "unknown")),
  sha256, bytes: Buffer.byteLength(text, "utf8"), pairings: derived.length,
  note: "js/typography.js の PAIRINGS はこのファイルから tools/sync-typography-catalog.mjs で作る（手で写さない）"
}, null, 2) + "\n");

log("✅ 反映しました：" + srcLabel);
log("   js/typography.js の PAIRINGS を14組に作り直し／固定版とメタを tests/fixtures/ に置きました");
if (changedPairs.length) log("   変わった組：" + changedPairs.join("／"));
log("   次：node --test tests/trk246-typography.test.mjs tests/trk254-typography-copy.test.mjs && npm run check");
log("   （見た目に効く変更なので sw.js の CACHE を上げてください）");
if (failed) { log("⚠ " + failed + " 件で止まりました"); process.exitCode = 1; }

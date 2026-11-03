#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/* 🎨 生成物のスキンの色を検める（trk274・E-6）

   なぜ要るか：
   `tools/check-cli-skin.mjs` は**目録（colors）**を見る道具で、`js/skins-wizard.js` のような
   **生成物（ui / game）**を渡すと「colors が足りません」と言って全件落ちます（trk273 で実測）。
   受け取ったあとの**送る側の成果物**を、こちらと同じ物差しで検められる道具がありませんでした。

   使い方：
     node tools/check-skin-contrast.mjs [ファイル…] [--json] [--quiet]
       既定は `js/skins-wizard.js` と `js/skins-volumes.js`（どちらも目録から生成したもの）。
       読むのは `.js` の**リテラルだけ**（`tools/lib/skin-catalog.mjs` の読み取り。実行しません）。

   何を見るか（アプリの見え方に合わせた組だけ）：
     ・本文（--ui-text）と、うすい文字（--ui-muted）が、次の**面**の上で 4.5:1
         地（--ui-bg・グラデーションは**全部の停止点**）／パネル／入力欄／ボタン／ボタン（hover）
     ・選択中のボタン（--ui-on-accent）が、アクセントの上で 4.5:1
     ・ゲーム画面の文字（game.ink）が、舞台（game.stage・グラデーションは全停止点）の上で 4.5:1
     ・判定のエラー色（game.miss）が、入力欄の上で 3:1
     ・小さなアクセント文字（`data.js` の accentInk）が、入れ子のパネルの上で 4.5:1
       ＝ 画面でいちばん条件のきつい所（trk114 の検査と同じ考え方）

   終了コード：0＝全部合格／1＝届かない色がある／2＝読めない
     `--json` は機械向け（{ ok, files, skins, problems }）。`--quiet` は合格の行を出しません。

   ⚠ 外へは取りに行きません。読むのは渡されたファイルだけです。
   ⚠ これは「決まりごと」ではありません。**助言の道具**です（値が違っても受け取れます）。 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { catalogFromJs } from "./lib/skin-catalog.mjs";


const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOOL = "check-skin-contrast";
const VERSION = 1;
const DEFAULTS = ["js/skins-wizard.js", "js/skins-volumes.js"];
const args = process.argv.slice(2);
const asJson = args.includes("--json");
const quiet = args.includes("--quiet");
const files = args.filter(a => !a.startsWith("--"));
if (!files.length) files.push(...DEFAULTS);

/* アプリと同じ計算（js/data.js）を、画面なしの偽物で読む */
function loadData() {
  const sandbox = {
    window: {}, console, Math, JSON, Object, Array, String, Number, Date, Set, Map, Error, RegExp, Intl,
    parseInt, parseFloat, isNaN, isFinite,
    document: { documentElement: { style: { setProperty() {} } }, getElementById: () => null, createElement: () => ({ style: {}, append() {}, addEventListener() {} }) },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "js/data.js"), "utf8"), sandbox, { filename: "js/data.js" });
  return sandbox.window.Trk.data;
}
const D = loadData();

const round = n => Math.round(n * 100) / 100;
const ratio = (fg, bg) => {
  const a = D.luminance(fg), b = D.luminance(bg);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return NaN;
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
/* 地はグラデーションのこともある（`linear-gradient(180deg,#a,#b)`）。全部の停止点に開く */
function stopsOf(v) {
  if (typeof v !== "string") return [];
  if (!/^linear-gradient\(/i.test(v.trim())) return [v.trim()];
  return v.slice(v.indexOf("(") + 1, -1).split(",").slice(1).map(s => s.trim().replace(/\s+\d+%$/, ""));
}
const rgbHex = v => Array.isArray(v)
  ? "#" + v.slice(0, 3).map(n => Math.round(n).toString(16).padStart(2, "0")).join("")
  : D.toHex(v);

/* ---------- 生成物の .js を、実行せずに読む ----------
   `S["id"] = { … };` の**リテラル**だけを取り出して JSON として読みます（関数・式は入りません）。
   `tools/lib/skin-catalog.mjs` の読み取りは「配列か S[...] のどちらか一方」を返す作りなので、
   1 つのファイルに**スキンと巻の目録が同居する** trk274 の形は読めません（実測）。ここだけで足します。 */
function literalAt(text, start) {
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}
function readGeneratedJs(text) {
  /* `S["id"] = { … };` を切り出して、倉庫の読み取り（リテラルだけを読む道具）に渡す。
     生成物には id が入っていないので、切り出した順に id を付け直します。 */
  const ids = [], bodies = [];
  const re = /\bS\["([A-Za-z0-9_.-]{1,48})"\]\s*=\s*\{/g;
  let m;
  while ((m = re.exec(text))) {
    const start = text.indexOf("{", m.index);
    if (start === -1) continue;
    const body = literalAt(text, start);
    if (!body) continue;
    ids.push(m[1]);
    bodies.push(body);
    re.lastIndex = start + body.length;
  }
  let list = [];
  if (bodies.length) {
    const parsed = catalogFromJs("const SKINS_WIZARD = [" + bodies.join(",\n") + "];");
    if (parsed && Array.isArray(parsed.list)) list = parsed.list;
  }
  const skins = list.map((obj, i) => ({ ...obj, id: ids[i] }));
  const volumes = [];
  const volRe = /\{id:"([a-z][a-z0-9-]{1,23})",title:"[^"]*",ids:\[([^\]]*)\]\}/g;
  while ((m = volRe.exec(text))) volumes.push(m[1]);
  return { skins, volumes };
}

/* ---------- 1 枚を検める ---------- */
function checkSkin(skin) {
  const problems = [];
  const ui = skin.ui || {}, game = skin.game || {};
  const need = (label, fg, bg, floor) => {
    const r = ratio(fg, bg);
    if (Number.isFinite(r) && r >= floor - 1e-9) return;
    problems.push({
      reason: "contrast", label, fg, bg, floor,
      ratio: Number.isFinite(r) ? round(r) : null,
      message: `${label}: ${fg} on ${bg} is ${Number.isFinite(r) ? round(r).toFixed(2) : "?"}:1 (needs ${floor}:1)`,
    });
  };
  for (const [key, name] of [["--ui-bg", "地"], ["--ui-panel", "パネル"], ["--ui-field", "入力欄"], ["--ui-button", "ボタン"], ["--ui-button-hover", "ボタン（hover）"]]) {
    for (const bg of stopsOf(ui[key])) {
      need(`本文／${name}`, ui["--ui-text"], bg, 4.5);
      need(`うすい文字／${name}`, ui["--ui-muted"], bg, 4.5);
    }
  }
  need("選択中の文字／アクセント", ui["--ui-on-accent"], ui["--ui-accent"], 4.5);
  for (const bg of stopsOf(game.stage)) need("ゲームの文字／舞台", game.ink, bg, 4.5);
  need("エラー色／入力欄", game.miss, ui["--ui-field"], 3);
  if (typeof D.accentInk === "function" && typeof D.accentInkBackground === "function") {
    const back = D.accentInkBackground(ui);
    if (back) need("小さなアクセント文字／入れ子", D.toHex(D.accentInk(ui)), rgbHex(back), 4.5);
  }
  return problems;
}

/* ---------- ファイルごと ---------- */
const report = { tool: TOOL, version: VERSION, ok: true, files: [], skins: 0, problems: [] };
for (const rel of files) {
  const abs = path.resolve(ROOT, rel);
  if (!fs.existsSync(abs)) {
    report.ok = false;
    report.problems.push({ reason: "io", file: rel, message: `読めません：${rel}` });
    continue;
  }
  let list = [], volumeCount = 0;
  try {
    const read = readGeneratedJs(fs.readFileSync(abs, "utf8"));
    list = read.skins;
    volumeCount = read.volumes.length;
  } catch (e) {
    report.ok = false;
    report.problems.push({ reason: "parse", file: rel, message: `読めません（${e.message}）` });
    continue;
  }
  if (!list.length && !volumeCount) {
    report.ok = false;
    report.problems.push({ reason: "parse", file: rel, message: `読めません（S["id"] = { … } の形が見つかりません）` });
    continue;
  }
  const mine = [];
  for (const skin of list) {
    const id = skin && typeof skin.id === "string" ? skin.id : "?";
    if (!skin || !skin.ui || !skin.game) {
      mine.push({ reason: "shape", file: rel, id, message: `${id}: ui / game がありません（目録の形ですか？ 生成物を渡してください）` });
      continue;
    }
    for (const p of checkSkin(skin)) mine.push({ file: rel, id, ...p });
  }
  const skinCount = list.length;   /* 巻の目録は list に入っていません（別に数える） */
  report.skins += skinCount;
  report.files.push({ file: rel, skins: skinCount, volumes: volumeCount, problems: mine.length });
  report.problems.push(...mine);
  report.ok = report.ok && mine.length === 0;
}
report.problems = report.problems.map(p => ({ tool: TOOL, version: VERSION, ...p }));

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const f of report.files) {
    const extra = f.volumes ? `＋巻の目録 ${f.volumes}` : "";
    if (f.problems) console.log(`✗ ${f.file}：${f.skins} 種のうち ${f.problems} 件が基準に届きません`);
    else if (!quiet) console.log(`✓ ${f.file}：${f.skins} 種${extra}は全部合格（文字 4.5:1・エラー 3:1）`);
  }
  for (const p of report.problems) if (p.message && p.reason !== "io") console.log(`    ${p.id ? p.id + "：" : ""}${p.message}`);
  /* どの組を見たかを 1 行で（黙って通していないことの証拠） */
  if (!quiet) console.log(`  見た組：本文・うすい文字 ×（地・パネル・入力欄・ボタン・hover）／選択中 × アクセント／舞台 × ゲームの文字／エラー × 入力欄／小さなアクセント × 入れ子`);
}
process.exit(report.ok ? 0 : 1);

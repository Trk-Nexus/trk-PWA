#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/* ⌨ CLI 用スキンの受け入れ検査（trk268 → trk269 v2）

   なぜ要るか：
   CLI（⌨ ターミナル）用のスキンは、倉庫（trk-Avatar-Library）側が値を決めて渡してくれます。
   「渡してから気づく」を減らすため、**アプリと同じ計算**（js/data.js の accentInk・luminance・
   buildCustomSkin・sanitizeCliLook）で、こちらが受け取る前に確かめられる道具です。

   使い方：
     node tools/check-cli-skin.mjs <スキンの JSON> [--json]
       ── 渡せる形は 3 つ ──
       ① スキン 1 枚     { "id": "wizard-cli", "cat": ["wizard"], "colors": {...}, "cli": {...} }
       ② パックの目録    { "skin": { ...①... } }        （.stpack の pack.json）
       ③ 倉庫の目録      { "format": "trk-avatar-library-skins", "skins": [ ...①... ] }
   終了コード：0＝受け取れる／1＝直すところがある／2＝読めない（JSON でない・形が違う）
     ⚠ v2 で意味をそろえました：**1 は「直すところがある」全部**（名前なし・色・コントラスト・cli）です。
       どの種類かは `--json` の `reason`（name／color／contrast／cli）で分かります。

   v2 で足したこと：
     ・目録を渡したときは **CLI を名乗るスキンだけ**を判定し、それ以外は `notes` に回す（雑音を消す）
     ・道の文字（`/` `\` `` ` `` `~` `:` `..` `C:`）を **id・cli.font・cli.prompt** で断る
     ・cli の 5 つ（cursor／opacity／history／completion／bell）も見る

   ⚠ 外へは取りに行きません。読むのは渡されたファイルだけです。
   ⚠ これは「決まりごと」ではありません。**助言の道具**です（こちらは値が違っても受け取れます）。 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOOL = "check-cli-skin";
const VERSION = 2;
const CLI_CATS = ["wizard", "cli", "console"];

/* アプリの data.js を、画面なしの偽物で読む（計算はアプリと同じものを使う） */
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

const args = process.argv.slice(2);
const wantJson = args.includes("--json");
const file = args.find(a => !a.startsWith("--"));
if (!file) {
  console.error("使い方：node tools/check-cli-skin.mjs <スキンの JSON> [--json]");
  process.exit(2);
}

let raw;
try { raw = JSON.parse(fs.readFileSync(path.resolve(file), "utf8")); }
catch (e) {
  console.error("読めませんでした：" + (e && e.message ? e.message : String(e)));
  process.exit(2);
}

const D = loadData();
const has = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
const catOf = skin => (Array.isArray(skin.cats) ? skin.cats : Array.isArray(skin.cat) ? skin.cat : []);
const isCli = skin => catOf(skin).some(c => CLI_CATS.includes(String(c).toLowerCase()));
/* 道の文字（スキンから受け取らない約束。CLI の入力と同じ関所） */
const PATHY = /[/\\`~:]|\.\.|^[A-Za-z]:/;

/* 形をそろえて「検査するスキンの一覧」にする */
let list = [], fromCatalog = false;
if (Array.isArray(raw.skins)) {
  list = raw.skins.map(s => ({ ...s, _from: "skins[]" }));
  fromCatalog = true;
} else if (raw.skin && typeof raw.skin === "object") list = [{ ...raw.skin, _from: "skin" }];
else if (raw.colors && typeof raw.colors === "object") list = [{ ...raw, _from: "root" }];
else {
  console.error("形が違います①スキン 1 枚／②{\"skin\":…}／③{\"skins\":[…]} のどれかでください");
  process.exit(2);
}
if (!list.length) {
  console.error("検査するスキンがありません");
  process.exit(2);
}

/* 色の比（WCAG） */
const ratio = (a, b) => {
  const la = D.luminance(a), lb = D.luminance(b);
  if (!Number.isFinite(la) || !Number.isFinite(lb)) return 0;
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + .05) / (lo + .05);
};
const fmt = n => (Math.round(n * 100) / 100).toFixed(2);
const NEED = ["bg", "panel", "text", "accent", "gold"];
/* パネルは `rgba(13,59,13,.97)` のような半透明でも正しい（目録はこの形を使う）。
   色として受け取れるのは #rgb・#rrggbb・rgb()・rgba() の 4 つ。 */
const COLOR_OK = v => typeof v === "string" && (D.HEX.test(v) || /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d{1,3})\s*)?\)$/i.test(v.trim()));
const opaque = v => typeof v === "string" && D.HEX.test(v) ? v : "";

const problems = [];
const notes = [];
const report = [];

for (const skin of list) {
  const id = String(skin.id || skin.name || "(id なし)");
  const where = id;
  const bad = [];
  const good = [];
  const kinds = new Set();

  /* v2：目録まるごとを渡されたときは、名乗らないスキンを飛ばす（雑音を消す） */
  if (fromCatalog && !isCli(skin)) { notes.push(`${where}：CLI を名乗っていないので飛ばしました（cat に wizard／cli／console が無い）`); continue; }

  /* 1. 名乗り */
  if (isCli(skin)) good.push("cat に CLI の名乗り（" + catOf(skin).join("・") + "）");
  else { bad.push("cat に wizard・cli・console のどれかがありません（1 語で足ります）"); kinds.add("name"); }
  if (PATHY.test(id)) { bad.push("id に道の文字（/ \\ ` ~ : .. C:）は使えません"); kinds.add("name"); }

  /* 2. 色 */
  const colors = skin.colors && typeof skin.colors === "object" ? skin.colors : null;
  const missing = !colors ? NEED.slice() : NEED.filter(k => !COLOR_OK(colors[k]));
  if (missing.length) { bad.push("colors が足りません：" + missing.join("・")); kinds.add("color"); }
  else {
    /* 3. コントラスト（アプリと同じ組み立てで測る） */
    let built = null;
    try {
      built = D.buildCustomSkin({
        name: String(skin.name || skin.id || "cli"),
        colors: { bg: colors.bg, panel: colors.panel, text: colors.text, accent: colors.accent, gold: colors.gold,
          bg2: colors.bg2, gradDir: skin.gradDir, glow: skin.glow, scanlines: skin.scanlines, font: skin.font, video: skin.video, mascot: "none" },
        cli: skin.cli
      });
    } catch (_) { bad.push("スキンとして組み立てられません（colors の値を見てください）"); kinds.add("color"); }
    if (built) {
      const ui = built.ui;
      const text = colors.text;
      const field = opaque(colors.field) || opaque(ui["--ui-field"]) || opaque(colors.panel);
      /* 半透明のパネルは、地の上に重ねた見た目になる。比を測れる不透明の面を探す
         （field → button → bg の順。どれも不透明でなければパネルの行は測らない） */
      const panel = opaque(colors.panel) || field || opaque(colors.bg);
      const surface = panel || field;
      const muted = opaque(colors.muted) || opaque(ui["--ui-muted"]) || text;
      const button = opaque(colors.button) || opaque(ui["--ui-button"]) || surface;
      const ink = D.accentInk(ui);
      const miss = opaque(built.game && built.game.miss) || text;
      const onAccent = opaque(colors.onAccent) || opaque(ui["--ui-on-accent"]);
      const rows = [
        ["文字（text）／パネル", text, surface, 4.5, "contrast"],
        ["文字（text）／入力欄", text, field, 4.5, "contrast"],
        ["文字（text）／ボタン", text, button, 4.5, "contrast"],
        ["うすい文字（muted）／パネル", muted, surface, 4.5, "contrast"],
        ["うすい文字（muted）／入力欄", muted, field, 4.5, "contrast"],
        ["選択中のボタン（onAccent）／アクセント", onAccent, opaque(colors.accent), 4.5, "contrast"],
        ["ちょっとした文字（accent-ink）／パネル", ink, surface, 4.5, "contrast"],
        ["エラー行（game.miss）／入力欄", miss, field, 3, "contrast"],
      ];
      for (const [name, fg, bg, need, kind] of rows) {
        if (!opaque(fg) || !opaque(bg)) { notes.push(`${where}：${name} は半透明なので測りませんでした`); continue; }
        const r = ratio(fg, bg);
        if (r >= need) good.push(`${name} ${fmt(r)}:1`);
        else { bad.push(`${name} ${fmt(r)}:1（${need}:1 以上に）`); kinds.add(kind); }
      }

      /* 4. 端末だけの見た目（任意・v2 で 5 つ追加） */
      const want = skin.cli && typeof skin.cli === "object" ? skin.cli : null;
      const got = D.sanitizeCliLook(skin.cli);
      if (want) {
        /* `bell:false` は「鳴らさない」という正しい書き方（名乗らないのと同じ扱い） */
        const dropped = Object.keys(want).filter(k => !(k === "bell" && want[k] === false) && (!got || !has(got, k)));
        if (dropped.length) {
          bad.push("cli の値が通りません：" + dropped.join("・") + "（font は書体名 120 字まで／prompt は 1〜4 文字／caret は #rgb・#rrggbb・currentColor／scan は 0〜0.6／cursor は block・underline・bar／opacity は 0.5〜1／history は 10〜200／completion は tab・off／bell は true）");
          kinds.add("cli");
        } else good.push("cli（端末だけの見た目）：" + Object.keys(got).join("・"));
        for (const key of ["font", "prompt"]) {
          if (typeof want[key] === "string" && PATHY.test(want[key])) { bad.push(`cli.${key} に道の文字（/ \\ \` ~ : .. C:）は使えません`); kinds.add("cli"); }
        }
        if (want.caret != null && !/^(currentColor|#[0-9a-f]{3}|#[0-9a-f]{6})$/i.test(String(want.caret))) { bad.push("cli.caret は #rgb／#rrggbb／currentColor だけです"); kinds.add("cli"); }
      } else notes.push(`${where}：cli はありません（色と書体だけでも着られます）`);
      if (skin.cat && !Array.isArray(skin.cat) && !Array.isArray(skin.cats)) { bad.push("cat は配列で書いてください（例：[\"wizard\"]）"); kinds.add("name"); }
    }
  }

  /* v2：理由は 1 語で（name → color → contrast → cli の順に重いほうを採る） */
  const order = ["name", "color", "contrast", "cli"];
  const reason = order.find(k => kinds.has(k)) || "ok";
  problems.push(...bad.map(b => `${where}：${b}`));
  report.push({ id, where, ok: bad.length === 0, reason, good, bad });
}

const ok = problems.length === 0;
if (wantJson) {
  const reasons = report.filter(r => !r.ok).map(r => r.reason);
  const reason = order_reason(reasons);
  console.log(JSON.stringify({ tool: TOOL, version: VERSION, ok, reason, problems, notes, skins: report }, null, 2));
} else {
  console.log(`⌨ CLI 用スキンの検査（${TOOL} v${VERSION}）— ${path.basename(file)}`);
  for (const r of report) {
    console.log(`\n[${r.ok ? "OK" : "NG"}] ${r.where}`);
    for (const g of r.good) console.log("  ✓ " + g);
    for (const b of r.bad) console.log("  ✗ " + b);
  }
  if (notes.length) { console.log("\nメモ："); for (const n of notes) console.log(" ・" + n); }
  console.log(ok ? "\n受け取れます（この値で本体の data.js に入れられます）" : `\n直すところ：${problems.length} 件`);
}
process.exit(ok ? 0 : 1);

function order_reason(reasons) {
  const order = ["name", "color", "contrast", "cli"];
  return order.find(k => reasons.includes(k)) || "ok";
}

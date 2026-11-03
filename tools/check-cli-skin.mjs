#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/* ⌨ CLI 用スキンの受け入れ検査（trk268 → trk269 v2 → trk270 v2.1 → trk271 v3）

   なぜ要るか：
   CLI（⌨ ターミナル）用のスキンは、倉庫（trk-Avatar-Library）側が値を決めて渡してくれます。
   「渡してから気づく」を減らすため、**アプリと同じ計算**（js/data.js の accentInk・luminance・
   buildCustomSkin・sanitizeCliLook）で、こちらが受け取る前に確かめられる道具です。

   使い方：
     node tools/check-cli-skin.mjs <目録> [--json] [--catalog]
       ── 渡せる形は 4 つ（trk271 で ④ を追加）──
       ① スキン 1 枚     { "id": "wizard-cli", "cat": ["wizard"], "colors": {...}, "cli": {...} }
       ② パックの目録    { "skin": { ...①... } }        （.stpack の pack.json）
       ③ 倉庫の目録      { "format": "trk-avatar-library-skins", "skins": [ ...①... ] }
       ④ 生成物の .js    `const SKINS_WIZARD = [ ...①... ]`（ESM の export も可）
       `--catalog` を付けると「目録まるごと」として扱います（③④ は自動でも目録と見なします）。
   終了コード：0＝受け取れる／1＝直すところがある／2＝読めない（JSON でない・形が違う）
     ⚠ 1 は「直すところがある」**全部**です（名前なし・色・コントラスト・cli）。
       どの種類かは `--json` の `reason`（name／color／contrast／cli）で分かります。

   モジュールとしても使えます（trk271・CI や他の道具から）：
     import { validateSkin, checkList, loadCatalog } from "./tools/check-cli-skin.mjs";
     const { ok, problems } = checkList(loadCatalog("catalog/skins.json").list, { fromCatalog: true });

   ⚠ 外へは取りに行きません。読むのは渡されたファイルだけです。
   ⚠ これは「決まりごと」ではありません。**助言の道具**です（こちらは値が違っても受け取れます）。 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { loadCatalogFile } from "./lib/skin-catalog.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOOL = "check-cli-skin";
const VERSION = 3;
const CLI_CATS = ["wizard", "cli", "console"];
const REASON_ORDER = ["name", "color", "contrast", "cli"];

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
const D = loadData();

const has = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
const catOf = skin => (Array.isArray(skin.cats) ? skin.cats : Array.isArray(skin.cat) ? skin.cat : []);
const isCli = skin => catOf(skin).some(c => CLI_CATS.includes(String(c).toLowerCase()));
/* 道の文字（スキンから受け取らない約束。CLI の入力と同じ関所） */
const PATHY = /[/\\`~:]|\.\.|^[A-Za-z]:/;

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

/* 目録を読む（JSON・1 枚・生成物の .js のどれでも）。読めなければ例外 */
export function loadCatalog(file) {
  const got = loadCatalogFile(path.resolve(file));
  if (got.error) throw new Error(got.error);
  return got;
}

/* 1 枚を調べる。返す形：{ id, ok, reason, good, bad, skip } */
export function validateSkin(skin, opts = {}) {
  const id = String(skin && (skin.id || skin.name) || "(id なし)");
  const where = id;
  const bad = [];
  const good = [];
  const kinds = new Set();

  /* 目録まるごとを渡されたときは、名乗らないスキンを飛ばす（雑音を消す） */
  if (opts.fromCatalog && !isCli(skin)) return { id, where, ok: true, skip: true, reason: "skip", good, bad, kinds };

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
        if (!opaque(fg) || !opaque(bg)) continue;   /* 半透明は測らない（メモに回す） */
        const r = ratio(fg, bg);
        if (r >= need) good.push(`${name} ${fmt(r)}:1`);
        else { bad.push(`${name} ${fmt(r)}:1（${need}:1 以上に）`); kinds.add(kind); }
      }

      /* 4. 端末だけの見た目（任意・5 つ） */
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
      }
      if (skin.cat && !Array.isArray(skin.cat) && !Array.isArray(skin.cats)) { bad.push("cat は配列で書いてください（例：[\"wizard\"]）"); kinds.add("name"); }
    }
  }

  /* 理由は 1 語で（name → color → contrast → cli の順に重いほうを採る） */
  const reason = REASON_ORDER.find(k => kinds.has(k)) || "ok";
  return { id, where, ok: bad.length === 0, skip: false, reason, good, bad, kinds };
}

/* trk271：`validateSkin` の結果から理由を 1 語に（CI から使いやすいように） */
export function reasonFromErrors(result) {
  const kinds = result && result.kinds instanceof Set ? result.kinds : null;
  if (kinds) return REASON_ORDER.find(k => kinds.has(k)) || "ok";
  const text = String((result && (result.error || result.message)) || "");
  if (/cat に wizard|id に道|cat は配列/.test(text)) return "name";
  if (/colors が足りません|組み立てられません/.test(text)) return "color";
  if (/:1（/.test(text)) return "contrast";
  if (/cli\./.test(text)) return "cli";
  return "ok";
}

/* 一覧をまとめて調べる */
export function checkList(list, opts = {}) {
  const problems = [];
  const notes = [];
  const skins = [];
  for (const skin of list) {
    const r = validateSkin(skin, opts);
    if (r.skip) { notes.push(`${r.where}：CLI を名乗っていないので飛ばしました（cat に wizard／cli／console が無い）`); continue; }
    /* 5. 外部への参照（オフライン前提なので知らせるだけ） */
    let external = false;
    try { external = /https?:\/\//.test(JSON.stringify(skin)); } catch (_) {}
    if (external) notes.push(`${r.where}：外部 URL（http/https）が入っています（オフライン前提なのでおすすめしません）`);
    if (!skin.cli || typeof skin.cli !== "object") notes.push(`${r.where}：cli はありません（色と書体だけでも着られます）`);
    problems.push(...r.bad.map(b => `${r.where}：${b}`));
    skins.push({ id: r.id, where: r.where, ok: r.ok, reason: r.reason, good: r.good, bad: r.bad });
  }
  const failed = skins.filter(s => !s.ok).map(s => s.reason);
  const reason = REASON_ORDER.find(k => failed.includes(k)) || "ok";
  return { ok: problems.length === 0, reason, problems, notes, skins };
}

/* 画面（人が読む形）と終了コード */
function main(argv) {
  const wantJson = argv.includes("--json");
  const forceCatalog = argv.includes("--catalog");
  const file = argv.find(a => !a.startsWith("--"));
  if (!file) {
    console.error("使い方：node tools/check-cli-skin.mjs <目録> [--json] [--catalog]");
    return 2;
  }
  let loaded;
  try { loaded = loadCatalog(file); }
  catch (e) { console.error(e.message); return 2; }
  const list = loaded.list.filter(Boolean);
  if (!list.length) { console.error("検査するスキンがありません"); return 2; }
  /* ①1 枚 ②パック は「1 枚だけ」を見る。③目録 ④.js と `--catalog` は「名乗るものだけ」を見る */
  const fromCatalog = forceCatalog || loaded.shape === "catalog" || loaded.shape === "js" || loaded.shape === "array";
  const res = checkList(list, { fromCatalog });

  if (wantJson) {
    console.log(JSON.stringify({ tool: TOOL, version: VERSION, shape: loaded.shape, ...res }, null, 2));
  } else {
    console.log(`⌨ CLI 用スキンの検査（${TOOL} v${VERSION}）— ${path.basename(file)}（${loaded.shape}）`);
    for (const r of res.skins) {
      console.log(`\n[${r.ok ? "OK" : "NG"}] ${r.where}`);
      for (const g of r.good) console.log("  ✓ " + g);
      for (const b of r.bad) console.log("  ✗ " + b);
    }
    if (res.notes.length) { console.log("\nメモ："); for (const n of res.notes) console.log(" ・" + n); }
    console.log(res.ok ? "\n受け取れます（この値で本体の data.js に入れられます）" : `\n直すところ：${res.problems.length} 件`);
  }
  return res.ok ? 0 : 1;
}

/* 直接実行したときだけ動く（import したときは副作用なし） */
const isMain = (() => {
  try { return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url); }
  catch (_) { return false; }
})();
if (isMain) process.exit(main(process.argv.slice(2)));

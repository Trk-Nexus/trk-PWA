#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/* 🧙 スキン目録の取り込み（trk269）

   なぜ要るか：
   Skin 側（trk-Avatar-Library）は自分の目録（`catalog/skins.json`）でスキンを増やします。
   本体（trk-PWA）のスキンは `js/data.js` の形（`ui` / `game` の CSS 変数）なので、そのままでは入りません。
   この道具は、目録の 1 枚を**本体の形に決まった手順で**写して、1 つの JS ファイルにします。
   ＝ 手で写さない（写し間違いが出ない）・同じ目録からは同じバイト列（`--check` で見張れる）。

   使い方：
     node tools/import-skin-catalog.mjs <目録.json> [--cat=wizard] [--cli-only] [--out=js/skins-wizard.js] [--check]
       --cat      このカテゴリを持つスキンだけ（既定は wizard）
       --cli-only `cli` を持つ（＝端末で着られる）スキンだけ
       --out      書き出す先（既定 js/skins-wizard.js）
       --check    書き出さずに、いまのファイルと同じかだけを見る（違えば終了コード 1）

   写し方（決まり）：
     ・colors → ui / game（`js/data.js` の buildCustomSkin と同じ割合。ただし目録が持っている
       muted / field / button / onAccent / border はそのまま使う）
     ・font の `\"` は `"` に戻す（目録によっては二重にエスケープされている）。通らない字は落とす
     ・cli は `js/data.js` の sanitizeCliLook と同じ規則で整える（本体と同じ判断）
     ・video は CSS のフィルタだけ通す（`url(` `;` `{` などは落とす）
     ・並びは id の辞書順（同じ目録なら同じバイト列）
   ⚠ 外へは取りに行きません。読むのは渡されたファイルだけです。 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOOL = "import-skin-catalog";
const VERSION = 1;

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith("--"));
const opt = (name, def) => {
  const hit = args.find(a => a.startsWith("--" + name + "="));
  return hit ? hit.slice(name.length + 3) : def;
};
const wantCat = opt("cat", "wizard");
const cliOnly = args.includes("--cli-only");
const outRel = opt("out", "js/skins-wizard.js");
const checkOnly = args.includes("--check");

if (!file) {
  console.error("使い方：node tools/import-skin-catalog.mjs <目録.json> [--cat=wizard] [--cli-only] [--out=...] [--check]");
  process.exit(2);
}

/* ---------- 本体の計算を借りる（data.js を画面なしで読む） ---------- */
function loadData() {
  const sandbox = {
    console, Math, JSON, Object, Array, String, Number, Date, Set, Map, Error, RegExp, Intl,
    parseInt, parseFloat, isNaN, isFinite,
    document: { documentElement: { style: { setProperty() {} } }, getElementById: () => null, createElement: () => ({ style: {}, append() {}, addEventListener() {} }) },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "js/data.js"), "utf8"), sandbox, { filename: "js/data.js" });
  return sandbox.window.Trk.data;
}
const D = loadData();

/* ---------- 目録を読む ---------- */
let catalog;
try { catalog = JSON.parse(fs.readFileSync(path.resolve(file), "utf8")); }
catch (e) { console.error("読めませんでした：" + (e && e.message)); process.exit(2); }
const list = Array.isArray(catalog) ? catalog : Array.isArray(catalog.skins) ? catalog.skins : null;
if (!list) { console.error("目録の形が違います（skins の配列がありません）"); process.exit(2); }

/* ---------- 安全な値だけ通す ---------- */
const ID_RE = /^[a-z][a-z0-9-]{1,31}$/;
const HEX_RE = /^#[0-9a-f]{6}$/i;
const RGBA_RE = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d{1,3})\s*)?\)$/i;
const FILTER_RE = /^[a-z-]+\([a-z0-9 .,%+-]*\)(?:\s+[a-z-]+\([a-z0-9 .,%+-]*\))*$/i;

const esc = s => String(s == null ? "" : s);
/* 目録の font は \"Courier New\" のように二重にエスケープされていることがある */
function cleanFont(raw) {
  if (typeof raw !== "string") return "";
  const un = raw.replace(/\\+"/g, '"').replace(/\s+/g, " ").trim();
  if (!un || un.length > 200) return "";
  if (!/^[A-Za-z0-9 _,"'-]+$/.test(un)) return "";
  return un;
}
function cleanColor(v, fallback) {
  if (typeof v !== "string") return fallback || "";
  const t = v.trim();
  if (HEX_RE.test(t) || RGBA_RE.test(t)) return t;
  return fallback || "";
}
function cleanFilter(v) {
  if (typeof v !== "string") return "";
  const t = v.trim();
  return FILTER_RE.test(t) && t.length <= 120 ? t : "";
}
/* コントラストの比（WCAG）。data.js の luminance を使う */
function ratio(fg, bg) {
  const a = D.luminance(fg), b = D.luminance(bg);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
/* 目録の色が基準に届かないとき、**いちばん近い合格点**まで寄せる（黒か白の近いほうへ少しずつ） */
function fitInk(fg, bgs, need) {
  const min = () => Math.min(...bgs.map(bg => ratio(fg, bg)));
  if (min() >= need) return { color: fg, moved: false };
  let best = fg, bestScore = min();
  for (const target of ["#000000", "#ffffff"]) {
    for (let i = 1; i <= 20; i++) {
      const c = D.mixHex(fg, target, i / 20);
      const score = Math.min(...bgs.map(bg => ratio(c, bg)));
      if (score > bestScore) { bestScore = score; best = c; }
      if (score >= need) return { color: c, moved: true };
    }
  }
  return { color: best, moved: true };
}
const pickLang = v => {
  if (!v || typeof v !== "object") return null;
  const out = {};
  for (const k of ["ja", "en", "zh", "ko"]) if (typeof v[k] === "string" && v[k]) out[k] = v[k].slice(0, 60);
  return Object.keys(out).length ? out : null;
};

/* ---------- 目録の 1 枚 → 本体の 1 枚 ---------- */
function convert(s) {
  const c = s.colors || {};
  const bg = cleanColor(c.bg), panel = cleanColor(c.panel), text = cleanColor(c.text), accent = cleanColor(c.accent), gold = cleanColor(c.gold);
  if (!bg || !panel || !text || !accent || !gold) return null;
  const dark = D.luminance(bg) < 0.35;
  const field = cleanColor(c.field, D.mixHex(bg, panel, 0.5));
  const button = cleanColor(c.button, D.mixHex(panel, text, 0.06));
  const buttonRaw = button;
  const bgList = [buttonRaw, D.mixHex(buttonRaw, text, 0.13), field, bg];
  /* 目録の muted が、ボタン・入力欄・地のどれかで 4.5:1 に届かないことがある（12 種のうち 3 種）。
     届かないときは**一番近い合格点**まで寄せてから使う（見た目はほとんど変わらない）。 */
  const mutedFit = fitInk(cleanColor(c.muted, D.mixHex(text, panel, 0.38)), bgList, 4.5);
  const muted = mutedFit.color;
  /* onAccent も同じ。目録の値が合格ならそれを使い、だめなら黒か白の合うほうへ */
  const catalogOn = cleanColor(c.onAccent, D.luminance(accent) > 0.179 ? "#000000" : "#ffffff");
  const onAccent = ratio(catalogOn, accent) >= 4.5 ? catalogOn
    : (ratio("#000000", accent) >= ratio("#ffffff", accent) ? "#000000" : "#ffffff");
  const ink = cleanColor(c.ink, text);
  const ui = {
    "--ui-bg": bg,
    "--ui-panel": D.hexToRgba(panel, 0.96),
    "--ui-soft": D.hexToRgba(text, 0.05),
    "--ui-text": text,
    "--ui-muted": muted,
    "--ui-border": cleanColor(c.border, D.hexToRgba(text, 0.18)),
    "--ui-button": button,
    "--ui-button-hover": D.mixHex(button, text, 0.13),
    "--ui-field": field,
    "--ui-accent": accent,
    "--ui-on-accent": onAccent,
    "--ui-gold": gold,
    "--ui-shadow": dark ? "0 24px 80px rgba(0,0,0,.55)" : "0 24px 70px rgba(30,40,60,.16)",
    "--ui-glow": D.hexToRgba(accent, 0.14),
  };
  const game = {
    don: cleanColor(c.don, accent),
    ka: cleanColor(c.ka, gold),
    stage: cleanColor(c.stage, bg),
    lane: D.hexToRgba(panel, dark ? 0.6 : 0.82),
    track: D.hexToRgba(text, 0.24),
    ink,
    inkShadow: dark ? "rgba(0,0,0,.85)" : "rgba(255,255,255,.9)",
    noteBorder: "#ffffff",
    panel: D.hexToRgba(panel, 0.95),
    perfect: gold,
    good: ink,
    miss: D.mixHex(text, bg, 0.45),
    glow: !!s.glow,
  };
  const skin = {
    cat: D.sanitizeSkinCats(s.cat),
    label: pickLang(s.label) || { en: s.id },
    desc: pickLang(s.desc) || { en: "" },
  };
  const font = cleanFont(s.font);
  if (font) skin.font = font;
  if (s.type && typeof s.type === "object") {
    const t = {};
    const tf = cleanFont(s.type.title);
    if (tf) t.title = tf;
    for (const k of ["weight", "lh", "titleWeight", "titleSpace", "titleTransform"]) {
      if (typeof s.type[k] === "string" && /^[a-z0-9.%+-]{1,20}$/i.test(s.type[k])) t[k] = s.type[k];
    }
    if (typeof s.type.mark === "string" && s.type.mark.length <= 40) t.mark = s.type.mark;
    if (Object.keys(t).length) skin.type = t;
  }
  skin.ui = ui;
  skin.game = game;
  skin.shapes = Array.isArray(s.shapes) && s.shapes.length === 2 && s.shapes.every(v => typeof v === "string" && /^[a-z]{3,12}$/.test(v))
    ? s.shapes.slice() : ["circle", "circle"];
  const video = cleanFilter(s.video);
  if (video) skin.video = video;
  if (s.locked === true) skin.locked = true;
  const cli = D.sanitizeCliLook(s.cli);
  if (cli) skin.cli = cli;
  return { id: s.id, skin };
}

/* ---------- 選ぶ ---------- */
const chosen = [];
const skipped = [];
for (const s of list) {
  if (!s || typeof s.id !== "string") continue;
  const cats = D.sanitizeSkinCats(s.cat);
  if (wantCat && !cats.includes(wantCat)) continue;
  if (!ID_RE.test(s.id)) { skipped.push(s.id + "（id の形）"); continue; }
  if (cliOnly && !(s.cli && typeof s.cli === "object")) { skipped.push(s.id + "（cli なし）"); continue; }
  const conv = convert({ ...s, cat: cats });
  if (!conv) { skipped.push(s.id + "（色が足りない）"); continue; }
  chosen.push(conv);
}
chosen.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

if (!chosen.length) { console.error("取り込むスキンがありません"); process.exit(2); }

/* ---------- 書き出す（同じ目録なら同じバイト列） ---------- */
const q = v => JSON.stringify(v);
const lines = [];
lines.push("// SPDX-License-Identifier: GPL-3.0-or-later");
lines.push("/* 🧙 ウィザードのスキン（trk269・Skin 側の目録から生成）");
lines.push("");
lines.push("   出どころ：trk-Avatar-Library の `catalog/skins.json`（" + wantCat + " カテゴリ" + (cliOnly ? "・cli あり" : "") + "）");
lines.push("   作り方：node tools/import-skin-catalog.mjs <目録.json> --cat=" + wantCat + (cliOnly ? " --cli-only" : "") + " --out=" + outRel);
lines.push("   ・手で直さないでください（次の取り込みで消えます）。直すときは目録側（Skin 側）で。");
lines.push("   ・このファイルは data.js の後・core.js の前に読みます（起動時のスキン復元より先に要るため）。");
lines.push("   ============================================================================ */");
lines.push('"use strict";');
lines.push("(() => {");
lines.push("  const S = window.Trk && window.Trk.data && window.Trk.data.SKINS;");
lines.push("  if (!S) return;   /* data.js が無い（別の読み込み方）ときは何もしない */");
for (const { id, skin } of chosen) {
  lines.push("  S[" + q(id) + "] = {");
  lines.push("    cat:" + q(skin.cat) + ",");
  if (skin.font) lines.push("    font:" + q(skin.font) + ",");
  if (skin.type) lines.push("    type:" + q(skin.type) + ",");
  lines.push("    label:" + q(skin.label) + ",");
  lines.push("    desc:" + q(skin.desc) + ",");
  lines.push("    ui:" + q(skin.ui) + ",");
  lines.push("    game:" + q(skin.game) + ",");
  lines.push("    shapes:" + q(skin.shapes) + ",");
  if (skin.video) lines.push("    video:" + q(skin.video) + ",");
  if (skin.cli) lines.push("    cli:" + q(skin.cli) + ",");
  if (skin.locked) lines.push("    locked:true,");
  /* 最後の 1 つは末尾のカンマを外す（読みやすさのためだけ） */
  const last = lines[lines.length - 1];
  lines[lines.length - 1] = last.replace(/,$/, "");
  lines.push("  };");
}
lines.push("})();");
const body = lines.join("\n") + "\n";

const outPath = path.resolve(ROOT, outRel);
if (checkOnly) {
  const now = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";
  if (now !== body) {
    console.error(`✗ ${outRel} が目録と違います（node tools/import-skin-catalog.mjs ${file} --cat=${wantCat}${cliOnly ? " --cli-only" : ""} で作り直してください）`);
    process.exit(1);
  }
  console.log(`✓ ${outRel} は目録どおり（${chosen.length} 種）`);
  process.exit(0);
}
fs.writeFileSync(outPath, body);
console.log(`✓ ${outRel} に ${chosen.length} 種を書きました（${chosen.map(c => c.id).join(", ")}）`);
if (skipped.length) console.log(`  飛ばした：${skipped.length} 件（${skipped.slice(0, 5).join(" / ")}${skipped.length > 5 ? " …" : ""}）`);

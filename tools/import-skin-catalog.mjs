#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/* 🧙 スキン目録の取り込み（trk269 → trk274 v4）

   なぜ要るか：
   Skin 側（trk-Avatar-Library）は自分の目録（`catalog/skins.json`）でスキンを増やします。
   本体（trk-PWA）のスキンは `js/data.js` の形（`ui` / `game` の CSS 変数）なので、そのままでは入りません。
   この道具は、目録の 1 枚を**本体の形に決まった手順で**写して、1 つの JS ファイルにします。
   ＝ 手で写さない（写し間違いが出ない）・同じ目録からは同じバイト列（`--check` で見張れる）。

   使い方：
     node tools/import-skin-catalog.mjs <目録> [--cat=wizard] [--exclude-cat=wizard] [--only-new] [--cli-only]
                                        [--out=js/skins-wizard.js] [--volumes=<volumes.json>] [--kind=wizard|volumes]
                                        [--check]
       <目録> は 3 つの形のどれでも（trk271）：
         ① catalog/skins.json（{ "skins": [...] }）
         ② スキン 1 枚の JSON
         ③ ジェネレーターの出力（.js・`const SKINS_WIZARD = [...]`／ESM の export も可）
       --cat      このカテゴリを持つスキンだけ（既定は wizard・`--cat=` で絞らない）
       --exclude-cat このカテゴリを持つスキンを除く（trk274：Wizard を別ファイルにするとき）
       --only-new 本体が既に持っている ID（`js/data.js`・`js/characters/*.js`・`js/skins-wizard.js`）は書かない
                  （trk274：目録 291 種のうち 214 種が新顔。既にある 77 種を上書きしないため）
       --cli-only `cli` を持つ（＝端末で着られる）スキンだけ
       --volumes  trk-Avatar-Library の `skin-volumes/volumes.json`。渡すと**巻の目録**（`SKIN_VOLUMES`）も書く
       --kind     書き出すファイルの見出し（`wizard`＝既定／`volumes`＝巻別）。中身の作り方は同じ
       --out      書き出す先（既定 js/skins-wizard.js）
       --check    書き出さずに、いまのファイルと同じかだけを見る（違えば終了コード 1）

   写し方（決まり）：
     ・colors → ui / game（`js/data.js` の buildCustomSkin と同じ割合。ただし目録が持っている
       muted / field / button / onAccent / border はそのまま使う）
     ・それでも 4.5:1／3:1 に届かない色は、**いちばん近い合格点**まで寄せる（trk270）：
       文字（text）→ パネル・入力欄・ボタンに対して 4.5:1／エラー色（miss）→ 入力欄に対して 3:1。
       寄せたときは、どの色をどれだけ動かしたかを画面に出す
     ・font の `\"` は `"` に戻す（目録によっては二重にエスケープされている）。通らない字は落とす
     ・cli は `js/data.js` の sanitizeCliLook と同じ規則で整える（本体と同じ判断）
     ・video は CSS のフィルタだけ通す（`url(` `;` `{` などは落とす）
     ・並びは id の辞書順（同じ目録なら同じバイト列）
     ・trk274：地（bg）と舞台（stage）の **`linear-gradient(…deg,#a,#b…)` をそのまま受ける**。
       コントラストは**全部の停止点**で満たすように寄せる（1 色に潰さない）
     ・trk274：id の形はアプリ側（`SKIN_ID_RE`）に合わせる＝`A-Za-z0-9_.-` の 1〜48 文字。camelCase も通る
   ⚠ 外へは取りに行きません。読むのは渡されたファイルだけです。 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadCatalogFile } from "./lib/skin-catalog.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOOL = "import-skin-catalog";
const VERSION = 4;

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith("--"));
const opt = (name, def) => {
  const hit = args.find(a => a.startsWith("--" + name + "="));
  return hit ? hit.slice(name.length + 3) : def;
};
const wantCat = opt("cat", "wizard");
const excludeCat = opt("exclude-cat", "");
const volumesRel = opt("volumes", "");
const onlyNew = args.includes("--only-new");
const kind = opt("kind", "wizard");
const cliOnly = args.includes("--cli-only");
const outRel = opt("out", "js/skins-wizard.js");
const checkOnly = args.includes("--check");

if (!file || !["wizard", "volumes"].includes(kind)) {
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

/* ---------- 目録を読む（JSON・1 枚・生成物の .js のどれでも） ---------- */
const loaded = loadCatalogFile(path.resolve(file));
if (loaded.error) { console.error(loaded.error); process.exit(2); }
const list = loaded.list;

/* ---------- 安全な値だけ通す ---------- */
/* trk274：アプリの `SKIN_ID_RE`（core.js）と同じ形まで広げた。
   目録には `lanternAlley` のような camelCase が 37 種あり、前の規則では**読めないまま黙って落ちていた**。
   道の文字（/ \ ` ~ :）と `..` は、ここでも通さない。 */
const ID_RE = /^[A-Za-z][A-Za-z0-9_.-]{1,47}$/;
const PATHY_RE = /[/\\`~]|\.\./;
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
/* trk274：`linear-gradient(180deg,#a,#b)` を「角度＋停止点の色」に読む。
   受けるのは**色と角度だけ**（`url(`・`var(`・`;`・`{` などは 1 文字でも混ざれば断る）。
   3 色以上のグラデーションもあるので、停止点は 2〜6 個まで。 */
const GRAD_HEAD_RE = /^linear-gradient\(\s*(-?\d{1,3})deg\s*,/i;
const GRAD_BODY_RE = /^linear-gradient\([0-9a-z#(),.% -]+\)$/i;
const COLOR_TOKEN_RE = /#[0-9a-f]{6}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d{1,3})\s*)?\)/gi;
function parseGradient(v) {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (t.length > 300 || !GRAD_BODY_RE.test(t)) return null;
  const head = GRAD_HEAD_RE.exec(t);
  if (!head) return null;
  const colors = [...t.matchAll(COLOR_TOKEN_RE)].map(m => m[0]);
  if (colors.length < 2 || colors.length > 6) return null;
  /* 色の字だけを取り除いて、残りが角度と区切りだけか確かめる（余計な関数を混ぜさせない） */
  const rest = t.replace(COLOR_TOKEN_RE, "#").replace(/^linear-gradient\(/i, "").replace(/\)$/, "");
  if (!/^\s*-?\d{1,3}deg\s*(,\s*#\s*)+$/i.test(rest)) return null;
  return { angle: Number(head[1]), colors };
}
const gradientCss = g => `linear-gradient(${g.angle}deg,${g.colors.join(",")})`;
/* グラデーションの全部の停止点を、文字から遠ざけて合格点まで動かす */
function fitGradient(g, fg, need) {
  const colors = g.colors.slice();
  let moved = false;
  for (let i = 0; i < colors.length; i++) {
    const fit = fitAway(colors[i], fg, need);
    if (fit.color !== colors[i]) { colors[i] = fit.color; moved = true; }
  }
  return { gradient: { angle: g.angle, colors }, moved };
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
/* 文字を、その向きの端（白／黒）へ**必要なぶんだけ**寄せる（trk274） */
function pushInk(fg, bgs, need, end) {
  const ok = v => Math.min(...bgs.map(bg => ratio(v, bg))) >= need - 1e-9;
  if (ok(fg)) return fg;
  for (let i = 1; i <= 20; i++) {
    const v = D.mixHex(fg, end, i / 20);
    if (ok(v)) return v;
  }
  return end;
}
/* 面（パネル・地など）を、文字から遠ざける向きの端へ**必要なぶんだけ**寄せる（trk274） */
function pushBg(bg, fg, need, end) {
  if (ratio(fg, bg) >= need - 1e-9) return bg;
  for (let i = 1; i <= 20; i++) {
    const v = D.mixHex(bg, end, i / 20);
    if (ratio(fg, v) >= need - 1e-9) return v;
  }
  return end;
}
/* 背景（ボタンなど）を**文字から遠ざけて**合格点まで動かす（trk270）。
   文字の色は目録のまま残したいので、直すのは背景のほう。 */
function fitAway(bg, fg, need, limit = 20) {
  if (ratio(fg, bg) >= need) return { color: bg, moved: false };
  const target = D.luminance(fg) > D.luminance(bg) ? "#000000" : "#ffffff";
  for (let i = 1; i <= limit; i++) {
    const c = D.mixHex(bg, target, i / limit);
    if (ratio(fg, c) >= need) return { color: c, moved: true };
  }
  return { color: target, moved: true };
}
/* trk274：色の隔たり（0〜441）。「どちらを動かすと元の色に近いまま済むか」を測るのに使う */
function hexRgb(v) {
  const m = /^#([0-9a-f]{6})$/i.exec(v || "");
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function colorGap(a, b) {
  const x = hexRgb(a), y = hexRgb(b);
  if (!x || !y) return 0;   /* rgba() などは数えない（寄せの対象はほぼ hex） */
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}
/* trk275：色の隔たりを OKLab で測る（レビュー Q2）。
   レビューで「面の色差が 0.15 を超えたら差し戻す」と提案されたので、同じ物差しを持つ。
   `rgba(r,g,b,a)` は**不透明として**rgbだけ見る（面の色味の変化を見たいので、これで足りる）。 */
function hexOf(v) {
  const h = /#([0-9a-f]{6})/i.exec(v || "");
  if (h) return h[1].toLowerCase();
  const m = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i.exec(v || "");
  if (!m) return "";
  return [m[1], m[2], m[3]].map(n => Math.max(0, Math.min(255, +n)).toString(16).padStart(2, "0")).join("");
}
function toOklab(hex) {
  const n = parseInt(hex, 16);
  if (!hex || !Number.isFinite(n)) return null;
  const lin = c => (c /= 255, c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const r = lin((n >> 16) & 255), g = lin((n >> 8) & 255), b = lin(n & 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s2 = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787745 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s2,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s2,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s2];
}
function dEok(a, b) {
  const x = toOklab(hexOf(a)), y = toOklab(hexOf(b));
  if (!x || !y) return 0;
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}
/* 面の色差の上限（レビュー Q2 の 0.15）。これを超える寄せは「別のテーマ」なので差し戻す */
const SURFACE_LIMIT = 0.15;
/* うすい文字が本文と同化したら、**本文から遠ざける**向きに少しだけ置き直す（レビュー Q2）。
   本文が白へ寄った（暗いテーマ）なら、うすい文字は少し暗く。本文が黒へ寄った（明るいテーマ）なら、
   うすい文字は少し明るく。置き直したあとも、面の上で 4.5:1 を満たすことを確かめます。 */
function separateMuted(muted, ink, bgs, oppositeEnd) {
  if (dEok(muted, ink) >= 0.03) return muted;
  /* **読めること優先**：4.5:1 を保てる範囲で、いちばん小さい一歩から試す */
  const pass = v => dEok(v, ink) >= 0.03 && Math.min(...bgs.map(bg => ratio(v, bg))) >= 4.5 - 1e-9;
  for (const amt of [0.06, 0.09, 0.13, 0.18, 0.25]) {
    const v = D.mixHex(ink, oppositeEnd, amt);
    if (pass(v)) return v;
  }
  return muted;   /* 離すと読めなくなるなら、**同じ色のまま**（読めるほうを採る） */
}

/* 地（bg）とうすい文字（muted）は、**両方**が合格する組み合わせを探す（trk270・trk274）。
   順番は 2 通り試して、**元の色からの隔たりが小さいほう**を採る。
   ・先に muted（明るい地のテーマ向け：地を白へ飛ばさない）
   ・先に地（暗い地のテーマ向け：muted を黒や白へ飛ばさない。wizard-hermetic がこれ） */
function fitMutedAndBg(muted0, stops0, others, need, order) {
  let muted = muted0;
  const stops = stops0.slice();
  let bgMoved = false;
  for (let pass = 0; pass < 2; pass++) {
    if (order === "bg") {
      for (let i = 0; i < stops.length; i++) {
        const f = fitAway(stops[i], muted, need);
        if (f.color !== stops[i]) { stops[i] = f.color; bgMoved = true; }
      }
      muted = fitInk(muted, [...others, ...stops], need).color;
    } else {
      muted = fitInk(muted, [...others, ...stops], need).color;
      for (let i = 0; i < stops.length; i++) {
        const f = fitAway(stops[i], muted, need);
        if (f.color !== stops[i]) { stops[i] = f.color; bgMoved = true; }
      }
    }
  }
  const gap = colorGap(muted0, muted) + stops.reduce((sum, c, i) => sum + colorGap(stops0[i], c), 0);
  const ok = [...others, ...stops].every(bg => ratio(muted, bg) >= need - 1e-9);
  return { muted, stops, bgMoved, gap, ok };
}
const pickLang = v => {
  if (!v || typeof v !== "object") return null;
  const out = {};
  for (const k of ["ja", "en", "zh", "ko"]) if (typeof v[k] === "string" && v[k]) out[k] = v[k].slice(0, 60);
  return Object.keys(out).length ? out : null;
};

/* ---------- 目録の 1 枚 → 本体の 1 枚 ---------- */
/* trk275：色以外（書体・型・形・動画・cli・locked）は、寄せても差し戻しても同じ。
   convert と convertRaw の両方から使います。 */
function applyExtras(skin, s) {
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
  skin.shapes = Array.isArray(s.shapes) && s.shapes.length === 2 && s.shapes.every(v => typeof v === "string" && /^[a-z]{3,12}$/.test(v))
    ? s.shapes.slice() : ["circle", "circle"];
  const video = cleanFilter(s.video);
  if (video) skin.video = video;
  if (s.locked === true) skin.locked = true;
  const cli = D.sanitizeCliLook(s.cli);
  if (cli) skin.cli = cli;
}
function convert(s) {
  const c = s.colors || {};
  /* trk274：地は**グラデーションのまま**受ける（1 色に潰すと目表と見た目が変わる） */
  const bgGrad = parseGradient(c.bg);
  const bg = bgGrad ? bgGrad.colors[0] : cleanColor(c.bg);
  const panel0 = cleanColor(c.panel), text0 = cleanColor(c.text), accent = cleanColor(c.accent), gold = cleanColor(c.gold);
  if (!bg || !panel0 || !text0 || !accent || !gold) return null;
  const field0 = cleanColor(c.field, D.mixHex(bg, panel0, 0.5));
  const button0 = cleanColor(c.button, D.mixHex(panel0, text0, 0.06));
  const bgStops0 = bgGrad ? bgGrad.colors.slice() : [bg];
  const muted0 = cleanColor(c.muted, D.mixHex(text0, panel0, 0.38));

  /* ---------- 向き（明るい文字か、暗い文字か）を決める（trk274） ----------
     これまでは「文字を寄せ、届かなければ地を寄せる」を場当たりに繰り返していたため、
     暗い地＋暗い文字のテーマ（copperHour など）で**地が黒・文字も黒**に寄る組み合わせが作れました。
     ここでは目録の文字が白側か黒側かで向きを決め、**文字はその向きのまま**、
     届かないぶんは**面（パネル・入力欄・ボタン・地・舞台）を反対側へ**動かします＝
     デザインの明暗（夜のテーマは夜のまま）を保ちます。 */
  const lightInk = D.luminance(text0) >= 0.18;
  const inkEnd = lightInk ? "#ffffff" : "#000000";   /* 文字を寄せる先 */
  const surfEnd = lightInk ? "#000000" : "#ffffff";  /* 面を寄せる先（文字から遠ざける） */

  let inkText = text0;
  let panel = panel0, field = field0, button = button0;
  let bgStops = bgStops0.slice();
  const textMoved = [];
  for (let pass = 0; pass < 2; pass++) {
    const wasInk = inkText;
    /* 文字はまず**読む面（パネル・入力欄）**で届かせる。ボタン・地は背景なので、あとで動かす */
    inkText = pushInk(inkText, [panel, field], 4.5, inkEnd);
    if (inkText !== wasInk && !textMoved.length) textMoved.push(text0 + " → " + inkText);
    panel = pushBg(panel, inkText, 4.5, surfEnd);
    field = pushBg(field, inkText, 4.5, surfEnd);
    button = pushBg(button, inkText, 4.5, surfEnd);
    bgStops = bgStops.map(stop => pushBg(stop, inkText, 4.5, surfEnd));
  }
  /* 仕上げ：ボタン・地が端まで行っても届かないときだけ、文字をもう一度寄せる */
  {
    const wasInk = inkText;
    inkText = pushInk(inkText, [panel, field, button, ...bgStops], 4.5, inkEnd);
    if (inkText !== wasInk) {
      if (!textMoved.length) textMoved.push(text0 + " → " + inkText);
      panel = pushBg(panel, inkText, 4.5, surfEnd);
      field = pushBg(field, inkText, 4.5, surfEnd);
      button = pushBg(button, inkText, 4.5, surfEnd);
      bgStops = bgStops.map(stop => pushBg(stop, inkText, 4.5, surfEnd));
    }
  }
  const buttonFace = button;
  /* ホバーは「少し明るく」だが、届かなくなるときは混ぜる量を減らす */
  let hover = D.mixHex(buttonFace, inkText, 0.13);
  for (const amt of [0.13, 0.1, 0.07, 0.04, 0.02, 0]) {
    const cand = D.mixHex(buttonFace, inkText, amt);
    hover = cand;
    if (ratio(inkText, cand) >= 4.5) break;
  }
  /* うすい文字も、本文と同じ向きのまま合格点まで（目録の値が合格ならそのまま） */
  const mutedFit = pushInk(muted0, [buttonFace, hover, field, ...bgStops, panel], 4.5, inkEnd);
  /* trk275：寄せた結果、うすい文字が**本文と同じ色**になると階層が消える（レビュー Q2 の 38 種）。
     そのときは中間に置き直す（本文と面のあいだ）。 */
  const oppositeEnd = inkEnd === "#ffffff" ? "#000000" : "#ffffff";
  const muted = separateMuted(mutedFit, inkText, [buttonFace, hover, field, ...bgStops, panel], oppositeEnd);
  const bgMoved = bgStops.some((stop, i) => stop !== bgStops0[i]);
  const bgCss = bgGrad ? gradientCss({ angle: bgGrad.angle, colors: bgStops }) : bgStops[0];
  const dark = bgStops.reduce((sum, h) => sum + D.luminance(h), 0) / bgStops.length < 0.35;
  /* onAccent も同じ。目録の値が合格ならそれを使い、だめなら黒か白の合うほうへ */
  const catalogOn = cleanColor(c.onAccent, D.luminance(accent) > 0.179 ? "#000000" : "#ffffff");
  const onAccent = ratio(catalogOn, accent) >= 4.5 ? catalogOn
    : (ratio("#000000", accent) >= ratio("#ffffff", accent) ? "#000000" : "#ffffff");
  const makeUi = () => ({
    "--ui-bg": bgCss,
    "--ui-panel": D.hexToRgba(panel, 0.96),
    "--ui-soft": D.hexToRgba(inkText, 0.05),
    "--ui-text": inkText,
    "--ui-muted": muted,
    "--ui-border": cleanColor(c.border, D.hexToRgba(inkText, 0.18)),
    "--ui-button": buttonFace,
    "--ui-button-hover": hover,
    "--ui-field": field,
    "--ui-accent": accent,
    "--ui-on-accent": onAccent,
    "--ui-gold": gold,
    "--ui-shadow": dark ? "0 24px 80px rgba(0,0,0,.55)" : "0 24px 70px rgba(30,40,60,.16)",
    "--ui-glow": D.hexToRgba(accent, 0.14),
  });
  let ui = makeUi();
  /* 小さなアクセント文字（`--ui-accent-ink`）は data.js が決めます。パネルが中間色だと
     黒も白も 4.5:1 に届かず、そこだけ読みにくいテーマができます（amber など）。
     アプリと同じ関数で測り、届かないときは**パネルを反対側へ**少しずつ寄せます。 */
  if (typeof D.accentInk === "function" && typeof D.accentInkBackground === "function") {
    /* accentInkBackground は [r,g,b,a] の配列を返します（文字列ではありません） */
    const rgbHex = v => Array.isArray(v)
      ? "#" + v.slice(0, 3).map(n => Math.round(n).toString(16).padStart(2, "0")).join("")
      : D.toHex(v);
    const inkOk = u => {
      const back = D.accentInkBackground(u);
      if (!back) return true;
      return ratio(D.toHex(D.accentInk(u)), rgbHex(back)) >= 4.5;
    };
    for (let i = 0; i < 20 && !inkOk(ui); i++) {
      panel = D.mixHex(panel, surfEnd, 0.05);
      ui = makeUi();
    }
  }
  const missFit = fitInk(D.mixHex(inkText, bg, 0.45), [field], 3);
  /* trk274：舞台（stage）も受ける。**1 色でもグラデーションでも**、文字（ink）が
     全部の停止点で 4.5:1 に届くまで、文字から遠ざける（trk274 で 1 色のstageも寄せるようにした） */
  const stageGrad = parseGradient(c.stage);
  let ink = cleanColor(c.ink, inkText);
  /* 目録の ink が舞台と**ほぼ同じ明るさ**（黒地に黒など）のときは、データの側が壊れている。
     舞台を灰色に塗り替えるより、**文字を反対の端へ**（黒→白）動かすほうがテーマの意図に近い。 */
  {
    const rawStops = stageGrad ? stageGrad.colors : (cleanColor(c.stage) ? [cleanColor(c.stage)] : []);
    if (rawStops.length && Math.min(...rawStops.map(stop => ratio(ink, stop))) < 1.6) {
      ink = D.luminance(ink) >= 0.18 ? "#000000" : "#ffffff";
    }
  }
  /* 舞台は**ゲーム画面の文字（ink）**から遠ざける（UI の文字とは別のことがある） */
  const stageEnd = D.luminance(ink) >= 0.18 ? "#000000" : "#ffffff";
  let stage = bgCss;
  let stageMoved = false;
  if (stageGrad) {
    const stops = stageGrad.colors.map(stop => pushBg(stop, ink, 4.5, stageEnd));
    stageMoved = stops.some((stop, i) => stop !== stageGrad.colors[i]);
    stage = gradientCss({ angle: stageGrad.angle, colors: stops });
  } else if (cleanColor(c.stage)) {
    const raw = cleanColor(c.stage);
    stage = pushBg(raw, ink, 4.5, stageEnd);
    stageMoved = stage !== raw;
  }
  /* trk275：**面を寄せすぎていないか**を測る（レビュー Q2）。
     地・パネル・入力欄の色差（OKLab）が 0.15 を超えるなら、寄せると別のテーマになる。
     そのときは**目録の色のまま**内蔵し、既定の棚から外して「差し戻し」にする。 */
  const surfaceDelta = (() => {
    const bgPairs = bgGrad
      ? bgStops.map((stop, i) => dEok(bgStops0[Math.min(i, bgStops0.length - 1)], stop))
      : [dEok(bgStops0[0], bgStops[0])];
    return Math.max(
      Math.max(...bgPairs),
      dEok(panel0, panel),
      dEok(field0, field),
    );
  })();
  if (surfaceDelta > SURFACE_LIMIT) {
    const raw = convertRaw(s);
    if (raw) {
      raw.holdback = true;
      raw.holdbackReason = "面の色差 " + surfaceDelta.toFixed(2) + "（上限 " + SURFACE_LIMIT + "）";
      raw.moved = [raw.holdbackReason + " → 目録の色のまま・既定の棚から外す"];
      return raw;
    }
  }
  const game = {
    don: cleanColor(c.don, accent),
    ka: cleanColor(c.ka, gold),
    stage,
    lane: D.hexToRgba(panel, dark ? 0.6 : 0.82),
    track: D.hexToRgba(inkText, 0.24),
    ink,
    inkShadow: dark ? "rgba(0,0,0,.85)" : "rgba(255,255,255,.9)",
    noteBorder: "#ffffff",
    panel: D.hexToRgba(panel, 0.95),
    perfect: gold,
    good: ink,
    /* エラー色は入力欄の上で 3:1 に届かせる（trk270）。届いていれば目録どおりの割合のまま */
    miss: missFit.color,
    glow: !!s.glow,
  };
  const skin = {
    cat: D.sanitizeSkinCats(s.cat),
    label: pickLang(s.label) || { en: s.id },
    desc: pickLang(s.desc) || { en: "" },
  };
  applyExtras(skin, s);
  skin.ui = ui;
  skin.game = game;
  const moved = [];
  if (textMoved.length) moved.push("文字 " + textMoved[0]);
  if (panel !== panel0) moved.push("パネル " + panel0 + " → " + panel);
  if (field !== field0) moved.push("入力欄 " + field0 + " → " + field);
  if (buttonFace !== button0) moved.push("ボタン " + button0 + " → " + buttonFace);
  if (bgMoved) moved.push(bgGrad ? "地（グラデーション）を合格点まで寄せた → " + bgCss : "地 " + bg + " → " + bgStops[0]);
  if (stageMoved) moved.push("舞台を合格点まで寄せた → " + stage);
  if (muted !== muted0) moved.push("うすい文字 " + cleanColor(c.muted, "(なし)") + " → " + muted);
  if (missFit.moved) moved.push("エラー色 → " + missFit.color);
  return { id: s.id, skin, moved, mutedFixed: muted !== mutedFit };
}

/* ---------- 差し戻し（holdback）：目録の色のまま内蔵する ---------- */
/* trk275（レビュー Q2）：寄せ幅が上限を超える 1 枚は、**色を 1 つも動かさず**内蔵します。
   そのかわり既定の棚から外し（`ALL` と その巻では見える）、道具は「差し戻し」として
   毎回一覧に出します（黙って通しません）。直すのは目録側の仕事、という線引きです。 */
function convertRaw(s) {
  const c = s.colors || {};
  const bgGrad = parseGradient(c.bg);
  const bg = bgGrad ? bgGrad.colors[0] : cleanColor(c.bg);
  const panel = cleanColor(c.panel), text = cleanColor(c.text), accent = cleanColor(c.accent), gold = cleanColor(c.gold);
  if (!bg || !panel || !text || !accent || !gold) return null;
  const field = cleanColor(c.field, D.mixHex(bg, panel, 0.5));
  const button = cleanColor(c.button, D.mixHex(panel, text, 0.06));
  const muted = cleanColor(c.muted, D.mixHex(text, panel, 0.38));
  const bgCss = bgGrad ? gradientCss(bgGrad) : bg;
  const stops = bgGrad ? bgGrad.colors : [bg];
  const dark = stops.reduce((sum, h) => sum + D.luminance(h), 0) / stops.length < 0.35;
  const ink = cleanColor(c.ink, text);
  const stageGrad = parseGradient(c.stage);
  const stage = stageGrad ? gradientCss(stageGrad) : cleanColor(c.stage, bgCss);
  const skin = {
    cat: D.sanitizeSkinCats(s.cat),
    label: pickLang(s.label) || { en: s.id },
    desc: pickLang(s.desc) || { en: "" },
    holdback: true,
  };
  applyExtras(skin, s);
  skin.ui = {
    "--ui-bg": bgCss,
    "--ui-panel": D.hexToRgba(panel, 0.96),
    "--ui-soft": D.hexToRgba(text, 0.05),
    "--ui-text": text,
    "--ui-muted": muted,
    "--ui-border": cleanColor(c.border, D.hexToRgba(text, 0.18)),
    "--ui-button": button,
    "--ui-button-hover": D.mixHex(button, text, 0.13),
    "--ui-field": field,
    "--ui-accent": accent,
    "--ui-on-accent": cleanColor(c.onAccent, D.luminance(accent) > 0.179 ? "#000000" : "#ffffff"),
    "--ui-gold": gold,
    "--ui-shadow": dark ? "0 24px 80px rgba(0,0,0,.55)" : "0 24px 70px rgba(30,40,60,.16)",
    "--ui-glow": D.hexToRgba(accent, 0.14),
  };
  skin.game = {
    don: cleanColor(c.don, accent),
    ka: cleanColor(c.ka, gold),
    stage,
    lane: D.hexToRgba(panel, dark ? 0.6 : 0.82),
    track: D.hexToRgba(text, 0.24),
    ink,
    inkShadow: dark ? "rgba(0,0,0,.85)" : "rgba(255,255,255,.9)",
    noteBorder: "#ffffff",
    panel: D.hexToRgba(panel, 0.95),
    perfect: gold,
    good: ink,
    miss: cleanColor(c.miss, D.mixHex(text, bg, 0.45)),
    glow: !!s.glow,
  };
  return { id: s.id, skin, moved: [], holdback: true };
}

/* ---------- 本体が既に持っている ID（--only-new） ---------- */
/* 目録はこちらの定番（`other` の 53 種）も含みます。それを書き戻すと、
   手で整えた値（locked・type・cli など）を目録の写しで上書きしてしまうので、
   `--only-new` のときは**新顔だけ**を書きます（trk274）。 */
function loadExistingIds() {
  const sandbox = {
    console, Math, JSON, Object, Array, String, Number, Date, Set, Map, Error, RegExp, Intl,
    parseInt, parseFloat, isNaN, isFinite,
    TEXT: { ja: {}, en: {}, zh: {}, ko: {} }, tr: () => "",
    document: {
      documentElement: { style: { setProperty() {} } }, getElementById: () => null,
      createElement: () => ({ style: {}, append() {}, addEventListener() {} }),
    },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  const files = ["js/data.js"];
  const dir = path.join(ROOT, "js/characters");
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).sort()) if (f.endsWith(".js")) files.push("js/characters/" + f);
  }
  /* 出力先が skins-wizard.js でないときだけ、それも「既にある」に数える */
  const wizardPath = path.join(ROOT, "js/skins-wizard.js");
  if (path.resolve(ROOT, outRel) !== wizardPath && fs.existsSync(wizardPath)) files.push("js/skins-wizard.js");
  for (const f of files) {
    try {
      vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), sandbox, { filename: f });
    } catch (e) {
      console.error(`⚠ ${f} を読めませんでした（--only-new をやめます）：${e.message}`);
      return null;
    }
  }
  const S = sandbox.window && sandbox.window.Trk && sandbox.window.Trk.data && sandbox.window.Trk.data.SKINS;
  return S ? new Set(Object.keys(S)) : null;
}
const existingIds = onlyNew ? loadExistingIds() : null;

/* trk275：本体（data.js・ミク・skins-wizard.js）の**値**を読む。`--check` の突き合わせ用。
   ここも vm ですが、走らせるのは**自分のコード**だけです（目録の .js は実行しません）。 */
function loadBuiltInSkins() {
  const sandbox = {
    console, Math, JSON, Object, Array, String, Number, Date, Set, Map, Error, RegExp, Intl,
    parseInt, parseFloat, isNaN, isFinite,
    TEXT: { ja: {}, en: {}, zh: {}, ko: {} }, tr: () => "",
    document: {
      documentElement: { style: { setProperty() {} } }, getElementById: () => null,
      createElement: () => ({ style: {}, append() {}, addEventListener() {} }),
    },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  const files = ["js/data.js"];
  const dir = path.join(ROOT, "js/characters");
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir).sort()) if (f.endsWith(".js")) files.push("js/characters/" + f);
  const wizard = path.join(ROOT, "js/skins-wizard.js");
  if (fs.existsSync(wizard)) files.push("js/skins-wizard.js");
  for (const f of files) {
    try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), sandbox, { filename: f }); }
    catch (_) { return {}; }
  }
  const S = sandbox.window && sandbox.window.Trk && sandbox.window.Trk.data && sandbox.window.Trk.data.SKINS;
  return S || {};
}
if (onlyNew && !existingIds) {
  console.error("✗ 既にある ID を読めませんでした（--only-new を外して作り直してください）");
  process.exit(2);
}

/* ---------- 巻の目録（--volumes） ---------- */
/* 形：{ version:1, groups:[ {id,title,ids:[…]} | {id,title,category:"wizard"} | {id,title,remaining:true} ] }
   ・`ids` は目録にある ID だけを残す（知らない ID は落として知らせる）
   ・`category` は目録の cat から引く（wizard 62 種）
   ・`remaining` は「ほかのどの巻にも入っていないもの」（other 53 種＝こちらの定番） */
function buildVolumes() {
  if (!volumesRel) return null;
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(path.resolve(ROOT, volumesRel), "utf8"));
  } catch (e) {
    console.error(`✗ 巻の目録を読めませんでした（${volumesRel}）：${e.message}`);
    process.exit(2);
  }
  const groups = raw && Array.isArray(raw.groups) ? raw.groups : null;
  if (!groups) {
    console.error(`✗ 巻の目録に groups がありません（${volumesRel}）`);
    process.exit(2);
  }
  const allIds = list.filter(s => s && typeof s.id === "string" && ID_RE.test(s.id)).map(s => s.id);
  const known = new Set(allIds);
  const byCat = {};
  for (const s of list) {
    if (!s || typeof s.id !== "string" || !ID_RE.test(s.id)) continue;
    for (const c of D.sanitizeSkinCats(s.cat)) (byCat[c] = byCat[c] || []).push(s.id);
  }
  const used = new Set();
  const out = [];
  for (const g of groups) {
    if (!g || typeof g.id !== "string" || !/^[a-z][a-z0-9-]{1,23}$/.test(g.id)) continue;
    const title = typeof g.title === "string" ? g.title.trim().slice(0, 60) : "";
    let ids;
    if (Array.isArray(g.ids)) ids = g.ids.filter(id => typeof id === "string" && ID_RE.test(id));
    else if (typeof g.category === "string") ids = (byCat[g.category] || []).slice();
    else if (g.remaining) ids = allIds.filter(id => !used.has(id));
    else continue;
    ids = [...new Set(ids)].filter(id => known.has(id));
    for (const id of ids) used.add(id);
    out.push({ id: g.id, title: title || g.id, ids });
  }
  return { version: 1, groups: out, orphan: allIds.filter(id => !used.has(id)) };
}

/* ---------- 選ぶ ---------- */
const chosen = [];
const skipped = [];
const already = [];   /* 既にある（--only-new） */
const fitted = [];    /* 4.5:1／3:1 に届かせるために色を動かしたもの（trk270） */
const holdbacks = []; /* 寄せ幅が上限を超えて、目録の色のまま内蔵するもの（trk275・レビュー Q2） */
const mutedFixed = [];/* うすい文字が本文と同化したので中間に置き直したもの（trk275） */
for (const s of list) {
  if (!s || typeof s.id !== "string") continue;
  const cats = D.sanitizeSkinCats(s.cat);
  if (!ID_RE.test(s.id)) { skipped.push(s.id + "（id の形）"); continue; }
  if (wantCat && !cats.includes(wantCat)) continue;
  if (excludeCat && cats.includes(excludeCat)) continue;
  if (existingIds && existingIds.has(s.id)) { already.push(s.id); continue; }
  if (cliOnly && !(s.cli && typeof s.cli === "object")) { skipped.push(s.id + "（cli なし）"); continue; }
  const conv = convert({ ...s, cat: cats });
  if (!conv) { skipped.push(s.id + "（色が足りない）"); continue; }
  chosen.push(conv);
  if (conv.holdback) holdbacks.push(conv.id + "：" + (conv.holdbackReason || "面の色差が上限超え"));
  else if (conv.moved && conv.moved.length) fitted.push(conv.id + "：" + conv.moved.join("・"));
  if (conv.mutedFixed) mutedFixed.push(conv.id);
}
chosen.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

const volumes = buildVolumes();

if (!chosen.length && !volumes) {
  /* 目録に 1 枚も無い／このカテゴリが無い／色が無い（`ui` だけの生成物を渡した等）を言い分ける */
  const inCat = list.filter(s => s && D.sanitizeSkinCats(s.cat).includes(wantCat));
  const withColors = inCat.filter(s => s.colors && typeof s.colors === "object");
  if (!list.length) console.error("目録にスキンが 1 枚もありません");
  else if (!inCat.length) console.error(`取り込むスキンがありません（${list.length} 枚の中に cat「${wantCat}」を持つスキンがありません）`);
  else if (!withColors.length) console.error(`取り込むスキンがありません（cat「${wantCat}」の ${inCat.length} 枚が colors を持っていません＝ui/game だけの生成物は取り込めません。目録（catalog/skins.json）を渡してください）`);
  else console.error("取り込むスキンがありません（id の形か色の値を見てください）");
  process.exit(2);
}

/* ---------- 書き出す（同じ目録なら同じバイト列） ---------- */
const q = v => JSON.stringify(v);
const sha256 = createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const rebuild = "node tools/import-skin-catalog.mjs <目録.json>" +
  ` --cat=${wantCat}` + (excludeCat ? ` --exclude-cat=${excludeCat}` : "") +
  (onlyNew ? " --only-new" : "") + (cliOnly ? " --cli-only" : "") +
  (volumesRel ? " --volumes=<volumes.json>" : "") +
  (kind !== "wizard" ? ` --kind=${kind}` : "") + ` --out=${outRel}`;
const lines = [];
lines.push("// SPDX-License-Identifier: GPL-3.0-or-later");
if (kind === "volumes") {
  lines.push("/* 📚 巻別のスキン（trk274・Skin 側の目録から生成）");
  lines.push("");
  lines.push("   出どころ：trk-Avatar-Library の `catalog/skins.json`（巻の目録は `skin-volumes/volumes.json`）");
} else {
  lines.push("/* 🧙 ウィザードのスキン（trk269・trk270・trk274・Skin 側の目録から生成）");
  lines.push("");
  lines.push("   出どころ：trk-Avatar-Library の `catalog/skins.json`（" + (wantCat || "全部") + " カテゴリ" + (cliOnly ? "・cli あり" : "") + "）");
}
lines.push("   目録の sha256：" + sha256 + "（この写しがどの目録から作られたかの印）");
lines.push("   作り方：" + rebuild);
lines.push("   ・手で直さないでください（次の取り込みで消えます）。直すときは目録側（Skin 側）で。");
lines.push("   ・このファイルは data.js の後・core.js の前に読みます（起動時のスキン復元より先に要るため）。");
if (onlyNew) lines.push("   ・`--only-new`：本体が既に持っている ID（定番・ミク・Wizard）は書きません（上書きしないため）。");
lines.push("   ============================================================================ */");
lines.push('"use strict";');
lines.push("(() => {");
lines.push("  const D = window.Trk && window.Trk.data;");
lines.push("  const S = D && D.SKINS;");
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
  if (skin.holdback) lines.push("    holdback:true,");
  /* 最後の 1 つは末尾のカンマを外す（読みやすさのためだけ） */
  const last = lines[lines.length - 1];
  lines[lines.length - 1] = last.replace(/,$/, "");
  lines.push("  };");
}
{ /* trk275：差し戻しの一覧（道具が読んで「黙って通さない」ために使う） */
  const hb = chosen.filter(c => c.holdback).map(c => c.id);
  if (hb.length) {
    lines.push("  /* ⚠ 差し戻し（目録へお返しした色のもの）：寄せると別のテーマになるので、");
    lines.push("     **色は目録のまま**内蔵し、既定の棚から外しています（ALL と その巻では見えます）。");
    lines.push("     直すのは目録側です（`tools/check-skin-contrast` もこの一覧を読みます）。 */");
    lines.push("  if (D) D.SKIN_HOLDBACK = " + q(hb) + ";");
  }
}
if (volumes) {
  lines.push("  /* 📚 巻の目録（13 巻）。`ids` は**この目録に居る ID の全部**（既に本体が持っているものも含む）。");
  lines.push("     ＝ 棚で巻を選ぶと、その巻の全員が出る（新顔も定番も同じ扱い）。 */");
  lines.push("  if (D) D.SKIN_VOLUMES = [");
  volumes.groups.forEach((g, i) => {
    lines.push("    {id:" + q(g.id) + ",title:" + q(g.title) + ",ids:" + q(g.ids) + "}" + (i === volumes.groups.length - 1 ? "" : ","));
  });
  lines.push("  ];");
}
lines.push("})();");
const body = lines.join("\n") + "\n";

const outPath = path.resolve(ROOT, outRel);
if (checkOnly) {
  const now = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";
  if (now !== body) {
    console.error(`✗ ${outRel} が目録と違います（${rebuild} で作り直してください）`);
    process.exit(1);
  }
  console.log(`✓ ${outRel} は目録どおり（${chosen.length} 種${volumes ? `・巻 ${volumes.groups.length}` : ""}）`);
  /* trk275（レビュー Q1）：目録の `other`（こちらの定番）と本体の値がずれていないかを 1 行で出す。
     `--only-new` で書き戻さない代わりに、**ずれを数えて知らせる**のがここの役目。 */
  {
    const other = volumes && volumes.groups.find(g => g.id === "other");
    const ids = other && Array.isArray(other.ids) ? other.ids : [];
    const builtInSkins = loadBuiltInSkins();
    const known = existingIds || new Set(Object.keys(builtInSkins));
    let diff = 0, missing = 0;
    for (const id of ids) {
      const cat = list.find(x => x && x.id === id);
      if (!cat) continue;
      if (!known.has(id)) { missing++; continue; }
      /* 目録の text／accent と、本体の値を突き合わせる（本体は vm で読む＝自分のコード） */
      const now = builtInSkins[id];
      if (!now || !now.ui) { missing++; continue; }
      const a = cleanColor(cat.colors && cat.colors.text), b = now.ui["--ui-text"];
      const p = cleanColor(cat.colors && cat.colors.accent), r = now.ui["--ui-accent"];
      if (a && b && a.toLowerCase() !== String(b).toLowerCase()) diff++;
      else if (p && r && p.toLowerCase() !== String(r).toLowerCase()) diff++;
    }
    console.log(`  目録の other（${ids.length} 種）と本体の差：${diff} 件` +
      (missing ? `（本体に無い：${missing} 件）` : "") +
      (diff ? " ⚠ 目録か本体のどちらかを直してください" : ""));
  }
  process.exit(0);
}
fs.writeFileSync(outPath, body);
console.log(`✓ ${outRel} に ${chosen.length} 種を書きました（${chosen.map(c => c.id).join(", ")}）`);
if (volumes) {
  console.log(`  巻の目録：${volumes.groups.length} 巻（${volumes.groups.map(g => `${g.id}:${g.ids.length}`).join(" ")}）`);
  if (volumes.orphan.length) console.log(`  どの巻にも入っていない ID：${volumes.orphan.length} 件（${volumes.orphan.slice(0, 8).join(", ")}${volumes.orphan.length > 8 ? " …" : ""}）`);
}
if (already.length) console.log(`  既にあるので書かない：${already.length} 件（--only-new）`);
if (skipped.length) console.log(`  飛ばした：${skipped.length} 件（${skipped.slice(0, 5).join(" / ")}${skipped.length > 5 ? " …" : ""}）`);
if (fitted.length) console.log(`  合格点まで寄せた：${fitted.length} 件\n    ` + fitted.join("\n    "));
if (holdbacks.length) console.log(`  ⚠ 差し戻し（目録の色のまま・既定の棚から外す）：${holdbacks.length} 件\n    ` + holdbacks.join("\n    "));
if (mutedFixed.length) console.log(`  うすい文字を中間に置き直した：${mutedFixed.length} 件`);
{ /* 読めることを優先して「同化のまま」にしたものは、黙らずに数える（レビュー Q2 の残り） */
  const stay = chosen.filter(c => !c.holdback && dEok(c.skin.ui["--ui-muted"], c.skin.ui["--ui-text"]) < 0.03).map(c => c.id);
  if (stay.length) console.log(`  ⚠ うすい文字が本文と同化したまま（読めるほうを優先）：${stay.length} 件\n    ` + stay.slice(0, 12).join(", ") + (stay.length > 12 ? " …" : ""));
}

// SPDX-License-Identifier: GPL-3.0-or-later
/* 📚 trk275：レビュー（trk274 への差し戻し）を受けて直した所の番人

   ・M1 Esc：📚 のパネル（popover）が開いているときは、設定を閉じない
   ・M2 巻の外の「使用中・⭐・🕒・🚫・検索」→ tests/trk274-volumes.test.mjs（3 本）
   ・M3 📚 に出す数は**実際に棚へ出る枚数**（115 ではなく 114）
   ・R4 巻の題名は翻訳（13 巻＋3）
   ・R5 1 つだけ選ぶものは radiogroup／radio
   ・R6 数と描いた枚数（解禁前の ❓ も 1 枚として数える）
   ・R7 定番とウィザードの間を区切る
   ・Q3 知らない巻名は既定へ戻し、状態の行に 1 行だけ出す
   ・R2 検める道具の穴（角度なし gradient／必須の面が無い／読めた数）

   ここは「消えずに残っている」ことを見ます。見た目は実機と目で確かめます。 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const html = read("index.html");
const css = read("css/style.css");
const core = read("js/core.js");
const main = read("js/main.js");
const i18n = read("js/i18n.js");
const sw = read("sw.js");

/* ==================== M1 Esc ==================== */
test("M1 Esc：📚 のパネルが開いているときは、設定を閉じない（パネルに譲る）", () => {
  /* ここで先に preventDefault すると、popover は「取り消された」と見なして閉じられない */
  const lines = main.split("\n");
  const at = lines.findIndex(l => l.includes("core.closeSettings();") && l.includes("preventDefault()"));
  assert.notEqual(at, -1, "Esc で設定を閉じる行がある");
  const cond = lines.slice(Math.max(0, at - 3), at).join("\n");
  assert.match(cond, /!document\.querySelector\(":popover-open"\)/,
    "開いている popover が無いときだけ閉じる（あれば閉じる側に入らない）");
  assert.match(cond, /code === "Escape"/);
  assert.match(cond, /core\.screen === "settings"/);
  /* 開いていれば、この行に届かないこと（早めに return しない＝キーは popover に渡る） */
  assert.doesNotMatch(cond, /popover-open"\s*\)\s*\)\s*e\.stopImmediatePropagation/);
});

/* ==================== M3/R6 数 ==================== */
test("M3 巻の一覧の数は、実際に棚へ出る枚数で数える（291 ではなく 114）", () => {
  assert.match(core, /function skinVolCount\(skins, volumes, vol\)/, "数え方を 1 か所にまとめた");
  assert.match(core, /\.length;\s*\n\}/, "棚の判定（skinShelfEntries）と同じ数え方");
  /* 既定・ALL・各巻の 3 つとも、この関数で数える */
  assert.match(core, /add\("", tr\("skinVolDefault"\), skinVolCount\(skins, volumes, ""\)\)/);
  assert.match(core, /add\("all", tr\("skinVolAll"\), skinVolCount\(skins, volumes, "all"\)\)/);
  /* 棚に出す数（skinShelfCount・読み上げ）も list.length のまま */
  assert.match(core, /skinShownCount = list\.length;/);
  assert.match(core, /tr\("skinCountShown", \{ shown: list\.length, all: total \}\)/);
});

test("R6 解禁前の ❓ も 1 枚として数える（数と描いた枚数がずれない）", () => {
  const locked = core.slice(core.indexOf('s.locked && !settings.skinGradUnlocked'), core.indexOf("buildSkinManage();", core.indexOf('s.locked && !settings.skinGradUnlocked')));
  assert.match(locked, /const lockedCell = el\("div", "skinCell"\)/, "包む");
  assert.match(locked, /grid\.append\(lockedCell\)/, "同じ棚へ並べる");
  /* 他のカードも .skinCell で包む（数を数える側と描く側を同じ単位に） */
  assert.match(core, /const cell = el\("div", "skinCell"\);/);
});

/* ==================== R4 巻の題名 ==================== */
test("R4 巻の題名は 4 言語の翻訳から取る（目録の題名は日本語のまま）", () => {
  assert.match(core, /const SKIN_VOL_NAME_KEYS = \{/);
  assert.match(core, /function skinVolTitle\(g\)/);
  assert.match(core, /return g\.title \|\| g\.id \|\| "";/, "知らない巻は目録の題名のまま");
  /* 読み上げも翻訳した題名を使う */
  assert.match(core, /g \? skinVolTitle\(g\) : vol/);
  for (const key of ["Vol01", "Vol02", "Vol03", "Vol04", "Vol05", "Vol06", "Vol07", "Vol08", "Vol09", "Vol10", "Glitch", "Wizard", "Other"]) {
    const n = (i18n.match(new RegExp(`skinVolName${key}:`, "g")) || []).length;
    assert.equal(n, 4, `skinVolName${key} は 4 言語`);
  }
  /* 題名を直接書いていない（翻訳を経由している） */
  assert.doesNotMatch(core, /"vol\.1 /, "日本語の題名を core.js に写していない");
});

/* ==================== R5 選択の意味 ==================== */
test("R5 巻の一覧は radiogroup／radio（aria-pressed ではない）", () => {
  assert.match(core, /list\.setAttribute\("role", "radiogroup"\)/);
  assert.match(core, /b\.setAttribute\("role", "radio"\)/);
  assert.match(core, /b\.setAttribute\("aria-checked", String\(/);
  const from = core.indexOf("function buildSkinVolControls(");
  const to = core.indexOf("function buildSkinGrid(", from);
  assert.ok(to > from);
  assert.doesNotMatch(core.slice(from, to), /aria-pressed/, "巻のカードに aria-pressed は使わない");
  /* 名前（ラベル）は中の文字から取れる：<b>題名</b> + <small>数</small> */
  assert.match(core, /b\.append\(el\("b", "", label\), el\("small", "", tr\("skinVolItems", \{ n: count \}\)\)\)/);
  assert.match(html, /<div id="skinVolList"><\/div>/, "一覧の入れ物がある");
  assert.match(css, /#skinVolList\{display:grid;/, "一覧は格子（区切りの行が全体に広がる）");
});

/* ==================== R7 並び ==================== */
test("R7 定番とウィザードの間を 1 行で区切る（13 巻の並びは目録のまま）", () => {
  assert.match(core, /if \(g\.id === "wizard"\) \{/);
  assert.match(core, /tr\("skinVolGroupClassic"\)/);
  assert.match(css, /\.skinVolSep\{grid-column:1\/-1;/);
  /* 見出しは 4 言語 */
  assert.equal((i18n.match(/skinVolGroupClassic:/g) || []).length, 4);
});

/* ==================== Q3 知らない巻名 ==================== */
test("Q3 知らない巻名は既定に戻し、状態の行に 1 行だけ出す", () => {
  assert.match(core, /const volKnown = !wantVol \|\| wantVol === "all" \|\| volumes\.some\(g => g && g\.id === wantVol\);/);
  assert.match(core, /const vol = volKnown \? wantVol : "";/, "中では既定として扱う");
  assert.match(core, /if \(volStatus && !volKnown\) volStatus\.textContent = tr\("skinVolUnknown"\);/);
  assert.match(html, /<p class="hint status" id="skinVolStatus" role="status" aria-live="polite"><\/p>/);
  assert.equal((i18n.match(/skinVolUnknown:/g) || []).length, 4, "4 言語");
  /* 差し戻しの札も 4 言語 */
  assert.equal((i18n.match(/skinHoldbackNote:/g) || []).length, 4);
  assert.match(core, /if \(s\.holdback\) b\.append\(el\("small", "skinHoldback", tr\("skinHoldbackNote"\)\)\);/);
});

/* ==================== R1 高さ ==================== */
test("R1 棚の 1 枚分の高さの見積もりは、実測（58〜79px）の範囲", () => {
  const m = /#skinGrid>\.skinCell\{content-visibility:auto;contain-intrinsic-size:auto (\d+)px\}/.exec(css);
  assert.ok(m, "1 行で入っている");
  const h = Number(m[1]);
  assert.ok(h >= 58 && h <= 79, `${h}px は実測の範囲（118px は離れすぎ）`);
  assert.equal((css.match(/content-visibility:auto/g) || []).length, 1, "棚だけに当てる");
});

/* ==================== 版 ==================== */
test("版とキャッシュ：trk275 で上がっている", () => {
  assert.match(html, /<meta name="trk-build" content="trk275">/);
  assert.match(sw, /const CACHE = "trk-v2026\.11\.03-trk275";/);
});

/* ==================== R2 検める道具の穴 ==================== */
function runChecker(args) {
  try {
    const stdout = execFileSync(process.execPath, [path.join(ROOT, "tools/check-skin-contrast.mjs"), ...args], { encoding: "utf8", cwd: ROOT });
    return { code: 0, stdout };
  } catch (e) {
    return { code: e.status, stdout: e.stdout || "" };
  }
}
const COLORS = {
  "--ui-bg": "#101820", "--ui-panel": "#182030", "--ui-soft": "rgba(255,255,255,.06)",
  "--ui-text": "#f2f5fa", "--ui-muted": "#b8c4d6", "--ui-border": "rgba(255,255,255,.16)",
  "--ui-button": "#1d2739", "--ui-button-hover": "#26344a", "--ui-field": "#0d141f",
  "--ui-accent": "#7fd8ff", "--ui-on-accent": "#001018", "--ui-gold": "#ffd166",
};
const SKIN = (extra = {}) => ({
  ui: { ...COLORS, ...(extra.ui || {}) },
  game: { stage: "#16202c", ink: "#f2f5fa", miss: "#ff9c9c", ...(extra.game || {}) },
  ...extra.rest,
});
function writeFile(body) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trk275-"));
  const file = path.join(dir, "skins.js");
  fs.writeFileSync(file, body);
  return file;
}
const generated = (id, skin, extra = "") =>
  `"use strict";\n(() => {\n  const S = window.Trk.data.SKINS;\n  S["${id}"] = ${JSON.stringify(skin)};\n${extra}})();\n`;

test("R2-1 角度のない linear-gradient を「向き」と取り違えない", () => {
  const file = writeFile(generated("ok-flat", SKIN({ ui: { "--ui-bg": "linear-gradient(#101820,#182030)" } })));
  const r = runChecker([file, "--json"]);
  assert.equal(r.code, 0, r.stdout);
  const json = JSON.parse(r.stdout);
  assert.equal(json.problems.length, 0, "地の色を向きとして落とさない");
});

test("R2-2 必須の面が無ければ「読めた」にせず落とす", () => {
  const skin = SKIN();
  delete skin.ui["--ui-field"];
  delete skin.ui["--ui-button"];
  const file = writeFile(generated("ok-missing", skin));
  const r = runChecker([file, "--json"]);
  assert.equal(r.code, 1, "面が欠けていれば落とす");
  const json = JSON.parse(r.stdout);
  const missing = json.problems.filter(p => p.reason === "missing").map(p => p.surface || p.label);
  assert.ok(json.problems.some(p => p.reason === "missing"), `missing として出す：${missing.join(",")}`);
});

test("R2-3 読めた数を突き合わせる（S[ はあるのに読めない＝落とす）", () => {
  const file = writeFile(generated("ok-read", SKIN(), `  S["ghost"] = window.somethingElse;\n`));
  const r = runChecker([file, "--json"]);
  assert.equal(r.code, 1);
  const json = JSON.parse(r.stdout);
  assert.ok(json.unread >= 1, "読めなかった数を出す");
  assert.ok(json.problems.some(p => p.reason === "unread"));
});

test("R2-4 差し戻し（holdback）は ⚠ として一覧に出し、落とさない", () => {
  const file = writeFile(
    `"use strict";\n(() => {\n  const S = window.Trk.data.SKINS;\n  S["hb-one"] = ${JSON.stringify(SKIN({ game: { stage: "#ffffff", ink: "#fefefe" } }))};\n  window.Trk.data.SKIN_HOLDBACK = ["hb-one"];\n})();\n`,
  );
  const r = runChecker([file]);
  assert.equal(r.code, 0, r.stdout);
  assert.match(r.stdout, /差し戻し/);
  assert.match(r.stdout, /hb-one/);
});

#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/* ⚖ ⚙（設定）の「量」を数える（trk279）
 *
 * なぜ要るか：設定は 213 の値を 19 枚のパネルに並べています。ところが
 * 「いま何個あるのか」「どこが重いのか」を毎回手で数えると、数え方がぶれます
 * （trk279 の相談＝プリセットで出す量を減らす、の判断の土台にするため）。
 *
 * 数えるもの（index.html と js/core.js を読むだけ・書き換えません）：
 *   ・⚙ のパネル（details.panel）の枚数と、パネルごとの操作子（input / select / textarea）と説明（.hint）
 *   ・⚙ 全体の操作子と説明の数、説明の日本語の文字数（i18n.js で引けるものだけ）
 *   ・settings（core.js の初期値）のキーの数
 *   ・段（プリセット）の材料＝data-tier がまだ付いていないこと
 *
 * 使い方：
 *   node tools/settings-inventory.mjs          # 表を出す（人が読む）
 *   node tools/settings-inventory.mjs --json   # 機械向け（テスト・突き合わせ用）
 *
 * ⚠ 数えるのは「いま在るもの」だけ。良し悪しは docs/SETTINGS-AUDIT-TRK279-2026-11-03.md に書きます。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");

const html = read("index.html");

/* ---------- ⚙ の範囲を切り出す（<section id="settingsScreen"> 〜 次の </section>） ---------- */
function settingsRange(source) {
  const open = source.indexOf('id="settingsScreen"');
  if (open < 0) throw new Error("index.html に #settingsScreen が見つかりません");
  const close = source.indexOf("\n  </section>", open);
  if (close < 0) throw new Error("#settingsScreen の終わり（</section>）が見つかりません");
  return source.slice(open, close);
}

const section = settingsRange(html);

/* ---------- パネルごとに数える ---------- */
const PANEL_RE = /<details class="panel[^"]*"[^>]*>/g;
const starts = [];
for (let m; (m = PANEL_RE.exec(section)); ) starts.push(m.index);

function summaryKey(chunk) {
  const m = chunk.match(/<summary[^>]*>/);
  if (!m) return { key: "", ja: "" };
  const key = (m[0].match(/data-i18n="([^"]+)"/) || [])[1] || "";
  if (key) return { key, ja: "" };
  /* data-i18n を持たない見出し（⭐ お気に入り・🛟 緊急復旧）は、書かれている言葉をそのまま使う */
  const text = (chunk.slice(0, chunk.indexOf("</summary>")).match(/>([^<]+)</) || [])[1] || "";
  return { key: "", ja: text.trim() };
}

const panels = starts.map((start, i) => {
  const chunk = section.slice(start, i + 1 < starts.length ? starts[i + 1] : section.length);
  const { key, ja } = summaryKey(chunk);
  return {
    key,
    name: ja,
    controls: (chunk.match(/<(?:input|select|textarea)\b/g) || []).length,
    hints: (chunk.match(/class="hint"/g) || []).length,
    hintKeys: [...chunk.matchAll(/class="hint"[^>]*data-i18n="([^"]+)"/g)].map(m => m[1]),
    chars: chunk.length,
    open: /^\s*[\s\S]{0,200}?\bopen\b/.test(chunk.slice(0, chunk.indexOf(">")) ) ? true : false, // summary ではなくタグを見る
  };
});

/* details の開閉は <details ... open> の有無で決まる（summary ではなく開始タグ） */
for (const p of panels) {
  const tag = section.slice(starts[panels.indexOf(p)]).match(/^<details[^>]*>/)[0];
  p.open = /\sopen(\s|>)/.test(tag);
}

/* ---------- 日本語の文言（i18n.js の ja ブロック） ---------- */
const i18n = read("js/i18n.js");
function jaBlock(source) {
  const at = source.search(/\n\s*ja:\s*\{/);
  if (at < 0) return {};
  let i = source.indexOf("{", at), depth = 1, start = i + 1;
  for (i = start; i < source.length && depth; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") depth--;
  }
  const body = source.slice(start, i - 1);
  const out = {};
  for (const m of body.matchAll(/(\w+):\s*"((?:[^"\\]|\\.)*)"/g)) out[m[1]] = m[2];
  return out;
}
const ja = jaBlock(i18n);

/* ---------- settings のキーの数（core.js の const settings = {...}） ---------- */
const core = read("js/core.js");
function settingsKeyCount(source) {
  const at = source.indexOf("const settings = {");
  if (at < 0) return 0;
  const body = source.slice(at, source.indexOf("\n};", at));
  const keys = new Set();
  for (const m of body.matchAll(/^\s{2}([A-Za-z0-9_]+):/gm)) keys.add(m[1]);
  return keys.size;
}

const totals = {
  panels: panels.length,
  panelsOpenByDefault: panels.filter(p => p.open).length,
  controls: panels.reduce((n, p) => n + p.controls, 0),
  hints: panels.reduce((n, p) => n + p.hints, 0),
  hintKeysResolved: panels.reduce((n, p) => n + p.hintKeys.filter(k => k in ja).length, 0),
  hintChars: panels.reduce((n, p) => n + p.hintKeys.reduce((s, k) => s + (ja[k] ? ja[k].length : 0), 0), 0),
  settingsKeys: settingsKeyCount(core),
  /* 検索欄は「パネルの外（上部）」と「パネルの中（スキン棚など）」を分けて数える */
  searchTop: (section.slice(0, starts[0] || section.length).match(/<input[^>]*type="search"/g) || []).length,
  searchInside: (section.slice(starts[0] || 0).match(/<input[^>]*type="search"/g) || []).length,
  tiered: (section.match(/data-tier=/g) || []).length,
  contentVisibility: (read("css/style.css").match(/content-visibility/g) || []).length,
};

const report = { totals, panels: panels.map(p => ({ key: p.key, name: p.name, controls: p.controls, hints: p.hints, chars: p.chars, open: p.open })) };

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const name = p => p.name || p.key || "(見出しなし)";
  const width = Math.max(...report.panels.map(p => name(p).length)) + 2;
  console.log("⚙ 設定の量（index.html の #settingsScreen と js/core.js を数えただけ）\n");
  for (const p of [...report.panels].sort((a, b) => b.controls - a.controls)) {
    console.log(
      name(p).padEnd(width) +
      `操作子 ${String(p.controls).padStart(3)}  説明 ${String(p.hints).padStart(3)}  文字 ${String(p.chars).padStart(6)}` +
      (p.open ? "  （既定で開く）" : "")
    );
  }
  console.log("");
  console.log(`パネル ${totals.panels} 枚（既定で開く ${totals.panelsOpenByDefault} 枚）`);
  console.log(`操作子 ${totals.controls} 個・説明 ${totals.hints} か所（i18n で引ける ${totals.hintKeysResolved} か所＝日本語 ${totals.hintChars} 字）`);
  console.log(`settings のキー ${totals.settingsKeys} 個・data-tier ${totals.tiered} か所`);
  console.log(`検索欄 上部 ${totals.searchTop} 本＋パネルの中 ${totals.searchInside} 本`);
  console.log(`content-visibility ${totals.contentVisibility} か所`);
}

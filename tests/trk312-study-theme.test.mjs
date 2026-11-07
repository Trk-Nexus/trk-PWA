// SPDX-License-Identifier: GPL-3.0-or-later
/* trk312：読書テーマ 30 種の読みやすさ。
   見張ること：
   ・optgroup は applyLanguage で textContent を書かない（選択肢が消えない・見出しは label）
   ・sepia（古書）の文字色は、地色に対して 4.5:1 以上（実機相当の測り方は tools/smoke/study-theme-contrast-smoke.mjs）
   ・テーマは 30 種のまま */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");

test("optgroup の見出しは label に書く（選択肢を消さない）", () => {
  const core = read("js/core.js");
  assert.match(core, /if \(n\.tagName === "OPTGROUP"\) n\.label = tr\(n\.dataset\.i18n\); else n\.textContent = tr\(n\.dataset\.i18n\);/);
});

test("sepia（古書）の文字色は地色に対して 4.5:1 以上", () => {
  const lum = hex => {
    const v = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const css = read("css/study-room.css");
  const m = css.match(/data-theme="sepia"\]\{[^}]*--study-theme-page:(#[0-9a-f]{6});[^}]*--study-theme-ink:(#[0-9a-f]{6})/i);
  assert.ok(m, "sepia の定義が読める");
  assert.ok(ratio(m[2], m[1]) >= 4.5, `sepia の対比 ${ratio(m[2], m[1]).toFixed(2)}:1`);
});

test("読書テーマは 30 種のまま", () => {
  const st = read("js/study-room.js");
  const list = st.match(/const STUDY_THEMES = \[([\s\S]*?)\];/)[1].match(/"[a-z]+"/g);
  assert.equal(list.length, 30);
});

/* 地（--ui-bg）に文字を直接置かない約束（スキンの色検査が「地」を見ない前提） */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const css = readFileSync(new URL("../css/style.css", import.meta.url), "utf8");
test("⌨ の入力欄は入力欄の色（地ではない）", () => {
  const m = /\.cliInput\{[^}]*\}/.exec(css); assert.ok(m);
  assert.match(m[0], /background:var\(--ui-field\)/);
  assert.doesNotMatch(m[0], /var\(--ui-bg\)/);
});
test("⌨ の板は地へ溶けない（パネルのまま）", () => {
  const m = /\.cliDialog::before\{[^}]*\}/.exec(css); assert.ok(m);
  assert.doesNotMatch(m[0], /var\(--ui-bg\)/);
});
test("地を背景に持つのは .screen だけ（文字はカードの上）", () => {
  const users = css.split("}").filter(r => /background[^;]*var\(--ui-bg\)/.test(r)).map(r => r.split("{")[0].replace(/\/\*[\s\S]*?\*\//g, "").trim());
  assert.deepEqual(users, [".screen"]);
});

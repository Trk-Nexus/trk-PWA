// SPDX-License-Identifier: GPL-3.0-or-later
/* trk293：Avatar の trk291 レビュー（最終版）の house-edge の扱い。
   目録の `readability: "intentional-low"` は「意図した低コントラスト」の宣言。
   - 合格証でも免除でもない：差し戻しの判定（色の差）は宣言と無関係に変わらない
   - 宣言があるのは house-edge だけ（通常スキンへ例外を広げない）
   - 画面では、その 1 枚の注意書きの下に理由文（4 言語）を出す */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const volumes = read("js/skins-volumes.js");
const wizard = read("js/skins-wizard.js");

/* 生成物の中で、宣言（readability）を持つスキンの ID を拾う */
function declaredIds(src) {
  const out = [];
  const re = /S\["([^"]+)"\] = \{/g;
  let m;
  while ((m = re.exec(src))) {
    const start = m.index;
    const next = src.indexOf("S[\"", start + 1);
    const block = src.slice(start, next === -1 ? src.length : next);
    if (/readability:"intentional-low"/.test(block)) out.push(m[1]);
  }
  return out;
}

test("意図した低コントラストの宣言は house-edge だけにある（例外を広げない）", () => {
  assert.deepEqual(declaredIds(volumes), ["house-edge"]);
  assert.deepEqual(declaredIds(wizard), []);
});

test("宣言は差し戻しを外さない：house-edge は色のまま差し戻し（holdback）のまま", () => {
  const block = volumes.slice(volumes.indexOf('S["house-edge"] = {'));
  const body = block.slice(0, block.indexOf("};") + 2);
  assert.match(body, /holdback:true/, "house-edge は差し戻しのまま");
  assert.match(body, /readabilityReason:\{"ja":"[^"]+","en":"[^"]+","zh":"[^"]+","ko":"[^"]+"\}/, "理由は 4 言語");
  assert.match(volumes, /SKIN_HOLDBACK = \[[^\]]*"house-edge"/, "差し戻しの一覧にも残る");
});

test("画面は宣言のあるスキンの理由文を出す（判定は変えない）", () => {
  const core = read("js/core.js");
  assert.match(core, /s\.readability === "intentional-low" && s\.readabilityReason/);
  assert.match(core, /s\.readabilityReason\[lang\] \|\| s\.readabilityReason\.en/);
});

test("生成器は宣言を写すが、差し戻しの判定には使わない", () => {
  const tool = read("tools/import-skin-catalog.mjs");
  assert.match(tool, /trk293：意図した低コントラストの宣言/);
  assert.match(tool, /skin\.readability = "intentional-low"/);
});

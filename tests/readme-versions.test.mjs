// SPDX-License-Identifier: GPL-3.0-or-later
/* 📄 trk273：release/README-standalone.txt の「この版で入っているもの」が、
   docs/HANDOFF.md §7 の見出しと 1 行も違わないこと。

   レビュー M3：README の一覧は手書きで、18 項目のうち 15 行しか無く、
   しかも trk255 の説明が別の回の内容になっていた（39 版ぶん古い見出しも残っていた）。
   いまは tools/readme-versions.mjs が HANDOFF から作るので、二度とずれないように見張ります。 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./helpers/browser-data.mjs";
import {
  HANDOFF, README, START_MARK, FROM,
  handoffVersions, versionLines, readmeBlock, replaceBlock,
} from "../tools/readme-versions.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const handoff = read(HANDOFF);
const readme = read(README);

test("README の一覧は、docs/HANDOFF.md §7 の見出しと 1 行も違わない", () => {
  const expected = versionLines(handoffVersions(handoff));
  const got = readmeBlock(readme);
  assert.ok(got, "README に目印の行がある");
  assert.deepEqual(got, expected);
});

test("一覧は trk255 から始まり、抜けが無い（18 行以上）", () => {
  const versions = handoffVersions(handoff);
  assert.equal(versions[0].v, FROM, `最初は trk${FROM}`);
  const nums = versions.map(v => v.v);
  for (let i = 1; i < nums.length; i++) assert.ok(nums[i] > nums[i - 1], "版は小さい順");
  assert.ok(versions.length >= 15, `一覧は 15 行以上（いま ${versions.length} 行）`);
  /* 連番でなくてよい（版によっては HANDOFF に節が無い）が、直近 3 版は必ず入る */
  const last = nums[nums.length - 1];
  for (const v of [last - 2, last - 1, last]) assert.ok(nums.includes(v), `trk${v} が一覧にある`);
});

test("各行は「4 つの空白＋trkNNN＋2 つの空白＋見出し」の形", () => {
  for (const line of readmeBlock(readme)) {
    assert.match(line, /^ {4}trk\d{3}  \S/, line);
    assert.doesNotMatch(line, /\*\*|`/, "Markdown の装飾は落としてある");
  }
});

test("一覧の直前には、作り方の目印がある（手で書かないため）", () => {
  assert.ok(readme.includes(START_MARK), "README に目印の行がある");
  const lines = readme.split("\n");
  const at = lines.findIndex(l => l.includes(START_MARK));
  assert.equal(lines[at + 1], "", "目印の次は空行");
  assert.match(lines[at + 2], /^ {4}trk\d{3}  /, "その次から一覧");
});

test("HANDOFF が進んだら、書き換え（--write）で追いつける", () => {
  /* 仮に 1 件増えた HANDOFF を作り、置き換えた README が新しい行を含むこと */
  const fake = handoff.replace(
    "## 7. 最近の変更\n\n",
    "## 7. 最近の変更\n\n- **🧪 trk999：見張りのための架空の回（2026-11-03）**：テストだけの行。\n\n",
  );
  const lines = versionLines(handoffVersions(fake));
  const after = replaceBlock(readme, lines);
  assert.ok(after.includes("    trk999  見張りのための架空の回"), "新しい版が一覧に入る");
  assert.deepEqual(readmeBlock(after), lines);
  /* 目印より前・一覧より後は触らない */
  const before = readme.split(START_MARK)[0];
  assert.equal(after.split(START_MARK)[0], before, "前書きは変わらない");
});

test("見出しの取りこぼしが無い（trk255 以降で §7 に節がある版はすべて一覧にある）", () => {
  const section = handoff.slice(handoff.indexOf("## 7. 最近の変更")).split("\n## ")[0];
  const nums = new Set();
  for (const line of section.split("\n")) {
    const m = /^- \*\*.+?trk(\d+)：/.exec(line);
    if (m && Number(m[1]) >= FROM) nums.add(Number(m[1]));
  }
  const listed = new Set(handoffVersions(handoff).map(v => v.v));
  assert.deepEqual([...nums].sort((a, b) => a - b), [...listed].sort((a, b) => a - b));
});

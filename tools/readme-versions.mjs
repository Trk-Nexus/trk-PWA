#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/* 📄 release/README-standalone.txt の「この版で入っているもの」を、docs/HANDOFF.md §7 の見出しから作る（trk273）
 *
 * なぜ要るか：手で書いた一覧は、版が進むたびに事実とずれます（trk272 のレビュー M3：
 * README が trk255〜trk272 の 18 項目のうち 15 行しか無く、しかも中身が履歴と違っていた）。
 * 「HANDOFF の見出し＝その回にやったこと」なので、そこから作れば食い違わない。
 *
 * 使い方：
 *   node tools/readme-versions.mjs                     # 一覧を出す（人が読む）
 *   node tools/readme-versions.mjs --write             # README の一覧を書き換える
 *   node tools/readme-versions.mjs --check             # ずれていたら終了 1（CI・テスト用）
 *   node tools/readme-versions.mjs --from=255          # 255 以降（既定）
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const README = "release/README-standalone.txt";
export const HANDOFF = "docs/HANDOFF.md";
export const FROM = 255;   /* README に並べる最初の版（/trk/ は trk219 のままなので、開発版の区切りで 255 から） */
export const START_MARK = "（この一覧は docs/HANDOFF.md §7 の見出しから作る: node tools/readme-versions.mjs --write）";

/* §7 の見出しから { v, title } を拾う（同じ版が複数あれば最初のものを採る） */
export function handoffVersions(text, from = FROM) {
  const at = text.indexOf("## 7. 最近の変更");
  if (at < 0) throw new Error("docs/HANDOFF.md に `## 7. 最近の変更` がありません");
  const section = text.slice(at).split("\n## ")[0];   /* §7 の中だけ */
  const seen = new Map();
  for (const line of section.split("\n")) {
    const m = /^- \*\*(.+?)trk(\d+)：(.+?)\*\*/.exec(line);
    if (!m) continue;
    const v = Number(m[2]);
    if (v < from || seen.has(v)) continue;
    let title = m[3]
      .replace(/（\d{4}-\d{2}-\d{2}）\s*$/, "")   /* 末尾の日付は落とす */
      .replace(/`/g, "")                          /* Markdown の装飾は落とす */
      .replace(/\*\*/g, "")
      .trim();
    seen.set(v, { v, title });
  }
  return [...seen.values()].sort((a, b) => a.v - b.v);
}

/* README に置く行（4 つの空白＋`trkNNN` ＋ 見出し） */
export function versionLines(versions) {
  return versions.map(({ v, title }) => `    trk${v}  ${title}`);
}

/* README の「この版で入っているもの」の一覧を取り出す（見出しの次の印から、空行2つまで） */
export function readmeBlock(text) {
  const lines = text.split("\n");
  const start = lines.findIndex(l => l.includes(START_MARK));
  if (start < 0) return null;
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^    trk\d+  /.test(l)) { out.push(l); continue; }
    if (out.length && l.trim() === "") break;
    if (!out.length && l.trim() === "") continue;
    if (out.length) break;
  }
  return out;
}

/* README の一覧を差し替える（ほかは触らない） */
export function replaceBlock(text, lines) {
  const all = text.split("\n");
  const start = all.findIndex(l => l.includes(START_MARK));
  if (start < 0) throw new Error(`README に目印の行がありません：${START_MARK}`);
  let end = start + 1;
  while (end < all.length && !/^    trk\d+  /.test(all[end])) {
    if (all[end].trim() !== "") throw new Error("一覧の前に、想定していない行があります（README を手で直した？）");
    end++;
  }
  let last = end;
  while (last < all.length && /^    trk\d+  /.test(all[last])) last++;
  return [...all.slice(0, start + 1), "", ...lines, ...all.slice(last)].join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const check = args.includes("--check");
  const fromArg = args.find(a => a.startsWith("--from="));
  const from = fromArg ? Number(fromArg.split("=")[1]) : FROM;

  const handoff = fs.readFileSync(path.join(ROOT, HANDOFF), "utf8");
  const versions = handoffVersions(handoff, from);
  const expected = versionLines(versions);

  if (check) {
    const readme = fs.readFileSync(path.join(ROOT, README), "utf8");
    const got = readmeBlock(readme);
    const same = got && got.length === expected.length && got.every((l, i) => l === expected[i]);
    if (!same) {
      console.error(`✗ ${README} の一覧が docs/HANDOFF.md §7 とずれています`);
      const n = Math.max(got ? got.length : 0, expected.length);
      for (let i = 0; i < n; i++) {
        if ((got && got[i]) !== expected[i]) {
          console.error(`  ${i + 1}: README=${JSON.stringify(got ? got[i] : null)}`);
          console.error(`     HANDOFF=${JSON.stringify(expected[i])}`);
        }
      }
      process.exit(1);
    }
    console.log(`✓ ${README} の一覧は docs/HANDOFF.md §7 と一致（trk${versions[0].v}〜trk${versions[versions.length - 1].v}・${expected.length} 行）`);
    return;
  }

  if (write) {
    const file = path.join(ROOT, README);
    const before = fs.readFileSync(file, "utf8");
    const after = replaceBlock(before, expected);
    if (after !== before) fs.writeFileSync(file, after);
    console.log(`✓ ${README} の一覧を書き換えました（${expected.length} 行）`);
    return;
  }

  for (const l of expected) console.log(l);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

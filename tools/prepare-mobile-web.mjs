#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/**
 * Stage the same static web app used by GitHub Pages for Capacitor.
 * The output is ignored because it is a generated copy consumed by `cap sync`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "mobile-web");
const files = [
  "index.html",
  "privacy.html",
  "credits.html",
  "manifest.webmanifest",
  "sw.js",
  "verified.json",
  "NOTICE.md",
  "LICENSE"
];
const directories = ["assets", "css", "icons", "js"];
/* 🗂 trk256（M2）：docs は**丸ごと写さない**。開発文書（HANDOFF・レビュー記録など 70 本・約 2.2 MB）は
   アプリには要らず、`cap sync` で端末へ入る容量を増やすだけでした。利用者向けの
   `docs/guide/`（4 言語の説明）と `docs/ADDONS.md`（追加機能の説明）だけを写します。
   ⚠ 利用者向けの文書を足したら、この一覧に1行足してください（増やし忘れは check-repo が見ます）。 */
const docsFiles = ["docs/ADDONS.md"];
const docsDirectories = ["docs/guide"];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const rel of files) {
  const source = path.join(root, rel);
  if (!fs.existsSync(source)) throw new Error(`Missing web file: ${rel}`);
  const destination = path.join(out, rel);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}
for (const rel of directories) {
  const source = path.join(root, rel);
  if (!fs.existsSync(source)) throw new Error(`Missing web directory: ${rel}`);
  fs.cpSync(source, path.join(out, rel), { recursive: true });
}
for (const rel of [...docsFiles, ...docsDirectories]) {
  const source = path.join(root, rel);
  if (!fs.existsSync(source)) throw new Error(`Missing documentation: ${rel}`);
  const destination = path.join(out, rel);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (fs.statSync(source).isDirectory()) fs.cpSync(source, destination, { recursive: true });
  else fs.copyFileSync(source, destination);
}

console.log(`Prepared ${files.length} files, ${directories.length} directories and docs (${docsFiles.length} files + ${docsDirectories.length} directories) in ${path.relative(root, out)}/`);

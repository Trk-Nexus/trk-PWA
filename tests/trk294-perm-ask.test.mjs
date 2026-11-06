// SPDX-License-Identifier: GPL-3.0-or-later
/* trk294：楽曲フォルダーの許可の仕組み。
   ・「許可しない」を選んだあとも、拒否の直し方が出る（黙って失敗しない）
   ・許可のワンボタンは設定でオン・初期オフ（オンのときだけ・覚えたフォルダーがあるときだけ出る）
   ・ボタンは 1 タップ＝1 本だけ requestPermission する。拒否（denied）なら再依頼しない
   ・文言は 4 言語とも揃っている */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const core = read("js/core.js");
const lib = read("js/library.js");
const html = read("index.html");
const i18n = read("js/i18n.js");

test("許可のワンボタンの設定は、初期オフ（今までの画面のまま）", () => {
  assert.ok(core.includes("permAskBtn: prefs.permAskBtn === true"), "読み込みは真のときだけオン");
});

test("設定パネルに、チェック・説明・ボタン（初期は隠す）がある", () => {
  for (const id of ["permAskBtnChk", "permAskBtnHint", "permAskBtn"]) {
    assert.ok(html.includes(`id="${id}"`), `${id} がある`);
  }
  assert.match(html, /id="permAskBtn"[^>]*hidden/, "ボタンは既定で隠す");
});

test("表示は設定オン・覚えたフォルダーがあるときだけ", () => {
  const m = /askBtn\.hidden = !\(core\.settings\.permAskBtn === true && \(libHandle \|\| \(typeof sharedFolders !== "undefined" && sharedFolders\.length\)\)\);/.exec(lib);
  assert.ok(m, "syncShareUI で表示を決める");
});

test("ボタンは 1 タップで、まだ許可が要る 1 本だけを requestPermission する", () => {
  const start = lib.indexOf("async function askFolderPermissionNow()");
  assert.ok(start > 0, "関数がある");
  const body = lib.slice(start, lib.indexOf("\nfunction armFolderAutoRead()", start));
  assert.equal((body.match(/requestPermission\(/g) || []).length, 1, "requestPermission は 1 回だけ（ループの中で 1 本）");
  assert.match(body, /if \(q !== "granted"\) \{ target = h; state = q; break; \}/, "最初の 1 本で止める");
});

test("拒否（denied）のときは再依頼せず、直し方を出す", () => {
  const start = lib.indexOf("async function askFolderPermissionNow()");
  const body = lib.slice(start, lib.indexOf("\nfunction armFolderAutoRead()", start));
  const denied = body.indexOf('state === "denied"');
  const request = body.indexOf("requestPermission(");
  assert.ok(denied > 0 && denied < request, "denied の分岐は requestPermission より前");
  assert.match(body.slice(denied, request), /folderPermDenied/, "直し方の文言");
});

test("「いま読み取る」の拒否も、黙って libDenied だけにしない", () => {
  assert.match(lib, /if \(p === "denied"\) \{ core\.setStatus\("libShareStatus", "folderPermDenied", \{ name:h\.name \}\)/);
  assert.match(lib, /r === "denied" \? "folderPermDenied" : "libDenied"/);
});

test("チェックの変更は設定を保存して表示を合わせる", () => {
  assert.match(lib, /core\.settings\.permAskBtn = !!permAskBtnChk\.checked;\s*core\.saveUserPrefs\(\);\s*syncShareUI\(\);/);
  assert.match(lib, /permAskBtn\.addEventListener\("click", \(\) => \{ void askFolderPermissionNow\(\); \}\)/);
});

test("新しい文言は 4 言語とも揃っている", () => {
  for (const key of ["permAskBtnChk", "permAskBtnHint", "permAskBtn", "permAskGranted", "permAskNotNow", "permAskNoFolder"]) {
    const n = (i18n.match(new RegExp(`\\b${key}:`, "g")) || []).length;
    assert.equal(n, 4, `${key} は 4 言語`);
  }
});

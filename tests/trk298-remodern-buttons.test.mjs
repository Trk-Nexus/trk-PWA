// SPDX-License-Identifier: GPL-3.0-or-later
/* trk298：書斎・基地の「🎨 スキン」ボタン（段階2の項目2）。
   見張ること：
   ・既定はオフ（remodernIcons は true のときだけ）。書斎・基地のボタンは既定で隠れる
   ・書斎のボタンは文字つき・hidden・data-remodern-open="study"。基地は media-player-mode.js で設定オンのときだけ作る
   ・ダイアログに目に見える閉じるボタン（#remodernDlgClose）があり、保存は 1 領域（setRegion）
   ・文言 4 言語に新しい鍵がそろう */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const html = read("index.html");
const core = read("js/core.js");
const ui = read("js/remodern-ui.js");
const media = read("js/media-player-mode.js");
const i18n = read("js/i18n.js");
const css = read("css/style.css");

test("既定はオフ。設定の値は真のときだけ効く", () => {
  assert.match(core, /remodernIcons: prefs\.remodernIcons === true,/);
});

test("書斎のボタンは文字つき・既定で隠れ・領域は study", () => {
  const m = html.match(/<button id="studyRemodernBtn"[^>]*>/);
  assert.ok(m, "書斎のボタンがある");
  assert.ok(m[0].includes('data-remodern-open="study"'));
  assert.ok(m[0].includes(" hidden"), "既定は隠す");
  assert.ok(m[0].includes('data-i18n="studyRemodernBtn"'), "文字つき");
  assert.ok(html.indexOf('id="studyRemodernBtn"') < html.indexOf('id="studyHeaderSettingsBtn"'), "⚙ 設定の前");
});

test("基地のボタンは作るが、既定は隠す（trk301：一度だけ作られるため、出し入れは render が行う）", () => {
  assert.match(media, /skinBtn\.dataset\.remodernOpen = "base"/);
  assert.match(media, /skinBtn\.hidden = core\.settings\.remodernIcons !== true;/);
  assert.match(media, /skinBtn\.dataset\.i18n = "remodernOpenBtn"/, "言語を替えても文言が替わる");
});

test("ダイアログに目に見える閉じるボタンがあり、1 領域だけを変える", () => {
  assert.ok(/<dialog id="remodernDialog"/.test(html));
  assert.ok(html.includes('id="remodernDlgClose"'));
  assert.ok(ui.includes('dlgClose.addEventListener("click", () => dlg.close())'));
  assert.ok(ui.includes("R.apply(current(), region, mode, work)"));
  assert.ok(ui.includes('closest("[data-remodern-open]")'), "ボタンは共通の処理で拾う");
});

test("隠す指定が効く（display を上書きしない）", () => {
  assert.ok(css.includes(".study-file-btn[hidden], .remodernOpenMedia[hidden] { display: none; }"));
});

test("文言 4 言語に新しい鍵がそろう（書斎の鍵は study-room.js の TEXT）", () => {
  const room = read("js/study-room.js");
  assert.equal(room.split("studyRemodernBtn:").length - 1, 4, "書斎の鍵は 4 言語に 1 つずつ");
  const keys = ["remodernOpenBtn", "remodernIconsChk", "remodernIconsHint", "remodernDlgTitle",
    "remodernDlgHint", "remodernDlgMode", "remodernDlgWork", "remodernDlgClose"];
  for (const k of keys) assert.equal(i18n.split(`${k}:`).length - 1, 4, `${k} は 4 言語に 1 つずつ`);
});

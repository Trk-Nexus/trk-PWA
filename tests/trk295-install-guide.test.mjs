// SPDX-License-Identifier: GPL-3.0-or-later
/* trk295：設定の「📲 trkをインストール」と「📖 毎回許可の選び方」。
   ・インストールのボタンは設定の「更新」の次にある。確認は1回のタップの中で出す
   ・iPhone は既存のホーム画面の案内を開く。インストール済みは案内を隠す
   ・毎回許可の選び方は 📤 の中にあり、文言は 4 言語とも揃っている */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const html = read("index.html");
const app = read("js/app-install.js");
const i18n = read("js/i18n.js");

test("設定に「trkをインストール」の項目とボタン・状態がある（更新の次）", () => {
  const up = html.indexOf('id="updatePanel"');
  const ins = html.indexOf('id="installPanel"');
  assert.ok(up > 0 && ins > up, "更新の次");
  assert.ok(html.includes('id="appInstallBtn"'), "ボタン");
  assert.ok(html.includes('id="appInstallState"'), "状態の行");
  assert.match(html, /id="appInstallBtn"[^>]*data-i18n="appInstallBtn"/);
});

test("インストールのスクリプトは ios-pwa の後に読み込まれる", () => {
  const ios = html.indexOf('src="js/ios-pwa.js"');
  const app2 = html.indexOf('src="js/app-install.js"');
  assert.ok(ios > 0 && app2 > ios, "ios-pwa の後");
});

test("インストールの処理：確認はボタンのタップの中で、iPhone は既存の案内を開く", () => {
  assert.ok(app.includes('"beforeinstallprompt"'), "確認の受け取り");
  assert.ok(app.includes('"appinstalled"'), "インストール後の反映");
  assert.ok(/ask\.prompt\(\)/.test(app), "prompt() を押したときに呼ぶ");
  assert.ok(app.includes('getElementById("iosInstallBtn")'), "iPhone は既存の案内");
  assert.ok(app.includes("standalone()"), "インストール済みは案内を隠す");
  assert.ok(app.includes('event.preventDefault()'), "既定の小さな案内は出さない");
});

test("毎回許可の選び方は 📤 の中にあり、説明が 3 択と直し方を含む", () => {
  const share = html.indexOf('id="permAskBtn"');
  const guide = html.indexOf('id="permGuide"');
  assert.ok(share > 0 && guide > share, "許可のボタンの下");
  for (const k of ["permGuideSummary", "permGuideLead", "permGuideStep1", "permGuideStep2", "permGuideStep3", "permGuideStep4", "permGuideTip"]) {
    assert.ok(html.includes(`data-i18n="${k}"`), `${k} を画面に置く`);
  }
});

test("文言は 4 言語とも揃っている", () => {
  const keys = ["secInstall", "installHint", "appInstallBtn", "appInstallDone", "appInstallHint", "appInstallFallback",
    "appInstallIos", "appInstallAccepted", "appInstallDismissed", "permGuideSummary", "permGuideLead",
    "permGuideStep1", "permGuideStep2", "permGuideStep3", "permGuideStep4", "permGuideTip"];
  const langs = ["ja", "en", "zh", "ko"].map(l => {
    const start = i18n.indexOf(`\n  ${l}: {`);
    assert.ok(start > 0, `${l} がある`);
    return { l, start };
  });
  for (const { l, start } of langs) {
    const next = langs.find(x => x.start > start);
    const body = i18n.slice(start, next ? next.start : i18n.length);
    for (const k of keys) assert.ok(new RegExp(`\\b${k}:`).test(body), `${l} に ${k}`);
  }
});

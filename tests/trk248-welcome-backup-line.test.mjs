// SPDX-License-Identifier: GPL-3.0-or-later
/* trk248: PWA Phase 4 の ②＝初回案内に「保存はこの端末だけ」の1行を足す

   下書き（docs/PHASE4-ONBOARDING-BACKUP-2026-11-01.md §2）は2行の案だったが、
   **1行目（ネット無しで遊べる話＝`welcomeOffline`）はすでに実在した**。
   足りていなかったのは「保存はこの端末の中だけで、自動では他の端末へ移らない。
   移すときは trk247 の 📤📥 を使う」の1行。
   新しいダイアログは作らない（閉じる導線・a11y・4言語を増やさない方針）。 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ROOT } from "./helpers/browser-data.mjs";

const html = fs.readFileSync(`${ROOT}/index.html`, "utf8");
const i18n = fs.readFileSync(`${ROOT}/js/i18n.js`, "utf8");
const main = fs.readFileSync(`${ROOT}/js/main.js`, "utf8");
const sw = fs.readFileSync(`${ROOT}/sw.js`, "utf8");

/* #welcomeBox の塊（`<div id="welcomeBox"` から対応する閉じまで＝次の `id="guideCelebrate"` まで） */
const welcomeBox = html.slice(html.indexOf('<div id="welcomeBox"'), html.indexOf('<div id="guideCelebrate"'));

describe("初回案内の1行", () => {
  test("welcomeBackup が列表の中にある（新しい dialog を増やさない）", () => {
    assert.match(welcomeBox, /<li data-i18n="welcomeBackup"><\/li>/);
    const list = welcomeBox.slice(welcomeBox.indexOf('<ul class="welcomeList">'), welcomeBox.indexOf("</ul>"));
    assert.ok(list.indexOf("welcomeOffline") < list.indexOf("welcomeBackup"), "オフラインの話の直後に置く");
    assert.equal((html.match(/id="welcomeBox"/g) || []).length, 1, "初回案内は1枚のまま");
    assert.equal((welcomeBox.match(/role="dialog"/g) || []).length, 1, "dialog はこの1つだけ");
    assert.match(welcomeBox, /aria-labelledby="welcomeTitle"/, "a11y の名前もそのまま");
  });

  test("ネット無しで遊べる話は trk248 の前に入っていた（welcomeOffline を消していない）", () => {
    assert.match(welcomeBox, /<li data-i18n="welcomeOffline"><\/li>/);
    assert.equal((i18n.match(/\bwelcomeOffline:/g) || []).length, 4, "welcomeOffline は4言語のまま");
  });

  test("4言語ぞろい・自動では移らないと各言語で言い切る", () => {
    const texts = [...i18n.matchAll(/welcomeBackup:"([^"]*)"/g)].map(m => m[1]);
    assert.equal(texts.length, 4, "welcomeBackup は4言語");
    const saysNoAuto = [
      t => t.includes("自動では"),        // ja
      t => /on its own|by itself/.test(t), // en
      t => t.includes("自动"),             // zh
      t => t.includes("자동"),             // ko
    ];
    texts.forEach((t, i) => assert.ok(saysNoAuto[i](t), `自動で移らない旨が4言語目まで在る（${i}）`));
  });

  test("書き出し→読み込みの順で、場所を ⚙ → 💾 指している", () => {
    const texts = [...i18n.matchAll(/welcomeBackup:"([^"]*)"/g)].map(m => m[1]);
    for (const t of texts) {
      assert.ok(t.includes("⚙") && t.includes("💾"), "場所の名前を出す（🛟 緊急復旧にしか無い、はもう古い）");
      const out = t.indexOf("📤"), inn = t.indexOf("📥");
      assert.ok(out > 0 && inn > 0 && out < inn, "📤 が出てから 📥 の順");
    }
  });

  test("列表の1項目として読み切れる長さ", () => {
    for (const t of [...i18n.matchAll(/welcomeBackup:"([^"]*)"/g)].map(m => m[1])) {
      assert.ok(t.length <= 130, `長すぎない（実測 ${t.length} 文字）`);
    }
  });
});

describe("値と導線（増やさない）", () => {
  test("保存する値は welcomeSeen のまま（案内のための新しい設定キーを作らない）", () => {
    assert.match(main, /core\.settings\.welcomeSeen = true; core\.saveUserPrefs\(\);/);
    assert.ok(!/settings\.welcomeBackup|welcomeBackupSeen/.test(main + html), "案内1行のために値を増やさない");
    assert.ok(!/localStorage\.setItem\("welcome/.test(main), "localStorage のキーを増やさない");
  });

  test("🛟 緊急復旧の「ようこそをもう一度」で出し直せる（既成の導線）", () => {
    assert.match(main, /core\.\$\("emergencyWelcomeBtn"\)\.addEventListener\("click", \(\) => \{ core\.settings\.welcomeSeen = false; core\.saveUserPrefs\(\); welcomeShow\(\); \}\);/);
    assert.ok(html.includes('id="emergencyWelcomeBtn"'), "🛟 側にボタンが在る");
  });

  test("cache 名を上げた（index.html と i18n を変えたので）", () => {
    assert.match(sw, /const CACHE = "trk-v2026\.11\.01-trk2(4[89]|\d\d)";/, "trk248 以降の版名");
  });
});

// SPDX-License-Identifier: GPL-3.0-or-later
/* 📚 trk326 M4：R-SKIN-1（旧配色 legacyColors と差し戻しの単一定義）と R-WIZ-1（Advance Wizard 設定・統合マニフェスト）

   守りたい約束：
     ・旧配色は「利用者がオンにしたスキン」だけ。既定は目録の新配色（コントラスト適合後）。
     ・旧配色の色が 1 つでも読めなければ、旧配色ごと作らない（中途半端に混ぜない）。
     ・差し戻しの一覧は 1 か所（tools/skin-holdback.mjs）。意図的低可読と調整待ちを区別して出す。
     ・Advance Wizard 設定は禁止文字（` \ .. ~ C:）を含むキー・語を拒否し、辞書は上限まで。
     ・統合マニフェストは未知の futureSlots を読み飛ばす（前方互換）。通信はしない。 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./helpers/browser-data.mjs";
import { SKIN_HOLDBACK, holdbackIds, holdbackByKind, diffHoldback, holdbackSummary } from "../tools/skin-holdback.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");

describe("R-SKIN-1：旧配色（legacyColors）", () => {
  test("差し戻しの単一定義は、生成物の一覧と一致し、種類を分けて出せる", () => {
    const generated = ["gold-chip", "house-edge", "orichalcum"];
    const drift = diffHoldback(generated);
    assert.deepEqual(drift.missingInGenerated, []);
    assert.deepEqual(drift.unknownInGenerated, []);
    assert.deepEqual(holdbackByKind("intentional-low"), ["house-edge"]);
    assert.deepEqual(holdbackByKind("pending"), ["gold-chip", "orichalcum"]);
    assert.equal(holdbackIds().length, 3);
    assert.ok(holdbackSummary().includes("intentional-low") && holdbackSummary().includes("pending"));
    /* 生成物（js/skins-volumes.js）の一覧と、定義の ID が同じ */
    const vols = read("js/skins-volumes.js");
    const m = /D\.SKIN_HOLDBACK = \[([^\]]*)\]/.exec(vols);
    assert.ok(m);
    const ids = [...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1]).sort();
    assert.deepEqual(ids, holdbackIds());
  });

  test("両方の道具が単一定義を読む（別々の一覧を持たない）", () => {
    const check = read("tools/check-skin-contrast.mjs");
    const gen = read("tools/import-skin-catalog.mjs");
    for (const src of [check, gen]) assert.ok(src.includes('from "./skin-holdback.mjs"'));
    assert.equal((check.match(/SKIN_HOLDBACK\s*=\s*\[/g) || []).length, 0, "検める側は一覧を持たない");
    assert.equal((gen.match(/SKIN_HOLDBACK\s*=\s*\[/g) || []).length, 0, "書く側も一覧を持たない");
  });

  test("生成する側は legacyColors から legacyUi を作る（1 つでも読めなければ作らない）", () => {
    const gen = read("tools/import-skin-catalog.mjs");
    assert.ok(gen.includes("function legacyUiOf("));
    assert.ok(gen.includes('lines.push("    legacyUi:"'));
    assert.ok(gen.includes("if (legacy) { skin.legacyColors = s.legacyColors; skin.legacyUi = legacy; }"));
  });

  test("本体：旧配色は「この端末でオンにしたスキン」だけ・既定は新配色", () => {
    const core = read("js/core.js");
    assert.ok(core.includes("skinLegacy: cleanSkinIdList(prefs.skinLegacy, 300)"));
    assert.ok(core.includes("const legacyOn = s.legacyUi && Array.isArray(settings.skinLegacy)"));
    assert.ok(core.includes("const uiSet = legacyOn ? Object.assign({}, s.ui, s.legacyUi) : s.ui;"));
    assert.ok(core.includes("for (const [k, v] of Object.entries(uiSet)) root.setProperty(k, v);"));
    assert.ok(core.includes('"skinLegacy"'), "設定の読み込みにも入れる");
    const html = read("index.html");
    assert.ok(html.includes('id="skinLegacyList"') && html.includes('id="skinLegacyList"'));
    const custom = read("js/custom.js");
    assert.ok(custom.includes("function renderSkinLegacyList()"));
    const i18n = read("js/i18n.js");
    for (const key of ["skinLegacyLabel", "skinLegacyHint", "skinLegacyOn", "skinLegacyOff"]) {
      assert.equal((i18n.match(new RegExp(`\\b${key}:`, "g")) || []).length, 4, key);
    }
  });

  test("受け子（library-receiver）も旧配色を検証して ui にする", () => {
    const src = read("js/library-receiver.js");
    assert.ok(src.includes("legacyColors"));
    assert.ok(src.includes("legacyUi"));
  });
});

describe("R-WIZ-1：Advance Wizard 設定と統合マニフェスト", () => {
  test("CLI は禁止文字を拒否し、辞書と真偽を settings.cliAdvance に置く", () => {
    const cli = read("js/cli.js");
    assert.ok(cli.includes('"trk-avatar-library-advance-prefs"'));
    assert.ok(cli.includes("function importAdvancePrefs("));
    assert.ok(cli.includes("function advancePrefs("));
    assert.ok(cli.includes("core.settings.cliAdvance = {"));
    const core = read("js/core.js");
    assert.ok(core.includes("cliAdvance:"), "設定の読み込み");
    assert.ok(core.includes('"cliAdvance"'), "設定の読み込みの手当て");
  });

  test("マニフェストは受け子を通し、未知の futureSlots を読み飛ばす", () => {
    const cat = read("js/pack-catalog.js");
    assert.ok(cat.includes('"trk-avatar-library-manifest"'));
    assert.ok(cat.includes("function readLibraryManifest("));
    assert.ok(cat.includes("LR.readLibraryManifest(raw)"));
    const lr = read("js/library-receiver.js");
    assert.ok(lr.includes("futureSlots"));
  });
});

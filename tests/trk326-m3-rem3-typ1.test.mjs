// SPDX-License-Identifier: GPL-3.0-or-later
/* 🔤 trk326 M3：R-REM-3（書斎・基地の独立オプトイン）と R-TYP-1（組み合わせ単体 JSON）

   守りたい約束：
     ・書斎・基地は、利用者がオンにした領域だけ作品の配色を当てる（既定はオフ＝元の読書テーマのまま）。
     ・オプトインの保存は真偽だけ。壊れた値はオフに落ちる。
     ・組み合わせ JSON は書式・版・書体名（Trk*）・パック名を検証してから使う。
     ・取り込んだ組は settings.typography に残り、次に開いても同じ組で復元できる。
     ・足りない .stpack の名前を具体的に出す（自動では取りに行かない）。 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const same = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));

describe("R-REM-3：書斎・基地の独立オプトイン", () => {
  const sandbox = { globalThis: null };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read("js/remodern-regions.js"), sandbox);
  const R = sandbox.TrkReModernRegions;
  const WORK = { id: "trk-re-modern-pixel-console", regions: ["common", "study", "base"], colors: { bg: "#0b0f14" } };
  const CATALOG = { [WORK.id]: WORK };

  test("既定はどちらもオフ（作品の配色を当てない）", () => {
    same(R.defaultOptIn(), { study: false, base: false });
    const s = R.setRegion(R.setRegion(R.setRegion(R.defaultState(), "common", "own", WORK.id), "study", "own", WORK.id), "base", "own", WORK.id);
    const view = R.resolve(s, CATALOG, R.defaultOptIn());
    assert.equal(view.common.source, "own", "共通はいままでどおり当たる");
    assert.equal(view.study.source, "keep");
    assert.equal(view.study.fallback, "region-opt-out");
    assert.equal(view.study.wanted, WORK.id, "選んだ作品は残る（消さない）");
    assert.equal(view.base.source, "keep");
    assert.equal(view.base.optOut, true);
  });

  test("オンにした領域だけ当たる（片方だけでもよい）", () => {
    const s = R.setRegion(R.setRegion(R.defaultState(), "study", "own", WORK.id), "base", "own", WORK.id);
    const onlyStudy = R.resolve(s, CATALOG, R.studyOptIn(R.defaultOptIn(), true));
    assert.equal(onlyStudy.study.source, "own");
    assert.equal(onlyStudy.base.source, "keep");
    const both = R.resolve(s, CATALOG, { study: true, base: true });
    assert.equal(both.study.source, "own");
    assert.equal(both.base.source, "own");
  });

  test("follow も同じ（共通の作品を、オンの領域にだけ連動させる）", () => {
    let s = R.setRegion(R.defaultState(), "common", "own", WORK.id);
    s = R.setRegion(s, "study", "follow", null);
    assert.equal(R.resolve(s, CATALOG, R.defaultOptIn()).study.source, "keep");
    assert.equal(R.resolve(s, CATALOG, R.baseOptIn({ study: true, base: false }, true)).study.source, "follow");
  });

  test("optIn を渡さない呼び出しは、これまでどおり（純粋な道具の互換）", () => {
    const s = R.setRegion(R.defaultState(), "study", "own", WORK.id);
    assert.equal(R.resolve(s, CATALOG).study.source, "own");
  });

  test("オプトインの読み書きは真偽だけ・元の値を壊さない", () => {
    same(R.normalizeOptIn(null), { study: false, base: false });
    same(R.normalizeOptIn({ study: "yes", base: 1 }), { study: false, base: false });
    same(R.normalizeOptIn({ study: true, base: true, other: true }), { study: true, base: true });
    const before = R.defaultOptIn();
    same(R.regionOptIn(before, "study", true), { study: true, base: false });
    same(before, { study: false, base: false }, "渡した値を書き換えない");
    same(R.regionOptIn(before, "common", true), { study: false, base: false }, "共通は対象外");
  });

  test("画面と保存の配線（チェック・設定・影響の文）", () => {
    const html = read("index.html");
    assert.ok(html.includes('id="remodernOptInStudy"') && html.includes('id="remodernOptInBase"'));
    const ui = read("js/remodern-ui.js");
    assert.ok(ui.includes("R.resolve(state, works(), optIn())"));
    assert.ok(ui.includes("R.regionOptIn(before, region, on === true)"));
    const core = read("js/core.js");
    assert.ok(core.includes("remodernOptIn:"));
    assert.ok(core.includes('"remodernOptIn"'), "設定の読み込みにも入れる");
    const i18n = read("js/i18n.js");
    for (const key of ["remodernOptInStudy", "remodernOptInBase", "remodernOptInHint", "remodernOptOutImpact"]) {
      assert.equal((i18n.match(new RegExp(`\\b${key}:`, "g")) || []).length, 4, key);
    }
  });
});

describe("R-TYP-1：組み合わせ単体 JSON（trk-typography-pairing v1）", () => {
  function loadTypography(fontsOk) {
    const sandbox = {
      console, JSON, Math, Object, Array, String, Number, Boolean, Date, Set, Map, Error, RegExp, Intl,
      parseInt, parseFloat, isNaN, isFinite, document: {
        body: { classList: { add() { }, remove() { } } },
        documentElement: { style: { setProperty() { }, removeProperty() { } } },
        fonts: { check: () => fontsOk === undefined ? true : fontsOk }
      },
      window: {}
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(read("js/typography.js"), sandbox);
    return { T: sandbox.Trk.typography, sandbox };
  }
  const raw = () => ({
    format: "trk-typography-pairing", version: 1, id: "shinbun-imp", name: "新聞の顔（取り込み）", scale: "1.25",
    trkUse: "オーソドックスな和風曲",
    requiredPacks: ["font-packs/noto-sans-jp.stpack", "font-packs/noto-serif-jp.stpack"],
    slots: {
      display: { pack: "font-packs/noto-serif-jp.stpack", family: "TrkNotoSerifJP", weight: 700 },
      heading: { pack: "font-packs/noto-serif-jp.stpack", family: "TrkNotoSerifJP", weight: 700 },
      body: { pack: "font-packs/noto-sans-jp.stpack", family: "TrkNotoSansJP", weight: 400 }
    },
    tracking: { display: 0, body: 0.02 }, leading: { display: 1.1, body: 1.8 }
  });

  test("正しい組を読み、保存の形に残る（次に開いても同じ組）", () => {
    const { T } = loadTypography();
    const r = T.pairingFromJson(raw());
    assert.equal(r.ok, true, r.reason);
    assert.equal(r.value.name, "新聞の顔（取り込み）");
    assert.equal(JSON.stringify(r.value.packs), JSON.stringify(["noto-sans-jp.stpack", "noto-serif-jp.stpack"]));
    const saved = T.sanitize({ pairing: "custom", custom: r.value, preset: "pair" });
    assert.equal(saved.pairing, "custom");
    assert.equal(saved.slots.display.family, "TrkNotoSerifJP");
    assert.equal(saved.slots.body.pack, "noto-sans-jp.stpack");
    /* 保存 → 読み直しでも、名前・パック・役が残る */
    const again = T.sanitize(JSON.parse(JSON.stringify(saved)));
    assert.equal(again.pairing, "custom");
    assert.equal(T.nameOf(again), "新聞の顔（取り込み）");
    assert.equal(again.slots.body.family, "TrkNotoSansJP");
  });

  test("書式・版・書体名・パック名の違反は受けない", () => {
    const { T } = loadTypography();
    assert.equal(T.pairingFromJson("{").reason, "parse");
    assert.equal(T.pairingFromJson({ ...raw(), format: "other" }).reason, "format");
    assert.equal(T.pairingFromJson({ ...raw(), version: 2 }).reason, "format");
    const badFamily = raw(); badFamily.slots.display.family = "Comic Sans";
    assert.equal(T.pairingFromJson(badFamily).ok, false);
    const badPack = raw(); badPack.requiredPacks = ["../../etc/passwd"];
    assert.equal(T.pairingFromJson(badPack).reason, "slots");
    const noSlots = raw(); noSlots.slots = {};
    assert.equal(T.pairingFromJson(noSlots).reason, "slots");
  });

  test("足りないパックの名前を出す（自動では取りに行かない）", () => {
    const { T } = loadTypography(false);
    const saved = T.sanitize({ pairing: "custom", custom: T.pairingFromJson(raw()).value });
    same(T.missingPacks(saved).slice().sort(), ["noto-sans-jp.stpack", "noto-serif-jp.stpack"].sort());
    const all = loadTypography(true);
    same(all.T.missingPacks(all.T.sanitize({ pairing: "custom", custom: all.T.pairingFromJson(raw()).value })), []);
  });

  test("取り込むと settings.typography に入り、保存に失敗したら元へ戻す", () => {
    const { T, sandbox } = loadTypography();
    let saved = 0, fail = false;
    sandbox.Trk.core = {
      settings: { typography: null },
      saveUserPrefs() { saved++; return fail ? false : true; }
    };
    const ok = T.importPairing(raw());
    assert.equal(ok.ok, true, ok.reason);
    assert.equal(saved, 1);
    assert.equal(sandbox.Trk.core.settings.typography.pairing, "custom");
    same(ok.missing, []);
    /* 保存に失敗したときは、前の値へ戻す（メモリだけの「成功」にしない） */
    fail = true;
    const before = JSON.stringify(sandbox.Trk.core.settings.typography);
    const bad = T.importPairing({ ...raw(), name: "別の組" });
    assert.equal(bad.ok, false);
    assert.equal(bad.reason, "save");
    assert.equal(JSON.stringify(sandbox.Trk.core.settings.typography), before);
  });

  test("ファイルから読める。大きすぎる・読めないファイルは断る", async () => {
    const { T } = loadTypography();
    const text = JSON.stringify(raw());
    const ok = await T.importPairingFile({ size: text.length, text: async () => text });
    assert.equal(ok.ok, true, ok.reason);
    assert.equal((await T.importPairingFile({ size: 64 * 1024 + 1, text: async () => "" })).reason, "size");
    assert.equal((await T.importPairingFile({ size: 10, text: async () => { throw new Error("x"); } })).reason, "read");
  });

  test("画面（設定）から読める配線と、4 言語の文言", () => {
    const html = read("index.html");
    assert.ok(html.includes('id="typoImportBtn"') && html.includes('id="typoImportFile"') && html.includes('id="typoImportState"'));
    const ui = read("js/ui-prefs.js");
    assert.ok(ui.includes("Tt.importPairingFile(f)"));
    assert.ok(ui.includes('typoMissingPacks'));
    const typo = read("js/typography.js");
    assert.ok(typo.includes('"trk-typography-pairing"'));
    const i18n = read("js/i18n.js");
    for (const key of ["typoImportBtn", "typoImportDone", "typoImportMissing", "typoImportBad", "typoMissingPacks"]) {
      assert.equal((i18n.match(new RegExp(`\\b${key}:`, "g")) || []).length, 4, key);
    }
  });
});

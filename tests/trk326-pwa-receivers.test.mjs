// SPDX-License-Identifier: GPL-3.0-or-later
/* 📚 trk326：trk-Avatar-Library の受け子（要項 2026-11-27）の検証

   守りたい約束：
     ・R-VOL-1：巻別・単体スキン JSON の検証と、本体のスキン定義への変換。色は許可パターンだけ。
       readability: "intentional-low" と 4 言語の理由は落とさない。
     ・R-REM-2：退避封筒は state: "invalid" を自動復元しない（壊れた保存を書き戻さない）。
     ・R-TYP-1：書体の組み合わせ JSON。不足パックの具体名を出せる。
     ・R-WIZ-1：Advance Wizard 設定は禁止文字を厳格に拒否。統合マニフェストの futureSlots は読み飛ばす。
     ・補遺：re-modern 作品の退避（trk-re-modern-works-backup v1）。
     ・どれも外部へ取りに行かない（library-receiver.js に fetch / XMLHttpRequest を書かない）。 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const receiverSrc = read("js/library-receiver.js");

/* data.js（本体の色の道具）＋ library-receiver.js を、画面なしで読む */
function loadReceiver() {
  const sandbox = { console, Math, JSON, Object, Array, String, Number, Date, Set, Map, Error, RegExp, Intl, parseInt, parseFloat, isNaN, isFinite, window: {} };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read("js/data.js"), sandbox, { filename: "js/data.js" });
  vm.runInContext(receiverSrc, sandbox, { filename: "js/library-receiver.js" });
  return sandbox.Trk.libraryReceiver;
}
const R = loadReceiver();
/* vm の中で作られた値は試す側と別の世界の Object なので、比べる前に素の値へ写す */
const plain = v => JSON.parse(JSON.stringify(v));

const colors = {
  stage: "#101010", ink: "#e8e8e8", don: "#ff3355", ka: "#66ccff",
  text: "#e8e8e8", muted: "#a0a0a0", bg: "linear-gradient(180deg,#141414,#0a0a0a)",
  panel: "rgba(24,24,24,.96)", field: "#1a1a1a", button: "#2a2a2a",
  accent: "#ff3355", onAccent: "#ffffff", gold: "#ffcc66", border: "rgba(232,232,232,.18)"
};
const skin = (over) => Object.assign({
  id: "casino-royale",
  label: { ja: "カジノロワイヤル", en: "Casino Royale", zh: "赌场皇家", ko: "카지노 로열" },
  desc: { ja: "王族のような気高さ", en: "Royal dignity", zh: "王家般的尊贵", ko: "왕족 같은 고귀함" },
  cat: ["dark", "warm"], font: "\"Oswald\",sans-serif",
  type: { title: "\"Oswald\",sans-serif", weight: "700", lh: "1.3", titleWeight: "800", titleSpace: "-.03em", mark: "HOUSE WINS" },
  colors: { ...colors }, shapes: ["square", "square"], video: "grayscale(.8) contrast(1.3)"
}, over || {});
const volume = (skins, over) => Object.assign({ format: "trk-avatar-library-skins", version: 1, count: skins.length, skins }, over || {});

describe("R-VOL-1：巻別スキンの検証", () => {
  test("正しい巻は通り、14 色・4 言語・形・CLI を写す", () => {
    const res = R.validateVolumePayload(volume([skin({ cli: { cursor: "underline", opacity: 0.8 } })]));
    assert.equal(res.ok, true, res.errors.join("; "));
    assert.equal(res.count, 1);
    assert.equal(res.skins[0].id, "casino-royale");
    assert.deepEqual(plain(res.skins[0].shapes), ["square", "square"]);
    assert.equal(res.skins[0].cli.cursor, "underline");
    assert.equal(res.skins[0].cli.opacity, 0.8);
  });

  test("単体スキン（items/<id>.json）も 1 件の巻として受ける", () => {
    const res = R.validateVolumePayload(skin());
    assert.equal(res.ok, true, res.errors.join("; "));
    assert.equal(res.count, 1);
    assert.equal(res.single, true);
  });

  test("色は許可パターンだけ（url()・セミコロン・var() は通さない）", () => {
    for (const bad of ["url(https://example.com/x.png)", "red;}", "var(--x)", "#12345", "expression(alert(1))"]) {
      const res = R.validateVolumePayload(volume([skin({ colors: { ...colors, panel: bad } })]));
      assert.equal(res.ok, false, bad);
      assert.ok(res.errors.some(e => e.includes("colors.panel")), bad);
    }
  });

  test("4 言語が欠けた label / desc は拒否する", () => {
    const res = R.validateVolumePayload(volume([skin({ label: { ja: "だけ" } })]));
    assert.equal(res.ok, false);
    assert.ok(res.errors.some(e => e.includes("label")));
  });

  test("readability: intentional-low は 4 言語の理由とセットで保持し、警告を出す", () => {
    const reason = { ja: "暗く読みづらい演出です。", en: "Low contrast is intentional.", zh: "有意降低对比度。", ko: "어둡게 보이도록 의도했습니다." };
    const ok = R.validateVolumePayload(volume([skin({ readability: "intentional-low", readabilityReason: reason })]));
    assert.equal(ok.ok, true, ok.errors.join("; "));
    assert.equal(ok.skins[0].readability, "intentional-low");
    assert.deepEqual(plain(ok.skins[0].readabilityReason), reason);
    assert.ok(ok.warnings.some(w => w.includes("intentional-low")));
    /* 理由が欠けたら拒否・readability 無しの理由だけも拒否 */
    assert.equal(R.validateVolumePayload(volume([skin({ readability: "intentional-low" })])).ok, false);
    assert.equal(R.validateVolumePayload(volume([skin({ readabilityReason: reason })])).ok, false);
    /* 未知の readability 値は拒否 */
    assert.equal(R.validateVolumePayload(volume([skin({ readability: "low" })])).ok, false);
  });

  test("count の不一致・重複 ID・上限超えは拒否する", () => {
    assert.equal(R.validateVolumePayload(volume([skin()], { count: 2 })).ok, false);
    assert.equal(R.validateVolumePayload(volume([skin(), skin()])).ok, false);
    const many = Array.from({ length: 501 }, (_, i) => skin({ id: `s${i}` }));
    assert.equal(R.validateVolumePayload(volume(many)).ok, false);
  });

  test("ID の形（道の文字・.. など）は拒否する", () => {
    for (const bad of ["../etc/passwd", "a/b", "a\\b", "`x`", "", "1abc"]) {
      assert.equal(R.validateVolumePayload(volume([skin({ id: bad })])).ok, false, bad);
    }
  });
});

describe("R-VOL-1：本体のスキン定義への変換", () => {
  test("ui / game を作り、目録の色をそのまま使う（寄せない）", () => {
    const res = R.validateVolumePayload(volume([skin()]));
    const def = R.volumeSkinToDef(res.skins[0], { volume: "vol-07", at: 1234 });
    assert.equal(def.imported, true);
    assert.equal(def.importId, "casino-royale");
    assert.equal(def.importVolume, "vol-07");
    assert.equal(def.importedAt, 1234);
    assert.equal(def.ui["--ui-text"], "#e8e8e8");
    assert.equal(def.ui["--ui-accent"], "#ff3355");
    assert.equal(def.ui["--ui-bg"], "linear-gradient(180deg,#141414,#0a0a0a)");
    assert.equal(def.game.ink, "#e8e8e8");
    assert.equal(def.game.stage, "#101010");   /* stage は目録の 1 色のまま */
    /* 色は目録のまま：文字色がパネルと同化していても、勝手に黒/白へ寄せない */
    assert.equal(def.ui["--ui-text"], res.skins[0].colors.text);
    assert.deepEqual(plain(def.cat), ["dark", "warm"]);
    assert.equal(def.type.title, "\"Oswald\",sans-serif");
    assert.equal(def.cli, undefined);
  });

  test("意図的低コントラストの理由は、スキンの棚が読む位置（def.readability）に残る", () => {
    const res = R.validateVolumePayload(volume([skin({ readability: "intentional-low", readabilityReason: { ja: "あ", en: "a", zh: "阿", ko: "아" } })]));
    const def = R.volumeSkinToDef(res.skins[0], {});
    assert.equal(def.readability, "intentional-low");
    assert.equal(def.readabilityReason.ko, "아");
  });

  test("R-SKIN-1：legacyColors を持つスキンは旧配色の ui も作る", () => {
    const legacy = { bg: "#ffffff", panel: "#f0f0f0", text: "#111111", accent: "#cc0000", gold: "#aa7700" };
    const res = R.validateVolumePayload(volume([skin({ legacyColors: legacy })]));
    assert.equal(res.ok, true, res.errors.join("; "));
    const def = R.volumeSkinToDef(res.skins[0], {});
    assert.deepEqual(plain(def.legacyColors), legacy);
    assert.equal(def.legacyUi["--ui-text"], "#111111");
    assert.equal(def.legacyUi["--ui-accent"], "#cc0000");
    /* 既定は新しい配色（目録の色）のまま */
    assert.equal(def.ui["--ui-text"], "#e8e8e8");
    /* 旧配色に不正な色が混ざったら、旧配色ごと落とす（安全側） */
    const bad = R.validateVolumePayload(volume([skin({ legacyColors: { text: "url(x)" } })]));
    assert.equal(bad.ok, true);
    assert.equal(R.volumeSkinToDef(bad.skins[0], {}).legacyColors, undefined);
  });
});

describe("R-REM-2：題字書体・作品指定の退避封筒", () => {
  const envelope = (over) => Object.assign({ format: "trk-title-font-works-backup", version: 1, state: "ok", raw: JSON.stringify({ "trk-re-modern-pixel-console": { font: "galmuri", on: true } }) }, over || {});

  test("state=ok は復元でき、危険なキーは落とす", () => {
    const res = R.validateTitleFontWorksEnvelope(envelope());
    assert.equal(res.ok, true, res.errors.join("; "));
    assert.equal(res.restorable, true);
    assert.deepEqual(JSON.parse(res.raw), { "trk-re-modern-pixel-console": { font: "galmuri", on: true } });
    assert.equal(res.raw, JSON.stringify({ "trk-re-modern-pixel-console": { font: "galmuri", on: true } }));
    const risky = R.validateTitleFontWorksEnvelope(envelope({ raw: JSON.stringify({ "__proto__": { font: "galmuri", on: true }, "ok-work": "press" }) }));
    assert.equal(risky.ok, true);
    const parsed = JSON.parse(risky.raw);
    assert.equal(Object.prototype.hasOwnProperty.call(parsed, "__proto__"), false);
    assert.deepEqual(parsed["ok-work"], { font: "press", on: false });
  });

  test("state=invalid（緊急退避）は自動復元しない", () => {
    const res = R.validateTitleFontWorksEnvelope(envelope({ state: "invalid", raw: "{broken" }));
    assert.equal(res.ok, true);
    assert.equal(res.restorable, false);
    assert.equal(res.invalidState, true);
    assert.ok(res.warnings.length >= 1);
    assert.equal(res.raw, "");
  });

  test("format / version / state の違いと、上限超えは拒否する", () => {
    assert.equal(R.validateTitleFontWorksEnvelope(envelope({ format: "other" })).ok, false);
    assert.equal(R.validateTitleFontWorksEnvelope(envelope({ version: 2 })).ok, false);
    assert.equal(R.validateTitleFontWorksEnvelope(envelope({ state: "weird" })).ok, false);
    assert.equal(R.validateTitleFontWorksEnvelope(envelope({ raw: "x".repeat(256 * 1024 + 1) })).ok, false);
    assert.equal(R.validateTitleFontWorksEnvelope(envelope({ raw: "{not json" })).ok, false);
  });
});

describe("R-TYP-1：書体の組み合わせ単体 JSON", () => {
  const pairing = (over) => Object.assign({
    format: "trk-typography-pairing", version: 1, id: "shinbun", name: "新聞の顔", scale: "1.25",
    trkUse: "オーソドックスな和風曲",
    requiredPacks: ["font-packs/noto-sans-jp.stpack", "font-packs/noto-serif-jp.stpack"],
    slots: {
      display: { pack: "font-packs/noto-serif-jp.stpack", family: "TrkNotoSerifJP", weight: 700 },
      body: { pack: "font-packs/noto-sans-jp.stpack", family: "TrkNotoSansJP", weight: 400 },
      heading: { pack: "font-packs/noto-serif-jp.stpack", family: "TrkNotoSerifJP" }
    },
    tracking: { display: 0, body: 0.02 }, leading: { display: 1.1, body: 1.8 }
  }, over || {});

  test("正しい組み合わせを受け、役とパックを写す", () => {
    const res = R.validateTypographyPairing(pairing());
    assert.equal(res.ok, true, res.errors.join("; "));
    assert.equal(res.pairing.id, "shinbun");
    assert.equal(res.pairing.slots.display.pack, "font-packs/noto-serif-jp.stpack");
    assert.deepEqual(plain(res.pairing.packs), ["font-packs/noto-sans-jp.stpack", "font-packs/noto-serif-jp.stpack"]);
    assert.equal(res.pairing.imported, true);
  });

  test("書体名は Trk* だけ・パックのパスは安全な形だけ", () => {
    assert.equal(R.validateTypographyPairing(pairing({ slots: { display: { family: "Comic Sans" }, body: { family: "TrkOk" } } })).ok, false);
    assert.equal(R.validateTypographyPairing(pairing({ requiredPacks: ["../../etc/passwd.stpack"] })).ok, false);
    assert.equal(R.validateTypographyPairing(pairing({ slots: { display: { family: "TrkA", pack: "x/../../y.stpack" }, body: { family: "TrkB" } } })).ok, false);
  });

  test("不足している書体と、入れるべき .stpack の名前を出せる", () => {
    const res = R.validateTypographyPairing(pairing());
    const report = R.missingPackReport(res.pairing, family => family !== "TrkNotoSerifJP");
    assert.deepEqual(plain(report.fonts), ["TrkNotoSerifJP"]);
    assert.deepEqual(plain(report.packs), ["font-packs/noto-serif-jp.stpack"]);
    /* 全部そろっていれば何も出さない */
    const none = R.missingPackReport(res.pairing, () => true);
    assert.deepEqual(plain(none), { fonts: [], packs: [] });
    /* パック名が分からないときは requiredPacks を出す */
    const generic = R.validateTypographyPairing(pairing({ slots: { display: { family: "TrkA" } } }));
    assert.deepEqual(plain(R.missingPackReport(generic.pairing, () => false).packs), ["font-packs/noto-sans-jp.stpack", "font-packs/noto-serif-jp.stpack"]);
  });
});

describe("R-WIZ-1：Advance Wizard 設定と統合マニフェスト", () => {
  test("禁止文字（` \\ .. ~ C:）を含むキー・語は拒否する", () => {
    const ok = R.validateAdvancePrefs({ format: "trk-avatar-library-advance-prefs", version: 1, advance: { completion: "tab", bell: true }, dictionary: ["skin terminal", "volume 30"] });
    assert.equal(ok.ok, true, ok.errors.join("; "));
    assert.deepEqual(plain(ok.dictionary), ["skin terminal", "volume 30"]);
    assert.equal(ok.advance.bell, true);
    for (const bad of ["C:/tmp", "a\\b", "..", "~/x", "`x`"]) {
      assert.equal(R.validateAdvancePrefs({ format: "trk-avatar-library-advance-prefs", version: 1, advance: { [bad]: "x" } }).ok, false, bad);
      assert.equal(R.validateAdvancePrefs({ format: "trk-avatar-library-advance-prefs", version: 1, dictionary: [bad] }).ok, false, bad);
    }
  });

  test("辞書の上限と型を守る", () => {
    const many = Array.from({ length: 501 }, (_, i) => `w${i}`);
    assert.equal(R.validateAdvancePrefs({ format: "trk-avatar-library-advance-prefs", version: 1, dictionary: many }).ok, false);
    assert.equal(R.validateAdvancePrefs({ format: "trk-avatar-library-advance-prefs", version: 1, dictionary: ["ok", 3] }).ok, false);
  });

  test("統合マニフェストは未知の futureSlots を読み飛ばす（前方互換）", () => {
    const manifest = {
      format: "trk-avatar-library-manifest", version: 1,
      pwaBaseline: { build: "trk325", commit: "e30eb2ce98490c94b7768dd2ddf768fab7fe726d" },
      indices: { skinsCatalog: { path: "catalog/skins.json", sha256: "a".repeat(64), bytes: 10 } },
      counts: { skins: 291, fonts: 29 },
      futureSlots: { mascot: { status: "deferred-until-requested", count: 0 }, someFutureThing: { status: "unknown", count: 3 } }
    };
    const res = R.readLibraryManifest(manifest);
    assert.equal(res.ok, true, res.errors.join("; "));
    assert.equal(res.counts.skins, 291);
    assert.equal(res.futureSlots.length, 2);
    assert.equal(res.futureSlots[0].status, "deferred-until-requested");
    assert.equal(res.pwaBaseline.build, "trk325");
  });
});

describe("補遺：re-modern 作品の退避", () => {
  test("trk-re-modern-works-backup v1 の形を検査する", () => {
    const ok = R.validateRemodernWorksBackup({ format: "trk-re-modern-works-backup", version: 1, exportedAt: 1, works: [{ id: "trk-re-modern-pixel-console", name: "x" }] });
    assert.equal(ok.ok, true, ok.errors.join("; "));
    assert.equal(ok.works.length, 1);
    assert.equal(R.validateRemodernWorksBackup({ format: "x", version: 1, works: [] }).ok, false);
    assert.equal(R.validateRemodernWorksBackup({ format: "trk-re-modern-works-backup", version: 2, works: [] }).ok, false);
    assert.equal(R.validateRemodernWorksBackup({ format: "trk-re-modern-works-backup", version: 1 }).ok, false);
  });
});

describe("配線（受け子は画面から呼べる）", () => {
  test("library-receiver.js は通信しない（fetch / XMLHttpRequest / WebSocket を書かない）", () => {
    assert.equal(/\bfetch\s*\(/.test(receiverSrc), false);
    assert.equal(/XMLHttpRequest/.test(receiverSrc), false);
    assert.equal(/WebSocket/.test(receiverSrc), false);
    assert.equal(/import\s*\(/.test(receiverSrc), false);
  });

  test("index.html は受け子を data.js の後・typography.js の前に読む", () => {
    const html = read("index.html");
    const recv = html.indexOf('src="js/library-receiver.js"');
    assert.ok(recv > html.indexOf('src="js/data.js"'), "after data.js");
    assert.ok(recv < html.indexOf('src="js/typography.js"'), "before typography.js");
    assert.ok(html.includes('id="skinImportFile"') && html.includes('id="skinImportPanel"'));
  });

  test("棚の分類・バッジ・巻名が配線されている", () => {
    const core = read("js/core.js");
    assert.ok(core.includes('s.custom || s.pack || s.imported'));
    assert.ok(core.includes('g.id === "imported"'));
    assert.ok(core.includes('skinImportedTag') && core.includes('skinLowReadTag'));
    assert.ok(core.includes('skinVolNameImported'));
    assert.ok(read("js/i18n.js").includes("skinVolNameImported:"));
  });

  test("custom.js が倉庫の書式名と保存領域を持つ（検査 CLI の目印）", () => {
    const custom = read("js/custom.js");
    assert.ok(custom.includes('"trk-avatar-library-skins"'));
    assert.ok(custom.includes("shadow_taiko_skin_imports"));
    assert.ok(custom.includes("importVolumePayload"));
    assert.ok(custom.includes("intentional-low"));
  });
});

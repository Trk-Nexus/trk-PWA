// SPDX-License-Identifier: GPL-3.0-or-later
/* 🔤 trk232：書体パックを、入れたら本当に効くようにする
 *
 *   これまで：trk-Avatar-Library の「丸ゴのお茶目（書体パック）」は目録に「書体2」と出るだけで、
 *   pack.json の "fonts" は sanitizeManifest が落としていた＝**中身の woff2 も保存されず、書体も変わらなかった**。
 *
 *   この版で入れたもの：
 *     ・pack.json の "fonts"（family・file・license・weight・style）を検証して受け付ける（woff2／woff・8書体まで）
 *     ・同梱の書体を他のファイルと同じように保存する（manifestPaths に font）
 *     ・使うときに FontFace で読み込み、document.fonts に足して --font の先頭へ
 *     ・外すときに document.fonts.delete ＋ objectURL の後片付け（--font も作り直す）
 *     ・"release" を保持する（目録の version と突き合わせて「更新あり」を出すため）
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const custom = read("js/custom.js");
const coreSrc = read("js/core.js");
const i18nSrc = read("js/i18n.js");

function between(src, startMarker, endMarker) {
  const a = src.indexOf(startMarker);
  const b = src.indexOf(endMarker, a + 1);
  assert.ok(a >= 0 && b > a, `isolate ${startMarker.slice(0, 48)}`);
  return src.slice(a, b);
}

/* ==== pack.json の検証だけを取り出して動かす（installer と同じ関数） ==== */
const manifestSource = between(custom, "const PACK_FORMAT = ", "const hasLook = m =>");
const extOf = p => String(p).split(".").pop().toLowerCase();
function manifestContext() {
  const ctx = vm.createContext({
    console, JSON, Math, Number, String, Object, Array, Set, isFinite,
    core: { extOf, baseName: p => String(p).split("/").pop(), num: (v, min, max) => { const n = Number(v); return Number.isFinite(n) && n >= min && n <= max ? n : 0; },
      storageLimitsIgnored: () => false },
    window: { Trk: { data: { DIFF_IDS: ["easy"], HEX: /^#[0-9a-f]{6}$/i, NOTE_SHAPES: ["circle", "diamond"],
      sanitizeSkinDef: d => d && d.colors ? { name: d.name, font: d.font || "default" } : null } } },
  });
  ctx.window.Trk.data.sanitizeSkinDef = d => d && d.colors ? { name: d.name, font: d.font || "default" } : null;
  vm.runInContext(`${manifestSource}\nglobalThis.sanitizeManifest = sanitizeManifest;\nglobalThis.manifestPaths = manifestPaths;\nglobalThis.PACK_LIMIT = PACK_LIMIT;`, ctx);
  return ctx;
}
const ctx = manifestContext();
const base = { format: "shadow-taiko-pack", name: "丸ゴのお茶目", author: "trk-Avatar-Library", release: "1.0.0" };

describe("trk232 書体の宣言（pack.json の fonts）", () => {
  test("family・file・license がそろっていれば受け付ける（weight の既定は 400）", () => {
    const m = ctx.sanitizeManifest({ ...base, fonts: [
      { family: "TrkZenMaru", file: "fonts/ZenMaruGothic-Regular.woff2", weight: 400, license: "OFL-1.1" },
      { family: "TrkZenMaru", file: "fonts/ZenMaruGothic-Bold.woff2", weight: 700, license: "OFL-1.1" },
      { family: "My Rounded 2", file: "fonts/x.woff", license: "OFL-1.1" },
    ] });
    assert.equal(m.fonts.length, 3);
    assert.deepEqual(JSON.parse(JSON.stringify(m.fonts[0])), { family: "TrkZenMaru", file: "fonts/ZenMaruGothic-Regular.woff2", license: "OFL-1.1", weight: 400 });
    assert.equal(m.fonts[2].weight, 400);
    assert.equal(m.fonts[2].style, undefined, "normal は書かない（manifest を太らせない）");
  });

  test("italic と weight の丸めを保つ", () => {
    const m = ctx.sanitizeManifest({ ...base, fonts: [{ family: "A", file: "a.woff2", license: "OFL-1.1", weight: 455, style: "italic" }] });
    assert.deepEqual(JSON.parse(JSON.stringify(m.fonts[0])), { family: "A", file: "a.woff2", license: "OFL-1.1", weight: 500, style: "italic" });
  });

  test("形の合わない書体は落とす（書体以外は通る）", () => {
    const m = ctx.sanitizeManifest({ ...base, fonts: [
      { family: "丸ゴ", file: "a.woff2", license: "OFL-1.1" },            /* family が英数字でない */
      { family: "-A", file: "a.woff2", license: "OFL-1.1" },              /* 先頭が記号 */
      { family: "A", file: "a.ttf", license: "OFL-1.1" },                 /* woff2／woff 以外 */
      { family: "A", file: "a.woff2" },                                   /* license なし */
      { family: "A", file: "../a.woff2", license: "OFL-1.1" },            /* 上の階層 */
      { family: "A", file: "a.woff2", license: "MIT" },
    ] });
    assert.equal(m.fonts.length, 1);
    assert.equal(m.fonts[0].license, "MIT");
    assert.equal(m.name, "丸ゴのお茶目");
  });

  test("同じ family・weight の重複は1つに、9件以上は8件まで", () => {
    const dup = ctx.sanitizeManifest({ ...base, fonts: [
      { family: "A", file: "a.woff2", license: "OFL-1.1", weight: 400 },
      { family: "a", file: "b.woff2", license: "OFL-1.1", weight: 400 },
    ] });
    assert.equal(dup.fonts.length, 1);
    const many = Array.from({ length: 12 }, (_, i) => ({ family: "F" + i, file: `f${i}.woff2`, license: "OFL-1.1" }));
    assert.equal(ctx.sanitizeManifest({ ...base, fonts: many }).fonts.length, 8);
  });

  test("fonts が無い／壊れていても落ちない（従来のパックはそのまま）", () => {
    assert.equal(ctx.sanitizeManifest({ ...base }).fonts, undefined);
    assert.equal(ctx.sanitizeManifest({ ...base, fonts: "Zen" }).fonts, undefined);
    assert.equal(ctx.sanitizeManifest({ ...base, fonts: [null, 3] }).fonts, undefined);
  });
});

describe("trk232 保存するファイル（manifestPaths）と上限", () => {
  test("同梱の書体も保存対象になる", () => {
    const m = ctx.sanitizeManifest({ ...base, fonts: [{ family: "A", file: "fonts/a.woff2", license: "OFL-1.1" }] });
    const paths = ctx.manifestPaths(m);
    assert.deepEqual(JSON.parse(JSON.stringify(paths)), [{ path: "fonts/a.woff2", kind: "font" }]);
  });

  test("書体1つあたり 16MB まで", () => {
    assert.equal(ctx.PACK_LIMIT.font, 16);
  });
});

describe("trk232 配る版（release）", () => {
  test("1.0.0 のような版を保つ", () => {
    assert.equal(ctx.sanitizeManifest({ ...base, release: "1.0.0" }).release, "1.0.0");
    assert.equal(ctx.sanitizeManifest({ ...base, release: " 2.1 " }).release, "2.1");
  });
  test("版として読めないものは持たない（空・v1・長すぎ）", () => {
    assert.equal(ctx.sanitizeManifest({ ...base, release: "" }).release, undefined);
    assert.equal(ctx.sanitizeManifest({ ...base, release: "v1" }).release, undefined);
    assert.equal(ctx.sanitizeManifest({ ...base, release: "1".repeat(30) }).release, undefined);
  });
});

/* ==== 読み込み・片付け（FontFace） ==== */
const runtimeSource = between(custom, "const packRuntime = {", "const noteImage = ");
function runtimeContext({ fail = [], noApi = false } = {}) {
  const added = [], removed = [], revoked = [];
  const sandbox = {
    console, JSON, Math, Number, String, Object, Array, Set, Promise, URL: {
      createObjectURL: () => "blob:test-" + (revoked.length + added.length),
      revokeObjectURL: u => revoked.push(u),
    },
    document: { fonts: { add: f => added.push(f), delete: f => removed.push(f) } },
    window: { Trk: {} },
  };
  if (!noApi) {
    sandbox.FontFace = class {
      constructor(family, source, desc) { this.family = family; this.source = source; this.weight = desc.weight; this.style = desc.style; this.display = desc.display; }
      load() { return fail.includes(this.family) ? Promise.reject(new Error("bad font")) : Promise.resolve(this); }
    };
  }
  vm.createContext(sandbox);
  vm.runInContext(`${runtimeSource}\nglobalThis.registerPackFonts = registerPackFonts;\nglobalThis.clearPackFonts = clearPackFonts;\nglobalThis.packRuntime = packRuntime;`, sandbox);
  return { sandbox, added, removed, revoked };
}

describe("trk232 書体を読む（FontFace）", () => {
  test("読めた書体だけ登録し、家族名を1つにまとめて返す", async () => {
    const { sandbox, added } = runtimeContext();
    const files = { "fonts/a.woff2": {}, "fonts/b.woff2": {} };
    const r = await sandbox.registerPackFonts([
      { family: "TrkZenMaru", file: "fonts/a.woff2", license: "OFL-1.1", weight: 400 },
      { family: "TrkZenMaru", file: "fonts/b.woff2", license: "OFL-1.1", weight: 700 },
    ], files);
    assert.equal(r.faces.length, 2);
    assert.equal(r.failed, 0);
    assert.equal(added.length, 2);
    assert.deepEqual(JSON.parse(JSON.stringify(sandbox.packRuntime.fontFaces.map(f => f.weight))), ["400", "700"]);
    assert.equal(sandbox.window.Trk.packFont.count(), 2);
    assert.equal(sandbox.window.Trk.packFont.forSkin("shadow"), '"TrkZenMaru"', "スキンを持たない書体パックは、どのスキンにも効く");
  });

  test("パックのスキンを使っているときだけ --font に足す", async () => {
    const { sandbox } = runtimeContext();
    await sandbox.registerPackFonts([{ family: "A B", file: "a.woff2", license: "OFL-1.1" }], { "a.woff2": {} });
    vm.runInContext('packRuntime.skinId = "pack_p1"', sandbox);
    assert.equal(sandbox.window.Trk.packFont.forSkin("pack_p1"), '"A B"');
    assert.equal(sandbox.window.Trk.packFont.forSkin("shadow"), "");
  });

  test("読めない書体は数えて知らせ、objectURL を後片付けする（他の書体は使える）", async () => {
    const { sandbox, added, revoked } = runtimeContext({ fail: ["Bad"] });
    const r = await sandbox.registerPackFonts([
      { family: "Good", file: "g.woff2", license: "OFL-1.1" },
      { family: "Bad", file: "b.woff2", license: "OFL-1.1" },
      { family: "Missing", file: "none.woff2", license: "OFL-1.1" },
    ], { "g.woff2": {}, "b.woff2": {} });
    assert.equal(r.faces.length, 1);
    assert.equal(r.failed, 2);
    assert.equal(added.length, 1);
    assert.equal(revoked.length, 1, "読めなかった書体の URL だけ片付ける");
  });

  test("書体APIが無い環境では、全部「読めなかった」として数えるだけ（落ちない）", async () => {
    const { sandbox, added } = runtimeContext({ noApi: true });
    const r = await sandbox.registerPackFonts([{ family: "A", file: "a.woff2", license: "OFL-1.1" }], { "a.woff2": {} });
    assert.equal(r.faces.length, 0);
    assert.equal(r.failed, 1);
    assert.equal(added.length, 0);
    assert.equal(sandbox.window.Trk.packFont.forSkin("shadow"), "");
  });

  test("外すと document.fonts から消え、--font への追加も止まる", async () => {
    const { sandbox, removed } = runtimeContext();
    await sandbox.registerPackFonts([{ family: "A", file: "a.woff2", license: "OFL-1.1" }], { "a.woff2": {} });
    sandbox.clearPackFonts();
    assert.equal(removed.length, 1);
    assert.equal(sandbox.packRuntime.fontFaces.length, 0);
    assert.equal(sandbox.window.Trk.packFont.forSkin("shadow"), "");
  });
});

/* ==== 目録の version と入っているパックの release（更新あり） ==== */
const catalogSrc = read("js/pack-catalog.js");
function catalogApi() {
  const sandbox = {
    window: {}, console, JSON, Math, Number, String, Object, Array, Set, Map, Error, Promise, Uint8Array, Date,
    document: { readyState: "complete", getElementById: () => null, createElement: () => ({ style:{}, append(){}, addEventListener(){} }) },
    addEventListener: () => {}, confirm: () => true, CSS: { escape: s => s }, tr: k => k, crypto,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(catalogSrc, sandbox, { filename: "js/pack-catalog.js" });
  return sandbox.window.Trk.packCatalog;
}
const catalog = catalogApi();

describe("trk232 更新あり（目録の version と release）", () => {
  test("版が違えば from → to を返す", () => {
    assert.deepEqual(JSON.parse(JSON.stringify(catalog.versionDiffers({ version: "1.1.0" }, { release: "1.0.0" }))), { from: "1.0.0", to: "1.1.0" });
  });
  test("同じ版・どちらかが無ければ「更新なし」", () => {
    assert.equal(catalog.versionDiffers({ version: "1.0.0" }, { release: "1.0.0" }), null);
    assert.equal(catalog.versionDiffers({ version: "1.0.0" }, {}), null);
    assert.equal(catalog.versionDiffers({}, { release: "1.0.0" }), null);
    assert.equal(catalog.versionDiffers(null, null), null);
  });
  test("一覧の状態に「更新あり」を出し、入れ直す入口を出す", () => {
    assert.match(catalogSrc, /if \(diff\) return \{ key:"catalogStateUpdate"/);
    assert.match(catalogSrc, /if \(!st\.hit \|\| st\.update\)/);
    assert.match(catalogSrc, /tr\("catalogUpdates", \{ n: newer \}\)/);
  });
  test("入っているパックの一覧が release を返す（更新の判定に使う）", () => {
    assert.match(custom, /release:\(r\.manifest && r\.manifest\.release\) \|\| ""/);
  });
  test("更新の文言が4言語ぶんある", () => {
    for (const key of ["catalogStateUpdate", "catalogUpdatePick", "catalogUpdates"]) {
      const hits = i18nSrc.split("\n").filter(l => l.includes(`${key}:`)).length;
      assert.ok(hits >= 4, `${key} が4言語ぶんない（${hits}）`);
    }
  });
});

describe("trk232 アプリ本体へのつなぎ方", () => {
  test("core.applySkin がパックの書体を --font の先頭に置く", () => {
    assert.match(coreSrc, /window\.Trk\.packFont\.forSkin\(settings\.skin\)/);
    assert.match(coreSrc, /root\.setProperty\("--font", \(packFont \? packFont \+ "," : ""\) \+ \(s\.font \|\| window\.Trk\.data\.FONT_DEFAULT\)\)/);
  });
  test("使うときはスキンを当てる前に読み、外すときは先に片付ける", () => {
    const activate = between(custom, "async function activatePack(", "function deactivatePack(");
    assert.ok(activate.indexOf("registerPackFonts(m.fonts, f)") < activate.indexOf("core.applySkin(sid)"), "書体を読んでから --font を作る");
    assert.ok(activate.includes('core.setStatus("packStatus", "packFontFailed"'));
    const deactivate = between(custom, "function deactivatePack(", "async function installAndUse(");
    assert.ok(deactivate.indexOf("clearPackFonts()") >= 0 && deactivate.indexOf("clearPackFonts()") < deactivate.indexOf("URL.revokeObjectURL"));
    assert.ok(deactivate.includes("core.applySkin(core.settings.skin, false)"), "外した書体が --font に残らない");
  });
  test("一覧に「書体 n」と同梱の書体・ライセンスを出す", () => {
    assert.match(custom, /tr\("badgeFonts", \{ n:m\.fonts\.length \}\)/);
    assert.match(custom, /tr\("packFontLine", \{ family:f\.family, license:f\.license \}\)/);
  });
  test("4言語ぶんの文言がある", () => {
    for (const key of ["badgeFonts", "packFontLabel", "packFontLine", "packFontFailed"]) {
      const hits = i18nSrc.split("\n").filter(l => l.includes(`${key}:`)).length;
      assert.ok(hits >= 4, `${key} が4言語ぶんない（${hits}）`);
    }
  });
});

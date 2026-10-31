// SPDX-License-Identifier: GPL-3.0-or-later
/* 🔤 trk233：書体のライセンス全文（licenseFile）を、入れて・読んで・出せるようにする
 *
 *   倉庫（trk-Avatar-Library）は trk232 のお願い L7 に応えて、pack.json の
 *   fonts[].licenseFile（例：fonts/OFL.txt）を宣言し、目録にも載せてくれました。
 *   アプリ側は trk232 では licenseFile を落としていたので、ここで受け取ります。
 *
 *   ・pack.json の fonts[].licenseFile（.txt／.md）を受け付ける
 *   ・パックの中の全文も、他のファイルと同じように保存する（256KB まで）
 *   ・パック一覧で「📄 ライセンス全文を読む」を押したときだけ読んで出す
 *   ・目録の 🔎 中身にも「ライセンス全文: fonts/OFL.txt」と出す
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const custom = read("js/custom.js");
const catalogSrc = read("js/pack-catalog.js");
const i18nSrc = read("js/i18n.js");
const css = read("css/style.css");

function between(src, startMarker, endMarker) {
  const a = src.indexOf(startMarker);
  const b = src.indexOf(endMarker, a + 1);
  assert.ok(a >= 0 && b > a, `isolate ${startMarker.slice(0, 48)}`);
  return src.slice(a, b);
}

const manifestSource = between(custom, "const PACK_FORMAT = ", "const hasLook = m =>");
const extOf = p => String(p).split(".").pop().toLowerCase();
function manifestContext() {
  const ctx = vm.createContext({
    console, JSON, Math, Number, String, Object, Array, Set, isFinite,
    core: { extOf, baseName: p => String(p).split("/").pop(), num: () => 0, storageLimitsIgnored: () => false },
    window: { Trk: { data: { DIFF_IDS: [], HEX: /^#[0-9a-f]{6}$/i, NOTE_SHAPES: ["circle", "diamond"],
      sanitizeSkinDef: d => (d && d.colors ? { name: d.name } : null) } } },
  });
  vm.runInContext(`${manifestSource}\nglobalThis.sanitizeManifest = sanitizeManifest;
    globalThis.manifestPaths = manifestPaths; globalThis.PACK_LIMIT = PACK_LIMIT;`, ctx);
  return ctx;
}
const ctx = manifestContext();
const base = { format: "shadow-taiko-pack", name: "丸ゴのお茶目", author: "trk-Avatar-Library", release: "1.1.0" };

describe("trk233 書体のライセンス全文（licenseFile）を受け取る", () => {
  test(".txt／.md を指していれば保つ", () => {
    const m = ctx.sanitizeManifest({ ...base, fonts: [
      { family: "TrkZenMaru", file: "fonts/a.woff2", license: "OFL-1.1", licenseFile: "fonts/OFL.txt" },
      { family: "TrkB", file: "fonts/b.woff2", license: "OFL-1.1", licenseFile: "docs/license.md" },
    ] });
    assert.equal(m.fonts[0].licenseFile, "fonts/OFL.txt");
    assert.equal(m.fonts[1].licenseFile, "docs/license.md");
  });

  test("形の合わない全文は落とす（書体そのものは残す）", () => {
    const m = ctx.sanitizeManifest({ ...base, fonts: [
      { family: "A", file: "a.woff2", license: "OFL-1.1", licenseFile: "fonts/OFL.pdf" },
      { family: "B", file: "b.woff2", license: "OFL-1.1", licenseFile: "../OFL.txt" },
      { family: "C", file: "c.woff2", license: "OFL-1.1", licenseFile: "/etc/passwd" },
      { family: "D", file: "d.woff2", license: "OFL-1.1" },
    ] });
    assert.equal(m.fonts.length, 4, "書体は4つとも残る");
    assert.equal(m.fonts[0].licenseFile, undefined);
    assert.equal(m.fonts[1].licenseFile, undefined);
    assert.equal(m.fonts[2].licenseFile, undefined);
    assert.equal(m.fonts[3].licenseFile, undefined);
  });

  test("全文も保存の対象に入る（書体と同じく、入れれば残る）", () => {
    const m = ctx.sanitizeManifest({ ...base, fonts: [
      { family: "TrkZenMaru", file: "fonts/a.woff2", license: "OFL-1.1", licenseFile: "fonts/OFL.txt" },
      { family: "TrkZenMaru", file: "fonts/b.woff2", license: "OFL-1.1", weight: 700, licenseFile: "fonts/OFL.txt" },
    ] });
    const paths = ctx.manifestPaths(m).map(p => `${p.kind}:${p.path}`);
    assert.deepEqual(JSON.parse(JSON.stringify(paths)),
      ["font:fonts/a.woff2", "license:fonts/OFL.txt", "font:fonts/b.woff2"], "同じ全文は1回だけ");
  });

  test("全文の上限は 256KB（倉庫の verify-pack と同じ）", () => {
    assert.equal(ctx.PACK_LIMIT.license, 0.25);
    assert.equal(Math.round(ctx.PACK_LIMIT.license * 1048576), 262144);
  });

  test("licenseFile を持たないパックは、これまでどおり", () => {
    const m = ctx.sanitizeManifest({ ...base, fonts: [{ family: "A", file: "a.woff2", license: "OFL-1.1" }] });
    assert.equal(m.fonts[0].licenseFile, undefined);
    assert.equal(ctx.manifestPaths(m).length, 1);
  });
});

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

describe("trk233 目録の fonts[].licenseFile を落とさない", () => {
  test("目録の1件に licenseFile が残る（🛡 形は文字列だけ）", () => {
    const e = catalog.sanitizeCatalogEntry({
      name: "丸ゴのお茶目", file: "font-packs/maru-go.stpack", version: "1.1.0",
      fonts: [{ family: "TrkZenMaru", file: "fonts/a.woff2", license: "OFL-1.1", licenseFile: "fonts/OFL.txt" }],
    });
    assert.equal(e.fonts[0].licenseFile, "fonts/OFL.txt");
    const no = catalog.sanitizeCatalogEntry({ name: "x", file: "a.stpack", fonts: [{ family: "A", licenseFile: 42 }] });
    assert.equal(no.fonts[0].licenseFile, "");
  });

  test("🔎 中身に「ライセンス全文: …」を出す", () => {
    assert.match(catalogSrc, /tr\("catalogLicenseFile", \{ file: f\.licenseFile \}\)/);
    assert.match(catalogSrc, /licenseFile: str\(f && f\.licenseFile, 120\)/);
  });
});

describe("trk233 パック一覧で全文を読む", () => {
  test("押したときだけ読む（一覧を重くしない）", () => {
    assert.match(custom, /const lf = \(m\.fonts\.find\(f => f\.licenseFile\) \|\| \{\}\)\.licenseFile;/);
    assert.match(custom, /core\.el\("pre", "hint packLicenseText"\)/);
    assert.match(custom, /out\.textContent = \(await blob\.text\(\)\)\.slice\(0, 100000\)/);
  });
  test("全文が入っていないパック（古い版）でも落ちない", () => {
    assert.match(custom, /if \(!blob\) out\.textContent = tr\("packLicenseMissing"\)/);
  });
  test("長い全文は枠の中でスクロール（一覧を押し広げない）", () => {
    assert.match(css, /\.packLicenseText\{[^}]*max-height:16em/);
    assert.match(css, /\.packLicenseText\{[^}]*overflow:auto/);
  });
  test("4言語ぶんの文言がある", () => {
    for (const key of ["packLicenseOpen", "packLicenseClose", "packLicenseMissing", "catalogLicenseFile"]) {
      const hits = i18nSrc.split("\n").filter(l => l.includes(`${key}:`)).length;
      assert.ok(hits >= 4, `${key} が4言語ぶんない（${hits}）`);
    }
  });
});

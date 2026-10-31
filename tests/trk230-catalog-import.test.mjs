// SPDX-License-Identifier: GPL-3.0-or-later
/* 📚 trk230：倉庫（trk-Avatar-Library）の目録からパックを入れる
 *
 *   利用者の相談：書体を容量を気にせず配れる環境は倉庫（別リポジトリ）で整える。
 *   こちらは「それを受け入れられる環境」＝目録から取り込む導線を作る。
 *
 *   守ること（既存の約束）：
 *     ・外部へ取りに行かない（fetch しない・目録も .stpack も、利用者が選んだファイルだけ）
 *     ・目録の形は決めた項目だけ（あやしいパス・形式は落とす）
 *     ・入れる前に sha256 を照合し、違えば入れない
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const src = read("js/pack-catalog.js");
const i18nSrc = read("js/i18n.js");
const html = read("index.html");

/* index.html と同じく、スクリプトを「読み込んだだけ」の状態を作る（DOM は無い） */
function loadModule() {
  const sandbox = {
    window: {}, console, crypto, Promise, JSON, Math, Number, String, Object, Array, Set, Map, Error,
    document: { readyState: "complete", getElementById: () => null, createElement: () => ({ style:{}, append(){}, addEventListener(){} }) },
    addEventListener: () => {}, confirm: () => true, CSS: { escape: s => s }, tr: k => k, Blob, Uint8Array, Date,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: "js/pack-catalog.js" });
  return sandbox.window.Trk.packCatalog;
}
const api = loadModule();

const entry = (over = {}) => ({
  id: "mincho-1", name: "明朝の本", author: "trk", version: "1.0.0",
  file: "packs/sample-mincho.stpack", sha256: "a".repeat(64), bytes: 690,
  fonts: [{ family: "Zen Maru Gothic", file: "fonts/a.woff2", license: "OFL-1.1" }],
  license: "GPL-3.0-or-later", description: "見本", ...over,
});
const catalog = (over = {}) => ({ format: "trk-avatar-library", version: 1, name: "trk-Avatar-Library", packs: [entry()], ...over });

describe("trk230 目録を読む", () => {
  test("決めた形の目録は読める（件数・なまえ・パックの項目）", () => {
    const c = api.sanitizeCatalog(catalog());
    assert.equal(c.format, "trk-avatar-library");
    assert.equal(c.packs.length, 1);
    const p = c.packs[0];
    assert.equal(p.name, "明朝の本");
    assert.equal(p.file, "packs/sample-mincho.stpack");
    assert.equal(p.bytes, 690);
    assert.equal(p.fonts.length, 1);
    assert.equal(p.fonts[0].license, "OFL-1.1");
  });

  test("format が違う・version が未来・JSON でない、は読めない（null）", () => {
    assert.equal(api.sanitizeCatalog(catalog({ format: "other" })), null);
    assert.equal(api.sanitizeCatalog(catalog({ version: 2 })), null);
    assert.equal(api.sanitizeCatalog(null), null);
    assert.equal(api.sanitizeCatalog("x"), null);
  });

  test("あやしいファイルのパスは、その1件だけ落とす（全体は読める）", () => {
    const c = api.sanitizeCatalog(catalog({ packs: [
      entry({ id: "ok" }),
      entry({ id: "up", file: "../secret.stpack" }),
      entry({ id: "abs", file: "/etc/passwd.stpack" }),
      entry({ id: "ext", file: "packs/a.exe" }),
      entry({ id: "none", file: "" }),
    ] }));
    assert.equal(c.packs.length, 1);
    assert.equal(c.packs[0].id, "ok");
    assert.equal(c.dropped, 4);
  });

  test("sha256 は 64桁の16進だけを受け付ける（形が違えば空にして、照合しない）", () => {
    assert.equal(api.sanitizeCatalog(catalog()).packs[0].sha256, "a".repeat(64));
    assert.equal(api.sanitizeCatalog(catalog({ packs: [entry({ sha256: "xyz" })] })).packs[0].sha256, "");
    assert.equal(api.sanitizeCatalog(catalog({ packs: [entry({ sha256: "a".repeat(63) })] })).packs[0].sha256, "");
  });

  test("名前が無いパックは落とす・件数は500まで", () => {
    assert.equal(api.sanitizeCatalog(catalog({ packs: [entry({ name: "  " })] })).packs.length, 0);
    const many = Array.from({ length: 620 }, (_, i) => entry({ id: "p" + i, file: `packs/p${i}.stpack` }));
    assert.equal(api.sanitizeCatalog(catalog({ packs: many })).packs.length, 500);
  });

  test("長すぎる文字は切る（説明300・名前80）", () => {
    const p = api.sanitizeCatalog(catalog({ packs: [entry({ description: "あ".repeat(900), name: "い".repeat(200) })] })).packs[0];
    assert.equal(p.description.length, 300);
    assert.equal(p.name.length, 80);
  });
});

describe("trk230 選んだファイルと目録の照合", () => {
  test("名前と大きさが合えば通す", () => {
    const r = api.checkAgainstEntry(entry(), { name: "sample-mincho.stpack", size: 690 });
    assert.equal(r.ok, true);
  });

  test("大きさが違えば通さない（入れない）", () => {
    const r = api.checkAgainstEntry(entry(), { name: "sample-mincho.stpack", size: 12345 });
    assert.equal(r.ok, false);
    assert.equal(r.reason, "sizeMismatch");
    assert.equal(r.got, 12345);
  });

  test("名前が違えば理由を返す（画面は確認してから進める）", () => {
    const r = api.checkAgainstEntry(entry(), { name: "other.stpack", size: 690 });
    assert.equal(r.ok, false);
    assert.equal(r.reason, "nameMismatch");
  });

  test("大きさの表示（B・KB・MB）", () => {
    assert.equal(api.formatBytes(690), "690 B");
    assert.equal(api.formatBytes(2048), "2.0 KB");
    assert.equal(api.formatBytes(7583869), "7.2 MB");
    assert.equal(api.formatBytes(undefined), "0 B");
  });
});

describe("trk230 配線と約束", () => {
  const keys = ["catalogTitle", "catalogHint", "catalogOpen", "catalogLoaded", "catalogEmpty", "catalogBad",
    "catalogDropped", "catalogPick", "catalogFonts", "catalogSizeUnknown", "catalogSizeBad", "catalogNameBad",
    "catalogHashOk", "catalogHashBad", "catalogNoHash", "catalogInstalled"];

  test("16の言葉が4言語にある", () => {
    for (const k of keys) {
      const n = (i18nSrc.match(new RegExp(`\\b${k}:`, "g")) || []).length;
      assert.equal(n, 4, `${k} が4言語そろっていない（${n}）`);
    }
  });

  test("設定画面に目録の欄があり、スクリプトを読み込んでいる", () => {
    for (const id of ["packCatalogPanel", "catalogFile", "catalogList", "catalogSummary", "catalogStatus"]) {
      assert.ok(html.includes(`id="${id}"`), `${id} がない`);
    }
    assert.ok(html.includes('<script src="js/pack-catalog.js"></script>'));
    const i = html.indexOf('<script src="js/custom.js"></script>'), j = html.indexOf('<script src="js/pack-catalog.js"></script>');
    assert.ok(i >= 0 && j > i, "custom.js（installPackFile）より後に読み込む");
  });

  test("外部へ取りに行かない（fetch・XMLHttpRequest・http(s) の URL を使わない）", () => {
    assert.equal(/\bfetch\s*\(/.test(src), false, "fetch を使っている");
    assert.equal(/XMLHttpRequest/.test(src), false, "XMLHttpRequest を使っている");
    assert.equal(/["'`]https?:\/\//.test(src), false, "外部URLを持っている");
  });

  test("sha256 は crypto.subtle で計算し、無い環境では null を返す（落ちない）", async () => {
    assert.match(src, /crypto\.subtle/);
    const hex = await api.sha256Hex(new Blob(["abc"]));
    if (hex !== null) assert.equal(hex, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  test("入れられないときは、既存の packStatus に理由を出す", () => {
    assert.match(src, /setStatus\("packStatus"/);
  });
});

// SPDX-License-Identifier: GPL-3.0-or-later
/* 🔤 trk236／trk237／trk238：書体の「ひとこと・対応字数・タグ」を読み、
 *   タグで絞り、入っている書体の索引を出す
 *
 *   倉庫（trk-Avatar-Library）の相談（2026-11-01）への返事として入れたもの：
 *     trk236 … 目録の fonts[].note／cmap／bytes／tags を落とさず、🔎 中身に出す
 *     trk237 … 雰囲気のタグ（16 語）で、目録の一覧を絞る
 *     trk238 … 入っているパックの書体を、起動のたびに manifest から索引する（保存しない）
 *
 *   守ること：
 *     ・目録は「配る側の一覧」なので、索引の行は**入っているもの**が正（目録は無い項目の補いだけ）
 *     ・索引は保存しない（消した・入れ替えたパックの行を残さない）
 *     ・書体の本体（Blob）は読まない（名前と大きさだけ）
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const src = read("js/pack-catalog.js");
const customSrc = read("js/custom.js");
const i18nSrc = read("js/i18n.js");
const html = read("index.html");

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

const entry = (fonts, over = {}) => ({
  id: "maru-go", name: "丸ゴのお茶目", author: "trk", version: "1.1.0", file: "font-packs/maru-go.stpack",
  sha256: "a".repeat(64), bytes: 100, fonts, license: "OFL-1.1", description: "", ...over,
});
const font = (over = {}) => ({ family: "TrkZenMaru", file: "fonts/ZenMaruGothic-Regular.woff2", license: "OFL-1.1", ...over });

describe("trk236 目録の書体の項目（note・cmap・bytes・weight・tags）", () => {
  test("ひとこと・対応字数・大きさ・太さ・タグを落とさない", () => {
    const e = api.sanitizeCatalogEntry(entry([font({ weight:700, note:" 読みやすい角ゴ ", cmap:6872, bytes:1436276, tags:["角ゴ","読みやすい"] })]));
    const f = e.fonts[0];
    assert.equal(f.weight, 700);
    assert.equal(f.note, "読みやすい角ゴ");
    assert.equal(f.cmap, 6872);
    assert.equal(f.bytes, 1436276);
    assert.deepEqual([...f.tags], ["角ゴ", "読みやすい"]);
  });
  test("無い項目は足さない（古い目録もそのまま読める）", () => {
    const f = api.sanitizeCatalogEntry(entry([font()])).fonts[0];
    assert.deepEqual(Object.keys(f).sort(), ["family", "file", "license", "licenseFile"]);
  });
  test("タグは 8 個まで・各 16 文字まで・空と重複は落とす", () => {
    const many = ["丸ゴ", "角ゴ", "明朝", "手書き", "ポップ", "ドット", "極太", "かすれ", "レトロ", "和風"];
    const f = api.sanitizeCatalogEntry(entry([font({ tags:[...many, "", "  ", "丸ゴ", "あ".repeat(40)] })])).fonts[0];
    assert.equal(f.tags.length, 8);
    assert.equal(new Set(f.tags).size, 8);
    assert.ok(f.tags.every(t => t.length <= 16));
  });
  test("ひとことは 60 文字まで・数字でない cmap/bytes は捨てる", () => {
    const f = api.sanitizeCatalogEntry(entry([font({ note:"あ".repeat(100), cmap:"たくさん", bytes:-5 })])).fonts[0];
    assert.equal([...f.note].length, 60);
    assert.equal(f.cmap, undefined);
    assert.equal(f.bytes, undefined);
  });
  test("家族名が無い書体は今までどおり落とす", () => {
    assert.equal(api.sanitizeCatalogEntry(entry([{ file:"fonts/x.woff2" }])).fonts.length, 0);
  });
  test("タグの上限は倉庫の L15 と同じ値", () => {
    assert.deepEqual({ note:api.FONT_NOTE_MAX, tags:api.FONT_TAG_MAX, len:api.FONT_TAG_LEN }, { note:60, tags:8, len:16 });
  });
});

describe("trk237 雰囲気のタグで絞る", () => {
  const catalog = {
    format: "trk-avatar-library", version: 1, name: "c", packs: [
      entry([font({ tags:["丸ゴ","かわいい"] })], { id:"a", name:"丸ゴ" }),
      entry([font({ family:"TrkZenKaku", tags:["角ゴ","見出し"] }), font({ family:"TrkZenKaku", weight:700, tags:["角ゴ"] })], { id:"b", name:"角ゴ" }),
      entry([], { id:"c", name:"書体なし", file:"packs/sample-mincho.stpack" }),
    ],
  };
  test("タグと件数を数える（多い順・同数は名前順）", () => {
    const counts = JSON.parse(JSON.stringify(api.catalogTagCounts(catalog))).map(c => `${c.tag}:${c.n}`);
    assert.deepEqual(counts, ["角ゴ:2", "かわいい:1", "丸ゴ:1", "見出し:1"]);
  });
  test("タグで絞ると、そのタグの書体を持つパックだけ残る", () => {
    assert.deepEqual([...api.filterPacksByTag(catalog.packs, "角ゴ").map(p => p.id)], ["b"]);
    assert.deepEqual([...api.filterPacksByTag(catalog.packs, "").map(p => p.id)], ["a", "b", "c"]);
    assert.equal(api.filterPacksByTag(catalog.packs, "無いタグ").length, 0);
  });
  test("書体の無いパック・空の目録でも落ちない", () => {
    assert.equal(api.filterPacksByTag(null, "角ゴ").length, 0);
    assert.deepEqual([...api.catalogTagCounts(null)], []);
  });
});

describe("trk238 入っている書体の索引", () => {
  const installed = [
    { family:"TrkZenKaku", weight:400, file:"fonts/a.woff2", packId:"p1", packName:"角ゴ", bytes:995252, active:true, tags:["角ゴ","本文"] },
    { family:"TrkZenKaku", weight:700, file:"fonts/b.woff2", packId:"p1", packName:"角ゴ", bytes:975000 },
    { family:"TrkZenMaru", weight:400, file:"fonts/c.woff2", packId:"p2", packName:"丸ゴ", bytes:1436276, note:"まるい" },
  ];
  const catalog = {
    format: "trk-avatar-library", version: 1, name: "c", packs: [
      entry([font({ family:"TrkZenKaku", weight:400, note:"目録のひとこと", tags:["角ゴ"], cmap:6872, bytes:995252 }),
             font({ family:"TrkZenKaku", weight:700, tags:["見出し"], cmap:6800 })], { id:"p1", name:"角ゴのお茶目" }),
    ],
  };
  test("入っている書体が行になる（家族・太さ・パック・使用中）", () => {
    const rows = api.fontIndexRows(installed, catalog);
    assert.equal(rows.length, 3);
    assert.equal(rows[0].key, "trkzenkaku|400");
    assert.equal(rows[0].packName, "角ゴ");
    assert.equal(rows[0].active, true);
    assert.equal(rows[2].packName, "丸ゴ");
  });
  test("manifest の値が正・無い項目だけ目録で補う", () => {
    const rows = api.fontIndexRows(installed, catalog);
    assert.equal(rows[0].tags[0], "角ゴ");          /* manifest のタグ（目録のタグで上書きしない） */
    assert.deepEqual([...rows[0].tags], ["角ゴ", "本文"]);
    assert.equal(rows[1].tags[0], "見出し");        /* manifest に無ければ目録のタグ */
    assert.equal(rows[1].cmap, 6800);               /* 目録の対応字数 */
    assert.equal(rows[1].inCatalog, true);
    assert.equal(rows[2].inCatalog, false);         /* 丸ゴは目録に無い（入っているものは出す） */
    assert.equal(rows[2].note, "まるい");
  });
  test("目録が無くても索引は作れる（pack.json だけで並ぶ）", () => {
    const rows = api.fontIndexRows(installed, null);
    assert.equal(rows.length, 3);
    assert.ok(rows.every(r => r.inCatalog === false));
    assert.equal(rows[0].tags[0], "角ゴ");
  });
  test("タグと検索語で絞る（日本語の部分一致・空白で AND）", () => {
    const rows = api.fontIndexRows(installed, catalog);
    assert.equal(api.filterFontRows(rows, { tag:"見出し" }).length, 1);
    assert.equal(api.filterFontRows(rows, { query:"角ゴ" }).length, 2);
    assert.equal(api.filterFontRows(rows, { query:"まる 丸ゴ" }).length, 1);
    assert.equal(api.filterFontRows(rows, { query:"zenkaku 本文" }).length, 1);
    assert.equal(api.filterFontRows(rows, {}).length, 3);
    assert.equal(api.filterFontRows(rows, { tag:"角ゴ", query:"700" }).length, 0);
  });
  test("並べ替え（書体名・パック名・大きさ）", () => {
    const rows = api.fontIndexRows(installed, catalog);
    assert.deepEqual([...api.sortFontRows(rows, "family").map(r => r.key)], ["trkzenkaku|400", "trkzenkaku|700", "trkzenmaru|400"]);
    assert.deepEqual([...api.sortFontRows(rows, "size").map(r => r.bytes)], [1436276, 995252, 975000]);
    const packs = api.sortFontRows(rows, "pack").map(r => r.packName);
    assert.deepEqual(packs.slice().sort((a, b) => a.localeCompare(b, "ja")), packs, "パック名の順（同じパックは続く）");
    assert.equal(packs[0], packs[1], "同じパックの行は続く");
  });
  test("同じ family でも太さが違えば別の行（キーは family|weight）", () => {
    const rows = api.fontIndexRows(installed, catalog);
    assert.equal(new Set(rows.map(r => r.key)).size, 3);
    const only = api.filterFontRows(rows, { query:"" }).filter(r => r.key === "trkzenkaku|700");
    assert.equal(only.length, 1);
  });
});

describe("trk238 索引の材料（js/custom.js）", () => {
  test("pack.json の fonts[].note／tags を受け取る（8 個・各 16 文字）", () => {
    assert.ok(customSrc.includes("const fnote = pstr(r.note, 60);"));
    assert.ok(customSrc.includes("PACK_FONT_TAG_MAX = 8, PACK_FONT_TAG_LEN = 16"));
    assert.match(customSrc, /if \(ftags\.length\) f\.tags = ftags;/);
  });
  test("索引は manifest から作り、書体の本体（Blob）は読まない", () => {
    assert.ok(customSrc.includes("function packFontRows(recs)"));
    assert.ok(customSrc.includes("const blob = files[f.file];"));
    assert.ok(customSrc.includes("bytes: blob && Number.isFinite(blob.size) ? blob.size : 0"));
  });
  test("索引は保存しない（localStorage に書かない）", () => {
    const body = customSrc.slice(customSrc.indexOf("function packFontRows"), customSrc.indexOf("async function deletePackById"));
    assert.equal(/localStorage|sessionStorage|indexedDB\.open|packDB\.put/.test(body), false);
  });
  test("目録の一覧と ❓謎設定から使えるように公開している", () => {
    assert.match(customSrc, /\{ initPacks[^}]*listInstalledFonts/);
    assert.ok(customSrc.includes("packFontRows, listInstalledFonts }"));
  });
});

describe("trk236〜238 画面の配線とことば", () => {
  test("索引の欄（見出し・絞り込み・並べ替え・一覧）がある", () => {
    for (const id of ["packFontIndexPanel", "packFontIndexSearch", "packFontIndexOrder", "packFontIndexTags", "packFontIndexSummary", "packFontIndexList"]) {
      assert.ok(html.includes(`id="${id}"`), `${id} が無い`);
    }
    assert.ok(html.includes('data-i18n-aria="fontIndexSearch"'));
    assert.ok(html.includes('data-i18n-aria="fontIndexOrder"'));
  });
  test("目録の一覧にタグの絞り込みがある", () => {
    assert.ok(html.includes('id="catalogTagFilter"'));
    assert.ok(src.includes("renderTagFilter()"));
    assert.ok(src.includes("filterPacksByTag(current.packs, catalogTag)"));
  });
  test("索引は開いたとき・ことばを変えたとき・パックが変わったときに作り直す", () => {
    assert.ok(src.includes('idxPanel.addEventListener("toggle"'));
    assert.ok(src.includes('c.on("language"'));
    assert.ok(src.includes('c.on("packsChanged"'));
    assert.ok(src.includes("window.Trk.packCatalog.renderFontIndex = renderFontIndex;"));
  });
  test("🔎 中身に、ひとこと・対応字数・大きさ・タグを出す", () => {
    assert.ok(src.includes("function fontMetaText(f)"));
    assert.ok(src.includes('tr("catalogFontNote"'));
    assert.ok(src.includes('tr("catalogFontCmap"'));
    assert.ok(src.includes('tr("catalogFontTags"'));
    assert.ok(src.includes("const meta = fontMetaText(f);"));
  });
  test("足した文言が 4 言語そろっている", () => {
    const keys = ["catalogFontWeight", "catalogFontCmap", "catalogFontBytes", "catalogFontTags", "catalogFontNote",
      "catalogTagAll", "catalogTagShown", "fontIndexTitle", "fontIndexHint", "fontIndexSearch", "fontIndexOrder",
      "fontIndexOrderFamily", "fontIndexOrderPack", "fontIndexOrderSize", "fontIndexSummary", "fontIndexEmpty",
      "fontIndexNoMatch", "fontIndexUse", "fontIndexInUse", "fontIndexLicense"];
    for (const key of keys) {
      const n = (i18nSrc.match(new RegExp(`\\b${key}:`, "g")) || []).length;
      assert.equal(n, 4, `${key} は 4 言語に必要（いま ${n}）`);
    }
  });
  test("前の版の文言（trk230〜trk235）は消していない", () => {
    for (const key of ["catalogTitle", "catalogFontLine", "catalogLicenseFile", "catalogRemoveAllLabel", "catalogSetOpen", "catalogSetDone"]) {
      assert.ok(new RegExp(`\\b${key}:`).test(i18nSrc), `${key} が消えています`);
    }
  });
});

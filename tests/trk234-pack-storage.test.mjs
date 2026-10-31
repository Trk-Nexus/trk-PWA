// SPDX-License-Identifier: GPL-3.0-or-later
/* 💾 trk234：容量の見える化と「まとめて消す」
 *
 *   なぜ要るか：
 *     書体パック 14 種（trk233）のように、パックは 1 本 1MB を超えることがあります。
 *     入れたはいいものの「いま何 MB 使っているのか」「どれが重いのか」「まとめて消すには」が
 *     分からないと、容量の不安からパックを入れづらくなります。
 *
 *   ここで確かめること：
 *     ・バイト数の表示（1024 進・1桁）と、合計・上限・使っていない分・重い順の計算
 *     ・まとめて消すときの「実際に消せるものだけ」の選び直し（画面の選択が古くても安全）
 *     ・消す合図（packsChanged）が**1回だけ**であること（曲を含むパックを何本消しても）
 *     ・❓謎設定の「全部消す」が二重確認（件数と合計 → DELETE と入力）であること
 *     ・画面の入口（index.html）と 4 言語の文がそろっていること
 *
 *   ⚠ 実ブラウザでの見え方（バーの伸び方・チェックの押し心地）は未確認です。
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
const html = read("index.html");
const css = read("css/style.css");
const sw = read("sw.js");

function between(src, startMarker, endMarker) {
  const a = src.indexOf(startMarker);
  const b = src.indexOf(endMarker, a + 1);
  assert.ok(a >= 0 && b > a, `isolate ${startMarker.slice(0, 48)}`);
  return src.slice(a, b);
}

/* 計算の部分（DOM を触らない）だけを取り出して動かす */
const calcSource = between(custom,
  "function packRecordBytes(record) {",
  "/* ---------- 💾 trk234：ここまで計算（この下は画面） ---------- */");
const ctx = vm.createContext({ console, Number, Math, Object, Array, Set, Map, String, Boolean, JSON });
vm.runInContext(`${calcSource}
  globalThis.packSizeText = packSizeText;
  globalThis.packRecordSize = packRecordSize;
  globalThis.packUsageInfo = packUsageInfo;
  globalThis.packDeletePlan = packDeletePlan;`, ctx);

/* ⚠ vm の中で作られた配列・オブジェクトは別 realm の値。deepEqual の前に素の値へ戻す */
const plain = v => JSON.parse(JSON.stringify(v));
const MB = 1048576;
const rec = (id, size, active = false, name = id) => ({ id, size, active, name });

describe("trk234 容量の表示（バイト数と集計）", () => {
  test("バイト数は 1024 進で読みやすく出す", () => {
    assert.equal(ctx.packSizeText(0), "0 B");
    assert.equal(ctx.packSizeText(512), "512 B");
    assert.equal(ctx.packSizeText(1024), "1.0 KB");
    assert.equal(ctx.packSizeText(1536), "1.5 KB");
    assert.equal(ctx.packSizeText(MB), "1.0 MB");
    assert.equal(ctx.packSizeText(27765040), "26.5 MB");       /* 書体パック 14 種の合計 */
    assert.equal(ctx.packSizeText(1073741824), "1.00 GB");
  });

  test("数値でない・負の値は 0 B（記録が壊れていても画面を壊さない）", () => {
    for (const bad of [undefined, null, NaN, -1, "abc", {}]) {
      assert.equal(ctx.packSizeText(bad), "0 B");
    }
  });

  test("1件の大きさ: size → bytes → files の順で見る", () => {
    assert.equal(ctx.packRecordSize({ size: 1234, bytes: 99 }), 1234);
    assert.equal(ctx.packRecordSize({ bytes: 99 }), 99);
    assert.equal(ctx.packRecordSize({ files: { "a.png": { size: 10 }, "b.png": { size: 5 } } }), 15);
    assert.equal(ctx.packRecordSize(null), 0);
    assert.equal(ctx.packRecordSize({}), 0);
  });

  test("合計・件数・上限に対する割合", () => {
    const info = ctx.packUsageInfo([rec("a", 30 * MB, true), rec("b", 10 * MB)], 1024 * MB);
    assert.equal(info.count, 2);
    assert.equal(info.total, 40 * MB);
    assert.equal(info.capped, true);
    assert.equal(info.pct, 4);
    assert.equal(info.cap, 1024 * MB);
  });

  test("上限なし（Infinity）のときは割合を出さない", () => {
    const info = ctx.packUsageInfo([rec("a", 10 * MB)], Infinity);
    assert.equal(info.capped, false);
    assert.equal(info.pct, 0);
    assert.equal(info.cap, 0);
  });

  test("使っていないもの（いま使っているパック以外）の件数と合計", () => {
    const info = ctx.packUsageInfo([rec("a", 30 * MB, true), rec("b", 10 * MB), rec("c", 5 * MB)], 1024 * MB);
    assert.deepEqual(plain(info.unused), { count: 2, bytes: 15 * MB });
  });

  test("重い順に上位3件（名前つき）。同じ大きさは名前順", () => {
    const info = ctx.packUsageInfo([rec("a", 1 * MB, false, "あ"), rec("b", 9 * MB, false, "い"),
      rec("c", 5 * MB, false, "う"), rec("d", 5 * MB, false, "え")], 1024 * MB);
    assert.deepEqual(plain(info.heaviest.map(h => h.name)), ["い", "う", "え"]);
    assert.equal(info.heaviest[0].bytes, 9 * MB);
    assert.equal(ctx.packUsageInfo([rec("a", 1), rec("b", 2)], 0, 1).heaviest.length, 1);
  });

  test("空の一覧は 0 件（画面は隠す側）", () => {
    const info = ctx.packUsageInfo([], 1024 * MB);
    assert.equal(info.count, 0);
    assert.equal(info.total, 0);
    assert.deepEqual(plain(info.heaviest), []);
    assert.equal(ctx.packUsageInfo(null, 1024 * MB).count, 0);
  });
});

describe("trk234 まとめて消す（消せるものだけを選び直す）", () => {
  const recs = [rec("a", 2 * MB, true), rec("b", 3 * MB), rec("c", 4 * MB)];

  test("選んだ id のうち、実在するものだけを消す", () => {
    const plan = ctx.packDeletePlan(recs, ["a", "zzz", "c"]);
    assert.deepEqual(plain(plan.ids), ["a", "c"]);
    assert.equal(plan.count, 2);
    assert.equal(plan.bytes, 6 * MB);
    assert.equal(plan.missing, 1);
  });

  test("同じ id を2回渡しても1回だけ数える", () => {
    const plan = ctx.packDeletePlan(recs, ["b", "b", "b"]);
    assert.deepEqual(plain(plan.ids), ["b"]);
    assert.equal(plan.bytes, 3 * MB);
  });

  test("いま使っているパックが入っていれば activeIds に出す（先に外す合図）", () => {
    assert.deepEqual(plain(ctx.packDeletePlan(recs, ["a"]).activeIds), ["a"]);
    assert.deepEqual(plain(ctx.packDeletePlan(recs, ["b"]).activeIds), []);
  });

  test("文字列でない id・空の配列は無視する", () => {
    assert.equal(ctx.packDeletePlan(recs, [null, 3, "", "  "]).count, 0);
    assert.equal(ctx.packDeletePlan(recs, []).count, 0);
    assert.equal(ctx.packDeletePlan(null, ["a"]).count, 0);
  });
});

describe("trk234 消すときの約束（コードの読み取り）", () => {
  const delMany = between(custom, "async function deletePacksByIds(ids, opts) {", "/* ❓謎設定：パックを全部消す");

  test("曲リストへの合図（packsChanged）は、まとめて消しても1回だけ", () => {
    assert.equal((delMany.match(/core\.emit\("packsChanged"\)/g) || []).length, 1);
  });

  test("使っているパックを含むときは、先に外してから消す", () => {
    assert.match(delMany, /plan\.activeIds\.length/);
    assert.match(delMany, /deactivatePack\(\)/);
    assert.ok(delMany.indexOf("deactivatePack()") < delMany.indexOf("packDB.del(id)"));
  });

  test("確認の文は「使っているパックを含むか」で出し分ける", () => {
    assert.match(delMany, /packDeleteSelectedConfirmActive/);
    assert.match(delMany, /packDeleteSelectedConfirm/);
    assert.match(delMany, /packSizeText\(plan\.bytes\)/);
  });

  test("全部消すは二重確認（件数と合計 → DELETE と入力）", () => {
    const wipe = between(custom, "async function wipeAllPacks() {", "async function renderPackList() {");
    assert.match(wipe, /confirm\(tr\("packWipeConfirm"/);
    assert.match(wipe, /prompt\(tr\("packWipeType"/);
    assert.match(wipe, /typed !== "DELETE"/);
    assert.match(wipe, /skipConfirm:true/);   /* 2回目の確認は「DELETE」の入力で済ませる */
  });

  test("一覧の各パックに選択（チェック）があり、読み上げ名にパック名を入れる", () => {
    assert.match(custom, /core\.el\("input", "packPick"\)/);
    assert.match(custom, /packSelectOne", \{ name: m\.name \}/);
  });
});

describe("trk234 画面の入口と文（index.html・4言語）", () => {
  test("容量の表示・選択・まとめて消すの入口がある", () => {
    for (const id of ["packUsage", "packUsageTotal", "packUsageShare", "packUsageBar", "packUsageFill",
      "packUsageFree", "packUsageDetail", "packPickAll", "packPickUnused", "packPickNone",
      "packDeletePicked", "packPickStatus"]) {
      assert.ok(html.includes(`id="${id}"`), `index.html に #${id} が無い`);
    }
  });

  test("❓謎設定に「パックを全部消す」がある", () => {
    assert.ok(html.includes('<button id="packWipeBtn" type="button" data-i18n="packWipeAll"></button>'));
    assert.ok(html.includes('data-i18n="packWipeAllHint"'));
  });

  test("目録の一覧に「この目録のぶんを消す」がある", () => {
    assert.ok(html.includes('id="catalogBulkActions"'));
    assert.ok(html.includes('<button id="catalogRemoveAll" type="button"></button>'));
    assert.match(catalogSrc, /catalogRemoveAllLabel/);
    assert.match(catalogSrc, /deletePacksByIds/);
    assert.match(catalogSrc, /catalogTotalBytes/);
  });

  test("鍵は 4 言語そろっている", () => {
    const keys = ["packUsageTotal", "packUsageTotalNoCap", "packUsageShare", "packUsageFree", "packUsageHeaviest",
      "packUsageUnused", "packSelectAll", "packSelectUnused", "packSelectNone", "packSelectOne",
      "packSelectCount", "packDeletePicked", "packDeletePickedNone", "packDeleteSelectedConfirm",
      "packDeleteSelectedConfirmActive", "packDeletedMany", "packDeletedSome", "packDeleteNone",
      "packWipeAll", "packWipeAllHint", "packWipeConfirm", "packWipeType", "packWipeBadWord",
      "packWipeNone", "packWipeDone", "catalogRemoveAllLabel", "catalogRemoveNone", "catalogRemoveDone",
      "catalogTotalBytes"];
    for (const key of keys) {
      const n = (i18nSrc.match(new RegExp(`\\b${key}:`, "g")) || []).length;
      assert.equal(n, 4, `${key} が 4 言語そろっていない（${n}）`);
    }
  });

  test("見た目（CSS）とキャッシュの版", () => {
    assert.ok(css.includes(".packUsageBar"));
    assert.ok(css.includes(".packPick"));
    /* 📦 trk235 でアプリの殻（pack-catalog.js・custom.js・index.html）が変わったので、版の名前は trk235 */
    assert.ok(sw.includes('"trk-v2026.11.01-trk235"'));
  });

  test("1件だけ消す道（これまでどおり）は残っている", () => {
    assert.match(custom, /async function deletePackById\(id\)/);
    assert.match(custom, /confirm\(tr\("confirmDeletePack"\)\)/);
  });
});

/* 🧮 保存量の「見える化」は、数え方が怪しいと意味がありません。
   ここは idbStore の集計（index のキーだけを読む速い道）と、その落とし穴を見ます。 */
describe("trk234 保存量の数え方（idbStore の集計）", () => {
  test("合計は size の index だけで数え、件数と食い違えば全件を数え直す", () => {
    const src = between(read("js/core.js"), "const statsFromKeys = ", "return {");
    assert.match(src, /keys\.length !== count/);
    assert.match(src, /return null;/);
    const all = between(read("js/core.js"), "const statsFromAll = ", "/* stats を取る共通部分");
    assert.match(all, /os\.getAll\(\)/);
  });

  test("読み出しは純粋関数（packUsageInfo）を通すので、画面の外でも同じ数字になる", () => {
    const info = ctx.packUsageInfo([rec("a", 2 * MB, true), rec("b", 3 * MB)], 1024 * MB);
    assert.equal(ctx.packSizeText(info.total), "5.0 MB");
  });
});

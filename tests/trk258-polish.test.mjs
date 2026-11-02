// SPDX-License-Identifier: GPL-3.0-or-later
/* 🗓 trk258：r10 の受け皿（R3・R4・R5）。
 *
 *   ・R3 目録の版（`catalog/index.json` の `updatedAt`）を一覧の要約に出す（4言語）
 *   ・R4 セットの要約を「これから入る分」にそろえる（r10 を r9 の上に入れると 1 本だけ飛ぶ）
 *   ・R5 `check:a11y` に「ボタンの読み上げ名」を足す（JS が後から入れるものは id の許可リスト）
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const html = read("index.html");
const swSrc = read("sw.js");
const catalog = read("js/pack-catalog.js");
const a11y = read("tools/check-a11y.mjs");
const i18nSrc = read("js/i18n.js");
const handoff = read("docs/HANDOFF.md");

/* 辞書を vm で起こして、4言語のキーを比べる（trk255 と同じやり方） */
function dicts() {
  const box = {};
  box.window = box; box.globalThis = box; box.self = box;
  vm.createContext(box);
  /* i18n.js の `const TEXT` は仮想マシンの文脈の外へ出ないので、同じスクリプトの最後で拾う */
  vm.runInContext(i18nSrc + "\n;globalThis.__TRK_TEXT__ = TEXT;", box);
  const TEXT = box.__TRK_TEXT__;
  assert.ok(TEXT && TEXT.ja, "TEXT が読める");
  return TEXT;
}

describe("trk258 R3 目録の版を一覧に出す", () => {
  test("要約に updatedAt（日付）を足している", () => {
    /* 🗓 trk259：UTC を切るのではなく、端末の日付に直す関数を通す（レビュー 01 §1 #1） */
    assert.match(catalog, /tr\("catalogUpdated", \{ date: catalogDay\(current\.updatedAt\) \}\)/);
    assert.match(catalog, /updatedAt: str\(raw\.updatedAt, 40\)/, "読む側は今のまま（40字まで）");
  });

  test("4言語に `catalogUpdated` がある", () => {
    const T = dicts();
    for (const lang of ["ja", "en", "zh", "ko"]) {
      assert.equal(typeof T[lang].catalogUpdated, "string", lang);
      assert.match(T[lang].catalogUpdated, /\{date\}/, lang);
    }
  });
});

describe("trk258 R4 セットの要約を「これから入る分」にそろえる", () => {
  test("要約の数と大きさは setPending（これから入る分）から作る", () => {
    const block = catalog.slice(catalog.indexOf("async function applySet"), catalog.indexOf("async function importSetFile"));
    assert.match(block, /const pend = setPending\(plan, installed\);/);
    assert.match(block, /n:pend\.pending\.length, size:formatBytes\(pend\.bytes\)/);
    assert.match(block, /catalogSetSummarySkip/);
  });

  test("終わりの「入れた n 件」は、実際に入った分の大きさを使う", () => {
    const block = catalog.slice(catalog.indexOf("async function applySet"), catalog.indexOf("async function importSetFile"));
    assert.match(block, /okBytes \+= Number\(item\.entry\.bytes\)/);
    assert.match(block, /catalogSetDone", \{ ok, skip, bad, miss, size:formatBytes\(okBytes\) \}/);
  });

  test("4言語に `catalogSetSummarySkip` がある（{skip} つき）", () => {
    const T = dicts();
    for (const lang of ["ja", "en", "zh", "ko"]) {
      assert.equal(typeof T[lang].catalogSetSummarySkip, "string", lang);
      assert.match(T[lang].catalogSetSummarySkip, /\{skip\}/, lang);
    }
  });
});

describe("trk258 R5 ボタンの読み上げ名", () => {
  test("画面のタップ鍵 2 つに data-i18n-aria を付けた", () => {
    assert.match(html, /<button type="button" data-slot="0" data-i18n-aria="ariaLaneLeft">/);
    assert.match(html, /<button type="button" data-slot="1" data-i18n-aria="ariaLaneRight">/);
    const T = dicts();
    for (const lang of ["ja", "en", "zh", "ko"]) {
      assert.ok(T[lang].ariaLaneLeft, lang);
      assert.ok(T[lang].ariaLaneRight, lang);
    }
  });

  test("check-a11y にボタンの検査がある（許可リストは 10 件・HTML に実在する）", async () => {
    assert.match(a11y, /every <button> has an accessible name/);
    /* 🗓 trk259：一覧は tools/lib/button-names.mjs へ（検査とテストで写しを持たない） */
    const { RUNTIME_NAMED } = await import("../tools/lib/button-names.mjs");
    assert.equal(RUNTIME_NAMED.length, 10, RUNTIME_NAMED.map(([id]) => id).join(","));
    for (const [id] of RUNTIME_NAMED) assert.ok(html.includes(`id="${id}"`), `${id} が index.html に無い`);
  });

  test("許可リストの id が HTML から消えたら FAIL する（見張りが効く）", async () => {
    const { namedProblems } = await import("../tools/lib/button-names.mjs");
    const problems = namedProblems("<html></html>", "");
    assert.ok(problems.some(p => /index\.html に id がありません/.test(p)));
  });
});

describe("trk258 版と記録", () => {
  test("cache と meta の版がそろっている（版上げで赤くならない）", () => {
    const cache = (swSrc.match(/const CACHE = "trk-v[\d.]+-(trk\d+)";/) || [])[1];
    const meta = (html.match(/<meta name="trk-build" content="(trk\d+)">/) || [])[1];
    assert.ok(cache, "sw.js の CACHE に版名がある");
    assert.equal(cache, meta, "sw.js と index.html の版が違う");
    assert.equal((html.match(/name="trk-build"/g) || []).length, 1);
  });

  test("HANDOFF §1.5 の cache 名も同じ版", () => {
    const cache = (swSrc.match(/const CACHE = "trk-v[\d.]+-(trk\d+)";/) || [])[1];
    assert.ok(handoff.includes(`trk-v2026.11.02-${cache}@<スコープ>`), cache);
  });
});

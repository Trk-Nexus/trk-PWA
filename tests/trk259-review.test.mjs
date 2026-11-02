// SPDX-License-Identifier: GPL-3.0-or-later
/* 🗓 trk259：レビュー（`trk-Nexus-review-trk258-2026-11-02.zip`）の推奨 3 点を、そのまま見張りにする
 *
 *   01 §1 #1：目録の版（R3）が **UTC の日付** のままだった
 *       → `catalogDay()` で端末の日付に直す（日付だけの目録・読めない値は今までどおり）
 *   01 §1 #2：セットの進捗だけ分母が `plan.packs.length`（30）のままだった
 *       → `pend.pending.length`（29）にそろえる（要約・確認と同じ母集団）
 *   01 §1 #3：許可リストが「HTML に id がある」しか見ておらず、JS の文言設定が消えても緑だった
 *       → 根拠の式（`tools/lib/button-names.mjs`）を毎回 `js/` に照らす
 *   01 §5：手順書の期待値が古い → dry-run を正とする書き方と、実測値を入れる
 *   01 §4-1：`TRK_PWA_REF` は **40 桁**（`actions/checkout` は短い SHA を枝名として探す）
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const src = read("js/pack-catalog.js");
const zipSrc = read("js/zip-io.js");
const html = read("index.html");
const swSrc = read("sw.js");
const runbook = read("docs/TRK-STABLE-RUNBOOK-2026-11-02.md");
const reply18 = read("docs/2026-11-02-レビューへの返事-trk258.md");
const request = read("docs/REVIEW-REQUEST-TRK258-2026-11-02.md");
const FULL_SHA = "722409a04de3fd72526f19d87e78c25c97983226";

function loadModules({ Date: DateCtor = Date, installed = [], statuses = [], summary = null } = {}) {
  const sandbox = {
    window: {}, console, crypto, Promise, JSON, Math, Number, String, Object, Array, Set, Map, Error,
    Blob, File, Uint8Array, DataView, ArrayBuffer, BigInt, Uint32Array, TextEncoder, TextDecoder, Response,
    CompressionStream, DecompressionStream, Date: DateCtor,
    document: {
      readyState: "complete",
      getElementById: id => (id === "catalogSummary" ? summary : null),
      createElement: () => ({ style: {}, append() {}, addEventListener() {} }),
    },
    addEventListener: () => {}, confirm: () => true, CSS: { escape: s => s },
    tr: (k, vars) => k + (vars ? JSON.stringify(vars) : ""),
  };
  sandbox.window = sandbox;
  sandbox.window.Trk = { core: { setStatus: (area, key, vars) => statuses.push({ area, key, vars }), $: () => null } };
  sandbox.window.Trk.custom = {
    listInstalledPacks: async () => installed,
    installPackFile: async () => true,
  };
  vm.createContext(sandbox);
  vm.runInContext(zipSrc, sandbox, { filename: "js/zip-io.js" });
  vm.runInContext(src, sandbox, { filename: "js/pack-catalog.js" });
  return { api: sandbox.window.Trk.packCatalog, Z: sandbox.window.Trk.zipIO };
}

/* ---------- R3：目録の版は端末の日付で ---------- */
describe("trk259 R3 目録の版（UTC ではなく端末の日付）", () => {
  test("UTC の目録を、端末（ここでは日本）の日付に直す", () => {
    /* 端末の現地時刻を 2026-11-03 に固定した Date を渡す。UTC を切る実装だと 11-02 のままになる */
    class LocalThird extends Date {
      getFullYear() { return 2026; }
      getMonth() { return 10; }     /* 0 始まり＝11 月 */
      getDate() { return 3; }
    }
    const { api } = loadModules({ Date: LocalThird });
    assert.equal(api.catalogDay("2026-11-02T20:30:00.000Z"), "2026-11-03");
    /* 日本時間の朝 9 時前（＝UTC では前日）が、ちゃんと当日になる例 */
    assert.equal(api.catalogDay("2026-11-02T23:59:00.000Z"), "2026-11-03");
  });

  test("日付だけの目録は動かさない／読めない値は先頭 10 文字", () => {
    const { api } = loadModules();
    assert.equal(api.catalogDay("2026-11-02"), "2026-11-02");
    assert.equal(api.catalogDay("not-a-date"), "not-a-date");
    assert.equal(api.catalogDay(""), "");
    assert.equal(api.catalogDay(undefined), "");
  });

  test("本物の Date でも、端末の getter と同じ日付になる", () => {
    const { api } = loadModules();
    const iso = "2026-11-02T02:28:04.492Z";
    const d = new Date(iso);
    const p = n => String(n).padStart(2, "0");
    assert.equal(api.catalogDay(iso), `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`);
  });

  test("要約はその関数を通す（slice(0,10) に戻っていない）", () => {
    assert.match(src, /tr\("catalogUpdated", \{ date: catalogDay\(current\.updatedAt\) \}\)/);
    assert.equal(src.includes("String(current.updatedAt).slice(0, 10)"), false);
  });
});

/* ---------- R4：進捗の分母も「これから入る分」 ---------- */
describe("trk259 R4 セットの進捗（分母を要約・確認とそろえる）", () => {
  const pack = (id, size, version = "1.0.0") => ({
    id, name: id, author: "trk", version, file: `font-packs/${id}.stpack`,
    /* 中身は "x" を size 個。sha256 もそれに合わせる（アプリの照合を通すため） */
    sha256: crypto.createHash("sha256").update("x".repeat(size)).digest("hex"), bytes: size,
    fonts: [],
  });
  const rec = (p, release) => ({ id: p.id, name: p.name, author: p.author, release, bytes: p.bytes, active: false });

  test("飛ばす 2 本は進捗に数えない（n＝pending、done は 1,2）", async () => {
    const packs = [pack("a", 100), pack("b", 200), pack("c", 300), pack("d", 400)];
    const installed = [rec(packs[0], "1.0.0"), rec(packs[1], "1.0.0"), rec(packs[2], "0.9.0")];
    const statuses = [];
    const { api, Z } = loadModules({ installed, statuses });
    const catalog = { format: "trk-avatar-library", version: 1, name: "目録", updatedAt: "2026-11-02T02:28:04.492Z", packs };
    const entries = [{ name: "catalog/index.json", blob: new Blob([JSON.stringify(catalog)]) }];
    for (const p of packs) entries.push({ name: p.file, blob: new Blob(["x".repeat(p.bytes)]) });
    entries.push({ name: "set.json", blob: new Blob([JSON.stringify({ format: "trk-set", version: 1, name: "セット", release: "r10" })]) });
    const file = new File([await Z.zipWrite(entries)], "set.stlib", { type: "application/octet-stream" });

    assert.equal(await api.importSetFile(file), true);
    const jobs = statuses.filter(s => s.key === "catalogSetProgress");
    /* 版が同じ 2 本（a・b）は飛ばす。入れるのは c（更新）と d（新規）＝2 本 */
    assert.equal(jobs.length, 2, JSON.stringify(statuses.map(s => s.key)));
    assert.deepEqual(jobs.map(j => j.vars.done), [1, 2]);
    assert.deepEqual(jobs.map(j => j.vars.n), [2, 2]);
  });

  test("分母に plan.packs.length を使っていない（飛ばす分を数え直さない）", () => {
    assert.equal(src.includes("n:plan.packs.length"), false);
    assert.match(src, /n:pend\.pending\.length/);
    /* done は「飛ばす」を continue した後に数える（順番も見る） */
    const loop = src.slice(src.indexOf("for (const item of plan.packs)"), src.indexOf("await refreshInstalled()", src.indexOf("for (const item of plan.packs)")));
    assert.ok(loop.indexOf("continue;") < loop.indexOf("done++;"), "done++ は飛ばす判定の後");
  });
});

/* ---------- R5：許可リストの根拠 ---------- */
describe("trk259 R5 許可リストが嘘をつかない", () => {
  const jsText = fs.readdirSync(path.join(ROOT, "js"))
    .filter(f => f.endsWith(".js"))
    .map(f => read(path.join("js", f))).join("\n");

  test("10 件とも根拠の式が js/ に実在し、id も HTML にある", async () => {
    const { RUNTIME_NAMED, namedProblems } = await import("../tools/lib/button-names.mjs");
    assert.equal(RUNTIME_NAMED.length, 10);
    for (const row of RUNTIME_NAMED) assert.equal(row.length, 3, `${row[0]} に根拠が無い`);
    assert.deepEqual(namedProblems(html, jsText), []);
  });

  test("根拠を消したら落ちる（空回りしていない）", async () => {
    const { namedProblems } = await import("../tools/lib/button-names.mjs");
    const broken = jsText.replace(/textContent/g, "removed");
    const problems = namedProblems(html, broken);
    assert.ok(problems.length >= 5, `${problems.length} 件しか落ちない`);
    assert.ok(problems.some(p => p.startsWith("studyOpenBtn")));
  });
});

/* ---------- 版・文書 ---------- */
describe("trk259 版と文書", () => {
  /* 版名を直書きすると版を上げるたびに落ちる（trk258 で同じ失敗をした）。
     trk259 以降は「sw の CACHE と meta が**そろっている**」ことを見る。 */
  test("cache と meta の版がそろっている", () => {
    const cache = (swSrc.match(/const CACHE = "trk-v[\d.]+-(trk\d+)";/) || [])[1];
    const meta = (html.match(/<meta name="trk-build" content="(trk\d+)">/) || [])[1];
    assert.ok(cache, "sw.js の CACHE に版名がある");
    assert.ok(meta, "index.html に trk-build がある");
    assert.equal(cache, meta, `sw=${cache} / meta=${meta} が食い違っている`);
  });

  test("手順書の期待値が今の実測（レビュー 01 §5）になっている", () => {
    for (const n of ["516", "116", "45", "355", "62", "425", "161", "1339"]) {
      assert.ok(runbook.includes(n), `手順書に ${n} が無い`);
    }
    assert.match(runbook, /dry-run/, "数字は dry-run を正とする、と書く");
  });

  test("TRK_PWA_REF は 40 桁で書く（短い SHA は枝名として探される）", () => {
    for (const [name, text] of [["返事18", reply18], ["レビュー依頼", request]]) {
      assert.ok(text.includes(FULL_SHA), `${name} に 40 桁の SHA が無い`);
      assert.equal(/(?<![\w])722409a(?![\w])/.test(text), false, `${name} に 7 桁のままの SHA が残っている`);
    }
  });
});

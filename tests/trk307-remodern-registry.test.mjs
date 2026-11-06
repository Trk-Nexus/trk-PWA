// SPDX-License-Identifier: GPL-3.0-or-later
/* trk307：登録簿との照合（R3 ②③）。
   見張ること：
   ・写し（data/re-modern-registry.json）は meta の sha256 と一致（そのままの写し）
   ・壊れた・読めない・版違い・ID 不正・重複 → 全部「未確認」
   ・空の登録簿では、どの作品も「登録済み」にならない
   ・未確認の作品は、題字に当てない・一覧に「未確認」と出す
   ・写しは SW の先読みに入る（オフラインでも読める） */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");

function load() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(read("js/remodern-registry.js"), ctx);
  return ctx.TrkReModernRegistry;
}
const ID = "trk-re-modern-pixel-console";
const good = ids => JSON.stringify({ format: "trk-re-modern-registry", version: 1, ids });

test("写し：data/re-modern-registry.json は meta の sha256 と一致（バイトのまま）", () => {
  const meta = JSON.parse(read("data/re-modern-registry.meta.json"));
  const bytes = fs.readFileSync(path.join(ROOT, "data/re-modern-registry.json"));
  assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), meta.source.sha256);
  assert.equal(meta.source.path, "catalog/re-modern/index.json");
  assert.match(meta.source.commit, /^[0-9a-f]{40}$/);
  assert.equal(meta.source.repo, "https://github.com/Trk-Nexus/trk-Avatar-Library");
});

test("写し：現在の写しは空の登録簿（どの作品も未確認）", () => {
  const R = load();
  const r = R.check(JSON.parse(read("data/re-modern-registry.json")));
  assert.equal(r.ok, true);
  assert.deepEqual([...r.ids], []);
  assert.equal(R.statusOf(ID, r), "unverified");
});

test("読み方：形が違うものは全部未確認（安全側）", () => {
  const R = load();
  const cases = {
    "not-object": null,
    "bad-format": { format: "x", version: 1, ids: [] },
    "bad-version": { format: "trk-re-modern-registry", version: 2, ids: [] },
    "bad-ids": { format: "trk-re-modern-registry", version: 1, ids: "x" },
    "bad-id": { format: "trk-re-modern-registry", version: 1, ids: [ID, "../x"] },
    "duplicate-id": { format: "trk-re-modern-registry", version: 1, ids: [ID, ID] }
  };
  for (const [reason, raw] of Object.entries(cases)) {
    const r = R.check(raw);
    assert.equal(r.ok, false, reason);
    assert.equal(r.reason, reason);
    assert.equal(R.statusOf(ID, r), "unverified", reason);
  }
});

test("照合：登録簿に載っていれば登録済み。載っていなければ未確認。壊れていれば載っていても未確認", () => {
  const R = load();
  const ok = R.check(JSON.parse(good([ID])));
  assert.equal(R.statusOf(ID, ok), "registered");
  assert.equal(R.statusOf("trk-re-modern-other", ok), "unverified");
  assert.equal(R.statusOf(undefined, ok), "unverified");
  const broken = { ok: false, ids: [ID], reason: "bad-id" };
  assert.equal(R.statusOf(ID, broken), "unverified");
});

test("読み込み：読めない・無い・例外 → 未確認。読めれば検査した結果", async () => {
  const R = load();
  const missing = await R.load(async () => ({ ok: false }));
  assert.equal(missing.ok, false);
  assert.equal(missing.reason, "missing");
  const thrown = await R.load(async () => { throw new Error("offline"); });
  assert.equal(thrown.reason, "unreadable");
  const fine = await R.load(async (url, opts) => {
    assert.equal(url, "data/re-modern-registry.json");
    assert.equal(opts.credentials, "same-origin");
    return { ok: true, text: async () => good([ID]) };
  });
  assert.equal(R.statusOf(ID, fine), "registered");
});

test("画面：未確認の作品は題字に当てない・一覧に「未確認」と出す", () => {
  const ui = read("js/remodern-ui.js");
  assert.ok(ui.includes('if (!pick || statusOfWork(pick.id) !== "registered") { PAINT.clearTitle(h1); return; }'));
  assert.ok(ui.includes('statusOfWork(id) === "registered" ? label : `${label}（${tr("remodernUnverified")}）`'));
  assert.ok(ui.includes("if (REG) REG.load().then(r => { registry = r; render(); });"));
  assert.ok(ui.includes('unverified: statusOfWork(checked.work.id) !== "registered"'));
});

test("読み込み順と SW：登録簿の道具は remodern-ui.js より前、写しは先読みに入る", () => {
  const html = read("index.html");
  const reg = html.indexOf('<script src="js/remodern-registry.js">');
  const ui = html.indexOf('<script src="js/remodern-ui.js">');
  assert.ok(reg > 0 && ui > 0 && reg < ui);
  assert.ok(read("sw.js").includes('"data/re-modern-registry.json"]'));
});

test("文言：未確認の 2 キーが 4 言語にある", () => {
  const i18n = read("js/i18n.js");
  for (const l of ["ja", "en", "zh", "ko"]) {
    const start = i18n.indexOf(`\n  ${l}: {`);
    const block = i18n.slice(start);
    assert.match(block, /remodernUnverified:"[^"\n]+"/, `${l} remodernUnverified`);
    assert.match(block, /remodernUnverifiedNote:"[^"\n]+"/, `${l} remodernUnverifiedNote`);
  }
});

// SPDX-License-Identifier: GPL-3.0-or-later
/* trk296：trk-re-modern の領域ごとの選択（段階1・純粋な道具）。
   見張ること：
   ・領域は共通・書斎・基地。1 回の変更は 1 つの領域だけ（他は動かない）
   ・未知・壊れた値は keep に落ち、保存した作品 ID は消えない（未知の作品は表示だけ既存へ）
   ・follow は共通の作品に連動。対応しない領域は既存表示
   ・戻すのは直前の状態。利用者が後で変えていれば上書きせず競合を返す
   ・作品の値は許可リストで検証（任意の URL・記述は不可） */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const src = fs.readFileSync(path.join(ROOT, "js/remodern-regions.js"), "utf8");
const sandbox = { globalThis: null };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const R = sandbox.TrkReModernRegions;
/* vm の別の実行環境のオブジェクトを比べるため、中身を JSON で比べる */
const same = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));

const WORK = { id: "trk-re-modern-pixel-console", regions: ["common", "study", "base"], colors: { bg: "#0b0f14" } };
const STUDY_ONLY = { id: "trk-re-modern-study-only", regions: ["study"] };
const CATALOG = { [WORK.id]: WORK, [STUDY_ONLY.id]: STUDY_ONLY };

test("既定は全領域 keep（既存の表示は変わらない・D4）", () => {
  const s = R.defaultState();
  const view = R.resolve(s, CATALOG);
  for (const r of R.REGIONS) assert.equal(view[r].source, "keep");
});

test("1 回の変更は 1 つの領域だけ", () => {
  const s0 = R.defaultState();
  const s1 = R.setRegion(s0, "base", "own", WORK.id);
  same(s1.study, s0.study);
  same(s1.common, s0.common);
  assert.equal(s1.base.work, WORK.id);
});

test("共通は follow を持たない（keep か own のみ）", () => {
  assert.throws(() => R.setRegion(R.defaultState(), "common", "follow", null));
  const r = R.normalize({ common: { mode: "follow", work: WORK.id } });
  assert.equal(r.state.common.mode, "keep");
  assert.ok(r.warnings.some(w => w.region === "common" && w.reason === "bad-mode"));
});

test("follow は共通の作品に連動し、対応しない領域は既存表示に落ちる", () => {
  let s = R.setRegion(R.defaultState(), "common", "own", WORK.id);
  s = R.setRegion(s, "study", "follow", null);
  s = R.setRegion(s, "base", "follow", null);
  const view = R.resolve(s, CATALOG);
  assert.equal(view.study.source, "follow");
  assert.equal(view.study.work, WORK.id);
  assert.equal(view.base.source, "follow");
  /* STUDY_ONLY は共通に選んでも、書斎以外では使わない */
  const s2 = R.setRegion(R.defaultState(), "common", "own", STUDY_ONLY.id);
  const v2 = R.resolve(R.setRegion(s2, "base", "follow", null), CATALOG);
  assert.equal(v2.common.source, "keep", "共通は対応しない作品は使わない（既存表示）");
  assert.equal(v2.common.fallback, "unsupported-region");
});

test("未知の作品 ID は保存に残し、表示だけ既存へ落とす（利用者データを消さない）", () => {
  const s = { base: { mode: "own", work: "trk-re-modern-gone" } };
  const r = R.normalize(s);
  assert.equal(r.state.base.work, "trk-re-modern-gone", "保存は残る");
  const view = R.resolve(s, CATALOG);
  assert.equal(view.base.source, "keep");
  assert.equal(view.base.fallback, "unknown-work");
});

test("壊れた値は keep に落ち、警告を残す（例外にしない）", () => {
  const cases = [null, "x", 3, { study: null }, { study: { mode: "eval", work: "x" } }, { base: { mode: "own", work: "<script>" } }];
  for (const c of cases) {
    const r = R.normalize(c);
    for (const reg of R.REGIONS) assert.ok(R.MODES.includes(r.state[reg].mode));
  }
  const bad = R.normalize({ base: { mode: "own", work: "<script>" } });
  assert.equal(bad.state.base.work, null);
  assert.ok(bad.warnings.some(w => w.reason === "bad-work-id"));
});

test("作品の検証：許可リストの外（URL・未知の領域・不正な色）は不可", () => {
  assert.equal(R.validateWork(WORK).ok, true);
  assert.equal(R.validateWork({ ...WORK, id: "https://x.example/a" }).ok, false);
  assert.equal(R.validateWork({ ...WORK, regions: ["menu"] }).reason, "unknown-region");
  assert.equal(R.validateWork({ ...WORK, colors: { bg: "url(javascript:1)" } }).reason, "bad-color");
  assert.equal(R.validateWork({ ...WORK, heading: { font: "https://evil.example/x.woff2" } }).reason, "bad-heading-font");
  assert.equal(R.validateWork({ ...WORK, heading: { font: "dotgothic" } }).ok, true);
});

test("戻す：利用者が触っていなければ直前へ戻る（他の領域は動かない）", () => {
  const s0 = R.setRegion(R.defaultState(), "study", "keep", null);
  const applied = R.apply(s0, "base", "own", WORK.id);
  const back = R.revert(applied.state, applied.snapshot);
  assert.equal(back.conflict, false);
  same(back.state.base, { mode: "keep", work: null });
});

test("戻す：適用後に利用者が変えていたら上書きせず競合を返す", () => {
  const applied = R.apply(R.defaultState(), "base", "own", WORK.id);
  const changed = R.setRegion(applied.state, "base", "own", STUDY_ONLY.id);
  const back = R.revert(changed, applied.snapshot);
  assert.equal(back.conflict, true);
  assert.equal(back.state.base.work, STUDY_ONLY.id, "利用者の変更は残る");
});

test("領域の解除は他の領域・保存を変えない", () => {
  let s = R.setRegion(R.defaultState(), "common", "own", WORK.id);
  s = R.setRegion(s, "study", "own", STUDY_ONLY.id);
  s = R.setRegion(s, "base", "own", WORK.id);
  const cleared = R.setRegion(s, "study", "keep", null);
  assert.equal(cleared.study.mode, "keep");
  same(cleared.common, s.common);
  same(cleared.base, s.base);
});

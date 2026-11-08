// SPDX-License-Identifier: GPL-3.0-or-later
/* trk308：書斎・基地への適用、適用前の表示、「戻す」（R3 ④ の土台）。
   見張ること：
   ・選んだだけでは変わらない（適用で初めて変える。影響範囲を先に見せる）
   ・適用の前の状態を覚え、「戻す」で戻す。後で変えられていれば上書きしない（競合）
   ・壊れた「直前の記録」は読まない（null）
   ・リセットで「直前の記録」も消す
   ・画面の文言は 4 言語とも揃っている */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
function loadR() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(read("js/remodern-regions.js"), ctx);
  return ctx.TrkReModernRegions;
}
const ID = "trk-re-modern-pixel-console";

test("適用：前の状態を覚え、他の領域は変えない", () => {
  const R = loadR();
  const s0 = R.defaultState();
  const a = R.apply(s0, "study", "own", ID);
  assert.equal(a.state.study.mode, "own");
  assert.equal(a.state.study.work, ID);
  assert.equal(a.state.common.mode, s0.common.mode);
  assert.equal(a.state.base.mode, s0.base.mode);
  assert.equal(a.snapshot.region, "study");
  assert.equal(a.snapshot.before.mode, s0.study.mode);
});

test("戻す：利用者が触っていなければ直前へ戻る。変わっていれば戻さず競合", () => {
  const R = loadR();
  const a = R.apply(R.defaultState(), "common", "own", ID);
  const back = R.revert(a.state, a.snapshot);
  assert.equal(back.conflict, false);
  assert.equal(back.state.common.mode, R.defaultState().common.mode);
  const moved = { ...a.state, common: { mode: "keep", work: null } };
  const c = R.revert(moved, a.snapshot);
  assert.equal(c.conflict, true);
  assert.equal(c.state.common.mode, "keep", "競合のときは上書きしない");
});

test("直前の記録の検査：壊れていれば null（戻せない）", () => {
  const R = loadR();
  assert.equal(R.sanitizeSnapshot(null), null);
  assert.equal(R.sanitizeSnapshot("x"), null);
  assert.equal(R.sanitizeSnapshot({ region: "nope", before: {}, after: {} }), null);
  assert.equal(R.sanitizeSnapshot({ region: "common", before: { mode: "bogus" }, after: { mode: "keep" } }), null);
  // 壊れた作品 ID は落とす（null に置き換え）。記録自体は読めるまま
  assert.deepEqual(JSON.parse(JSON.stringify(R.sanitizeSnapshot({ region: "study", before: { mode: "keep" }, after: { mode: "own", work: "../../x" } }))), { region: "study", before: { mode: "keep", work: null }, after: { mode: "own", work: null } });
  const ok = R.sanitizeSnapshot({ region: "study", before: { mode: "keep", work: null }, after: { mode: "own", work: ID } });
  assert.deepEqual(JSON.parse(JSON.stringify(ok)), { region: "study", before: { mode: "keep", work: null }, after: { mode: "own", work: ID } });
  // 共通は「共通の選択肢」（keep・own）だけを許す。それ以外のモードは読まない
  assert.equal(R.sanitizeSnapshot({ region: "common", before: { mode: "keep" }, after: { mode: "pick", work: ID } }), null);
});

test("保存：core.js は remodernLast を検査して読み込む。UI はリセットで消す", () => {
  const core = read("js/core.js");
  assert.match(core, /remodernLast:\s*.*sanitizeSnapshot\(prefs\.remodernLast\)/);
  const ui = read("js/remodern-ui.js");
  assert.match(ui, /core\.settings\.remodernLast = null;\s*\n\s*core\.saveUserPrefs\(\);/);
});

test("画面：選んだだけでは保存しない（change は表示の更新のみ）", () => {
  const ui = read("js/remodern-ui.js");
  assert.match(ui, /modeSel\.addEventListener\("change", onPick\)/);
  assert.match(ui, /workSel\.addEventListener\("change", onPick\)/);
  assert.match(ui, /dlgMode\.addEventListener\("change", refreshDlg\)/);
  assert.doesNotMatch(ui, /addEventListener\("change", \(\) => \{\s*\n[^}]*commit\(/);
  assert.match(ui, /R\.apply\(current\(\)/);
  assert.match(ui, /R\.revert\(current\(\)/);
});

test("HTML：3 行と書斎ダイアログに 影響範囲・適用・戻す の部品がある", () => {
  const html = read("index.html");
  for (const r of ["common", "study", "base"]) {
    assert.match(html, new RegExp(`id="remodern-${r}-impact"`));
    assert.match(html, new RegExp(`id="remodern-${r}-apply"`));
    assert.match(html, new RegExp(`id="remodern-${r}-undo"`));
  }
  assert.match(html, /id="remodernDlgImpact"/);
  assert.match(html, /id="remodernDlgApply"/);
  assert.match(html, /id="remodernDlgUndo"/);
});

test("文言：新しいキーは 4 言語とも揃っている", () => {
  const i18n = read("js/i18n.js");
  const keys = ["remodernApply", "remodernUndo", "remodernApplied", "remodernUndone", "remodernNothingUndo", "remodernConflict", "remodernImpactKeep", "remodernImpactSame", "remodernImpactCommon", "remodernImpactLater", "remodernImpactUnverified", "remodernImpactPick"];
  for (const k of keys) {
    const n = (i18n.match(new RegExp(`\\b${k}:`, "g")) || []).length;
    assert.equal(n, 4, `${k} は 4 言語ぶん必要（今は ${n}）`);
  }
});

test("版：trk308（index.html・sw.js）", () => {
  assert.match(read("index.html"), /name="trk-build" content=\"trk320\"/);
  assert.match(read("sw.js"), /const CACHE = "trk-v2026\.11\.04-trk320";/);
});

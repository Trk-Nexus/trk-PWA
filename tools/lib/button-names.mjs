// SPDX-License-Identifier: GPL-3.0-or-later
/* 🔤 ボタンの読み上げ名を「JS が後から入れる」ものの許可リスト（trk258 で作り、trk259 で根拠つきにした）
 *
 *   `tools/check-a11y.mjs` の検査8が使い、`tests/trk258-polish.test.mjs` と `tests/trk259-review.test.mjs` が
 *   同じ一覧を見ます（検査とテストで写しを持たない）。
 *
 *   1件の形：[id, なぜ静的でないか, 根拠の式]
 *     ・id は `index.html` に実在すること（消えたら FAIL）
 *     ・根拠の式（need）は `js/` のどれかに実在すること（文言の設定を消したら FAIL）
 *
 *   ⚠ 増やすときは、**根拠の式まで書く**（レビュー 01 §1 #3：「HTML に id がある」だけでは、
 *     JS の文言設定が消えても緑のままになる）。
 */
export const RUNTIME_NAMED = [
  ["studyOpenBtn", "study-room.js が開いたときに文字を入れる", /studyOpenBtn\.textContent = tr\("studyOpenBtn"\)/],
  ["libSkinBtn", "lib-skins.js がタイトルと読み上げ名を入れる", /b\.title = tr\("libSkinBtnTitle"\); b\.setAttribute\("aria-label", b\.title\)/],
  ["libReconnectBtn", "library.js の showReconnect() が入れる", /function showReconnect\(\)[\s\S]{0,500}?b\.textContent = tr\(/],
  ["mediaKeepCurrentBtn", "library.js が文字と読み上げ名を入れる", /button\.textContent = label;[\s\S]{0,160}?button\.setAttribute\("aria-label"/],
  ["skinHiddenRestore", "core.js が入れる", /noteBtn\.textContent = tr\("skinHiddenRestore"\)/],
  ["skinManageHideUnused", "core.js が件数つきで入れる", /hideUnusedBtn\.textContent = tr\("skinManageHideUnused"/],
  ["skinManageRestoreAll", "core.js が件数つきで入れる", /restoreBtn\.textContent = tr\("skinManageRestoreAll"/],
  ["packDeletePicked", "custom.js が件数つきで入れる", /btn\.textContent = plan\.count[\s\S]{0,80}?tr\("packDeletePicked"/],
  ["catalogRemoveAll", "pack-catalog.js が件数つきで入れる", /bulkBtn\.textContent = tr\("catalogRemoveAllLabel"/],
  ["trkRestoreBtn", "library.js が件数つきで入れる", /restore\.textContent = tr\("trkRestoreBtn"/],
];

/* 一覧の形が壊れていないか（テストと検査の両方から使う） */
export function namedProblems(html, jsText) {
  const problems = [];
  for (const [id, why, need] of RUNTIME_NAMED) {
    if (!(need instanceof RegExp)) problems.push(`${id}: 根拠の式（RegExp）がありません`);
    else if (!need.test(jsText)) problems.push(`${id}: 根拠が js/ にありません（${why}）`);
    if (!new RegExp(`\\bid=["']${id}["']`).test(html)) problems.push(`${id}: index.html に id がありません`);
  }
  return problems;
}

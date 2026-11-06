// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 🎨 trk-re-modern：領域ごとの選択（段階1・純粋な道具） ============

   設計：docs/REMODERN-DESIGN-DRAFT-2026-11-06.md（D1＝書斎・基地の見た目まで、D4＝既存の表示は変えない）

   ・領域は 3 つ：共通（common）・書斎（study）・基地（base）
   ・各領域の状態：{ mode, work }
       keep   … 現状維持（既定。作品を使わない）
       follow … 共通で選んだ作品に連動（その領域に対応していれば）
       own    … この領域だけ独立の作品を選ぶ
     common は keep か own のみ（follow は持たない）
   ・未知の値・壊れた値は keep に落とす。利用者の保存データは勝手に消さない
     （未知の作品 ID は保存したまま、表示だけ既存の表示に落とす）
   ・適用は 1 つの領域だけを変える。他の領域・読書・再生・共通ノーツには触れない
   ・戻す操作は、適用直前の状態へ戻す。ただし適用後に利用者が変えていれば、上書きせず「競合」と返す

   この道具は DOM を使わない。画面への組み込みは次の段階。 */
(function () {
  "use strict";

  const REGIONS = Object.freeze(["common", "study", "base"]);
  const MODES = Object.freeze(["keep", "follow", "own"]);
  const COMMON_MODES = Object.freeze(["keep", "own"]);
  const WORK_ID = /^trk-re-modern-[a-z0-9][a-z0-9-]{0,63}$/;

  /* 作品の値は許可リストで検証する（任意の JS・HTML・CSS・URL は持たない） */
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const HEADING_FONTS = Object.freeze(["system", "dotgothic"]);

  const DEFAULT_REGION = Object.freeze({ mode: "keep", work: null });

  function defaultState() {
    return { version: 1, common: { ...DEFAULT_REGION }, study: { ...DEFAULT_REGION }, base: { ...DEFAULT_REGION } };
  }

  /* 作品の定義を検証する。不正なら理由を返す（例外は投げない） */
  function validateWork(work) {
    if (!work || typeof work !== "object") return { ok: false, reason: "not-object" };
    if (typeof work.id !== "string" || !WORK_ID.test(work.id)) return { ok: false, reason: "bad-id" };
    if (!Array.isArray(work.regions) || work.regions.length === 0) return { ok: false, reason: "bad-regions" };
    if (!work.regions.every(r => REGIONS.includes(r))) return { ok: false, reason: "unknown-region" };
    const colors = work.colors || {};
    for (const key of Object.keys(colors)) {
      if (typeof colors[key] !== "string" || !HEX.test(colors[key])) return { ok: false, reason: "bad-color" };
    }
    if (work.heading !== undefined) {
      const h = work.heading;
      if (!h || typeof h !== "object" || !HEADING_FONTS.includes(h.font)) return { ok: false, reason: "bad-heading-font" };
    }
    return { ok: true, reason: null };
  }

  /* 保存された状態を読む。壊れていても必ず使える形を返し、直した箇所を warnings に残す */
  function normalize(raw) {
    const warnings = [];
    const out = defaultState();
    if (!raw || typeof raw !== "object") return { state: out, warnings };
    for (const region of REGIONS) {
      const item = raw[region];
      if (!item || typeof item !== "object") continue;
      const allowed = region === "common" ? COMMON_MODES : MODES;
      let mode = item.mode;
      if (!allowed.includes(mode)) {
        warnings.push({ region, reason: "bad-mode" });
        mode = "keep";
      }
      const work = typeof item.work === "string" && WORK_ID.test(item.work) ? item.work : null;
      if (item.work != null && work === null) warnings.push({ region, reason: "bad-work-id" });
      out[region] = { mode, work: mode === "keep" ? null : work };
    }
    return { state: out, warnings };
  }

  /* 作品の一覧（catalog：id → 作品）から、領域ごとの実際の表示を決める */
  function resolve(state, catalog) {
    const s = normalize(state).state;
    const works = catalog || {};
    const commonWork = s.common.mode === "own" && s.common.work ? works[s.common.work] : null;
    const result = {};
    for (const region of REGIONS) {
      const item = s[region];
      if (item.mode === "keep") {
        result[region] = { source: "keep", work: null, fallback: null };
        continue;
      }
      const wantId = item.mode === "follow" ? (commonWork ? commonWork.id : null) : item.work;
      const work = wantId ? works[wantId] : null;
      if (!wantId) {
        result[region] = { source: "keep", work: null, fallback: item.mode === "follow" ? "no-common-work" : "no-work" };
      } else if (!work) {
        /* 未知の作品：保存は残し、表示だけ既存へ */
        result[region] = { source: "keep", work: null, fallback: "unknown-work", wanted: wantId };
      } else if (!work.regions.includes(region)) {
        result[region] = { source: "keep", work: null, fallback: "unsupported-region", wanted: wantId };
      } else {
        result[region] = { source: item.mode, work: work.id, fallback: null };
      }
    }
    return result;
  }

  /* 1 つの領域だけを変える（他の領域はそのまま） */
  function setRegion(state, region, mode, work) {
    if (!REGIONS.includes(region)) throw new Error("unknown region");
    const s = normalize(state).state;
    const allowed = region === "common" ? COMMON_MODES : MODES;
    if (!allowed.includes(mode)) throw new Error("bad mode");
    if (mode !== "keep" && work != null && !WORK_ID.test(work)) throw new Error("bad work id");
    const next = { ...s };
    next[region] = { mode, work: mode === "keep" ? null : (work || null) };
    return next;
  }

  /* 適用：直前の領域の状態を覚えておく（戻すため） */
  function apply(state, region, mode, work) {
    const before = normalize(state).state[region];
    const after = setRegion(state, region, mode, work);
    return { state: after, snapshot: { region, before: { ...before }, after: { ...after[region] } } };
  }

  /* 戻す：適用後のまま（＝利用者が触っていない）なら直前へ戻す。変わっていれば上書きしない */
  function revert(state, snapshot) {
    const current = normalize(state).state;
    const { region, before, after } = snapshot;
    const now = current[region];
    if (now.mode !== after.mode || now.work !== after.work) {
      return { state: current, conflict: true };
    }
    return { state: { ...current, [region]: { ...before } }, conflict: false };
  }

  const api = { REGIONS, MODES, COMMON_MODES, HEADING_FONTS, WORK_ID, defaultState, validateWork, normalize, resolve, setRegion, apply, revert };
  if (typeof globalThis !== "undefined") globalThis.TrkReModernRegions = api;
})();

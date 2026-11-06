// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 🎨 trk297：設定「🎨 スキン」の領域ごとの 3 行（trk-re-modern） ============

   共通・書斎・基地の 3 行。各行は「現状維持／共通に連動（書斎・基地）／この領域を独立」と作品を選ぶ。
   作品の一覧はまだ空（作品の読み込みは次の段階）。空のあいだは「作品はまだありません」と出す。
   1 行を変えても他の行には触れない。保存は設定（remodern）へ。道具は js/remodern-regions.js。 */
(() => {
  "use strict";
  const core = window.Trk && window.Trk.core;
  const R = window.TrkReModernRegions;
  const box = document.getElementById("remodernRegions");
  if (!core || !R || !box) return;

  const works = () => window.TrkReModernWorks || {};   /* 作品（次の段階で読み込む）。今は空 */
  const LABEL = { common: "remodernCommon", study: "remodernStudy", base: "remodernBase" };
  const MODE_LABEL = { keep: "remodernKeep", follow: "remodernFollow", own: "remodernOwn" };
  const status = document.getElementById("remodernStatus");

  function say(key) { if (status) status.textContent = key ? tr(key) : ""; }

  function fillModes(select, region) {
    select.textContent = "";
    for (const mode of (region === "common" ? R.COMMON_MODES : R.MODES)) {
      const opt = document.createElement("option");
      opt.value = mode;
      opt.textContent = tr(MODE_LABEL[mode]);
      select.append(opt);
    }
  }
  function fillWorks(select, region) {
    select.textContent = "";
    const none = document.createElement("option");
    none.value = "";
    none.textContent = tr("remodernNoWork");
    select.append(none);
    for (const id of Object.keys(works())) {
      const w = works()[id];
      if (!w || !Array.isArray(w.regions) || !w.regions.includes(region)) continue;
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = (w.name && String(w.name).slice(0, 60)) || id;
      select.append(opt);
    }
  }

  function render() {
    const state = core.settings.remodern || R.defaultState();
    const view = R.resolve(state, works());
    for (const region of R.REGIONS) {
      const modeSel = document.getElementById(`remodern-${region}-mode`);
      const workSel = document.getElementById(`remodern-${region}-work`);
      if (!modeSel || !workSel) continue;
      fillModes(modeSel, region);
      modeSel.value = state[region].mode;
      fillWorks(workSel, region);
      workSel.value = state[region].work || "";
      workSel.disabled = state[region].mode !== "own";   /* 作品を選べるのは「独立」のときだけ */
      workSel.title = view[region].fallback ? tr("remodernFallback") : "";
    }
  }

  function commit(region, mode, work) {
    const before = core.settings.remodern || R.defaultState();
    try {
      core.settings.remodern = R.setRegion(before, region, mode, work);
    } catch (_) {
      say("remodernBad");
      render();
      return;
    }
    const ok = core.saveUserPrefs();
    say(ok === false ? "remodernSaveFail" : "remodernSaved");
    render();
  }

  for (const region of R.REGIONS) {
    const modeSel = document.getElementById(`remodern-${region}-mode`);
    const workSel = document.getElementById(`remodern-${region}-work`);
    if (modeSel) modeSel.addEventListener("change", () => {
      const mode = modeSel.value;
      const cur = (core.settings.remodern || R.defaultState())[region];
      const keepWork = mode === "own" ? cur.work : null;
      commit(region, mode, keepWork);
    });
    if (workSel) workSel.addEventListener("change", () => {
      const cur = (core.settings.remodern || R.defaultState())[region];
      commit(region, cur.mode, workSel.value || null);
    });
  }
  const reset = document.getElementById("remodernResetBtn");
  if (reset) reset.addEventListener("click", () => {
    core.settings.remodern = R.defaultState();
    core.saveUserPrefs();
    say("remodernResetDone");
    render();
  });

  render();
  if (Object.keys(works()).length === 0) say("remodernEmpty");
  window.TrkRemodernUi = { render };
})();

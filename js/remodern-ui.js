// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 🎨 trk297：trk-re-modern のスキンの画面（設定・書斎・基地） ============

   ・設定「🎨 スキン」の領域ごとの 3 行（共通・書斎・基地）
   ・設定「書斎・基地にスキンのボタンを出す」（既定オフ＝今の画面のまま。利用者が選ぶ）
   ・書斎・基地のヘッダーの「🎨 スキン」（data-remodern-open）→ その領域だけのダイアログ
   作品の一覧はまだ空（window.TrkReModernWorks。次の段階で読み込む）。
   保存は設定（remodern）へ。道具は js/remodern-regions.js。通信・直接の保存はしない。 */
(() => {
  "use strict";
  const core = window.Trk && window.Trk.core;
  const R = window.TrkReModernRegions;
  const box = document.getElementById("remodernRegions");
  if (!core || !R || !box) return;

  const works = () => window.TrkReModernWorks || {};
  const MODE_LABEL = { keep: "remodernKeep", follow: "remodernFollow", own: "remodernOwn" };
  const REGION_LABEL = { common: "remodernCommon", study: "remodernStudy", base: "remodernBase" };
  const status = document.getElementById("remodernStatus");
  const dlg = document.getElementById("remodernDialog");
  const dlgTitle = document.getElementById("remodernDlgTitle");
  const dlgMode = document.getElementById("remodernDlgMode");
  const dlgWork = document.getElementById("remodernDlgWork");
  const dlgStatus = document.getElementById("remodernDlgStatus");
  const dlgClose = document.getElementById("remodernDlgClose");
  const iconsChk = document.getElementById("remodernIconsChk");
  const studyBtn = document.getElementById("studyRemodernBtn");

  const current = () => core.settings.remodern || R.defaultState();
  const say = (node, key) => { if (node) node.textContent = key ? tr(key) : ""; };

  function fillModes(select, region, value) {
    select.textContent = "";
    for (const mode of (region === "common" ? R.COMMON_MODES : R.MODES)) {
      const opt = document.createElement("option");
      opt.value = mode; opt.textContent = tr(MODE_LABEL[mode]);
      select.append(opt);
    }
    select.value = value;
  }
  function fillWorks(select, region, value) {
    select.textContent = "";
    const none = document.createElement("option");
    none.value = ""; none.textContent = tr("remodernNoWork");
    select.append(none);
    for (const id of Object.keys(works())) {
      const w = works()[id];
      if (!w || !Array.isArray(w.regions) || !w.regions.includes(region)) continue;
      const opt = document.createElement("option");
      opt.value = id; opt.textContent = (w.name && String(w.name).slice(0, 60)) || id;
      select.append(opt);
    }
    select.value = value || "";
  }

  /* 1 つの領域を変える（他の領域・読書・再生・共通ノーツには触れない） */
  function commit(region, mode, work) {
    try {
      const before = current();
      core.settings.remodern = R.setRegion(before, region, mode, work);
    } catch (_) {
      return { ok: false, key: "remodernBad" };
    }
    const saved = core.saveUserPrefs();
    return saved === false ? { ok: false, key: "remodernSaveFail" } : { ok: true, key: "remodernSaved" };
  }

  function render() {
    const state = current();
    const view = R.resolve(state, works());
    for (const region of R.REGIONS) {
      const modeSel = document.getElementById(`remodern-${region}-mode`);
      const workSel = document.getElementById(`remodern-${region}-work`);
      if (!modeSel || !workSel) continue;
      fillModes(modeSel, region, state[region].mode);
      fillWorks(workSel, region, state[region].work);
      workSel.disabled = state[region].mode !== "own";   /* 作品を選べるのは「独立」のときだけ */
      workSel.title = view[region].fallback ? tr("remodernFallback") : "";
    }
    if (iconsChk) iconsChk.checked = core.settings.remodernIcons === true;
    if (studyBtn) studyBtn.hidden = core.settings.remodernIcons !== true;
  }

  /* 3 行 */
  for (const region of R.REGIONS) {
    const modeSel = document.getElementById(`remodern-${region}-mode`);
    const workSel = document.getElementById(`remodern-${region}-work`);
    if (modeSel) modeSel.addEventListener("change", () => {
      const cur = current()[region];
      const r = commit(region, modeSel.value, modeSel.value === "own" ? cur.work : null);
      say(status, r.key); render();
    });
    if (workSel) workSel.addEventListener("change", () => {
      const r = commit(region, current()[region].mode, workSel.value || null);
      say(status, r.key); render();
    });
  }
  const reset = document.getElementById("remodernResetBtn");
  if (reset) reset.addEventListener("click", () => {
    core.settings.remodern = R.defaultState();
    core.saveUserPrefs();
    say(status, "remodernResetDone"); render();
  });

  /* 設定：ボタンを出すか */
  if (iconsChk) iconsChk.addEventListener("change", () => {
    core.settings.remodernIcons = !!iconsChk.checked;
    core.saveUserPrefs();
    render();
  });

  /* 書斎・基地のボタン → その領域だけのダイアログ */
  let dlgRegion = null;
  function openFor(region) {
    if (!R.REGIONS.includes(region) || !dlg || typeof dlg.showModal !== "function") return;
    dlgRegion = region;
    dlgTitle.textContent = `${tr("remodernDlgTitle")}：${tr(REGION_LABEL[region])}`;
    const cur = current()[region];
    fillModes(dlgMode, region, cur.mode);
    fillWorks(dlgWork, region, cur.work);
    dlgWork.disabled = cur.mode !== "own";
    say(dlgStatus, "");
    dlg.showModal();
    dlgMode.focus();
  }
  document.addEventListener("click", event => {
    const btn = event.target && event.target.closest ? event.target.closest("[data-remodern-open]") : null;
    if (btn) openFor(btn.dataset.remodernOpen);
  });
  dlgMode.addEventListener("change", () => {
    if (!dlgRegion) return;
    const cur = current()[dlgRegion];
    const r = commit(dlgRegion, dlgMode.value, dlgMode.value === "own" ? cur.work : null);
    say(dlgStatus, r.key);
    dlgWork.disabled = dlgMode.value !== "own";
    fillWorks(dlgWork, dlgRegion, current()[dlgRegion].work);
    render();
  });
  dlgWork.addEventListener("change", () => {
    if (!dlgRegion) return;
    const r = commit(dlgRegion, current()[dlgRegion].mode, dlgWork.value || null);
    say(dlgStatus, r.key); render();
  });
  if (dlgClose) dlgClose.addEventListener("click", () => dlg.close());

  render();
  if (Object.keys(works()).length === 0) say(status, "remodernEmpty");
  window.TrkRemodernUi = { render, openFor };
})();

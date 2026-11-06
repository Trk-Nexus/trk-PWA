// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 🎨 trk297：trk-re-modern のスキンの画面（設定・書斎・基地） ============

   ・設定「🎨 スキン」の領域ごとの 3 行（共通・書斎・基地）
   ・設定「書斎・基地にスキンのボタンを出す」（既定オフ＝今の画面のまま。利用者が選ぶ）
   ・書斎・基地のヘッダーの「🎨 スキン」（data-remodern-open）→ その領域だけのダイアログ
   作品の一覧はまだ空（window.TrkReModernWorks。次の段階で読み込む）。
   🎨 trk305：共通の領域が独立で作品があるときだけ、共通の題字の色を当てる（js/remodern-paint.js）。
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

  /* 🎨 trk301：ダイアログは設定画面（display:none になりうる）の外（body の直下）に置く。
     中に置くと、見えない modal になり画面全体が押せなくなる（レビュー 1） */
  if (dlg && dlg.parentElement !== document.body) document.body.append(dlg);

  /* 🎨 trk305（M3）：共通の領域が「独立」で作品があるときだけ、共通の題字（.brand h1）の色を当てる。
     書斎・基地はまだ当てない。作品が無い・外れたら既定の色へ戻す（js/remodern-paint.js） */
  const PAINT = window.TrkReModernPaint;
  function paintTitle(view) {
    const h1 = document.querySelector(".brand h1");
    if (!PAINT || !h1) return;
    const pick = view.common && view.common.source === "own" && view.common.work ? works()[view.common.work] : null;
    if (!pick) { PAINT.clearTitle(h1); return; }
    const paint = PAINT.titlePaint(pick, PAINT.effectiveBg(h1));
    PAINT.applyTitle(h1, paint);
    if (paint.skipped.length) console.warn("[trk-re-modern] 題字：背景との対比が足りない色は使いません:", paint.skipped.join(","));
  }

  function render() {
    const state = current();
    const view = R.resolve(state, works());
    paintTitle(view);
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
    /* 基地のボタンは、基地の画面を作るときに一度だけ作られる。出し入れはここで行う（レビュー R2） */
    document.querySelectorAll(".remodernOpenMedia").forEach(b => { b.hidden = core.settings.remodernIcons !== true; });
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

  /* 🎨 trk300：作品ファイル（.stpack の拡張）を読む。ZIP の中身は pack.json と文書だけ。保存は設定の小さな一覧 */
  const WORK = window.TrkReModernWork;
  const workBtn = document.getElementById("remodernWorkBtn");
  const workClear = document.getElementById("remodernWorkClear");
  const workFile = document.getElementById("remodernWorkFile");
  const workStatus = document.getElementById("remodernWorkStatus");
  let workMap = WORK ? WORK.loadWorks(core.settings.remodernWorks) : {};
  window.TrkReModernWorks = workMap;

  function saveWorks(map) {
    core.settings.remodernWorks = Object.values(map);
    return core.saveUserPrefs() !== false;
  }
  /* ファイル全体（.stpack の中身）のハッシュ。配布物そのものを指す（レビュー R3） */
  async function sha256Hex(buf) {
    try {
      const digest = await crypto.subtle.digest("SHA-256", buf);
      return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
    } catch (_) { return ""; }
  }
  /* 1 つの作品ファイルを読む。失敗の理由は画面に出さず、文言は固定（形の詳細は出さない） */
  async function importWorkFile(file) {
    const zipIO = window.Trk && window.Trk.zipIO;
    const bad = { ok: false, key: "remodernWorkBad" };
    if (!WORK || !zipIO) return bad;
    if (!file || file.size > WORK.MAX_ZIP_BYTES) return { ok: false, key: "remodernWorkTooBig" };
    let zip;
    try { zip = await zipIO.zipOpen(file); } catch (_) { return bad; }
    const names = WORK.checkEntryNames(zip.entries.map(e => e.name));
    if (!names.ok) { console.warn("[trk-re-modern] 作品を読めませんでした:", names.reason); return bad; }
    const entry = zip.entries.find(e => e.name === "pack.json");
    if (!entry || entry.usize > WORK.MAX_JSON_BYTES) return bad;
    let text;
    try { text = await (await zipIO.zipEntryBlob(zip, entry, WORK.MAX_JSON_BYTES, true)).text(); } catch (_) { return bad; }
    let raw;
    try { raw = JSON.parse(text); } catch (_) { return bad; }
    const checked = WORK.checkManifest(raw);
    if (!checked.ok) { console.warn("[trk-re-modern] 作品を読めませんでした:", checked.reason); return bad; }
    const list = WORK.addWork(Object.values(workMap), checked.work);
    if (!list) return { ok: false, key: "remodernWorkFull" };
    const next = {};
    for (const w of list) next[w.id] = w;
    workMap = next; window.TrkReModernWorks = workMap;
    if (!saveWorks(workMap)) return { ok: false, key: "remodernSaveFail" };
    const hash = await sha256Hex(await file.arrayBuffer());
    return { ok: true, key: "remodernWorkOk", vars: { name: checked.work.name, hash: hash ? hash.slice(0, 12) : "—" } };
  }
  if (workBtn && workFile) workBtn.addEventListener("click", () => workFile.click());
  if (workFile) workFile.addEventListener("change", async () => {
    const file = workFile.files && workFile.files[0];
    workFile.value = "";
    if (!file) return;
    const r = await importWorkFile(file);
    workStatus.textContent = tr(r.key, r.vars);
    render();
  });
  if (workClear) workClear.addEventListener("click", () => {
    workMap = {}; window.TrkReModernWorks = workMap;
    saveWorks(workMap);
    say(workStatus, "remodernWorkClearDone"); render();
  });

  render();
  if (Object.keys(works()).length === 0) say(status, "remodernEmpty");
  window.TrkRemodernUi = { render, openFor };
})();

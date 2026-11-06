// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 🎨 trk297：trk-re-modern のスキンの画面（設定・書斎・基地） ============

   ・設定「🎨 スキン」の領域ごとの 3 行（共通・書斎・基地）
   ・設定「書斎・基地にスキンのボタンを出す」（既定オフ＝今の画面のまま。利用者が選ぶ）
   ・書斎・基地のヘッダーの「🎨 スキン」（data-remodern-open）→ その領域だけのダイアログ
   作品の一覧はまだ空（window.TrkReModernWorks。次の段階で読み込む）。
   🎨 trk305：共通の領域が独立で作品があるときだけ、共通の題字の色を当てる（js/remodern-paint.js）。
   🎨 trk306：スキンを変えたら題字の色を判定し直す（core.on("skin")）。
   🎨 trk307：登録簿（data/re-modern-registry.json）に無い作品は「未確認」と表示し、題字には当てない。
   保存は設定（remodern）へ。道具は js/remodern-regions.js。通信・直接の保存はしない。 */
(() => {
  "use strict";
  const core = window.Trk && window.Trk.core;
  const R = window.TrkReModernRegions;
  const box = document.getElementById("remodernRegions");
  if (!core || !R || !box) return;

  const works = () => window.TrkReModernWorks || {};
  /* 🎨 trk307（R3 ②③）：登録簿の写し。読めるまでは全部「未確認」（安全側） */
  const REG = window.TrkReModernRegistry;
  let registry = { ok: false, ids: [], reason: "loading" };
  const statusOfWork = id => (REG ? REG.statusOf(id, registry) : "unverified");
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
      const label = (w.name && String(w.name).slice(0, 60)) || id;
      opt.value = id; opt.textContent = statusOfWork(id) === "registered" ? label : `${label}（${tr("remodernUnverified")}）`;
      select.append(opt);
    }
    select.value = value || "";
  }

  /* 1 つの領域を変える（他の領域・読書・再生・共通ノーツには触れない）。🎨 trk308：直前の状態を覚えておく（「戻す」のため） */
  function commit(region, mode, work) {
    try {
      const a = R.apply(current(), region, mode, work);
      core.settings.remodern = a.state;
      core.settings.remodernLast = a.snapshot;
    } catch (_) {
      return { ok: false, key: "remodernBad" };
    }
    const saved = core.saveUserPrefs();
    return saved === false ? { ok: false, key: "remodernSaveFail" } : { ok: true, key: "remodernApplied" };
  }

  /* 🎨 trk308：影響範囲と「適用／戻す」。選んだだけでは変わらない（適用で初めて変える） */
  function pendingOf(modeSel, workSel) {
    const mode = modeSel ? modeSel.value : "keep";
    return { mode, work: mode === "own" && workSel && workSel.value ? workSel.value : null };
  }
  function canUndo(region) { const last = core.settings.remodernLast; return !!(last && last.region === region); }
  function impactText(region, p) {
    if (p.mode === "keep") return tr("remodernImpactKeep");
    if (!p.work) return tr("remodernImpactPick");
    if (statusOfWork(p.work) !== "registered") return tr("remodernImpactUnverified");
    return tr(region === "common" ? "remodernImpactCommon" : "remodernImpactLater");
  }
  function sameAsApplied(region, p) {
    const a = current()[region];
    return p.mode === a.mode && (p.work || null) === (a.work || null);
  }
  /* 直前の適用を戻す。後で変えられていれば上書きせず「競合」 */
  function undo(region, node) {
    const last = core.settings.remodernLast;
    if (!last || last.region !== region) { say(node, "remodernNothingUndo"); return; }
    const r = R.revert(current(), last);
    if (r.conflict) { say(node, "remodernConflict"); return; }
    core.settings.remodern = r.state;
    core.settings.remodernLast = null;
    const saved = core.saveUserPrefs();
    say(node, saved === false ? "remodernSaveFail" : "remodernUndone");
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
    /* 登録簿に無い作品（未確認）は、画面に当てない */
    if (!pick || statusOfWork(pick.id) !== "registered") { PAINT.clearTitle(h1); return; }
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
      refreshRow(region, modeSel, workSel, impactEl(region), applyBtn(region), undoBtn(region));
    }
    if (iconsChk) iconsChk.checked = core.settings.remodernIcons === true;
    if (studyBtn) studyBtn.hidden = core.settings.remodernIcons !== true;
    /* 基地のボタンは、基地の画面を作るときに一度だけ作られる。出し入れはここで行う（レビュー R2） */
    document.querySelectorAll(".remodernOpenMedia").forEach(b => { b.hidden = core.settings.remodernIcons !== true; });
  }

  /* 3 行。🎨 trk308：変更は「適用」で行う。「戻す」は直前の適用を取り消す */
  const impactEl = region => document.getElementById(`remodern-${region}-impact`);
  const applyBtn = region => document.getElementById(`remodern-${region}-apply`);
  const undoBtn = region => document.getElementById(`remodern-${region}-undo`);
  function refreshRow(region, modeSel, workSel, impact, apply, undo_) {
    if (!modeSel) return;
    const p = pendingOf(modeSel, workSel);
    if (workSel) workSel.disabled = modeSel.value !== "own";
    if (impact) impact.textContent = sameAsApplied(region, p) ? tr("remodernImpactSame") : impactText(region, p);
    if (apply) apply.disabled = sameAsApplied(region, p);
    if (undo_) undo_.disabled = !canUndo(region);
  }
  for (const region of R.REGIONS) {
    const modeSel = document.getElementById(`remodern-${region}-mode`);
    const workSel = document.getElementById(`remodern-${region}-work`);
    const onPick = () => refreshRow(region, modeSel, workSel, impactEl(region), applyBtn(region), undoBtn(region));
    if (modeSel) modeSel.addEventListener("change", onPick);
    if (workSel) workSel.addEventListener("change", onPick);
    if (applyBtn(region)) applyBtn(region).addEventListener("click", () => {
      const p = pendingOf(modeSel, workSel);
      const r = commit(region, p.mode, p.work);
      say(status, r.key); render();
    });
    if (undoBtn(region)) undoBtn(region).addEventListener("click", () => { undo(region, status); render(); });
  }
  const reset = document.getElementById("remodernResetBtn");
  if (reset) reset.addEventListener("click", () => {
    core.settings.remodern = R.defaultState();
    core.settings.remodernLast = null;
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
    say(dlgStatus, "");
    refreshDlg();
    dlg.showModal();
    dlgMode.focus();
  }
  document.addEventListener("click", event => {
    const btn = event.target && event.target.closest ? event.target.closest("[data-remodern-open]") : null;
    if (btn) openFor(btn.dataset.remodernOpen);
  });
  /* 🎨 trk308：ダイアログも「適用」で変える（影響範囲を先に見せる） */
  const dlgImpact = document.getElementById("remodernDlgImpact");
  const dlgApply = document.getElementById("remodernDlgApply");
  const dlgUndo = document.getElementById("remodernDlgUndo");
  function refreshDlg() {
    if (!dlgRegion) return;
    const p = pendingOf(dlgMode, dlgWork);
    dlgWork.disabled = dlgMode.value !== "own";
    if (dlgImpact) dlgImpact.textContent = sameAsApplied(dlgRegion, p) ? tr("remodernImpactSame") : impactText(dlgRegion, p);
    if (dlgApply) dlgApply.disabled = sameAsApplied(dlgRegion, p);
    if (dlgUndo) dlgUndo.disabled = !canUndo(dlgRegion);
  }
  function refillDlg() {
    fillModes(dlgMode, dlgRegion, current()[dlgRegion].mode);
    fillWorks(dlgWork, dlgRegion, current()[dlgRegion].work);
    refreshDlg();
  }
  dlgMode.addEventListener("change", refreshDlg);
  dlgWork.addEventListener("change", refreshDlg);
  if (dlgApply) dlgApply.addEventListener("click", () => {
    if (!dlgRegion) return;
    const p = pendingOf(dlgMode, dlgWork);
    const r = commit(dlgRegion, p.mode, p.work);
    say(dlgStatus, r.key); refillDlg(); render();
  });
  if (dlgUndo) dlgUndo.addEventListener("click", () => {
    if (!dlgRegion) return;
    undo(dlgRegion, dlgStatus); refillDlg(); render();
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
    return { ok: true, key: "remodernWorkOk", unverified: statusOfWork(checked.work.id) !== "registered", vars: { name: checked.work.name, hash: hash ? hash.slice(0, 12) : "—" } };
  }
  if (workBtn && workFile) workBtn.addEventListener("click", () => workFile.click());
  if (workFile) workFile.addEventListener("change", async () => {
    const file = workFile.files && workFile.files[0];
    workFile.value = "";
    if (!file) return;
    const r = await importWorkFile(file);
    workStatus.textContent = tr(r.key, r.vars) + (r.unverified ? " " + tr("remodernUnverifiedNote") : "");
    render();
  });
  if (workClear) workClear.addEventListener("click", () => {
    workMap = {}; window.TrkReModernWorks = workMap;
    saveWorks(workMap);
    say(workStatus, "remodernWorkClearDone"); render();
  });

  /* 🎨 trk306：通常のスキンを変えたら、題字の色を判定し直す（背景が変わるので、対比が変わる）。
     以前は作品を選んだあとにスキンを変えると、色が残って読みにくくなっていた（Avatar 側の試験で再現） */
  function repaintTitle() { paintTitle(R.resolve(current(), works())); }
  if (typeof core.on === "function") core.on("skin", repaintTitle);

  render();
  if (REG) REG.load().then(r => { registry = r; render(); });
  if (Object.keys(works()).length === 0) say(status, "remodernEmpty");
  window.TrkRemodernUi = { render, openFor };
})();

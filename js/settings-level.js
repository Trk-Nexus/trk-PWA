// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ ⚖ 設定の「段」（trk279） ============

   ⚙ の設定は 213 の値・19 枚のパネル・194 の操作子まで増えました。
   ぜんぶを一度に見せると「読む量」で疲れるので、**見せる量**を 4 段から選べるようにします。

     1 simple   シンプル   … ふだん触るものだけ
     2 standard スタンダード（既定）… いつもの人向け
     3 pro      プロ       … 作り込む人向け
     4 master   マスター   … 触る人を選ぶもの（CLI・アドオン・緊急復旧・開発用）

   決めたこと（変えない）：

   ・**段は「値」ではありません。** 保存するのは `settings.setLevel` の 1 つだけで、
     213 の値は段を変えても動きません（見え方が変わるだけ）。
   ・**触った行は、どの段でも出します。** 一度でも動かした設定が隠れると
     「設定したのに消えた」に見えるためです（`settings.setTouched` に名前を残す）。
   ・**探しているあいだは、段を無視して全部出します**（見つからない、を作らない）。
   ・**パネルは、中の行が全部隠れるときだけ**隠します（🎨 見た目はスキンの行が残るので、
     シンプルでもパネルごとは消えません）。
   ・新しい保存の入れ物（localStorage のキー）は増やしません。 */
(() => {
  "use strict";
  const core = window.Trk && window.Trk.core;
  const pane = document.getElementById("settingsScreen");
  if (!core || !pane) return;

  /* ---------- 段の名前と順番（core.js の SET_LEVELS と同じ並び） ---------- */
  const LEVELS = ["simple", "standard", "pro", "master"];
  const RANK = Object.freeze({ simple: 1, standard: 2, pro: 3, master: 4 });

  /* ---------- パネルごとの既定の段（id か summary の data-i18n で引く） ---------- */
  const PANEL_TIER = {
    uiPanel: 1, secSound: 1, secControls: 1, updatePanel: 1, storagePanel: 1,
    secDisplay: 2, secOptions: 2, mediaKeepPanel: 2, backupPanel: 2, libSharePanel: 2, favPanel: 2,
    packPanel: 3, trkPanel: 3, ghostPanel: 3,
    cliPanel: 4, vrmPanel: 4, iosPanel: 4, addonPanel: 4, emergencyPanel: 4,
  };

  /* ---------- パネルの中の「まとまり」ごとの段（見出し・まとまりの id・中の操作子の id） ---------- */
  const BLOCK_TIER = {
    displayMode: 3, devView: 4,                    /* 🎨 表示の種類・開発用 */
    skin: 1, skinNow: 1, skinShelf: 1, skinMaker: 4, /* 🎨 スキン（いちばんよく触る） */
    typoPairing: 1,                                 /* 🔤 書体の組み合わせ */
    litePanel: 3, mmdPanel: 3,                      /* 🪶 軽量化・🩷 MMD */
    gameLayout: 2, swayTitle: 3, modeViewPanel: 3, tvMaker: 3,
    libSkinHead: 2, mascotSel: 2, noteStylePanel: 2,
    secExpert: 3, secMystery: 3,                    /* 🧪 こまかい所・訳あり */
    chartGen: 3,
    storageTransferTitle: 2,
    navigationKeysPanel: 2, modeControlsPanel: 2, padPanel: 2,
    midiSoundPanel: 2, formatHelpPanel: 3,
  };

  /* ---------- 操作子ごとの段（まとまりの既定を上書きしたいものだけ） ---------- */
  const ID_TIER = {
    helpText: 1,                 /* 説明文を隠す：いちばん上に置く価値がある */
    latency: 1,                  /* 音のずれ：遊ぶ人なら必ず合わせる */
    chartGen: 3, packWipeAll: 3,
    ignoreLimitsChk: 2,
  };

  /* ---------- 純粋な道具（テストから同じものを動かす） ---------- */
  function levelRank(level) { return RANK[level] || RANK.standard; }
  function levelName(rank) { return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, rank - 1))]; }
  /* その行を、その段で隠すか。触った行（changed）は決して隠さない。純粋関数。 */
  function tierHidden(tier, rank, changed) {
    const t = Number(tier);
    return !!t && !changed && t > rank;
  }
  /* 隠す行の数と、隠れるパネル（行が全部隠れるパネル）を数える。純粋関数。 */
  function levelPlan(rows, rank) {
    const hidden = [];
    const byPanel = new Map();
    for (const row of rows) {
      const hide = tierHidden(row.tier, rank, row.changed);
      if (hide) hidden.push(row.key);
      const entry = byPanel.get(row.panel) || { total: 0, hidden: 0 };
      entry.total++;
      if (hide) entry.hidden++;
      byPanel.set(row.panel, entry);
    }
    const panels = [...byPanel.entries()].filter(([, v]) => v.total > 0 && v.hidden === v.total).map(([k]) => k);
    return { hidden, count: hidden.length, panels };
  }
  /* 次の段（いちばん上なら null）。純粋関数。 */
  function nextLevel(level) {
    const r = levelRank(level);
    return r < LEVELS.length ? levelName(r + 1) : null;
  }

  /* ---------- 画面を調べる ---------- */
  const panels = () => [...pane.querySelectorAll("details.panel")];

  function panelKey(panel) {
    if (panel.id) return panel.id;
    const summary = [...panel.children].find(el => el.tagName === "SUMMARY");
    const key = summary && (summary.dataset.i18n || (summary.querySelector("[data-i18n]") || {}).dataset?.i18n);
    return key || "";
  }
  function controlOf(row) { return row.querySelector("input[id],select[id],textarea[id]"); }
  function blockKeyOf(row) {
    if (row.id && BLOCK_TIER[row.id]) return row.id;
    if (row.tagName === "H3" && row.dataset.i18n && BLOCK_TIER[row.dataset.i18n]) return row.dataset.i18n;
    const c = controlOf(row);
    if (c && BLOCK_TIER[c.id]) return c.id;
    if (!c) {
      const h = row.querySelector("h3[data-i18n]");
      if (h && BLOCK_TIER[h.dataset.i18n]) return h.dataset.i18n;
    }
    return "";
  }

  /* 行に段を付ける（1 回だけ・DOM は動かさない） */
  let built = false;
  const rows = [];           /* { el, panel, tier, key }：数えるため */
  function build() {
    if (built) return;
    const touched = new Set(Array.isArray(core.settings.setTouched) ? core.settings.setTouched : []);
    for (const panel of panels()) {
      const base = PANEL_TIER[panelKey(panel)] || 2;
      let tier = base, prev = base;
      for (const row of [...panel.children]) {
        if (row.tagName === "SUMMARY") continue;
        const block = blockKeyOf(row);
        if (block) tier = BLOCK_TIER[block] || tier;
        const control = controlOf(row);
        const own = control && ID_TIER[control.id];
        const rowTier = own ? own : (control ? tier : (row.classList.contains("hint") ? prev : tier));
        row.dataset.tier = String(rowTier);
        const key = control ? control.id : "";
        const changed = !!(key && touched.has(key));
        if (changed) row.dataset.changed = "1"; else delete row.dataset.changed;
        rows.push({ el: row, panel: panelKey(panel), tier: rowTier, key: key || `${panelKey(panel)}#${rows.length}`, changed });
        prev = rowTier;
      }
    }
    built = true;
  }

  /* ---------- 段を当てる ---------- */
  const statusEl = document.getElementById("setLevelStatus");
  const moreBtn = document.getElementById("setLevelMore");
  const buttons = [...pane.querySelectorAll("[data-set-level-btn]")];
  let wholeView = false;      /* 🔍 で探しているあいだ（段を無視して全部出す） */

  function paint() {
    const level = wholeView ? "master" : (core.settings.setLevel || "standard");
    const rank = levelRank(level);
    pane.dataset.setLevel = wholeView ? "master" : level;
    for (const b of buttons) b.setAttribute("aria-pressed", b.dataset.setLevelBtn === level ? "true" : "false");

    /* 行が全部隠れるパネルは、見出しごと隠す（1 行でも残るパネルは出したまま） */
    const plan = levelPlan(rows, rank);
    const gone = new Set(plan.panels);
    for (const panel of panels()) {
      if (wholeView) delete panel.dataset.levelHidden;
      else if (gone.has(panelKey(panel))) panel.dataset.levelHidden = "1";
      else delete panel.dataset.levelHidden;
    }

    /* 「この段では n 項目を隠しています」＋ 次の段への道 */
    if (statusEl) {
      statusEl.textContent = !wholeView && plan.count
        ? tr("setLevelHidden", { n: plan.count }) + (plan.panels.length ? tr("setLevelPanelNote", { n: plan.panels.length }) : "")
        : "";
    }
    const next = wholeView ? null : nextLevel(level);
    if (moreBtn) {
      if (next && plan.count) {
        moreBtn.hidden = false;
        moreBtn.dataset.next = next;
        moreBtn.textContent = tr("setLevelMore", { name: tr("setLevel" + next.charAt(0).toUpperCase() + next.slice(1)) });
      } else {
        moreBtn.hidden = true;
        delete moreBtn.dataset.next;
      }
    }
  }

  /* 段を決める（押したとき・起動したとき） */
  function setLevel(level, opts) {
    const next = RANK[level] ? level : "standard";
    const changed = core.settings.setLevel !== next;
    core.settings.setLevel = next;
    if (changed) { try { core.saveUserPrefs(); } catch (_) {} }
    wholeView = false;
    paint();
    if (opts && opts.announce && statusEl) {
      const n = levelPlan(rows, levelRank(next)).count;
      statusEl.textContent = tr("setLevelDone", { name: tr("setLevel" + next.charAt(0).toUpperCase() + next.slice(1)), n });
    }
  }

  /* ---------- 触った行は、どの段でも出す ---------- */
  function markTouched(row) {
    const control = controlOf(row);
    if (!control || !control.id) return;
    if (row.dataset.changed !== "1") {
      row.dataset.changed = "1";
      const entry = rows.find(r => r.el === row);
      if (entry) entry.changed = true;
    }
    const list = Array.isArray(core.settings.setTouched) ? core.settings.setTouched : [];
    if (!list.includes(control.id) && list.length < 160) {
      list.push(control.id);
      core.settings.setTouched = list;
    }
  }
  function onEdit(event) {
    const target = event.target;
    if (!target || !target.id) return;
    const row = target.closest("[data-tier]");
    if (!row || !pane.contains(row)) return;
    const had = row.dataset.changed === "1";
    markTouched(row);
    if (!had) paint();                       /* 隠れていた行が出たら数を直す */
  }

  /* ---------- 🔍 で探しているあいだは、段を無視する ---------- */
  const searchBoxes = [document.getElementById("setFindInput"), document.getElementById("settingsSearch")].filter(Boolean);
  function syncSearch() {
    const active = searchBoxes.some(box => String(box.value || "").trim());
    if (active === wholeView) return;
    wholeView = active;
    paint();
  }

  /* ---------- 配線 ---------- */
  for (const b of buttons) {
    b.addEventListener("click", () => setLevel(b.dataset.setLevelBtn, { announce: true }));
  }
  if (moreBtn) {
    moreBtn.addEventListener("click", () => { if (moreBtn.dataset.next) setLevel(moreBtn.dataset.next, { announce: true }); });
  }
  pane.addEventListener("change", onEdit);
  pane.addEventListener("input", onEdit);
  for (const box of searchBoxes) {
    box.addEventListener("input", syncSearch);
    box.addEventListener("search", syncSearch);
  }
  /* 設定を開くたび・言葉を変えたら、数え直す（文言と隠す量が変わる） */
  try { core.on("settings", () => { build(); syncSearch(); paint(); }); } catch (_) {}
  try { core.on("language", () => paint()); } catch (_) {}

  build();
  paint();

  window.Trk = window.Trk || {};
  window.Trk.setLevel = Object.freeze({
    levels: LEVELS.slice(),
    panels: PANEL_TIER,
    blocks: BLOCK_TIER,
    rank: levelRank,
    name: levelName,
    next: nextLevel,
    hidden: tierHidden,
    plan: levelPlan,
    build,
    apply: setLevel,
    refresh: paint,
    /* テスト用：いまの行の段（DOM を見ないで数えたいとき） */
    rows: () => rows.map(r => ({ panel: r.panel, key: r.key, tier: r.tier, changed: r.changed })),
  });
})();

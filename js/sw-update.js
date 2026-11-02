// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 🔄 新しい版の知らせ（trk242） ============

   これまでは `sw.js` を登録するだけで（＝オフラインのために殻をキャッシュする）、
   **新しい版が入ったことを画面で知らせる仕組みがありませんでした**。開き直すまで
   古い画面のまま気づけない、という状態でした（`tools/check-repo.mjs` と `grep` で確認）。

   このファイルが受け持つこと：

   1. **Service Worker の登録** … これまで `js/main.js` の末尾で行っていたものを、ここへ移す
      （登録と「新しい版の見張り」を同じ場所に置くため）。オプションは変えない
      （`scope:"./"`・`updateViaCache:"none"`・`file:` では登録しない）。
   2. **知らせ** … 新しい版が入ったら、画面の下に**小さな帯**を出す。
      窓で覆わない（遊びを止めない）。「いま更新する」＝開き直す／「あとで」＝この画面ではもう出さない。
   3. **見張り** … 起動時・画面に戻ってきたとき・（30分に1回まで）`registration.update()` を確かめる。
      通信できないときは黙って諦める（オフライン優先は変えない）。
   4. **設定の「🔄 アプリの更新」** … どの端末でも「新しい版を確かめる」を押せる。
      （iOS のパネルにある「アプリを更新する」は iOS 向けの言い回しのまま残す）

   決めたこと（変えない）：

   ・**初回のインストールでは出さない**（まだ Service Worker が動いていない＝入れ替わる前の版が無い）。
   ・**遊んでいる途中では帯を出さない**。タイトルへ戻ったときに出す（判定は `swDeferNotice`）。
   ・**保存は `core.settings` の中だけ**（trk255）。「あとで」は24時間覚え、設定の
     「🔔 新しい版の知らせを出す」をオフにすれば帯そのものを止められる。
     ブラウザの保存領域に新しいキーは増やさないので、移行の手当ては要らない。
   ・「いま更新する」は開き直すだけ。**遊んでいる途中に勝手に開き直さない。** */
(() => {
  "use strict";
  const core = window.Trk && window.Trk.core;
  if (!core) return;

  const CHECK_GAP_MS = 30 * 60 * 1000;      /* 自動で確かめる間隔（30分に1回まで） */
  const SNOOZE_MS = 24 * 60 * 60 * 1000;    /* 🔕 trk255：「あとで」を覚えておく長さ（24時間） */
  const tr = (key, vars) => (typeof window.tr === "function" ? window.tr(key, vars) : key);

  /* 🔄 trk255：知らせを出すかどうか（設定）と、「あとで」の残り時間。
     どちらも core.settings の中（ブラウザの保存領域に新しいキーは増やさない）。 */
  const noticeEnabled = () => !(core.settings && core.settings.swUpdateNotice === false);
  const snoozeActive = () => Number((core.settings && core.settings.swUpdateSnooze) || 0) > Date.now();
  function saveSettings() { try { if (typeof core.saveUserPrefs === "function") core.saveUserPrefs(); } catch (_) {} }
  function setSnooze(until) { if (!core.settings) return; core.settings.swUpdateSnooze = Number(until) || 0; saveSettings(); }

  /* ---------- 判定（純粋関数・テストから同じものを動かす） ----------
     state = {
       dismissed     … この画面で「あとで」を押した
       hasController … この画面を開いたとき、すでに Service Worker が動いていた（＝前の版がある）
       waiting       … 新しい版が待っている（registration.waiting）
       changed       … controllerchange が起きた（＝新しい版に入れ替わった）
     }
     返り値："none"（出さない）／"waiting"（待っている）／"swapped"（入れ替わった） */
  function swNoticeFor(state) {
    const s = state || {};
    if (s.dismissed) return "none";
    if (s.enabled === false) return "none";    /* trk255：設定で知らせを止めている */
    if (s.snoozed) return "none";              /* trk255：「あとで」を覚えているあいだ */
    if (!s.hasController) return "none";       /* 初回のインストールでは知らせない */
    if (s.waiting) return "waiting";
    if (s.changed) return "swapped";
    return "none";
  }

  /* 遊んでいる途中は、帯を後回しにするか。純粋関数。 */
  function swDeferNotice(phase) {
    return phase !== "title";
  }

  /* 自動で確かめてよいか（見えていないときは確かめない・30分に1回まで）。純粋関数。
     state = { now, last, hidden } */
  function swCheckDue(state) {
    const s = state || {};
    if (s.hidden) return false;
    const last = Number(s.last) || 0;
    if (last <= 0) return true;
    return Number(s.now) - last >= CHECK_GAP_MS;
  }

  /* 「新しい版を確かめる」の結果を、どの知らせにするか。純粋関数。
     state = { ok, waiting } → "failed" | "ready" | "latest" */
  function swCheckOutcome(state) {
    const s = state || {};
    if (!s.ok) return "failed";
    if (s.waiting) return "ready";
    return "latest";
  }

  /* ---------- 画面 ---------- */
  const bar = document.getElementById("swUpdateBar");
  const barText = document.getElementById("swUpdateBarText");
  const nowBtn = document.getElementById("swUpdateNow");
  const laterBtn = document.getElementById("swUpdateLater");
  const panel = document.getElementById("updatePanel");
  const checkBtn = document.getElementById("swUpdateCheckBtn");
  const statusEl = document.getElementById("swUpdateStatus");

  const hasSW = "serviceWorker" in navigator && location.protocol !== "file:";
  if (!hasSW) {
    /* Service Worker が無い環境（file: で開いた・古いブラウザ）では、パネルごと出さない。
       —— 知らせる仕組みが無いだけで、遊びには影響しません。 */
    if (panel) panel.hidden = true;
    return;
  }

  let registration = null;
  let hadController = !!navigator.serviceWorker.controller;
  let changed = false;
  let dismissed = false;
  let pendingNotice = false;      /* 遊んでいる途中で来た知らせ（タイトルで出す） */
  let lastCheck = 0;
  let checking = false;

  function setStatus(text) { if (statusEl) statusEl.textContent = text || ""; }

  function currentNotice() {
    /* ⚠ 後回し（pendingNotice）でも、設定オフ・「あとで」の24時間は通さない */
    const kind = swNoticeFor({
      dismissed, enabled: noticeEnabled(), snoozed: snoozeActive(),
      hasController: hadController, waiting: !!(registration && registration.waiting), changed
    });
    if (kind === "none") return "none";
    return pendingNotice ? "waiting" : kind;
  }

  function showBar() {
    if (!bar) return;
    if (barText) barText.textContent = tr("swUpdateBarText");
    if (nowBtn) nowBtn.textContent = tr("swUpdateNow");
    if (laterBtn) laterBtn.textContent = tr("swUpdateLater");
    bar.hidden = false;
  }
  function hideBar() { if (bar) bar.hidden = true; }

  /* 知らせを出す（遊んでいる途中なら後回し）。 */
  function announce() {
    const kind = currentNotice();
    if (kind === "none") return;
    if (swDeferNotice(core.phase)) { pendingNotice = true; hideBar(); return; }
    pendingNotice = false;
    showBar();
  }

  if (nowBtn) nowBtn.addEventListener("click", () => {
    /* 開き直すだけ。保存はブラウザ側で済んでいるので、記録は消えません。 */
    try { location.reload(); } catch (_) {}
  });
  if (laterBtn) laterBtn.addEventListener("click", () => {
    dismissed = true; pendingNotice = false; hideBar();
    setSnooze(Date.now() + SNOOZE_MS);          /* 🔕 trk255：24時間は出さない（設定に残る） */
    setStatus(tr("swUpdateLaterStatus"));
  });

  /* ---------- 見張り ---------- */
  async function checkNow({ status = false } = {}) {
    if (checking) return "latest";
    checking = true;
    if (status) setStatus(tr("swUpdateChecking"));
    try {
      const reg = registration || await navigator.serviceWorker.getRegistration();
      if (!reg) throw new Error("no-registration");
      registration = reg;
      await reg.update();
      lastCheck = Date.now();
      const outcome = swCheckOutcome({ ok:true, waiting: !!(reg.installing || reg.waiting) });
      if (status) {
        /* 「新しい版を確かめる」を押したときは、こちらが明示的に聞いているので
           「あとで」の24時間と帯のオフを解いて、その場で知らせる（trk255） */
        if (outcome === "ready") { setSnooze(0); dismissed = false; }
        setStatus(tr(outcome === "ready" ? "swUpdateReady" : "swUpdateLatest"));
        if (outcome === "ready") announce();
      }
      return outcome;
    } catch (_) {
      if (status) setStatus(tr("swUpdateFailed"));
      return "failed";
    } finally {
      checking = false;
    }
  }

  /* 🏷 trk255：いまの版。設定の「🔄 アプリの更新」だけに出し、帯には出さない。
     版は index.html の <meta name="trk-build"> と sw.js の CACHE で同じ番号にそろえる。 */
  const versionEl = document.getElementById("swUpdateVersion");
  const buildMeta = document.querySelector('meta[name="trk-build"]');
  const buildName = (buildMeta && buildMeta.getAttribute("content")) || "";
  function renderVersion() {
    if (!versionEl) return;
    versionEl.textContent = buildName ? tr("swUpdateVersion", { v: buildName }) : "";
  }
  renderVersion();
  try { core.on("language", renderVersion); } catch (_) {}

  /* 🔔 trk255：「新しい版の知らせを出す」のチェック（オフなら帯そのものを出さない） */
  const noticeChk = document.getElementById("swUpdateNoticeChk");
  function syncNoticeChk() { if (noticeChk) noticeChk.checked = noticeEnabled(); }
  syncNoticeChk();
  if (noticeChk) noticeChk.addEventListener("change", () => {
    if (core.settings) core.settings.swUpdateNotice = noticeChk.checked;
    saveSettings();
    if (!noticeChk.checked) { hideBar(); return; }
    dismissed = false; setSnooze(0);
    announce();
  });
  try { core.on("settings", syncNoticeChk); } catch (_) {}

  if (checkBtn) checkBtn.addEventListener("click", async () => {
    checkBtn.disabled = true;
    try { await checkNow({ status: true }); } finally { checkBtn.disabled = false; }
  });

  /* 画面に戻ってきたとき・30分に1回まで、静かに確かめる（通信できなければ何もしない） */
  function maybeCheck() {
    const due = swCheckDue({ now: Date.now(), last: lastCheck, hidden: document.visibilityState === "hidden" });
    if (!due) return;
    lastCheck = Date.now();          /* 失敗しても、次に確かめるまで間を空ける */
    checkNow();
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") maybeCheck();
  });
  setInterval(maybeCheck, CHECK_GAP_MS);

  /* 遊びが終わってタイトルへ戻ったら、後回しにしていた知らせを出す */
  try { core.on("phase", p => { if (!swDeferNotice(p)) announce(); }); } catch (_) {}
  try { core.on("language", () => { if (bar && !bar.hidden) showBar(); }); } catch (_) {}

  /* ---------- 登録（これまで js/main.js が行っていたもの） ---------- */
  navigator.serviceWorker.register("./sw.js", { scope: "./", updateViaCache: "none" })
    .then(reg => {
      registration = reg;
      /* すでに新しい版が待っている（前回の起動で入ったが、まだ開き直していない） */
      if (reg.waiting) announce();
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          /* installed になった＝新しい版の用意ができた。controller があるときだけ知らせる。 */
          if (installing.state === "installed" && navigator.serviceWorker.controller) announce();
        });
      });
    })
    .catch(() => { /* オフライン用のキャッシュが無くても、ゲームはそのまま遊べます */ });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    /* 新しい版に入れ替わった。この画面はまだ前の版の JS で動いているので、開き直しを勧める。 */
    changed = true;
    announce();
  });

  /* 見た目の確認用：`?update=1` で帯を出す（本物の更新が無くても見える）。
     保存も通信もしない・押しても開き直さない（確認のためだけの入口）。
     本番の URL には付けません（docs/UPDATE-NOTICE-TRK242-2026-11-01.md §6）。 */
  try {
    if (new URLSearchParams(location.search).get("update") === "1") {
      setTimeout(() => {
        if (bar) {
          if (barText) barText.textContent = tr("swUpdateBarText");
          if (nowBtn) nowBtn.textContent = tr("swUpdateNow");
          if (laterBtn) laterBtn.textContent = tr("swUpdateLater");
          bar.hidden = false;
        }
        setStatus(tr("swUpdateReady"));
      }, 600);
    }
  } catch (_) {}

  window.Trk = window.Trk || {};
  window.Trk.update = Object.freeze({
    check: () => checkNow({ status: true }),
    announce,
    notice: currentNotice,
    /* テスト・道具から同じ判定を動かせるように、純粋関数も置いておく */
    noticeFor: swNoticeFor,
    deferNotice: swDeferNotice,
    checkDue: swCheckDue,
    checkOutcome: swCheckOutcome,
    noticeEnabled,
    snoozeActive,
    snoozeMs: SNOOZE_MS,
    get dismissed() { return dismissed; }
  });
})();

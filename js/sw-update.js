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
   ・**保存は増やさない**。「あとで」はこの画面のあいだだけ覚える（開き直せば消える）。
     新しい保存キーを作らないので、移行の手当ても要らない。
   ・「いま更新する」は開き直すだけ。**遊んでいる途中に勝手に開き直さない。** */
(() => {
  "use strict";
  const core = window.Trk && window.Trk.core;
  if (!core) return;

  const CHECK_GAP_MS = 30 * 60 * 1000;      /* 自動で確かめる間隔（30分に1回まで） */
  const tr = key => (typeof window.tr === "function" ? window.tr(key) : key);

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
    if (pendingNotice) return "waiting";
    return swNoticeFor({ dismissed, hasController: hadController, waiting: !!(registration && registration.waiting), changed });
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
    get dismissed() { return dismissed; }
  });
})();

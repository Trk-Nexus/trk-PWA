// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 📲 trkをインストールする（trk295・設定の「📲 trkをインストール」） ============

   ・Chrome・Edge・Android などは、ブラウザーの「インストール」の確認を、ボタンのタップの中で出す。
   ・iPhone / iPad には、この確認が無い。ボタンは既存の「ホーム画面への追加」の案内（js/ios-pwa.js）を開く。
   ・インストール済み（ホーム画面のアプリとして開いている）なら、その旨だけを出す。
   ・確認が出せない端末（Firefox など）は、ブラウザーのメニューからの入れ方を出す。
   ・インストールすると、Chrome はフォルダーの許可も残しやすくなる（ブラウザーの仕様）。 */
(() => {
  "use strict";
  const panel = document.getElementById("installPanel");
  const btn = document.getElementById("appInstallBtn");
  const state = document.getElementById("appInstallState");
  if (!panel || !btn || !state) return;

  const ua = String(navigator.userAgent || "");
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1);
  const standalone = () => {
    try {
      return (window.matchMedia && (window.matchMedia("(display-mode:standalone)").matches ||
        window.matchMedia("(display-mode:fullscreen)").matches)) || navigator.standalone === true;
    } catch (_) { return navigator.standalone === true; }
  };

  let deferred = null;   /* beforeinstallprompt の確認（ボタンの中で prompt() する） */

  function sync() {
    if (standalone()) {
      btn.hidden = true;
      state.textContent = tr("appInstallDone");
      return;
    }
    btn.hidden = false;
    if (iOS) state.textContent = tr("appInstallIos");
    else state.textContent = deferred ? tr("appInstallHint") : tr("appInstallFallback");
  }

  btn.addEventListener("click", async () => {
    if (iOS) {
      const guide = document.getElementById("iosInstallBtn");
      if (guide) guide.click();   /* 既存の「ホーム画面への追加」の案内を開く */
      return;
    }
    if (!deferred) { state.textContent = tr("appInstallFallback"); return; }
    const ask = deferred;
    deferred = null;
    try {
      ask.prompt();   /* クリックの中で出す */
      const choice = await ask.userChoice;
      state.textContent = choice && choice.outcome === "accepted" ? tr("appInstallAccepted") : tr("appInstallDismissed");
    } catch (_) {
      state.textContent = tr("appInstallFallback");
    }
    sync();
  });

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();   /* 既定の小さな案内は出さず、設定のボタンから出す */
    deferred = event;
    sync();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    sync();
    state.textContent = tr("appInstallDone");
  });

  sync();
})();

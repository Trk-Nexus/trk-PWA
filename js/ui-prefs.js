// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 🖥 画面と再生バーの追加の設定（trk222・trk244） ============

   設定（⚙ → 🖥 画面と再生バー／❓ 謎設定）の次の6つを配線します。

     #uiScale        … 拡大率 50／75／100／125%（既定 100%）
     #fixedIconSize  … アイコンの大きさを 100% で固定する（既定オン）
     #uiModeLock     … 画面の形は、常に選んだものを使う（❓ 謎設定。既定オン）
     #fxInLibrary    … スマホ型で、エフェクトの欄をライブラリにも出す（既定オフ）
     #uiDensity      … 表示の密度 自動（窓の広さ）／ゆったり／ふつう／ぎゅっと／ぎっしり（既定 自動。trk245）
     #uiScaleCompact … 縮小（75%・50%）は「詰めて多く見せる」で行う（既定オン。Clementine／MusicBee の
                       Compact の考え方。オンの 75%・50% では密度は拡大率から決まるので #uiDensity は伏せます）

   ・保存は本体の設定（core.settings）だけ。trk244 で uiDensity・uiScaleCompact の2つが増えました（既定値あり）。
   ・画面の形そのものの切り替えは js/mobile-shell.js、再生バーは js/player-bar.js が担当します。
   ・ここは「値を読む／書く／反映を頼む」だけで、見た目の計算は core.applyUiScale() に任せます。 */
(() => {
  "use strict";
  const core = window.Trk && window.Trk.core;
  if (!core) return;

  const fields = {
    fixedIconSize: "fixedIconSize",
    uiModeLock: "uiModeLock",
    fxInLibrary: "fxInLibrary",
    playerBarSeekLock: "playerBarSeekLock",     /* 🎵 trk226：バーに触れても位置を移動しない（既定オフ） */
    playerBarRepeatOneOnly: "playerBarRepeatOneOnly",   /* 🎵 trk227：リピートは なし⇄1曲 だけ（既定オフ） */
    playerBarShuffleInList: "playerBarShuffleInList",   /* 🎵 trk227：シャッフルはいまの一覧から（既定オフ） */
    uiScaleCompact: "uiScaleCompact"                    /* 🧱 trk244：縮小は「詰めて多く見せる」（既定オン） */
  };
  /* 既定が「オン」の設定と「オフ」の設定が混ざっているので、どちらかを明示する */
  const DEFAULT_ON = new Set(["fixedIconSize", "uiModeLock", "uiScaleCompact"]);

  /* 🔤 trk246：書体の組み合わせ。選択肢は目録（js/typography.js）から1回だけ並べます。
     名前は相手の catalog の日本語そのまま（意訳して事実をずらさないため、4言語でも同じ名前を出します） */
  const typo = () => (window.Trk && window.Trk.typography) || null;
  let typoBuilt = false;
  function buildTypoOptions() {
    const T = typo();
    const select = document.getElementById("typoPairing");
    if (typoBuilt || !T || !select) return;
    for (const p of T.PAIRINGS) {
      const opt = document.createElement("option");
      opt.value = p.id; opt.textContent = p.name;
      select.appendChild(opt);
    }
    typoBuilt = true;
  }
  function syncTypo() {
    const T = typo();
    const select = document.getElementById("typoPairing");
    if (!T || !select) return;
    const saved = T.sanitize(core.settings.typography);
    if (select.value !== (saved ? saved.pairing : "")) select.value = saved ? saved.pairing : "";
    const state = document.getElementById("typoState");
    const use = document.getElementById("typoUse");
    let text = "";
    let p = null;
    if (saved) {
      p = T.byId(saved.pairing) || { name: saved.pairing };
      text = tr("typoState", { name: p.name, display: (saved.slots.display || {}).family || "-", body: (saved.slots.body || {}).family || "-" });
      if (T.available(saved) === false) text += tr("typoMissing");
    }
    if (state && state.textContent !== text) state.textContent = text;
    /* 🔤 trk255：この組が trk! でどんな曲に合うか（目録の trkUse）。選んでいなければ隠す。 */
    const useText = p && p.trkUse ? tr("typoUse", { use: p.trkUse }) : "";
    if (use) {
      if (use.textContent !== useText) use.textContent = useText;
      use.hidden = !useText;
    }
  }

  /* 設定の欄へ、いまの値を写す（起動時・言語やスキンの切り替え・設定を開いたとき） */
  function sync() {
    buildTypoOptions(); syncTypo();
    const scale = document.getElementById("uiScale");
    if (scale) {
      const value = String(core.uiScaleValue ? core.uiScaleValue() : core.settings.uiScale);
      if (scale.value !== value) scale.value = value;
    }
    /* 🧱 trk244・🪟 trk245：表示の密度。
       ①「縮小＝詰めて見せる」がオンの 75%・50% は、密度が拡大率から決まるので欄を伏せて理由を出す
       ②それ以外は選んだ段どおり（既定は 自動＝窓の広さに合わせる）。自動のときは、何段にしているかを書く */
    const auto = !!(core.uiDensityAuto ? core.uiDensityAuto() : false);
    const choices = core.UI_DENSITY_CHOICES || ["auto", "roomy", "normal", "compact", "dense"];
    const levelKeys = { auto:"uiDensityAutoOption", roomy:"uiDensityRoomy", normal:"uiDensityNormal", compact:"uiDensityCompact", dense:"uiDensityDense" };
    const stored = choices.includes(core.settings.uiDensity) ? core.settings.uiDensity : "auto";
    const density = document.getElementById("uiDensity");
    if (density) {
      if (density.value !== stored) density.value = stored;
      density.disabled = auto;
    }
    const densityState = document.getElementById("uiDensityState");
    if (densityState) {
      const level = core.uiDensityValue ? core.uiDensityValue() : "normal";
      const text = auto
        ? tr("uiDensityAuto", { n: core.uiScaleValue ? core.uiScaleValue() : 100 })
        : (stored === "auto" && typeof tr === "function"
          ? tr("uiDensityWindow", { level: tr(levelKeys[level] || "uiDensityNormal"), w: innerWidth, h: innerHeight })
          : "");
      if (densityState.textContent !== text) densityState.textContent = text;
    }
    for (const [id, key] of Object.entries(fields)) {
      const input = document.getElementById(id);
      if (input) {
        const on = DEFAULT_ON.has(id) ? core.settings[key] !== false : core.settings[key] === true;
        if (input.checked !== on) input.checked = on;
      }
    }
  }

  function save() {
    if (typeof core.saveUserPrefs === "function") core.saveUserPrefs();
  }

  function wire() {
    const scale = document.getElementById("uiScale");
    if (scale) {
      scale.addEventListener("change", () => {
        core.settings.uiScale = Number(scale.value);
        core.applyUiScale({ persist: true });
        sync();
      });
    }
    const density = document.getElementById("uiDensity");
    if (density) {
      density.addEventListener("change", () => {
        core.settings.uiDensity = density.value;
        core.applyUiScale({ persist: true });
        sync();
      });
    }
    /* 🔤 trk246：組み合わせを選ぶ（「使わない」で元に戻る）。保存は settings.typography だけ・キーは増やしません */
    const typoSelect = document.getElementById("typoPairing");
    if (typoSelect) {
      typoSelect.addEventListener("change", () => {
        const T = typo();
        if (!T) return;
        core.settings.typography = typoSelect.value ? T.sanitize({ pairing: typoSelect.value }) : null;
        T.apply(core.settings.typography);
        save();
        syncTypo();
      });
    }
    for (const [id, key] of Object.entries(fields)) {
      const input = document.getElementById(id);
      if (!input) continue;
      input.addEventListener("change", () => {
        core.settings[key] = input.checked;
        if (id === "fixedIconSize" || id === "uiScaleCompact") core.applyUiScale({ persist: true });
        else save();
        /* 画面の形の固定と、エフェクト欄の置き場所は、それぞれの担当へ知らせる（開き直さない） */
        try {
          if (id === "uiModeLock" && window.Trk.mobileShell && window.Trk.mobileShell.applyMode) window.Trk.mobileShell.applyMode();
          if (id === "fxInLibrary" && window.Trk.mobileShell && window.Trk.mobileShell.sync) window.Trk.mobileShell.sync();
        } catch (_) {}
        /* 🎵 trk227：リピートの段を単曲だけにしたら、残っていた「全曲」は「なし」へ寄せる。
           どちらの設定も、バーと再生画面へ合図を出して、開き直さずに反映する */
        if (id === "playerBarRepeatOneOnly" || id === "playerBarShuffleInList") {
          if (id === "playerBarRepeatOneOnly" && core.settings.playerBarRepeatOneOnly === true && core.settings.mediaRepeat === "all") {
            core.settings.mediaRepeat = "off";
            save();
          }
          try { if (typeof core.emit === "function") core.emit("mediaOptions"); } catch (_) {}
        }
      });
    }
  }

  for (const name of ["language", "settings", "skin", "uiscale"]) core.on(name, sync);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { sync(); wire(); }, { once: true });
  } else { sync(); wire(); }

  window.Trk = window.Trk || {};
  window.Trk.uiPrefs = Object.freeze({ sync, fields: Object.keys(fields) });
})();

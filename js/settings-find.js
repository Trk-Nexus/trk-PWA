// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 🔍 設定のさがす（trk243） ============

   ⚙ 設定のパネルが 19 枚になりました（🎨 見た目・🎮 操作・📦 パック・💾 端末の保存・
   📤 共有・🔊 音・🎭 キャラクター・🧺 お気に入り・🛟 緊急復旧…）。
   「あの設定はどこだったか」を目で探すしかなく、**探すための仕組みがありませんでした**。

   このファイルが受け持つこと：

   1. 設定のいちばん上に **🔍 設定をさがす** を置き、**言葉でパネルを絞る**。
   2. 当たったパネルは**開いて**出す（閉じたまま「見つかりません」に見えないように）。
   3. 当たらなかったパネルは**その場では隠す**（消しません。空にすると元の開閉に戻ります）。

   決めたこと（変えない）：

   ・**探す相手は、いま画面に出ている言葉**（`textContent`）。日本語・英語・中国語・韓国語の
     どれでも当たります。辞書のキーを別に持たないので、文言を足しても検索が置いていかれません。
   ・**もともと隠れているものは、検索でも出さない**（🍎 iPhone のパネル・開発用・条件付きのパネル）。
   ・**保存は増やさない**（検索語も残しません。設定を開くたび、まっさらから）。
   ・空白（全角も）で区切った語は **すべて含むもの**（AND）。 */
(() => {
  "use strict";
  const core = window.Trk && window.Trk.core;
  if (!core) return;

  const pane = document.getElementById("settingsScreen");
  const input = document.getElementById("setFindInput");
  const clearBtn = document.getElementById("setFindClear");
  const countEl = document.getElementById("setFindCount");
  const nothingEl = document.getElementById("setFindNothing");
  if (!pane || !input) return;

  /* ---------- 判定（純粋関数・テストから同じものを動かす） ---------- */

  /* 検索語を分ける（空白・全角空白で区切り、小文字にそろえる）。純粋関数。 */
  function setFindTerms(query) {
    return String(query == null ? "" : query).toLowerCase().split(/[\s\u3000]+/).filter(Boolean);
  }

  /* その文が当たるか（すべての語を含む＝AND・空の検索語はすべてに当たる）。純粋関数。 */
  function setFindHit(text, query) {
    const terms = setFindTerms(query);
    if (!terms.length) return true;
    const hay = String(text == null ? "" : text).toLowerCase();
    return terms.every(term => hay.includes(term));
  }

  /* ⌨ trk255：`/` で検索欄へ飛んでよいか。純粋関数。
     入力中の欄・選択・IME の変換中・修飾キー付きは横取りしない（文字を打つ邪魔をしない）。 */
  function slashAllowed(event) {
    const e = event || {};
    if (e.key !== "/") return false;
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    if (e.isComposing) return false;
    const target = e.target || {};
    const tag = String(target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return false;
    if (target.isContentEditable) return false;
    return true;
  }

  /* パネルの一覧から、出すもの・隠すものを決める。純粋関数。
     panels = [{ id, text, hidden }]（hidden＝もともと隠れている＝🍎 iPhone・開発用・条件付き）
     戻り値 = { active, show:[id], hide:[id], count }
       active:false … 検索していない（すべて元のまま） */
  function setFindPlan(panels, query) {
    const list = Array.isArray(panels) ? panels : [];
    const terms = setFindTerms(query);
    if (!terms.length) {
      return {
        active: false,
        show: list.filter(p => !p.hidden).map(p => p.id),
        hide: list.filter(p => p.hidden).map(p => p.id),
        count: 0,
      };
    }
    const show = [], hide = [];
    for (const panel of list) {
      if (panel.hidden) { hide.push(panel.id); continue; }        /* もともと隠れているものは出さない */
      if (setFindHit(panel.text, query)) show.push(panel.id); else hide.push(panel.id);
    }
    return { active: true, show, hide, count: show.length };
  }

  /* ---------- 画面 ---------- */
  let saved = null;            /* 絞る前の開閉と hidden（Map<要素, {open, hidden}>） */

  function panels() { return [...pane.querySelectorAll("details.panel")]; }

  function snapshot() {
    saved = new Map();
    panels().forEach((el, index) => {
      el.dataset.setFindId = String(index);
      saved.set(el, { open: el.open, hidden: el.hidden });
    });
  }

  function restore() {
    if (!saved) return;
    for (const [el, state] of saved) { el.hidden = state.hidden; el.open = state.open; }
    saved = null;
  }

  function showMeta(plan) {
    if (countEl) {
      countEl.hidden = !plan.active;
      countEl.textContent = plan.active ? tr("setFindCount", { n: plan.count }) : "";
    }
    if (nothingEl) nothingEl.hidden = !(plan.active && plan.count === 0);
  }

  function apply(raw) {
    const query = String(raw == null ? "" : raw);
    if (clearBtn) clearBtn.hidden = !query.trim();
    const terms = setFindTerms(query);
    if (!terms.length) {                       /* 空に戻したら、元の開閉へ */
      restore();
      showMeta({ active:false, count:0 });
      return;
    }
    if (!saved) snapshot();
    const list = [...saved.entries()].map(([el, state]) => ({
      id: el.dataset.setFindId, text: el.textContent, hidden: state.hidden,
    }));
    const plan = setFindPlan(list, query);
    const hit = new Set(plan.show);
    for (const [el] of saved) {
      if (hit.has(el.dataset.setFindId)) { el.hidden = false; el.open = true; }   /* 当たったものは開いて見せる */
      else el.hidden = true;
    }
    showMeta(plan);
  }

  function clear() {
    if (input.value) input.value = "";
    apply("");
  }

  input.addEventListener("input", () => apply(input.value));
  input.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); clear(); }
  });
  if (clearBtn) clearBtn.addEventListener("click", () => { clear(); try { input.focus(); } catch (_) {} });

  /* ⌨ trk255：設定を開いているあいだ、`/` で「設定をさがす」へ飛ぶ。
     入力欄の中では何もしない（`/` を打ちたいときの邪魔をしない）。 */
  document.addEventListener("keydown", event => {
    if (!pane || pane.hidden) return;
    if (!slashAllowed(event)) return;
    event.preventDefault();
    try { input.focus(); input.select(); } catch (_) {}
  });

  /* 設定を開くたび、まっさらから（前の検索語を残さない） */
  try { core.on("settings", () => { clear(); }); } catch (_) {}
  try { core.on("settingsClose", () => { clear(); }); } catch (_) {}
  /* 言葉を変えたら、出ている文言も変わる。当たっているものは、新しい言葉で引き直す */
  try { core.on("language", () => { if (input.value.trim()) apply(input.value); }); } catch (_) {}

  window.Trk = window.Trk || {};
  window.Trk.setFind = Object.freeze({
    apply,
    clear,
    terms: setFindTerms,
    hit: setFindHit,
    plan: setFindPlan,
    slash: slashAllowed,
  });
})();

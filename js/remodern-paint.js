// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 🎨 trk-re-modern：作品の色を画面に当てる（段階2・M3・共通の題字だけ） ============

   設計：docs/REMODERN-DESIGN-DRAFT-2026-11-06.md（E3＝最初の適用先は共通 UI の題字・見出しのみ）
         docs/REMODERN-PWA-REPLY-2026-11-06.md（M3 は未実装 → trk305 で題字だけ実装）

   ・当てる先は **共通の題字（.brand h1 の「trk!」）だけ**。書斎・基地・作品の一覧・見本には触れない
   ・使う色は作品の値のうち 2 つだけ：colors.text（文字）と colors.accent（「!」）
   ・色は #rrggbb の形だけ（js/remodern-regions.js の validateWork で検査済みの値）。
     そのうえで、題字が乗っている背景との対比が 4.5:1 に届かない色は使わない（既定の色のまま）
   ・当てるのは要素の inline の color だけ。消すときは空に戻す（＝直前の既定へ戻る）
   ・この道具は画面の値を保存しない（保存は設定の作品一覧のまま）

   純粋な計算（ratio・parseRgb・titlePaint）は DOM なしで検査できる。
   applyTitle・clearTitle・effectiveBg だけが DOM を触る。 */
(() => {
  "use strict";
  const MIN_RATIO = 4.5;
  const HEX = /^#[0-9a-fA-F]{6}$/;

  /* #rrggbb → [r, g, b]（0〜255）。違えば null */
  function hexToRgb(hex) {
    if (typeof hex !== "string" || !HEX.test(hex)) return null;
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /* CSS の色の文字列（rgb( ) / rgba( )）→ [r, g, b, a]。読めなければ null */
  function parseRgb(str) {
    const m = typeof str === "string" && str.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/);
    if (!m) return null;
    const a = m[4] === undefined ? 1 : (m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
    return [Number(m[1]), Number(m[2]), Number(m[3]), Math.min(1, Math.max(0, a))];
  }

  /* 相対輝度（WCAG）*/
  function luminance([r, g, b]) {
    const lin = c => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  /* 対比の比（1〜21）。引数は [r, g, b] */
  function ratio(a, b) {
    const la = luminance(a), lb = luminance(b);
    const hi = Math.max(la, lb), lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }

  /* 作品の値から、題字に当てる色を決める。背景（bgRgb）と対比が足りない色は null（＝既定のまま） */
  function titlePaint(work, bgRgb) {
    const out = { text: null, accent: null, skipped: [] };
    const colors = work && work.colors && typeof work.colors === "object" ? work.colors : {};
    if (!bgRgb) return out;
    for (const [slot, key] of [["text", "text"], ["accent", "accent"]]) {
      const hex = colors[key];
      const rgb = hexToRgb(hex);
      if (!rgb) continue;
      if (ratio(rgb, bgRgb) >= MIN_RATIO) out[slot] = hex.toLowerCase();
      else out.skipped.push(key);
    }
    return out;
  }

  /* 題字の背景：要素から上へ向かって、半透明の背景を下から重ねた色（不透明な基準は #000）。
     🎨 trk313：背景に実際の画像（url(...)）があれば、色を一つに決められないので null（＝当てない）。
     画像・動画・透過の背景は、対比を測れないため安全側に倒す（Avatar の M3 検証記録 §2）。
     装飾の radial-gradient（例：.screen の淡い光）は画像ではないため、従来どおり背景色で測る。 */
  function effectiveBg(el) {
    if (!el || typeof getComputedStyle !== "function") return null;
    const layers = [];
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      const cs = getComputedStyle(node);
      if (/url\(/i.test(cs.backgroundImage || "")) return null;
      const rgba = parseRgb(cs.backgroundColor);
      if (rgba && rgba[3] > 0) layers.push(rgba);
    }
    let base = [0, 0, 0];
    for (let i = layers.length - 1; i >= 0; i--) {
      const [r, g, b, a] = layers[i];
      base = [r * a + base[0] * (1 - a), g * a + base[1] * (1 - a), b * a + base[2] * (1 - a)];
    }
    return base.map(v => Math.round(v));
  }

  /* 題字（h1 と その中の「!」）に色を当てる。値が無い色は空にして既定へ戻す */
  function applyTitle(h1, paint) {
    if (!h1) return;
    const accent = h1.querySelector("span");
    h1.style.color = paint && paint.text ? paint.text : "";
    if (accent) accent.style.color = paint && paint.accent ? paint.accent : "";
  }
  function clearTitle(h1) { applyTitle(h1, null); }

  const api = { MIN_RATIO, hexToRgb, parseRgb, luminance, ratio, titlePaint, effectiveBg, applyTitle, clearTitle };
  if (typeof globalThis !== "undefined") globalThis.TrkReModernPaint = api;
})();

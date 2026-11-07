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

  /* 候補の間の色も調べる（グラデーションの途中の色）。各組の 1/8 刻みの点を足す。候補が多いときは端だけ */
  function withBetween(bgs) {
    if (bgs.length > 16) return bgs;
    const out = bgs.slice();
    for (let i = 0; i < bgs.length; i++) {
      for (let j = i + 1; j < bgs.length; j++) {
        for (let k = 1; k < 8; k++) {
          const f = k / 8;
          out.push([0, 1, 2].map(n => bgs[i][n] * (1 - f) + bgs[j][n] * f));
        }
      }
    }
    return out;
  }

  /* 作品の値から、題字に当てる色を決める。
     bg は次のどちらか：[r,g,b]（単色の背景）／[[r,g,b], ...]（effectiveBgs が返す候補＝グラデーションの色の組）。
     候補の全部で対比が 4.5:1 に届かない色は使わない（既定のまま）。候補が無いとき（判定できない）は使わない。 */
  function titlePaint(work, bg) {
    const out = { text: null, accent: null, skipped: [] };
    const colors = work && work.colors && typeof work.colors === "object" ? work.colors : {};
    const bgs = normalizeBgs(bg);
    if (!bgs) return out;
    const probes = withBetween(bgs);
    for (const key of ["text", "accent"]) {
      const hex = colors[key];
      const rgb = hexToRgb(hex);
      if (!rgb) continue;
      if (probes.every(b => ratio(rgb, b) >= MIN_RATIO)) out[key] = hex.toLowerCase();
      else out.skipped.push(key);
    }
    return out;
  }

  /* 候補の形を揃える。単色（[r,g,b]）→ [[r,g,b]]。判定できない（null・空）→ null */
  function normalizeBgs(bg) {
    if (!bg) return null;
    const list = Array.isArray(bg[0]) ? bg : [bg];
    if (!list.length || list.some(c => !Array.isArray(c) || c.length < 3)) return null;
    return list;
  }

  /* 要素の背景の見え方（1 層ぶん）→ 各候補の色。判定できない層は null。
     🎨 trk314：画像（url）・判定できない関数・重ね方の指定（mix-blend・filter・backdrop）・透明度は、
     対比を数値で確かめられないので null（＝当てない）。
     グラデーションは、その色の停止点（rgb の並び）を候補にする。停止点の間は、後の「間の色」検査で見る。 */
  const SAFE_FUNCS = /^(rgba?|linear-gradient|radial-gradient|conic-gradient|repeating-linear-gradient|repeating-radial-gradient|repeating-conic-gradient)$/;
  function layerOptions(cs) {
    if (!cs) return null;
    if (cs.mixBlendMode && cs.mixBlendMode !== "normal") return null;
    if (cs.filter && cs.filter !== "none") return null;
    if (cs.backdropFilter && cs.backdropFilter !== "none") return null;
    if (cs.opacity !== undefined && Number(cs.opacity) < 1) return null;
    const img = cs.backgroundImage || "none";
    let stops = [];
    if (img !== "none") {
      if (/url\(/i.test(img)) return null;
      const names = [...img.matchAll(/([a-zA-Z-]+)\(/g)].map(m => m[1].toLowerCase());
      if (!names.length || names.some(n => !SAFE_FUNCS.test(n))) return null;
      stops = [...img.matchAll(/rgba?\([^)]*\)/g)].map(m => parseRgb(m[0]));
      if (stops.some(s => !s)) return null;
      if (!stops.length) return null;
    }
    const solid = parseRgb(cs.backgroundColor);
    return { solid: solid && solid[3] > 0 ? solid : null, stops };
  }

  /* 上から下へ：候補（背景の色の組）を重ねる。層が多すぎるときは null（＝判定しない） */
  const MAX_CANDIDATES = 64;
  function over(top, below) {
    const a = top[3];
    return [0, 1, 2].map(i => top[i] * a + below[i] * (1 - a));
  }

  /* 題字の背景の候補：要素から上へ向かって、外側の層から順に重ねる。
     返り値は [r,g,b] の配列（候補の全部）。判定できないときは null。 */
  function effectiveBgs(el) {
    if (!el || typeof getComputedStyle !== "function") return null;
    const chain = [];
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) chain.unshift(node);
    let states = [[0, 0, 0]];
    for (const node of chain) {
      const opt = layerOptions(getComputedStyle(node));
      if (!opt) return null;
      if (!opt.solid && !opt.stops.length) continue;
      const next = [];
      for (const s of states) {
        const under = opt.solid ? over(opt.solid, s) : s;
        next.push(under);
        for (const g of opt.stops) next.push(over(g, under));
      }
      states = dedupe(next);
      if (states.length > MAX_CANDIDATES) return null;
    }
    return states.map(c => c.map(v => Math.round(v)));
  }

  function dedupe(list) {
    const seen = new Set(), out = [];
    for (const c of list) {
      const k = c.map(v => Math.round(v)).join(",");
      if (!seen.has(k)) { seen.add(k); out.push(c); }
    }
    return out;
  }

  /* 互換：単色なら [r,g,b]、候補が複数なら配列、判定できないなら null */
  function effectiveBg(el) {
    const list = effectiveBgs(el);
    if (!list) return null;
    return list.length === 1 ? list[0] : list;
  }

  /* 題字（h1 と その中の「!」）に色を当てる。値が無い色は空にして既定へ戻す */
  function applyTitle(h1, paint) {
    if (!h1) return;
    const accent = h1.querySelector("span");
    h1.style.color = paint && paint.text ? paint.text : "";
    if (accent) accent.style.color = paint && paint.accent ? paint.accent : "";
  }
  function clearTitle(h1) { applyTitle(h1, null); }

  const api = { MIN_RATIO, hexToRgb, parseRgb, luminance, ratio, titlePaint, effectiveBg, effectiveBgs, applyTitle, clearTitle };
  if (typeof globalThis !== "undefined") globalThis.TrkReModernPaint = api;
})();

// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 🎨 trk-re-modern：作品ファイルの検証（段階2・項目4・純粋な道具） ============

   設計：docs/REMODERN-DESIGN-DRAFT-2026-11-06.md（E2＝既存の .stpack の形式を拡張して読む）

   ・作品ファイルは .stpack（ZIP）。pack.json の書式名は既存と同じ "shadow-taiko-pack"、
     そのうえに `remodern`（version 1）の欄がある。これで「作品」と「スキンのパック」を見分ける
   ・許すのは作品の値だけ：id・name・author・license・regions・colors（3 種だけ）・heading.font
   ・任意の JS・HTML・CSS・URL は持たない（知らない項目は捨てる）
   ・値の検証は js/remodern-regions.js の validateWork に任せる（色は #rrggbb、書体は許可リスト）
   ・この道具は DOM を使わない。ZIP を開く・保存する処理は js/remodern-ui.js にある */
(function () {
  "use strict";

  const FORMAT = "shadow-taiko-pack";
  /* 作品の色は Avatar の候補（pixel-console）と同じ 14 個。スキンと同じ鍵にそろえる（レビュー M4） */
  const COLOR_KEYS = Object.freeze(["stage", "ink", "text", "muted", "bg", "panel", "field", "button", "accent", "onAccent", "gold", "border", "don", "ka"]);
  const MAX_ZIP_BYTES = 256 * 1024;   /* 作品ファイル全体 */
  const MAX_JSON_BYTES = 32 * 1024;   /* pack.json の展開後 */
  const MAX_WORKS = 20;               /* 保存する作品の数 */
  const ALLOWED_EXTRA = /^(LICENSE|README)[^/]*$/i;  /* 作品に入れてよい文書（ほかのファイルは受け付けない） */

  const fail = reason => ({ ok: false, reason, work: null });
  const V = () => globalThis.TrkReModernRegions;

  function pstr(v, max) {
    /* 制御文字と、書字方向の制御（逆向きに見せる偽装を防ぐ）を取り除く */
    return typeof v === "string"
      ? v.replace(/[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "").trim().slice(0, max)
      : "";
  }

  /* 作品の値だけを取り出す（知らない項目は落とす）。検証は validateWork に任せる */
  function cleanWork(src) {
    if (!src || typeof src !== "object") return null;
    const out = {
      id: src.id,
      name: pstr(src.name, 40),
      author: pstr(src.author, 40),
      license: pstr(src.license, 200),
      regions: Array.isArray(src.regions) ? [...new Set(src.regions)] : null
    };
    if (src.colors && typeof src.colors === "object") {
      const colors = {};
      for (const key of COLOR_KEYS) if (key in src.colors) colors[key] = src.colors[key];
      out.colors = colors;
    }
    if (src.heading && typeof src.heading === "object") out.heading = { font: src.heading.font };
    return out;
  }

  /* 作品として使える形か。理由は reason に返す（例外は投げない） */
  function checkWork(src) {
    const work = cleanWork(src);
    if (!work) return fail("not-object");
    if (!work.name) return fail("no-name");
    if (!work.license) return fail("no-license");
    const v = V() && V().validateWork ? V().validateWork(work) : { ok: false, reason: "no-validator" };
    if (!v.ok) return fail(v.reason);
    return { ok: true, reason: null, work };
  }

  /* pack.json（JSON を読んだ後の値）を検査する。作品でなければ not-work */
  function checkManifest(raw) {
    if (!raw || typeof raw !== "object" || raw.format !== FORMAT) return fail("not-work");
    const r = raw.remodern;
    if (!r || typeof r !== "object" || r.version !== 1) return fail("not-work");
    return checkWork({
      id: r.id, name: raw.name, author: raw.author, license: raw.license,
      regions: r.regions, colors: r.colors, heading: r.heading
    });
  }

  /* ZIP の中身の名前が許されるか：pack.json と、LICENSE・README の文書だけ */
  function checkEntryNames(names) {
    for (const name of names) {
      if (name.endsWith("/")) continue;
      if (name.startsWith("__MACOSX/")) continue;
      if (name.split("/").length > 1) return fail("nested-file");
      if (name === "pack.json" || ALLOWED_EXTRA.test(name)) continue;
      return fail("extra-file");
    }
    return { ok: true, reason: null };
  }

  /* 保存された作品の一覧を読む。壊れた項目は捨て、残りを返す（保存した ID を勝手に消さない範囲で） */
  function loadWorks(list) {
    const out = {};
    if (!Array.isArray(list)) return out;
    for (const item of list.slice(0, MAX_WORKS)) {
      const c = checkWork(item);
      if (c.ok) out[c.work.id] = c.work;
    }
    return out;
  }

  /* 作品を一覧へ入れる（同じ id は置き換え。上限を超えたら false） */
  function addWork(list, work) {
    const base = Array.isArray(list) ? list.filter(w => !w || w.id !== work.id) : [];
    if (base.length >= MAX_WORKS) return null;
    return [...base, work];
  }

  const api = { FORMAT, COLOR_KEYS, MAX_ZIP_BYTES, MAX_JSON_BYTES, MAX_WORKS, cleanWork, checkWork, checkManifest, checkEntryNames, loadWorks, addWork };
  if (typeof globalThis !== "undefined") globalThis.TrkReModernWork = api;
})();

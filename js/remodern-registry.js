// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 🎨 trk-re-modern：登録簿との照合（段階2・R3 ②③・trk307） ============

   設計：docs/REMODERN-PWA-PROGRESS-M3-2026-11-06.md（登録簿との照合）
         Avatar 側の返事：docs/2026-11-06-re-modern-m3-avatar-response.md（登録簿は JSON の写し）

   ・登録簿は data/re-modern-registry.json（Avatar の catalog/re-modern/index.json を、そのまま写したもの）
   ・読めない・壊れている・版が違う・ID が不正・重複がある → 全部「未確認」（安全側）
   ・空の登録簿では、どの作品も「未確認」。「登録済み」とは表示しない
   ・ID が一致しても、作者の認証やファイルの同一性は証明しない（作品 ZIP のハッシュは照合しない）
   ・この道具は DOM を使わない。読み込みは通信（同じサイトのファイル）だけ。外部へは出ない */
(() => {
  "use strict";
  const FORMAT = "trk-re-modern-registry";
  const VERSION = 1;
  const PATH = "data/re-modern-registry.json";
  /* Avatar 側の予約 ID の規則（tools/check-re-modern.mjs と同じ） */
  const ID = /^trk-re-modern-[a-z0-9]+(?:-[a-z0-9]+)*$/;

  const unverified = reason => ({ ok: false, reason, ids: [] });

  /* 読んだ JSON を検査する。1つでもおかしければ、全体を未確認にする（壊れた写しを信じない） */
  function check(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return unverified("not-object");
    if (raw.format !== FORMAT) return unverified("bad-format");
    if (raw.version !== VERSION) return unverified("bad-version");
    if (!Array.isArray(raw.ids)) return unverified("bad-ids");
    if (raw.ids.some(id => typeof id !== "string" || !ID.test(id))) return unverified("bad-id");
    if (new Set(raw.ids).size !== raw.ids.length) return unverified("duplicate-id");
    return { ok: true, reason: null, ids: [...raw.ids] };
  }

  /* 作品が登録簿に載っているか。"registered" か "unverified" */
  function statusOf(id, registry) {
    return registry && registry.ok && typeof id === "string" && registry.ids.includes(id) ? "registered" : "unverified";
  }

  /* 写しを読む（同じサイトのファイル）。読めなければ未確認。例外は投げない */
  async function load(fetchFn = globalThis.fetch, url = PATH) {
    if (typeof fetchFn !== "function") return unverified("no-fetch");
    try {
      const response = await fetchFn(url, { cache: "no-cache", credentials: "same-origin" });
      if (!response || !response.ok) return unverified("missing");
      return check(JSON.parse(await response.text()));
    } catch (_) {
      return unverified("unreadable");
    }
  }

  const api = { FORMAT, VERSION, PATH, ID, check, statusOf, load };
  if (typeof globalThis !== "undefined") globalThis.TrkReModernRegistry = api;
})();

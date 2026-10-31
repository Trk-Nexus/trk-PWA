// SPDX-License-Identifier: GPL-3.0-or-later
/* 📚 目録（trk-Avatar-Library の catalog/index.json）から、パックを入れる（trk230）
 *
 *   なぜ要るか：
 *     書体や見た目は容量が大きくなりがちで、アプリ本体には入れきれません。
 *     そこで「配る側」の倉庫（trk-Avatar-Library）に .stpack を置き、
 *     アプリは**目録を1回読むだけ**で「何が配られているか」を一覧できます。
 *
 *   方針（既存の約束を守る）：
 *     ・**外部へは取りに行かない**。目録は利用者が選んだファイルを読むだけ（fetch しない）。
 *     ・目録が指す .stpack も、利用者が選んだファイルだけを入れる（自動ダウンロードなし）。
 *     ・入れる前に sha256 を照合し、目録と違えば入れない（途中で壊れた・すり替わったを防ぐ）。
 *     ・crypto.subtle が無い環境（古い・安全でない文脈）では、その旨を出して「照合せずに入れる」選択肢を残す。
 *
 *   目録の形（version 1・trk-Avatar-Library の tools/build-catalog.mjs が作る）:
 *     { "format":"trk-avatar-library", "version":1, "packs":[
 *         { "id","name","author","version","file","sha256","bytes","fonts":[{family,file,license}],"license","description" } ] }
 */
(function () {
  "use strict";
  const CATALOG_FORMAT = "trk-avatar-library", CATALOG_VERSION = 1;
  const MAX_PACKS = 500, MAX_STR = 300;
  const HEX64 = /^[0-9a-f]{64}$/i;
  const SAFE_FILE = /^[A-Za-z0-9_.\-\/]{1,160}$/;

  const str = (v, n = MAX_STR) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const num = v => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);

  /* 目録の1件を、決めた形だけに削る（おかしければ null） */
  function sanitizeCatalogEntry(raw) {
    if (!raw || typeof raw !== "object") return null;
    const file = str(raw.file, 160);
    if (!SAFE_FILE.test(file) || file.includes("..") || file.startsWith("/") || !/\.stpack$/i.test(file)) return null;
    const id = str(raw.id, 64) || file;
    const name = str(raw.name, 80);
    if (!name) return null;
    const sha256 = str(raw.sha256, 64).toLowerCase();
    const fonts = (Array.isArray(raw.fonts) ? raw.fonts : []).slice(0, 20).map(f => ({
      family: str(f && f.family, 80), file: str(f && f.file, 120), license: str(f && f.license, 80),
    })).filter(f => f.family);
    return {
      id, name, author: str(raw.author, 80), version: str(raw.version, 24), file,
      sha256: HEX64.test(sha256) ? sha256 : "",
      bytes: num(raw.bytes), fonts,
      license: str(raw.license, 200), description: str(raw.description, 300),
      url: /^https:\/\/[^\s"'<>]+$/.test(str(raw.url, 300)) ? str(raw.url, 300) : "",
    };
  }

  /* 目録そのものを読む。形式が違えば null */
  function sanitizeCatalog(raw) {
    if (!raw || typeof raw !== "object" || raw.format !== CATALOG_FORMAT) return null;
    if (Number(raw.version) > CATALOG_VERSION) return null;   /* 新しい版は、このアプリでは読めない */
    const packs = (Array.isArray(raw.packs) ? raw.packs : []).slice(0, MAX_PACKS)
      .map(sanitizeCatalogEntry).filter(Boolean);
    return {
      format: CATALOG_FORMAT, version: CATALOG_VERSION,
      name: str(raw.name, 80) || "trk-Avatar-Library",
      updatedAt: str(raw.updatedAt, 40), packs,
      dropped: (Array.isArray(raw.packs) ? raw.packs.length : 0) - packs.length,
    };
  }

  /* 目録の1件と、選ばれたファイルが合っているか（大きさと名前だけ。ハッシュは別に計算する） */
  function checkAgainstEntry(entry, file) {
    if (!entry || !file) return { ok:false, reason:"noFile" };
    const base = String(file.name || "").split("/").pop().toLowerCase();
    const want = entry.file.split("/").pop().toLowerCase();
    if (base && want && base !== want) return { ok:false, reason:"nameMismatch" };
    if (entry.bytes > 0 && Number(file.size) !== entry.bytes) return { ok:false, reason:"sizeMismatch", want:entry.bytes, got:Number(file.size) || 0 };
    return { ok:true, reason:"" };
  }

  const formatBytes = n => {
    const v = Number(n) || 0;
    if (v < 1024) return `${v} B`;
    if (v < 1048576) return `${(v / 1024).toFixed(1)} KB`;
    return `${(v / 1048576).toFixed(1)} MB`;
  };

  /* sha256（小文字16進）。crypto.subtle が無ければ null */
  async function sha256Hex(blob) {
    const subtle = typeof crypto !== "undefined" && crypto.subtle;
    if (!subtle || typeof subtle.digest !== "function") return null;
    try {
      const buf = await blob.arrayBuffer();
      const digest = await subtle.digest("SHA-256", buf);
      return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
    } catch (_) { return null; }
  }

  window.Trk = window.Trk || {};
  window.Trk.packCatalog = Object.assign(window.Trk.packCatalog || {}, {
    CATALOG_FORMAT, CATALOG_VERSION, sanitizeCatalog, sanitizeCatalogEntry,
    checkAgainstEntry, formatBytes, sha256Hex,
  });

  /* ---------- 画面（設定 → 📦 カスタムパック → 📚 目録から入れる） ---------- */
  const $ = id => document.getElementById(id);
  let current = null;            /* 読み込んだ目録 */

  function render() {
    const list = $("catalogList"), sum = $("catalogSummary");
    if (!list) return;
    list.textContent = "";
    if (!current) {
      if (sum) sum.textContent = "";
      return;
    }
    if (sum) {
      sum.textContent = current.packs.length
        ? tr("catalogLoaded", { n: current.packs.length, name: current.name })
        : tr("catalogEmpty");
    }
    for (const e of current.packs) {
      const card = document.createElement("div");
      card.className = "packCard";
      const head = document.createElement("div");
      head.className = "packHead";
      const b = document.createElement("b"); b.textContent = e.name; head.append(b);
      if (e.author) { const s = document.createElement("span"); s.className = "packBy"; s.textContent = "by " + e.author; head.append(s); }
      const sz = document.createElement("span"); sz.className = "packBy";
      sz.textContent = e.bytes ? formatBytes(e.bytes) : tr("catalogSizeUnknown"); head.append(sz);
      card.append(head);
      if (e.description) { const d = document.createElement("div"); d.className = "hint"; d.textContent = e.description; card.append(d); }
      const badges = document.createElement("div"); badges.className = "packBadges";
      if (e.fonts.length) { const t = document.createElement("span"); t.className = "packBadge"; t.textContent = tr("catalogFonts", { n: e.fonts.length }); badges.append(t); }
      if (e.license) { const t = document.createElement("span"); t.className = "packBadge"; t.textContent = e.license; badges.append(t); }
      if (e.sha256) { const t = document.createElement("span"); t.className = "packBadge"; t.textContent = "sha256 " + e.sha256.slice(0, 8); badges.append(t); }
      if (badges.children.length) card.append(badges);
      const acts = document.createElement("div"); acts.className = "miniActions";
      const label = document.createElement("label"); label.className = "fileBtn small";
      const input = document.createElement("input");
      input.type = "file"; input.accept = ".stpack"; input.hidden = true;
      const span = document.createElement("span"); span.textContent = tr("catalogPick");
      label.append(input, span);
      input.addEventListener("change", () => { const f = input.files && input.files[0]; if (f) installFromCatalog(e, f); input.value = ""; });
      acts.append(label); card.append(acts);
      const note = document.createElement("div"); note.className = "hint"; note.dataset.for = e.id; card.append(note);
      list.append(card);
    }
  }

  function setRowNote(entry, text, bad) {
    const list = $("catalogList"); if (!list) return;
    const node = list.querySelector(`[data-for="${CSS.escape(entry.id)}"]`);
    if (node) { node.textContent = text; node.style.color = bad ? "var(--don)" : ""; }
  }

  async function installFromCatalog(entry, file) {
    const core = window.Trk && window.Trk.core;
    const check = checkAgainstEntry(entry, file);
    if (!check.ok) {
      if (check.reason === "sizeMismatch") {
        setRowNote(entry, tr("catalogSizeBad", { want: formatBytes(check.want), got: formatBytes(check.got) }), true);
        return;
      }
      if (check.reason === "nameMismatch" && !confirm(tr("catalogNameBad", { want: entry.file, got: file.name }))) return;
    }
    if (entry.sha256) {
      const got = await sha256Hex(file);
      if (got == null) setRowNote(entry, tr("catalogNoHash"), false);
      else if (got !== entry.sha256) { setRowNote(entry, tr("catalogHashBad"), true); return; }
      else setRowNote(entry, tr("catalogHashOk"), false);
    }
    const install = window.Trk.custom && window.Trk.custom.installPackFile;
    if (!install) { if (core) core.setStatus("packStatus", "packUnsupported"); return; }
    const r = await install(file);
    if (r) setRowNote(entry, tr("catalogInstalled", { name: entry.name }), false);
  }

  async function loadCatalogFile(file) {
    const core = window.Trk && window.Trk.core;
    try {
      const raw = JSON.parse(await file.text());
      const cat = sanitizeCatalog(raw);
      if (!cat) { if (core) core.setStatus("packStatus", "catalogBad"); return; }
      current = cat; render();
      if (core) core.setStatus("packStatus", cat.packs.length ? null : "catalogEmpty");
      if (cat.dropped > 0) core.setStatus("catalogStatus", "catalogDropped", { n: cat.dropped });
    } catch (_) { if (core) core.setStatus("packStatus", "catalogBad"); }
  }

  function init() {
    const input = $("catalogFile");
    if (input) input.addEventListener("change", () => { const f = input.files && input.files[0]; if (f) loadCatalogFile(f); input.value = ""; });
    /* 目録の .json を画面にドロップしても読める（.stpack のドロップは custom.js が先に受け取る） */
    addEventListener("drop", e => {
      const files = e.dataTransfer && e.dataTransfer.files ? [...e.dataTransfer.files] : [];
      const json = files.find(f => /\.json$/i.test(f.name));
      if (!json) return;
      e.preventDefault(); e.stopPropagation();
      loadCatalogFile(json);
    }, true);
    /* ❓謎設定の「目録を読む」を開いたら、前回の目録を出しておく（保存はしない） */
    const panel = $("packCatalogPanel");
    if (panel) panel.addEventListener("toggle", () => { if (panel.open && current) render(); });
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  window.Trk.packCatalog.loadFile = loadCatalogFile;
})();

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

  /* 目録の1件と、入っているパックが同じものか（名前と作者。大文字小文字と前後の空白は無視） */
  const packKey = o => `${String((o && o.name) || "").trim().toLowerCase()}\u0000${String((o && o.author) || "").trim().toLowerCase()}`;
  const samePackAs = (a, b) => packKey(a) === packKey(b);

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
    checkAgainstEntry, formatBytes, samePackAs, packKey, sha256Hex,
  });

  /* ---------- 画面（設定 → 📦 カスタムパック → 📚 目録から入れる） ---------- */
  const $ = id => document.getElementById(id);
  let current = null;            /* 読み込んだ目録 */
  let installed = [];            /* 入っているパック（window.Trk.custom.listInstalledPacks） */
  const samePack = samePackAs;
  const stateOf = entry => {
    const hit = installed.find(rec => samePack(entry, rec));
    if (!hit) return { key:"catalogStateNew", hit:null };
    return hit.active ? { key:"catalogStateActive", hit } : { key:"catalogStateInstalled", hit };
  };

  async function refreshInstalled() {
    const api = window.Trk && window.Trk.custom;
    installed = api && typeof api.listInstalledPacks === "function" ? await api.listInstalledPacks() : [];
  }

  function render() {
    const list = $("catalogList"), sum = $("catalogSummary");
    if (!list) return;
    list.textContent = "";
    if (!current) { if (sum) sum.textContent = ""; return; }
    if (sum) {
      const total = current.packs.length;
      const n = current.packs.filter(e => installed.some(rec => samePack(e, rec))).length;
      sum.textContent = total ? tr(n ? "catalogLoadedInstalled" : "catalogLoaded", { n: total, name: current.name, have: n }) : tr("catalogEmpty");
    }
    for (const e of current.packs) {
      const st = stateOf(e);
      const card = document.createElement("div");
      card.className = "packCard" + (st.hit && st.hit.active ? " active" : "");
      const head = document.createElement("div");
      head.className = "packHead";
      const b = document.createElement("b"); b.textContent = e.name; head.append(b);
      if (e.author) { const s = document.createElement("span"); s.className = "packBy"; s.textContent = "by " + e.author; head.append(s); }
      const sz = document.createElement("span"); sz.className = "packBy";
      sz.textContent = e.bytes ? formatBytes(e.bytes) : tr("catalogSizeUnknown"); head.append(sz);
      card.append(head);
      if (e.description) { const d = document.createElement("div"); d.className = "hint"; d.textContent = e.description; card.append(d); }
      const badges = document.createElement("div"); badges.className = "packBadges";
      const stateBadge = document.createElement("span");
      stateBadge.className = "packBadge"; stateBadge.textContent = tr(st.key); badges.append(stateBadge);
      if (e.fonts.length) { const t = document.createElement("span"); t.className = "packBadge"; t.textContent = tr("catalogFonts", { n: e.fonts.length }); badges.append(t); }
      if (e.license) { const t = document.createElement("span"); t.className = "packBadge"; t.textContent = e.license; badges.append(t); }
      if (e.sha256) { const t = document.createElement("span"); t.className = "packBadge"; t.textContent = "sha256 " + e.sha256.slice(0, 8); badges.append(t); }
      if (e.bytes && st.hit && st.hit.bytes && st.hit.bytes !== e.bytes) {
        const t = document.createElement("span"); t.className = "packBadge"; t.textContent = tr("catalogStateOther"); badges.append(t);
      }
      card.append(badges);

      /* 🔎 中身（目録に書かれていること＝入れる前に確かめられること） */
      const det = document.createElement("details");
      det.append(Object.assign(document.createElement("summary"), { textContent: tr("catalogDetails") }));
      const dl = document.createElement("div"); dl.className = "hint";
      dl.textContent = tr("catalogDetailsLine", { file: e.file, bytes: formatBytes(e.bytes), sha: e.sha256 || "—" });
      det.append(dl);
      for (const f of e.fonts) {
        const line = document.createElement("div"); line.className = "hint";
        line.textContent = tr("catalogFontLine", { family: f.family, license: f.license || "—", file: f.file || "—" });
        det.append(line);
      }
      if (e.url) det.append(core().safeLink ? core().safeLink("", e.url) : Object.assign(document.createElement("div"), { textContent: e.url }));
      card.append(det);

      const acts = document.createElement("div"); acts.className = "miniActions";
      /* 入れる（未導入のとき） */
      if (!st.hit) {
        const label = document.createElement("label"); label.className = "fileBtn small";
        const input = document.createElement("input");
        input.type = "file"; input.accept = ".stpack"; input.hidden = true;
        const span = document.createElement("span"); span.textContent = tr("catalogPick");
        label.append(input, span);
        input.addEventListener("change", () => { const f = input.files && input.files[0]; if (f) installFromCatalog(e, f); input.value = ""; });
        acts.append(label);
      } else {
        /* 使う／外す（入っているとき） */
        const use = document.createElement("button"); use.type = "button";
        use.textContent = tr(st.hit.active ? "catalogInUse" : "catalogUse"); use.disabled = !!st.hit.active;
        use.addEventListener("click", async () => {
          const api = window.Trk.custom;
          if (!api || typeof api.activatePack !== "function") return;
          await api.activatePack(st.hit.id);
          await refreshInstalled(); render();
        });
        acts.append(use);
        const del = document.createElement("button"); del.type = "button"; del.textContent = tr("catalogRemove");
        del.addEventListener("click", async () => {
          const api = window.Trk.custom;
          if (!api || typeof api.deletePackById !== "function") return;
          if (await api.deletePackById(st.hit.id)) { await refreshInstalled(); render(); }
        });
        acts.append(del);
      }
      card.append(acts);
      const note = document.createElement("div"); note.className = "hint"; note.dataset.for = e.id; card.append(note);
      list.append(card);
    }
  }

  function core() { return (window.Trk && window.Trk.core) || {}; }
  function setRowNote(entry, text, bad) {
    const list = $("catalogList"); if (!list) return;
    const node = list.querySelector(`[data-for="${CSS.escape(entry.id)}"]`);
    if (node) { node.textContent = text; node.style.color = bad ? "var(--don)" : ""; }
  }
  function setSummary(text, bad) {
    const sum = $("catalogSummary");
    if (!sum) return;
    sum.textContent = text; sum.style.color = bad ? "var(--don)" : "";
  }

  /* 1件を照合して入れる。戻り値：入れたら true */
  async function installFromCatalog(entry, file, opts = {}) {
    const c = core();
    const check = checkAgainstEntry(entry, file);
    if (!check.ok) {
      if (check.reason === "sizeMismatch") {
        setRowNote(entry, tr("catalogSizeBad", { want: formatBytes(check.want), got: formatBytes(check.got) }), true);
        return false;
      }
      if (check.reason === "nameMismatch" && !opts.silent && !confirm(tr("catalogNameBad", { want: entry.file, got: file.name }))) return false;
    }
    if (entry.sha256) {
      const got = await sha256Hex(file);
      if (got == null) setRowNote(entry, tr("catalogNoHash"), false);
      else if (got !== entry.sha256) { setRowNote(entry, tr("catalogHashBad"), true); return false; }
      else setRowNote(entry, tr("catalogHashOk"), false);
    }
    const install = window.Trk.custom && window.Trk.custom.installPackFile;
    if (!install) { if (c.setStatus) c.setStatus("packStatus", "packUnsupported"); return false; }
    const r = await install(file);
    if (r) setRowNote(entry, tr("catalogInstalled", { name: entry.name }), false);
    return !!r;
  }

  /* 📥 trk231：目録＋パックをまとめて入れる（選んだファイルを名前で突き合わせる） */
  async function importBundle(files) {
    const c = core();
    const all = [...(files || [])];
    const json = all.find(f => /\.json$/i.test(f.name));
    const packs = all.filter(f => /\.stpack$/i.test(f.name));
    if (!json) { if (c.setStatus) c.setStatus("catalogStatus", "catalogBundleNoJson"); return; }
    await loadCatalogFile(json, { quiet: true });
    if (!current) return;
    await refreshInstalled(); render();
    if (!packs.length) { if (c.setStatus) c.setStatus("catalogStatus", "catalogBundleNoPack"); return; }
    let ok = 0, bad = 0, miss = 0;
    for (const file of packs) {
      const base = file.name.split("/").pop().toLowerCase();
      const entry = current.packs.find(e => e.file.split("/").pop().toLowerCase() === base);
      if (!entry) { miss++; continue; }
      if (installed.some(rec => samePack(entry, rec))) { ok++; setRowNote(entry, tr("catalogAlreadyIn"), false); continue; }
      const done = await installFromCatalog(entry, file, { silent: true });
      if (done) ok++; else bad++;
    }
    await refreshInstalled(); render();
    setSummary(tr("catalogBundleDone", { ok, bad, miss }), bad > 0);
    if (c.setStatus) c.setStatus("catalogStatus", bad || miss ? "catalogBundleSome" : "catalogBundleAll", { ok, bad, miss });
  }

  async function loadCatalogFile(file, opts = {}) {
    const c = core();
    try {
      const raw = JSON.parse(await file.text());
      const cat = sanitizeCatalog(raw);
      if (!cat) { if (c.setStatus) c.setStatus("packStatus", "catalogBad"); return; }
      current = cat;
      await refreshInstalled(); render();
      if (c.setStatus) c.setStatus("packStatus", cat.packs.length ? null : "catalogEmpty");
      if (cat.dropped > 0 && c.setStatus) c.setStatus("catalogStatus", "catalogDropped", { n: cat.dropped });
    } catch (_) { if (c.setStatus) c.setStatus("packStatus", "catalogBad"); }
  }

  function init() {
    const input = $("catalogFile");
    if (input) input.addEventListener("change", () => { const f = input.files && input.files[0]; if (f) loadCatalogFile(f); input.value = ""; });
    const bundle = $("catalogBundle");
    if (bundle) bundle.addEventListener("change", () => { const fs = bundle.files ? [...bundle.files] : []; if (fs.length) importBundle(fs); bundle.value = ""; });
    /* 目録の .json ＋ .stpack を画面にまとめてドロップしても読める（目録とパックがそろえば、そのまま入れる）
       ・custom.js は「1ファイルだけ」のときに先に受け取るので、まとめて落としたときはここへ来ます */
    addEventListener("drop", e => {
      const files = e.dataTransfer && e.dataTransfer.files ? [...e.dataTransfer.files] : [];
      if (!files.some(f => /\.json$/i.test(f.name)) && files.length < 2) return;
      if (!files.some(f => /\.(json|stpack)$/i.test(f.name))) return;
      e.preventDefault(); e.stopPropagation();
      if (files.some(f => /\.json$/i.test(f.name))) importBundle(files);
    }, true);
    /* ❓謎設定の「目録を読む」を開いたら、前回の目録を出しておく（保存はしない） */
    const panel = $("packCatalogPanel");
    if (panel) panel.addEventListener("toggle", async () => { if (panel.open && current) { await refreshInstalled(); render(); } });
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  window.Trk.packCatalog.loadFile = loadCatalogFile;
})();

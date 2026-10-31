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
      licenseFile: str(f && f.licenseFile, 120),   /* 🔤 trk233：ライセンス全文のファイル名（目録に載る） */
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

  /* 📦 trk232：目録の packs[].version と、入っているパックの release を比べる
     （どちらかが無ければ「更新なし」。比べるだけなので、アプリは外へ取りに行かない） */
  function versionDiffers(entry, hit) {
    const from = str(hit && hit.release, 24), to = str(entry && entry.version, 24);
    return from && to && from !== to ? { from, to } : null;
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

  /* ---------- 📦 trk235：セット（.stlib / .zip）を、選ぶだけで入れる ----------
     倉庫の「はじめてセット」は 1 つの ZIP（中身は目録＋packs/＋font-packs/＋任意の set.json）。
     ・アプリは**利用者が選んだファイルだけ**を読む（外へ取りに行かない）。
     ・読むのは「目録の packs[].file と同じパス」。`packs/` と `font-packs/` を区別しない。
     ・入れる前に、中の実バイトで sha256 を計算して目録と比べる（合わなければ入れない）。
     ・set.json は任意（あれば名前と版を表示にだけ使う。無くても目録だけで動く）。 */
  const SET_FORMAT = "trk-set";
  /* 上限は「開く前」と「1 本ごと」の 2 段。セット 1 GiB・1 本 500 MB（倉庫と合意した値）。 */
  const SET_LIMITS = Object.freeze({ set: 1024 * 1048576, pack: 500 * 1048576, catalog: 8 * 1048576, entries: 5000 });
  const SET_EXTS = /\.(stlib|zip)$/i;
  const zipIO = () => (window.Trk && window.Trk.zipIO) || null;

  /* 先頭の署名で「ZIP か」を見る（拡張子は信じない。OS によっては .stlib の関連付けが無い） */
  async function looksLikeZip(file) {
    if (!file || typeof file.slice !== "function" || !(Number(file.size) >= 4)) return false;
    try {
      const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
      if (head.length < 4 || head[0] !== 0x50 || head[1] !== 0x4b) return false;
      return (head[2] === 3 && head[3] === 4) || (head[2] === 5 && head[3] === 6) || (head[2] === 7 && head[3] === 8);
    } catch (_) { return false; }
  }

  /* ZIP を読むときの失敗を、画面に出す形（i18n のキー）へ寄せる */
  function setErrorKey(err) {
    const key = err && err.key;
    if (key === "zipEncrypted") return "catalogSetEncrypted";
    if (key === "zipMethod") return "catalogSetMethod";
    if (key === "zipLimit" || key === "zipTooBig") return "catalogSetTooBig";
    if (key === "zipCorrupt") return "catalogSetCorrupt";
    return "catalogSetBad";
  }

  /* set.json（任意）。形が合わない・読めないときは null（＝目録だけで動く） */
  function sanitizeSetInfo(raw) {
    if (!raw || typeof raw !== "object" || raw.format !== SET_FORMAT) return null;
    const version = Number(raw.version);
    if (!Number.isFinite(version) || version > 1) return null;
    return {
      format: SET_FORMAT, version: 1,
      name: str(raw.name, 80),
      release: str(raw.release, 24) || str(raw.rev, 24),
      note: str(raw.note, 400),
      packs: (Array.isArray(raw.packs) ? raw.packs : []).slice(0, MAX_PACKS).map(p => str(p, 160)),
    };
  }

  /* セットを開いて、目録と（あれば）set.json を読む。パックの中身はまだ展開しない。
     戻り値： { ok:true, zip, prefix, catalog, info, name, release } ／ { ok:false, reason, vars } */
  async function openSet(file) {
    const Z = zipIO();
    if (!Z || typeof Z.zipOpen !== "function") return { ok:false, reason:"catalogSetNoZip" };
    const size = Number(file && file.size);
    if (!Number.isFinite(size) || size <= 0) return { ok:false, reason:"catalogSetBad" };
    if (size > SET_LIMITS.set) return { ok:false, reason:"catalogSetTooBig", vars:{ max:formatBytes(SET_LIMITS.set) } };
    if (!(await looksLikeZip(file))) return { ok:false, reason:"catalogSetNotZip" };
    let zip;
    try { zip = await Z.zipOpen(file); } catch (e) { return { ok:false, reason:setErrorKey(e) }; }
    if (!zip || !Array.isArray(zip.entries)) return { ok:false, reason:"catalogSetBad" };
    if (zip.entries.length > SET_LIMITS.entries) return { ok:false, reason:"catalogSetTooMany" };
    /* 目録の候補：根の catalog/index.json、または 1 段だけ包まれた <フォルダ>/catalog/index.json
       （展開したフォルダをそのまま再圧縮した .zip 対策。2 段以上は「どれか分からない」で止める） */
    let catEntry = zip.byName.get("catalog/index.json") || null, prefix = "";
    if (!catEntry) {
      const nested = zip.entries.filter(e => /^[^/]+\/catalog\/index\.json$/.test(e.name));
      if (nested.length > 1) return { ok:false, reason:"catalogSetAmbiguous" };
      if (!nested.length) return { ok:false, reason:"catalogSetNoCatalog" };
      catEntry = nested[0];
      prefix = catEntry.name.slice(0, -"catalog/index.json".length);
    }
    let catalog = null;
    try {
      const text = await (await Z.zipEntryBlob(zip, catEntry, SET_LIMITS.catalog, true)).text();
      catalog = sanitizeCatalog(JSON.parse(text));
    } catch (e) { return { ok:false, reason: e && e.key ? setErrorKey(e) : "catalogBad" }; }
    if (!catalog) return { ok:false, reason:"catalogBad" };
    /* set.json は任意。壊れていても止めない（名前と版が出せないだけ） */
    let info = null;
    const setEntry = zip.byName.get(prefix + "set.json") || zip.byName.get("set.json");
    if (setEntry) {
      try { info = sanitizeSetInfo(JSON.parse(await (await Z.zipEntryBlob(zip, setEntry, SET_LIMITS.catalog, true)).text())); }
      catch (_) { info = null; }
    }
    return {
      ok:true, zip, prefix, catalog, info,
      name: (info && info.name) || catalog.name, release: (info && info.release) || "",
    };
  }

  /* 目録と中の1本が合うか（中を展開せずに分かること＝大きさと上限） */
  function setEntryCheck(entry, zipEntry) {
    if (!entry || !zipEntry) return { ok:false, reason:"missing" };
    const got = Number(zipEntry.usize) || 0;
    const want = Number(entry.bytes) || 0;
    if (got > SET_LIMITS.pack) return { ok:false, reason:"tooBig", got };
    if (want > 0 && got !== want) return { ok:false, reason:"sizeMismatch", want, got };
    return { ok:true, reason:"" };
  }

  /* 入れる前に、何が入るかを数える（読むのは目録と中央目録だけ） */
  function planSet(opened) {
    const plan = { packs:[], missing:[], bytes:0 };
    if (!opened || !opened.ok || !opened.catalog) return plan;
    for (const entry of opened.catalog.packs) {
      const zipEntry = opened.zip.byName.get(opened.prefix + entry.file);
      if (!zipEntry) { plan.missing.push(entry); continue; }
      plan.packs.push({ entry, zipEntry });
      plan.bytes += Number(entry.bytes) || Number(zipEntry.usize) || 0;
    }
    return plan;
  }

  window.Trk = window.Trk || {};
  window.Trk.packCatalog = Object.assign(window.Trk.packCatalog || {}, {
    CATALOG_FORMAT, CATALOG_VERSION, sanitizeCatalog, sanitizeCatalogEntry,
    checkAgainstEntry, formatBytes, samePackAs, packKey, sha256Hex, versionDiffers,
    /* 📦 trk235：セット（.stlib / .zip） */
    SET_FORMAT, SET_LIMITS, SET_EXTS, looksLikeZip, sanitizeSetInfo, openSet, setEntryCheck, planSet,
  });

  /* ---------- 画面（設定 → 📦 カスタムパック → 📚 目録から入れる） ---------- */
  const $ = id => document.getElementById(id);
  let current = null;            /* 読み込んだ目録 */
  let installed = [];            /* 入っているパック（window.Trk.custom.listInstalledPacks） */
  const samePack = samePackAs;
  /* 📦 trk232：目録の version と、入っているパックの release が違えば「更新あり」 */
  const stateOf = entry => {
    const hit = installed.find(rec => samePack(entry, rec));
    if (!hit) return { key:"catalogStateNew", hit:null };
    const diff = versionDiffers(entry, hit);
    if (diff) return { key:"catalogStateUpdate", hit, update:true, vars:diff };
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
    const hits = current.packs.map(e => installed.find(rec => samePack(e, rec))).filter(Boolean);
    if (sum) {
      const total = current.packs.length;
      const n = hits.length;
      const newer = current.packs.filter(e => stateOf(e).update).length;
      const bytes = current.packs.reduce((a, e) => a + (Number(e.bytes) || 0), 0);
      sum.textContent = total ? tr(n ? "catalogLoadedInstalled" : "catalogLoaded", { n: total, name: current.name, have: n }) : tr("catalogEmpty");
      if (newer) sum.textContent += " " + tr("catalogUpdates", { n: newer });
      /* 💾 trk234：目録の合計（落とす前に、どのくらいの容量か分かるように） */
      if (total && bytes) sum.textContent += " · " + tr("catalogTotalBytes", { size: formatBytes(bytes) });
    }
    /* 💾 trk234：この目録のぶんが入っているときだけ「まとめて消す」を出す */
    {
      const bulk = $("catalogBulkActions"), bulkBtn = $("catalogRemoveAll");
      if (bulk) bulk.hidden = !hits.length;
      if (bulkBtn && hits.length) {
        const hitBytes = hits.reduce((a, h) => a + (Number(h.bytes) || 0), 0);
        bulkBtn.textContent = tr("catalogRemoveAllLabel", { n: hits.length, size: formatBytes(hitBytes) });
        bulkBtn.dataset.count = String(hits.length);
      }
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
      stateBadge.className = "packBadge"; stateBadge.textContent = tr(st.key, st.vars); badges.append(stateBadge);
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
        if (f.licenseFile) {
          const lic = document.createElement("div"); lic.className = "hint";
          lic.textContent = tr("catalogLicenseFile", { file: f.licenseFile });
          det.append(lic);
        }
      }
      if (e.url) det.append(core().safeLink ? core().safeLink("", e.url) : Object.assign(document.createElement("div"), { textContent: e.url }));
      card.append(det);

      const acts = document.createElement("div"); acts.className = "miniActions";
      /* 入れる（未導入のとき）／入れ直す（更新があるとき） */
      if (!st.hit || st.update) {
        const label = document.createElement("label"); label.className = "fileBtn small";
        const input = document.createElement("input");
        input.type = "file"; input.accept = ".stpack"; input.hidden = true;
        const span = document.createElement("span");
        span.textContent = st.update ? tr("catalogUpdatePick", st.vars) : tr("catalogPick");
        label.append(input, span);
        input.addEventListener("change", async () => {
          const f = input.files && input.files[0];
          if (f) { await installFromCatalog(e, f); await refreshInstalled(); render(); }
          input.value = "";
        });
        acts.append(label);
      }
      if (st.hit) {
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
  function setBulkStatus(text, bad) {
    const n = $("catalogBulkStatus");
    if (!n) return;
    n.textContent = text; n.style.color = bad ? "var(--don)" : "";
  }
  /* 💾 trk234：この目録のぶん（入っているもの）を、まとめて消す。
     ⚠ 消すのは1件ずつではなく js/custom.js の deletePacksByIds に任せる（確認1回・曲リストへの合図1回）。 */
  async function removeCatalogPacks() {
    await refreshInstalled();
    if (!current) return;
    const ids = [...new Set(current.packs.map(e => installed.find(rec => samePack(e, rec))).filter(Boolean).map(rec => rec.id))];
    if (!ids.length) { setBulkStatus(tr("catalogRemoveNone"), false); return; }
    const api = window.Trk && window.Trk.custom;
    if (!api || typeof api.deletePacksByIds !== "function") return;
    const r = await api.deletePacksByIds(ids);
    await refreshInstalled(); render();
    if (r && !r.cancelled && r.ok) setBulkStatus(tr("catalogRemoveDone", { n:r.ok, size:formatBytes(r.bytes) }), !!r.bad);
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

  /* 📦 trk235：セットの中の1本を、照合してから入れる。戻り値：入れたら true */
  async function installSetEntry(opened, item) {
    const Z = zipIO(), c = core();
    const entry = item.entry, zipEntry = item.zipEntry;
    const check = setEntryCheck(entry, zipEntry);
    if (!check.ok) {
      if (check.reason === "sizeMismatch") setRowNote(entry, tr("catalogSizeBad", { want:formatBytes(check.want), got:formatBytes(check.got) }), true);
      else setRowNote(entry, tr("catalogSetEntryBig", { file:entry.file, max:formatBytes(SET_LIMITS.pack) }), true);
      return false;
    }
    let blob;
    try { blob = await Z.zipEntryBlob(opened.zip, zipEntry, SET_LIMITS.pack, true); }
    catch (_) { setRowNote(entry, tr("catalogSetEntryBad", { name:entry.name }), true); return false; }
    /* 画面の一覧や installPackFile は「名前」で扱うので、目録の file の末尾を付ける */
    const packFile = namedFile(blob, String(entry.file).split("/").pop() || "pack.stpack");
    if (entry.sha256) {
      const got = await sha256Hex(packFile);
      if (got == null) setRowNote(entry, tr("catalogNoHash"), false);
      else if (got !== entry.sha256) { setRowNote(entry, tr("catalogHashBad"), true); return false; }
      else setRowNote(entry, tr("catalogHashOk"), false);
    }
    const install = window.Trk.custom && window.Trk.custom.installPackFile;
    if (!install) { if (c.setStatus) c.setStatus("packStatus", "packUnsupported"); return false; }
    const r = await install(packFile);
    if (r) { setRowNote(entry, tr("catalogInstalled", { name:entry.name }), false); return true; }
    return false;
  }

  /* Blob に名前を付ける（File が無い環境でも installPackFile に渡せるように） */
  function namedFile(blob, name) {
    try { return new File([blob], name, { type:"application/zip" }); }
    catch (_) {
      const f = blob.slice(0, blob.size, "application/zip");
      try { Object.defineProperty(f, "name", { value:name }); } catch (__) { /* 名前が付けられなくても中身で読める */ }
      return f;
    }
  }

  /* 📦 trk235：開いたセットを、一覧に出して入れる（入れる前に数と容量を出す） */
  async function applySet(opened, file) {
    const c = core();
    current = opened.catalog;          /* 一覧にも同じ目録を出す（行ごとの状態・「使う」がそのまま効く） */
    await refreshInstalled(); render();
    const plan = planSet(opened);
    const miss = plan.missing.length;
    const sumKey = opened.release ? "catalogSetSummary" : "catalogSetSummaryNoRelease";
    const vars = { name:opened.name, release:opened.release, n:plan.packs.length, size:formatBytes(plan.bytes), miss };
    setSummary(tr(sumKey, vars), miss > 0);
    for (const entry of plan.missing) setRowNote(entry, tr("catalogSetMissingNote", { file:entry.file }), true);
    if (!plan.packs.length) { if (c.setStatus) c.setStatus("catalogStatus", "catalogSetEmpty"); return true; }
    /* 入れる前に、何パック・何 MB 入るかを確かめてもらう（trk234 の容量表示と同じ考え） */
    const fresh = plan.packs.filter(p => { const hit = installed.find(rec => samePack(p.entry, rec)); return !hit || versionDiffers(p.entry, hit); });
    if (fresh.length && !confirm(tr("catalogSetConfirm", { n:fresh.length, size:formatBytes(plan.bytes) }))) {
      if (c.setStatus) c.setStatus("catalogStatus", "catalogBundleNoPack");
      return true;
    }
    let ok = 0, bad = 0, skip = 0, done = 0;
    for (const item of plan.packs) {
      done++;
      const hit = installed.find(rec => samePack(item.entry, rec));
      if (hit && !versionDiffers(item.entry, hit)) { skip++; setRowNote(item.entry, tr("catalogAlreadyIn"), false); continue; }
      if (c.setStatus) c.setStatus("catalogStatus", "catalogSetProgress", { done, n:plan.packs.length, name:item.entry.name });
      const doneOne = await installSetEntry(opened, item);
      if (doneOne) ok++; else bad++;
    }
    await refreshInstalled(); render();
    setSummary(tr("catalogSetDone", { ok, skip, bad, miss, size:formatBytes(plan.bytes) }), bad > 0 || miss > 0);
    if (c.setStatus) c.setStatus("catalogStatus", bad || miss ? "catalogSetSome" : "catalogSetAll", { ok, skip, bad, miss });
    return true;
  }

  /* 📦 trk235：セット（.stlib / .zip）を選んだときの入口 */
  async function importSetFile(file, opts = {}) {
    const c = core();
    if (!file) return false;
    if (!zipIO()) { if (c.setStatus) c.setStatus("catalogStatus", "catalogSetNoZip"); return false; }
    if (c.setStatus) c.setStatus("catalogStatus", "catalogSetOpening", { name:String(file.name || "") });
    const opened = await openSet(file);
    if (!opened.ok) {
      setSummary("", false);
      if (c.setStatus) c.setStatus("catalogStatus", opened.reason, opened.vars || {});
      return false;
    }
    return applySet(opened, file);
  }

  /* 📦 trk235：画面に落とされたファイルがセットなら、こちらで受け取る（パックの .zip は今までどおり）
     戻り値：セットとして受け取ったら true（false なら呼び側が 1 本のパックとして扱う） */
  async function tryImportSet(file) {
    if (!file || !zipIO()) return false;
    if (!SET_EXTS.test(String(file.name || ""))) return false;
    const opened = await openSet(file);
    if (!opened.ok) return false;             /* 目録が無い .zip はパックかもしれないので、黙って譲る */
    return applySet(opened, file);
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
    /* 📦 trk235：セット（.stlib / .zip）を 1 回選ぶだけで入れる */
    const setInput = $("catalogSet");
    if (setInput) setInput.addEventListener("change", () => {
      const f = setInput.files && setInput.files[0];
      if (f) importSetFile(f).catch(() => {});
      setInput.value = "";
    });
    /* 💾 trk234：この目録のぶんを、まとめて消す */
    const removeAll = $("catalogRemoveAll");
    if (removeAll) removeAll.addEventListener("click", () => { removeCatalogPacks().catch(() => {}); });
    /* 言語を変えたら、件数入りの文（目録の合計・まとめて消す）を描き直す */
    const c = core();
    if (c && typeof c.on === "function") c.on("language", () => { if (current) render(); });
    /* 目録の .json ＋ .stpack を画面にまとめてドロップしても読める（目録とパックがそろえば、そのまま入れる）
       ・custom.js は「1ファイルだけ」のときに先に受け取るので、まとめて落としたときはここへ来ます */
    addEventListener("drop", e => {
      const files = e.dataTransfer && e.dataTransfer.files ? [...e.dataTransfer.files] : [];
      /* 📦 trk235：セットを 1 つだけ落としたとき（custom.js より先に来た場合の受け皿） */
      if (files.length === 1 && SET_EXTS.test(String(files[0].name || ""))) {
        e.preventDefault(); e.stopPropagation();
        tryImportSet(files[0]).catch(() => {});
        return;
      }
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
  /* 📦 trk235：セット（.stlib / .zip）。js/custom.js のドロップ処理からも呼びます */
  window.Trk.packCatalog.importSetFile = importSetFile;
  window.Trk.packCatalog.tryImportSet = tryImportSet;
})();

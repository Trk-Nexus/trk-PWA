// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 🔤 題字の書体（利用者が導入する拡張・trk315） ============

   作品「ピクセル・コンソール」の題字（`.brand h1`）と、スキン（作品名）の一覧（`#skinGrid .skinCard b`）に、
   **利用者が自分で導入した書体ファイル**を当てる仕組みです。

   ・書体ファイルはアプリに**同梱しません**。利用者が配布元から受け取った WOFF2 を、設定欄で選んで導入します。
     外部からの自動取得・送信はしません。
   ・導入できるのは、ここに固定したハッシュ（SHA-256）と**完全に一致するファイル**だけです（版違い・別ファイルは拒否）。
   ・選んだ候補の**必要なファイルがすべて揃い、すべて読み込めたときだけ**適用します。
     一つでも欠けた・壊れた・保存できなかったときは適用せず、既存の題字のまま（部分適用はしません）。
   ・適用は `body.trk-title-font-on` を張るだけ。外すと CSS 変数も class も消え、元の見た目に戻ります。
     本文・書斎・基地・ノーツ・既存の書体パック（`--font`）・書体の組み合わせ（trk246）には触りません。
   ・選んだ設定と導入したファイルは**この端末だけ**に保存します（localStorage の `trkTitleFont`・IndexedDB の `trk-title-font`）。
     書き出し・バックアップには入りません（書体ファイルは端末に置くものだからです）。
   ・ライセンス全文は `fonts/licenses/` の固定版を、欄の中から開いて読めます。 */
(() => {
  "use strict";

  const DB_NAME = "trk-title-font", DB_VERSION = 1, STORE = "files";
  const CHOICE_KEY = "trkTitleFont";
  const CLASS_ON = "trk-title-font-on";
  const VAR = "--trk-title-font";
  const CHANNEL = "trk-title-font";
  /* 1ファイルの上限（既知の最大は 505,400 B）。これを超えるものは読み込まずに拒否する */
  const MAX_BYTES = 1048576;

  /* 候補。sha256・bytes は固定版の実ファイルの値（資料 22・26・24 と照合済み）。手で直すときは同じ版で取り直すこと。 */
  const CANDIDATES = [
    {
      id: "galmuri", recommended: true, name: "Galmuri11", coversKey: "tfCoversGalmuri",
      source: "quiple/galmuri @71e1cac dist/Galmuri11.woff2",
      sourceUrl: "https://github.com/quiple/galmuri/blob/71e1cacf1437a11220307120e63e30bc275312d4/dist/Galmuri11.woff2",
      files: [
        { key: "galmuri11", name: "Galmuri11.woff2", bytes: 505400, sha256: "8bad9322b3340bfb5cb26cb00f4752bf4c8e7d1b526bb07205f4af458eebed31", family: "TrkTitleGalmuri" }
      ],
      licences: [
        { name: "Galmuri11", holder: "Copyright (c) 2019–2025 Lee Minseo (quiple@quiple.dev)", path: "fonts/licenses/Galmuri11-OFL.txt", sha256: "86a3ee9495f942f0243f18c103da9faca27adb88142613edb8bb852e56c892c1" }
      ]
    },
    {
      id: "dotneo", recommended: false, name: "DotGothic16 ＋ NeoDunggeunmo", coversKey: "tfCoversDotNeo",
      source: "@fontsource/dotgothic16@5.3.1 ／ neodgm-webfont @e0a7156",
      sourceUrl: "https://github.com/neodgm/neodgm-webfont/blob/e0a715695c457d3f8ccd071f88cd71b376a5a23e/neodgm/neodgm.woff2",
      sourceUrl2: "https://registry.npmjs.org/@fontsource/dotgothic16/-/dotgothic16-5.3.1.tgz",
      files: [
        { key: "dotgothic16", name: "dotgothic16-japanese-400-normal.woff2", bytes: 396312, sha256: "a042e37d1a36798f5a9dee9ab81d2fc4204950ae1729b856e4d22833a61997ee", family: "TrkTitleDot" },
        { key: "neodunggeunmo", name: "neodgm.woff2", bytes: 44352, sha256: "0c0ca9cd73f692a5da5d7fb39737902aa9ea312537237779972a9d81ef0a33bf", family: "TrkTitleNeo" }
      ],
      licences: [
        { name: "DotGothic16", holder: "Copyright 2020 The DotGothic16 Project Authors", path: "fonts/licenses/DotGothic16-OFL.txt", sha256: "335d6a81ce1afcf64c8bc36334458ba3292ca6fba5d3974895b3ed84ccee530e" },
        { name: "NeoDunggeunmo", holder: "Copyright (c) 2021-2026, Eunbin Jeong (Dalgona.)（Reserved Font Name: NeoDunggeunmo）", path: "fonts/licenses/NeoDunggeunmo-LICENSE.txt", sha256: "4d3155f4caba9970c8b386064b398822c29d9181cfba07964ba7b07ccc6cca91" }
      ]
    },
    {
      id: "press", recommended: false, name: "Press Start 2P", coversKey: "tfCoversPress",
      source: "@fontsource/press-start-2p@5.3.0 latin-400-normal",
      sourceUrl: "https://registry.npmjs.org/@fontsource/press-start-2p/-/press-start-2p-5.3.0.tgz",
      files: [
        { key: "pressstart2p", name: "press-start-2p-latin-400-normal.woff2", bytes: 12512, sha256: "afec86997fdaf54af1f59358fa2c1e2a0f1d04146edad18e5cd141d0384a7548", family: "TrkTitlePress" }
      ],
      licences: [
        { name: "Press Start 2P", holder: "Copyright 2012 The Press Start 2P Project Authors (cody@zone38.net), with Reserved Font Name \"Press Start 2P\"", path: "fonts/licenses/PressStart2P-OFL.txt", sha256: "98e451fe911e5ee4a1a45359535dc30ea7df28b8d9a9cd1f741778efab1387ee" }
      ]
    }
  ];

  const byId = id => CANDIDATES.find(c => c.id === id) || null;
  const bc = (() => { try { return typeof BroadcastChannel === "function" ? new BroadcastChannel(CHANNEL) : null; } catch (_) { return null; } })();
  function notifyOthers() { try { if (bc) bc.postMessage("changed"); } catch (_) { } }
  const fileSpec = (cand, key) => (cand ? cand.files.find(f => f.key === key) || null : null);
  const t = (key, vars) => (typeof window.tr === "function" ? window.tr(key, vars) : key);

  /* 状態。status：off（使わない）／active（適用中）／missing（未導入あり）／bad（版違い・壊れている）／error（読込失敗） */
  let state = { status: "off", id: "", detail: "" };
  let liveFaces = [];
  let seq = 0;
  const listeners = [];

  function readChoice() {
    try {
      const v = localStorage.getItem(CHOICE_KEY) || "";
      return byId(v) ? v : "";
    } catch (_) { return ""; }
  }
  function writeChoice(v) {
    try { if (v) localStorage.setItem(CHOICE_KEY, v); else localStorage.removeItem(CHOICE_KEY); return true; }
    catch (_) { return false; }
  }

  async function sha256Hex(buf) {
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
  }

  /* ---- 保存（IndexedDB）。書体ファイルは端末の中だけ ---- */
  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "key" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("open"));
      req.onblocked = () => reject(new Error("blocked"));
    });
  }
  function dbRun(mode, work) {
    return openDb().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = work(tx.objectStore(STORE));
      tx.oncomplete = () => { db.close(); resolve(req ? req.result : undefined); };
      tx.onerror = () => { db.close(); reject(tx.error || new Error("tx")); };
      tx.onabort = () => { db.close(); reject(tx.error || new Error("abort")); };
    }));
  }
  const dbGet = key => dbRun("readonly", st => st.get(key));
  const dbPut = rec => dbRun("readwrite", st => st.put(rec));
  const dbDelete = key => dbRun("readwrite", st => st.delete(key));

  /* 導入済みファイルの点検：ハッシュが固定版と一致するものだけ ok */
  async function inventory(cand) {
    const out = {};
    for (const spec of cand.files) {
      let rec = null;
      try { rec = await dbGet(spec.key); } catch (_) { out[spec.key] = { state: "unavailable" }; continue; }
      if (!rec || !rec.buf) { out[spec.key] = { state: "absent" }; continue; }
      const ok = rec.sha256 === spec.sha256 && (await sha256Hex(rec.buf)) === spec.sha256;
      out[spec.key] = ok ? { state: "ok", buf: rec.buf } : { state: "bad" };
    }
    return out;
  }

  function releaseFaces() {
    for (const f of liveFaces) { try { document.fonts.delete(f); } catch (_) { } }
    liveFaces = [];
  }
  function deactivate() {
    releaseFaces();
    const body = document.body, root = document.documentElement;
    if (body) body.classList.remove(CLASS_ON);
    if (root) root.style.removeProperty(VAR);
  }
  function activate(cand, faces) {
    releaseFaces();
    for (const f of faces) { document.fonts.add(f); liveFaces.push(f); }
    const stack = cand.files.map(f => '"' + f.family + '"').concat(["var(--font)"]).join(",");
    document.documentElement.style.setProperty(VAR, stack);
    document.body.classList.add(CLASS_ON);
  }

  function setState(next) {
    state = next;
    for (const fn of listeners) { try { fn(state); } catch (_) { } }
  }

  /* 選んだ候補を読み直して適用する。古い結果は seq で捨てる（連続操作・複数の呼び出しに強くする） */
  async function refresh() {
    const my = ++seq;
    const id = readChoice();
    if (!id) { deactivate(); setState({ status: "off", id: "", detail: "" }); return state; }
    const cand = byId(id);
    let next;
    try {
      const inv = await inventory(cand);
      if (my !== seq) return state;
      const missing = cand.files.filter(f => inv[f.key].state === "absent").map(f => f.name);
      const bad = cand.files.filter(f => inv[f.key].state === "bad").map(f => f.name);
      const unavail = cand.files.some(f => inv[f.key].state === "unavailable");
      if (bad.length) next = { status: "bad", id, detail: bad.join(", ") };
      else if (unavail) next = { status: "error", id, detail: "" };
      else if (missing.length) next = { status: "missing", id, detail: missing.join(", ") };
      else {
        const faces = [];
        for (const spec of cand.files) {
          const face = new FontFace(spec.family, inv[spec.key].buf, { display: "swap" });
          await face.load();
          faces.push(face);
        }
        if (my !== seq) return state;
        activate(cand, faces);
        next = { status: "active", id, detail: "" };
      }
    } catch (_) {
      if (my !== seq) return state;
      next = { status: "error", id, detail: "" };
    }
    if (next.status !== "active") deactivate();
    setState(next);
    return state;
  }

  /* 導入：選んだファイルが固定版と一致するときだけ保存する。戻り値は結果の理由（画面の文言に使う） */
  async function importFile(candId, key, file) {
    const cand = byId(candId), spec = fileSpec(cand, key);
    if (!spec) return { ok: false, reason: "unknown" };
    if (!file || !window.crypto || !crypto.subtle) return { ok: false, reason: "crypto" };
    if (typeof file.size === "number" && file.size > MAX_BYTES) return { ok: false, reason: "size" };
    let buf;
    try { buf = await file.arrayBuffer(); } catch (_) { return { ok: false, reason: "read" }; }
    if (buf.byteLength > MAX_BYTES) return { ok: false, reason: "size" };
    const hash = await sha256Hex(buf);
    if (hash !== spec.sha256) return { ok: false, reason: "mismatch" };
    try { await dbPut({ key, sha256: hash, bytes: buf.byteLength, buf, savedAt: Date.now() }); }
    catch (_) { return { ok: false, reason: "save" }; }
    if (readChoice() === candId) await refresh();
    notifyOthers();
    return { ok: true, reason: "" };
  }

  /* 削除：その候補のファイルを1つのトランザクションで消す（途中で止まって一部だけ消えないように）。
     失敗したら保存を読み直して、いまの状態を画面に返す。選択の消去に失敗したら、その旨を報告する。 */
  async function removeCandidate(candId) {
    const cand = byId(candId);
    if (!cand) return { ok: false, reason: "unknown" };
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const st = tx.objectStore(STORE);
        for (const spec of cand.files) st.delete(spec.key);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error || new Error("tx")); };
        tx.onabort = () => { db.close(); reject(tx.error || new Error("abort")); };
      });
    } catch (_) {
      await refresh();
      return { ok: false, reason: "save" };
    }
    let reason = "";
    if (readChoice() === candId && !writeChoice("")) reason = "choice";
    await refresh();
    notifyOthers();
    return { ok: !reason, reason };
  }

  /* 候補の全ファイルが固定版どおりに揃っているか（読み込み可能かは refresh が確かめる） */
  async function ready(candId) {
    const cand = byId(candId);
    if (!cand) return false;
    const inv = await inventory(cand);
    return cand.files.every(f => inv[f.key].state === "ok");
  }

  /* 選択。新しい候補は全ファイルが揃って読めたときだけ保存する。揃わなければ以前の選択をそのまま残し、理由を返す。 */
  async function choose(v) {
    const id = byId(v) ? v : "";
    if (id && !(await ready(id))) {
      await refresh();
      return { ok: false, reason: "notReady" };
    }
    if (!writeChoice(id)) { await refresh(); return { ok: false, reason: "choice" }; }
    await refresh();
    notifyOthers();
    return { ok: true, reason: "" };
  }

  /* 別のタブでの導入・削除・選択を、このタブでも読み直す */
  if (bc) bc.onmessage = () => { refresh().catch(() => { }); };
  if (typeof window.addEventListener === "function") window.addEventListener("storage", e => { if (e.key === CHOICE_KEY || e.key === null) refresh().catch(() => { }); });

  /* ---- 設定欄 ---- */
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  const REASON_KEY = { mismatch: "tfReasonMismatch", save: "tfReasonSave", crypto: "tfReasonCrypto", read: "tfReasonRead", unknown: "tfReasonRead", size: "tfReasonSize", notReady: "tfReasonNotReady", choice: "tfReasonChoice" };
  function statusText(s) {
    if (s.status === "active") return t("tfActive", { name: (byId(s.id) || {}).name || "" });
    if (s.status === "missing") return t("tfMissing", { files: s.detail });
    if (s.status === "bad") return t("tfBad", { files: s.detail });
    if (s.status === "error") return t("tfError");
    return t("tfOffState");
  }

  async function render(container) {
    const focusId = document.activeElement && document.activeElement.id ? document.activeElement.id : "";
    container.textContent = "";
    const current = readChoice();
    const select = el("select"); select.id = "titleFontChoice";
    select.setAttribute("aria-label", t("tfLabel"));
    select.appendChild(new Option(t("tfOff"), ""));
    for (const c of CANDIDATES) select.appendChild(new Option(c.name + (c.recommended ? " " + t("tfRecommended") : ""), c.id));
    select.value = current;
    select.addEventListener("change", async () => {
      const r = await choose(select.value);
      await render(container);
      if (!r.ok) {
        const l = document.getElementById("titleFontState");
        if (l) l.textContent = t(REASON_KEY[r.reason] || "tfReasonRead") + " " + statusText(state);
      }
    });
    const row = el("label", "field"); row.appendChild(el("span", null, t("tfLabel"))); row.appendChild(select);
    container.appendChild(row);
    container.appendChild(el("div", "hint", t("tfHint")));

    const live = el("div", "hint status"); live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite");
    live.id = "titleFontState"; live.textContent = statusText(state);
    container.appendChild(live);

    for (const c of CANDIDATES) {
      const card = el("div", "titleFontCard"); card.dataset.font = c.id;
      const head = el("div", "titleFontHead");
      head.appendChild(el("b", null, c.name));
      if (c.recommended) head.appendChild(el("span", "hint", " " + t("tfRecommended")));
      card.appendChild(head);
      card.appendChild(el("div", "hint", t(c.coversKey)));
      card.appendChild(el("div", "hint", t("tfHowTo")));
      const src = el("div", "hint", t("tfSource") + "：" + c.source);
      card.appendChild(src);
      if (c.sourceUrl) { const a = el("a", "hint", t("tfOpenSource")); a.href = c.sourceUrl; a.target = "_blank"; a.rel = "noopener noreferrer"; card.appendChild(a); }
      if (c.sourceUrl2) { const a = el("a", "hint", t("tfOpenSource")); a.href = c.sourceUrl2; a.target = "_blank"; a.rel = "noopener noreferrer"; card.appendChild(a); }

      const inv = await inventory(c);
      for (const spec of c.files) {
        const rowF = el("div", "titleFontFile");
        const stateName = inv[spec.key].state;
        const label = stateName === "ok" ? t("tfFileOk") : stateName === "bad" ? t("tfFileBad") : t("tfFileAbsent");
        rowF.appendChild(el("span", null, spec.name + "（" + spec.bytes.toLocaleString("en-US") + " B・SHA-256 " + spec.sha256 + "）：" + label));
        const input = el("input"); input.type = "file"; input.accept = ".woff2,font/woff2";
        input.id = "titleFontFile-" + spec.key;
        input.setAttribute("aria-label", t("tfPick") + " " + spec.name);
        input.addEventListener("change", async () => {
          const f = input.files && input.files[0];
          if (!f) return;
          const r = await importFile(c.id, spec.key, f);
          const msg = r.ok ? t("tfImported") : t(REASON_KEY[r.reason] || "tfReasonRead");
          await render(container);
          const l = document.getElementById("titleFontState");
          if (l) l.textContent = msg + " " + statusText(state);
        });
        rowF.appendChild(input);
        card.appendChild(rowF);
      }

      const anyStored = Object.values(inv).some(v => v.state !== "absent");
      if (anyStored) {
        const del = el("button", "titleFontRemove", t("tfRemove"));
        del.type = "button";
        del.addEventListener("click", async () => {
          if (!window.confirm(t("tfRemoveConfirm", { name: c.name }))) return;
          const r = await removeCandidate(c.id);
          await render(container);
          const l = document.getElementById("titleFontState");
          if (l) l.textContent = (r.ok ? t("tfRemoved") : t("tfReasonSave")) + " " + statusText(state);
        });
        card.appendChild(del);
      }

      const lic = el("details", "titleFontLicence");
      lic.appendChild(el("summary", null, t("tfLicence")));
      for (const L of c.licences) {
        lic.appendChild(el("div", "hint", L.name + "：" + L.holder));
        const pre = el("pre", "titleFontLicenceText", t("tfLicenceLoading"));
        pre.dataset.path = L.path;
        lic.appendChild(pre);
      }
      lic.addEventListener("toggle", () => {
        if (!lic.open) return;
        for (const pre of lic.querySelectorAll("pre[data-path]")) {
          if (pre.dataset.loaded) continue;
          fetch(pre.dataset.path, { cache: "no-cache" })
            .then(r => { if (!r.ok) throw new Error("http"); return r.text(); })
            .then(txt => { pre.textContent = txt; pre.dataset.loaded = "1"; })
            .catch(() => { pre.textContent = t("tfLicenceFail"); });
        }
      });
      card.appendChild(lic);
      container.appendChild(card);
    }
    if (focusId) { const again = document.getElementById(focusId); if (again && typeof again.focus === "function") again.focus(); }
  }

  function onState() {
    const l = document.getElementById("titleFontState");
    if (l) l.textContent = statusText(state);
  }
  function mount(container) {
    if (!container) return;
    if (!listeners.includes(onState)) listeners.push(onState);
    render(container).catch(() => { container.textContent = t("tfError"); });
  }

  window.Trk = window.Trk || {};
  window.Trk.titleFont = {
    CANDIDATES, CLASS_ON, VAR, DB_NAME, CHOICE_KEY,
    sha256Hex, inventory, importFile, removeCandidate, choose, refresh, mount,
    state: () => ({ ...state }),
    readChoice
  };

  /* 起動時：選んであれば読み直す（欠けていれば何もしない）。読み込み前は題字は従来どおり */
  const boot = () => { mount(document.getElementById("titleFontPanel")); refresh().catch(() => { }); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();

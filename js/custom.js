(() => {
  const core = window.Trk.core;
// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ trk! 統合版：ノーツ設定・マスコット表示・スキン作成・パック・曲パック ============
   ※ パックの形式名 "shadow-taiko-pack" は、これまでに作られたパックとの互換のため変更していません。 */
"use strict";

/* ============ ノーツの見た目 ============ */
function syncNoteUI() {
  for (const i of [0, 1]) {
    core.$("noteColor" + i).value = core.settings.notes[i].color;
    core.$("noteShape" + i).value = core.settings.notes[i].shape;
    const d = core.$("notePrev" + i);
    d.className = `dot big ${core.settings.notes[i].shape}`; d.style.background = core.settings.notes[i].color;
  }
}
function setNotes(list, persist = true) {
  core.settings.notes = window.Trk.data.sanitizeNotes(list);
  syncNoteUI(); core.applyNoteVars(); core.updateTouchKeys();
  if (persist) core.saveUserPrefs();
}
[0, 1].forEach(i => {
  core.$("noteColor" + i).addEventListener("input", e => { const n = core.settings.notes.map(x => ({ ...x })); n[i].color = e.target.value; setNotes(n); });
  core.$("noteShape" + i).addEventListener("change", e => { const n = core.settings.notes.map(x => ({ ...x })); n[i].shape = e.target.value; setNotes(n); });
});
core.$("notePresets").addEventListener("click", e => {
  const b = e.target.closest("button[data-preset]"); if (!b) return;
  if (b.dataset.preset === "skin") {
    const s = core.skin();
    setNotes([{ color:window.Trk.data.toHex(s.game.don, window.Trk.data.NOTE_PRESETS.classic[0].color), shape:s.shapes[0] },
              { color:window.Trk.data.toHex(s.game.ka, window.Trk.data.NOTE_PRESETS.classic[1].color), shape:s.shapes[1] }]);
  } else setNotes(window.Trk.data.NOTE_PRESETS[b.dataset.preset]);
});

/* ============ マスコット設定・PCLクレジット ============ */
const PCL_URL = "https://piapro.jp/license/pcl/summary";
function updateMascotUI() {
  core.$("mascotSelect").value = core.settings.mascot;
  /* 🩷 マスコットが変わった合図。js/mmd.js・js/vrm.js は、🪶 軽量化で起動時に読み込まなかった
     3Dモデルをここで読みに行きます（モデルが既にあるときは中身を見てすぐ止まるので無駄打ちしません） */
  try { core.emit("mascot"); } catch (_) {}
  const on = core.isPclMascot(core.activeMascot());
  document.querySelectorAll(".pclCredit").forEach(n => {
    n.hidden = !on; n.textContent = "";
    if (!on) return;
    n.append(core.el("span", "", tr("pclCredit") + " "));
    if (lang !== "ja" && TEXT.ja.pclCredit) n.append(core.el("span", "", `（${TEXT.ja.pclCredit}）`), " ");   // 正文は日本語版
    const a = core.el("a", "", PCL_URL); a.href = PCL_URL; a.target = "_blank"; a.rel = "noopener noreferrer";
    n.append(a);
  });
}
core.$("mascotSelect").addEventListener("change", e => { core.settings.mascot = e.target.value; core.saveUserPrefs(); updateMascotUI(); });
on("skin", updateMascotUI);
on("language", updateMascotUI);

/* ============ スキン作成・編集 ============ */
const MAKER_COLORS = ["bg", "bg2", "panel", "text", "accent", "gold"];
const CUSTOM_SKIN_FILE_MAX = 256 * 1024;
function defFromSkin(id) {
  if (Object.prototype.hasOwnProperty.call(core.customSkinDefs, id)) return JSON.parse(JSON.stringify(core.customSkinDefs[id]));
  const s = window.Trk.data.has(window.Trk.data.SKINS, id) ? window.Trk.data.SKINS[id] : window.Trk.data.SKINS.shadow, u = s.ui;
  const font = !s.font ? "default" : /mono|consolas/i.test(s.font) ? "mono" : /serif/i.test(s.font) && !/sans/i.test(s.font) ? "serif" : "rounded";
  const g = window.Trk.data.parseGrad(u["--ui-bg"]);   // グラデーションのスキンをリミックスしたら、2色と向きをそのまま持ってくる
  return {
    name:`${s.label[lang] || s.label.en} ${tr("remix")}`.slice(0, 24),
    colors:{ bg:g ? g.from : window.Trk.data.toHex(u["--ui-bg"]), bg2:g ? g.to : "", panel:window.Trk.data.toHex(u["--ui-panel"]), text:window.Trk.data.toHex(u["--ui-text"]), accent:window.Trk.data.toHex(u["--ui-accent"]), gold:window.Trk.data.toHex(u["--ui-gold"]) },
    glow:!!s.game.glow, scanlines:!!s.game.scanlines, gradDir:g ? g.dir : "none", font, video:"mono",
    mascot:window.Trk.data.MASCOT_IDS.includes(s.mascot) ? s.mascot : "none"
  };
}
function fillSkinMaker(id) {
  const d = defFromSkin(id);
  core.$("makerName").value = d.name;
  for (const k of MAKER_COLORS) core.$("makerColor_" + k).value = d.colors[k] || d.colors.bg;   // bg2 が空のときは bg と同色で立たせておく
  core.$("makerGradDir").value = d.gradDir || "none";
  core.$("makerGlow").checked = d.glow; core.$("makerScan").checked = d.scanlines;
  core.$("makerFont").value = d.font; core.$("makerVideo").value = d.video; core.$("makerMascot").value = d.mascot;
}
function readSkinMaker() {
  const colors = {};
  for (const k of MAKER_COLORS) colors[k] = core.$("makerColor_" + k).value;
  return window.Trk.data.sanitizeSkinDef({ name:core.$("makerName").value, colors, glow:core.$("makerGlow").checked, scanlines:core.$("makerScan").checked, gradDir:core.$("makerGradDir").value,
    font:core.$("makerFont").value, video:core.$("makerVideo").value, mascot:core.$("makerMascot").value });
}
function storeCustomSkin(id, def) {
  core.customSkinDefs[id] = def; window.Trk.data.SKINS[id] = window.Trk.data.buildCustomSkin(def);
  core.saveCustomSkins(); core.buildSkinGrid(); core.applySkin(id);
}
const newSkinId = () => "custom_" + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
const skinShelf = core.$("skinShelf");
if (skinShelf) {
  skinShelf.open = core.settings.skinShelfOpen !== false;      // 前回の開閉を復元
  skinShelf.addEventListener("toggle", () => { core.settings.skinShelfOpen = skinShelf.open; core.saveUserPrefs(); });
}
core.$("skinMaker").addEventListener("toggle", () => { if (core.$("skinMaker").open) fillSkinMaker(core.settings.skin); });
core.$("makerLoadBtn").addEventListener("click", () => { fillSkinMaker(core.settings.skin); core.setStatus("makerStatus", null); });
core.$("makerSaveNewBtn").addEventListener("click", () => {
  if (Object.keys(core.customSkinDefs).length >= core.CUSTOM_SKIN_MAX) { core.setStatus("makerStatus", "skinLimit"); return; }
  const def = readSkinMaker(); if (!def) { core.setStatus("makerStatus", "skinBad"); return; }
  storeCustomSkin(newSkinId(), def); core.setStatus("makerStatus", "skinSaved");
});
core.$("makerOverwriteBtn").addEventListener("click", () => {
  if (!Object.prototype.hasOwnProperty.call(core.customSkinDefs, core.settings.skin)) { core.setStatus("makerStatus", "builtinLocked"); return; }
  const def = readSkinMaker(); if (!def) { core.setStatus("makerStatus", "skinBad"); return; }
  storeCustomSkin(core.settings.skin, def); core.setStatus("makerStatus", "skinSaved");
});
core.$("makerExportBtn").addEventListener("click", () => {
  const def = readSkinMaker(); if (!def) { core.setStatus("makerStatus", "skinBad"); return; }
  core.downloadJSON({ format:core.SKIN_FORMAT, version:1, ...def }, `${core.safeName(def.name)}.skin.json`);
  core.setStatus("makerStatus", "skinExported");
});
core.$("makerImportFile").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  if (typeof f.size !== "number" || !Number.isFinite(f.size) || f.size < 0 || f.size > CUSTOM_SKIN_FILE_MAX) {
    core.setStatus("makerStatus", "skinBad"); return;
  }
  let raw = null; try { raw = JSON.parse(await f.text()); } catch (_) {}
  const def = raw && (!raw.format || raw.format === core.SKIN_FORMAT) ? window.Trk.data.sanitizeSkinDef(raw) : null;
  if (!def) { core.setStatus("makerStatus", "skinBad"); return; }
  if (Object.keys(core.customSkinDefs).length >= core.CUSTOM_SKIN_MAX) { core.setStatus("makerStatus", "skinLimit"); return; }
  storeCustomSkin(newSkinId(), def); fillSkinMaker(core.settings.skin); core.setStatus("makerStatus", "skinImported");
});
core.$("makerDeleteBtn").addEventListener("click", () => {
  const id = core.settings.skin;
  if (!Object.prototype.hasOwnProperty.call(core.customSkinDefs, id)) { core.setStatus("makerStatus", "builtinLocked"); return; }
  if (!confirm(tr("confirmDelete"))) return;
  delete core.customSkinDefs[id]; delete window.Trk.data.SKINS[id]; core.saveCustomSkins();
  core.buildSkinGrid(); core.applySkin("shadow"); fillSkinMaker("shadow"); core.setStatus("makerStatus", "skinDeleted");
});

/* ============ ZIP（.stpack の中身） ============ */
class PackError extends Error { constructor(key, vars) { super(key); this.key = key; this.vars = vars; } }
async function readZip(blob) {
  const zipIO = window.Trk.zipIO;
  if (!zipIO) throw new PackError("packUnsupported");
  let zip;
  try { zip = await zipIO.zipOpen(blob); }
  catch (_) { throw new PackError("packBadZip"); }
  /* 中身はまだ読まず、ZIP中央ディレクトリとBlob参照だけを保持する。 */
  const files = Object.create(null);
  for (const entry of zip.entries) files[entry.name] = { method:entry.method, usize:entry.usize, zip, entry };
  return files;
}
async function inflateEntry(e, limit = 0, label = "") {
  if (!e || !e.zip || !e.entry) throw new PackError("packBadZip");
  if (limit > 0 && e.usize > limit) throw new PackError("packFileTooBig", { f:label });
  const zipIO = window.Trk.zipIO;
  if (!zipIO) throw new PackError("packUnsupported");
  if (e.method === 8 && typeof DecompressionStream === "undefined") throw new PackError("packUnsupported");
  try { return await zipIO.zipEntryBlob(e.zip, e.entry, limit > 0 ? limit : Infinity, true); }
  catch (err) {
    if (err instanceof zipIO.ZipIOError) {
      if (err.key === "zipTooBig") throw new PackError("packFileTooBig", { f:label });
      throw new PackError("packBadZip");
    }
    throw err;
  }
}
async function writeZip(entries) {
  const zipIO = window.Trk.zipIO;
  if (!zipIO) throw new PackError("packUnsupported");
  try { return await zipIO.zipWrite(entries); }
  catch (err) {
    if (err instanceof zipIO.ZipIOError) throw new PackError("packBadZip");
    throw err;
  }
}

/* ============ pack.json の検証（決められた項目と形式だけを受け付ける） ============ */
const PACK_FORMAT = "shadow-taiko-pack", PACK_MB = 1048576, PACK_MAX = 500 * PACK_MB, PACK_STORE_MAX = 1024 * PACK_MB, PACK_SONG_MAX = 50;
/* 容量の上限（trk137）：「容量の上限を無視」がオンなら、パックの上限（1件・合計）を外す。ブラウザの空き容量は別。 */
const packCap = (max) => (core.storageLimitsIgnored() ? Infinity : max);
const IMG_EXT = ["png", "webp", "jpg", "jpeg"], SND_EXT = ["wav", "mp3", "ogg", "m4a"];
const SONG_EXT = ["mp3", "m4a", "ogg", "oga", "opus", "wav", "flac", "aac", "mp4", "webm"];
/* 🔤 trk232：書体パック。同梱する書体は woff2（と woff）だけ。family は trk-Avatar-Library の契約と揃える
   （英数字と空白・. _ - の 40 文字まで）＝ 目録の検査を通ったパックが、そのままアプリでも通る */
const FONT_EXT = ["woff2", "woff"], FONT_FAMILY = /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,39}$/, PACK_FONT_MAX = 8;
/* 書体のライセンス全文（trk233）。trk-Avatar-Library の verify-pack と同じ .txt／.md だけ */
const LICENSE_EXT = ["txt", "md"];
/* 🔤 trk233：書体のライセンス全文（licenseFile）も、パックに入っているなら保存する（256KB まで） */
const PACK_LIMIT = { image:4, bg:8, sound:5, vrm:200, vrma:30, audio:250, chart:2, font:16, license:0.25 };
const MIME = { png:"image/png", webp:"image/webp", jpg:"image/jpeg", jpeg:"image/jpeg", wav:"audio/wav", mp3:"audio/mpeg",
  ogg:"audio/ogg", oga:"audio/ogg", opus:"audio/ogg", m4a:"audio/mp4", aac:"audio/aac", flac:"audio/flac", mp4:"video/mp4",
  webm:"video/webm", vrm:"model/gltf-binary", vrma:"model/gltf-binary", json:"application/json",
  woff2:"font/woff2", woff:"font/woff", txt:"text/plain", md:"text/markdown;charset=utf-8" };
const PATH_RE = /^[A-Za-z0-9_\-./]{1,120}$/;
const safePath = (p, exts) => typeof p === "string" && PATH_RE.test(p) && !p.includes("..") && !p.startsWith("/") && exts.includes(core.extOf(p)) ? p : null;
const pstr = (v, n) => typeof v === "string" ? v.trim().slice(0, n) : "";
function langText(o, n) {
  if (typeof o === "string") return o.trim() ? { en:pstr(o, n) } : null;
  if (!o || typeof o !== "object") return null;
  const r = {}; for (const l of ["ja", "en", "zh", "ko"]) if (typeof o[l] === "string" && o[l].trim()) r[l] = pstr(o[l], n);
  return Object.keys(r).length ? r : null;
}
function sanitizeSong(r, i) {
  if (!r || typeof r !== "object") return null;
  const audio = safePath(r.audio, SONG_EXT); if (!audio) return null;
  const s = {
    id: typeof r.id === "string" && /^[A-Za-z0-9_-]{1,32}$/.test(r.id) ? r.id : `s${i + 1}`,
    title: pstr(r.title, 80) || core.baseName(audio.split("/").pop()),
    artist: pstr(r.artist, 60), charter: pstr(r.charter, 40), license: pstr(r.license, 400), audio
  };
  const bg = safePath(r.background, IMG_EXT); if (bg) s.background = bg;
  const bpm = core.num(r.bpm, 60, 300, 0); if (bpm) s.bpm = bpm;
  if (typeof r.offset === "number" && isFinite(r.offset)) s.offset = Math.max(-5000, Math.min(5000, r.offset));
  if (typeof r.previewStart === "number" && isFinite(r.previewStart) && r.previewStart >= 0) s.previewStart = Math.min(36000, r.previewStart);
  if (r.charts && typeof r.charts === "object") {
    const c = {}; for (const d of window.Trk.data.DIFF_IDS) { const p = safePath(r.charts[d], ["json"]); if (p) c[d] = p; }
    if (Object.keys(c).length) s.charts = c;
  }
  return s;
}
function sanitizeCreditPerson(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = pstr(raw.name, 60); if (!name) return null;
  const person = { name };
  const role = langText(raw.role, 80); if (role) person.role = role;
  const rights = langText(raw.rights, 240); if (rights) person.rights = rights;
  const license = pstr(raw.license, 200); if (license) person.license = license;
  const handle = pstr(raw.handle, 80); if (handle) person.handle = handle;
  const url = pstr(raw.url, 200); if (/^https:\/\/[^\s"'<>]+$/.test(url)) person.url = url;
  return person;
}
function sanitizeCreditCard(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = pstr(raw.name, 60); if (!name) return null;
  const card = { version:1, name };
  const role = langText(raw.role, 80); if (role) card.role = role;
  const tagline = langText(raw.tagline, 160); if (tagline) card.tagline = tagline;
  const rights = langText(raw.rights, 240); if (rights) card.rights = rights;
  const license = pstr(raw.license, 200); if (license) card.license = license;
  const handle = pstr(raw.handle, 80); if (handle) card.handle = handle;
  const url = pstr(raw.url, 200); if (/^https:\/\/[^\s"'<>]+$/.test(url)) card.url = url;
  const contributors = (Array.isArray(raw.contributors) ? raw.contributors : []).slice(0, 12)
    .map(sanitizeCreditPerson).filter(Boolean);
  if (contributors.length) card.contributors = contributors;
  return card;
}
function sanitizeManifest(raw) {
  if (!raw || typeof raw !== "object" || raw.format !== PACK_FORMAT) return null;
  const name = pstr(raw.name, 40); if (!name) return null;
  const url = pstr(raw.url, 200);
  const m = { format:PACK_FORMAT, version:1, name, author:pstr(raw.author, 40), description:pstr(raw.description, 200),
              license:pstr(raw.license, 400), url:/^https:\/\/[^\s"'<>]+$/.test(url) ? url : "" };
  const creditCard = sanitizeCreditCard(raw.creditCard); if (creditCard) m.creditCard = creditCard;
  /* 📦 trk232：配る版（release）。目録の packs[].version と突き合わせて「更新あり」を出すのに使う */
  const release = pstr(raw.release, 20);
  if (/^\d{1,4}\.\d{1,4}(\.\d{1,4})?([-+][0-9A-Za-z.-]{1,12})?$/.test(release)) m.release = release;
  if (raw.skin && typeof raw.skin === "object") { const d = window.Trk.data.sanitizeSkinDef({ ...raw.skin, name }); if (d) m.skin = d; }
  /* 🔤 trk232：同梱する書体。family・file・license がそろっているものだけ受け付ける
     （file は .woff2／.woff・重複は family＋weight＋style で1つに） */
  if (Array.isArray(raw.fonts)) {
    const fonts = [], seen = new Set();
    for (const r of raw.fonts.slice(0, PACK_FONT_MAX)) {
      if (!r || typeof r !== "object") continue;
      const family = typeof r.family === "string" ? r.family.trim() : "";
      const file = safePath(r.file, FONT_EXT), license = pstr(r.license, 60);
      if (!FONT_FAMILY.test(family) || !file || !license) continue;
      const w = typeof r.weight === "number" && isFinite(r.weight) ? Math.min(900, Math.max(100, Math.round(r.weight / 100) * 100)) : 400;
      const style = r.style === "italic" ? "italic" : "";
      const key = `${family.toLowerCase()}|${w}|${style}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const f = { family, file, license, weight:w };
      if (style) f.style = style;
      /* 🔤 trk233：ライセンス全文（任意）。パックの中の .txt／.md だけ（中身は入れるときに保存する） */
      const licenseFile = safePath(r.licenseFile, LICENSE_EXT);
      if (licenseFile) f.licenseFile = licenseFile;
      fonts.push(f);
    }
    if (fonts.length) m.fonts = fonts;
  }
  if (raw.notes && typeof raw.notes === "object") {
    const notes = {};
    for (const k of ["don", "ka"]) {
      const n = raw.notes[k]; if (!n || typeof n !== "object") continue;
      const o = {};
      if (typeof n.color === "string" && window.Trk.data.HEX.test(n.color)) o.color = n.color.toLowerCase();
      if (window.Trk.data.NOTE_SHAPES.includes(n.shape)) o.shape = n.shape;
      const img = safePath(n.image, IMG_EXT); if (img) o.image = img;
      if (Object.keys(o).length) notes[k] = o;
    }
    if (Object.keys(notes).length) m.notes = notes;
  }
  if (raw.sounds && typeof raw.sounds === "object") {
    const s = {}; for (const k of ["don", "ka"]) { const v = safePath(raw.sounds[k], SND_EXT); if (v) s[k] = v; }
    if (Object.keys(s).length) m.sounds = s;
  }
  if (raw.fx && typeof raw.fx.power === "number" && isFinite(raw.fx.power)) m.fx = { power:Math.min(3, Math.max(0, raw.fx.power)) };
  if (raw.mascot && typeof raw.mascot === "object") {
    const r = raw.mascot, o = {}, caps = {};
    const vrmPath = safePath(r.vrm, ["vrm"]), motion = safePath(r.motion, ["vrma"]);
    if (vrmPath) o.vrm = vrmPath;
    if (motion) o.motion = motion;
    const bpm = core.num(r.motionBpm, 40, 300, 0); if (bpm) o.motionBpm = bpm;
    if (["full", "upper", "face"].includes(r.frame)) o.frame = r.frame;
    if (typeof r.turn === "number" && isFinite(r.turn)) o.turn = Math.max(-60, Math.min(60, r.turn));
    for (const k of ["capStart", "capCombo", "capBreak"]) { const t = langText(r.captions && r.captions[k], 60); if (t) caps[k] = t; }
    if (Object.keys(caps).length) o.captions = caps;
    if (Object.keys(o).length) m.mascot = o;
  }
  if (Array.isArray(raw.songs)) {
    const songs = [], ids = new Set();
    raw.songs.slice(0, PACK_SONG_MAX).forEach((r, i) => {
      const s = sanitizeSong(r, i);
      if (s && !ids.has(s.id)) { ids.add(s.id); songs.push(s); }
    });
    if (songs.length) m.songs = songs;
  }
  return m;
}
function packIdentityFromManifest(raw) {
  const man = sanitizeManifest(raw);
  if (!man) return null;
  return { id:"p" + core.hashString(`${man.name}|${man.author}`).toString(36), man };
}
function manifestPaths(m) {
  const out = [], seen = new Set();
  /* 同じファイルを2回数えない（書体2つが同じ OFL.txt を指すことがある） */
  const push = item => { if (seen.has(item.path)) return; seen.add(item.path); out.push(item); };
  if (m.notes) for (const k of ["don", "ka"]) if (m.notes[k] && m.notes[k].image) push({ path:m.notes[k].image, kind:"image" });
  if (m.sounds) for (const k of ["don", "ka"]) if (m.sounds[k]) push({ path:m.sounds[k], kind:"sound" });
  if (m.mascot && m.mascot.vrm) push({ path:m.mascot.vrm, kind:"vrm" });
  if (m.mascot && m.mascot.motion) push({ path:m.mascot.motion, kind:"vrma" });
  for (const f of m.fonts || []) {
    push({ path:f.file, kind:"font" });   /* 🔤 同梱の書体も、他のファイルと同じく保存する */
    if (f.licenseFile) push({ path:f.licenseFile, kind:"license" });   /* 🔤 trk233：ライセンス全文も */
  }
  for (const s of m.songs || []) {
    push({ path:s.audio, kind:"audio" });
    if (s.background) push({ path:s.background, kind:"bg" });
    for (const p of Object.values(s.charts || {})) push({ path:p, kind:"chart" });
  }
  return out;
}
const hasLook = m => !!(m.skin || m.notes || m.sounds || m.fx || m.mascot || m.fonts);   /* 🔤 書体だけのパックも「使える」 */

/* ============ パックの保存・追加・適用 ============ */
/* ⚠ sizeKey/sizeOf を渡すと、合計を「index のキー（数値）だけ」で数えられる（Blob を復元しない）。
   sizeOf は「size を持たない古いレコード」の移行と、件数が食い違ったときの数え直しに使う。 */
const packDB = core.idbStore("shadow_taiko_packs", "packs", { sizeKey:"size", sizeOf:packRecordBytes });
const packRuntime = { id:null, captions:null, noteImages:[null, null], urls:[], skinId:null, hadSounds:false, fontFaces:[] };
/* 🔤 trk232：パックが持ち込んだ書体（FontFace）。
   ・読めた書体だけを使う（読めないものは数えて知らせる。パック自体は使える）
   ・--font の先頭に置くのは core.applySkin（下の window.Trk.packFont.forSkin を呼ぶ）
   ・外すときは document.fonts.delete ＋ objectURL の後片付け（packRuntime.urls は従来どおり） */
async function registerPackFonts(fonts, files) {
  const list = Array.isArray(fonts) ? fonts : [];
  const faces = [];
  if (!list.length) return { faces, failed:0 };
  if (typeof FontFace !== "function" || !document.fonts) return { faces, failed:list.length };   /* 書体APIが無い環境 */
  let failed = 0;
  for (const f of list) {
    const blob = files && files[f.file];
    if (!blob) { failed++; continue; }
    const url = URL.createObjectURL(blob);
    try {
      const face = new FontFace(f.family, `url(${url})`, { weight:String(f.weight || 400), style:f.style || "normal", display:"swap" });
      await face.load();
      document.fonts.add(face);
      packRuntime.urls.push(url); packRuntime.fontFaces.push(face); faces.push(face);
    } catch (_) { URL.revokeObjectURL(url); failed++; }
  }
  return { faces, failed };
}
function clearPackFonts() {
  for (const face of packRuntime.fontFaces) { try { document.fonts.delete(face); } catch (_) {} }
  packRuntime.fontFaces = [];
}
function packFontFamilies() {
  const out = [];
  for (const face of packRuntime.fontFaces) if (!out.includes(face.family)) out.push(face.family);
  return out;
}
/* core.applySkin から呼ばれる入口。パックのスキンを使っているとき（またはスキンを持たない書体パックのとき）だけ返す */
window.Trk.packFont = {
  forSkin(id) {
    if (!packRuntime.fontFaces.length) return "";
    if (packRuntime.skinId && packRuntime.skinId !== id) return "";
    return packFontFamilies().map(f => `"${f}"`).join(",");
  },
  count() { return packRuntime.fontFaces.length; },
  families: packFontFamilies,
};
const noteImage = lane => { const im = packRuntime.noteImages[lane]; return im && im.complete && im.naturalWidth ? im : null; };
function packRecordBytes(record) {
  if (!record || typeof record !== "object") return 0;
  /* 新しいレコードは合計を size に持っているので、それを優先する（files を数え直さない） */
  if (Number.isFinite(record.size) && record.size >= 0) return record.size;
  const files = record.files;
  if (!files || typeof files !== "object") return 0;
  return Object.keys(files).reduce((sum, key) => {
    const file = files[key];
    return sum + (file && Number.isFinite(file.size) && file.size > 0 ? file.size : 0);
  }, 0);
}
/* 集計値（{ stored, replacing }）から、保存後の見込み合計を出す。
   同じ名前・作者のパックを更新するときは、置き換える前の分を差し引く。 */
function packProjected(stats, incoming) { return stats.stored - stats.replacing + incoming; }

/* ---------- 💾 trk234：容量の見える化と「まとめて消す」の計算（DOM を触らない） ---------- */
/* バイト数を読みやすい単位へ（1024 進・小数1桁。1GiB 以上は2桁）。
   ⚠ 数値でない・負の値は 0 B にする（記録が壊れていても画面を壊さない）。 */
function packSizeText(bytes) {
  const v = Number(bytes);
  if (!Number.isFinite(v) || v <= 0) return "0 B";
  if (v < 1024) return `${Math.round(v)} B`;
  if (v < 1048576) return `${(v / 1024).toFixed(1)} KB`;
  if (v < 1073741824) return `${(v / 1048576).toFixed(1)} MB`;
  return `${(v / 1073741824).toFixed(2)} GB`;
}
/* 1件の大きさ。保存したレコードは size、一覧の控え（listInstalledPacks）は bytes を持つ。
   どちらも無い古いレコードは files から数え直す。 */
function packRecordSize(record) {
  if (!record || typeof record !== "object") return 0;
  if (Number.isFinite(record.size) && record.size >= 0) return record.size;
  if (Number.isFinite(record.bytes) && record.bytes >= 0) return record.bytes;
  return packRecordBytes(record);
}
/* 入っているパックの集計。
   recs は { id, name, size|bytes, active } を持つ配列（packDB.all() のレコードでも listInstalledPacks の控えでもよい）。
   cap は合計の上限（バイト）。上限なし（Infinity）なら pct は 0 で capped=false。 */
function packUsageInfo(recs, cap, top) {
  const list = (Array.isArray(recs) ? recs : []).filter(r => r && typeof r === "object");
  const items = [];
  let total = 0, unusedCount = 0, unusedBytes = 0;
  for (const r of list) {
    const bytes = packRecordSize(r), active = r.active === true;
    total += bytes;
    if (!active) { unusedCount++; unusedBytes += bytes; }
    items.push({ id: typeof r.id === "string" ? r.id : "", name: String(r.name || ""), bytes, active });
  }
  const limit = Number.isFinite(cap) && cap > 0 ? cap : 0;
  const pct = limit ? Math.min(100, Math.round((total / limit) * 100)) : 0;
  const want = Number.isFinite(top) ? Math.max(0, Math.floor(top)) : 3;
  const heaviest = items.slice().sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name)).slice(0, want);
  return { count: list.length, total, cap: limit, capped: limit > 0, pct, unused: { count: unusedCount, bytes: unusedBytes }, heaviest };
}
/* まとめて消すときに、実際に消せるものだけを選び直す（画面の選択が古くても安全に）。
   activeIds ＝ いま使っているパック。消す前に外す必要がある。 */
function packDeletePlan(recs, ids) {
  const want = [...new Set((Array.isArray(ids) ? ids : []).map(v => (typeof v === "string" ? v : "")).filter(Boolean))];
  const known = new Map();
  for (const r of Array.isArray(recs) ? recs : []) if (r && typeof r.id === "string") known.set(r.id, r);
  const picked = [], activeIds = [];
  let bytes = 0;
  for (const id of want) {
    const r = known.get(id);
    if (!r) continue;
    picked.push(id);
    bytes += packRecordSize(r);
    if (r.active === true) activeIds.push(id);
  }
  return { ids: picked, count: picked.length, bytes, activeIds, missing: want.length - picked.length };
}
/* ---------- 💾 trk234：ここまで計算（この下は画面） ---------- */
/* 容量チェック。合計は index のキーだけで数えるので、レコード本体（Blob）を復元しない。
   ⚠ 「size を持たないレコードがある」ときは idbStore 側が自動で全件を数え直す（過小計上＝上限の素通しを防ぐ）。 */
async function checkPackStorageCapacity(id, incoming) {
  let stats, prev;
  try { stats = await packDB.usage(); }
  catch (_) { throw new PackError("packStorageCheckFailed"); }
  try { prev = await packDB.get(id); } catch (_) { prev = null; }   /* 置き換えられる分（1件だけ読む） */
  const replacing = prev ? packRecordBytes(prev) : 0;
  if (packProjected({ stored:stats.stored, replacing }, incoming) > packCap(PACK_STORE_MAX)) {
    throw new PackError("packStoreLimit", { max:PACK_STORE_MAX / PACK_MB });
  }
  try {
    const storage = typeof navigator !== "undefined" && navigator.storage;
    if (storage && typeof storage.estimate === "function") {
      const estimate = await storage.estimate();
      if (Number.isFinite(estimate.quota) && Number.isFinite(estimate.usage)) {
        const available = Math.max(0, estimate.quota - estimate.usage) + replacing;
        if (incoming > available) throw new PackError("packStorageQuota");
      }
    }
  } catch (e) { if (e instanceof PackError) throw e; }  // estimate() is advisory; IndexedDB remains the final authority
}

let packInstallQueue = Promise.resolve();
function installPackFile(file) {
  const task = packInstallQueue.then(() => installPackFileSerial(file));
  packInstallQueue = task.then(() => undefined, () => undefined);
  return task;
}
async function installPackFileSerial(file) {
  core.setStatus("packStatus", "packReading");
  try {
    if (file.size > packCap(PACK_MAX)) throw new PackError("packTooBig");
    const entries = await readZip(file);
    const mf = Object.keys(entries).filter(n => !n.startsWith("__MACOSX/") && /(^|\/)pack\.json$/.test(n)).sort((a, b) => a.length - b.length)[0];
    if (!mf) throw new PackError("packNoManifest");
    const root = mf.slice(0, mf.length - "pack.json".length);
    let raw = null;
    try { raw = JSON.parse(await (await inflateEntry(entries[mf], PACK_MB, mf)).text()); } catch (e) { if (e instanceof PackError) throw e; }
    const identity = packIdentityFromManifest(raw);
    if (!identity) throw new PackError("packBadManifest");
    const { id, man } = identity;
    const files = {}; let total = 0;
    for (const { path, kind } of manifestPaths(man)) {
      if (files[path]) continue;
      const ent = entries[root + path], lim = PACK_LIMIT[kind] * PACK_MB;
      if (!ent) throw new PackError("packMissingFile", { f:path });
      if (ent.usize > lim) throw new PackError("packFileTooBig", { f:path });
      const blob = await inflateEntry(ent, lim, path);   /* 🛡 展開中に上限で止める */
      if (blob.size > lim) throw new PackError("packFileTooBig", { f:path });
      total += blob.size; if (total > packCap(PACK_MAX)) throw new PackError("packTooBig");
      files[path] = new Blob([blob], { type:MIME[core.extOf(path)] || "" });
    }
    await checkPackStorageCapacity(id, total);
    const record = { id, manifest:man, files, size:total, installedAt:Date.now() };
    /* 最終的な上限判定と保存を**同じ readwrite トランザクション**で行う（複数タブ間の競合を防ぐ）。
       ここでも合計は index のキーだけで数えるので、Blob を復元せずロック時間も短い。 */
    const stored = await packDB.putIf(id, record, stats => packProjected(stats, total) <= packCap(PACK_STORE_MAX));
    if (!stored) throw new PackError("packStoreLimit", { max:PACK_STORE_MAX / PACK_MB });
    core.setStatus("packStatus", "packInstalled", { name:man.name });
    await renderPackList();
    if (man.songs) core.emit("packsChanged");
    return { id, man };
  } catch (e) {
    console.error(e);
    const quotaError = e && (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014);
    /* バージョン変更が他のタブにブロックされた（onblocked）。放置すると固まるので案内を出す */
    const blockedError = !!e && (e.message === "idb-blocked" || e.name === "BlockedError");
    core.setStatus("packStatus", e instanceof PackError ? e.key
      : blockedError ? "packDbBlocked" : quotaError ? "packStorageQuota" : "packBadZip", e && e.vars);
    return null;
  }
}
function loadImageBlob(blob) {
  return new Promise(res => {
    const url = URL.createObjectURL(blob), im = new Image();
    im.onload = () => res({ im, url }); im.onerror = () => { URL.revokeObjectURL(url); res(null); };
    im.src = url;
  });
}
function whenVrmReady(fn) {
  if (window.ShadowTaikoVRM) fn(window.ShadowTaikoVRM);
  else addEventListener("stvrm-ready", () => fn(window.ShadowTaikoVRM), { once:true });
}
/* 📦 パックが変えた設定の退避（trk130）。settings.packPrev（**保存される**）に
   「パックを当てる前の値（prev）」と「パックが実際に当てた値（applied）」を控える。外すときは、
   利用者がその間に自分で変えていない項目だけ prev へ戻す（自分で変えたなら、その変更が正）。
   ・パックを使ったまま再起動しても、退避は設定に残っているので、あとから外したときも戻せる
     （起動時に復元するパックでは退避を取り直さない＝すでにある packPrev を使う）
   ・パックAからBへ切り替えたときは上書きしない（最初に退避した prev を保つ）
     （Aを使っている間に利用者が自分で変えた項目は packRebase が prev へ取り込む）
   ・trk130より前から当てたままのパックには退避が無い（当てる前の値はもう分からない）。その場合は外したときに
     従来どおりスキンだけ shadow へ移し、ほかは今の値のまま（起動時の復元 restore:true では退避を作らない） */
function packSnapshot() {
  const s = core.settings;
  if (s.packPrev && typeof s.packPrev === "object") return;
  let skin = String(s.skin || "shadow");
  if (skin.startsWith("pack_")) {   /* すでにパックのスキンが当たっている（古い版からの引き継ぎ） */
    const boot = String(core.savedSkinAtBoot || "");
    skin = (boot && !boot.startsWith("pack_")) ? boot : "shadow";
  }
  s.packPrev = { skin, notes: JSON.parse(JSON.stringify(s.notes || [])), fxPower: s.fxPower, seEnabled: !!s.seEnabled, applied: {} };
}
function packApplied(fields) {
  const s = core.settings;
  if (!s.packPrev || typeof s.packPrev !== "object") packSnapshot();
  const p = s.packPrev; if (!p) return;
  p.applied = Object.assign({}, p.applied, fields);
}
/* 📦 パックAからBへ切り替える直前に、Aを使っている間に利用者が自分で変えた項目を「当てる前の値」へ取り込む（trk132）。
   退避（prev）を上書きしない方針のままだと、Aの中で選び直したスキンなどが、Bを外したときに「A以前の値」で上書きされる。
   変えた項目は applied からも外す＝Bが触らなければ、Bを外したときも利用者の値のまま残る。 */
function packRebase() {
  const s = core.settings, p = s.packPrev;
  if (!p || typeof p !== "object" || !p.applied || typeof p.applied !== "object") return;
  const ap = p.applied;
  if (typeof ap.skin === "string" && s.skin !== ap.skin) { p.skin = String(s.skin || p.skin); delete ap.skin; }
  if (Array.isArray(ap.notes) && JSON.stringify(s.notes) !== JSON.stringify(ap.notes)) { p.notes = JSON.parse(JSON.stringify(s.notes || p.notes)); delete ap.notes; }
  if (typeof ap.fxPower === "number" && s.fxPower !== ap.fxPower) { p.fxPower = s.fxPower; delete ap.fxPower; }
  if (ap.seEnabled === true && s.seEnabled !== true) { p.seEnabled = false; delete ap.seEnabled; }
}
/* 自分で読み込んだSE（seFiles）に戻す。切り替えの途中では呼ばない（新しいパックの読み込みと競合するため） */
function restoreOwnSounds() {
  let any = false;
  for (const i of [0, 1]) {
    window.Trk.media.seBuffers[i] = null;
    const f = window.Trk.media.seFiles && window.Trk.media.seFiles[i];
    if (f) { any = true; try { window.Trk.media.loadSE(f, i); } catch (_) {} }
  }
  return any;
}
/* 📦 パックを外したとき、パックが変えた項目だけを退避した値へ戻す（戻したら packPrev は消す） */
function packRestoreSettings() {
  const s = core.settings, prev = (s.packPrev && typeof s.packPrev === "object") ? s.packPrev : null;
  if (!prev) return false;
  const ap = (prev.applied && typeof prev.applied === "object") ? prev.applied : {};
  let changed = false;
  if (typeof ap.skin === "string" && s.skin === ap.skin && typeof prev.skin === "string") { core.applySkin(prev.skin, false); changed = true; }
  if (Array.isArray(ap.notes) && Array.isArray(prev.notes) && prev.notes.length === 2 &&
      JSON.stringify(s.notes) === JSON.stringify(ap.notes)) { setNotes(prev.notes.map(n => ({ ...n })), false); changed = true; }
  if (typeof ap.fxPower === "number" && s.fxPower === ap.fxPower && typeof prev.fxPower === "number") {
    s.fxPower = prev.fxPower; const sl = core.$("fxPower"); if (sl) sl.value = prev.fxPower;
    if (typeof showFxPower === "function") showFxPower();
    changed = true;
  }
  if (ap.seEnabled === true && s.seEnabled === true) {
    s.seEnabled = prev.seEnabled === true; const ck = core.$("seEnabled"); if (ck) ck.checked = s.seEnabled;
    core.setStatus("seStatus", s.seEnabled ? "seOn" : "seOff");
    changed = true;
  }
  delete s.packPrev;
  return changed;
}
async function activatePack(id, { restore = false, skipConfirm = false } = {}) {
  let rec = null; try { rec = await packDB.get(id); } catch (_) {}
  if (!rec || !hasLook(rec.manifest)) {
    if (restore) { core.settings.activePack = null; packRestoreSettings(); core.saveUserPrefs(); }   /* パックが消えていれば、当てた設定も戻す */
    return false;
  }
  const m = rec.manifest, f = rec.files || {};
  if (!restore && !skipConfirm && m.mascot && m.mascot.vrm && !confirm(tr("packConfirm") + (m.license || "—"))) return false;
  const prevHadSounds = packRuntime.hadSounds;   /* deactivatePack が消すので先に覚える（SEの戻し忘れ・競合よけ） */
  if (!restore) { packSnapshot(); packRebase(); }   /* パックを当てる前の値を控える（A→Bの切り替えでは上書きせず、A中に自分で変えた項目だけ取り込む） */
  deactivatePack(false);
  packRuntime.id = id;
  /* 🔤 書体パック（trk232）：スキンを当てる前に書体を読み込む（core.applySkin が --font の先頭に置ける） */
  let fontFailed = 0;
  if (m.fonts && m.fonts.length) { const r = await registerPackFonts(m.fonts, f); fontFailed = r.failed; }
  packRuntime.captions = (m.mascot && m.mascot.captions) || null;
  if (m.skin) {
    const sid = "pack_" + id, s = window.Trk.data.buildCustomSkin({ ...m.skin, mascot:m.mascot && m.mascot.vrm ? "vrm" : m.skin.mascot });
    s.custom = false; s.pack = true;
    s.label = { en:m.name }; s.desc = { ja:"📦 パック", en:"📦 Pack", zh:"📦 资源包", ko:"📦 팩" };
    window.Trk.data.SKINS[sid] = s; packRuntime.skinId = sid; core.buildSkinGrid();
    if (!restore || core.savedSkinAtBoot === sid) core.applySkin(sid);
    if (!restore) packApplied({ skin: sid });
  }
  if (m.notes) {
    if (!restore) {
      const cur = core.settings.notes;
      setNotes([0, 1].map(i => { const n = m.notes[i ? "ka" : "don"] || {}; return { color:n.color || cur[i].color, shape:n.shape || cur[i].shape }; }));
      packApplied({ notes: JSON.parse(JSON.stringify(core.settings.notes)) });
    }
    for (const i of [0, 1]) {
      const n = m.notes[i ? "ka" : "don"];
      if (n && n.image && f[n.image]) { const r = await loadImageBlob(f[n.image]); if (r) { packRuntime.noteImages[i] = r.im; packRuntime.urls.push(r.url); } }
    }
  }
  if (m.sounds) {
    for (const i of [0, 1]) {
      const p = m.sounds[i ? "ka" : "don"];
      if (p && f[p]) { try { window.Trk.media.seBuffers[i] = await window.Trk.media.decodeAudio(await f[p].arrayBuffer()); packRuntime.hadSounds = true; } catch (_) {} }
    }
    if (packRuntime.hadSounds && !restore) { core.settings.seEnabled = true; core.$("seEnabled").checked = true; core.setStatus("seStatus", "seOn"); packApplied({ seEnabled: true }); }
  }
  /* 新しいパックに音が無い（または読み込めなかった）ときは、前のパックの音を消したままにせず自分のSEへ戻す。
     切り替えの途中で deactivatePack 側が読み直すと、新しいパックの音と競合して上書きされる（trk130） */
  if (!packRuntime.hadSounds && prevHadSounds) restoreOwnSounds();
  if (m.fx && !restore) { core.settings.fxPower = m.fx.power; core.$("fxPower").value = m.fx.power; if (typeof showFxPower === "function") showFxPower(); packApplied({ fxPower: core.settings.fxPower }); }
  if (m.mascot && m.mascot.vrm && f[m.mascot.vrm]) {
    const mm = m.mascot;
    whenVrmReady(api => api.loadFromPack(f[mm.vrm], { name:m.name, motion:mm.motion ? f[mm.motion] : null,
      motionBpm:mm.motionBpm, frame:mm.frame, turn:mm.turn, select:!restore }));
  }
  /* 書体だけのパック（スキンを持たない）は、いまのスキンに書体を足す。スキンを当て直して --font を作り直す */
  if (!m.skin && packRuntime.fontFaces.length) core.applySkin(core.settings.skin, false);
  core.settings.activePack = id; core.saveUserPrefs(); updateMascotUI();
  if (!restore) core.setStatus("packStatus", "packActivated", { name:m.name });
  /* 読めなかった書体は、パックを使えたことを伝えたうえで知らせる（黙って効かないのを避ける） */
  if (!restore && fontFailed) core.setStatus("packStatus", "packFontFailed", { n:fontFailed });
  await renderPackList();
  return true;
}
function deactivatePack(persist = true) {
  if (packRuntime.id) {
    if (persist) packRestoreSettings();   /* 📦 パックが変えた設定を戻す（利用者がその間に変えた項目は戻さない）。SKINS を消す前に */
    if (packRuntime.skinId) {
      const sid = packRuntime.skinId; delete window.Trk.data.SKINS[sid];
      if (core.settings.skin === sid) {
        /* パックのスキンが消えるので別のスキンへ移す。外したとき（persist）は packRestoreSettings が先に戻している。
           ここへ来るのは①退避が無い古いデータ ②スキンを持つパックAから、スキンを持たないパックBへ切り替えたとき。
           ②で shadow へ飛ばすと、Bを外しても戻らない（applied.skin がAのままで一致しない）ので退避したスキンへ戻し、
           applied.skin を外しておく（Bはスキンを当てないので、外したときにこの値がそのまま残る）（trk132） */
        const pv = core.settings.packPrev;
        const back = (pv && typeof pv.skin === "string" && pv.skin && !pv.skin.startsWith("pack_")) ? pv.skin : "shadow";
        core.applySkin(back, false);
        if (pv && pv.applied && typeof pv.applied === "object") delete pv.applied.skin;
      }
      core.buildSkinGrid();
    }
    clearPackFonts();   /* 🔤 書体を外す（document.fonts.delete）。URL の後片付けは下の forEach */
    packRuntime.urls.forEach(u => URL.revokeObjectURL(u));
    if (packRuntime.hadSounds) {
      /* 自分で読み込んだSEがあればそれに戻す。ただしパックの切り替え中（persist=false）は読み直さない
         （新しいパックの音と競合するので、音を持たないパックを当てた側で戻す） */
      for (const i of [0, 1]) window.Trk.media.seBuffers[i] = null;
      if (persist) restoreOwnSounds();
    }
    Object.assign(packRuntime, { id:null, captions:null, noteImages:[null, null], urls:[], skinId:null, hadSounds:false });
    if (window.ShadowTaikoVRM) window.ShadowTaikoVRM.unloadPack();
  }
  if (persist) { core.settings.activePack = null; core.saveUserPrefs(); updateMascotUI(); core.setStatus("packStatus", "packDeactivated");
    core.applySkin(core.settings.skin, false); renderPackList(); }   /* 外した書体が --font に残らないように作り直す */
}
async function installAndUse(file, skipConfirm = false) {
  const r = await installPackFile(file);
  if (!r) return;
  /* 保存の固定を求める（trk136）。取り込みを待たせない・既に固定済みなら何もしない */
  if (core.requestStoragePersist) core.requestStoragePersist().then(core.renderStoragePersist).catch(() => {});
  if (r.man.songs) core.setStatus("libStatus", "packSongsAdded", { n:r.man.songs.length });
  if (hasLook(r.man)) await activatePack(r.id, { skipConfirm });
}
/* 曲リスト（library.js）に渡す、全パックの曲一覧 */
async function getPackSongs() {
  let recs = []; try { recs = await packDB.all(); } catch (_) {}
  const out = [];
  for (const r of recs) {
    for (const s of (r.manifest && r.manifest.songs) || []) {
      const f = r.files || {}; if (!f[s.audio]) continue;
      const charts = {}; for (const [d, p] of Object.entries(s.charts || {})) if (f[p]) charts[d] = f[p];
      out.push({ ...s, key:`${r.id}/${s.id}`, packId:r.id, packName:r.manifest.name,
        audioBlob:f[s.audio], bgBlob:s.background ? f[s.background] || null : null, chartBlobs:charts });
    }
  }
  return out;
}

/* ============ 書き出し：見た目パック ============ */
const PACK_README = `trk! Custom Pack (.stpack)
==========================
trk! is AGRG! — an All-Generation Rhythm Game
https://github.com/  (← 配布するときは、リポジトリのURLに書き換えてください)

[日本語]
・.stpack の中身はZIPです。いちばん上に pack.json を置いてください。
・pack.json の "format" は "shadow-taiko-pack" のままにしてください（互換のための形式名です）。
・ファイル名は半角英数字にしてください（例：notes/don.png、songs/s1/audio.mp3）。
・ノーツ画像：PNG／WebP／JPG（4MBまで）　背景画像：8MBまで
・効果音：WAV／MP3／OGG／M4A（5MBまで）
・曲：MP3／M4A／OGG／OPUS／WAV／FLAC／AAC／MP4／WebM（250MBまで）、譜面JSON（2MBまで）、1パック50曲まで
・譜面は MANUAL／TRUCK／ORBIT／STAGE／CATCH のどのモードでも共通で使われます。
・VRM：VRM 1.0 のみ（200MBまで）／モーション：.vrma（30MBまで）
・書体：WOFF2／WOFF（1書体 16MBまで・8書体まで）。pack.json の "fonts" に family・file・license を書いてください。書体のライセンス全文（OFL.txt など）もパックに入れてください（trk232 以降、アプリが書体を読み込んで使います）。
・pack.json の creditCard で、作者名・肩書き・権利メモ・利用条件を名刺のように表示できます。contributors で最大12人の共同制作者も記載できます（画像は含めません）。
・書き出したパックには、creditCard から自動生成した CREDITS.md も入ります。trk! の一覧から共有用SVG名刺をダウンロードできます。
・自分に再配布の権利がある素材・曲だけを入れてください。
・trk! の画面にドロップするだけで追加できます。

[English]
- A .stpack is a ZIP file. Put pack.json at the top level.
- Keep "format": "shadow-taiko-pack" in pack.json (legacy name kept for compatibility).
- Use ASCII file names (e.g. notes/don.png, songs/s1/audio.mp3).
- Note images: PNG/WebP/JPG (max 4 MB). Backgrounds: max 8 MB.
- Hit sounds: WAV/MP3/OGG/M4A (max 5 MB)
- Songs: MP3/M4A/OGG/OPUS/WAV/FLAC/AAC/MP4/WebM (max 250 MB), chart JSON (max 2 MB), up to 50 songs per pack
- Charts are shared by every mode: MANUAL / TRUCK / ORBIT / STAGE / CATCH.
- VRM: VRM 1.0 only (max 200 MB) / Motion: .vrma (max 30 MB)
- Fonts: WOFF2 / WOFF (max 16 MB each, up to 8). List family, file and license in "fonts" of pack.json, and include the full font license (e.g. OFL.txt) in the pack (trk232 and later load and use the fonts).
- Use optional creditCard in pack.json to show the creator, role, rights note and terms like a name card. Add up to 12 contributors for co-creators (text only; no image asset).
- Exported packs include a generated CREDITS.md; the pack list can also download a shareable SVG card.
- Only include assets and songs you have the right to redistribute.
- Drop the file onto the trk! window to install.
`;
function packToZip(man, files) {
  const entries = [{ name:"pack.json", blob:new Blob([JSON.stringify(man, null, 2)], { type:"application/json" }) },
                   { name:"README.txt", blob:new Blob([PACK_README], { type:"text/plain" }) },
                   { name:"CREDITS.md", blob:new Blob([creditCardMarkdown(man)], { type:"text/markdown;charset=utf-8" }) }];
  for (const [p, b] of Object.entries(files)) entries.push({ name:p, blob:b });
  return writeZip(entries);
}
async function buildPack() {
  const name = core.$("packName").value.trim().slice(0, 40);
  if (!name) { core.setStatus("packStatus", "packNeedName"); return; }
  const man = { format:PACK_FORMAT, version:1, name, author:core.$("packAuthor").value, description:core.$("packDesc").value,
                license:core.$("packLicense").value, url:core.$("packUrl").value.trim() };
  if (core.$("packCreditCard").checked) {
    man.creditCard = { name:core.$("packAuthor").value.trim() || name, role:core.$("packRole").value, tagline:core.$("packDesc").value,
                       license:core.$("packLicense").value, rights:core.$("packRights").value, url:core.$("packUrl").value.trim() };
  }
  /* vf（VRM／モーション）は ShadowTaikoVRM が**読み込み時に** MAX_VRM（200MB）／MAX_VRMA（30MB）を同じ `>` の形で
     弾いたものだけを持つ。ここで大きさを測り直す必要はない（trk130のレビューで確認。ファイルの権利確認だけ行う）。 */
  const files = {}, vf = window.ShadowTaikoVRM ? window.ShadowTaikoVRM.getFiles() : {};
  if (core.$("incSkin").checked) { man.skin = defFromSkin(core.settings.skin); man.fx = { power:core.settings.fxPower }; }
  if (core.$("incNotes").checked) {
    man.notes = {};
    for (const i of [0, 1]) {
      const key = i ? "ka" : "don", n = { color:core.settings.notes[i].color, shape:core.settings.notes[i].shape };
      const img = core.$(i ? "packKaImg" : "packDonImg").files[0];
      if (img) {
        const ext = core.extOf(img.name);
        if (!IMG_EXT.includes(ext) || img.size > PACK_LIMIT.image * PACK_MB) { core.setStatus("packStatus", "packImgBad"); return; }
        n.image = `notes/${key}.${ext}`; files[n.image] = img;
      }
      man.notes[key] = n;
    }
  }
  if (core.$("incSounds").checked) {
    man.sounds = {};
    for (const i of [0, 1]) {
      const sf = window.Trk.media.seFiles[i];
      if (sf && SND_EXT.includes(core.extOf(sf.name)) && sf.size <= PACK_LIMIT.sound * PACK_MB) {
        const p = `sounds/${i ? "ka" : "don"}.${core.extOf(sf.name)}`; man.sounds[i ? "ka" : "don"] = p; files[p] = sf;
      }
    }
  }
  const mascot = {};
  if (core.$("incVrm").checked && vf.vrm) {
    if (!vf.allowRedistribution && !core.$("packVrmOk").checked) { core.setStatus("packStatus", "packVrmNoRedist"); return; }
    mascot.vrm = "mascot/model.vrm"; files[mascot.vrm] = vf.vrm;
    mascot.frame = core.settings.vrmFrame; mascot.turn = core.settings.vrmTurn;
  }
  if (core.$("incMotion").checked && vf.motion) {
    mascot.motion = "mascot/motion.vrma"; files[mascot.motion] = vf.motion;
    if (core.settings.vrmMotionBpm) mascot.motionBpm = core.settings.vrmMotionBpm;
  }
  if (core.$("incCaptions").checked) {
    const caps = {};
    for (const [k, id] of [["capStart", "capStartTxt"], ["capCombo", "capComboTxt"], ["capBreak", "capBreakTxt"]]) {
      const t = core.$(id).value.trim(); if (t) caps[k] = { [lang]:t };
    }
    if (Object.keys(caps).length) mascot.captions = caps;
  }
  if (Object.keys(mascot).length) man.mascot = mascot;
  const clean = sanitizeManifest(man);
  if (!clean) { core.setStatus("packStatus", "packBadManifest"); return; }
  const out = {};
  for (const { path } of manifestPaths(clean)) if (files[path]) out[path] = files[path];
  const blob = await packToZip(clean, out), fname = `${core.safeName(name)}.stpack`;
  core.downloadBlob(blob, fname);
  core.setStatus("packStatus", "packBuilt");
  if (core.$("packInstallToo").checked) await installAndUse(new File([blob], fname), true);
}

/* ============ 書き出し：曲パック（選曲画面から） ============ */
async function buildSongPack() {
  const song = core.currentSong;
  if (!song || !core.videoReady || !song.file) { core.setStatus("spStatus", "spNoSong"); return; }
  if (!core.$("spRightsOk").checked) { core.setStatus("spStatus", "spNeedRights"); return; }
  const audioExt = SONG_EXT.includes(core.extOf(song.file.name || "")) ? core.extOf(song.file.name) : "mp3";
  if (song.file.size > PACK_LIMIT.audio * PACK_MB) { core.setStatus("spStatus", "spSongTooBig"); return; }
  const dir = "songs/s1", files = {}, charts = {};
  const bpm = Number(core.$("bpm").value), offset = Number(core.$("offset").value) || 0, seed = core.$("seed").value;
  const meta = { bpm, offset };
  if (core.$("spIncGenerated").checked && bpm >= 60 && bpm <= 300) {
    for (const d of ["easy", "normal", "hard"]) {
      const notes = window.Trk.media.generateNotes(d, bpm, offset, seed);
      if (notes.length) { charts[d] = `${dir}/${d}.json`; files[charts[d]] = new Blob([JSON.stringify(window.Trk.media.chartToData(notes, d, meta))], { type:"application/json" }); }
    }
  }
  if (core.$("spIncCurrent").checked && core.chart.length) {
    charts[core.chartDiff] = `${dir}/${core.chartDiff}.json`;
    files[charts[core.chartDiff]] = new Blob([JSON.stringify(window.Trk.media.chartToData(core.chart, core.chartDiff))], { type:"application/json" });
  }
  if (!Object.keys(charts).length) { core.setStatus("spStatus", "spNoCharts"); return; }
  let bgPath = null;
  const bgFile = core.$("spBg").files[0] || song.bgBlob || null;
  if (bgFile) {
    const ext = bgFile.name ? core.extOf(bgFile.name) : ({ "image/png":"png", "image/webp":"webp", "image/jpeg":"jpg" }[bgFile.type] || "");
    if (!IMG_EXT.includes(ext) || bgFile.size > PACK_LIMIT.bg * PACK_MB) { core.setStatus("spStatus", "spBgBad"); return; }
    bgPath = `${dir}/bg.${ext}`; files[bgPath] = bgFile;
  }
  files[`${dir}/audio.${audioExt}`] = song.file;
  const title = (song.title || core.baseName(core.mediaName)).slice(0, 80);
  const s = { id:"s1", title, artist:core.$("spArtist").value, charter:core.$("spCharter").value, license:core.$("spLicense").value,
    audio:`${dir}/audio.${audioExt}`, bpm, offset, charts };
  if (bgPath) s.background = bgPath;
  if (song.previewStart != null) s.previewStart = song.previewStart;
  const rawMan = { format:PACK_FORMAT, version:1, name:title.slice(0, 40), author:core.$("spCharter").value,
    description:core.$("spArtist").value, license:core.$("spLicense").value, songs:[s] };
  if (core.$("spCreditCard").checked) {
    const artist = core.$("spArtist").value.trim(), charter = core.$("spCharter").value.trim(), terms = core.$("spLicense").value.trim();
    rawMan.creditCard = { name:artist || title, role:charter ? `Charter: ${charter}` : "Song creator", tagline:title,
                          rights:terms, license:terms };
  }
  const man = sanitizeManifest(rawMan);
  if (!man) { core.setStatus("spStatus", "packBadManifest"); return; }
  const out = {}; for (const { path } of manifestPaths(man)) if (files[path]) out[path] = files[path];
  core.downloadBlob(await packToZip(man, out), `${core.safeName(title)}.stpack`);
  core.setStatus("spStatus", "spBuilt");
}

/* ============ パック一覧（中身はすべて textContent で表示） ============ */
function creditCardText(value) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return value[lang] || value.en || value.ja || value.zh || value.ko || "";
}
function creditCardXml(value) {
  return String(value || "").replace(/[&<>\"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '\"':"&quot;", "'":"&apos;" }[c]));
}
function creditCardMarkdownText(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim();
}
function creditCardSvg(card, packName = "") {
  const lines = [card.name, creditCardText(card.role), creditCardText(card.tagline), card.license, creditCardText(card.rights), card.url]
    .filter(Boolean).concat((card.contributors || []).map(p => `${p.name}${creditCardText(p.role) ? " · " + creditCardText(p.role) : ""}`));
  const text = lines.slice(0, 14).map((line, i) => `<text x="64" y="${126 + i * 23}" class="${i === 0 ? "name" : i === 1 ? "role" : "line"}">${creditCardXml(line)}</text>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520" role="img" aria-label="trk! rights card"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#ff4c67"/><stop offset="1" stop-color="#67c8ff"/></linearGradient></defs><rect width="900" height="520" rx="36" fill="#101521"/><rect x="18" y="18" width="864" height="484" rx="28" fill="none" stroke="url(#g)" stroke-width="4"/><circle cx="790" cy="92" r="58" fill="#ff4c67" opacity=".16"/><circle cx="790" cy="92" r="34" fill="#67c8ff" opacity=".12"/><text x="64" y="72" class="eyebrow">TRK! RIGHTS CARD</text><text x="64" y="100" class="pack">${creditCardXml(packName || "trk! pack")}</text>${text}<text x="64" y="474" class="foot">Text-only credit card · keep the original license / ReadMe with the pack</text><style>.eyebrow{font:800 15px system-ui;letter-spacing:4px;fill:#8dd8ff}.pack{font:900 30px system-ui;fill:#fff}.name{font:800 25px system-ui;fill:#fff}.role{font:700 16px system-ui;fill:#ffd166}.line{font:500 16px system-ui;fill:#b9c8df}.foot{font:500 12px system-ui;fill:#71809a}</style></svg>`;
}
function creditCardMarkdown(man) {
  const c = man.creditCard;
  if (!c) return "# Credits\n\nNo credit card was supplied for this pack.\n";
  const lines = [`# Credits — ${creditCardMarkdownText(man.name)}`, "", `- Name: ${creditCardMarkdownText(c.name)}`];
  const add = (label, value) => { const text = creditCardMarkdownText(value); if (text) lines.push(`- ${label}: ${text}`); };
  add("Role", creditCardText(c.role)); add("Tagline", creditCardText(c.tagline)); add("Rights", creditCardText(c.rights));
  add("License", c.license); add("Handle", c.handle); add("URL", c.url);
  if (c.contributors && c.contributors.length) {
    lines.push("", "## Contributors");
    for (const p of c.contributors) {
      lines.push("", `### ${creditCardMarkdownText(p.name)}`);
      const personAdd = (label, value) => { const text = creditCardMarkdownText(value); if (text) lines.push(`- ${label}: ${text}`); };
      personAdd("Role", creditCardText(p.role)); personAdd("Rights", creditCardText(p.rights));
      personAdd("License", p.license); personAdd("Handle", p.handle); personAdd("URL", p.url);
    }
  }
  lines.push("", "> This card is a creator-provided summary, not a substitute for the original license or ReadMe.");
  return lines.join("\n") + "\n";
}
function appendPackCreditCard(parent, card, packName = "") {
  if (!card || !card.name) return;
  const d = core.el("details", "packCreditCardBox");
  d.append(core.el("summary", "", tr("packCreditTitle")));
  const body = core.el("div", "packCreditCardInner");
  body.append(core.el("strong", "packCreditName", card.name));
  const role = creditCardText(card.role); if (role) body.append(core.el("div", "packCreditRole", role));
  const tagline = creditCardText(card.tagline); if (tagline) body.append(core.el("p", "packCreditTagline", tagline));
  const rights = creditCardText(card.rights); if (rights) body.append(core.el("p", "packCreditRights", "⚖ " + rights));
  if (card.license) body.append(core.el("p", "packCreditLicense", "▣ " + card.license));
  if (card.handle) body.append(core.el("p", "packCreditHandle", (card.handle.startsWith("@") ? card.handle : "@" + card.handle)));
  if (card.url) body.append(core.safeLink("packCreditUrl", card.url));   /* 🛡 https 以外はリンクにしない */
  body.append(core.el("p", "packCreditDisclaimer", tr("packCreditDisclaimer")));
  const contributors = card.contributors || [];
  if (contributors.length) {
    body.append(core.el("h4", "packContributorsTitle", tr("packContributors", { n:contributors.length })));
    const list = core.el("ul", "packContributors");
    for (const person of contributors) {
      const item = core.el("li", "packContributor");
      const head = core.el("div", "packContributorHead"); head.append(core.el("strong", "packContributorName", person.name));
      const personRole = creditCardText(person.role); if (personRole) head.append(core.el("span", "packContributorRole", personRole));
      item.append(head);
      const personRights = creditCardText(person.rights); if (personRights) item.append(core.el("div", "packContributorRights", "⚖ " + personRights));
      if (person.license) item.append(core.el("div", "packContributorLicense", "▣ " + person.license));
      if (person.handle) item.append(core.el("div", "packContributorHandle", person.handle.startsWith("@") ? person.handle : "@" + person.handle));
      if (person.url) item.append(core.safeLink("packContributorUrl", person.url));   /* 🛡 https 以外はリンクにしない */
      list.append(item);
    }
    body.append(list);
  }
  const download = core.el("button", "packCreditDownload", tr("packCreditDownload")); download.type = "button";
  download.addEventListener("click", () => core.downloadBlob(new Blob([creditCardSvg(card, packName)], { type:"image/svg+xml;charset=utf-8" }), `${core.safeName(packName || card.name)}-rights-card.svg`));
  body.append(download);
  d.append(body); parent.append(d);
}
/* 📦 trk231：目録の一覧からも「使う・外す・消す・入っているか」を扱えるように、小さな入口を出す。
   消すときは、使っているパックなら先に外す（外し忘れ＝設定に packPrev が残る、を防ぐ）。 */
async function listInstalledPacks() {
  let recs = []; try { recs = await packDB.all(); } catch (_) { return []; }
  return recs.map(r => ({ id:r.id, name:(r.manifest && r.manifest.name) || "", author:(r.manifest && r.manifest.author) || "",
    bytes:r.size || 0, installedAt:r.installedAt || 0, active:packRuntime.id === r.id,
    release:(r.manifest && r.manifest.release) || "" }));   /* 📦 trk232：目録の version と比べて「更新あり」を出す */
}
async function deletePackById(id) {
  if (!confirm(tr("confirmDeletePack"))) return false;
  let rec = null; try { rec = await packDB.get(id); } catch (_) {}
  const wasActive = packRuntime.id === id;
  if (wasActive) deactivatePack();
  try { await packDB.del(id); } catch (_) { return false; }
  core.setStatus("packStatus", "packDeleted"); await renderPackList();
  if (rec && rec.manifest && rec.manifest.songs) core.emit("packsChanged");
  return true;
}
/* 💾 trk234：まとめて消す。確認は1回で、何件・何 MB を出す。
   ⚠ 合図（packsChanged）は**まとめて1回だけ**。1件ずつ deletePackById を呼ぶと、
      曲を含むパックの数だけ曲リストが作り直されて重くなる。 */
async function deletePacksByIds(ids, opts) {
  const silent = !!(opts && opts.skipConfirm);
  const want = [...new Set((Array.isArray(ids) ? ids : []).map(v => (typeof v === "string" ? v : "")).filter(Boolean))];
  if (!want.length) return { ok:0, bad:0, bytes:0, cancelled:false, empty:true };
  let recs = [];
  try { recs = await packDB.all(); } catch (_) { recs = []; }
  const plan = packDeletePlan(recs.map(r => ({ id:r.id, size:packRecordSize(r), active:packRuntime.id === r.id })), want);
  if (!plan.count) { core.setStatus("packStatus", "packDeleteNone"); return { ok:0, bad:0, bytes:0, missing:plan.missing, cancelled:false }; }
  if (!silent) {
    const vars = { n:plan.count, size:packSizeText(plan.bytes) };
    if (!confirm(tr(plan.activeIds.length ? "packDeleteSelectedConfirmActive" : "packDeleteSelectedConfirm", vars))) {
      return { ok:0, bad:0, bytes:0, cancelled:true };
    }
  }
  if (plan.activeIds.length) { try { deactivatePack(); } catch (_) {} }
  let ok = 0, bad = 0, bytes = 0, hasSongs = false;
  for (const id of plan.ids) {
    const rec = recs.find(r => r.id === id);
    try {
      await packDB.del(id);
      ok++; bytes += rec ? packRecordSize(rec) : 0;
      if (rec && rec.manifest && rec.manifest.songs) hasSongs = true;
    } catch (_) { bad++; }
  }
  packSelection.clear();
  if (hasSongs) core.emit("packsChanged");   /* 曲の参照が変わったときだけ・1回だけ */
  await renderPackList();
  core.setStatus("packStatus", bad ? "packDeletedSome" : "packDeletedMany",
    { n:ok, ok, bad, size:packSizeText(bytes) });
  return { ok, bad, bytes, cancelled:false };
}
/* ❓謎設定：パックを全部消す（確認2回。1回目＝件数と合計、2回目＝DELETE と入力） */
async function wipeAllPacks() {
  let recs = [];
  try { recs = await packDB.all(); } catch (_) { recs = []; }
  const info = packUsageInfo(recs.map(r => ({ id:r.id, size:packRecordSize(r), active:packRuntime.id === r.id })), null);
  if (!info.count) { core.setStatus("packStatus", "packWipeNone"); return { ok:0, cancelled:false }; }
  if (!confirm(tr("packWipeConfirm", { n:info.count, size:packSizeText(info.total) }))) return { ok:0, cancelled:true };
  const typed = typeof prompt === "function" ? String(prompt(tr("packWipeType", { n:info.count, size:packSizeText(info.total) })) || "").trim() : "";
  if (typed !== "DELETE") { core.setStatus("packStatus", typed ? "packWipeBadWord" : null); return { ok:0, cancelled:true }; }
  const r = await deletePacksByIds(recs.map(rec => rec.id), { skipConfirm:true });
  core.setStatus("packStatus", "packWipeDone", { n:r.ok, size:packSizeText(r.bytes) });
  return r;
}
/* 💾 trk234：容量の表示（入っているパックの合計・上限・端末の空き） */
const packSelection = new Set();     /* まとめて消すために選んだパックの id */
let packLastView = [];               /* 最後に描いた一覧の控え（選択の計算に使う） */
let packEstimateSeq = 0;             /* 古い estimate() の結果で上書きしないための番号 */
function renderPackUsage(view) {
  const box = core.$("packUsage");
  if (!box) return;
  const info = packUsageInfo(view, packCap(PACK_STORE_MAX));
  box.hidden = info.count === 0;
  const total = core.$("packUsageTotal"), share = core.$("packUsageShare"), bar = core.$("packUsageBar"),
    fill = core.$("packUsageFill"), free = core.$("packUsageFree"), detail = core.$("packUsageDetail");
  const size = packSizeText(info.total);
  if (total) total.textContent = info.capped
    ? tr("packUsageTotal", { n:info.count, size, cap:packSizeText(info.cap) })
    : tr("packUsageTotalNoCap", { n:info.count, size });
  if (share) share.textContent = info.capped ? tr("packUsageShare", { pct:info.pct }) : "";
  if (bar) bar.hidden = !info.capped;
  if (fill) { fill.style.width = `${info.pct}%`; fill.classList.toggle("isHigh", info.pct >= 90); }
  const parts = [];
  if (info.unused.count) parts.push(tr("packUsageUnused", { n:info.unused.count, size:packSizeText(info.unused.bytes) }));
  if (info.total > 0 && info.heaviest.length) parts.push(tr("packUsageHeaviest", { list:info.heaviest.map(h => `${h.name} ${packSizeText(h.bytes)}`).join(" / ") }));
  if (detail) detail.textContent = parts.join("　");
  /* 端末の空きは、取れたときだけ出す（取れない環境では空欄のまま） */
  const seq = ++packEstimateSeq;
  if (free) free.textContent = "";
  const storage = typeof navigator !== "undefined" ? navigator.storage : null;
  if (!storage || typeof storage.estimate !== "function") return;
  Promise.resolve().then(() => storage.estimate()).then(est => {
    if (seq !== packEstimateSeq || !free) return;
    if (est && Number.isFinite(est.quota) && Number.isFinite(est.usage)) {
      free.textContent = tr("packUsageFree", { free:packSizeText(Math.max(0, est.quota - est.usage)) });
    }
  }).catch(() => {});
}
/* 選択の数と合計を出す。0 件のときはボタンを押せなくする */
function renderPackPick(view) {
  const plan = packDeletePlan(view, [...packSelection]);
  const btn = core.$("packDeletePicked"), line = core.$("packPickStatus");
  if (btn) {
    btn.disabled = plan.count === 0;
    btn.textContent = plan.count
      ? tr("packDeletePicked", { n:plan.count, size:packSizeText(plan.bytes) })
      : tr("packDeletePickedNone");
  }
  if (line) line.textContent = plan.count ? tr("packSelectCount", { n:plan.count, size:packSizeText(plan.bytes) }) : "";
}
/* 選ぶ（all＝全部／unused＝使っていないもの／none＝解除） */
async function pickPacks(which) {
  if (which === "all") for (const v of packLastView) packSelection.add(v.id);
  else if (which === "unused") { packSelection.clear(); for (const v of packLastView) if (!v.active) packSelection.add(v.id); }
  else packSelection.clear();
  await renderPackList();
}
async function renderPackList() {
  const box = core.$("packList"); let recs = [];
  try { recs = await packDB.all(); } catch (_) {}
  box.textContent = "";
  /* 💾 trk234：容量の表示と選択の後始末（消えたパックは選択からも外す） */
  const view = recs.map(r => ({ id:r.id, name:(r.manifest && r.manifest.name) || "", size:packRecordSize(r), active:packRuntime.id === r.id }));
  const alive = new Set(view.map(v => v.id));
  for (const id of [...packSelection]) if (!alive.has(id)) packSelection.delete(id);
  packLastView = view;
  renderPackUsage(view);
  renderPackPick(view);
  if (!recs.length) { box.append(core.el("div", "hint", tr("packEmpty"))); return; }
  recs.sort((a, b) => (b.installedAt || 0) - (a.installedAt || 0));
  for (const r of recs) {
    const m = r.manifest, on = packRuntime.id === r.id, card = core.el("div", "packCard" + (on ? " active" : ""));
    const head = core.el("div", "packHead");
    /* 💾 trk234：まとめて消すための選択。読み上げ名はパック名（どれを選んでいるか分かるように） */
    const pick = core.el("input", "packPick"); pick.type = "checkbox"; pick.checked = packSelection.has(r.id);
    pick.setAttribute("aria-label", tr("packSelectOne", { name: m.name }));
    pick.addEventListener("change", () => {
      if (pick.checked) packSelection.add(r.id); else packSelection.delete(r.id);
      card.classList.toggle("picked", pick.checked);
      renderPackPick(packLastView);
    });
    const pickWrap = core.el("label", "packPickWrap"); pickWrap.append(pick);
    if (packSelection.has(r.id)) card.classList.add("picked");
    head.append(pickWrap, core.el("b", "", m.name));
    if (m.author) head.append(core.el("span", "packBy", "by " + m.author));
    head.append(core.el("span", "packBy", `${((r.size || 0) / PACK_MB).toFixed(1)} MB`));
    card.append(head);
    if (m.description) card.append(core.el("div", "hint", m.description));
    const badges = core.el("div", "packBadges");
    [[m.skin, "badgeSkin"], [m.notes, "badgeNotes"], [m.sounds, "badgeSounds"], [m.mascot && m.mascot.vrm, "badgeVrm"],
     [m.mascot && m.mascot.motion, "badgeMotion"], [m.mascot && m.mascot.captions, "badgeCaptions"]]
      .forEach(([v, k]) => { if (v) badges.append(core.el("span", "packBadge", tr(k))); });
    if (m.songs) badges.append(core.el("span", "packBadge", tr("badgeSongs", { n:m.songs.length })));
    if (m.fonts && m.fonts.length) badges.append(core.el("span", "packBadge", tr("badgeFonts", { n:m.fonts.length })));
    if (m.creditCard) badges.append(core.el("span", "packBadge", tr("badgeCreditCard")));
    card.append(badges);
    appendPackCreditCard(card, m.creditCard, m.name);
    /* 🔤 trk232：同梱の書体とライセンス（入れたあとでも確かめられる）
       trk233：ライセンス全文（licenseFile）を、押したときだけ読んで出す（一覧を重くしない） */
    if (m.fonts && m.fonts.length) {
      const fd = core.el("details"); fd.append(core.el("summary", "", tr("packFontLabel")));
      for (const f of m.fonts) fd.append(core.el("div", "", tr("packFontLine", { family:f.family, license:f.license })));
      const lf = (m.fonts.find(f => f.licenseFile) || {}).licenseFile;
      if (lf) {
        const btn = core.el("button", "small", tr("packLicenseOpen")); btn.type = "button";
        const out = core.el("pre", "hint packLicenseText"); out.hidden = true;
        btn.addEventListener("click", async () => {
          if (!out.hidden) { out.hidden = true; btn.textContent = tr("packLicenseOpen"); return; }
          const blob = r.files && r.files[lf];
          if (!blob) out.textContent = tr("packLicenseMissing");
          else { try { out.textContent = (await blob.text()).slice(0, 100000); } catch (_) { out.textContent = tr("packLicenseMissing"); } }
          out.hidden = false; btn.textContent = tr("packLicenseClose");
        });
        fd.append(btn, out);
      }
      card.append(fd);
    }
    if (m.license || m.url) {
      const d = core.el("details"); d.append(core.el("summary", "", tr("packLicenseLabel")));
      if (m.license) d.append(core.el("div", "", m.license));
      if (m.url) d.append(core.safeLink("", m.url));   /* 🛡 https 以外はリンクにしない */
      card.append(d);
    }
    const acts = core.el("div", "miniActions");
    if (hasLook(m)) {
      const use = core.el("button", "", tr(on ? "packActive" : "packUse")); use.type = "button"; use.disabled = on;
      use.addEventListener("click", () => activatePack(r.id));
      acts.append(use);
    }
    const ex = core.el("button", "", tr("packExport")); ex.type = "button";
    ex.addEventListener("click", async () => core.downloadBlob(await packToZip(m, r.files || {}), `${core.safeName(m.name)}.stpack`));
    const del = core.el("button", "", tr("packDelete")); del.type = "button";
    del.addEventListener("click", () => deletePackById(r.id));
    acts.append(ex, del); card.append(acts); box.append(card);
  }
}

/* 起動時：一覧を出して、使っていたパックを戻す（main.js から呼びます） */
async function initPacks() {
  await renderPackList();
  if (core.settings.activePack) await activatePack(core.settings.activePack, { restore:true });
}

/* ============ イベント ============ */
core.$("packFile").addEventListener("change", e => { const f = e.target.files[0]; e.target.value = ""; if (f) installAndUse(f); });
core.$("songPackFile").addEventListener("change", e => { const f = e.target.files[0]; e.target.value = ""; if (f) installAndUse(f); });
core.$("packOffBtn").addEventListener("click", () => deactivatePack());
/* 💾 trk234：容量の表示と、まとめて消す（確認は1回・曲リストへの合図は1回） */
[["packPickAll", "all"], ["packPickUnused", "unused"], ["packPickNone", "none"]].forEach(([id, which]) => {
  const b = core.$(id);
  if (b) b.addEventListener("click", () => { pickPacks(which).catch(e => console.error(e)); });
});
{
  const picked = core.$("packDeletePicked");
  if (picked) picked.addEventListener("click", () => { deletePacksByIds([...packSelection]).catch(e => console.error(e)); });
  const wipe = core.$("packWipeBtn");
  if (wipe) wipe.addEventListener("click", () => { wipeAllPacks().catch(e => console.error(e)); });
}
core.$("packBuildBtn").addEventListener("click", () => { buildPack().catch(e => { console.error(e); core.setStatus("packStatus", "packBadZip"); }); });
core.$("spBuildBtn").addEventListener("click", () => { buildSongPack().catch(e => { console.error(e); core.setStatus("spStatus", "packBadZip"); }); });
on("language", renderPackList);
addEventListener("drop", e => {      // .stpack / .zip / .stlib は他の処理より先に受け取る
  const list = e.dataTransfer && e.dataTransfer.files ? [...e.dataTransfer.files] : [];
  const f = list[0];
  if (!f || !/\.(stpack|zip|stlib)$/i.test(f.name)) return;
  /* 📦 trk231：目録＋パックをまとめて落としたときは、目録の側（js/pack-catalog.js）に任せる */
  if (list.length > 1 || list.some(x => /\.json$/i.test(x.name))) return;
  e.preventDefault(); e.stopImmediatePropagation();
  /* 📦 trk235：セット（.stlib・中に目録が入った .zip）は、目録の側へ渡す。
     セットでなければ false が返るので、今までどおり 1 本のパックとして入れる（.stpack は今までどおり） */
  const cat = window.Trk && window.Trk.packCatalog;
  if (/\.(stlib|zip)$/i.test(f.name) && cat && typeof cat.tryImportSet === "function") {
    const fallback = () => { if (core.phase === "title") installAndUse(f); };
    cat.tryImportSet(f).then(taken => { if (!taken) fallback(); }).catch(fallback);
    return;
  }
  if (core.phase !== "title") return;
  installAndUse(f);
}, true);
/* ✅ custom.js 完了 */

/* 公開名は据え置き（名前空間の移行の途中。window.Trk.* への移動は後の段階で行う） */
/* 後から読み込まれるファイルがこの名前を差し替える（window.getPackSongs の代入）。内部の呼び出しにも届くよう、アクセサで同じ束縛を指す */
Object.defineProperty(window, "getPackSongs", { configurable:true, get:() => getPackSongs, set:v => { getPackSongs = v; } });
window.initPacks = initPacks;
/* 後から読み込まれるファイルがこの名前を差し替える（window.installPackFile の代入）。内部の呼び出しにも届くよう、アクセサで同じ束縛を指す */
Object.defineProperty(window, "installPackFile", { configurable:true, get:() => installPackFile, set:v => { installPackFile = v; } });
window.noteImage = noteImage;
window.packDB = packDB;
window.packRuntime = packRuntime;
/* 後から読み込まれるファイルがこの名前を差し替える（window.renderPackList の代入）。内部の呼び出しにも届くよう、アクセサで同じ束縛を指す */
Object.defineProperty(window, "renderPackList", { configurable:true, get:() => renderPackList, set:v => { renderPackList = v; } });
/* 後から読み込まれるファイルがこの名前を差し替える（window.sanitizeSong の代入）。内部の呼び出しにも届くよう、アクセサで同じ束縛を指す */
Object.defineProperty(window, "sanitizeSong", { configurable:true, get:() => sanitizeSong, set:v => { sanitizeSong = v; } });
window.skinShelf = skinShelf;
window.syncNoteUI = syncNoteUI;
window.updateMascotUI = updateMascotUI;
/* 領域（window.Trk.custom）：公開名の正規の場所。旧名（window.X）は別名として残す（利用者の決定） */
window.Trk = window.Trk || {};
window.Trk.custom = Object.assign(window.Trk.custom || {}, { initPacks, noteImage, packDB, packRuntime, packIdentityFromManifest, skinShelf, syncNoteUI, updateMascotUI, installAndUse,
  /* 📦 trk231：目録の一覧（js/pack-catalog.js）から使う入口 */
  activatePack, deactivatePack, deletePackById, listInstalledPacks,
  /* 💾 trk234：容量の表示と、まとめて消す（目録の一覧と ❓謎設定からも使う） */
  packSizeText, packUsageInfo, packDeletePlan, deletePacksByIds, wipeAllPacks });
Object.defineProperty(window.Trk.custom, "getPackSongs", { configurable:true, get:() => getPackSongs, set:v => { getPackSongs = v; } });
Object.defineProperty(window.Trk.custom, "installPackFile", { configurable:true, get:() => installPackFile, set:v => { installPackFile = v; } });
Object.defineProperty(window.Trk.custom, "renderPackList", { configurable:true, get:() => renderPackList, set:v => { renderPackList = v; } });
Object.defineProperty(window.Trk.custom, "sanitizeSong", { configurable:true, get:() => sanitizeSong, set:v => { sanitizeSong = v; } });
})();

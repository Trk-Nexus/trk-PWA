// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 📚 trk-Avatar-Library の受け子（検証と変換・trk326） ============

   倉庫（Trk-Nexus/trk-Avatar-Library）の要項 2026-11-27 が求める受け口のうち、
   **データの検証と形の変換**だけをここに置きます（純粋な道具）。

     R-VOL-1 … 巻別・単体スキン JSON（`trk-avatar-library-skins` v1）→ 本体のスキン定義
     R-REM-2 … 題字書体・作品指定の退避封筒（`trk-title-font-works-backup` v1）の検査
     R-TYP-1 … 書体の組み合わせ単体 JSON（`trk-typography-pairing` v1）の検査
     R-WIZ-1 … Advance Wizard 設定（`trk-avatar-library-advance-prefs` v1）の検査と、
               統合マニフェスト（`trk-avatar-library-manifest` v1）の**前方互換**の読み取り
     補遺    … re-modern 作品の退避（`trk-re-modern-works-backup` v1）の検査

   ・DOM・保存・通信はしません（保存と画面は js/custom.js・js/title-font.js・
     js/typography.js・js/remodern-ui.js・js/cli.js が行います）。
   ・受け取るのは構造化データだけです。色は許可パターン（#rrggbb・rgba()・
     linear-gradient()）だけを通し、書体名・ID・パスも文字種を絞ります。
   ・知らない項目は**コピーしません**（新しい版が足した項目を古い版が読んでも増えない）。
   ・`window.Trk.libraryReceiver` で公開します。 */
"use strict";
(() => {
  const D = () => (window.Trk && window.Trk.data) || null;

  const SKIN_VOLUME_FORMAT = "trk-avatar-library-skins";
  const TYPOGRAPHY_PAIRING_FORMAT = "trk-typography-pairing";
  const TITLE_FONT_WORKS_FORMAT = "trk-title-font-works-backup";
  const ADVANCE_PREFS_FORMAT = "trk-avatar-library-advance-prefs";
  const LIBRARY_MANIFEST_FORMAT = "trk-avatar-library-manifest";
  const REMODERN_WORKS_BACKUP_FORMAT = "trk-re-modern-works-backup";

  /* 上限（要項の例に合わせた固定値。設定で外せません） */
  const SKIN_IMPORT_FILE_MAX = 1024 * 1024;     /* 1 ファイル 1 MiB */
  const SKIN_IMPORT_MAX = 300;                  /* 取り込んだ巻の合計 300 種 */
  const SKIN_VOLUME_ITEMS_MAX = 500;            /* 1 ファイルに載ってよい数（倉庫の検査と同じ） */
  const TITLE_WORKS_BACKUP_MAX = 256 * 1024;    /* 退避封筒の raw の上限 */
  const TITLE_WORKS_ENTRIES_MAX = 200;
  const TYPO_PAIRING_MAX = 64 * 1024;
  const ADVANCE_PREFS_MAX = 256 * 1024;
  const ADVANCE_DICT_MAX = 500, ADVANCE_WORD_MAX = 64, ADVANCE_KEY_MAX = 40;
  const REMODERN_BACKUP_MAX = 1024 * 1024;

  /* ID・色・書体・パスの許可パターン */
  const SKIN_ID_RE = /^[A-Za-z][A-Za-z0-9_-]{0,43}$/;       /* 棚のキー（imp-…）に足すので 44 文字まで */
  const PACK_PATH_RE = /^[A-Za-z0-9_.-][A-Za-z0-9_./-]{0,150}\.stpack$/i;
  const FAMILY_RE = /^Trk[A-Za-z0-9]{1,36}$/;
  const HEX6 = /^#[0-9a-f]{6}$/i;
  const RGBA = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d{1,3})\s*)?\)$/i;
  const COLOR_TOKEN = String.raw`(?:#[0-9a-f]{6}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d{1,3})\s*)?\))`;
  const GRADIENT = new RegExp(`^linear-gradient\\(\\s*(-?\\d{1,3})deg\\s*((?:,\\s*${COLOR_TOKEN}){2,6})\\s*\\)$`, "i");
  const FILTER_RE = /^[a-z-]+\([a-z0-9 .,%+-]*\)(?:\s+[a-z-]+\([a-z0-9 .,%+-]*\))*$/i;
  const LOCALES = ["ja", "en", "zh", "ko"];
  /* 倉庫の目録の 14 色（順は要項のまま） */
  const SKIN_COLOR_KEYS = ["stage", "ink", "don", "ka", "text", "muted", "bg", "panel", "field", "button", "accent", "onAccent", "gold", "border"];
  const GRADIENT_KEYS = ["bg", "stage"];                    /* グラデーションを受けられる色 */
  const SKIN_SHAPES = ["circle", "diamond", "square"];
  /* R-WIZ-1：Advance Wizard の禁止文字（倉庫の要項と同じ：` \ .. ~ C:） */
  const FORBIDDEN_ADVANCE = /(`|\\|\.\.|~|C:)/i;
  /* プロトタイプ汚染よけ（キーとして持たない名前） */
  const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

  const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const ownEntries = obj => Object.keys(obj).map(k => [k, obj[k]]);
  function ownCopy(src, keys) {
    const out = {};
    if (!src || typeof src !== "object" || Array.isArray(src)) return out;
    for (const key of keys || Object.keys(src)) {
      if (!Object.prototype.hasOwnProperty.call(src, key) || UNSAFE_KEYS.has(key)) continue;
      Object.defineProperty(out, key, { value: src[key], enumerable: true, writable: true, configurable: true });
    }
    return out;
  }

  /* ---------- 色と書体 ---------- */
  const isHex = v => typeof v === "string" && HEX6.test(v.trim());
  const isRgba = v => typeof v === "string" && RGBA.test(v.trim());
  const isColor = (v, allowGradient) => {
    if (typeof v !== "string") return false;
    const t = v.trim();
    if (t.length > 300) return false;
    if (HEX6.test(t) || RGBA.test(t)) return true;
    return allowGradient === true && GRADIENT.test(t);
  };
  const gradientStops = v => {
    const t = typeof v === "string" ? v.trim() : "";
    const m = GRADIENT.exec(t);
    if (!m) return null;
    const stops = [...t.matchAll(new RegExp(COLOR_TOKEN, "gi"))].map(x => x[0]);
    return { angle: Number(m[1]), stops };
  };
  const isFilter = v => typeof v === "string" && v.length <= 120 && FILTER_RE.test(v.trim());
  /* 目録の font は \"Courier New\" のように二重にエスケープされていることがある */
  function cleanFont(raw) {
    if (typeof raw !== "string") return "";
    const un = raw.replace(/\\+"/g, '"').replace(/\s+/g, " ").trim();
    if (!un || un.length > 200 || !/^[A-Za-z0-9 _,"'-]+$/.test(un)) return "";
    return un;
  }
  function pickLocaleMap(raw, max) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const out = {};
    for (const lang of LOCALES) {
      const v = str(raw[lang], max || 60);
      if (v) out[lang] = v;
    }
    return Object.keys(out).length === LOCALES.length ? out : null;
  }
  function cleanShapes(raw) {
    if (Array.isArray(raw) && raw.length === 2 && raw.every(v => typeof v === "string" && SKIN_SHAPES.includes(v))) return raw.slice();
    return ["circle", "circle"];
  }
  function cleanType(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const out = {};
    const title = cleanFont(raw.title);
    if (title) out.title = title;
    for (const k of ["weight", "lh", "titleWeight", "titleSpace", "titleTransform"]) {
      const v = str(raw[k], 20);
      if (v && /^[a-z0-9.%+-]+$/i.test(v)) out[k] = v;
    }
    const mark = typeof raw.mark === "string" ? raw.mark.slice(0, 40) : "";
    if (mark) out.mark = mark;
    return Object.keys(out).length ? out : null;
  }
  /* CLI の見た目は本体の受け口（data.js の sanitizeCliLook）と同じ規則で整える */
  function cleanCli(raw) {
    const d = D();
    if (!d || typeof d.sanitizeCliLook !== "function") return null;
    const look = d.sanitizeCliLook(raw);
    return look && Object.keys(look).length ? look : null;
  }
  const cleanCats = raw => {
    const d = D();
    if (!d || typeof d.sanitizeSkinCats !== "function") return [];
    return d.sanitizeSkinCats(raw);
  };

  /* ---------- R-VOL-1：スキン 1 枚の検証 ---------- */
  /* 返す値：{ ok, errors, warnings, skin }。skin は**決めた項目だけ**を持つ写し（元の値は変えない） */
  function sanitizeVolumeSkin(raw, ctx) {
    const where = (ctx && ctx.where) || "skin";
    const errors = [], warnings = [];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, errors: [`${where}: オブジェクトではありません`], warnings, skin: null };
    const id = typeof raw.id === "string" ? raw.id.trim() : "";
    if (!SKIN_ID_RE.test(id)) errors.push(`${where}: スキン ID の形が不正です（${id.slice(0, 48) || "空"}）`);
    const label = pickLocaleMap(raw.label, 60), desc = pickLocaleMap(raw.desc, 80);
    if (!label) errors.push(`${where}: label に ja / en / zh / ko の 4 言語が必要です`);
    if (!desc) errors.push(`${where}: desc に ja / en / zh / ko の 4 言語が必要です`);
    const src = raw.colors && typeof raw.colors === "object" && !Array.isArray(raw.colors) ? raw.colors : null;
    const colors = {};
    if (!src) errors.push(`${where}: colors オブジェクトがありません`);
    else {
      for (const key of SKIN_COLOR_KEYS) {
        const allowGradient = GRADIENT_KEYS.includes(key);
        if (!isColor(src[key], allowGradient)) {
          errors.push(`${where}: colors.${key} が許可された色の形ではありません`);
          continue;
        }
        colors[key] = String(src[key]).trim();
      }
    }
    /* 意図した低コントラストの宣言は、4 言語の理由とセットのときだけ保持する */
    let readability = "", readabilityReason = null;
    if (raw.readability !== undefined) {
      if (raw.readability !== "intentional-low") errors.push(`${where}: 未対応の readability 値です（${String(raw.readability)}）`);
      else {
        readabilityReason = pickLocaleMap(raw.readabilityReason, 120);
        if (!readabilityReason) errors.push(`${where}: readability="intentional-low" には 4 言語の readabilityReason が必要です`);
        else {
          readability = "intentional-low";
          warnings.push(`${where}: 見づらさを意図した配色（intentional-low）です`);
        }
      }
    } else if (raw.readabilityReason !== undefined) {
      errors.push(`${where}: readability なしで readabilityReason だけを指定することはできません`);
    }
    const video = isFilter(raw.video) ? raw.video.trim() : "";
    if (errors.length) return { ok: false, errors, warnings, skin: null };
    const skin = {
      id, label, desc, colors, readability, readabilityReason,
      cat: cleanCats(raw.cat), shapes: cleanShapes(raw.shapes),
      font: cleanFont(raw.font), type: cleanType(raw.type),
      video, cli: cleanCli(raw.cli), locked: raw.locked === true,
      legacyColors: cleanLegacyColors(raw.legacyColors)
    };
    return { ok: true, errors, warnings, skin };
  }

  /* 巻または単体の JSON を検査する。
     受け入れる形： ① { format, version, count, skins:[…] } ② スキン 1 枚（単体 items/<id>.json） */
  function validateVolumePayload(raw) {
    const errors = [], warnings = [];
    const fail = (msg) => ({ ok: false, errors: errors.concat(msg ? [msg] : []), warnings, skins: [], count: 0 });
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail("JSON オブジェクトではありません");
    let list;
    if (raw.format === SKIN_VOLUME_FORMAT || raw.version !== undefined || Array.isArray(raw.skins)) {
      if (raw.format !== SKIN_VOLUME_FORMAT) errors.push(`format が "${SKIN_VOLUME_FORMAT}" ではありません（${String(raw.format)}）`);
      if (raw.version !== 1) errors.push(`未対応の version です（${String(raw.version)}）`);
      if (!Array.isArray(raw.skins)) return fail("skins 配列がありません");
      list = raw.skins;
      if (raw.count !== undefined && raw.count !== list.length) errors.push(`count（${String(raw.count)}）と skins.length（${list.length}）が一致しません`);
      if (list.length > SKIN_VOLUME_ITEMS_MAX) errors.push(`収録数（${list.length}）が上限（${SKIN_VOLUME_ITEMS_MAX}）を超えています`);
    } else {
      list = [raw];   /* 単体スキン（items/<id>.json）は 1 件の巻として受ける */
    }
    if (!list.length) return fail("スキンが 1 枚もありません");
    const skins = [], seen = new Set();
    list.forEach((item, i) => {
      const res = sanitizeVolumeSkin(item, { where: `[${i + 1}]${item && item.id ? " " + String(item.id).slice(0, 32) : ""}` });
      errors.push(...res.errors);
      warnings.push(...res.warnings);
      if (res.skin) {
        if (seen.has(res.skin.id)) errors.push(`重複するスキン ID が含まれています：${res.skin.id}`);
        seen.add(res.skin.id);
        skins.push(res.skin);
      }
    });
    return { ok: errors.length === 0, errors, warnings, skins, count: skins.length, single: list !== raw.skins };
  }

  /* 14 色 → 本体の ui / game（色は目録のまま・寄せない） */
  function lookFromColors(colors) {
    const d = D();
    const hexOf = v => {
      if (!d || typeof d.toHex !== "function") return isHex(v) ? v.toLowerCase() : String(v);
      return d.toHex(v);
    };
    const mix = (a, b, t) => (d && typeof d.mixHex === "function" ? d.mixHex(a, b, t) : a);
    const rgba = (v, a) => (d && typeof d.hexToRgba === "function" ? d.hexToRgba(v, a) : v);
    const lum = v => (d && typeof d.luminance === "function" ? d.luminance(v) : 0.2);
    const c = colors;
    const bgGrad = gradientStops(c.bg);
    const stageGrad = gradientStops(c.stage);
    const bgCss = bgGrad ? String(c.bg).trim() : hexOf(c.bg);
    const stage = stageGrad ? String(c.stage).trim() : (isHex(c.stage) ? c.stage.toLowerCase() : bgCss);
    const stops = bgGrad ? bgGrad.stops : [hexOf(c.bg)];
    const dark = stops.reduce((sum, v) => sum + lum(v), 0) / stops.length < 0.35;
    const text = hexOf(c.text), panel = hexOf(c.panel), button = hexOf(c.button), accent = hexOf(c.accent), gold = hexOf(c.gold);
    const ink = isHex(c.ink) ? c.ink.toLowerCase() : text;
    return {
      ui: {
        "--ui-bg": bgCss,
        "--ui-panel": rgba(panel, 0.96),
        "--ui-soft": rgba(text, 0.05),
        "--ui-text": text,
        "--ui-muted": isHex(c.muted) ? c.muted.toLowerCase() : mix(text, panel, 0.38),
        "--ui-border": isColor(c.border) ? String(c.border).trim() : rgba(text, 0.18),
        "--ui-button": button,
        "--ui-button-hover": mix(button, text, 0.13),
        "--ui-field": isHex(c.field) ? c.field.toLowerCase() : mix(hexOf(c.bg), panel, 0.5),
        "--ui-accent": accent,
        "--ui-on-accent": isHex(c.onAccent) ? c.onAccent.toLowerCase() : (lum(accent) > 0.179 ? "#000000" : "#ffffff"),
        "--ui-gold": gold,
        "--ui-shadow": dark ? "0 24px 80px rgba(0,0,0,.55)" : "0 24px 70px rgba(30,40,60,.16)",
        "--ui-glow": rgba(accent, 0.14)
      },
      game: {
        don: isHex(c.don) ? c.don.toLowerCase() : accent,
        ka: isHex(c.ka) ? c.ka.toLowerCase() : gold,
        stage,
        lane: rgba(panel, dark ? 0.6 : 0.82),
        track: rgba(text, 0.24),
        ink,
        inkShadow: dark ? "rgba(0,0,0,.85)" : "rgba(255,255,255,.9)",
        noteBorder: "#ffffff",
        panel: rgba(panel, 0.95),
        perfect: gold,
        good: ink,
        miss: mix(ink, hexOf(c.bg), 0.45),
        glow: false
      }
    };
  }

  /* 目録の 14 色 → 本体のスキン定義（ui / game）。
     色は**目録のまま**使います（寄せない）。見づらさは readability の宣言と警告で伝えます。 */
  function volumeSkinToDef(skin, meta) {
    const look = lookFromColors(skin.colors);
    const def = {
      cat: skin.cat,
      label: skin.label,
      desc: skin.desc,
      ui: look.ui,
      game: look.game,
      shapes: skin.shapes,
      video: skin.video || "grayscale(.35) contrast(1.05)",
      /* 📚 取り込みの印。棚の分類・バッジ・保存の判定に使う */
      imported: true,
      importId: skin.id,
      importVolume: str(meta && meta.volume, 40),
      importedAt: Number.isFinite(meta && meta.at) ? meta.at : 0,
      readability: skin.readability,
      readabilityReason: skin.readabilityReason
    };
    if (skin.font) def.font = skin.font;
    if (skin.type) def.type = skin.type;
    if (skin.cli) def.cli = skin.cli;
    if (skin.locked) def.locked = true;
    /* R-SKIN-1：旧配色（legacyColors）を持つスキンは、既定は新しい色・切り替えで旧配色 */
    const legacy = cleanLegacyColors(skin.legacyColors);
    if (legacy) {
      const merged = Object.assign({}, skin.colors, legacy);
      const old = lookFromColors(merged);
      def.legacyColors = legacy;
      def.legacyUi = old.ui;
      def.legacyGame = old.game;
    }
    return def;
  }

  /* R-SKIN-1：legacyColors（旧配色）の受け口。目録・スキン JSON の任意フィールド。
     形は colors と同じ 14 色（色だけ・グラデーションは受けません）。 */
  function cleanLegacyColors(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const out = {};
    for (const key of SKIN_COLOR_KEYS) {
      if (raw[key] === undefined) continue;
      if (!isColor(raw[key], false)) return null;
      out[key] = String(raw[key]).trim();
    }
    return Object.keys(out).length >= 5 ? out : null;
  }
  /* ---------- R-REM-2：題字書体・作品指定の退避封筒 ---------- */
  function validateTitleFontWorksEnvelope(raw) {
    const errors = [], warnings = [];
    const no = (msg) => ({ ok: false, restorable: false, errors: errors.concat(msg ? [msg] : []), warnings, raw: "", entries: {} });
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return no("封筒が JSON オブジェクトではありません");
    if (raw.format !== TITLE_FONT_WORKS_FORMAT) errors.push(`format が "${TITLE_FONT_WORKS_FORMAT}" ではありません（${String(raw.format)}）`);
    if (raw.version !== 1) errors.push(`未対応の version です（${String(raw.version)}）`);
    if (raw.state !== "ok" && raw.state !== "invalid") errors.push(`state が不正です（"ok" または "invalid" が必要）`);
    if (typeof raw.raw !== "string") return no("raw（保存文字列）が含まれていません");
    if (raw.raw.length > TITLE_WORKS_BACKUP_MAX) return no("raw の長さが上限（256 KiB）を超えています");
    if (raw.state === "invalid") {
      warnings.push("state=\"invalid\" の緊急退避封筒です（壊れた保存値を削除する前に退避したもの）。自動復元はしません。");
      return { ok: errors.length === 0, restorable: false, invalidState: true, errors, warnings, raw: "", entries: {} };
    }
    if (errors.length) return { ok: false, restorable: false, errors, warnings, raw: "", entries: {} };
    let parsed;
    try { parsed = JSON.parse(raw.raw); }
    catch (_) { return no("state=\"ok\" ですが raw を JSON として読めません"); }
    const entries = {};
    let skipped = 0;
    for (const [key, value] of ownEntries(parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {})) {
      if (Object.keys(entries).length >= TITLE_WORKS_ENTRIES_MAX) { skipped++; continue; }
      if (!key || key.length > 64 || UNSAFE_KEYS.has(key)) { skipped++; warnings.push(`予約済み・長すぎる作品キーを飛ばします：${String(key).slice(0, 24)}`); continue; }
      if (typeof value === "string") {
        if (!value || value.length > 32) { skipped++; continue; }
        Object.defineProperty(entries, key, { value: { font: str(value, 32), on: false }, enumerable: true, writable: true, configurable: true });
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        const font = str(value.font, 32);
        if (!font) { skipped++; continue; }
        Object.defineProperty(entries, key, { value: { font, on: value.on === true }, enumerable: true, writable: true, configurable: true });
      } else skipped++;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return no("raw の中身が JSON オブジェクトではありません");
    return {
      ok: true, restorable: true, invalidState: false, errors, warnings,
      raw: JSON.stringify(entries), entries, skipped,
      text: raw.raw
    };
  }

  /* ---------- R-TYP-1：書体の組み合わせ単体 JSON ---------- */
  const TYPO_SLOTS = ["display", "heading", "body", "caption", "numeral", "accent"];
  function validateTypographyPairing(raw) {
    const errors = [], warnings = [];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, errors: ["組み合わせデータが JSON オブジェクトではありません"], warnings, pairing: null };
    if (raw.format !== TYPOGRAPHY_PAIRING_FORMAT) errors.push(`format が "${TYPOGRAPHY_PAIRING_FORMAT}" ではありません（${String(raw.format)}）`);
    if (raw.version !== 1) errors.push(`未対応の version です（${String(raw.version)}）`);
    const id = str(raw.id, 40);
    if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(id)) errors.push(`組み合わせ ID の形が不正です（${id || "空"}）`);
    const slots = {};
    const src = raw.slots && typeof raw.slots === "object" && !Array.isArray(raw.slots) ? raw.slots : null;
    if (!src) errors.push("slots オブジェクトがありません");
    else {
      for (const key of TYPO_SLOTS) {
        const slot = src[key];
        if (!slot || typeof slot !== "object" || Array.isArray(slot)) continue;
        const family = str(slot.family, 40);
        if (!FAMILY_RE.test(family)) { if (slot.family !== undefined) errors.push(`slots.${key}.family が許可された Trk* 書体名ではありません`); continue; }
        const out = { family };
        const weight = Number(slot.weight);
        if (Number.isFinite(weight) && weight >= 100 && weight <= 900) out.weight = Math.round(weight / 100) * 100;
        const tracking = Number(slot.tracking), leading = Number(slot.leading);
        if (Number.isFinite(tracking) && tracking >= -0.02 && tracking <= 0.08) out.tracking = Math.round(tracking * 1000) / 1000;
        if (Number.isFinite(leading) && leading >= 0.9 && leading <= 2) out.leading = Math.round(leading * 100) / 100;
        const pack = typeof slot.pack === "string" ? slot.pack.trim() : "";
        if (pack) {
          if (PACK_PATH_RE.test(pack) && !pack.includes("..") && !pack.startsWith("/")) out.pack = pack;
          else errors.push(`slots.${key}.pack のパスが不正です（${str(pack, 60)}）`);
        }
        slots[key] = out;
      }
    }
    if (!slots.display && !slots.body) errors.push("display と body のどちらかは必要です");
    const required = Array.isArray(raw.requiredPacks) ? raw.requiredPacks : [];
    const packs = [];
    for (const p of required.slice(0, 30)) {
      const v = typeof p === "string" ? p.trim() : "";
      if (!PACK_PATH_RE.test(v) || v.includes("..") || v.startsWith("/")) { errors.push(`requiredPacks に不正なパスがあります（${str(v, 60)}）`); continue; }
      if (!packs.includes(v)) packs.push(v);
    }
    for (const key of Object.keys(slots)) {
      const pack = slots[key].pack;
      if (pack && packs.length && !packs.includes(pack)) warnings.push(`slots.${key}.pack が requiredPacks に載っていません（${pack}）`);
    }
    if (errors.length) return { ok: false, errors, warnings, pairing: null };
    const pairing = {
      id, name: str(raw.name, 60) || id, scale: str(raw.scale, 8) || "1.25",
      trkUse: str(raw.trkUse, 200), packs, slots,
      tracking: raw.tracking && typeof raw.tracking === "object" ? ownCopy(raw.tracking, TYPO_SLOTS.filter(k => typeof raw.tracking[k] === "number" && Number.isFinite(raw.tracking[k]))) : {},
      leading: raw.leading && typeof raw.leading === "object" ? ownCopy(raw.leading, TYPO_SLOTS.filter(k => typeof raw.leading[k] === "number" && Number.isFinite(raw.leading[k]))) : {},
      imported: true
    };
    return { ok: true, errors, warnings, pairing };
  }
  /* 不足している書体と、その書体を持つ .stpack の名前。
     `check` は「この書体は使えるか」を返す関数（テストから差し替えられる） */
  function missingPackReport(pairing, check) {
    const fonts = [], packs = [];
    if (!pairing || !pairing.slots) return { fonts, packs };
    const usable = typeof check === "function" ? check : () => null;
    const families = [];
    for (const key of TYPO_SLOTS) {
      const slot = pairing.slots[key];
      if (!slot || !slot.family) continue;
      if (families.includes(slot.family)) continue;
      families.push(slot.family);
      if (usable(slot.family) === false) {
        fonts.push(slot.family);
        if (slot.pack && !packs.includes(slot.pack)) packs.push(slot.pack);
      }
    }
    if (!packs.length && fonts.length && Array.isArray(pairing.packs)) packs.push(...pairing.packs);
    return { fonts, packs };
  }

  /* ---------- R-WIZ-1：Advance Wizard 設定・ユーザー辞書 ---------- */
  function validateAdvancePrefs(raw) {
    const errors = [], warnings = [];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, errors: ["設定データが JSON オブジェクトではありません"], warnings, advance: {}, dictionary: [] };
    if (raw.format !== ADVANCE_PREFS_FORMAT) errors.push(`format が "${ADVANCE_PREFS_FORMAT}" ではありません（${String(raw.format)}）`);
    if (raw.version !== 1) errors.push(`未対応の version です（${String(raw.version)}）`);
    const advance = {};
    if (raw.advance !== undefined && (!raw.advance || typeof raw.advance !== "object" || Array.isArray(raw.advance))) errors.push("advance オブジェクトの形が不正です");
    else {
      const src = raw.advance || {};
      const keys = Object.keys(src).slice(0, 60);
      for (const key of keys) {
        if (UNSAFE_KEYS.has(key)) { errors.push(`予約済みのキーです：${key}`); continue; }
        if (key.length > ADVANCE_KEY_MAX) { errors.push(`キーが長すぎます：${key.slice(0, 20)}…`); continue; }
        const value = src[key];
        const asText = typeof value === "string" ? value : String(value);
        if (FORBIDDEN_ADVANCE.test(key) || FORBIDDEN_ADVANCE.test(asText)) {
          errors.push(`使用禁止文字（\` \\ .. ~ C:）が含まれています：${key.slice(0, 24)}`);
          continue;
        }
        if (typeof value !== "boolean" && typeof value !== "string" && typeof value !== "number") {
          errors.push(`advance.${key} の型が不正です`);
          continue;
        }
        if (typeof value === "string" && value.length > 120) { warnings.push(`advance.${key} の文字を 120 文字までに切りました`); advance[key] = value.slice(0, 120); continue; }
        advance[key] = value;
      }
    }
    const dictionary = [];
    if (raw.dictionary !== undefined) {
      if (!Array.isArray(raw.dictionary)) errors.push("dictionary は配列で渡してください");
      else {
        if (raw.dictionary.length > ADVANCE_DICT_MAX) errors.push(`dictionary の件数が上限（${ADVANCE_DICT_MAX} 件）を超えています`);
        for (const word of raw.dictionary.slice(0, ADVANCE_DICT_MAX)) {
          if (typeof word !== "string" || !word.trim() || word.length > ADVANCE_WORD_MAX) { errors.push("dictionary に不正な語が含まれています"); break; }
          if (FORBIDDEN_ADVANCE.test(word)) { errors.push(`dictionary に使用禁止文字が含まれています：${word.slice(0, 24)}`); break; }
          if (!dictionary.includes(word.trim())) dictionary.push(word.trim());
        }
      }
    }
    return { ok: errors.length === 0, errors, warnings, advance, dictionary };
  }
  /* 統合マニフェスト（前方互換）。知らない futureSlots は**読み飛ばす**（エラーにしない） */
  function readLibraryManifest(raw) {
    const errors = [], warnings = [];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, errors: ["マニフェストが JSON オブジェクトではありません"], warnings, indices: {}, counts: {}, futureSlots: [] };
    if (raw.format !== LIBRARY_MANIFEST_FORMAT) errors.push(`format が "${LIBRARY_MANIFEST_FORMAT}" ではありません（${String(raw.format)}）`);
    if (raw.version !== 1) errors.push(`未対応の version です（${String(raw.version)}）`);
    const indices = {};
    if (!raw.indices || typeof raw.indices !== "object" || Array.isArray(raw.indices)) errors.push("indices オブジェクトがありません");
    else {
      for (const [key, entry] of ownEntries(raw.indices)) {
        if (!entry || typeof entry !== "object") continue;
        const path = str(entry.path, 160), sha256 = str(entry.sha256, 64).toLowerCase();
        if (!path || path.includes("..") || path.startsWith("/")) { warnings.push(`indices.${key}.path を読み飛ばしました`); continue; }
        indices[str(key, 40)] = { path, sha256: /^[0-9a-f]{64}$/.test(sha256) ? sha256 : "", bytes: Number.isFinite(entry.bytes) ? entry.bytes : 0 };
      }
    }
    const counts = {};
    if (raw.counts && typeof raw.counts === "object" && !Array.isArray(raw.counts)) {
      for (const [key, value] of ownEntries(raw.counts)) {
        if (Number.isFinite(value) && value >= 0) counts[str(key, 40)] = Math.floor(value);
      }
    }
    const futureSlots = [];
    if (raw.futureSlots && typeof raw.futureSlots === "object" && !Array.isArray(raw.futureSlots)) {
      for (const [key, value] of ownEntries(raw.futureSlots)) {
        const status = value && typeof value === "object" ? str(value.status, 40) : "";
        const count = value && typeof value === "object" && Number.isFinite(value.count) ? Math.floor(value.count) : 0;
        futureSlots.push({ id: str(key, 40), status, count });
      }
    }
    return { ok: errors.length === 0, errors, warnings, indices, counts, futureSlots, pwaBaseline: raw.pwaBaseline && typeof raw.pwaBaseline === "object" ? { build: str(raw.pwaBaseline.build, 40), commit: str(raw.pwaBaseline.commit, 64) } : null };
  }

  /* ---------- 補遺：re-modern 作品の退避（trk-re-modern-works-backup v1） ---------- */
  function validateRemodernWorksBackup(raw) {
    const errors = [], warnings = [];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, errors: ["退避ファイルが JSON オブジェクトではありません"], warnings, works: [] };
    if (raw.format !== REMODERN_WORKS_BACKUP_FORMAT) errors.push(`format が "${REMODERN_WORKS_BACKUP_FORMAT}" ではありません（${String(raw.format)}）`);
    if (raw.version !== 1) errors.push(`未対応の version です（${String(raw.version)}）`);
    if (!Array.isArray(raw.works)) return { ok: false, errors: errors.concat(["works 配列がありません"]), warnings, works: [] };
    if (raw.works.length > 20) errors.push("works の件数が上限（20 件）を超えています");
    const works = [];
    for (const work of raw.works.slice(0, 20)) {
      if (!work || typeof work !== "object" || Array.isArray(work)) { warnings.push("オブジェクトでない作品を飛ばしました"); continue; }
      works.push(ownCopy(work));
    }
    if (JSON.stringify(raw).length > REMODERN_BACKUP_MAX) errors.push("退避ファイルが大きすぎます（上限 1 MiB）");
    return { ok: errors.length === 0, errors, warnings, works, exportedAt: Number.isFinite(raw.exportedAt) ? raw.exportedAt : 0 };
  }

  const api = {
    SKIN_VOLUME_FORMAT, TYPOGRAPHY_PAIRING_FORMAT, TITLE_FONT_WORKS_FORMAT, ADVANCE_PREFS_FORMAT,
    LIBRARY_MANIFEST_FORMAT, REMODERN_WORKS_BACKUP_FORMAT,
    SKIN_IMPORT_FILE_MAX, SKIN_IMPORT_MAX, SKIN_VOLUME_ITEMS_MAX, TITLE_WORKS_BACKUP_MAX, TITLE_WORKS_ENTRIES_MAX,
    TYPO_PAIRING_MAX, ADVANCE_PREFS_MAX, ADVANCE_DICT_MAX, REMODERN_BACKUP_MAX,
    SKIN_COLOR_KEYS, GRADIENT_KEYS, SKIN_SHAPES, TYPO_SLOTS, FORBIDDEN_ADVANCE,
    isHex, isRgba, isColor, isFilter, gradientStops, cleanFont, cleanShapes, cleanLegacyColors,
    sanitizeVolumeSkin, validateVolumePayload, volumeSkinToDef, lookFromColors,
    validateTitleFontWorksEnvelope, validateTypographyPairing, missingPackReport,
    validateAdvancePrefs, readLibraryManifest, validateRemodernWorksBackup
  };
  window.Trk = window.Trk || {};
  window.Trk.libraryReceiver = api;
})();

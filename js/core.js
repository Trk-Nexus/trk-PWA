(() => {
// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ trk! 統合版：土台（設定・状態・共通処理・画面切り替え） ============
   ほかのファイルとは「合図」でつながります。
     on("language", fn)  言語が変わった
     on("skin", fn)      スキンが変わった
     on("chart", fn)     譜面・曲の読み込み状態が変わった
     on("phase", fn)     タイトル／プレイ中／一時停止／リザルトが変わった
     on("screen", fn)    選曲画面／設定画面などが切り替わった
     on("options", fn)   プレイオプション（MOD・AUTO・体力モードなど）が変わった
     on("beforePlay"/"beforeLoad"/"mediaReady"/"records"/"packsChanged", fn) */
"use strict";

const $ = id => document.getElementById(id);
const stage = $("stage"), video = $("video");
const view = $("view"), vctx = view.getContext("2d");
const fx = $("fx"), ctx = fx.getContext("2d");

/* 🖥 trk222：拡大率（50／75／100／125%）。ステージの「設計サイズ」を 1/拡大率 に縮めてから、
   その分だけ大きく描きます（＝中の文字とボタンが同じ比率で大きくなる）。
   ステージ全体は今までどおり画面に収まるので、はみ出して切れることがありません。
   ・ゲーム中（playing／paused）は拡大しません。盤面が欠けると遊べないためです。
   ・スマホ型の選曲画面は CSS が実ピクセルで並べるので、幅と高さは CSS に任せます（css/mobile-shell.css）。
   ・`settings` はこの関数より後に作られるので、まだ無いときは 100% として扱います。 */
function uiZoomFactor() {
  let scale = 100;
  try { scale = Number(settings && settings.uiScale); } catch (_) { scale = 100; }
  if (!Number.isFinite(scale) || scale <= 0) scale = 100;
  const z = scale / 100;
  if (z === 1) return 1;
  if (!document.body || !document.body.classList.contains("trk-zoom")) return 1;
  /* スマホ型は CSS が実ピクセルで並べる（拡大率は文字と余白だけに効かせる）ので、ステージは拡大しない */
  if (document.body.classList.contains("trk-mobile")) return 1;
  const phaseNow = stage.dataset.phase || "title";
  return phaseNow === "title" || phaseNow === "ended" ? z : 1;
}
function fitStage() {
  const W = window.Trk.data.W, H = window.Trk.data.H;
  const z = uiZoomFactor();
  /* スマホ型は幅と高さを CSS に任せる（選曲画面は実ピクセル・プレイ中は 1920×1080）。
     ここで幅を固定すると、スマホの画面からはみ出します。 */
  if (document.body && document.body.classList.contains("trk-mobile")) {
    stage.style.width = "";
    stage.style.height = "";
  } else if (z !== 1) { stage.style.width = `${W / z}px`; stage.style.height = `${H / z}px`; }
  else { stage.style.width = ""; stage.style.height = ""; }
  const s = Math.min(innerWidth / W, innerHeight / H) * z;
  stage.style.transform = `translate(-50%,-50%) scale(${s})`;
  /* 📐🧱 trk245：ステージの設計高さ（1080 / 拡大率）から、曲リストの高さと表示の密度を見直す。
     拡大率で縮めて設計が広くなったぶんはリストに返し、窓が狭いときは密度を詰める。 */
  if (document.documentElement && document.documentElement.style && typeof document.documentElement.style.setProperty === "function") {
    document.documentElement.style.setProperty("--trk-lib-h", `${libListHeight(H / z)}px`);
  }
  applyDensityClasses();
}
addEventListener("resize", fitStage);
/* ⏳ 最初の寸法合わせは、このファイルの最後（定義を読み終えた後）で 1 回だけ呼びます。
   2026-11-02 trk260：以前はここで呼んでいましたが、fitStage が使う LIB_LIST_MIN などは
   ファイルの後ろ（約 1800 行）で const 宣言しているため、先に走ると TDZ の
   「Cannot access 'LIB_LIST_MIN' before initialization」になり、core.js の残り
   （settings・文章の差し込み・画面の配線）が丸ごと止まっていました。
   ＝開いた直後が「枠だけ・文字なし・ボタンが効かない」になっていた原因です。 */

/* ---------- 合図（イベント） ---------- */
const HOOKS = {};
/* trk191: 購読の解除関数を返す（アドオンが teardown で離脱できるように・API v2）。
   戻り値を無視する従来の呼び出しはそのまま動く＝後方互換。 */
function on(name, fn) {
  (HOOKS[name] ||= []).push(fn);
  return () => {
    const a = HOOKS[name];
    const i = a ? a.indexOf(fn) : -1;
    if (i >= 0) a.splice(i, 1);
  };
}
function emit(name, ...args) {
  for (const fn of HOOKS[name] || []) { try { fn(...args); } catch (e) { console.error(e); } }
}
/* 🖥 trk222：拡大率はプレイ中だけ 100% に戻すので、フェーズが変わるたびに寸法を合わせ直す */
on("phase", fitStage);

/* ---------- 全画面の重ね表示が開いているか（名前空間の移行で、旧 window の旗 3 つ＝書斎・メディアプレーヤー・シンス を置き換え） ----------
   書く側：window.Trk.overlay.set("study", true)   読む側：window.Trk.overlay.is("study")
   どれか一つでも開いているか：window.Trk.overlay.any()   名前は "study"（書斎）・"media"（メディアプレーヤー）・"synth"（シンス）・"cli"（⌨ ターミナル・trk267） */
const TRK_OVERLAY_OPEN = { study:false, media:false, synth:false, cli:false };
const trkOverlayHas = name => Object.prototype.hasOwnProperty.call(TRK_OVERLAY_OPEN, name);
window.Trk = window.Trk || {};
window.Trk.overlay = {
  set(name, open) { if (trkOverlayHas(name)) TRK_OVERLAY_OPEN[name] = !!open; },
  is(name) { return trkOverlayHas(name) && TRK_OVERLAY_OPEN[name] === true; },
  any() { return Object.keys(TRK_OVERLAY_OPEN).some(k => TRK_OVERLAY_OPEN[k] === true); },
};
/* 互換：js/fx.js（凍結のため書き換えない）はまだ window._trkStudyRoomOpen を読む。読み取り専用で、書斎の開閉を映す */
Object.defineProperty(window, "_trkStudyRoomOpen", { configurable: true, get: () => TRK_OVERLAY_OPEN.study === true });

/* ---------- カスタムスキン（設定より先に読み込む） ---------- */
const CUSTOM_SKINS_KEY = "shadow_taiko_custom_skins_v1", CUSTOM_SKIN_MAX = 20, SKIN_FORMAT = "skin.shadow-taiko";
const customSkinDefs = {};
function saveCustomSkins() { try { localStorage.setItem(CUSTOM_SKINS_KEY, JSON.stringify(customSkinDefs)); } catch (_) {} }
(function loadCustomSkins() {
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem(CUSTOM_SKINS_KEY)) || {}; } catch (_) {}
  for (const [id, d] of Object.entries(raw)) {
    if (!/^custom_[a-z0-9]+$/.test(id)) continue;
    const def = window.Trk.data.sanitizeSkinDef(d);
    if (def) { customSkinDefs[id] = def; window.Trk.data.SKINS[id] = window.Trk.data.buildCustomSkin(def); }
  }
})();

/* ---------- 設定（以前のバージョンの保存内容も引き継ぐ） ----------
   保存場所の名前（shadow_taiko_…）は、これまでのデータを引き継ぐため変えていません。
   各モードの細かい設定（ORBITの見た目・STAGEの譜面・CATCHのキーなど）は、それぞれのファイルが追加します。 */
const PREFS_KEY = "shadow_taiko_preferences_v2", OLD_PREFS_KEY = "shadow_taiko_preferences_v1", BEST_KEY = "shadow_taiko_best_v1";
/* 設定JSONの読み込み上限。⚙ → 💾 端末の保存 から自分の書き出しを読み戻せるように、
   まるごとバックアップ（js/backup.js の MAX_LS_VALUE＝local.json 20 MiB）と同じ目盛りにした。
   2 MiB のころは、ノーツ設定の多い人が書き出したファイルを自分で読み返せなかった。 */
const PREFS_IMPORT_MAX = 20 * 1024 * 1024;
let prefs = {};
try { prefs = JSON.parse(localStorage.getItem(PREFS_KEY)) || JSON.parse(localStorage.getItem(OLD_PREFS_KEY)) || {}; } catch (_) { prefs = {}; }
if (!prefs || typeof prefs !== "object") prefs = {};
const pick = (v, list, def) => list.includes(v) ? v : def;
const VIDEO_STYLE_IDS = typeof TRK_TV_PRESETS !== "undefined" && Array.isArray(TRK_TV_PRESETS)
  ? TRK_TV_PRESETS.map(p => p && p.id).filter(id => typeof id === "string")
  : ["skin", "color", "mono", "dim", "off"];
const num = (v, lo, hi, def) => (typeof v === "number" && isFinite(v)) ? Math.min(hi, Math.max(lo, v)) : def;
/* 🧺 trk229：スキンの棚の整理に使う保存値の掃除（壊れた値・長すぎる値を落とす）。
   id は本体・カスタム・パックのスキンで形が違うので、使う文字だけを見ます。 */
const SKIN_ID_RE = /^[A-Za-z0-9_.-]{1,48}$/;
function cleanSkinIdList(v, max = 400) {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter(x => typeof x === "string" && SKIN_ID_RE.test(x)))].slice(0, max);
}
function cleanSkinMap(v, max = 400) {
  const out = {};
  if (!v || typeof v !== "object") return out;
  for (const [k, n] of Object.entries(v)) {
    if (!SKIN_ID_RE.test(k) || typeof n !== "number" || !isFinite(n) || n < 0) continue;
    out[k] = Math.round(Math.min(n, 1e9));
    if (Object.keys(out).length >= max) break;
  }
  return out;
}
/* ⌨ trk267：ターミナルで覚えた呪文（マクロ）の掃除。
   名前は英小文字・数字・- の 24 文字まで、中身は 200 文字まで・24 本まで。
   壊れた値は落とす（読むときに js/cli.js も同じ形に寄せます）。 */
function cleanCliSpells(v) {
  const out = {};
  if (!v || typeof v !== "object" || Array.isArray(v)) return out;
  for (const [id, body] of Object.entries(v)) {
    if (!/^[a-z0-9][a-z0-9-]{0,23}$/.test(id)) continue;
    if (typeof body !== "string") continue;
    const text = body.trim().slice(0, 200);
    if (!text) continue;
    out[id] = text;
    if (Object.keys(out).length >= 24) break;
  }
  return out;
}
const clampTvDim = v => Number((Math.round(num(v, 0, .9, 0) * 20) / 20).toFixed(2));
const clampTvBlur = v => Math.round(num(v, 0, 12, 0));
const TV_PARAM_FAV_MAX = 8;
function cleanTvParamFavorites(v) {
  if (!Array.isArray(v)) return [];
  const out = [], seen = new Set();
  for (const item of v) {
    if (!item || typeof item !== "object" || !Number.isFinite(item.dim) || !Number.isFinite(item.blur)) continue;
    const dim = clampTvDim(item.dim), blur = clampTvBlur(item.blur), key = `${dim.toFixed(2)}:${blur}`;
    if (seen.has(key)) continue;
    seen.add(key); out.push({ dim, blur });
    if (out.length >= TV_PARAM_FAV_MAX) break;
  }
  return out;
}
/* 🗑 消した trk の自動リストのID（library.js が作り直さないための印）。trk- で始まるIDだけ、重複なし・200件まで */
function cleanTrkRemoved(v) {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter(x => typeof x === "string" && /^trk-[A-Za-z0-9_-]{1,40}$/.test(x)))].slice(-200);
}
/* 📦 パックを外したときに戻すための退避（custom.js が使い、設定として保存する）。形が違うものは捨てる。
   prev＝パックを当てる前の値、applied＝パックが実際に当てた値（利用者がその間に変えた項目は戻さないための目印）。 */
function cleanPackPrev(v) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  if (typeof v.skin !== "string" || !v.skin || v.skin.length > 64) return null;
  if (typeof v.fxPower !== "number" || !Number.isFinite(v.fxPower)) return null;
  const fxPower = num(v.fxPower, 0, 3, null);   /* 設定画面のスライダーと同じ範囲（0〜3）に丸める */
  if (fxPower === null) return null;
  if (!Array.isArray(v.notes) || v.notes.length !== 2) return null;
  const notes = v.notes.map(n => ({ color: (n && typeof n.color === "string") ? n.color.slice(0, 24) : "",
    shape: (n && typeof n.shape === "string") ? n.shape.slice(0, 12) : "" }));
  const rawApplied = (v.applied && typeof v.applied === "object" && !Array.isArray(v.applied)) ? v.applied : {};
  const applied = {};
  if (typeof rawApplied.skin === "string" && rawApplied.skin) applied.skin = rawApplied.skin.slice(0, 64);
  if (typeof rawApplied.fxPower === "number" && Number.isFinite(rawApplied.fxPower)) applied.fxPower = num(rawApplied.fxPower, 0, 3, 1.5);
  if (rawApplied.seEnabled === true) applied.seEnabled = true;
  if (Array.isArray(rawApplied.notes) && rawApplied.notes.length === 2) {
    applied.notes = rawApplied.notes.map(n => ({ color: (n && typeof n.color === "string") ? n.color.slice(0, 24) : "",
      shape: (n && typeof n.shape === "string") ? n.shape.slice(0, 12) : "" }));
  }
  return { skin: v.skin, notes, fxPower, seEnabled: v.seEnabled === true, applied };
}
function guessLang() {
  const l = (navigator.language || "en").toLowerCase();
  return l.startsWith("ja") ? "ja" : l.startsWith("zh") ? "zh" : l.startsWith("ko") ? "ko" : "en";
}

/* キー：メイン2つ（左・右）＋サブ2つ。初期設定は A（ドン）／Space（カッ） */
const KEY_PRESETS = {
  standard:{ label:"keyPresetDefault", keys:["KeyA", "Space"], sub:["", ""] },
  taiko:   { label:"keyPresetTaiko",   keys:["KeyF", "KeyD"],  sub:["KeyJ", "KeyK"] },
  /* 🕹 アーケード筐体・自作コントローラー（1・2ボタン）／📺 TVリモコン（← →） */
  arcade:  { label:"keyPresetArcade",  keys:["Digit1", "Digit2"], sub:["", ""] },
  remote:  { label:"keyPresetRemote",  keys:["ArrowLeft", "ArrowRight"], sub:["", ""] }
};
const validCode = k => typeof k === "string" && /^[A-Za-z0-9]{1,24}$/.test(k);
/* 🎮 パッドの割り当て（js/pad.js）：ボタン＝"b0"、軸＝"a0+"（＋方向）／"a0-"（−方向）。
   スティック・D-pad（軸で届く機種）・アケコンのレバーも、この1つの形で表します。 */
const validPadBind = b => typeof b === "string" && /^[ba]\d{1,2}[+-]?$/.test(b) && !(b[0] === "b" && /[+-]$/.test(b));
const padBindOr = (v, d) => (validPadBind(v) ? v : d);
const PAD_DEFAULTS = { left:"b0", right:"b1", confirm:"b0", back:"b1", pause:"b9" };
/* TVリモコン・メディアキーは e.code が空で e.key だけ届くことがあります（逆に e.code が名前の機種も）。
   ノーツや移動キーの割り当ては、この関数の値で判定します。 */
function keyCodeOf(e) {
  if (!e) return "";
  if (e.code) return e.code;
  const k = e.key || "";
  return /^[A-Za-z0-9]{1,24}$/.test(k) ? k : "";
}
const VIDEO_KEY_DEFAULTS = ["NumpadAdd", "NumpadSubtract", "NumpadMultiply", "NumpadDivide", "Numpad0", "Numpad9", "Numpad8", "Numpad7"];
const savedVideoKeys = Array.isArray(prefs.videoKeys) && prefs.videoKeys.length === VIDEO_KEY_DEFAULTS.length &&
  prefs.videoKeys.every(validCode) && new Set(prefs.videoKeys).size === VIDEO_KEY_DEFAULTS.length ? prefs.videoKeys.slice()
  : Array.isArray(prefs.videoKeys) && [5, 7].includes(prefs.videoKeys.length) && prefs.videoKeys.every(validCode) && new Set(prefs.videoKeys).size === prefs.videoKeys.length
    ? [...prefs.videoKeys, ...VIDEO_KEY_DEFAULTS.slice(prefs.videoKeys.length)] : VIDEO_KEY_DEFAULTS.slice();
/* ⌨ trk276：📚 のキー操作の既定。4 方向を別々に持ち、重複したら既定へ戻します */
const VOL_KEY_DEFAULTS = { L: "ArrowLeft", R: "ArrowRight", U: "ArrowUp", D: "ArrowDown" };
function volKeyBoot(p) {
  const out = {}, used = new Set();
  for (const k of ["L", "R", "U", "D"]) {
    const v = p && p["skinVolKey" + k];
    if (validCode(v) && !used.has(v)) { out["skinVolKey" + k] = v; used.add(v); }
    else { out["skinVolKey" + k] = VOL_KEY_DEFAULTS[k]; used.add(VOL_KEY_DEFAULTS[k]); }
  }
  return out;
}
const bootKeys = (Array.isArray(prefs.keys) && prefs.keys.length === 2 && prefs.keys.every(validCode) && prefs.keys[0] !== prefs.keys[1])
  ? prefs.keys.slice() : KEY_PRESETS.standard.keys.slice();
const bootSub = [0, 1].map(i => { const k = Array.isArray(prefs.subKeys) ? prefs.subKeys[i] : ""; return validCode(k) && !bootKeys.includes(k) ? k : ""; });
if (bootSub[0] && bootSub[0] === bootSub[1]) bootSub[1] = "";

const PLAY_MODES = ["manual", "truck", "orbit", "stage", "catch"];
const savedSkinAtBoot = typeof prefs.skin === "string" ? prefs.skin : "";   // パックのスキンは後から復元
/* 🪶 軽量化の許可リスト。ここで決め打ちできるので、辞書の読み込み状況に左右されない。
   ⚠ js/lite.js はこの値を { "60":60, … }[settings.liteFps] || 30 の形で数値へ写す。
     未知の文字列（継承キーの "constructor" など）が入ると Object 関数が truthy で返り、
     || 30 の保険が効かずにゲート間隔が NaN になる＝軽量化が一瞬効かなくなる（M-02）。 */
const LITE_ENUM_VALUES = {
  liteMode: ["off", "auto", "on"],
  liteFps: ["60", "30", "20"],
  liteMascot: ["60", "30", "15", "off"],
  liteScale: ["device", "1.5", "1"],
  liteLibRows: ["device", "150", "60"]      // 🪶 曲リストが初回に描く行数
};
/* 🐔 trk's playlist のタブ表示名（3種類）。名前が長いのを嫌う人向けに短くできる。
   "icon" は文字を出さない（🐔 のアイコンだけ）。名前と色は固定なので、ここで選べるのは表示名だけ。 */
const TRK_ENUM_VALUES = {
  trkTabName: ["full", "short", "icon"],
  chartGen: ["1", "2", "3", "4"], // 🎼 1・2は旧方式、3はAタイプ（従来）、4はBタイプ（既定。遊びの文法。js/chart-gen.js）
  mediaKeepLimit: ["1g", "5g", "unlimited"] // 🎵 保存棚の上限（ブラウザー側の容量上限は別に適用）
};
/* ⚖ trk279・trk281：⚙ の「段」。**見せる量**を選ぶだけで、値は変えません（js/settings-level.js が読みます）。
   1＝シンプル／2＝スタンダード（既定）／3＝プロ／4＝マスター／5＝ウィザード
   （ウィザードは一番上。スキンの「wizard」もここでだけ棚に出ます）. */
const SET_LEVELS = ["simple", "standard", "pro", "master", "wizard"];

/* 🧭 チュートリアルのスタンプを読み込む（trk140）。既知の8つだけを残し、重複を除く。旧「曲を選ぶ」song は play へ引き継ぐ。 */
function tutorialStampsFrom(raw) {
  const known = ["play", "look", "safe", "back", "amp", "study", "studyBack", "seed"];
  const list = Array.isArray(raw) ? raw : [];
  return [...new Set(list.map(x => x === "song" ? "play" : x))].filter(x => known.includes(x));
}
const settings = {
  language: pick(prefs.language, ["ja", "en", "zh", "ko"], guessLang()),
  skin: has(window.Trk.data.SKINS, prefs.skin) ? prefs.skin : (prefs.skin === "dark" ? "shadow" : prefs.skin === "light" ? "daylight" : "shadow"),
  ignoreStorageLimits: prefs.ignoreStorageLimits === true,   // 📦 容量の上限を無視（trk137。既定オフ。アプリが決めた上限だけを外す）
  mediaKeepLimit: pick(prefs.mediaKeepLimit, TRK_ENUM_VALUES.mediaKeepLimit, "1g"), // 🎵 明示保存する曲・動画の合計上限
  mediaKeepOverCapNotice1: prefs.mediaKeepOverCapNotice1 === 1 ? 1 : 0, // 既存保存棚が新上限を超える場合の一度限りの起動通知
  skinShelfOpen: prefs.skinShelfOpen !== false,      // 🖼 スキンの棚の開閉（30種＋カスタムでも設定画面が膨らまないように）
  skinShelfCat: pick(prefs.skinShelfCat, ["all","basic","type","miku","dark","light","grad","fun","access","life","custom"], "all"),
  /* 🧺 trk229：棚の整理。⭐お気に入り・🚫隠した・使用回数・最後に使った日時・並び順・絞り込み（すべてこの端末だけ） */
  skinShelfOnly: pick(prefs.skinShelfOnly, ["", "fav", "recent", "hidden"], ""),
  skinSort: pick(prefs.skinSort, ["default", "name", "used", "recent"], "default"),
  /* 📚 trk274：棚の「巻」。"" は**定番＋ウィザードだけ**（vol.1〜10・glitch は選んだときだけ出す）。
     "all" は全部。ほかは巻の id（vol-01 など）。新しい保存キーは作らず、この中に入れます */
  skinShelfVol: typeof prefs.skinShelfVol === "string" ? prefs.skinShelfVol.slice(0, 24) : "",
  /* ⌨ trk276：📚 のパネルをキーで動かす（使わない・読み方向・4 つのキー）。
     新しい保存キーは作らず、settings の中に入れます（工場出荷で既定に戻ります） */
  skinVolNav: prefs.skinVolNav === "off" ? "off" : "on",
  skinVolDir: prefs.skinVolDir === "col" ? "col" : "row",
  /* 端まで行ったとき：stop＝端で止まる（既定）／wrap＝反対側へ回り込む／chain＝次の本へ続ける（連読） */
  skinVolWrap: prefs.skinVolWrap === "chain" ? "chain"
    : (prefs.skinVolWrap === "wrap" || prefs.skinVolWrap === "on") ? "wrap" : "stop",
  ...volKeyBoot(prefs),
  skinFav: cleanSkinIdList(prefs.skinFav),
  skinHidden: cleanSkinIdList(prefs.skinHidden),
  skinUse: cleanSkinMap(prefs.skinUse),
  skinLast: cleanSkinMap(prefs.skinLast),
  layout: pick(prefs.layout ?? prefs.gameplayLayout, Object.keys(window.Trk.data.LAYOUTS), "classic"),
  videoStyle: pick(prefs.videoStyle, VIDEO_STYLE_IDS, "skin"),
  videoZoom: num(prefs.videoZoom, .5, 3, 1),
  /* 🔍 trk212：全画面表示の動画を、マウスホイール1回で何%拡大・縮小するか（2／5／10。既定5）。
     js/video-max.js が 2/5/10 のどれかへ寄せて使う（壊れた値・未設定は5）。 */
  videoMaxWheelStep: num(prefs.videoMaxWheelStep, 1, 20, 5),
  /* 🎬 trk262：映像を見るときの操作パネルの出かた（full／bottom／always／none。既定は今までどおり full）。
     値の寄せ方は js/viewer-chrome.js が持ち、🖥 全画面ビューアと ▶ メディアプレーヤーが同じ設定を見る。 */
  videoMaxChrome: pick(prefs.videoMaxChrome, ["full", "bottom", "always", "none"], "full"),
  videoKeys: savedVideoKeys,
  castPolicy: pick(prefs.castPolicy, ["off", "antenna"], "off"),
  backgroundPolicy: pick(prefs.backgroundPolicy, ["off", "antenna", "corner"], prefs.castPolicy === "antenna" ? "antenna" : "off"),
  bgDim: clampTvDim(prefs.bgDim),
  bgBlur: clampTvBlur(prefs.bgBlur),
  tvParamFavs: cleanTvParamFavorites(prefs.tvParamFavs),
  scroll: num(prefs.scroll, .5, 2.5, 1.2),
  latency: num(prefs.latency, -300, 500, 0),
  /* プレイ方法：以前の「AUTO」モードは「MANUAL＋AUTOオン」に引き継ぐ */
  playMode: pick(prefs.playMode, PLAY_MODES, "manual"),
  autoPlay: prefs.autoPlay === true || prefs.playMode === "auto",
  difficulty: pick(prefs.difficulty, window.Trk.data.DIFF_IDS, "normal"),
  showMasterDiff: !!prefs.showMasterDiff,
  escNoReturn: prefs.escNoReturn === true,   /* ❓謎設定：Esc長押しで選曲へ戻らない（既定はオフ＝長押しで戻る） */
  /* 🚪 メディアプレイヤーを抜けたときに曲を読み込み直すか（trk206）。既定はオフ＝そのまま流れ続ける
     （メディアプレイヤーへ入るときと同じで、曲が途切れない。エフェクトを触っても音が消えない）。
     オンにすると昔の動き＝閉じたときに止めて、プレビューの開始位置から鳴らし直す（不具合の再現用）。 */
  mediaReloadOnExit: prefs.mediaReloadOnExit === true,
  judgeOrdered: prefs.judgeOrdered === true, /* ❓謎設定：MANUALの判定を昔のやり方（時刻順・色違いは常にMISS）にする（既定はオフ＝js/judge-match.js の "smart"） */
  /* ❓謎設定：🧊フリーズ（凍結）の解除をワンタップにする（trk215）。既定はオフ＝🔒を3秒長押しで解除する。
     凍結は「守る」ための仕組みなので、一括で管理・解除したい人向けの暫定の抜け道として置く。 */
  favQuickUnfreeze: prefs.favQuickUnfreeze === true,
  /* ⭐ お気に入りのフォルダ（1軍／2軍／🧊フリーズ／📤元お気に入り・📌ピン・凍結）の保存先（trk215）。
     1軍だけはこれまでどおり tvFav／fxFav／songFav。js/favs.js が保存のたびに書き込みます。 */
  favs: (prefs.favs && typeof prefs.favs === "object" && !Array.isArray(prefs.favs)) ? prefs.favs : {},
  artWallpaperBg: prefs.artWallpaperBg === true,                     // 🖼 静止画を全画面へ拡大（オフは譜面中は右上、他は原寸以下で動画枠中央）
  useStudyArtwork: prefs.useStudyArtwork === true,                   // 📚 書斎で割り当てた画像をTV／ゲーム背景にも使う（既定オフ）
  hideArtworkDuringChart: prefs.hideArtworkDuringChart === true,     // 🎼 譜面中は静止画を隠す（既定オフ）
  /* 🎼 自動譜面の作り方（trk216）：既定は **Bタイプ＝方式4**。3は Aタイプ（従来）、旧方式1・2は旧譜面の再生成用。
     一度でもこの設定を選んだ人（chartGenChosen）は、その選択をそのまま使う。既定が A だったころの保存値
     （"3"）は「選んだ」とみなさない＝アップデート後は B へ移る（A のままにしたい人は設定で選び直せる）。 */
  chartGenChosen: prefs.chartGenChosen === true,
  chartGen: prefs.chartGenChosen === true ? pick(prefs.chartGen, ["1", "2", "3", "4"], "4") : "4",
  seed: typeof prefs.seed === "string" ? prefs.seed.slice(0, 32) : "834271",   // 曲ごとの設定がない曲の初期値
  bpm: num(prefs.bpm, 60, 300, 138),
  offset: num(prefs.offset, -5000, 5000, 0),
  reverseHands: !!prefs.reverseHands,
  hideGameplayUI: !!prefs.hideGameplayUI,
  playerMode: !!prefs.playerMode,
  /* 🖥 trk221：画面の形。auto＝端末に合わせる／desktop＝PC型／mobile＝スマホ型
     （PCでも縦型のスタンドや小さい窓で使うときは mobile、大きいタブレットは desktop を選べる） */
  uiMode: pick(prefs.uiMode, ["auto", "desktop", "mobile"], "auto"),
  /* 🎵 trk221：下に出す再生バー。on＝つねに／auto＝曲を選んだら／off＝出さない
     （trk222：既定を on に。前回聞いていた曲を、そのままバーに出しておける） */
  playerBar: pick(prefs.playerBar, ["on", "auto", "off"], "on"),
  /* 🎵 trk225：再生バーを下のどこに置くか（スマホ型のとき）。
     bottom＝画面のいちばん下（操作パネルはバーの上へ）／above＝操作パネルの上（trk221〜trk224 と同じ） */
  playerBarPos: pick(prefs.playerBarPos, ["bottom", "above"], "bottom"),
  /* 🔒 trk225：再生バーを隠さない（バーの ✕ を出さない。誤って消す対策。既定オフ） */
  playerBarLock: prefs.playerBarLock === true,
  /* ❓ trk226：バーに触れても位置を移動しない（既定オフ＝触れれば動く。❓謎設定） */
  playerBarSeekLock: prefs.playerBarSeekLock === true,
  /* ❓ trk227：リピートボタンを単曲リピートのみにする（既定オフ＝なし→1曲→全曲→なし） */
  playerBarRepeatOneOnly: prefs.playerBarRepeatOneOnly === true,
  /* ❓ trk227：シャッフルは、いまの一覧（プレイリスト）の中から選ぶ（既定オフ＝ライブラリ全体から） */
  playerBarShuffleInList: prefs.playerBarShuffleInList === true,
  /* 🖥 trk222：画面の拡大率（%）。50／75／100／125 の4つだけ。ゲーム中は 100% のまま */
  uiScale: pick(prefs.uiScale, [50, 75, 100, 125], 100),
  /* 🖥 trk222：拡大率を変えても、アイコンの大きさは 100% のまま固定する（既定オン） */
  fixedIconSize: prefs.fixedIconSize !== false,
  /* 🧱 trk244：表示の密度（ゆったり／ふつう／ぎゅっと／ぎっしり）。
     `uiScaleCompact` がオンのあいだは、拡大率（125/100/75/50%）が**密度の段**になります
     （縮小＝文字を小さくする、ではなく「詰めて多く見せる」）。 */
  uiDensity: pick(prefs.uiDensity, ["auto", "roomy", "normal", "compact", "dense"], "auto"),
  /* 🔤 trk246：書体の組み合わせ（見出し＋本文の2役）。未選定は null。
     相手の目録の書式をそのまま使えるようにして、知らない項目は sanitize() が落とします。 */
  typography: (window.Trk && window.Trk.typography && window.Trk.typography.sanitize(prefs.typography)) || null,
  /* 🧱 trk244：縮小（75%・50%）を「詰めて多く見せる」に使う（既定オン＝文字は小さくしない） */
  uiScaleCompact: prefs.uiScaleCompact !== false,
  /* 🖥 trk222：右上の 📱／🖥 で選んだ画面の形を、次に開いたときも使い続ける（❓謎設定） */
  uiModeLock: prefs.uiModeLock !== false,
  /* 🎛 trk222：スマホ型で、エフェクトの欄をライブラリにも出す（エフェクトのタブには常に出る） */
  fxInLibrary: prefs.fxInLibrary === true,
  helpText: prefs.helpText !== false,
  tutorialDone: prefs.tutorialDone === true,
  welcomeSeen: prefs.welcomeSeen === true,   /* 👋 「trk!にようこそ！」を閉じた（一度だけ出す） */
  /* 🔄 trk255：新しい版の知らせ（画面の下の帯）。
     swUpdateNotice が false なら帯を出さない（設定の「新しい版を確かめる」はいつでも使える）。
     swUpdateSnooze は「あとで」を押した時刻＋24時間（0＝眠らせていない）。
     ⚠ どちらも core.settings の中なので **localStorage のキーは増やしません**。 */
  swUpdateNotice: prefs.swUpdateNotice !== false,
  swUpdateSnooze: num(prefs.swUpdateSnooze, 0, 8.64e15, 0),
  tutorialStamps: tutorialStampsFrom(prefs.tutorialStamps),   /* 🧭 スタンプ（順番自由・8つでごほうび。旧「曲を選ぶ」は「曲を流す」へ引き継ぐ） */
  skinGradUnlocked: prefs.skinGradUnlocked === true,
  menuKey: validCode(prefs.menuKey) ? prefs.menuKey : "KeyM",
  menuConfirm: prefs.menuConfirm !== false,
  mediaExitKey: validCode(prefs.mediaExitKey) ? prefs.mediaExitKey : "Escape",
  mediaExitConfirm: prefs.mediaExitConfirm !== false,
  errorMeter: prefs.errorMeter !== false,
  keys: bootKeys,
  subKeys: bootSub,
  /* 🎮 ゲームパッド・コントローラー（読み込みは js/pad.js） */
  padEnabled: prefs.padEnabled !== false,
  padMenuNav: prefs.padMenuNav !== false,
  padLeft: padBindOr(prefs.padLeft, PAD_DEFAULTS.left),
  padRight: padBindOr(prefs.padRight, PAD_DEFAULTS.right),
  padConfirm: padBindOr(prefs.padConfirm, PAD_DEFAULTS.confirm),
  padBack: padBindOr(prefs.padBack, PAD_DEFAULTS.back),
  padPause: padBindOr(prefs.padPause, PAD_DEFAULTS.pause),
  seEnabled: !!prefs.seEnabled,
  seVolume: num(prefs.seVolume, 0, 1, .28),
  musicVolume: num(prefs.musicVolume, 0, 1, .7),
  musicVolumeRestore: num(prefs.musicVolumeRestore, .01, 1,
    typeof prefs.musicVolume === "number" && prefs.musicVolume > 0 ? prefs.musicVolume : .7),
  midiSoundProfile: typeof prefs.midiSoundProfile === "string" ? prefs.midiSoundProfile.slice(0, 40) : "studio_gm", // 🎹 コード生成のMIDI音色プロフィール
  midiMixEnabled: prefs.midiMixEnabled === true,                             // 🎚 通常音声にもかけるTRK MIDI MIX（初期オフ）
  midiMixProfile: typeof prefs.midiMixProfile === "string" ? prefs.midiMixProfile.slice(0, 40) : "studio_gm",
  midiMixOpen: prefs.midiMixOpen !== false,                                 // 左下パネルは初回に開く（処理自体はオフ）
  bannerPause: prefs.bannerPause === true,                                   // ⏯ 右上の曲名バナーをタップで一時停止（初期オフ）
  bannerSongBtns: prefs.bannerSongBtns !== false,                            // ◀▶ バナー右端の曲送りボタン（初期オン）
  bannerRandomBtn: prefs.bannerRandomBtn !== false,                          // 🎲 バナー右端のおまかせボタン（初期オン）
  bannerRandomTap: prefs.bannerRandomTap === true,                           // 🎲 タップだけで変える（初期オフ＝長押し）
  showMoreBtns: prefs.showMoreBtns !== false,                                // 👆 長押しの代わりのボタン（🎶・▶）を出す（初期オン）
  displayMode: prefs.displayMode === "full" ? "full" : "simple",            // 表示の並び：simple＝かんたん（おすすめ順・初期）／full＝全部（従来の順）
  devView: prefs.devView === true,                                           // 🔧 開発者表示（ループ・ラボ、投稿者ツールを出す。初期オフ）
  /* 🪶 軽量化（スマホ・タブレット・アプリ向け。読み込みは js/lite.js） */
  liteMode: pick(prefs.liteMode, LITE_ENUM_VALUES.liteMode, "auto"),         // 自動＝端末・省データ・電池を見て決める
  liteFps: pick(prefs.liteFps, LITE_ENUM_VALUES.liteFps, "30"),              // 描画のフレームレート上限
  liteMascot: pick(prefs.liteMascot, LITE_ENUM_VALUES.liteMascot, "30"),     // 🩷 3Dマスコット（MMD／VRM）の描画レート
  liteScale: pick(prefs.liteScale, LITE_ENUM_VALUES.liteScale, "1.5"),       // 描画解像度（devicePixelRatio）の上限
  liteSpectrumOff: prefs.liteSpectrumOff !== false,                          // 📊 軽量化モード中はスペクトラムを止める
  liteFx: prefs.liteFx !== false,                                            // 軽量化モード中はぼかし・すりガラスを減らす
  liteBlur: prefs.liteBlur !== false,                                        // 軽量化モード中は映像のぼかしを最大2pxに
  liteDecor: prefs.liteDecor !== false,                                      // 軽量化モード中は動き続ける装飾（📡ドックのキャラ等）を間引く
  liteLibRows: pick(prefs.liteLibRows, LITE_ENUM_VALUES.liteLibRows, "device"),  // 🪶 曲リストの初回表示行数（device＝制限なし）
  liteNoAnalyze: prefs.liteNoAnalyze === true,                               // 軽量化モード中は曲の音声解析をしない（譜面はBPM中心）
  liteMascotNoLoad: prefs.liteMascotNoLoad === true,                         // 軽量化モード中は3Dマスコットを自動で読み込まない
  liteSeen: prefs.liteSeen === true,                                         // 📱 スマホ向けの初回案内を出したか
  liteGameFull: prefs.liteGameFull === true,                                 // 🎯 ゲーム中は描画を軽くしない（ゲーム優先・初期オフ）
  /* 🎹 シンセ演奏モード */
  synthModeDisabled: !!prefs.synthModeDisabled,
  synthModeFastStart: !!prefs.synthModeFastStart,
  synthModeKeyboardLock: prefs.synthModeKeyboardLock !== false,
  synthModeWideKeyboard: !!prefs.synthModeWideKeyboard,
  /* 🎹 trk261：鍵盤の広さ（25／49／61／88）と幅の合わせ方（fit／scroll／shrink）、MIDI の自動接続 */
  synthModeKeyRange: ["25", "49", "61", "88"].includes(String(prefs.synthModeKeyRange)) ? String(prefs.synthModeKeyRange) : "25",
  synthModeKeyFit: ["fit", "scroll", "shrink"].includes(prefs.synthModeKeyFit) ? prefs.synthModeKeyFit : "fit",
  synthMidiAuto: prefs.synthMidiAuto !== false,
  notes: window.Trk.data.sanitizeNotes(prefs.notes ?? (prefs.skin === "clarity" ? window.Trk.data.NOTE_PRESETS.clarity : null)),
  mascot: pick(prefs.mascot, ["skin", "none", ...window.Trk.data.MASCOT_IDS], "skin"),
  fxPower: num(prefs.fxPower, 0, 3, 1.5),
  gameFxMode: pick(prefs.gameFxMode, ["full", "soft", "off"], "full"),
  vrmFrame: pick(prefs.vrmFrame, ["full", "upper", "face"], "full"),
  vrmTurn: num(prefs.vrmTurn, -60, 60, -20),
  vrmRemember: prefs.vrmRemember !== false,
  vrmMotionBpm: num(prefs.vrmMotionBpm, 0, 300, 0),
  /* 🩷 MMD（モデルは同梱しません。読み込んだものは端末内だけに保存） */
  mmdAgreed: !!prefs.mmdAgreed,
  mmdRemember: prefs.mmdRemember !== false,
  mmdScale: num(prefs.mmdScale, .5, 1.8, 1),
  mmdTurn: num(prefs.mmdTurn, -60, 60, 0),
  mmdMotionBpm: num(prefs.mmdMotionBpm, 0, 300, 0),
  mmdMotionKind: typeof prefs.mmdMotionKind === "string" && prefs.mmdMotionKind !== "file" ? prefs.mmdMotionKind : "faceSing",  // 🩷 選んだ内蔵モーション（mmd.js が実在を検証）
  mmdQuickUI: prefs.mmdQuickUI !== false,                                                     // 🩷 選曲画面のモーションミニ操作
  mmdMotionFavs: Array.isArray(prefs.mmdMotionFavs) ? prefs.mmdMotionFavs.filter(x => typeof x === "string").slice(0, 50) : [],  // 🩷 ⭐お気に入りモーション
  mmdCredit: typeof prefs.mmdCredit === "string" ? prefs.mmdCredit.slice(0, 120) : "",
  activePack: typeof prefs.activePack === "string" ? prefs.activePack : null,
  packPrev: cleanPackPrev(prefs.packPrev),                                    // 📦 パックを外したときに戻すための退避（custom.js。trk130）
  previewEnabled: prefs.previewEnabled !== false,
  /* ⏱ trk213：曲名タブの「⏱ ここをプレビュー開始位置にする」を出すか（初期オフ）。
     使わない人が誤って触り、その曲のプレビュー開始位置を変えてしまうのを避ける。
     出す/出さないは 📊 スペクトラムの設定（曲名バナーの見た目のそば）で切り替える。
     曲ごとの開始位置（previewStart）は消さない＝オンにすれば今までどおり使える。 */
  previewStartShow: prefs.previewStartShow === true,
  /* ⏮ 常に最初から再生する（trk193）。オンのときは選曲中のプレビューも、メディアプレーヤーの
     「続きから」も使わず、いつも 0:00 から鳴らす。曲ごとのプレビュー開始位置（previewStart）や
     保存した再生位置は消さない＝オフに戻せば今までどおり使える。初期オフ（今までの動きを変えない）。 */
  mediaStartFromZero: prefs.mediaStartFromZero === true,
  /* 🔓 覚えているミュージックフォルダーを、起動したら自動で読み取る（trk194。初期オン）。
     granted なら起動しただけで曲が並ぶ。prompt のときは最初のタップで1回だけ許可を確認する
     （ブラウザーはクリックの中でしか確認を出せないため）。オフにすると今までどおり手動で再接続。 */
  folderAutoRead: prefs.folderAutoRead !== false,
  libSort: pick(prefs.libSort, ["name", "plays", "recent", "best"], "name"),
  libProgress: pick(prefs.libProgress, ["all", "new", "progress", "done"], "all"),   // 📈 進捗フィルター：未聴/継続/完了で絞る（表示層だけ。trk174）
  shortMode: pick(prefs.shortMode, ["off", "90", "120", "180"], "off"),      // 🕹️ ショートプレイ（後半だけ遊ぶ・初期オフ）
  libTab: typeof prefs.libTab === "string" ? prefs.libTab : "all",            // 📚 選んでいる棚（タブ）のID
  playlists: (Array.isArray(prefs.playlists) ? prefs.playlists : []).filter(p => p && typeof p === "object").slice(0, 200),  // 🎧 ユーザー定義＋公式カタログ由来プレイリスト（広いカタログを保存できるよう上限200）
  plFolders: (Array.isArray(prefs.plFolders) ? prefs.plFolders : []).filter(f => f && typeof f === "object").slice(0, 40),  // 📁 プレイリストフォルダ（ネスト可。library.js が検証。trk129：上限は library.js の PL_FOLDER_MAX＝40 と対。trk の固定棚が10個あるので利用者に十分残す。作成時に上限を確かめ、起動時に黙って捨てない）
  playlistDelMode: prefs.playlistDelMode === "three" ? "three" : "one",       // 🎧 タブの中クリック削除を3回にするモード
  plAuthorTools: prefs.plAuthorTools === true,                                // 👥 投稿者ツール（初期オフ。library.js）
  plAuthorName: typeof prefs.plAuthorName === "string" ? prefs.plAuthorName.slice(0, 24) : "",   // 👤 共有ファイルに添える投稿者名
  plAuthorBlock: (Array.isArray(prefs.plAuthorBlock) ? prefs.plAuthorBlock : []).map(x => String(x).slice(0, 24)).filter(Boolean).slice(0, 100),   // 🚫 ブロックした投稿者
  plAuthorFav: (Array.isArray(prefs.plAuthorFav) ? prefs.plAuthorFav : []).map(x => String(x).slice(0, 24)).filter(Boolean).slice(0, 100),        // ⭐ お気に入り投稿者
  plAuthorOnly: prefs.plAuthorOnly === true,                                  // 👥 ⭐のお気に入り投稿者だけ表示
  libSkin: typeof prefs.libSkin === "string" ? prefs.libSkin : "player",      // 📚 棚のスキン（js/lib-skins.js が検証）
  libSkinQuick: prefs.libSkinQuick !== false,                                 // 📚 曲リストの 🎨 ボタンを出す
  libKeepShared: prefs.libKeepShared === true,                                // 📤💾 共有で取り込んだ曲を端末に残す（初期オフ。library.js）
  trkPlaylist: prefs.trkPlaylist !== false,                               // 🐔 trk's playlist（右端のタブ。チュートリアル後に自動追加。設定で非表示可）
  trkClassic: prefs.trkClassic !== false,                                // 🎻 trk classic（クラシック名盤。ゲームとは別枠で100曲。設定で非表示可）
  trkRemoved: cleanTrkRemoved(prefs.trkRemoved),                         // 🗑 消した trk の自動リスト（次の起動で作り直さない。🐔の設定の ♻ で戻す）
  trkListed: cleanTrkRemoved(prefs.trkListed),                           // 👁 曲画面の「プレイリストに入れる」に出す trk のリスト（初期は空＝出さない。trk218）
  trkFixedNotice: prefs.trkFixedNotice === 1 ? 1 : 0,                    // 📢 固定の案内を一度だけ出した印（trk218・削除予定 2027-02-28）
  /* 🎓 trk's OST Vol.1（music-library へ分離。trk185〜189）。
     settings は prefs 全体を自動コピーしないので、読み戻す字段はここで明示する。
     trkOstSeenKeys は保存するだけで起動時に読み戻していなかったため、利用者が外した
     公式パックの曲が再起動後に復活し得た（trk189 で読み戻しを追加）。 */
  trkOstLegacyClean1: prefs.trkOstLegacyClean1 === 1 ? 1 : 0,             // 一回限りの掃除の印（trk189・削除予定 2027-01-16）
  trkFolderRefsPrune1: prefs.trkFolderRefsPrune1 === 1 ? 1 : 0,           // 🗂 フォルダー曲の参照を一度だけ掃除した印（trk201・削除予定 2027-01-27）
  trkOstSeenKeys: [...new Set((Array.isArray(prefs.trkOstSeenKeys) ? prefs.trkOstSeenKeys : [])
    .filter(k => typeof k === "string" && /^(?:builtin:trk-ost-song:[\w-]{1,32}|pack:p[a-z0-9]+\/s0[1-5])$/.test(k)).slice(0, 100))],   // 見た曲キー（重複・異形は除く）
  trkSortABC: prefs.trkSortABC === true,                                 // 🔤 trk フォルダ内をABC順で並べる（初期オフ）
  trkTabName: pick(prefs.trkTabName, TRK_ENUM_VALUES.trkTabName, "full"), // 🐔 タブの表示名（full=trk's playlist／short=trk's／icon=🐔 だけ）
  playlistOrder: (Array.isArray(prefs.playlistOrder) ? prefs.playlistOrder : []).map(x => String(x).slice(0, 48)).filter(Boolean).slice(0, 200), // ↕ 自由並べ替え（初期は作成順）
  /* 📊 スペクトラム（js/spectrum.js が値と実在を検証して読み戻す） */
  specOn: prefs.specOn !== false,                                             // 表示する（初期オン）
  /* 見え方と色の一覧は spectrum.js（このあとに読み込む）が決めています。ここでは
     TrkSpec があればその一覧、なければ初期のぶんで検証し、spectrum.js の読み込み時に
     もう一度 prefs から読み直して広げます（core.js 側の直し忘れを防ぐ）。 */
  specStyle: pick(prefs.specStyle, (window.TrkSpec && TrkSpec.styles()) || ["ring", "bars", "mirror", "wave"], "ring"),
  specTheme: pick(prefs.specTheme, (window.TrkSpec && TrkSpec.themes()) || ["neon", "sunset", "mono", "rainbow"], "neon"),
  specGain: num(prefs.specGain, .4, 2.5, 1),
  specPeaks: prefs.specPeaks !== false,
  specTv: prefs.specTv === true,                                              // 📺 TVに重ねる（初期オフ）
  specSkin: prefs.specSkin !== false,                                         // 📊 曲名バナーをスキンにする（初期オン）
  specSkinOpen: prefs.specSkinOpen === true,                                  // 大きく開いた状態（初期は閉じ）
  specArtwork: prefs.specArtwork === true,                                   // 🎨 曲のサムネイルをスペクトラムに小さく重ねる（初期オフ）
  /* プレイオプション */
  lives: pick(prefs.lives, ["standard", "knight", "chicken", "none"], "standard"),
  countdown: prefs.countdown !== false,
  countdownSE: prefs.countdownSE !== false,
  resumeCountdown: prefs.resumeCountdown !== false,
  judge: pick(prefs.judge, ["lenient", "standard", "strict"], "standard"),
  rate: num(prefs.rate, .5, 3, 1),          // 上限は speed.js が「2.0x・3.0x も使う」の設定に合わせて決め直します
  hidden: !!prefs.hidden,
  sudden: !!prefs.sudden,
  modMirror: !!prefs.modMirror,
  modRandom: !!prefs.modRandom,
  cover: num(prefs.cover, .2, .7, .4),
  catchNitroBonus: prefs.catchNitroBonus !== false,
  catchBlastNext: prefs.catchBlastNext === true,
  /* ⌨ trk267：ターミナル（trk CLI）。play の行き先（メディアプレーヤー／曲リストの試聴）、
     開いている間の見た目（auto＝wizard を含むスキン→無ければ terminal／terminal／keep）、
     覚えた呪文。どれもこの settings の中だけ（新しい localStorage のキーは増やしません）。 */
  cliPlay: pick(prefs.cliPlay, ["media", "preview"], "media"),
  /* ⌨ trk286：既定は「いまのスキンのまま」＝端末の中だけ、後ろと同じ見た目で開く */
  cliSkin: pick(prefs.cliSkin, ["auto", "terminal", "keep"], "keep"),
  cliSpells: cleanCliSpells(prefs.cliSpells),
  cliBell: prefs.cliBell !== false,   /* ⌨ trk269：エラーの音を鳴らしてよいか（鳴らすかはスキンが決める） */
  /* ⌨ trk283：呼び出しキー（同じキーで開閉・Ctrl/⌘ と一緒に押す）・実行後に閉じる・
     入力できるかの見せ方（既定は常時バッジ）・端末のスキンを個別に選ぶか。 */
  cliKey: validCode(prefs.cliKey) ? prefs.cliKey : "Backquote",
  /* ⌨ trk286：実行後に閉じるのは**既定オフ**（1 回呼んで唱えて、そのまま何度も唱えられるように） */
  cliAutoClose: prefs.cliAutoClose === true,
  /* ⌨ trk286：ボトムシートの高さ（half＝52%／tall＝70%（既定）／full＝92%） */
  cliSheetSize: pick(prefs.cliSheetSize, ["half", "tall", "full"], "tall"),
  cliTypingCheck: pick(prefs.cliTypingCheck, ["badge", "status", "quiet"], "badge"),
  /* ⌨ trk285：入力の合図（プロンプト）の形。既定は Linux 系の「<スキン名(English)> ~ %」 */
  cliPromptStyle: pick(prefs.cliPromptStyle, ["linux", "bash", "root", "fish", "ps", "plain", "skin"], "linux"),
  cliSkinPickOn: prefs.cliSkinPickOn === true,
  cliSkinPick: typeof prefs.cliSkinPick === "string" && has(window.Trk.data.SKINS, prefs.cliSkinPick) ? prefs.cliSkinPick : "",
  /* ▶ メディアプレーヤー（TV電源長押し） */
  mediaRepeat: pick(prefs.mediaRepeat, ["off", "one", "all"], "off"),
  mediaShuffle: prefs.mediaShuffle === true,
  mediaRate: num(prefs.mediaRate, .5, 2, 1),
  mediaLoopTrigger: pick(prefs.mediaLoopTrigger, ["toggle", "hold"], "toggle"),
  mediaWallTrigger: pick(prefs.mediaWallTrigger, ["toggle", "hold"], "toggle"),
  mediaWallStyle: pick(prefs.mediaWallStyle, ["midnight", "aurora", "paper", "custom"], "midnight"),
  mediaWallClock: prefs.mediaWallClock !== false,
  mediaWallStopsVideo: prefs.mediaWallStopsVideo !== false,
  mediaResumeRewind: pick(prefs.mediaResumeRewind, [0, 3, 5, 10, 15, 30], 0),  // ⏪ スマート巻き戻し：再生再開時にN秒戻す（0=オフ。trk164）
  mediaWakeLock: prefs.mediaWakeLock !== false,                                // 🔆 Wake Lock：動画再生中に画面を消灯させない（初期オン。trk164）
  mediaWave: prefs.mediaWave !== false,                                        // 🌊 波形シークバー：解析の rms 包絡をシークバーに描く（初期オン。trk173）
  mediaLyricsOpen: prefs.mediaLyricsOpen === true,                             // 🎤 歌詞パネルを開いたままにするか（初期は閉じる。trk166）
  /* 💬 trk262：字幕の置き場所（下・中央・上）と大きさ（小・中・大）。trk が描く字幕だけに効く
     （📌 画中画と OS のライブキャプションは向こうの設定）。 */
  mediaSubsPos: pick(prefs.mediaSubsPos, ["bottom", "middle", "top"], "bottom"),
  /* 📌 trk263：画中画を、メディアプレーヤーを閉じても続ける（既定オン）と、
     画中画を出している間はプレーヤー側の映像を隠す（既定オン）。 */
  mediaPipKeep: prefs.mediaPipKeep !== false,
  mediaPipHideStage: prefs.mediaPipHideStage !== false,
  mediaSubsSize: pick(prefs.mediaSubsSize, ["small", "normal", "large"], "normal"),
  /* ✨ フレーム補完（js/frame-interp.js）。既定はオフ（重いので） */
  frameInterp: pick(prefs.frameInterp, ["off", "blend", "flow"], "off"),
  frameInterpStrength: num(prefs.frameInterpStrength, 0, 1, .85),
  /* ⚖ trk279：⚙ の「段」（見せる量）。既定はスタンダード。
     値は変えません（段を下げても、いまの動きはそのまま）。 */
  setLevel: pick(prefs.setLevel, SET_LEVELS, "standard"),
  /* ⚖ trk279：自分で動かしたことのある設定の名前。段で隠れる行でも、
     一度でも触ったものは必ず出します（「設定したのに消えた」を作らない）。 */
  setTouched: cleanSkinIdList(prefs.setTouched, 160),
  /* ⚖ trk281：TRUCK の揺れを全員オフへ寄せる「一回限りの印」（docs/MIGRATIONS.md）。
     1 になったら二度と掛かりません（工場出荷でも戻しません）。 */
  swayTruckOff1: prefs.swayTruckOff1 === 1 ? 1 : 0
};
/* 🖥 trk223（2026-10-31 レビュー⑤）：同じオリジンで2つの trk! を公開できる（/trk/ と /trk-PWA/）。
   localStorage はオリジンで共有なので、片方（古い版）が保存すると、その版が知らない設定
   （uiScale・uiMode・playerBar など）が丸ごと消えていた。保存のときは、いま保存されている生の値に
   重ねて書き、知らないキーはそのまま残す。工場出荷に戻したとき（fresh）だけは、きれいに置き換える。 */
function storedPrefsRaw() {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || "null");
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  } catch (_) { return {}; }
}
function saveUserPrefs({ fresh = false } = {}) {
  /* trk247：成否を返す（書き込み失敗＝容量がいっぱい、を呼び出し側で言葉にできるように）。
     返す値を見ていない呼び出し側はそのまま動く。 */
  try {
    const out = fresh ? prefsForSave() : Object.assign({}, storedPrefsRaw(), prefsForSave());
    localStorage.setItem(PREFS_KEY, JSON.stringify(out));
    return true;
  } catch (_) { return false; }
}
/* 🛟 trk202：セーフモードが安全側に倒した値を、保存に持ち込まない。
   いまは ?safe=1 で入っても、そのあと何か設定を保存すると folderAutoRead・mediaStartFromZero・
   previewEnabled が false のまま残り、通常の URL で開き直しても戻らなかった（1.0.7 レビューの指摘）。
   倒す前の値を覚えておき、保存のときだけ元の値に差し替える。セーフモード自体は URL の ?safe=1 の
   あいだだけ続くので、通常の URL で開き直せば元どおりになる。 */
function prefsForSave() {
  if (!safeModeOn || !safePrevValues) return settings;
  const out = Object.assign({}, settings);
  for (const k of SAFE_SESSION_KEYS) if (k in safePrevValues) out[k] = safePrevValues[k];
  return out;
}
/* セーフモードのまま再読み込みする（URL から ?safe=1 が消えているので付け直す） */
function safeModeHref() {
  try {
    const url = new URL(location.href);
    url.searchParams.set("safe", "1");
    url.hash = "";
    return url.href;
  } catch (_) { return "?safe=1"; }
}
function reloadInSafeMode() {
  try { location.replace(safeModeHref()); } catch (_) { try { location.reload(); } catch (__) {} }
}
function rememberMusicVolume(value) {
  const volume = Number(value);
  if (Number.isFinite(volume) && volume > 0) settings.musicVolumeRestore = Math.min(1, Math.max(.01, volume));
}
/* プレイ中の追加演出だけをまとめて抑える。音声エフェクターの設定とは別です。 */
const gameplayFxMultiplier = () => settings.gameFxMode === "off" ? 0 : settings.gameFxMode === "soft" ? .42 : 1;
const gameplayFxPower = () => settings.fxPower * gameplayFxMultiplier();

/* ---------- URLコマンドによる緊急リセット & 設定の書き出し ----------
   画面が触れなくなった時でもURLで復旧できるようにする。
   例:
     ?safe=1 / ?safe / #safe          → セーフモード（映像OFF・ぼかし無し・TVは家庭用）
     ?reset=tv / ?reset=video         → 映像・TVまわりだけデフォルトに戻す
     ?reset=audio / ?reset=sound      → 音量・SEをデフォルトに戻す
     ?reset=notes                     → ノーツ色・形をデフォルトに戻す（確認あり）
     ?reset=amp / ?reset=rack         → 🔥 TRKアンプ（🎚 エフェクターラック）を空に戻す
     ?reset=all                      → 全設定リセット（ノーツも含む）。実行前に確認します（&force=1 で確認を飛ばす）
     ?reset=factory / ?reset=full     → 上と同じ（別名）
     ?factory                        → セーフモード（?safe=1 と同じ。全リセットではない。js/addons.js も同じ解釈）
     ?export=notes / ?export=all      → 設定をJSONでダウンロード
   ノーツ設定は細かく詰める人が多いので、tv/audioリセットでは保持される。 */
/* ♻️ 全設定リセットの確認ダイアログ。
   ?reset=all はリンクを踏むだけで（ノーツ・音量・映像・キー・プレイリストまで）消えるため、
   実行前にここで一度止めます。&force=1 を付けたときだけ、そのまま実行します。
   ダイアログは素のDOMで作るので、ほかの機能が壊れていても出せます（ESC・外側クリック＝やめる）。 */
function askFactoryReset(onYes, onNo) {
  const wrap = document.createElement("div");
  wrap.setAttribute("role", "dialog");
  wrap.setAttribute("aria-modal", "true");
  wrap.dataset.trkAsk = "factory";   /* 見つけやすさのために印を付ける（テスト・支援技術） */
  wrap.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px";
  const card = document.createElement("div");
  card.style.cssText = "max-width:min(92vw,470px);background:#16181d;color:#f2f3f5;border:2px solid #ff3d7f;border-radius:14px;padding:16px 18px;box-shadow:0 10px 40px rgba(0,0,0,.6);font:15px/1.65 system-ui,sans-serif";
  const title = document.createElement("b");
  title.textContent = "♻️ " + tr("factoryAskTitle");
  title.style.cssText = "font-size:17px";
  const body = document.createElement("div");
  body.textContent = tr("factoryAskBody");
  body.style.cssText = "margin:8px 0 4px;white-space:pre-line";
  const hint = document.createElement("div");
  hint.textContent = tr("factoryForceHint");
  hint.style.cssText = "opacity:.65;font-size:12px;margin-bottom:12px";
  const rowBox = document.createElement("div");
  rowBox.style.cssText = "display:flex;gap:10px;flex-wrap:wrap";
  const yes = document.createElement("button");
  yes.type = "button"; yes.textContent = tr("factoryAskYes");
  yes.style.cssText = "flex:1 1 auto;min-height:44px;padding:10px 14px;border-radius:10px;border:0;background:#ff3d7f;color:#fff;font-weight:700;font-size:15px;cursor:pointer";
  const no = document.createElement("button");
  no.type = "button"; no.textContent = tr("factoryAskNo");
  no.style.cssText = "flex:1 1 auto;min-height:44px;padding:10px 14px;border-radius:10px;border:1px solid #555;background:#22252b;color:#f2f3f5;font-size:15px;cursor:pointer";
  const close = () => { document.removeEventListener("keydown", onKey); wrap.remove(); };
  const onKey = e => {
    if (e.key !== "Escape") return;
    close();
    if (typeof onNo === "function") onNo();
  };
  yes.addEventListener("click", () => { close(); if (typeof onYes === "function") onYes(); });
  no.addEventListener("click", () => { close(); if (typeof onNo === "function") onNo(); });
  wrap.addEventListener("click", e => { if (e.target === wrap) { close(); if (typeof onNo === "function") onNo(); } });
  document.addEventListener("keydown", onKey);
  rowBox.append(yes, no);
  card.append(title, body, hint, rowBox);
  wrap.append(card);
  (document.body || document.documentElement).append(wrap);
  try { no.focus(); } catch (_) {}
}
function resetVideoPrefs() {
  settings.videoStyle = "color";
  settings.videoZoom = 1; settings.videoMaxWheelStep = 5; settings.videoMaxChrome = "full"; settings.mediaSubsPos = "bottom"; settings.mediaSubsSize = "normal"; settings.mediaPipKeep = true; settings.mediaPipHideStage = true; settings.videoKeys = VIDEO_KEY_DEFAULTS.slice(); settings.castPolicy = "off"; settings.backgroundPolicy = "off"; settings.fxAntenna = false; settings.fxAntennaShape = "rod"; settings.fxAntennaCustomOn = ""; settings.fxAntennaCustomOff = ""; settings.mediaLoopTrigger = "toggle"; settings.mediaWallTrigger = "toggle"; settings.mediaWallStyle = "midnight"; settings.mediaWallClock = true; settings.mediaWallStopsVideo = true; settings.mediaExitKey = "Escape"; settings.mediaExitConfirm = true; settings.mediaResumeRewind = 0; settings.mediaWakeLock = true; settings.mediaWave = true; settings.libProgress = "all"; settings.mediaLyricsOpen = false;
  settings.bgDim = 0; settings.bgBlur = 0;
  /* ✨ TRKエフェクト（リッチ映像。js/tv-rich.js）の記憶も一緒に戻す */
  settings.tvRichId = "portrait_natural"; settings.tvRichPrev = ""; settings.tvRichCat = "portrait"; settings.tvRichOpen = true;   /* 初期状態に戻す＝欄は開いておく */
  settings.tvParamFavs = cleanTvParamFavorites(settings.tvParamFavs); // user bookmarks survive a TV-only reset
  settings.tvDockSkin = "cinema"; settings.tvDockFive = false;
  settings.tvOrder = "tv-first"; settings.tvOverlay = true;
  settings.tvPowerPrev = "color"; settings.previewEnabled = true; settings.mediaStartFromZero = false; settings.folderAutoRead = true;   /* ⏮ 常に最初から再生（trk193）も初期値へ */
  settings.tvSongWhilePlaying = false;   /* ◀▶ を演奏中も効かせる設定も一緒に戻す */
  /* tv-dock.js の「選曲中に映像を流す」も一緒に戻す */
  settings.tvMenuPreview = true; settings.tvMenuVideo = false;
  settings.artWallpaperBg = false; settings.useStudyArtwork = false; settings.hideArtworkDuringChart = false;
  /* 📊 スペクトラム（js/spectrum.js）も映像まわりとして一緒に戻す */
  settings.specOn = true; settings.specStyle = "ring"; settings.specTheme = "neon";
  settings.specGain = 1; settings.specPeaks = true; settings.specTv = false;
  settings.specSkin = true; settings.specSkinOpen = false; settings.specArtwork = false;
  settings.previewStartShow = false;   /* ⏱ trk213：開始位置ボタンも初期値（出さない）へ */
  if (typeof view !== "undefined" && view) { try { view.style.filter = videoFilter(); } catch(_) {} }
  if (typeof menuVideoTick === "function") { try { menuVideoTick(); } catch(_) {} }
}
function resetAudioPrefs() {
  settings.musicVolume = 0.7; settings.musicVolumeRestore = 0.7; settings.seVolume = 0.28; settings.seEnabled = false; settings.bannerPause = false; settings.bannerSongBtns = true;
  settings.bannerRandomBtn = true; settings.bannerRandomTap = false;
  settings.midiSoundProfile = "studio_gm"; settings.midiMixEnabled = false; settings.midiMixProfile = "studio_gm"; settings.midiMixOpen = true;
  settings.synthModeDisabled = false; settings.synthModeFastStart = false; settings.synthModeKeyboardLock = true; settings.synthModeWideKeyboard = false;
  settings.synthModeKeyRange = "25"; settings.synthModeKeyFit = "fit"; settings.synthMidiAuto = true;
  try {
    if (window.TrkFX && typeof window.TrkFX.midiMixProfile === "function") window.TrkFX.midiMixProfile("studio_gm");
    if (window.TrkFX && typeof window.TrkFX.midiMixOn === "function") window.TrkFX.midiMixOn(false);
  } catch (_) {}
  // fx-dock / eq-dock の音まわりがあれば一緒に初期化
  if ("gameVolume" in settings) settings.gameVolume = 0.7;
  if ("eqEnabled" in settings) settings.eqEnabled = false;
  if ("eqLow" in settings) { settings.eqLow = 0; settings.eqMid = 0; settings.eqHigh = 0; }
  if ("compEnabled" in settings) settings.compEnabled = false;
  try { if (typeof window._trkSyncSynthModeSettings === "function") window._trkSyncSynthModeSettings(); } catch (_) {}
  emit("audioPrefsReset");
}
function resetLitePrefs() {
  /* 🪶 軽量化（js/lite.js）。?reset=lite と trkReset('lite') から呼びます */
  settings.liteMode = "auto"; settings.liteFps = "30"; settings.liteMascot = "30"; settings.liteScale = "1.5";
  settings.liteSpectrumOff = true; settings.liteFx = true; settings.liteBlur = true; settings.liteGameFull = false;
  settings.liteDecor = true; settings.liteLibRows = "device"; settings.liteNoAnalyze = false; settings.liteMascotNoLoad = false;
  if (typeof liteSyncUI === "function") { try { liteSyncUI(); } catch (_) {} }
}
function resetNotesPrefs() {
  try {
    const def = (typeof NOTE_PRESETS !== "undefined" && window.Trk.data.NOTE_PRESETS.standard) ? window.Trk.data.NOTE_PRESETS.standard : null;
    if (def) settings.notes = JSON.parse(JSON.stringify(def));
    else settings.notes = window.Trk.data.sanitizeNotes(null);
    applyNoteVars();
  } catch(_) { settings.notes = window.Trk.data.sanitizeNotes(null); }
}
/* 🔥 TRKアンプ（🎚 エフェクターラック・js/fx.js。左下の独立カテゴリー）のリセット。
   fx.js は core.js よりあとに読み込まれるので、読み込み時点では settings.fx… がまだ無い。
   そのため一度きりの合図を残し、fx.js が読み込み時に拾って片づける
   （"clear"＝段を空にする／"off"＝段はそのまま止める）。すでに読み込まれているときは、その場でも外す。 */
const AMP_RESET_KEY = "trk_amp_reset_once";
function markAmpReset(mode) { try { sessionStorage.setItem(AMP_RESET_KEY, mode); } catch (_) {} }
function takeAmpReset() {
  try {
    const m = sessionStorage.getItem(AMP_RESET_KEY);
    sessionStorage.removeItem(AMP_RESET_KEY);
    return m === "clear" || m === "off" ? m : "";
  } catch (_) { return ""; }
}
function resetAmpPrefs() {
  if ("fxRack" in settings) settings.fxRack = [];
  if ("fxRackOn" in settings) settings.fxRackOn = false;
  settings.ampOpen = true;   /* 初期状態に戻す＝欄は開いておく（?safe=1 だけは閉じたまま＝下の enterSafeMode） */
  markAmpReset("clear");
  try { if (window.TrkFX && typeof TrkFX.rackClear === "function") { TrkFX.rackClear(); TrkFX.rackOn(false); } } catch (_) {}
}

/* セーフモードに入ったかどうか（?safe=1 / ?factory で入る）。
   アドオン（js/addons.js）など、あとから来る機能は、これを見て「読み込まない」を決めます。
   URLは処理のあと掃除されるので、印を残しておく必要があります。 */
let safeModeOn = false;
window.TrkSafeMode = () => safeModeOn;
/* 🛟 trk202：セーフモードが倒す「自動で何かをする」4つの設定。倒す前の値を覚えておき、
   保存のときだけ元の値に戻す（保存に持ち込まない＝通常のURLで開き直せば元どおり）。 */
const SAFE_SESSION_KEYS = ["previewEnabled", "mediaStartFromZero", "folderAutoRead", "libKeepShared"];
let safePrevValues = null;
function rememberSafePrev() {
  if (safePrevValues) return;
  safePrevValues = {};
  for (const k of SAFE_SESSION_KEYS) if (k in settings) safePrevValues[k] = settings[k];
}
function enterSafeMode() {
  safeModeOn = true;
  rememberSafePrev();   /* 🛟 倒す前の値（保存に持ち込まないために覚えておく・trk202） */
  settings.videoStyle = "off";
  settings.videoZoom = 1; settings.castPolicy = "off"; settings.backgroundPolicy = "off"; settings.fxAntenna = false;
  settings.bgDim = 0; settings.bgBlur = 0;
  settings.tvParamFavs = []; // safe mode starts with no saved TV adjustment pairs
  settings.tvDockSkin = "cinema"; settings.tvDockFive = false;
  settings.tvOrder = "tv-first"; settings.tvOverlay = false;
  settings.previewEnabled = false; settings.mediaStartFromZero = false; settings.folderAutoRead = false;   /* セーフモードは自動の読み取りもしない */
  settings.tvMenuPreview = false; settings.tvMenuVideo = false;   // セーフモードは映像を流さない
  settings.tvSongWhilePlaying = false;                            // セーフモードでは演奏中の曲送りもしない
  settings.specOn = false; settings.specTv = false;               // 📊 スペクトラムも出さない（音の通り道を作らない）
  settings.specSkin = false; settings.specSkinOpen = false; settings.specArtwork = false;
  settings.artWallpaperBg = false; settings.useStudyArtwork = false; settings.hideArtworkDuringChart = false;
  settings.synthModeKeyboardLock = true; // 🎹 セーフモードではシンセを開けないが、既定値は壊さない
  settings.synthModeWideKeyboard = false;
  settings.synthModeKeyRange = "25"; settings.synthModeKeyFit = "fit";   // セーフモードは鍵盤を最小・等倍に戻す（MIDI の設定は消さない）
  settings.libKeepShared = false;        // 📤 セーフモードでは、端末に残した共有の曲も読み戻さない
  settings.fxPower = 0; settings.gameFxMode = "off"; settings.hideGameplayUI = false;
  settings.midiMixEnabled = false; settings.midiMixOpen = false;
  try { if (window.TrkFX && typeof window.TrkFX.midiMixOn === "function") window.TrkFX.midiMixOn(false); } catch (_) {}
  /* 🔥 TRKアンプも安全側へ（段は消さず、止めるだけ。fx.js が読み込み時に拾う） */
  if ("fxRackOn" in settings) settings.fxRackOn = false;
  markAmpReset("off");
  settings.tvRichOpen = false;   /* ✨ TRKエフェクトの欄も安全側では閉じておく */
  if (settings.mascot === "mmd") settings.mascot = "skin";     // 🩷 セーフモードでは MMD を使わない
  if (settings.mascot === "vrm") settings.mascot = "skin";     // 🧍 同じ理由で VRM も使わない（CDNのライブラリを読まない）
  if (typeof view !== "undefined" && view) { try { view.style.filter = "none"; } catch(_) {} }
}
function resetKeysPrefs() {
  /* ⌨ キー割り当て（🎮 パッド含む）。?reset=keys と trkReset('keys') から呼びます */
  settings.keys = KEY_PRESETS.standard.keys.slice();
  settings.subKeys = KEY_PRESETS.standard.sub.slice();
  settings.menuKey = "KeyM"; settings.mediaExitKey = "Escape";
  settings.padEnabled = true; settings.padMenuNav = true;
  settings.padLeft = PAD_DEFAULTS.left; settings.padRight = PAD_DEFAULTS.right;
  settings.padConfirm = PAD_DEFAULTS.confirm; settings.padBack = PAD_DEFAULTS.back; settings.padPause = PAD_DEFAULTS.pause;
}
function resetAllPrefs() {
  settings.packPrev = null;    // 📦 パックの退避も消す（全リセットのあとに古い値を戻さない。trk130）
  resetVideoPrefs(); resetAudioPrefs(); resetNotesPrefs(); resetLitePrefs(); resetKeysPrefs(); resetAmpPrefs();
  settings.liteSeen = false;   // 🪶 工場出荷状態では、スマホ向けの初回案内もやり直す
  settings.tvParamFavs = []; // a factory reset clears the separately preserved TV bookmarks too
  settings.trkPlaylist = true; // 🐔 trk's playlistも初期状態に戻す（再表示）
  settings.trkClassic = true;  // 🎻 trk classic も初期状態に戻す
  settings.trkRemoved = [];    // 🗑 消したリストの印も外す（プレイリストごと初期化するため）
  settings.trkListed = [];     // 👁 曲画面の一覧に出す trk のリストも初期状態（出さない）へ
  settings.trkFixedNotice = 0; // 📢 固定の案内もやり直す
  settings.trkSortABC = false; settings.playlistOrder = []; settings.trkTabName = "full"; settings.chartGen = "4"; settings.chartGenChosen = false; settings.mediaKeepLimit = "1g";
  settings.fxPower = 1.5; settings.gameFxMode = "full"; settings.hideGameplayUI = false; settings.helpText = true; settings.tutorialDone = false; settings.tutorialStamps = []; settings.skinGradUnlocked = false; settings.playlists = []; settings.plFolders = []; settings.playlistDelMode = "one"; settings.plAuthorTools = false; settings.plAuthorName = ""; settings.plAuthorBlock = []; settings.plAuthorFav = []; settings.plAuthorOnly = false; settings.menuKey = "KeyM"; settings.menuConfirm = true; settings.mediaExitKey = "Escape"; settings.mediaExitConfirm = true; settings.errorMeter = true;
  settings.scroll = 1.2; settings.latency = 0;
  settings.catchNitroBonus = true; settings.catchBlastNext = false; settings.mediaRepeat = "off"; settings.mediaShuffle = false; settings.mediaRate = 1; settings.mediaLoopTrigger = "toggle"; settings.videoKeys = VIDEO_KEY_DEFAULTS.slice(); settings.mediaResumeRewind = 0; settings.mediaWakeLock = true; settings.mediaWave = true; settings.libProgress = "all"; settings.mediaLyricsOpen = false;
  settings.judge = "standard"; settings.rate = 1; settings.shortMode = "off"; settings.shortMode = "off";
  settings.hidden = false; settings.sudden = false; settings.modMirror = false; settings.modRandom = false; settings.showMasterDiff = false; settings.escNoReturn = false; settings.judgeOrdered = false; settings.mediaReloadOnExit = false;
  settings.favQuickUnfreeze = false;   /* ⭐ trk215：凍結の解除は3秒長押しへ戻す */
  settings.favs = {}; settings.songFav = [];   /* ⭐ trk215：お気に入りのフォルダ（2軍〜ピン・凍結）も工場出荷状態へ */
  settings.mascot = "skin"; settings.vrmFrame = "full";
  settings.mmdScale = 1; settings.mmdTurn = 0; settings.mmdMotionBpm = 0; settings.mmdMotionKind = "faceSing";
  settings.mmdQuickUI = true; settings.mmdMotionFavs = [];
  settings.skin = "shadow"; settings.layout = "classic";
  /* 🧺 trk229：棚の整理（お気に入り・隠した・回数・日時・並び・絞り込み）も工場出荷状態へ */
  settings.skinShelfOnly = ""; settings.skinSort = "default"; settings.skinShelfVol = ""; settings.skinFav = []; settings.skinHidden = [];
  settings.skinVolNav = "on"; settings.skinVolDir = "row"; settings.skinVolWrap = "stop"; Object.assign(settings, volKeyBoot(null));
  settings.skinUse = {}; settings.skinLast = {};
  /* 🖥 trk221/222：画面の形（自動）・下の再生バー（つねに表示）・拡大率（100%）も工場出荷状態へ戻す */
  settings.uiMode = "auto"; settings.playerBar = "on";
  settings.uiScale = 100; settings.fixedIconSize = true; settings.uiModeLock = true; settings.fxInLibrary = false;
  /* 🧱 trk244：表示の密度（ふつう）と、縮小は「詰めて見せる」（オン）も工場出荷状態へ */
  settings.uiDensity = "auto"; settings.uiScaleCompact = true;
  /* 🔤 trk246：書体の組み合わせも工場出荷状態（使わない）へ */
  settings.typography = null;
  /* 🔄 trk255：更新の知らせ（出す・眠らせない）も工場出荷状態へ */
  settings.swUpdateNotice = true; settings.swUpdateSnooze = 0;
  /* 🎵 trk225：バーの置き場所（いちばん下）と、隠さない設定（オフ）も工場出荷状態へ */
  settings.playerBarPos = "bottom"; settings.playerBarLock = false; settings.playerBarSeekLock = false;
  /* ❓ trk227：リピートの段（単曲のみ）と、シャッフルの範囲（いまの一覧）も既定へ */
  settings.playerBarRepeatOneOnly = false; settings.playerBarShuffleInList = false;
  /* ⌨ trk267：ターミナルの行き先（プレイヤー）・見た目（自動）・覚えた呪文（無し）も工場出荷状態へ */
  settings.cliPlay = "media"; settings.cliSkin = "keep"; settings.cliSpells = {}; settings.cliBell = true; settings.cliKey = "Backquote"; settings.cliAutoClose = false; settings.cliSheetSize = "tall"; settings.cliTypingCheck = "badge"; settings.cliSkinPickOn = false; settings.cliSkinPick = ""; settings.cliPromptStyle = "linux";
  /* ⚖ trk279：⚙ の段（スタンダード）と「触った設定」も工場出荷状態へ */
  settings.setLevel = "standard"; settings.setTouched = [];
}
/* trk247：設定JSONの「中身」を決める1か所（書き出しと、書き出しsizes表示が同じ物を見る）。
   ⚠ kind ごとに載せる物が違う（notes／tv／audio／all）。all は settings 全体。 */
function prefsExportPayload(kind) {
  const out = {};
  if (kind === "notes") out.notes = settings.notes;
  else if (kind === "tv" || kind === "video") {
    out.videoStyle = settings.videoStyle; out.bgDim = settings.bgDim; out.bgBlur = settings.bgBlur;
    /* ✨ TRKエフェクト（リッチ映像）の記憶も、映像の書き出しに一緒に乗せる */
    out.tvRichId = settings.tvRichId; out.tvRichPrev = settings.tvRichPrev; out.tvRichCat = settings.tvRichCat; out.tvRichOpen = settings.tvRichOpen;
    out.tvParamFavs = cleanTvParamFavorites(settings.tvParamFavs);
    out.tvDockSkin = settings.tvDockSkin; out.tvDockFive = settings.tvDockFive; out.tvOrder = settings.tvOrder;
    out.tvOverlay = settings.tvOverlay; out.previewEnabled = settings.previewEnabled; out.fxPower = settings.fxPower;
    out.tvMenuPreview = settings.tvMenuPreview; out.tvMenuVideo = settings.tvMenuVideo;
    out.artWallpaperBg = settings.artWallpaperBg; out.useStudyArtwork = settings.useStudyArtwork;
    out.hideArtworkDuringChart = settings.hideArtworkDuringChart; out.specArtwork = settings.specArtwork;
  } else if (kind === "audio") {
    out.musicVolume = settings.musicVolume; out.musicVolumeRestore = settings.musicVolumeRestore; out.seEnabled = settings.seEnabled; out.seVolume = settings.seVolume;
    out.midiSoundProfile = settings.midiSoundProfile; out.midiMixEnabled = settings.midiMixEnabled; out.midiMixProfile = settings.midiMixProfile;
    out.synthModeDisabled = settings.synthModeDisabled; out.synthModeFastStart = settings.synthModeFastStart;
    out.synthModeKeyboardLock = settings.synthModeKeyboardLock;
    out.synthModeWideKeyboard = settings.synthModeWideKeyboard;
    out.synthModeKeyRange = settings.synthModeKeyRange;
    out.synthModeKeyFit = settings.synthModeKeyFit;
    out.synthMidiAuto = settings.synthMidiAuto;
    if ("gameVolume" in settings) out.gameVolume = settings.gameVolume;
  } else if (kind === "core") {
    /* trk247：ノート（譜面の作り込み）をのぞいた設定。ノートが大きいせいで
       上限を超えて読み込めない、を避けるための1本 */
    Object.assign(out, settings); delete out.notes;
  } else { // all
    Object.assign(out, settings);
  }
  return out;
}
function exportPrefs(kind) {
  try { downloadJSON(prefsExportPayload(kind), `trk-${kind || "all"}-` + new Date().toISOString().slice(0,10) + ".json"); } catch(e){ console.error(e); }
}
function parseHashParams(hash) {
  /* ⚠ 小文字にするのは**キーだけ**（値まで小文字にすると、将来ケースを区別する値を
     hash に足したときに静かに壊れる）。URLSearchParams の形は保つ（検査もそのまま通る）。 */
  const out = new URLSearchParams();
  for (const [k, v] of new URLSearchParams(String(hash || "").replace(/^#/, ""))) out.append(k.toLowerCase(), v);
  return out;
}
// URLパラメータを解釈して即時実行（ロード時）
(function handleUrlCommands() {
  try {
    const url = new URL(location.href);
    const sp = url.searchParams;
    const hashParams = parseHashParams(location.hash);
    const get = k => sp.get(k);
    const has = k => sp.has(k) || hashParams.has(k);
    let didReset = "";
    let doExport = "";
    let pendingFactory = false;   /* ♻️ 確認待ちの ?reset=all / #reset=all */
    // export は先に判定（リセットと同時も可）
    if (has("export")) doExport = ((sp.has("export") ? get("export") : hashParams.get("export")) || "all").toLowerCase();
    // safe / safety
    /* ⚠ ?factory 単体は**全リセットではなくセーフモードの合図**（?safe=1 と同じ）。
       js/addons.js の safeNow() が昔から sp.has("factory") をセーフ扱いにしており、
       core.js の「?factory で入る」というコメントとも一致する。壊す動作にしないのが安全側。
       全リセットは ?reset=all / ?reset=factory / #reset=all（いずれも確認ダイアログ）。 */
    if (has("safe") || has("safety") || sp.has("factory")) {
      enterSafeMode(); didReset = "safe";
    } else if (get("reset")) {
      const r = get("reset").toLowerCase();
      if (["tv","video","screen"].includes(r)) { resetVideoPrefs(); didReset = "tv"; }
      else if (["audio","sound","volume"].includes(r)) { resetAudioPrefs(); didReset = "audio"; }
      else if (["notes","note"].includes(r)) { resetNotesPrefs(); didReset = "notes"; }
      else if (["lite","light"].includes(r)) { resetLitePrefs(); didReset = "lite"; }
      else if (["keys","key","pad","controller","input"].includes(r)) { resetKeysPrefs(); didReset = "keys"; }
      else if (["amp","rack"].includes(r)) { resetAmpPrefs(); didReset = "amp"; }
      else if (["all","factory","full"].includes(r)) {
        /* ♻️ いちばん危ないリセット。リンクを踏んだだけで消えないよう、確認を挟む（&force=1 で省略） */
        if (sp.get("force") === "1") { resetAllPrefs(); didReset = "all"; } else pendingFactory = true;
      }
    } else if (hashParams.has("reset")) {
      const r = (hashParams.get("reset") || "").toLowerCase();
      if (["audio","sound","volume"].includes(r)) { resetAudioPrefs(); didReset = "audio"; }
      else if (["notes","note"].includes(r)) { resetNotesPrefs(); didReset = "notes"; }
      else if (["lite","light"].includes(r)) { resetLitePrefs(); didReset = "lite"; }
      else if (["keys","key","pad","controller","input"].includes(r)) { resetKeysPrefs(); didReset = "keys"; }
      else if (["amp","rack"].includes(r)) { resetAmpPrefs(); didReset = "amp"; }
      else if (["all","factory","full"].includes(r)) {
        if (hashParams.get("force") === "1") { resetAllPrefs(); didReset = "all"; } else pendingFactory = true;
      }
      else { resetVideoPrefs(); didReset = "tv"; }
    }
    if (!didReset) {
      if (sp.has("tv") || sp.has("filter")) {
        const f = sp.get("tv") || sp.get("filter");
        if (typeof f === "string" && f.length < 50 && VIDEO_STYLE_IDS.includes(f)) {
          settings.videoStyle = f;
          saveUserPrefs();
        }
      }
      if (sp.has("skin") || sp.has("tvskin")) {
        /* tv-dock.js loads its saved custom skins after core.js. Hand the requested ID over
           for validation against that complete allowlist there; never persist raw URL text. */
        const s = sp.get("skin") || sp.get("tvskin");
        if (typeof s === "string" && s.length < 50) window.__trkPendingTvDockSkin = s;
      }
    }
    if (didReset || doExport || pendingFactory) {
      if (!pendingFactory) saveUserPrefs();   /* 確認待ちの間は、まだ何も保存し直さない */
      // URLを綺麗にする（リセットループ防止）
      try {
        const clean = new URL(location.href);
        clean.searchParams.delete("reset"); clean.searchParams.delete("safe"); clean.searchParams.delete("safety"); clean.searchParams.delete("factory"); clean.searchParams.delete("force");
        // export は残しても良いが、一度だけにするために削除
        if (doExport) clean.searchParams.delete("export");
        const cleanHash = parseHashParams(clean.hash);
        if (["reset", "safe", "safety", ...(doExport ? ["export"] : [])].some(k => cleanHash.has(k))) clean.hash = "";
        history.replaceState(null, "", clean.toString());
      } catch(_) {}
      if (pendingFactory) {
        /* ♻️ 実行するかどうかを聞く。はい＝リセットして再読み込み（全部を確実に適用するため）、
           いいえ＝何もしない。URLはもう綺麗にしてあるので、聞き直しにはなりません。 */
        setTimeout(() => {
          const toast = text => {
            if (typeof caption !== "undefined") caption = { text, t: performance.now() };
            const b = document.createElement("div");
            b.textContent = text;
            b.style.cssText = "position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:99999;background:#111;color:#fff;border:2px solid #ff3d7f;padding:10px 16px;border-radius:10px;max-width:90vw;font-size:14px;box-shadow:0 4px 20px rgba(0,0,0,.6)";
            document.body.appendChild(b);
            setTimeout(() => b.remove(), 5000);
          };
          askFactoryReset(
            () => { resetAllPrefs(); saveUserPrefs({ fresh: true }); toast("♻️ " + tr("factoryAskYes")); setTimeout(() => location.reload(), 400); },
            () => toast(tr("factoryAskCanceled"))
          );
        }, 300);
      }
      // バナー表示は DOM 構築後に行うため、少し遅延
      setTimeout(() => {
        if (doExport) exportPrefs(doExport);
        if (!didReset) return;
        const msg = {
          safe: tr("safeModeNotice"),
          tv: "📺 映像・TV設定を初期化しました（?reset=tv）",
          audio: "🔊 音量・SE設定を初期化しました（?reset=audio）",
          notes: "🎨 ノーツ設定を初期化しました（?reset=notes）",
          lite: "🪶 軽量化の設定を初期化しました（?reset=lite）",
          keys: "🎮 キー割り当て（パッド・リモコン含む）を初期化しました（?reset=keys）",
          amp: "🔥 TRKアンプ（エフェクターラック）を空に戻しました（?reset=amp）",
          all: "♻️ 全設定を初期化しました（?reset=all）"
        }[didReset] || `リセットしました: ${didReset}`;
        // 既存のcaptionシステムがあれば使う、なければalert風div
        if (typeof caption !== "undefined") { caption = { text: msg, t: performance.now() }; }
        const b = document.createElement("div");
        b.textContent = msg + (didReset === "safe" ? "" : " — ページを再読み込みせずに復旧しました。URLパラメータは自動で削除されました。");
        b.style.cssText = "position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:99999;background:#111;color:#fff;border:2px solid #0f0;padding:10px 16px;border-radius:10px;max-width:90vw;font-size:14px;box-shadow:0 4px 20px rgba(0,0,0,.6)";
        document.body.appendChild(b);
        setTimeout(()=> b.remove(), 6000);
      }, 400);
    }
    // グローバルからも手動で呼べるように公開
    window.trkReset = (k="tv") => {
      k = String(k).toLowerCase();
      if (["all","factory"].includes(k)) {
        /* ♻️ コンソールからの trkReset("all") も、消す前に確認する */
        askFactoryReset(() => { resetAllPrefs(); saveUserPrefs({ fresh: true }); location.reload(); }, () => {});
        return;
      }
      if (k==="safe") enterSafeMode(); else if (["tv","video"].includes(k)) resetVideoPrefs(); else if (["audio","sound"].includes(k)) resetAudioPrefs(); else if (k==="notes") resetNotesPrefs(); else if (["lite","light"].includes(k)) resetLitePrefs(); else if (["keys","key","pad","controller","input"].includes(k)) resetKeysPrefs(); else if (["amp","rack"].includes(k)) resetAmpPrefs(); else resetVideoPrefs();
      saveUserPrefs();
      if (k==="safe") reloadInSafeMode(); else location.reload();
    };
    window.trkExport = (k="all") => exportPrefs(String(k).toLowerCase());
  } catch(e) { console.error("url command failed", e); }
})();


const skin = () => has(window.Trk.data.SKINS, settings.skin) ? window.Trk.data.SKINS[settings.skin] : window.Trk.data.SKINS.shadow;
const fontFamily = () => skin().font || window.Trk.data.FONT_DEFAULT;
function activeMascot() {
  const m = settings.mascot === "skin" ? skin().mascot : settings.mascot;
  return window.Trk.data.MASCOT_IDS.includes(m) ? m : null;
}
const isPclMascot = m => !!m && window.Trk.data.MASCOT_FAMILY[m] === "miku";

/* ---------- 状態 ---------- */
let phase = "title";            // title / playing / paused / ended
let screen = "select";          // select / settings（phase が title のとき）
let currentSong = null;         // 選曲中の曲（library.js が設定）
let videoReady = false, mediaURL = null, mediaName = "", fingerprint = "", loadToken = 0, analysis = null;
let bgImage = null;             // 音声だけの曲で使う背景画像（曲パック）
let chart = [], chartMode = "generated", chartDiff = settings.difficulty, chartMeta = { bpm:0, offset:0 };
let currentLevel = 1, levelOverride = null;
const unlock = { master:false, rush:false };
let nextIdx = 0;
let stats = { perfect:0, good:0, miss:0, combo:0, maxCombo:0, star:0 };
let practice = false, effects = [], errors = [];
let pressFlash = [-1e9, -1e9], pressH = { lane:0, t:-1e9 }, avatarHit = [-1e9, -1e9], lastMissT = -1e9;
let caption = null; const CAPTION_MS = 2600;
let clock = { t:0, perf:0, lastCt:-1 };
let bindingSlot = null, seekDragging = false;
const isTouch = matchMedia("(pointer:coarse)").matches || "ontouchstart" in window;

/* ---------- 便利な関数 ---------- */
function hashString(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const extOf = p => String(p).split(".").pop().toLowerCase();
const baseName = n => String(n).replace(/\.[^.]+$/, "");
const safeName = s => String(s).replace(/[\\/:*?"<>|]+/g, "_").slice(0, 60) || "file";
/* 外から来た文字列を <a href> にする前の関所（🛡 セキュリティ）。
   javascript: / data: / vbscript: / blob: などはリンクにしない＝クリックでコードが動く経路を作らない。
   共有パックの名刺・プレゼントの入手先・イベントの作者リンクなど、他人が作った文字列は必ずここを通す。
   読めれば用は足りるので、危ない URL は「リンクにせず、ただの文字」として出す（情報は消さない）。 */
function safeHttpUrl(v) {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s || s.length > 300) return "";
  try {
    const u = new URL(s, location.href);
    return u.protocol === "https:" && u.hostname ? u.href : "";
  } catch (_) { return ""; }
}
function safeLink(cls, url, text) {
  const label = text != null ? String(text) : String(url == null ? "" : url);
  const href = safeHttpUrl(url);
  const n = href ? el("a", cls, label) : el("span", cls, label);
  if (href) { n.href = href; n.target = "_blank"; n.rel = "noopener noreferrer"; }
  return n;
}
/* 設定の読み込みなどで、オブジェクトを丸ごと書き戻すときに踏んではいけないキー
   （__proto__ を代入すると、そのオブジェクトの継承先ごと入れ替わってしまう） */
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);
function fmtTime(s) { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }
function fmtDate(t) {
  try { return new Date(t).toLocaleString(document.documentElement.lang || undefined, { month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit" }); }
  catch (_) { return ""; }
}
function formatKey(code) {
  if (!code) return "—";
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  const map = { ArrowLeft:"←", ArrowRight:"→", ArrowUp:"↑", ArrowDown:"↓", Space:"Space", ShiftLeft:"L-Shift", ShiftRight:"R-Shift",
    ControlLeft:"L-Ctrl", ControlRight:"R-Ctrl", AltLeft:"L-Alt", AltRight:"R-Alt", Semicolon:";", Comma:",", Period:".", Slash:"/",
    BracketLeft:"[", BracketRight:"]", Quote:"'", Backslash:"\\", Minus:"-", Equal:"=", Backquote:"`", Enter:"Enter", Backspace:"BS",
    PageUp:"PgUp", PageDown:"PgDn", Insert:"Ins", Delete:"Del", Tab:"Tab", ContextMenu:"Menu", CapsLock:"Caps",
    MediaPlayPause:"⏯", MediaPlay:"▶", MediaPause:"⏸", MediaStop:"⏹", MediaTrackNext:"⏭", MediaTrackPrevious:"⏮",
    VolumeUp:"Vol+", VolumeDown:"Vol−", VolumeMute:"🔇", ChannelUp:"CH+", ChannelDown:"CH−",
    BrowserBack:"←戻る", GoBack:"←戻る", ColorF0Red:"🔴", ColorF1Green:"🟢", ColorF2Yellow:"🟡", ColorF3Blue:"🔵" };
  return map[code] || code.replace(/^Numpad/, "Num ");
}
/* 🎮 パッドの割り当てを表示用に（ボタン0 → 「ボタン0・A／×」） */
const PAD_BUTTON_NAMES = { 0:"A／×", 1:"B／○", 2:"X／□", 3:"Y／△", 4:"LB／L1", 5:"RB／R1", 6:"LT／L2", 7:"RT／R2",
  8:"Back／Share", 9:"Start／Options", 10:"L3", 11:"R3", 12:"↑", 13:"↓", 14:"←", 15:"→", 16:"Home／PS" };
/* 軸の名前は、どの言語でも読める short 表記（L-Stick ← など）にする */
const PAD_AXIS_NAMES = { 0:["L-Stick ←", "L-Stick →"], 1:["L-Stick ↑", "L-Stick ↓"],
  2:["LT", "RT"], 3:["R-Stick ←", "R-Stick →"], 4:["R-Stick ↑", "R-Stick ↓"],
  9:["D-pad ←", "D-pad →"], 10:["D-pad ↑", "D-pad ↓"] };
function formatPadBind(bind) {
  if (!validPadBind(bind)) return tr("unset");
  if (bind[0] === "b") {
    const n = +bind.slice(1), name = PAD_BUTTON_NAMES[n];
    return tr("padBtn", { n, name: name ? "・" + name : "" });
  }
  const axis = +bind.slice(1, -1), dir = bind.endsWith("+") ? 1 : 0, name = PAD_AXIS_NAMES[axis];
  return tr("padAxis", { n:axis, dir: name ? name[dir] : (bind.endsWith("+") ? "＋" : "−") });
}
/* 押されたキーが左右どちらの枠か（メイン・サブ両方を見る）。なければ -1 */
function slotOfKey(code) {
  if (!code) return -1;
  const k = settings.keys.indexOf(code); if (k >= 0) return k;
  return settings.subKeys.indexOf(code);
}
const keysLabel = slot => [settings.keys[slot], settings.subKeys[slot]].filter(Boolean).map(formatKey).join("/");
const slotLane = slot => settings.reverseHands ? 1 - slot : slot;
const laneCol = lane => settings.reverseHands ? 1 - lane : lane;
const laneName = lane => tr(lane ? "ka" : "don");
const laneColor = lane => settings.notes[lane].color;
const noteShape = lane => settings.notes[lane].shape;
const travelMs = () => 1700 / settings.scroll;

/* 判定幅（難易度 × 判定の厳しさ） */
const JUDGE_SCALE = { lenient:1.3, standard:1, strict:.75 };
const windows = () => {
  const d = window.Trk.data.DIFF_IDS.includes(chartDiff) ? window.Trk.data.DIFFS[chartDiff] : window.Trk.data.DIFFS.normal;
  const k = Object.prototype.hasOwnProperty.call(JUDGE_SCALE, settings.judge) ? JUDGE_SCALE[settings.judge] : 1;
  return { perfect:d.perfect * k, good:d.good * k };
};

/* ---------- MOD（プレイオプション）の表示 ---------- */
function activeMods() {
  const m = [];
  if (settings.hidden) m.push("HD");
  if (settings.sudden) m.push("SD");
  if (settings.modMirror) m.push("MIRROR");
  if (settings.modRandom) m.push("RANDOM");
  if (settings.rate !== 1) m.push(settings.rate.toFixed(2) + "x");
  if (settings.judge === "strict") m.push("STRICT");
  if (settings.judge === "lenient") m.push("LENIENT");
  return m;
}
/* 簡単になる設定（ゆるめ判定・1.00x未満）は練習扱い。1.05x以上は速度別のハイスコア */
const modsUnranked = () => settings.judge === "lenient" || settings.rate < 1;
const LIVES_TAG = { knight:"🛡 KNIGHT", chicken:"🐔 trk!", none:"♾ INFINITE" };
function renderModsLine() {
  const n = $("modsLine"); if (!n) return;
  const lifeTag = Object.prototype.hasOwnProperty.call(LIVES_TAG, settings.lives) ? LIVES_TAG[settings.lives] : "";
  const mods = [...activeMods(), ...(lifeTag ? [lifeTag] : []), ...(settings.autoPlay ? ["▶ AUTO"] : [])];
  if (!mods.length) { n.textContent = ""; return; }
  const note = settings.autoPlay ? "" : modsUnranked() ? tr("unrankedNote") : settings.rate > 1 ? tr("rateRecordNote") : "";
  n.textContent = `${tr("modsLabel")}: ${mods.join(" · ")}${note ? " " + note : ""}`;
}
on("options", renderModsLine);
on("language", renderModsLine);

function downloadBlob(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function downloadJSON(obj, name) { downloadBlob(new Blob([JSON.stringify(obj, null, 2)], { type:"application/json" }), name); }

/* ブラウザ内保存（IndexedDB）。データベース名はこれまでと同じものを使います。
   opts（省略可）：
     sizeKey … レコードのサイズを入れているキー名。これを渡すと**そのキーに index を張り**、
               合計を「index のキー（数値）だけ」で数えられるようになる（レコード本体＝Blob を復元しない）。
     sizeOf  … sizeKey が無い古いレコードからサイズを計算する関数（index への移行と、数え直しの両方で使う）。
     idKey   … 主キーをレコード内に持つキー名（未指定は id）。putIf の置換判定に使う。 */
const IDB_VERSION = 2;   /* v2＝サイズ index。v1→v2 の移行で size を持たない古いレコードへ書き戻す */
function idbStore(dbName, store = "kv", opts = null) {
  const opt = opts || {};
  const sizeKey = opt.sizeKey || "";
  const sizeOf = typeof opt.sizeOf === "function" ? opt.sizeOf
    : (rec => (rec && Number.isFinite(rec[sizeKey]) ? rec[sizeKey] : 0));
  const idKey = typeof opt.idKey === "string" && opt.idKey ? opt.idKey : "id";
  let p = null;
  const open = () => p || (p = new Promise((res, rej) => {
    const r = indexedDB.open(dbName, IDB_VERSION);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
      const os = r.transaction.objectStore(store);
      if (!sizeKey || os.indexNames.contains(sizeKey)) return;
      os.createIndex(sizeKey, sizeKey);
      /* ⚠ 移行を省くと「size を持たないレコード」が index に載らず、**合計が過小**になって
         上限を素通しする（＝危険な方向）。なので v1→v2 の一度きりで size を書き戻す。 */
      const cur = os.openCursor();
      cur.onsuccess = () => {
        const c = cur.result; if (!c) return;
        const rec = c.value;
        if (rec && typeof rec === "object" && !Array.isArray(rec) && !Number.isFinite(rec[sizeKey])) {
          try { c.update(Object.assign({}, rec, { [sizeKey]: sizeOf(rec) })); } catch (_) {}
        }
        c.continue();
      };
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => { p = null; rej(r.error); };
    /* ⚠ バージョンを上げたので、古いタブが v1 を掴んでいるとブロックされる。
       onblocked を貼らないと onsuccess も onerror も来ず、**保存が永遠に固まる**。 */
    r.onblocked = () => { p = null; rej(new Error("idb-blocked")); };
  }));
  const run = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, mode), req = fn(tx.objectStore(store));
      tx.oncomplete = () => res(req ? req.result : undefined);
      tx.onerror = tx.onabort = () => rej(tx.error);
    });
  };
  /* 合計を index のキー（数値）だけで組み立てる。レコード本体（Blob）を復元しない。
     ⚠ **件数と食い違ったら null を返す**。それは「size を持たないレコードがある」ということで、
        合計が過小＝上限を素通しする危険な向きなので、呼び出し側で全件を数え直させる。 */
  const statsFromKeys = (keys, count, prev) => {
    if (!Array.isArray(keys) || !Number.isFinite(count) || keys.length !== count) return null;
    let stored = 0;
    for (const k of keys) {
      /* 数値でないキー＝壊れた size（文字列など）を持ち込まれた状態。0 として足すと**過小**になるので、
         ここも null を返して全件を数え直させる（安全側＝数え直しに倒す）。 */
      if (!Number.isFinite(k) || k < 0) return null;
      stored += k;
    }
    return { stored, replacing: prev == null ? 0 : sizeOf(prev), count, fast: true };
  };
  /* 全レコードを読む、遅いが確実な経路（index が使えない／件数が食い違ったとき） */
  const statsFromAll = (os, replacingId, cb) => {
    const req = os.getAll();
    req.onsuccess = () => {
      const list = req.result || [];
      cb({
        stored: list.reduce((a, r) => a + sizeOf(r), 0),
        replacing: list.reduce((a, r) => a + (r && replacingId != null && r[idKey] === replacingId ? sizeOf(r) : 0), 0),
        count: list.length, fast: false
      });
    };
  };
  /* stats を取る共通部分。replacingId を渡すと「置き換えられる分」も一緒に返す。 */
  const readStats = (os, replacingId, cb) => {
    const idx = sizeKey && os.indexNames.contains(sizeKey) ? os.index(sizeKey) : null;
    if (!idx) { statsFromAll(os, replacingId, cb); return; }
    /* index の「キー」（＝各レコードの size）を1件ずつ読む。IDBIndex.getAllKeys() は**主キー**を返すので使わない。
       主キーを size と取り違えると合計が出たらめになり、文字列の主キー（パックは "p…"）では高速経路が毎回外れて
       Blob を含む全件を読んでいた。openKeyCursor の cursor.key が索引の値。 */
    let keys = [], keysDone = false, count = null, prev = replacingId == null ? null : undefined, out = null;
    const maybe = () => {
      if (out || !keysDone || count === null || prev === undefined) return;
      out = statsFromKeys(keys, count, prev);
      if (out) cb(out); else statsFromAll(os, replacingId, s => { out = s; cb(s); });
    };
    idx.openKeyCursor().onsuccess = e => {
      const c = e.target.result;
      if (c) { keys.push(c.key); c.continue(); } else { keysDone = true; maybe(); }
    };
    os.count().onsuccess = e => { count = e.target.result || 0; maybe(); };
    if (replacingId == null) prev = null;
    else os.get(replacingId).onsuccess = e => { prev = e.target.result == null ? null : e.target.result; maybe(); };
  };
  return {
    get: k => run("readonly", s => s.get(k)),
    put: (k, v) => run("readwrite", s => s.put(v, k)),
    /* 合計だけを知りたいとき（Blob を復元しない。件数が食い違えば自動で全件を数え直す） */
    usage: () => open().then(db => new Promise((res, rej) => {
      const tx = db.transaction(store, "readonly"), os = tx.objectStore(store);
      readStats(os, null, res);
      tx.onerror = tx.onabort = () => rej(tx.error || new Error("IndexedDB usage read failed"));
    })),
    /* 上限の判定と put を**同じ readwrite トランザクション内**で一体化する（複数タブ間の競合を防ぐ）。
       predicate には全レコードではなく**集計値** { stored, replacing, count, fast } を渡す。opts.idKey を使う場合はそのキーで置換分を差し引く。 */
    putIf: (k, v, predicate) => open().then(db => new Promise((res, rej) => {
      const tx = db.transaction(store, "readwrite"), os = tx.objectStore(store);
      let permitted = false, checkError = null;
      readStats(os, v && v[idKey], stats => {
        try {
          permitted = predicate(stats) === true;
          if (permitted) os.put(v, k);
        } catch (e) { checkError = e; tx.abort(); }
      });
      tx.oncomplete = () => res(permitted);
      tx.onerror = tx.onabort = () => rej(checkError || tx.error || new Error("IndexedDB transaction aborted"));
    })),
    del: k => run("readwrite", s => s.delete(k)),
    all: () => run("readonly", s => s.getAll()),
    keys: () => run("readonly", s => s.getAllKeys())
  };
}

/* ---------- ステータス表示（言語を変えると訳し直す） ---------- */
const statusState = {};
function setStatus(id, key, vars) { statusState[id] = key ? { key, vars } : null; renderStatus(id); }
function renderStatus(id) {
  const n = $(id), s = statusState[id]; if (!n) return;
  n.textContent = !s ? "" : (typeof s.key === "function" ? s.key() : tr(s.key, s.vars));
}
function renderAllStatuses() { Object.keys(statusState).forEach(renderStatus); }

/* ---------- 言語 ---------- */
function applyLanguage(code) {
  lang = TEXT[code] ? code : "en"; settings.language = lang; $("language").value = lang;
  document.documentElement.lang = { ja:"ja", en:"en", zh:"zh-CN", ko:"ko" }[lang];
  document.querySelectorAll("[data-i18n]").forEach(n => { n.textContent = tr(n.dataset.i18n); });
  /* 読み上げ名（aria-label）も同じ辞書から。data-i18n-aria="key" と書く */
  document.querySelectorAll("[data-i18n-aria]").forEach(n => { n.setAttribute("aria-label", tr(n.dataset.i18nAria)); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(n => { n.placeholder = tr(n.dataset.i18nPlaceholder); });
  buildSkinGrid(); updateKeyUI(); updateTouchKeys(); refreshSeedSecrets(); syncPickers(); renderAllStatuses();
  if (typeof updatePadUI === "function") updatePadUI();   // 🎮 pad.js（読み込み前は何もしない）
  emit("language");
}

/* ---------- スキン ---------- */
const SKIN_CATS = [["all","catAll"],["basic","catBasic"],["type","catType"],["miku","catMiku"],["dark","catDark"],["light","catLight"],["grad","catGrad"],["fun","catFun"],["access","catAccess"],["life","catLife"],["wizard","catWizard"],["custom","catCustom"]];
const skinCatList = s => (s.custom || s.pack) ? ["custom"] : (Array.isArray(s.cat) && s.cat.length ? s.cat : ["basic"]);
/* 🔤 書体スキン（trk228）：棚カードの中だけに書体・太さ・字間を効かせる。書体見本の文字も添える */
function skinCardType(b, s) {
  if (s.font) b.style.setProperty("--sk-font", s.font);
  const t = s.type; if (!t) return;
  /* 書体スキンの説明文だけは、読みやすいよう本文の書体に戻す（12px の明朝は読みにくいため） */
  b.style.setProperty("--sk-note", "var(--font)");
  if (t.title) b.style.setProperty("--sk-title", t.title);
  if (t.titleWeight) b.style.setProperty("--sk-weight", t.titleWeight);
  if (t.titleSpace) b.style.setProperty("--sk-space", t.titleSpace);
  if (t.titleTransform) b.style.setProperty("--sk-transform", t.titleTransform);
}
function skinSpecNode(s) {
  const t = s.type; if (!t || !t.mark) return null;
  return el("span", "skinSpec", t.mark);
}
/* 今 使っているスキン（棚を閉じていても見える）。押すと棚が開く */
function buildSkinNow() {
  const now = $("skinNow"); if (!now) return;
  const s = skin(); now.textContent = "";
  const b = el("button", "skinCard"); b.type = "button";
  b.style.setProperty("--sk-bg", s.game.stage); b.style.setProperty("--sk-text", s.ui["--ui-text"]);
  b.style.setProperty("--sk-border", s.ui["--ui-border"]);
  skinCardType(b, s);
  const dots = el("span", "dots");
  for (const c of [s.ui["--ui-accent"], s.ui["--ui-gold"], s.ui["--ui-text"]]) { const d = el("i", "dot square"); d.style.background = c; dots.append(d); }
  b.append(dots, el("b", "", s.label[lang] || s.label.en));
  const spec = skinSpecNode(s); if (spec) b.append(spec);
  b.append(el("small", "", (s.desc && (s.desc[lang] || s.desc.en)) || ""));
  b.title = tr("skinShelf"); b.setAttribute("aria-label", tr("skinShelf"));
  b.addEventListener("click", () => { const shelf = $("skinShelf"); if (shelf) shelf.open = true; });
  now.append(b);
}
/* ---------- 🧺 スキンの棚の整理（trk229） ----------
   スキンが53種になったので、探す・並べる・⭐・🚫 を足しました。
   判定と並べ替えは純粋関数（skinMatchesQuery／skinShelfEntries）にして、テストから同じものを動かせます。 */
const SKIN_SORT_IDS = ["default", "name", "used", "recent"];
const SKIN_ONLY_IDS = ["", "fav", "recent", "hidden"];
let skinQuery = "";          /* 検索欄の文字（保存はしない。開き直すと空） */
let skinFindWired = false;   /* 入力欄の配線は1回だけ */
function skinSearchText(id, s) {
  const label = s.label || {}, desc = s.desc || {};
  return [id, ...Object.values(label), ...Object.values(desc), ...(Array.isArray(s.cat) ? s.cat : [])]
    .filter(v => typeof v === "string").join(" ").toLowerCase();
}
/* 空白で区切った語は「すべて含む」で一致（例：「明朝 dark」） */
function skinMatchesQuery(id, s, query) {
  const words = String(query || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = skinSearchText(id, s);
  return words.every(w => text.includes(w));
}
/* 📚 trk274：巻の一覧（`js/skins-volumes.js` が入れた SKIN_VOLUMES）。無ければ空。
   巻の目録は**データ**なので、選んだ巻に属する ID をそのまま使います。 */
function skinVolumes() {
  const v = window.Trk && window.Trk.data && window.Trk.data.SKIN_VOLUMES;
  return Array.isArray(v) ? v : [];
}
/* 📚 trk275（レビュー R4）：巻の題名は目録では**日本語**でした。画面の言語に合わせて出します
   （辞書に無い巻は目録の題名をそのまま）。 */
const SKIN_VOL_NAME_KEYS = {
  "vol-01": "skinVolNameVol01", "vol-02": "skinVolNameVol02", "vol-03": "skinVolNameVol03",
  "vol-04": "skinVolNameVol04", "vol-05": "skinVolNameVol05", "vol-06": "skinVolNameVol06",
  "vol-07": "skinVolNameVol07", "vol-08": "skinVolNameVol08", "vol-09": "skinVolNameVol09",
  "vol-10": "skinVolNameVol10", glitch: "skinVolNameGlitch", wizard: "skinVolNameWizard", other: "skinVolNameOther",
};
function skinVolTitle(g) {
  if (!g) return "";
  const key = SKIN_VOL_NAME_KEYS[g.id];
  if (key) { const t = tr(key); if (t && t !== key) return t; }
  return g.title || g.id || "";
}
/* ⚖ trk281：段ごとに、既定の棚へ出すスキンのカテゴリ（ご相談 2026-11-03）。
   ・シンプル／スタンダード＝定番・書体・ダーク・ライト・グラデ（ミクの 4 種は「定番」に入っています）
   ・プロ＝＋遊び心
   ・マスター＝＋みやすさ・生活
   ・ウィザード＝＋ウィザード（初見の驚きは、この段で。wizard の巻も既定の棚に戻ります）
   巻を選んだとき・ALL のときは掛けません（選んだものは全部見せる）。
   ウィザードの段だけは、既定の棚に wizard の巻も戻ります（trk280 で外した「定番＋ウィザード」）。 */
const SKIN_LEVEL_CATS = {
  simple:   ["basic", "type", "dark", "light", "grad"],
  standard: ["basic", "type", "dark", "light", "grad"],
  pro:      ["basic", "type", "dark", "light", "grad", "fun"],
  master:   ["basic", "type", "dark", "light", "grad", "fun", "access", "life"],
  wizard:   ["basic", "type", "dark", "light", "grad", "fun", "access", "life", "wizard"],
};
/* その段で、そのスキンを既定の棚に出してよいか。純粋関数。 */
function skinLevelAllows(cats, level) {
  const allowed = SKIN_LEVEL_CATS[level] || SKIN_LEVEL_CATS.standard;
  const list = Array.isArray(cats) && cats.length ? cats : ["basic"];
  return list.some(c => allowed.includes(c));
}

/* 絞り込み（カテゴリ・⭐・🕒・🚫・巻・検索）と並べ替えを、1か所で決める */
function skinShelfEntries(skins, opt) {
  const o = opt || {}, cat = o.cat || "all", only = o.only || "";
  const fav = new Set(o.fav || []), hidden = new Set(o.hidden || []);
  const use = o.use || {}, last = o.last || {}, locale = o.locale || "ja";
  const nameOf = id => { const s = skins[id]; return String((s.label && (s.label[locale] || s.label.en)) || id); };
  const byName = (a, b) => nameOf(a[0]).localeCompare(nameOf(b[0]), locale) || a[0].localeCompare(b[0]);
  /* 📚 trk274：巻の絞り込み。"" は**定番＋ウィザードだけ**（vol.1〜10・glitch は選んだときだけ）、
     "all" は全部、それ以外はその巻の ID だけ。純粋関数のまま（テストから同じものを動かせる） */
  const volumes = Array.isArray(o.volumes) ? o.volumes : [];
  const vol = o.vol || "";
  /* 📚 trk275（レビュー M2）：⭐・🕒・🚫 の絞り込みと検索は、**巻の外も見る**。
     trk241 の「いま使っているスキンは棚に残す」と同じ考え方で、
     絞り込みを掛けているときに巻で切り落とすと「消えた」ように見えるためです。 */
  const acrossVolumes = only === "fav" || only === "recent" || only === "hidden" || String(o.query || "").trim() !== "";
  let volSet = null, outside = null;
  if (!acrossVolumes && vol && vol !== "all") {
    const g = volumes.find(x => x && x.id === vol);
    if (g && Array.isArray(g.ids)) volSet = new Set(g.ids);
  }
  const defaultVol = !acrossVolumes && !volSet && vol !== "all";   /* "" と知らない巻名＝既定の棚 */
  if (defaultVol) {
    /* "" （既定）と、知らない巻名（古い保存・目録が減ったとき）は同じ扱い＝**定番だけ**。
       ⚖ trk280：ご相談「ウィザードは定番＋ウィザードから外す（初見の驚きを残す）」により、
       wizard も既定の棚から外しました（📚 の巻で wizard を選んだとき・ALL では見えます）。 */
    outside = new Set();
    for (const g of volumes) {
      if (!g || g.id === "other") continue;
      /* ⚖ trk281：ウィザードの段では、wizard の巻を既定の棚に戻す（5 段目だけの特権） */
      if (o.level === "wizard" && g.id === "wizard") continue;
      for (const id of Array.isArray(g.ids) ? g.ids : []) outside.add(id);
    }
  }
  const out = [];
  for (const [id, s] of Object.entries(skins)) {
    if (cat !== "all" && !skinCatList(s).includes(cat)) continue;
    /* 📚 trk275：**いま当てているスキン**は、選んだ巻の外でも棚に残す（M2-a） */
    const inUse = id === o.current;
    if (volSet && !volSet.has(id) && !inUse) continue;
    if (outside && outside.has(id) && !inUse) continue;
    /* ⚠ 差し戻し（目録の色のまま）は**既定の棚に出さない**（ALL と、その巻では見える）。
       選んでいるとき・絞り込みのときは消さない（M2 と同じ理由） */
    /* 差し戻し（目録へお返し中）は、**明示的にその巻を選んだとき**と ALL だけ（Q2）。
     知らない巻名・巻の目録が読めないときは「選んでいない」扱いで外します。 */
  if (s.holdback && !inUse && vol !== "all" && !(volSet && volSet.has(id))) continue;
    /* ⚖ trk280：既定の棚にはウィザードを出さない（巻の目録が読めないときも同じ。
       目録が無いと巻で切れないので、カテゴリで外します）。 */
    if (defaultVol && !inUse && o.level !== "wizard" && skinCatList(s).includes("wizard")) continue;
    /* ⚖ trk281：既定の棚は、段（シンプル〜ウィザード）でカテゴリを絞る */
    if (defaultVol && !inUse && !skinLevelAllows(skinCatList(s), o.level)) continue;
    /* 隠したスキンは「🚫 隠した」を見ているときだけ出す。
       ⚠ trk241：**いま使っているスキンだけは、隠しても棚に残す**（消えたように見えると、
          当たっているのに「効かない」と誤解されるため。印は 🚫 で出す）。 */
    if (only === "fav") { if (!fav.has(id)) continue; }
    else if (only === "recent") { if (!(last[id] > 0)) continue; }
    else if (only === "hidden") { if (!hidden.has(id)) continue; }
    else if (hidden.has(id) && id !== o.current) continue;
    if (!skinMatchesQuery(id, s, o.query)) continue;
    out.push([id, s]);
  }
  /* ⚖ trk281：⭐ を付けたスキンは棚の先頭へ（隠しません。並びだけ）。
     並べ方を選んでいるときは、その並びを尊重して動かしません。 */
  if ((!o.sort || o.sort === "default") && fav.size) {
    out.sort((a, b) => (fav.has(b[0]) ? 1 : 0) - (fav.has(a[0]) ? 1 : 0));
  }
  if (o.sort === "name") out.sort(byName);
  else if (o.sort === "used") out.sort((a, b) => (use[b[0]] || 0) - (use[a[0]] || 0) || byName(a, b));
  else if (o.sort === "recent") out.sort((a, b) => (last[b[0]] || 0) - (last[a[0]] || 0) || byName(a, b));
  return out;
}
/* ⭐・🚫 の切り替え（保存して棚を作り直す） */
function toggleSkinList(key, id) {
  const set = new Set(Array.isArray(settings[key]) ? settings[key] : []);
  if (set.has(id)) set.delete(id); else set.add(id);
  settings[key] = cleanSkinIdList([...set]);
  saveUserPrefs(); buildSkinGrid();
}
/* ---------- 🧺 trk241：棚の出し入れを、棚からも整理からも、まとめても ----------
   利用者の相談：「スキンの数を作ると、デフォルトで入っている使わないものに煩わしさを与えてしまう」
   　→ **削除ではなく、スキンごとに一時的な非表示**（trk229 の 🚫 を、もっと軽く・安全に）。
   決めたこと：
     ・隠すのは**この端末の設定だけ**（スキンそのものは消さない。当てることもできる）
     ・**いま使っているスキンは隠しても棚に残す**（使用中の印。効かないと誤解されないため）
     ・**最後の 1 種は隠せない**（棚が空になると「スキンが消えた」に見える）
     ・隠した数は棚の下に必ず出し、そこから 1 タップで戻せる
     ・まとめて隠せるのは**使ったことのないスキン**だけ（使っているものは人の判断に残す） */
const SKIN_MANAGE_FILTERS = ["all", "fav", "hidden", "unused"];
/* 隠してよいか（棚に残るものが 1 種も無くならないか）。純粋関数。 */
function skinCanHide(skins, id, hidden, current) {
  const hid = new Set(Array.isArray(hidden) ? hidden : []);
  if (hid.has(id)) return { ok:true, reason:"" };      /* もう隠れている＝何もしない（戻す側の操作） */
  const ids = Object.keys(skins || {});
  if (!ids.includes(id)) return { ok:false, reason:"unknown" };
  /* 隠したあとに棚へ残る数（いま使っているスキンを隠すときは、棚に残す決まりなので 1 は残る） */
  const left = ids.filter(x => !hid.has(x) && x !== id).length;
  const keepCurrent = current === id ? 1 : 0;
  if (left + keepCurrent <= 0) return { ok:false, reason:"last" };
  return { ok:true, reason:"" };
}
/* 隠した状態を変える（1 種）。保存して棚を作り直し、結果を返す。 */
function setSkinHidden(id, on) {
  const hid = new Set(settings.skinHidden);
  if (on) {
    const g = skinCanHide(window.Trk.data.SKINS, id, settings.skinHidden, settings.skin);
    if (!g.ok) return g;
    hid.add(id);
  } else hid.delete(id);
  settings.skinHidden = cleanSkinIdList([...hid]);
  saveUserPrefs(); buildSkinGrid();
  return { ok:true, reason:"" };
}
/* 整理の一覧に出す行（検索・絞り込み・名前順）。純粋関数。 */
function skinManageRows(skins, opt) {
  const o = opt || {}, filter = SKIN_MANAGE_FILTERS.includes(o.filter) ? o.filter : "all";
  const fav = new Set(o.fav || []), hid = new Set(o.hidden || []), use = o.use || {};
  const locale = o.locale || "ja";
  const nameOf = id => String((skins[id].label && (skins[id].label[locale] || skins[id].label.en)) || id);
  const rows = [];
  for (const id of Object.keys(skins || {})) {
    const used = Number(use[id]) || 0;
    if (filter === "fav" && !fav.has(id)) continue;
    if (filter === "hidden" && !hid.has(id)) continue;
    if (filter === "unused" && used > 0) continue;
    if (!skinMatchesQuery(id, skins[id], o.query)) continue;
    rows.push(id);
  }
  return rows.sort((a, b) => nameOf(a).localeCompare(nameOf(b), locale) || a.localeCompare(b));
}
/* まとめて隠す／戻す。純粋関数。
   mode:"unused"＝使ったことのない（いま使っているもの・⭐・もう隠しているものは除く）を隠す
   mode:"restore"＝隠しているものを全部戻す */
function skinBulkPlan(skins, opt) {
  const o = opt || {}, hid = new Set(o.hidden || []), fav = new Set(o.fav || []), use = o.use || {};
  const ids = Object.keys(skins || {});
  if (o.mode === "restore") return { ids: ids.filter(id => hid.has(id)), mode:"restore" };
  const target = ids.filter(id => !hid.has(id) && id !== o.current && !fav.has(id) && !(Number(use[id]) > 0));
  /* 隠したあとに棚が空にならないよう、残る数を確かめてから（多すぎるときは後ろから削る） */
  const visible = ids.filter(id => !hid.has(id)).length;
  const room = Math.max(0, visible - 1 - (o.current && !hid.has(o.current) ? 0 : 0));
  return { ids: target.slice(0, room), mode:"unused" };
}
function wireSkinFind() {
  if (skinFindWired) return;
  const q = $("skinSearch"), sort = $("skinSort");
  if (!q || !sort) return;
  skinFindWired = true;
  q.addEventListener("input", () => { skinQuery = q.value; buildSkinGrid(); });
  sort.addEventListener("change", () => {
    settings.skinSort = pick(sort.value, SKIN_SORT_IDS, "default"); saveUserPrefs(); buildSkinGrid();
  });
  /* 📚 trk274：巻の絞り込み。<select> は**どのブラウザでも効く**控えめな入口、
     popover のパネルは同じ値を選ぶ近道（G-1） */
  const volSel = $("skinVol");
  if (volSel) volSel.addEventListener("change", () => { setSkinVol(volSel.value); });
  wireSkinVolKeys();
  const volPanel = $("skinVolPanel"), volBtn = $("skinVolBtn");
  if (volPanel) {
    /* popover を知らないブラウザ（古い Safari など）では、出しっぱなしにせず**隠す**。
       その場合も <select> で選べるので、用は足ります */
    if (typeof volPanel.showPopover !== "function") {
      volPanel.hidden = true;
      if (volBtn) volBtn.hidden = true;
    } else {
      volPanel.hidden = false;
      if (volBtn) volBtn.hidden = false;
    }
  }
}
/* ==================== ⌨ trk276：📚 をキーで動かす ====================
   ご要望：上下を含む 4 方向を**アサイン**できて、**使わない**設定も選べる。
   縦読み（縦書き）の本を読む人は「↓ が次」なので、読み方向を切り替えます。
   - row（横書き）：← → が読み順（行の端は次の行へ）／↑ ↓ は同じ列の前後の行
   - col（縦書き）：↑ ↓ が読み順（列の端は次の列の先頭へ）／← → は同じ行の前後の列
   端では止まります（回り込まない）。移動は**フォーカスだけ**（Enter／Space で決定）。 */

/* 見た目の格子を読む（幅で列数が変わるので、固定の列数にはしない） */
function volLayout(rects) {
  const tol = 4, rows = [];
  const order = rects.map((r, i) => i).sort((a, b) => rects[a].top - rects[b].top || rects[a].left - rects[b].left);
  for (const i of order) {
    const r = rects[i];
    let row = rows.find(x => Math.abs(x.top - r.top) <= tol);
    if (!row) { row = { top: r.top, items: [] }; rows.push(row); }
    row.items.push(i);
  }
  rows.sort((a, b) => a.top - b.top);
  for (const row of rows) row.items.sort((a, b) => rects[a].left - rects[b].left);
  const cols = rows.reduce((n, row) => Math.max(n, row.items.length), 0);
  const pos = [];
  rows.forEach((row, ri) => row.items.forEach((idx, ci) => { pos[idx] = { ri, ci }; }));
  const byRow = rows.flatMap(row => row.items);            /* 横書きの読み順 */
  const byCol = [];                                        /* 縦書きの読み順（列ごと） */
  for (let ci = 0; ci < cols; ci++) for (const row of rows) if (row.items[ci] !== undefined) byCol.push(row.items[ci]);
  return { rows, cols, pos, byRow, byCol };
}
/* move: left／right／up／down。返り値は移動先の index（無ければ -1）。
   wrap=true なら、端の次は**反対側の端**へ（「端から反対側へ回り込む」） */
function volMove(rects, i, move, mode, wrap) {
  const n = Array.isArray(rects) ? rects.length : 0;
  if (!n) return -1;
  if (!(i >= 0 && i < n)) return 0;
  const L = volLayout(rects), p = L.pos[i];
  if (!p) return -1;
  const lastRow = L.rows.length - 1, lastCol = L.cols - 1;
  /* 同じ行の ci 列目（その行が短ければ、いちばん右の札に寄せる） */
  const at = (ri, ci) => {
    const row = L.rows[ri];
    if (!row || !row.items.length || L.cols === 0) return -1;
    return row.items[Math.min(Math.max(ci, 0), row.items.length - 1)];
  };
  const seq = mode === "col" ? L.byCol : L.byRow;
  const k = seq.indexOf(i);
  /* 読み順（横書き＝← →、縦書き＝↑ ↓） */
  if ((mode === "col" && (move === "up" || move === "down")) || (mode !== "col" && (move === "left" || move === "right"))) {
    const d = (move === "right" || move === "down") ? 1 : -1;
    if (k < 0) return -1;
    const to = k + d;
    if (to >= 0 && to < seq.length) return seq[to];
    if (!wrap) return -1;
    return d > 0 ? seq[0] : seq[seq.length - 1];
  }
  /* 直交（横書き＝↑ ↓、縦書き＝← →） */
  if (mode === "col") {
    const to = p.ci + (move === "left" ? -1 : 1);
    if (to >= 0 && to <= lastCol) return at(p.ri, to);
    if (!wrap) return -1;
    return at(p.ri, move === "left" ? lastCol : 0);
  }
  const to = p.ri + (move === "up" ? -1 : 1);
  if (to >= 0 && to <= lastRow) return at(to, p.ci);
  if (!wrap) return -1;
  return at(move === "up" ? lastRow : 0, p.ci);
}
/* 押されたキー → 4 方向のどれか（アサインを見る） */
function volMoveOf(code) {
  if (!code) return "";
  if (code === settings.skinVolKeyL) return "left";
  if (code === settings.skinVolKeyR) return "right";
  if (code === settings.skinVolKeyU) return "up";
  if (code === settings.skinVolKeyD) return "down";
  return "";
}
let skinVolKeysWired = false, volKeyListening = "";
function skinVolCards() {
  const list = $("skinVolList");
  return list ? [...list.querySelectorAll('[role="radio"]')] : [];
}
/* 4 つのキーの見せ方（アサインのボタン・読み方向の入切）を、いまの設定に合わせる */
function renderSkinVolKeys() {
  const on = settings.skinVolNav !== "off";
  /* ほかの選択肢（.seg）と同じ印＝.selected＋aria-pressed にそろえます */
  document.querySelectorAll("[data-volnav]").forEach(b => {
    const sel = (b.dataset.volnav === "off") !== on;
    b.classList.toggle("selected", sel); b.setAttribute("aria-pressed", String(sel));
  });
  document.querySelectorAll("[data-voldir]").forEach(b => {
    const sel = b.dataset.voldir === settings.skinVolDir;
    b.classList.toggle("selected", sel); b.setAttribute("aria-pressed", String(sel));
  });
  document.querySelectorAll("[data-volwrap]").forEach(b => {
    const sel = b.dataset.volwrap === settings.skinVolWrap;
    b.classList.toggle("selected", sel); b.setAttribute("aria-pressed", String(sel));
  });
  for (const k of ["L", "R", "U", "D"]) {
    const b = document.querySelector(`[data-volkey="${k}"]`);
    if (!b) continue;
    const listening = volKeyListening === k;
    b.textContent = listening ? tr("skinVolKeysListening") : formatKey(settings["skinVolKey" + k]);
    b.classList.toggle("listening", listening);
    b.setAttribute("aria-pressed", String(listening));
  }
  const box = $("skinVolKeyPad"), dirBox = $("skinVolDirRow");
  for (const node of [box, dirBox]) if (node) node.toggleAttribute("data-off", !on);
}
/* アサインを決める（Esc は取り消し。ほかの向きと重なったら入れ替える） */
function setSkinVolKey(kind, code) {
  if (!["L", "R", "U", "D"].includes(kind) || !validCode(code)) return false;
  const key = "skinVolKey" + kind;
  const old = settings[key];
  for (const [k, name] of [["L", "skinVolKeyL"], ["R", "skinVolKeyR"], ["U", "skinVolKeyU"], ["D", "skinVolKeyD"]]) {
    if (name !== key && settings[name] === code) settings[name] = old;   /* 重なりは入れ替え */
  }
  settings[key] = code;
  saveUserPrefs(); renderSkinVolKeys();
  return true;
}
function setSkinVolNav(on) {
  settings.skinVolNav = on ? "on" : "off";
  saveUserPrefs(); renderSkinVolKeys();
}
function setSkinVolDir(dir) {
  settings.skinVolDir = dir === "col" ? "col" : "row";
  saveUserPrefs(); renderSkinVolKeys();
}
const SKIN_VOL_WRAP_IDS = ["stop", "wrap", "chain"];
function setSkinVolWrap(mode) {
  settings.skinVolWrap = pick(mode, SKIN_VOL_WRAP_IDS, "stop");
  saveUserPrefs(); renderSkinVolKeys();
}
/* 一覧の中の 1 枚へフォーカスを移す（roving tabindex も一緒に） */
function focusVolCard(cards, idx) {
  if (!Array.isArray(cards) || !cards[idx]) return;
  cards.forEach((c, i) => { c.tabIndex = i === idx ? 0 : -1; });
  cards[idx].focus();
}
/* 連読：端の次を「次の本（巻）」へつなぐ。パネルは開いたまま、その本の先頭／末尾へ */
function volChainStep(forward) {
  const target = volChainTarget(skinVolBooks(), settings.skinShelfVol, forward);
  if (!target) return false;                       /* 既定・ALL は「本」が決まらないので回り込みへ */
  selectSkinVol(target);
  const cards = skinVolCards();
  focusVolCard(cards, forward ? 0 : cards.length - 1);
  const g = skinVolumes().find(x => x && x.id === target);
  announceVolText(tr(forward ? "skinVolChainedNext" : "skinVolChainedPrev", {
    name: skinVolTitle(g), n: cards.length,
  }));
  return true;
}
function wireSkinVolKeys() {
  if (skinVolKeysWired) return;
  const list = $("skinVolList");
  if (!list) return;
  skinVolKeysWired = true;
  /* 矢印キー：フォーカスだけ移す（決定は Enter／Space＝button の標準の動き） */
  list.addEventListener("keydown", e => {
    if (settings.skinVolNav === "off") return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    let move = volMoveOf(keyCodeOf(e) || e.code);
    if (!move && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown")) {
      move = e.key.slice(5).toLowerCase();       /* アサインを外した矢印は、そのまま格子の向き */
    }
    if (!move) return;
    const cards = skinVolCards();
    const from = cards.indexOf(document.activeElement);
    if (from < 0) return;
    const dir = settings.skinVolDir;
    /* 読み進む向きか（横書き＝→、縦書き＝↓） */
    const forward = dir === "col" ? move === "down" : move === "right";
    const backward = dir === "col" ? move === "up" : move === "left";
    const rects = cards.map(c => { const r = c.getBoundingClientRect(); return { top: r.top, left: r.left }; });
    const plain = volMove(rects, from, move, dir, false);
    e.preventDefault();
    if (plain >= 0) { focusVolCard(cards, plain); return; }
    /* ここから端。stop＝止まる／wrap＝反対側へ回り込む／chain＝次の本へ続ける（連読） */
    const mode = settings.skinVolWrap;
    if (mode === "stop") return;
    const wrapped = volMove(rects, from, move, dir, true);
    if (mode === "wrap") {
      if (wrapped >= 0) {
        focusVolCard(cards, wrapped);
        /* 「先頭に戻りました」「末尾に戻りました」（伝わる言い方で） */
        announceVolText(tr(forward || move === "down" || move === "right" ? "skinVolWrappedTop" : "skinVolWrappedBottom"));
      }
      return;
    }
    /* chain：読み軸の向きだけ、次の本（巻）へ。本が決まらない（既定・ALL）ときは回り込み */
    if ((forward || backward) && volChainStep(forward)) return;
    if (wrapped >= 0) {
      focusVolCard(cards, wrapped);
      announceVolText(tr(forward || move === "down" || move === "right" ? "skinVolWrappedTop" : "skinVolWrappedBottom"));
    }
  });
  /* フォーカスが入ったら、そこを Tab の入口にする（roving） */
  list.addEventListener("focusin", e => {
    const cards = skinVolCards(), i = cards.indexOf(e.target);
    if (i < 0) return;
    cards.forEach((c, k) => { c.tabIndex = k === i ? 0 : -1; });
  });
  /* 入切・読み方向 */
  document.querySelectorAll("[data-volnav]").forEach(b => b.addEventListener("click", () => setSkinVolNav(b.dataset.volnav !== "off")));
  document.querySelectorAll("[data-voldir]").forEach(b => b.addEventListener("click", () => setSkinVolDir(b.dataset.voldir)));
  document.querySelectorAll("[data-volwrap]").forEach(b => b.addEventListener("click", () => setSkinVolWrap(b.dataset.volwrap)));
  /* 4 方向のアサイン：押したら「キーを押してください」で待つ */
  document.querySelectorAll("[data-volkey]").forEach(b => b.addEventListener("click", () => {
    volKeyListening = volKeyListening === b.dataset.volkey ? "" : b.dataset.volkey;
    renderSkinVolKeys();
    if (volKeyListening) b.blur();
  }));
  /* 待っている間のキーは、ここで受け取る（設定を閉じる Esc より先に） */
  addEventListener("keydown", e => {
    if (!volKeyListening) return;
    const kind = volKeyListening;
    e.preventDefault(); e.stopPropagation();
    if (e.key === "Escape") { volKeyListening = ""; renderSkinVolKeys(); return; }
    const code = keyCodeOf(e) || e.code;
    if (!validCode(code)) return;
    volKeyListening = "";
    setSkinVolKey(kind, code);
  }, true);
  renderSkinVolKeys();
}
/* 棚に出している枚数（読み上げに使う） */
let skinShownCount = 0;
/* 状態の行に 1 文を出す（読み上げは #skinVolStatus の aria-live が行う） */
function announceVolText(text) {
  const box = $("skinVolStatus");
  if (!box) return;
  box.textContent = "";
  requestAnimationFrame(() => { box.textContent = text; });
}
/* 本（巻）の並び。"" と "all" は「本」ではないので、連読では使いません */
function skinVolBooks() {
  return skinVolumes().map(g => g && g.id).filter(Boolean);
}
/* 連読：前の本／次の本（端は反対側へつなぐ＝最後の本の次は最初の本） */
function volChainTarget(books, cur, forward) {
  const list = Array.isArray(books) ? books.filter(Boolean) : [];
  const i = list.indexOf(cur);
  if (i < 0 || !list.length) return "";
  return list[(i + (forward ? 1 : -1) + list.length) % list.length];
}
/* 巻を切り替えた結果を、見た目と同時に読み上げる（G-3・aria-live） */
function announceSkinVol(vol) {
  const box = $("skinVolStatus");
  if (!box) return;
  const volumes = skinVolumes();
  const g = volumes.find(x => x && x.id === vol);
  const name = vol === "" ? tr("skinVolDefault") : vol === "all" ? tr("skinVolAll") : (g ? skinVolTitle(g) : vol);
  const text = tr("skinVolShown", { name, n: skinShownCount });
  box.textContent = "";                       /* 同じ文でも読み上げ直されるように、いったん空へ */
  requestAnimationFrame(() => { box.textContent = text; });
}
/* 巻を選ぶ（保存して棚を作り直す）。"" は定番＋ウィザード、"all" は全部 */
/* 選ぶだけ（パネルは閉じない）。連読で「次の本へ移る」ときに使います */
function selectSkinVol(vol) {
  const volumes = skinVolumes();
  const known = ["", "all", ...volumes.map(g => g && g.id).filter(Boolean)];
  settings.skinShelfVol = known.includes(vol) ? vol : "";
  saveUserPrefs();
  buildSkinGrid();
  return settings.skinShelfVol;
}
function setSkinVol(vol) {
  selectSkinVol(vol);
  announceSkinVol(settings.skinShelfVol);
  const panel = $("skinVolPanel");
  if (panel && typeof panel.hidePopover === "function" && panel.matches(":popover-open")) {
    panel.hidePopover();
    /* ⌨ trk276：パネルが閉じたら、開いたボタンへフォーカスを戻す（キーだけで往復できる） */
    const btn = $("skinVolBtn");
    if (btn && !btn.hidden) btn.focus();
  }
}
/* 巻の <select> と popover のパネルを、いまの目録から作り直す */
/* 📚 trk275：巻の絞り込みで**実際に出る枚数**（既定・ALL・各巻）を数える。
   レビュー M3/R6：「定番＋ウィザード」に全体の数（291）が入っていた／
   「（115／291）」と言いながら実際は 114 枚だった、を同じ数え方で揃えます。 */
function skinVolCount(skins, volumes, vol) {
  return skinShelfEntries(skins, {
    vol, volumes, locale: lang, fav: [], hidden: [], use: {}, last: {}, level: settings.setLevel,
  }).length;
}
function buildSkinVolControls(volumes, skins) {
  const sel = $("skinVol");
  if (sel) {
    const want = settings.skinShelfVol || "";
    const opts = [["", tr("skinVolDefault")], ["all", tr("skinVolAll")],
      ...volumes.map(g => [g.id, `${skinVolTitle(g)}（${g.ids.length}）`])];
    sel.textContent = "";
    for (const [value, label] of opts) {
      const o = document.createElement("option");
      o.value = value; o.textContent = label;
      sel.append(o);
    }
    sel.value = opts.some(([v]) => v === want) ? want : "";
  }
  const list = $("skinVolList");
  if (list) {
    list.textContent = "";
    /* 1 つだけ選ぶものなので radiogroup／radio（レビュー R5） */
    list.setAttribute("role", "radiogroup");
    const add = (value, label, count) => {
      const b = el("button", "skinVolCard");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.classList.toggle("on", (settings.skinShelfVol || "") === value);
      b.setAttribute("aria-checked", String((settings.skinShelfVol || "") === value));
      b.append(el("b", "", label), el("small", "", tr("skinVolItems", { n: count })));
      b.addEventListener("click", () => setSkinVol(value));
      /* ⌨ trk276：選ばれている 1 枚だけ Tab で止まる（roving tabindex）。
         ほかは Tab では飛ばし、矢印キーで移ります（15 枚を Tab で渡らせない） */
      b.tabIndex = (settings.skinShelfVol || "") === value ? 0 : -1;
      list.append(b);
    };
    add("", tr("skinVolDefault"), skinVolCount(skins, volumes, ""));
    add("all", tr("skinVolAll"), skinVolCount(skins, volumes, "all"));
    for (const g of volumes) {
      /* 最後の 2 巻（定番・ウィザード）は仲間なので、区切りを 1 行入れてから並べる（レビュー R7）。
         ⚖ trk280：既定の棚は「定番」だけになりました（wizard はここで選んだときだけ）。 */
      if (g.id === "wizard") {
        const sep = el("p", "hint skinVolSep");
        sep.textContent = tr("skinVolGroupClassic");
        list.append(sep);
      }
      add(g.id, skinVolTitle(g), g.ids.length);
    }
    /* どれも選ばれていない（知らない巻名など）ときは先頭を Tab の入口に */
    if (!list.querySelector('[role="radio"][tabindex="0"]')) {
      const first = list.querySelector('[role="radio"]');
      if (first) first.tabIndex = 0;
    }
  }
  renderSkinVolKeys();
}
function buildSkinGrid() {
  const grid = $("skinGrid"); if (!grid) return;
  wireSkinFind();
  grid.textContent = "";
  const skins = window.Trk.data.SKINS;
  /* 棚のチップ（そのカテゴリーに属するスキンがないときはチップ自体を出さない） */
  const cats = new Set(); for (const s of Object.values(skins)) skinCatList(s).forEach(c => cats.add(c));
  const cat = settings.skinShelfCat !== "all" && cats.has(settings.skinShelfCat) ? settings.skinShelfCat : "all";
  const only = SKIN_ONLY_IDS.includes(settings.skinShelfOnly) ? settings.skinShelfOnly : "";
  const chips = $("skinChips");
  if (chips) {
    chips.textContent = "";
    const addChip = (label, isOn, onPick) => {
      const c = el("button", "skinChip"); c.type = "button"; c.textContent = label;
      c.classList.toggle("on", isOn); c.setAttribute("aria-pressed", String(isOn));
      c.addEventListener("click", onPick); chips.append(c);
    };
    for (const [id, key] of SKIN_CATS) {
      if (id !== "all" && !cats.has(id)) continue;
      addChip(tr(key), id === cat && only !== "hidden", () => {
        settings.skinShelfCat = id; if (only === "hidden") settings.skinShelfOnly = ""; saveUserPrefs(); buildSkinGrid();
      });
    }
    /* ⭐ お気に入り・🕒 最近・🚫 隠した（押すと絞り込み、もう一度押すと解除）
       🧺 trk241：⭐ と 🚫 は**数を添える**（隠したことに気づけるように。0 のときは数えません） */
    const recentN = Object.keys(skins).filter(id => settings.skinLast[id] > 0).length;
    const favN = (Array.isArray(settings.skinFav) ? settings.skinFav : []).filter(id => has(skins, id)).length;
    const hidN = (Array.isArray(settings.skinHidden) ? settings.skinHidden : []).filter(id => has(skins, id)).length;
    for (const [val, key, n] of [["fav", "skinOnlyFav", favN], ["recent", "skinOnlyRecent", recentN], ["hidden", "skinOnlyHidden", hidN]]) {
      addChip(n > 0 ? tr(key + "N", { n }) : tr(key), only === val, () => {
        settings.skinShelfOnly = only === val ? "" : val; saveUserPrefs(); buildSkinGrid();
      });
    }
  }
  const volumes = skinVolumes();
  const totalSkins = Object.keys(skins).length;
  buildSkinVolControls(volumes, skins);
  /* 知らない巻名（古い保存・目録が減った）は既定に戻し、**状態の行に 1 行**出す（レビュー Q3） */
  const wantVol = settings.skinShelfVol || "";
  const volKnown = !wantVol || wantVol === "all" || volumes.some(g => g && g.id === wantVol);
  const vol = volKnown ? wantVol : "";
  const list = skinShelfEntries(skins, {
    cat, only, query: skinQuery, sort: settings.skinSort, locale: lang, current: settings.skin,
    fav: settings.skinFav, hidden: settings.skinHidden, use: settings.skinUse, last: settings.skinLast,
    vol, volumes, level: settings.setLevel
  });
  const total = Object.keys(skins).length;
  skinShownCount = list.length;
  const count = $("skinShelfCount");
  if (count) count.textContent = list.length === total ? `（${total}）` : tr("skinCountShown", { shown: list.length, all: total });
  const volStatus = $("skinVolStatus");
  if (volStatus && !volKnown) volStatus.textContent = tr("skinVolUnknown");
  const noMatch = $("skinNoMatch"); if (noMatch) noMatch.hidden = list.length > 0;
  /* 🧺 trk241：隠しているものがあるときは、棚の下に数と「戻す」を必ず出す（隠しっぱなしにしない） */
  const note = $("skinHiddenNote"), noteText = $("skinHiddenNoteText"), noteBtn = $("skinHiddenRestore");
  if (note && noteText && noteBtn) {
    const n = (Array.isArray(settings.skinHidden) ? settings.skinHidden : []).filter(id => has(skins, id)).length;
    note.hidden = n === 0;
    if (n > 0) {
      noteText.textContent = tr("skinHiddenNote", { n });
      noteBtn.textContent = tr("skinHiddenRestore");
      noteBtn.setAttribute("aria-label", tr("skinHiddenRestore"));
      noteBtn.onclick = () => { settings.skinShelfOnly = "hidden"; saveUserPrefs(); buildSkinGrid(); };
    }
  }
  const favSet = new Set(settings.skinFav), hidSet = new Set(settings.skinHidden);
  const marks = id => (favSet.has(id) ? "⭐ " : "") + (hidSet.has(id) ? "🚫 " : "");
  for (const [id, s] of list) {
    if (s.locked && !settings.skinGradUnlocked) {   /* ❓ ごほうびスキン（スタンプ5つで解禁）は、正体不明カードで出す */
      const q = el("button", "skinCard locked"); q.type = "button"; q.disabled = true; q.title = tr("skinLockedHint");
      q.style.setProperty("--sk-bg", "#10142a"); q.style.setProperty("--sk-text", "var(--ui-muted)"); q.style.setProperty("--sk-border", "var(--ui-border)");
      q.append(el("b", "", "❓ ？？？"), el("small", "", tr("skinLockedHint")));
      /* trk275（レビュー R6）：数（115）と描いた枚数がずれないよう、こちらも .skinCell で包む */
      const lockedCell = el("div", "skinCell");
      lockedCell.append(q);
      grid.append(lockedCell); continue;
    }
    const cell = el("div", "skinCell");          /* 🧺 trk241：カード＋⭐／🚫 の小さなボタン */
    const b = el("button", "skinCard"); b.type = "button"; b.dataset.skin = id;
    b.style.setProperty("--sk-bg", s.game.stage); b.style.setProperty("--sk-text", s.ui["--ui-text"]);
    b.style.setProperty("--sk-border", s.ui["--ui-border"]);
    skinCardType(b, s);
    if (s.custom || s.pack) b.append(el("span", "skinTag", s.pack ? "PACK" : tr("customTag")));
    const dots = el("span", "dots");
    for (const c of [s.ui["--ui-accent"], s.ui["--ui-gold"], s.ui["--ui-text"]]) { const d = el("i", "dot square"); d.style.background = c; dots.append(d); }
    b.append(dots, el("b", "", marks(id) + (s.label[lang] || s.label.en)));
    const spec = skinSpecNode(s); if (spec) b.append(spec);
    b.append(el("small", "", (s.desc && (s.desc[lang] || s.desc.en)) || ""));
    if (s.holdback) b.append(el("small", "skinHoldback", tr("skinHoldbackNote")));
    b.classList.toggle("selected", id === settings.skin); b.setAttribute("aria-pressed", id === settings.skin);
    b.addEventListener("click", () => applySkin(id));
    const quick = el("div", "skinQuick");
    const qFav = el("button", "skinQuickBtn", favSet.has(id) ? "⭐" : "☆");
    qFav.type = "button"; qFav.title = tr(favSet.has(id) ? "skinFavOff" : "skinFavOn");
    qFav.setAttribute("aria-label", qFav.title); qFav.setAttribute("aria-pressed", String(favSet.has(id)));
    qFav.addEventListener("click", () => toggleSkinList("skinFav", id));
    const qHide = el("button", "skinQuickBtn", hidSet.has(id) ? "👁" : "🚫");
    qHide.type = "button"; qHide.title = tr(hidSet.has(id) ? "skinShowAction" : "skinHideAction");
    qHide.setAttribute("aria-label", qHide.title); qHide.setAttribute("aria-pressed", String(hidSet.has(id)));
    qHide.addEventListener("click", () => {
      const r = setSkinHidden(id, !hidSet.has(id));
      if (!r.ok) skinToast(tr("skinCantHideLast"));
    });
    quick.append(qFav, qHide);
    cell.append(b, quick);
    grid.append(cell);
  }
  buildSkinManage();
}
/* 🧺 棚の横に置く「整理」の一覧（名前・回数・最後に使った日時・⭐・🚫）
   🧺 trk241：スキンが増えたときのために、**一覧にも さがす・絞り込み・まとめて**を足しました。 */
/* 画面の短い通知（js/render.js の showToast を、window.Trk.play から呼ぶ） */
const skinToast = text => { try { const p = window.Trk && window.Trk.play; if (p && typeof p.showToast === "function") p.showToast(text); } catch (_) {} };
let skinManageQuery = "";              /* 整理の一覧の検索語（保存しない） */
let skinManageFilter = "all";          /* all／fav／hidden／unused（保存しない） */
let skinManageWired = false;
function wireSkinManage() {
  if (skinManageWired) return;
  const q = $("skinManageSearch"), f = $("skinManageFilter"),
    bHide = $("skinManageHideUnused"), bRestore = $("skinManageRestoreAll");
  if (!q || !f) return;
  skinManageWired = true;
  q.addEventListener("input", () => { skinManageQuery = q.value; buildSkinManage(); });
  f.addEventListener("change", () => {
    skinManageFilter = SKIN_MANAGE_FILTERS.includes(f.value) ? f.value : "all"; buildSkinManage();
  });
  if (bHide) bHide.addEventListener("click", () => {
    const plan = skinBulkPlan(window.Trk.data.SKINS, {
      mode:"unused", hidden:settings.skinHidden, fav:settings.skinFav, use:settings.skinUse, current:settings.skin,
    });
    if (!plan.ids.length) { skinToast(tr("skinBulkNone")); return; }
    settings.skinHidden = cleanSkinIdList([...settings.skinHidden, ...plan.ids]);
    saveUserPrefs(); buildSkinGrid();
    skinToast(tr("skinHiddenDone", { n:plan.ids.length }));
  });
  if (bRestore) bRestore.addEventListener("click", () => {
    const plan = skinBulkPlan(window.Trk.data.SKINS, { mode:"restore", hidden:settings.skinHidden });
    if (!plan.ids.length) { skinToast(tr("skinBulkNone")); return; }
    const back = new Set(plan.ids);
    settings.skinHidden = cleanSkinIdList(settings.skinHidden.filter(id => !back.has(id)));
    saveUserPrefs(); buildSkinGrid();
    skinToast(tr("skinRestoredDone", { n:plan.ids.length }));
  });
}
function buildSkinManage() {
  const box = $("skinManageList"); if (!box) return;
  box.textContent = "";
  wireSkinManage();
  const skins = window.Trk.data.SKINS;
  const fav = new Set(settings.skinFav), hid = new Set(settings.skinHidden);
  const nameOf = id => String(skins[id].label[lang] || skins[id].label.en);
  /* 絞り込みの選択と、まとめて操作の数を毎回そろえる */
  const filterSel = $("skinManageFilter");
  if (filterSel && SKIN_MANAGE_FILTERS.includes(skinManageFilter)) filterSel.value = skinManageFilter;
  const ids = skinManageRows(skins, {
    query: skinManageQuery, filter: skinManageFilter, locale: lang,
    fav: settings.skinFav, hidden: settings.skinHidden, use: settings.skinUse,
  });
  const searchEl = $("skinManageSearch");
  if (searchEl && searchEl.value !== skinManageQuery) searchEl.value = skinManageQuery;
  const unusedPlan = skinBulkPlan(skins, { mode:"unused", hidden:settings.skinHidden, fav:settings.skinFav, use:settings.skinUse, current:settings.skin });
  const restorePlan = skinBulkPlan(skins, { mode:"restore", hidden:settings.skinHidden });
  const hideUnusedBtn = $("skinManageHideUnused"), restoreBtn = $("skinManageRestoreAll"), manageCount = $("skinManageCount");
  if (hideUnusedBtn) {
    hideUnusedBtn.textContent = tr("skinManageHideUnused", { n:unusedPlan.ids.length });
    hideUnusedBtn.disabled = unusedPlan.ids.length === 0;
  }
  if (restoreBtn) {
    restoreBtn.textContent = tr("skinManageRestoreAll", { n:restorePlan.ids.length });
    restoreBtn.disabled = restorePlan.ids.length === 0;
  }
  if (manageCount) {
    const all = Object.keys(skins).length;
    manageCount.textContent = ids.length === all ? `（${all}）` : tr("skinManageCount", { shown:ids.length, all });
  }
  const empty = $("skinManageNothing"); if (empty) empty.hidden = ids.length > 0;
  for (const id of ids) {
    const row = el("div", "skinRow" + (hid.has(id) ? " isHidden" : ""));
    const meta = el("small", "skinRowMeta");
    const used = settings.skinUse[id] || 0, last = settings.skinLast[id] || 0;
    let when = tr("skinNever");
    try { if (last) when = new Date(last).toLocaleDateString(lang); } catch (_) {}
    meta.textContent = `${tr("skinUsedTimes", { n: used })} · ${when}`;
    const favBtn = el("button", "miniBtn", fav.has(id) ? "⭐" : "☆");
    favBtn.type = "button"; favBtn.title = tr(fav.has(id) ? "skinFavOff" : "skinFavOn");
    favBtn.setAttribute("aria-pressed", String(fav.has(id)));
    favBtn.addEventListener("click", () => toggleSkinList("skinFav", id));
    const hideBtn = el("button", "miniBtn", hid.has(id) ? "👁" : "🚫");
    hideBtn.type = "button"; hideBtn.title = tr(hid.has(id) ? "skinShowAction" : "skinHideAction");
    hideBtn.setAttribute("aria-pressed", String(hid.has(id)));
    /* 🧺 trk241：最後の 1 種は隠せない（棚が空になると「消えた」に見えるため） */
    hideBtn.addEventListener("click", () => {
      const r = setSkinHidden(id, !hid.has(id));
      if (!r.ok) skinToast(tr("skinCantHideLast"));
    });
    const name = (fav.has(id) ? "⭐ " : "") + nameOf(id) + (id === settings.skin ? "・" + tr("skinInUseMark") : "");
    row.append(el("b", "", name), meta, favBtn, hideBtn);
    box.append(row);
  }
}
/* 背景映像のフィルター：スキン／表示スタイルの色味 → 暗さ → ぼかし の順に重ねる */
function videoFilter() {
  if (settings.videoStyle === "off") return "none";
  const baseMap = { color:"none", mono:"grayscale(1) contrast(1.6)", dim:"brightness(.42) saturate(.85)" };
  const base = Object.prototype.hasOwnProperty.call(baseMap, settings.videoStyle)
    ? baseMap[settings.videoStyle] : (skin().video || "none");
  const parts = base && base !== "none" ? [base] : [];
  const dim = clampTvDim(settings.bgDim), blur = clampTvBlur(settings.bgBlur);
  /* 🪶 軽量化モード中は、いちばん重い「ぼかし」を2pxまでに抑える（設定そのものは変えません） */
  const cap = (typeof window.TrkLite === "object" && window.TrkLite && typeof window.TrkLite.blurCap === "function") ? window.TrkLite.blurCap() : 0;
  const useBlur = cap ? Math.min(blur, cap) : blur;
  if (dim > 0) parts.push(`brightness(${(1 - dim).toFixed(2)})`);
  if (useBlur > 0) parts.push(`blur(${useBlur}px)`);
  return parts.join(" ") || "none";
}
function applyNoteVars() {
  const root = document.documentElement.style;
  root.setProperty("--don", settings.notes[0].color); root.setProperty("--ka", settings.notes[1].color);
}
function applySkin(id, persist = true) {
  if (has(window.Trk.data.SKINS, id) && window.Trk.data.SKINS[id].locked && !settings.skinGradUnlocked) id = "shadow";   /* 🔒 ごほうびスキンは、スタンプ5つで解禁されるまで当てられない */
  settings.skin = has(window.Trk.data.SKINS, id) ? id : "shadow";
  const s = skin(), root = document.documentElement.style;
  /* 🧺 trk229：使った回数と日時をこの端末だけに記録する（起動時の復元 persist=false では数えない） */
  if (persist) {
    settings.skinUse[settings.skin] = Math.min(1e9, (settings.skinUse[settings.skin] || 0) + 1);
    settings.skinLast[settings.skin] = Date.now();
  }
  for (const [k, v] of Object.entries(s.ui)) root.setProperty(k, v);
  /* 🔤 小さな文字に使うアクセント色（入れ子の欄でも 4.5:1。足りているスキンは --ui-accent と同じ） */
  root.setProperty("--ui-accent-ink", window.Trk.data.accentInk(s.ui));
  root.setProperty("--stage-bg", s.game.stage); root.setProperty("--hud-text", s.game.ink);
  /* 🔤 書体パック（trk232）：パックが持ち込んだ書体を、いま使うスキンの --font の先頭に置く
     （そのパックのスキンを使っているとき／スキンを持たない書体パックのとき。外すと空になる） */
  const packFont = window.Trk.packFont && typeof window.Trk.packFont.forSkin === "function" ? window.Trk.packFont.forSkin(settings.skin) : "";
  root.setProperty("--hud-shadow", s.game.inkShadow); root.setProperty("--font", (packFont ? packFont + "," : "") + (s.font || window.Trk.data.FONT_DEFAULT));
  /* 🔤 書体スキン（trk228）：見出しの書体・太さ・字間・行間。持っていないスキンは inherit（＝これまで通り） */
  const ty = s.type || null;
  root.setProperty("--font-title", (ty && ty.title) || "inherit");
  root.setProperty("--font-title-weight", (ty && ty.titleWeight) || "revert");   /* revert＝h1/h2 はブラウザ既定の太字に戻す */
  root.setProperty("--font-title-space", (ty && ty.titleSpace) || "inherit");
  root.setProperty("--font-title-transform", (ty && ty.titleTransform) || "none");
  root.setProperty("--font-weight", (ty && ty.weight) || "inherit");
  root.setProperty("--font-lh", (ty && ty.lh) || "inherit");
  /* 🔤 trk246：書体の組み合わせ（CSS 変数2本）。スキンの --font を読み替えるので、後に置きます。
     選んでいないときは body.trk-typo-on を外すだけ（＝この行があるかないかで見た目が不変） */
  try { if (window.Trk.typography) window.Trk.typography.apply(settings.typography); } catch (_) {}
  root.setProperty("--j-perfect", s.game.perfect); root.setProperty("--j-good", s.game.good); root.setProperty("--j-miss", s.game.miss);
  applyNoteVars();
  document.documentElement.dataset.skin = settings.skin;
  document.querySelectorAll("#skinGrid .skinCard").forEach(b => {
    b.classList.toggle("selected", b.dataset.skin === settings.skin); b.setAttribute("aria-pressed", b.dataset.skin === settings.skin);
  });
  buildSkinNow();
  view.style.filter = videoFilter();
  updateTouchKeys();
  if (persist) saveUserPrefs();
  emit("skin");
}

/* ---------- 選択ボタン・キー表示 ---------- */
function syncPickers() {
  const mark = (sel, attr, val) => document.querySelectorAll(sel).forEach(b => {
    b.classList.toggle("selected", b.dataset[attr] === val); b.setAttribute("aria-pressed", b.dataset[attr] === val);
  });
  mark("#modePicker button", "playmode", settings.playMode);
  mark("#difficultyPicker button", "mode", settings.difficulty);
  mark("#layoutPicker button", "layout", settings.layout);
  mark("#judgePicker button", "judge", settings.judge);
  stage.dataset.layout = settings.layout;
  stage.dataset.mode = settings.playMode;
}
function updateKeyUI() {
  for (let i = 0; i < 2; i++) {
    $("keyValue" + i).textContent = formatKey(settings.keys[i]);
    $("keyValue" + (i + 2)).textContent = settings.subKeys[i] ? formatKey(settings.subKeys[i]) : tr("unset");
  }
  $("keyPreview").textContent = `${laneName(slotLane(0))}: [${keysLabel(0)}]   ·   ${laneName(slotLane(1))}: [${keysLabel(1)}]`;
  document.querySelectorAll("[data-bind]").forEach(b => b.classList.toggle("listening", bindingSlot === +b.dataset.bind));
}
/* タッチボタン：MANUAL・TRUCK・ORBITで表示（STAGE・CATCHは画面を直接タップ。AUTOでは出さない） */
function updateTouchKeys() {
  const tk = $("touchKeys");
  tk.classList.toggle("on", isTouch && phase === "playing" && !settings.autoPlay && ["manual", "truck", "orbit"].includes(settings.playMode));
  tk.querySelectorAll("button").forEach(b => {
    const lane = slotLane(+b.dataset.slot);
    b.style.setProperty("--c", lane ? "var(--ka)" : "var(--don)");
    b.querySelector("span").textContent = laneName(lane);
  });
}
on("options", updateTouchKeys);
/* 隠しSeedの効果を調べる（完全一致：EGG_KEYS／言葉を含む：EGG_WORDS） */
function seedEggs(raw) {
  const s = String(raw || "").trim(), low = s.toLowerCase();
  const r = { master:false, rush:false, level:null, key:window.Trk.data.EGG_KEYS[low] || window.Trk.data.EGG_KEYS[s] || null, vars:null };
  if (low === "765" || low === "143") r.master = true;
  if (low === "2000" || low === "143") r.rush = true;
  for (const rule of window.Trk.data.EGG_WORDS) {
    const w = rule.words.find(x => low.includes(x)); if (!w) continue;
    if (rule.master) r.master = true;
    if (rule.rush) r.rush = true;
    if (rule.level) r.level = rule.level;
    if (!r.key) { r.key = rule.key; r.vars = { w:w.toUpperCase() }; }
  }
  return r;
}
function refreshSeedSecrets() {
  const e = seedEggs($("seed").value);
  unlock.master = e.master || !!settings.showMasterDiff;
  unlock.rush = e.rush || !!settings.showMasterDiff;
  levelOverride = e.level;
  const masterBtn = document.querySelector('#difficultyPicker [data-mode="master"]');
  const rushBtn = document.querySelector('#difficultyPicker [data-mode="rush"]');
  if (masterBtn) masterBtn.hidden = !unlock.master;
  if (rushBtn) rushBtn.hidden = !unlock.rush;
  if ((settings.difficulty === "master" && !unlock.master) || (settings.difficulty === "rush" && !unlock.rush)) {
    settings.difficulty = "normal";
    if (typeof syncPickers === "function") syncPickers();
  }
  const toggleBtn = $("expertDiffToggle");
  if (toggleBtn) {
    toggleBtn.classList.toggle("selected", !!settings.showMasterDiff);
    toggleBtn.setAttribute("aria-pressed", String(!!settings.showMasterDiff));
  }
  const check = $("showMasterDiff");
  if (check) check.checked = !!settings.showMasterDiff;
  setStatus("eggStatus", e.key || "secretHint", e.vars);
  $("eggStatus").classList.toggle("egg", !!e.key);
}

/* ---------- 譜面まわりのボタン ---------- */
function updateChartButtons() {
  const ready = videoReady && chart.length > 0;
  $("playBtn").disabled = !ready;
  $("importChartBtn").disabled = !videoReady;
  $("exportSelectBtn").disabled = !ready;
  $("regenerateChartBtn").hidden = chartMode === "generated";
  emit("chart");
}
function chartSummary() {
  if (!chart.length) return "";
  /* 自動生成 / trk!手づくり（同梱デモ） / 読み込んだ譜面 */
  const label = chartMode === "generated" ? "chartGenerated" : chartMode === "custom" ? "chartCustom" : "chartImported";
  return `${tr(label)} · ${tr(chartDiff)} · ${chart.length} ${tr("notes")} · ${tr("level")}${currentLevel} ${tr("estimate")}`;
}

/* ---------- フェーズと画面 ---------- */
function setPhase(p) {
  phase = p; stage.dataset.phase = p;
  stage.classList.toggle("playing", p === "playing");
  $("seekBar").classList.toggle("on", (settings.playerMode || settings.autoPlay) && (p === "playing" || p === "paused"));
  updateTouchKeys();
  emit("phase", p);
}
/* ---------- 🖥 trk222：拡大率とアイコンの大きさを、画面へ反映する ----------
   ・拡大率は 50／75／100／125 の4つだけ（それ以外の保存値は 100 として扱う＝壊れた設定で崩れない）。
   ・「アイコンの大きさは100%で固定」がオンのときは、アイコンだけ拡大率のぶん割り戻す
     （--trk-icon-zoom = 1/拡大率）。絵文字のアイコンが拡大で崩れるのを避けるため。
   ・ステージの拡大は fitStage() が行う（design サイズを 1/拡大率 に縮めて、その分だけ拡大）。 */
const UI_SCALES = [50, 75, 100, 125];
function uiScaleValue() {
  const n = Number(typeof settings !== "undefined" && settings ? settings.uiScale : 100);
  return UI_SCALES.includes(n) ? n : 100;
}
/* 🧱 trk244：表示の密度（余白・行間・列数の詰め具合）。
   利用者さんの相談：「PC版では縮小化しても表示部分を減らして、全体の大きさを維持する等」
   　→ 拡大率の「75%・50%」を、**文字を小さくする**のではなく**余白と行間を詰めて、1画面に多く出す**に
   使えるようにしました（`uiScaleCompact`。既定オン）。125% は trk222 と同じ「文字を大きく」のまま。
   段は 4 つ：roomy（ゆったり）／normal（ふつう）／compact（ぎゅっと）／dense（ぎっしり）。
   考え方：Clementine や MusicBee は、窓を小さくしても文字を小さくせず、
   　行の高さやサイドバーの詰め方だけを変える設計です（一覧は見やすさを保ったまま行数だけ増える）。
   実装：JS は body へ trk-density-<段> を1つ乗せるだけ。余白・行間・棚の列数は CSS が決めます
   　（css/style.css §trk244）。font-size はどこでも変えないので、文字は読める大きさのままです。 */
const UI_DENSITIES = ["roomy", "normal", "compact", "dense"];
/* 設定の欄に出すchoices（auto は「窓の広さに合わせる」）。body のクラスは上の4つだけ */
const UI_DENSITY_CHOICES = ["auto", "roomy", "normal", "compact", "dense"];
/* 「縮小＝詰める」がオンのとき、拡大率が密度の段になる表。
   125% は「字を大きくしたい」方の設定なので、密度は据え置き（ふつう）にします */
const DENSITY_BY_SCALE = { 50:"dense", 75:"compact", 100:"normal", 125:"normal" };
/* 縮小を「詰めて多く見せる」に使うか（既定オン）。オフにすると、これまでどおり全体を小さく描きます */
function uiScaleCompactOn() { return settings.uiScaleCompact !== false; }
/* 拡大率が「縮小」側か（詰める対象にするのは 75%・50% の2つだけ） */
function uiScaleShrinks(percent) { const n = Number(percent); return n === 50 || n === 75; }
/* 拡大率から決める密度の段（純粋関数）。知らない値は 100% として扱う */
function densityFromScale(percent) {
  const n = Number(percent);
  return DENSITY_BY_SCALE[UI_SCALES.includes(n) ? n : 100];
}
/* いま密度が拡大率から自動で決まっているか（75%・50% のとき。設定画面で「下の選択は使いません」と伝えるため） */
function uiDensityAuto() { return uiScaleCompactOn() && uiScaleShrinks(uiScaleValue()); }
/* 🪟 trk245：窓の広さから密度を決める（純粋関数）。数式は「短い辺の2乗＝画面の面積」で、
   　単位は 100 万 px²（1.0 = 1000×1000 相当）。狭いほど詰める＝Clementine／MusicBee の自動のまね。 */
const DENSITY_WINDOW_STEPS = [[2.6, "roomy"], [1.0, "normal"], [0.45, "compact"]];
const DENSITY_WINDOW_NARROW = 900;    // これより**幅が**狭い（半画面・小さな窓）はもう1段詰める
function densityFromWindow(width, height) {
  const w = Number(width), h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return "normal";
  const mpx = (w * h) / 1e6;
  let level = "dense";
  for (const [min, name] of DENSITY_WINDOW_STEPS) { if (mpx >= min) { level = name; break; } }
  if (w < DENSITY_WINDOW_NARROW) {
    const i = UI_DENSITIES.indexOf(level);
    level = UI_DENSITIES[Math.min(UI_DENSITIES.length - 1, i + 1)];   // 1段だけ詰める方へ
  }
  return level;
}
/* 📐 trk245：曲リストの高さ（設計px）。カードの中身（バナー・見出し・ツール・詳細欄）がだいたい 440px
   　なので、ステージの設計高さからそれを引いたぶんをリストに返す。狭い（拡大率 125%）なら短く、
   　広い（50%）なら長く。スマホ型は CSS が実ピクセルで並べるので、ここで高さを固定しない。 */
const LIB_LIST_PAD = 440, LIB_LIST_MIN = 320, LIB_LIST_MAX = 900;
function libListHeight(designHeight) {
  const h = Number(designHeight);
  if (!Number.isFinite(h) || h <= 0) return LIB_LIST_MIN;
  return Math.max(LIB_LIST_MIN, Math.min(LIB_LIST_MAX, Math.round(h - LIB_LIST_PAD)));
}
/* いま効いている密度：①75%・50%の「縮小＝詰める」が最優先、②settings.uiDensity が auto なら窓の広さ、
   　③それ以外は選んだ段。知らない値は auto として扱う（既定と同じ窓に落ちる） */
/* 窓の大きさ（vm・ workers・古い環境でも落ちないように、無いものは 0 として扱う） */
function uiWindowSize() {
  let w = NaN, h = NaN;
  try { w = Number(innerWidth); h = Number(innerHeight); } catch (_) {}
  if (!(w > 0 && h > 0)) {
    try { w = Number(window.innerWidth); h = Number(window.innerHeight); } catch (_) {}
  }
  return { width: Number.isFinite(w) ? w : 0, height: Number.isFinite(h) ? h : 0 };
}
function uiDensityValue() {
  if (uiDensityAuto()) return densityFromScale(uiScaleValue());
  const stored = UI_DENSITY_CHOICES.includes(settings.uiDensity) ? settings.uiDensity : "auto";
  if (stored !== "auto") return stored;
  const box = uiWindowSize();
  return densityFromWindow(box.width, box.height);
}
/* 密度のクラスだけをそろえる（リサイズでも見直す。保存も作り直しもしない） */
function applyDensityClasses() {
  const density = uiDensityValue();
  if (document.body) {
    for (const level of UI_DENSITIES) document.body.classList.toggle("trk-density-" + level, density === level);
  }
  return density;
}
function applyUiScale({ persist = false } = {}) {
  const percent = uiScaleValue();
  settings.uiScale = percent;
  /* 縮小＝詰める がオンで、拡大率が 75%・50% のときだけ、ステージを小さく描きません
     （文字と全体の大きさは 100% のまま、余白と行間だけを詰めて多く出す） */
  const packed = uiDensityAuto();
  const z = packed ? 1 : percent / 100;
  const root = document.documentElement;
  root.style.setProperty("--trk-ui-zoom", String(z));
  const iconsFixed = settings.fixedIconSize !== false;
  root.style.setProperty("--trk-icon-zoom", String(iconsFixed ? 1 / z : 1));
  if (document.body) {
    document.body.classList.toggle("trk-zoom", z !== 1);
    document.body.classList.toggle("trk-icon-fixed", iconsFixed);
    document.body.classList.toggle("trk-scale-compact", packed);
  }
  const density = applyDensityClasses();   /* 直後の fitStage() が --trk-lib も見直す */
  fitStage();
  /* 棚の列数・行の高さ・余白は、密度のクラス（trk-density-*）を受けた CSS が決める（css/style.css）。
     DOM を作り直さなくてよいので、設定を開いたまま密度を変えても棚のスクロール位置は残ります。 */
  if (persist) saveUserPrefs();
  emit("uiscale", percent);
  emit("density", density);
  return percent;
}

const SCREENS = ["selectScreen", "settingsScreen", "pauseScreen", "endScreen"];
function showScreen(id) {
  SCREENS.forEach(s => { $(s).hidden = s !== id; });
  if (id === "selectScreen") screen = "select";
  else if (id === "settingsScreen") screen = "settings";
  stage.dataset.screen = id || "none";
  emit("screen", id);
}
function openSettings() { if (phase === "title") { showScreen("settingsScreen"); emit("settings"); } }   /* 🧭 スタンプ「設定を見た」の検知 */
function closeSettings() { if (phase === "title") { showScreen("selectScreen"); emit("settingsClose"); } }   /* 🧭 スタンプ「メイン画面に戻った」の検知 */

/* Emergency settings imports validate enum IDs at the boundary, before live settings are changed.
   列挙IDの検証対象（増やしたら tools/check-security.mjs も更新）。
   ⚠ 辞書が要るもの（TrkSpec/TrkMMD/TrkFX）は、その辞書が読めていないと fail-closed で落ちる。
      🪶 軽量化のように core.js で決め打ちできるものは LITE_ENUM_VALUES へ、
      🐔 タブ表示名のように UI 側の定数と対になるものは TRK_ENUM_VALUES へ寄せる（読み込み順に左右されない）。 */
const SETTING_ENUM_KEYS = ["specStyle", "specTheme", "mmdMotionKind", "fxPreset",
  "liteMode", "liteFps", "liteMascot", "liteScale", "liteLibRows", "trkTabName", "chartGen", "mediaKeepLimit", "midiSoundProfile", "midiMixProfile"];
/* Importで弾いた理由（対応が変わるので、表示では区別して出す） */
const SKIP_WHY = { enum:"prefSkipWhyId", type:"prefSkipWhyType", unknown:"prefSkipWhyUnknown", failed:"prefSkipWhyType" };
/* trk247：設定JSONから「この版が知っているキー」だけを選び出す純関数。
   ・1キーずつ型と列挙IDを見て、**合わなかったキーだけを返す**（他は捨てない）
   ・`__proto__`／`constructor`／`prototype` は読む前に落とす（原型を汚さない）
   ・`enumOk` が例外を投げたキーも「そのキーだけ」不適用にする（全体を失敗にしない）
   返す `{ changes, rejected:[{ k, why }] }`。割り当てと保存は呼び出し側（runPrefsImport）。 */
function pickImportedPrefs(data, base, enumOk, skip) {
  const changes = {}, rejected = [];
  if (!data || typeof data !== "object" || Array.isArray(data) || !base || typeof base !== "object") return { changes, rejected };
  const reject = (k, why) => { rejected.push({ k, why }); };
  for (const k of Object.keys(data)) {
    if (UNSAFE_KEYS.has(k) || (skip && skip.includes(k))) continue;
    if (!Object.prototype.hasOwnProperty.call(base, k)) { reject(k, "unknown"); continue; }
    const current = base[k], incoming = data[k];
    let sameShape = false;
    try {
      sameShape = Array.isArray(current) ? Array.isArray(incoming)
        : current === null ? (incoming === null || typeof incoming === "string")
        : current && typeof current === "object" ? !!incoming && typeof incoming === "object" && !Array.isArray(incoming)
        : typeof incoming === typeof current && (typeof incoming !== "number" || Number.isFinite(incoming));
    } catch (_) { sameShape = false; }
    if (!sameShape) { reject(k, "type"); continue; }
    if (SETTING_ENUM_KEYS.includes(k)) {
      let ok = false;
      try { ok = !!enumOk(k, incoming); } catch (_) { ok = false; }
      if (!ok) { reject(k, "enum"); continue; }
    }
    changes[k] = incoming;
  }
  return { changes, rejected };
}
function validImportedSettingEnum(key, value) {
  if (typeof value !== "string") return false;
  const staticList = LITE_ENUM_VALUES[key] || TRK_ENUM_VALUES[key];
  if (staticList) return staticList.includes(value);
  try {
    if (key === "specStyle") return !!window.TrkSpec && window.TrkSpec.styles().includes(value);
    if (key === "specTheme") return !!window.TrkSpec && window.TrkSpec.themes().includes(value);
    if (key === "mmdMotionKind") {
      const ids = window.TrkMMD && window.TrkMMD.builtins();
      return Array.isArray(ids) && (ids.includes(value) || ["auto", "none"].includes(value));
    }
    if (key === "fxPreset") {
      const presets = window.TrkFX && window.TrkFX.list();
      return Array.isArray(presets) && presets.some(p => p && p.id === value);
    }
    if (key === "midiSoundProfile" || key === "midiMixProfile") {
      const api = window.Trk && window.Trk.midiProfiles;
      const profiles = api && typeof api.list === "function" ? api.list() : null;
      return Array.isArray(profiles) && profiles.some(profile => profile && profile.id === value);
    }
  } catch (_) {}
  return false;
}

/* 容量の上限を無視するか（trk137）。外すのはアプリが決めた上限だけ。ブラウザの空き容量は外せない。 */
function storageLimitsIgnored() { return settings.ignoreStorageLimits === true; }
/* ---------- 端末の保存を固定する（trk136） ----------
   書斎・パック・記録は IndexedDB に入る。容量が逼迫すると、ブラウザが黙って消すことがある（主に Android Chrome）。
   navigator.storage.persist() は「消されにくい保存」を求める。許可するかはブラウザが決めるので、結果をそのまま表示する。
   ?safe=1 では保存領域に触らない方針のため、要求もしない（表示だけ）。 */
function storagePersistApi() {
  const storage = typeof navigator !== "undefined" ? navigator.storage : null;
  return storage && typeof storage.persisted === "function" && typeof storage.persist === "function" ? storage : null;
}
async function storagePersistState() {
  const storage = storagePersistApi();
  if (!storage) return "unsupported";
  try { return (await storage.persisted()) ? "on" : "off"; } catch (_) { return "unsupported"; }
}
async function requestStoragePersist() {
  const storage = storagePersistApi();
  if (!storage) return "unsupported";
  if (typeof window.TrkSafeMode === "function" && window.TrkSafeMode()) return storagePersistState();
  try {
    if (await storage.persisted()) return "on";
    return (await storage.persist()) ? "on" : "off";
  } catch (_) { return "unsupported"; }
}
function renderStoragePersist(state) {
  const n = document.getElementById("storagePersistState");
  const btn = document.getElementById("storagePersistBtn");
  if (n) n.textContent = tr(state === "on" ? "storagePersistOn" : state === "off" ? "storagePersistOff" : "storagePersistUnsupported");
  if (btn) { btn.hidden = state === "on"; btn.disabled = state === "unsupported"; }
  return state;
}
(function setupStoragePersistPanel(){
  const btn = document.getElementById("storagePersistBtn");
  if (!btn) return;
  btn.addEventListener("click", () => { requestStoragePersist().then(renderStoragePersist); });
  storagePersistState().then(renderStoragePersist);
})();

/* ---------- 緊急復旧パネルのボタン ---------- */
(function setupEmergencyPanel(){
  const bind = (id, fn) => {
    const n = document.getElementById(id);
    if (!n) return;
    n.addEventListener("click", fn);
  };
  const setSt = (key, vars) => {
    const n = document.getElementById("emergencyStatus");
    if (!n) return;
    n.textContent = key ? (typeof tr !== "undefined" ? tr(key, vars) : key) : "";
    // also use status system
    try { setStatus("emergencyStatus", key, vars); } catch(_) {}
  };
  bind("emergencySafeBtn", () => {
    enterSafeMode(); saveUserPrefs();
    setSt(() => "🛟 セーフモードにしました。映像OFF・ぼかし無し・TV初期化。ページを再読み込みします…（自動読み取り・プレビューなどは ?safe=1 のあいだだけ止めます）");
    setTimeout(()=> reloadInSafeMode(), 800);
  });
  bind("emergencyTvResetBtn", () => {
    resetVideoPrefs(); saveUserPrefs();
    try { if (typeof view !== "undefined") view.style.filter = videoFilter(); } catch(_){}
    setSt(() => "📺 映像・TV設定を初期化しました");
    setTimeout(()=> { try { emit("skin"); } catch(_){} }, 100);
  });
  bind("emergencyAudioResetBtn", () => {
    resetAudioPrefs(); saveUserPrefs();
    setSt(() => "🔊 音量・SE設定を初期化しました");
  });
  bind("emergencyExportNotesBtn", () => runPrefsExport("notes", setSt));
  bind("emergencyExportAllBtn", () => runPrefsExport("all", setSt));
    /* trk247：読み込みの手続き本体は runPrefsImport（⚙ → 💾 端末の保存 と同じものを使う） */
    const imp = document.getElementById("emergencyImportFile");
    if (imp) {
      imp.addEventListener("change", async () => {
        const f = imp.files && imp.files[0]; if (!f) return;
          try { await runPrefsImport(f, setSt); } finally { imp.value = ""; }
      });
    }
})();

/* ---------- 📤📥 trk247：設定の書き出し・読み込み（🛟 緊急復旧と ⚙ → 💾 端末の保存 が同じ手続きを使う） ----------
   ・上限を読む前に見る（PREFS_IMPORT_MAX＝まるごとバックアップと同じ 20 MiB）
   ・**1項目の失敗で全体を止めない**：壊れた項目だけ rejected に入れて、他は適用する
     （trk246 まで：notes の検査が投げると外側の catch で終わり、読み込み失敗だけ残った）
   ・報告 → 保存 → 再読み込み。未適用があるときだけ読む時間を取る */
const PREFS_IMPORT_HANDLED = ["notes", "videoStyle", "tvDockSkin", "bgDim", "bgBlur", "tvParamFavs", "trkRemoved", "trkListed", "trkFixedNotice", "musicVolume", "musicVolumeRestore", "typography", "language"];
async function runPrefsImport(file, setSt) {
  let applied = [], rejected = [];
  try {
    if (typeof file.size !== "number" || !Number.isFinite(file.size) || file.size < 0 || file.size > PREFS_IMPORT_MAX) {
      setSt("prefImportTooBig", { mb: Math.round(PREFS_IMPORT_MAX / 1024 / 1024) });
      return { applied, rejected };
    }
    const txt = await file.text();
    let data = null;
    try { data = JSON.parse(txt); } catch (_) { data = null; }
    if (!data || typeof data !== "object" || Array.isArray(data)) { setSt("prefImportNotObject"); return { applied, rejected }; }
    const hasImported = key => Object.prototype.hasOwnProperty.call(data, key);
    /* 理由つきで記録する（「この端末に無いID」と「型が違う」では利用者の対応が変わる）。
       ⚠ rejected に入るのは**表示用の文字列**なので、重複よけは別に生のキーで持つ。 */
    const rejectedKeys = new Set();
    const reject = (k, why) => {
      if (rejectedKeys.has(k)) return;
      rejectedKeys.add(k);
      rejected.push(tr(SKIP_WHY[why] || SKIP_WHY.unknown, { k }));
    };
    /* 手書きの項目はここで1個ずつ試す。**ここで例外が出ても、その項目だけ捨てて次に進む** */
    const attempt = (k, run) => {
      try { if (run() !== false) applied.push(k); } catch (_) { reject(k, "failed"); }
    };
    attempt("notes", () => { if (!hasImported("notes")) return false; settings.notes = window.Trk.data.sanitizeNotes(data.notes); });
    attempt("videoStyle", () => { const v = hasImported("videoStyle") ? pick(data.videoStyle, VIDEO_STYLE_IDS, "") : ""; if (!v) return false; settings.videoStyle = v; });
    attempt("bgDim", () => { if (!(hasImported("bgDim") && typeof data.bgDim === "number")) return false; settings.bgDim = clampTvDim(data.bgDim); });
    attempt("bgBlur", () => { if (!(hasImported("bgBlur") && typeof data.bgBlur === "number")) return false; settings.bgBlur = clampTvBlur(data.bgBlur); });
    attempt("tvParamFavs", () => { if (!hasImported("tvParamFavs")) return false; settings.tvParamFavs = cleanTvParamFavorites(data.tvParamFavs); });
    /* 🗑 trk の消した印・👁 曲画面の一覧は、要素（trk- で始まるID）まで検証してから代入する */
    attempt("trkRemoved", () => { if (!(hasImported("trkRemoved") && Array.isArray(data.trkRemoved))) return false; settings.trkRemoved = cleanTrkRemoved(data.trkRemoved); });
    attempt("trkListed", () => { if (!(hasImported("trkListed") && Array.isArray(data.trkListed))) return false; settings.trkListed = cleanTrkRemoved(data.trkListed); });
    /* 📢 固定の案内を出した印も、1/0 だけ通す（これまで「読み込める項目」に入れていながら
       毎度「未適用」に並んでいた。ここで扱うようにした） */
    /* 🌗 言葉も、起動時と同じ4つだけ通す（違う値は「この端末に無いID」で報告する） */
    attempt("language", () => {
      if (!hasImported("language")) return false;
      const v = pick(data.language, ["ja", "en", "zh", "ko"], "");
      if (!v) { reject("language", "enum"); return false; }
      settings.language = v;
    });
    attempt("trkFixedNotice", () => { if (!hasImported("trkFixedNotice")) return false; settings.trkFixedNotice = data.trkFixedNotice === 1 ? 1 : 0; });
    /* 🔤 trk246：書体の組み合わせも同じ流儀（知らない組名は null＝使わない） */
    attempt("typography", () => { if (!hasImported("typography")) return false; const t = window.Trk.typography ? window.Trk.typography.sanitize(data.typography) : null; if (t) settings.typography = t; if (window.Trk.typography) window.Trk.typography.apply(settings.typography); });
    attempt("tvDockSkin", () => {
      const ok = hasImported("tvDockSkin") && typeof data.tvDockSkin === "string" && window.TrkTV && typeof window.TrkTV.skins === "function" &&
        window.TrkTV.skins().some(item => item && item.id === data.tvDockSkin);
      if (!ok) return false;
      settings.tvDockSkin = data.tvDockSkin;
    });
    attempt("musicVolume", () => { if (!(hasImported("musicVolume") && typeof data.musicVolume === "number")) return false;
      settings.musicVolume = num(data.musicVolume, 0, 1, settings.musicVolume);
      if (settings.musicVolume > 0) rememberMusicVolume(settings.musicVolume);
    });
    attempt("musicVolumeRestore", () => { if (!(hasImported("musicVolumeRestore") && typeof data.musicVolumeRestore === "number")) return false; settings.musicVolumeRestore = num(data.musicVolumeRestore, .01, 1, settings.musicVolumeRestore); });
    /* 既知キー（型・列挙IDを通過したもの）をまとめて当てる。1キーの代入失敗もここで止める */
    const picked = pickImportedPrefs(data, settings, validImportedSettingEnum, PREFS_IMPORT_HANDLED);
    for (const k of Object.keys(picked.changes)) {
      try { settings[k] = picked.changes[k]; applied.push(k); } catch (_) { reject(k, "failed"); }
    }
    /* 純関数が弾いた項目は、理由つきで報告へ（黙って捨てない） */
    for (const item of picked.rejected) {
      if (PREFS_IMPORT_HANDLED.includes(item.k) || ["videoStyle", "tvDockSkin"].includes(item.k)) continue;
      reject(item.k, item.why);
    }
    /* 上の個別処理で黙って落としたキーも同じように報告する。
       理由は落とし方ごとに決まる：videoStyle／tvDockSkin は許可リスト不一致、
       それ以外（bgDim／bgBlur／musicVolume など）は型が合わなかったときだけ残る。 */
    for (const k of Object.keys(data)) {
      if (applied.includes(k) || rejectedKeys.has(k) || UNSAFE_KEYS.has(k)) continue;
      reject(k, ["videoStyle", "tvDockSkin"].includes(k) ? "enum" : "type");
    }
    const keyList = keys => keys.slice(0, 12).join(", ") + (keys.length > 12 ? ` …+${keys.length - 12}` : "");
    if (!saveUserPrefs()) {
      /* 読み込みは通ったが、この端末に書き込めなかった（容量がいっぱい）。
         再読み込みすると消えるので、**ここで止めて**言葉を返す（黙って元に戻さない） */
      setSt("prefImportUnsaved", { list: keyList(applied) });
      return { applied, rejected, saved: false };
    }
    try { applyNoteVars(); if (typeof view !== "undefined") view.style.filter = videoFilter(); } catch (_) {}
  } catch (e) {
    console.error(e);
    setSt(() => "読み込み失敗: " + (e.message || e));
    return { applied, rejected };
  }
  /* 長くなりすぎないよう先頭12件まで表示し、残りは件数だけ添える（表示は言語を選ばない記号のみ） */
  if (rejected.length) setSt("prefImportedPartial", { list:keyList(applied), skipped:keyList(rejected) });
  else setSt("prefImported", { list:keyList(applied) });
  /* 未適用の告知は読む時間が要るので、そのときだけ再読み込みを遅らせる */
  setTimeout(()=> location.reload(), rejected.length ? 2600 : 900);
  return { applied, rejected, saved: true };
}

/* 設定を書き出す（ファイル名の日付は UTC）。保存状況の欄にバイト数を残すので、
   「自分の書き出しが読み込めない」をその場で気付ける。 */
function runPrefsExport(kind, setSt) {
  const payload = prefsExportPayload(kind);
  let bytes = 0;
  try { bytes = new Blob([JSON.stringify(payload, null, 2)]).size; } catch (_) {}
  try { downloadJSON(payload, `trk-${kind || "all"}-` + new Date().toISOString().slice(0,10) + ".json"); } catch (e) { console.error(e); }
  const vars = { kb: Math.max(1, Math.round(bytes / 1024)), n: Object.keys(payload).length, mb: Math.round(PREFS_IMPORT_MAX / 1048576) };
  setSt(kind === "notes" ? "prefExportedNotes" : kind === "core" ? "prefExportedCore" : "prefExportedAll", vars);
}

(function setupPrefsTransfer(){
  const panel = document.getElementById("storagePanel");
  if (!panel) return;
  const status = (key, vars) => setStatus("storageTransferState", key, vars);
  const bind = (id, fn) => { const n = document.getElementById(id); if (n) n.addEventListener("click", fn); };
  bind("storageExportAllBtn", () => runPrefsExport("all", status));
  bind("storageExportCoreBtn", () => runPrefsExport("core", status));
  bind("storageExportNotesBtn", () => runPrefsExport("notes", status));
  const imp = document.getElementById("storageImportFile");
  if (imp) {
    imp.addEventListener("change", async () => {
      const f = imp.files && imp.files[0]; if (!f) return;
      try { await runPrefsImport(f, status); } finally { imp.value = ""; }
    });
  }
})();

/* ---------- 隠し緊急トリガー：タイトル5回クリック / Ctrl+Shift+S ---------- */
(function setupHiddenEmergency(){
  try {
    let clicks = 0, last = 0;
    const title = document.querySelector("#selectScreen .head h1, .head h1, h1");
    if (title) {
      title.style.cursor = "pointer";
      title.title = "5回クリックでセーフモード（緊急）";
      title.addEventListener("click", () => {
        const now = Date.now();
        if (now - last > 2000) clicks = 0;
        last = now; clicks++;
        if (clicks >= 5) {
          clicks = 0;
          if (confirm("🛟 セーフモードに入りますか？\n映像OFF・ぼかし0・TV初期化で操作可能にします。\n\n?safe=1 と同じ効果です。")) {
            enterSafeMode(); saveUserPrefs(); reloadInSafeMode();
          }
        }
      });
    }
    document.addEventListener("keydown", (e) => {
      // Ctrl+Shift+S または Ctrl+Shift+? でセーフモード確認
      if (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === "s" || e.key === "?" || e.key === "/")) {
        e.preventDefault();
        if (confirm("🛟 セーフモードに入りますか？ (Ctrl+Shift+S)")) {
          enterSafeMode(); saveUserPrefs(); reloadInSafeMode();
        }
      }
      // Esc を3秒長押しでセーフモード（画面が真っ暗でボタン押せない時用）
      if (e.key === "Escape") {
        if (!window._escHold) window._escHold = 0;
        window._escHold++;
        if (window._escHold > 60) { // 約1秒以上押しっぱなしを想定、keydownリピートでカウント
          window._escHold = 0;
          if (confirm("🛟 Esc長押しを検出：セーフモードに入りますか？")) {
            enterSafeMode(); saveUserPrefs(); reloadInSafeMode();
          }
        }
        setTimeout(()=>{ window._escHold = Math.max(0, (window._escHold||0)-1); }, 100);
      }
    });
  } catch(_) {}
})();
/* ✅ core.js 完了 */

/* window.Trk.core が本体の正規の置き場所。旧window名は、凍結中の js/fx.js が読む5件だけを残す（docs/ADDONS.md §0）。 */
window.$ = $;
window.BEST_KEY = BEST_KEY;
window.CAPTION_MS = CAPTION_MS;
window.CUSTOM_SKIN_MAX = CUSTOM_SKIN_MAX;
window.KEY_PRESETS = KEY_PRESETS;
window.PAD_DEFAULTS = PAD_DEFAULTS;
window.SKIN_FORMAT = SKIN_FORMAT;
window.TRK_ENUM_VALUES = TRK_ENUM_VALUES;
window.TV_PARAM_FAV_MAX = TV_PARAM_FAV_MAX;
window.VIDEO_KEY_DEFAULTS = VIDEO_KEY_DEFAULTS;
window.activeMascot = activeMascot;
window.applyLanguage = applyLanguage;
window.applyNoteVars = applyNoteVars;
window.baseName = baseName;
window.buildSkinGrid = buildSkinGrid;
window.buildSkinNow = buildSkinNow;
/* fx.js は凍結扱いのため、同ファイルが読む5名のwindow別名は移行まで残す。 */
Object.defineProperty(window, "chartMeta", { configurable:true, get:() => chartMeta, set:v => { chartMeta = v; } });
window.chartSummary = chartSummary;
window.clampTvBlur = clampTvBlur;
window.clampTvDim = clampTvDim;
window.cleanTvParamFavorites = cleanTvParamFavorites;
window.closeSettings = closeSettings;
window.ctx = ctx;
window.customSkinDefs = customSkinDefs;
window.downloadBlob = downloadBlob;
window.downloadJSON = downloadJSON;
window.el = el;
window.emit = emit;
window.esc = esc;
window.extOf = extOf;
window.fmtDate = fmtDate;
window.fmtTime = fmtTime;
window.fontFamily = fontFamily;
window.formatKey = formatKey;
window.formatPadBind = formatPadBind;
window.fx = fx;
window.gameplayFxMultiplier = gameplayFxMultiplier;
window.gameplayFxPower = gameplayFxPower;
window.hashString = hashString;
window.idbStore = idbStore;
window.isPclMascot = isPclMascot;
window.keyCodeOf = keyCodeOf;
window.keysLabel = keysLabel;
window.laneCol = laneCol;
window.laneColor = laneColor;
window.laneName = laneName;
window.modsUnranked = modsUnranked;
window.mulberry32 = mulberry32;
window.noteShape = noteShape;
window.num = num;
window.on = on;
window.openSettings = openSettings;
Object.defineProperty(window, "phase", { configurable:true, get:() => phase, set:v => { phase = v; } });
window.pick = pick;
Object.defineProperty(window, "prefs", { configurable:true, get:() => prefs, set:v => { prefs = v; } });
window.refreshSeedSecrets = refreshSeedSecrets;
window.rememberMusicVolume = rememberMusicVolume;
window.renderAllStatuses = renderAllStatuses;
window.renderStatus = renderStatus;
window.safeHttpUrl = safeHttpUrl;
window.safeLink = safeLink;
window.safeName = safeName;
window.saveCustomSkins = saveCustomSkins;
window.saveUserPrefs = saveUserPrefs;
window.savedSkinAtBoot = savedSkinAtBoot;
/* screen は window.screen（ブラウザ標準）と同名のため、窓へは出さない（利用者の決定）。読むのは window.Trk.core.screen */
window.setPhase = setPhase;
window.setStatus = setStatus;
window.settings = settings;
window.showScreen = showScreen;
window.skin = skin;
window.slotLane = slotLane;
window.slotOfKey = slotOfKey;
window.stage = stage;
Object.defineProperty(window, "stats", { configurable:true, get:() => stats, set:v => { stats = v; } });
window.syncPickers = syncPickers;
window.takeAmpReset = takeAmpReset;
window.travelMs = travelMs;
window.updateChartButtons = updateChartButtons;
window.updateKeyUI = updateKeyUI;
window.updateTouchKeys = updateTouchKeys;
window.validCode = validCode;
window.validPadBind = validPadBind;
window.vctx = vctx;
window.video = video;
Object.defineProperty(window, "videoReady", { configurable:true, get:() => videoReady, set:v => { videoReady = v; } });
window.view = view;
window.windows = windows;
/* 領域（window.Trk.core）：コア状態の正規の場所。window直下の旧互換名は frozen js/fx.js が読む5件だけ。 */
window.Trk = window.Trk || {};
window.Trk.core = Object.assign(window.Trk.core || {}, { $, applyUiScale, fitStage, uiScaleValue, UI_SCALES, UI_DENSITIES, UI_DENSITY_CHOICES, DENSITY_BY_SCALE, DENSITY_WINDOW_STEPS, densityFromScale, densityFromWindow, libListHeight, applyDensityClasses, uiDensityValue, uiDensityAuto, uiScaleCompactOn, uiScaleShrinks, renderStoragePersist, storageLimitsIgnored, requestStoragePersist, storagePersistState, BEST_KEY, CAPTION_MS, CUSTOM_SKIN_MAX, KEY_PRESETS, PAD_DEFAULTS, SKIN_FORMAT, TRK_ENUM_VALUES, TV_PARAM_FAV_MAX, VIDEO_KEY_DEFAULTS, activeMascot, applyLanguage, applyNoteVars, baseName, buildSkinGrid, buildSkinNow, chartSummary, clampTvBlur, clampTvDim, cleanTvParamFavorites, closeSettings, ctx, customSkinDefs, downloadBlob, downloadJSON, el, emit, esc, extOf, fmtDate, fmtTime, fontFamily, formatKey, formatPadBind, fx, gameplayFxMultiplier, gameplayFxPower, hashString, idbStore, isPclMascot, keyCodeOf, keysLabel, laneCol, laneColor, laneName, modsUnranked, mulberry32, noteShape, num, on, openSettings, pick, prefsForSave, refreshSeedSecrets, rememberMusicVolume, renderAllStatuses, renderStatus, safeHttpUrl, safeLink, safeModeHref, safeName, saveCustomSkins, saveUserPrefs, savedSkinAtBoot, setPhase, setStatus, settings, showScreen, skin, slotLane, slotOfKey, stage, syncPickers, takeAmpReset, travelMs, updateChartButtons, updateKeyUI, updateTouchKeys, validCode, validPadBind, vctx, video, view, windows });
/* catch.js／stage.js はこの正規アクセサを差し替える（旧window.activeMods別名はtrk90で廃止）。 */
Object.defineProperty(window.Trk.core, "activeMods", { configurable:true, get:() => activeMods, set:v => { activeMods = v; } });
Object.defineProperty(window.Trk.core, "analysis", { configurable:true, get:() => analysis, set:v => { analysis = v; } });
/* stage.js は正規アクセサを差し替える（旧window.applySkin別名はtrk90で廃止）。 */
Object.defineProperty(window.Trk.core, "applySkin", { configurable:true, get:() => applySkin, set:v => { applySkin = v; } });
Object.defineProperty(window.Trk.core, "avatarHit", { configurable:true, get:() => avatarHit, set:v => { avatarHit = v; } });
Object.defineProperty(window.Trk.core, "bgImage", { configurable:true, get:() => bgImage, set:v => { bgImage = v; } });
Object.defineProperty(window.Trk.core, "bindingSlot", { configurable:true, get:() => bindingSlot, set:v => { bindingSlot = v; } });
Object.defineProperty(window.Trk.core, "caption", { configurable:true, get:() => caption, set:v => { caption = v; } });
Object.defineProperty(window.Trk.core, "chart", { configurable:true, get:() => chart, set:v => { chart = v; } });
Object.defineProperty(window.Trk.core, "chartDiff", { configurable:true, get:() => chartDiff, set:v => { chartDiff = v; } });
Object.defineProperty(window.Trk.core, "chartMeta", { configurable:true, get:() => chartMeta, set:v => { chartMeta = v; } });
Object.defineProperty(window.Trk.core, "chartMode", { configurable:true, get:() => chartMode, set:v => { chartMode = v; } });
Object.defineProperty(window.Trk.core, "clock", { configurable:true, get:() => clock, set:v => { clock = v; } });
Object.defineProperty(window.Trk.core, "currentLevel", { configurable:true, get:() => currentLevel, set:v => { currentLevel = v; } });
Object.defineProperty(window.Trk.core, "currentSong", { configurable:true, get:() => currentSong, set:v => { currentSong = v; } });
Object.defineProperty(window.Trk.core, "effects", { configurable:true, get:() => effects, set:v => { effects = v; } });
Object.defineProperty(window.Trk.core, "errors", { configurable:true, get:() => errors, set:v => { errors = v; } });
Object.defineProperty(window.Trk.core, "fingerprint", { configurable:true, get:() => fingerprint, set:v => { fingerprint = v; } });
Object.defineProperty(window.Trk.core, "lastMissT", { configurable:true, get:() => lastMissT, set:v => { lastMissT = v; } });
Object.defineProperty(window.Trk.core, "levelOverride", { configurable:true, get:() => levelOverride, set:v => { levelOverride = v; } });
Object.defineProperty(window.Trk.core, "loadToken", { configurable:true, get:() => loadToken, set:v => { loadToken = v; } });
Object.defineProperty(window.Trk.core, "mediaName", { configurable:true, get:() => mediaName, set:v => { mediaName = v; } });
Object.defineProperty(window.Trk.core, "mediaURL", { configurable:true, get:() => mediaURL, set:v => { mediaURL = v; } });
Object.defineProperty(window.Trk.core, "nextIdx", { configurable:true, get:() => nextIdx, set:v => { nextIdx = v; } });
Object.defineProperty(window.Trk.core, "phase", { configurable:true, get:() => phase, set:v => { phase = v; } });
Object.defineProperty(window.Trk.core, "practice", { configurable:true, get:() => practice, set:v => { practice = v; } });
Object.defineProperty(window.Trk.core, "prefs", { configurable:true, get:() => prefs, set:v => { prefs = v; } });
Object.defineProperty(window.Trk.core, "pressFlash", { configurable:true, get:() => pressFlash, set:v => { pressFlash = v; } });
Object.defineProperty(window.Trk.core, "pressH", { configurable:true, get:() => pressH, set:v => { pressH = v; } });
Object.defineProperty(window.Trk.core, "safeModeOn", { configurable:true, get:() => safeModeOn, set:v => { safeModeOn = v; } });
Object.defineProperty(window.Trk.core, "screen", { configurable:true, get:() => screen, set:v => { screen = v; } });
Object.defineProperty(window.Trk.core, "seekDragging", { configurable:true, get:() => seekDragging, set:v => { seekDragging = v; } });
Object.defineProperty(window.Trk.core, "stats", { configurable:true, get:() => stats, set:v => { stats = v; } });
Object.defineProperty(window.Trk.core, "videoFilter", { configurable:true, get:() => videoFilter, set:v => { videoFilter = v; } });
Object.defineProperty(window.Trk.core, "videoReady", { configurable:true, get:() => videoReady, set:v => { videoReady = v; } });

/* 🖥 ここまでで const・関数がすべて定義済み。最初の寸法合わせを 1 回だけ実行する
   （先頭で呼ぶと TDZ で core.js が途中で止まる。上の addEventListener の直後の注記を参照）。 */
fitStage();
})();

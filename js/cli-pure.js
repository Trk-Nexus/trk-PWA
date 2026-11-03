// SPDX-License-Identifier: GPL-3.0-or-later
/* ============================================================================
   trk! cli-pure.js — ⌨ ターミナルの「純粋な計算」（trk288 で cli.js から分けた）
   ・呪文の読み取り・実行（execute）・辞書の検査・入力の挿入・合図の文字 など
   ・DOM も core も触りません（だから vm でテストできます）。
   ・読み込み順：cli.js の前。cli.js が window.Trk.cliPure から取り出して使います。
   ============================================================================ */
"use strict";
(() => {
  /* ==================== 純粋な計算（trk267） ====================
     ここから「純粋な計算（trk267）ここまで」までは DOM も core も触りません。
     入力 → 文字列 だけで動くので、tests/trk267-cli.test.mjs が vm で読みます。 */

  /* 使えるコマンド（補完と help の並び順もこの配列） */
  const CLI_COMMANDS = ["help", "list", "play", "next", "back", "re", "skin", "grimoire", "volume", "seek", "repeat", "shuffle", "spell", "cast",
    "pwd", "ls", "cd", "cat", "grep", "history", "clear", "man", "echo", "bell", "quit", "exit"];
  /* ⌨ trk269：端末の定番の呼び名。trk! の言葉に橋渡しする（ls＝一覧、cd＝スキンを移る、man＝説明） */
  const CLI_ALIASES = { ls: "list", dir: "list", cd: "skin", man: "help" };
  /* ⌨ trk286：`help` は**よく使う 5 つ**だけ。全部は `help all`（modern-web-guidance：
     最初に読む量を減らし、要る人だけ深く） */
  const CLI_HELP_SHORT = ["play", "next", "back", "list", "help"];
  const CLI_HELP = [
    ["play", "cliHelpPlay"], ["next", "cliHelpNext"], ["back", "cliHelpBack"], ["re", "cliHelpRe"],
    ["list", "cliHelpList"], ["skin", "cliHelpSkin"], ["grimoire", "cliHelpGrimoire"],
    ["volume", "cliHelpVolume"], ["seek", "cliHelpSeek"], ["repeat", "cliHelpRepeat"], ["shuffle", "cliHelpShuffle"],
    ["spell", "cliHelpSpell"], ["cast", "cliHelpCast"], ["help", "cliHelpHelp"], ["quit", "cliHelpQuit"],
    ["pwd", "cliHelpPwd"], ["ls", "cliHelpLs"], ["cd", "cliHelpCd"], ["cat", "cliHelpCat"], ["grep", "cliHelpGrep"],
    ["history", "cliHelpHistory"], ["clear", "cliHelpClear"], ["echo", "cliHelpEcho"], ["bell", "cliHelpBell"]
  ];
  /* 最初から入っている呪文（設計書 §4.1 の3つ）。中身はこの端末で唱えるコマンドの並び。
     midnight は「暗いスキン＋音量30」。夜のプレイリストは、この端末の曲リストから選ぶ形にしたら足せます。 */
  const BUILTIN_SPELLS = {
    "shuffle-fav": "shuffle on; play fav",
    "repeat-all": "repeat all",
    "midnight": "skin terminal; volume 30"
  };
  /* ⌨ trk268：CLI 向けスキンの名乗り方。設計書は "wizard"、倉庫側の呼び名が変わっても受けられるよう別名も見ます */
  const CLI_CATS = ["wizard", "cli", "console"];
  const isCliCat = cats => Array.isArray(cats) && cats.some(c => CLI_CATS.includes(String(c).toLowerCase()));

  const SPELL_MAX = 24;
  const SPELL_ID_MAX = 24;      /* ⌨ trk284：辞書の名前の長さ（入力欄の maxlength と揃える） */
  const SPELL_BODY_MAX = 200;
  const CLI_LIST_LIMIT = 40;
  const CAST_MAX = 12;

  /* ---------- ⌨ trk284：入力の取りこぼしを防ぐ純粋な道具 ---------- */
  /* 全角で打ってしまった呪文（ｐｌａｙ・ＰＬＡＹ）を、半角の小文字へ寄せる。NFKC は 1 文字→1 文字。 */
  function normalizeCommand(text) {
    const raw = String(text == null ? "" : text);
    let s = raw;
    try { s = raw.normalize("NFKC"); } catch (_) { s = raw; }
    return s.trim().toLowerCase();
  }
  /* 変換中（IME）の Enter／Tab／矢印は、端末の操作に使わない。e.keyCode 229 は IME の目印。 */
  function compositionBlocked(isComposing, keyCode) {
    return isComposing === true || Number(keyCode) === 229;
  }
  /* Tab で補完してよいか：補完が有効・Shift でない・打っている文字がある。空ならフォーカスを動かす。 */
  function tabShouldComplete(text, shiftKey, completionOn) {
    if (shiftKey === true || completionOn === false) return false;
    return String(text == null ? "" : text).trim() !== "";
  }
  /* ⌨ trk285：よく見る端末の合図（プロンプト）。<スキン名(English)> を頭に置きます。
     linux＝`<name> ~ %`（macOS・zsh 風。既定）／bash＝`<name>:~$`／root＝`<name>:~#`／
     fish＝`<name> ~>`／ps＝`PS <name>>`／plain＝`>`／skin＝スキスの --cli-prompt に任せる（空文字） */
  /* ⌨ trk287：1 文字を、カーソルの位置（選択があればその範囲）に入れる。
     端末の入力は**こちらで入れる**ので、ほかの処理が preventDefault しても文字が落ちません。
     返すのは「新しい値」と「新しいカーソル位置」。 */
  function insertTextAt(value, ch, start, end) {
    const text = String(value == null ? "" : value);
    const ch2 = String(ch == null ? "" : ch);
    let a = Number.isInteger(start) ? start : text.length;
    let b = Number.isInteger(end) ? end : a;
    a = Math.max(0, Math.min(text.length, a));
    b = Math.max(a, Math.min(text.length, b));
    const next = text.slice(0, a) + ch2 + text.slice(b);
    return { value: next, caret: a + ch2.length };
  }
  /* ⌨ trk288（C3）：ブラウザー・OS が先に取る組み合わせ。Ctrl／⌘（Alt・Win も）と一緒に押すと、
     タブ・ウインドウ・再読み込み・検索・拡大縮小・保存・印刷などが動いてしまうキー。
     ・文字：W T N Q（閉じる・タブ・ウインドウ）／R（再読み込み）・L（アドレス）・F（検索）・P（印刷）・S（保存）
       ・H（履歴）・J（ダウンロード）・D（ブックマーク）・E（検索）・G（次を検索）・O（開く）・U（ソース）
     ・数字 0〜9（タブの切り替え・拡大の戻し）・テンキーの数字・+ − =（拡大縮小）
     ・Tab・Escape・F1〜F12（F5 再読み込み・F11 全画面・F12 開発者ツール など）
     Shift を足しても同じ（Ctrl+Shift+T などもブラウザーの動き）。遊ぶキーとの重なりは、この関数では問いません。 */
  const CLI_RESERVED_CODES = ["KeyD", "KeyE", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyL", "KeyN", "KeyO", "KeyP", "KeyQ",
    "KeyR", "KeyS", "KeyT", "KeyU", "KeyW", "Minus", "Equal", "NumpadAdd", "NumpadSubtract", "Tab", "Escape"];
  function cliKeyReserved(code) {
    const c = String(code == null ? "" : code);
    if (CLI_RESERVED_CODES.includes(c)) return true;
    if (/^(Digit|Numpad)\d$/.test(c)) return true;
    if (/^F\d{1,2}$/.test(c)) return true;
    return false;
  }

  const PROMPT_STYLES = ["linux", "bash", "root", "fish", "ps", "plain", "skin"];
  function promptText(style, name) {
    const id = PROMPT_STYLES.includes(style) ? style : "linux";
    if (id === "skin") return "";
    const who = String(name == null ? "" : name).trim() || "trk";
    if (id === "bash") return who + ":~$ ";
    if (id === "root") return who + ":~# ";
    if (id === "fish") return who + " ~> ";
    if (id === "ps") return "PS " + who + "> ";
    if (id === "plain") return "> ";
    return who + " ~ % ";
  }

  /* ⌨ trk288（Q8）：辞書の名前は**どの言語の文字でも**よい（英字だけでなく、日本語・中国語・ハングルも）。
     NFKC で全角を半角へ寄せ、小文字にそろえてから、「文字か数字で始まり、文字・数字・- が続く」形にします。
     先頭は記号にしない（- で始まる名前を唱えにくいため）。長さは 24 字まで（コードポイント）。 */
  const SPELL_ID_RE = /^[\p{L}\p{N}][\p{L}\p{N}-]{0,23}$/u;
  function spellIdKey(id) {
    let s = String(id == null ? "" : id);
    try { s = s.normalize("NFKC"); } catch (_) { /* 古い環境では、そのまま */ }
    return s.trim().toLowerCase();
  }
  /* 辞書（呪文）の下書きを検査する。返す値：""＝よい／id／body／builtin／full */
  function spellDraftProblem(id, body, opts) {
    const o = opts || {};
    const key = spellIdKey(id);
    if (!SPELL_ID_RE.test(key)) return "id";
    if (!String(body == null ? "" : body).trim()) return "body";
    if (o.builtin === true) return "builtin";
    if (Number(o.count) >= Number(o.max == null ? SPELL_MAX : o.max)) return "full";
    return "";
  }

  function parseLine(line) {
    const raw = String(line == null ? "" : line).replace(/\s+/g, " ").trim();
    if (!raw) return { cmd: "", args: [], rest: "", raw: "" };
    const sp = raw.indexOf(" ");
    const cmd = normalizeCommand(sp < 0 ? raw : raw.slice(0, sp));   /* trk284：全角の呪文も通す */
    const rest = sp < 0 ? "" : raw.slice(sp + 1).trim();
    return { cmd, args: rest ? rest.split(" ") : [], rest, raw };
  }

  /* mm:ss / h:mm:ss / 秒（数だけ）。読めなければ null。 */
  function parseClock(text) {
    let raw = String(text == null ? "" : text);
    try { raw = raw.normalize("NFKC"); } catch (_) {}
    const s = raw.trim();
    if (!s) return null;
    if (/^\d{1,6}$/.test(s)) return Number(s);
    const m = s.match(/^(\d{1,3}):([0-5]?\d)(?::([0-5]?\d))?$/);
    if (!m) return null;
    const a = Number(m[1]), b = Number(m[2]);
    return m[3] === undefined ? a * 60 + b : a * 3600 + b * 60 + Number(m[3]);
  }
  function formatClock(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
    const mm = String(m).padStart(2, "0"), ss = String(s).padStart(2, "0");
    return h ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
  }
  /* 0〜100 に寄せる。数でなければ null */
  function clampPercent(value) {
    let v = value;
    try { v = String(value == null ? "" : value).normalize("NFKC"); } catch (_) {}
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.min(100, Math.round(n)));
  }
  /* 入力にパスらしいものが混ざっていないか（設計書 §7-3 の対策：そもそもパスを入力にしない） */
  function looksLikePath(word) {
    const s = String(word == null ? "" : word);
    return /[\\/]/.test(s) || s.includes("..") || s.startsWith("~") || /^[a-zA-Z]:/.test(s);
  }
  /* list の並びから1曲を選ぶ。kind = one / many / none / path */
  function pickTrack(list, word) {
    const items = Array.isArray(list) ? list : [];
    const raw = String(word == null ? "" : word).trim();
    if (!raw) return { kind: "none" };
    if (looksLikePath(raw)) return { kind: "path" };
    if (/^\d+$/.test(raw)) {
      const n = Number(raw);
      return n >= 1 && n <= items.length ? { kind: "one", index: n - 1, item: items[n - 1] } : { kind: "none" };
    }
    const q = raw.toLowerCase();
    const hits = [];
    items.forEach((it, i) => {
      const name = String(it && (it.title || it.name || "")).toLowerCase();
      if (name.includes(q)) hits.push(i);
    });
    if (hits.length === 1) return { kind: "one", index: hits[0], item: items[hits[0]] };
    if (hits.length > 1) return { kind: "many", count: hits.length, indexes: hits.slice(0, 5) };
    return { kind: "none" };
  }
  function splitSpells(text) {
    /* ⌨ trk269：`;` に加えて、パイプ `|` でも区切れる（定番の書き方に寄せる） */
    return String(text == null ? "" : text).split(/[;|\n]/).map(s => s.trim()).filter(Boolean).slice(0, CAST_MAX);
  }
  /* ターミナルを開くときに当てるスキン。
     mode = auto（wizard を含むスキン → 無ければ terminal）／terminal／keep（何も当てない） */
  function pickCliSkin(skins, mode, pick) {
    /* ⌨ trk283：`locked`（ごほうび）は当てない・`pick` があればそれを優先（モードは keep が最優先） */
    const list = Array.isArray(skins) ? skins.filter(s => s && typeof s.id === "string" && !s.locked) : [];
    const has = id => list.some(s => s.id === id);
    if (mode === "keep") return "";
    if (pick && has(pick)) return pick;
    if (mode === "terminal") return has("terminal") ? "terminal" : "";
    /* trk270：端末向けの見た目（cli）を名乗るスキンを先に。無ければ名乗り（cat）だけのもの */
    const wiz = list.find(s => isCliCat(s.cats) && s.look === true) || list.find(s => isCliCat(s.cats));
    if (wiz) return wiz.id;
    return has("terminal") ? "terminal" : "";
  }

  /* 1行を唱える。deps は「端末の外側」（曲リスト・プレイヤー・保存）への窓口。
     deps = { t, tracks, play, playSpecial, current, skins, applySkin, volume, seek,
              repeat, shuffle, spells, saveSpell, delSpell, listLimit } */
  async function execute(line, deps, ctx = {}) {
    const out = [];
    const push = (kind, text) => { if (text !== undefined && text !== null && text !== "") out.push({ kind, text: String(text) }); };
    const t = (key, vars) => (typeof deps.t === "function" ? deps.t(key, vars) : key);
    const q0 = parseLine(line);
    if (!q0.cmd) return { out, quit: false, clear: false, action: false };
    /* パイプ `|` は「続けて唱える」と同じ（cast の入れ子では見ない） */
    if (!ctx.depth && q0.raw.includes("|")) {
      const parts = splitSpells(q0.raw);
      if (parts.length > 1) {
        let quit = false, action = false;
        for (const part of parts) {
          const r = await execute(part, deps, { depth: 1 });
          for (const o of r.out) out.push(o);
          if (r.action) action = true;
          if (r.quit) { quit = true; break; }
        }
        return { out, quit, clear: false, action };
      }
    }
    /* 定番の呼び名を trk! の言葉に読み替える（ls に言葉を添えたら絞り込み＝grep） */
    let q = q0;
    const alias = CLI_ALIASES[q0.cmd];
    if (alias) {
      if (alias === "list" && q0.rest) q = { ...q0, cmd: "grep" };
      else q = { ...q0, cmd: alias };
    }
    let quit = false;
    let clear = false;
    let action = false;   /* ⌨ trk283：何かをした（＝実行後に閉じてよい）コマンドか */

    if (q.cmd === "help") {
      /* man <cmd> は 1 つだけ・`help all` で全部（trk286）。ふつうは短い 5 つ＋案内 */
      const only = q.rest ? q.rest.split(" ")[0].toLowerCase() : "";
      const picked = only && only !== "all" ? CLI_HELP.filter(([word, key]) => word === only || key === only) : [];
      if (only && only !== "all" && !picked.length) {
        push("err", t("cliUnknown", { cmd: only }));
      } else if (only === "all") {
        push("out", t("cliHelpTitle"));
        for (const [, key] of CLI_HELP) push("out", "  " + t(key));
      } else if (picked.length) {
        push("out", t("cliHelpTitle"));
        for (const [, key] of picked) push("out", "  " + t(key));
      } else {
        push("out", t("cliHelpTitle"));
        for (const word of CLI_HELP_SHORT) {
          const row = CLI_HELP.find(([w]) => w === word);
          if (row) push("out", "  " + t(row[1]));
        }
        push("out", "  " + t("cliHelpAll", { n: CLI_HELP.length }));
      }
    } else if (q.cmd === "list") {
      const items = typeof deps.tracks === "function" ? deps.tracks() : [];
      if (!items.length) push("err", t("cliNoTracks"));
      else {
        const limit = Math.max(1, Math.min(200, Number(deps.listLimit) || CLI_LIST_LIMIT));
        const shown = items.slice(0, limit);
        push("out", t("cliListTitle", { n: items.length, from: 1, to: shown.length }));
        shown.forEach((it, i) => {
          const name = typeof deps.name === "function" ? deps.name(it) : (it.title || it.name || "");
          const src = typeof deps.src === "function" ? deps.src(it) : "";
          push("out", t("cliListItem", { i: i + 1, name, src }));
        });
      }
    } else if (q.cmd === "play") {
      const word = q.rest;
      const special = ["next", "prev", "random", "fav"].includes(word.toLowerCase()) ? word.toLowerCase() : "";
      if (!word) push("err", t("cliNeedIndex"));
      else if (special) {
        const r = (typeof deps.playSpecial === "function" ? await deps.playSpecial(special) : { ok: false }) || {};
        if (r.ok) { push("out", t("cliPlaying", { name: r.name || "" })); action = true; }
        else if (r.reason === "empty") push("err", special === "fav" ? t("cliFavEmpty") : t("cliNoTracks"));
        else push("err", t("cliPlayFailed"));
      } else {
        const items = typeof deps.tracks === "function" ? deps.tracks() : [];
        const hit = pickTrack(items, word);
        if (hit.kind === "path") push("err", t("cliPathRefused"));
        else if (hit.kind === "many") push("err", t("cliManyMatch", { q: word, n: hit.count }));
        else if (hit.kind === "none") push("err", t("cliNoMatch", { q: word }));
        else {
          const name = typeof deps.name === "function" ? deps.name(hit.item) : (hit.item.title || "");
          const r = (typeof deps.play === "function" ? await deps.play(hit.item) : { ok: false }) || {};
          if (r.ok) { push("out", t("cliPlaying", { name })); action = true; }
          else push("err", t("cliPlayFailed"));
        }
      }
    } else if (q.cmd === "next" || q.cmd === "back") {
      /* ⌨ trk283：play next／play prev の短い呼び名（最初から使えます） */
      const kind = q.cmd === "back" ? "prev" : "next";
      const r = (typeof deps.playSpecial === "function" ? await deps.playSpecial(kind) : { ok: false }) || {};
      if (r.ok) { push("out", t("cliPlaying", { name: r.name || "" })); action = true; }
      else if (r.reason === "empty") push("err", t("cliNoTracks"));
      else push("err", t("cliPlayFailed"));
    } else if (q.cmd === "re") {
      /* ⌨ trk283：いまの曲を最初から（再生位置を 0 に） */
      const r = (typeof deps.restart === "function" ? deps.restart() : { ok: false, reason: "none" }) || {};
      if (r.ok) { push("out", t("cliRestartDone", { name: r.name || "" })); action = true; }
      else if (r.reason === "beyond") push("err", t("cliSeekBeyond", { t: formatClock(r.max) }));
      else push("err", t("cliRestartNone"));
    } else if (q.cmd === "skin") {
      const id = (q.args[0] || "").toLowerCase();
      if (!id) {
        const cur = (typeof deps.current === "function" ? deps.current() : {}) || {};
        push("out", t("cliSkinCurrent", { id: cur.skin || "shadow" }));
      } else {
        const r = (typeof deps.applySkin === "function" ? deps.applySkin(id) : { ok: false }) || {};
        if (r.ok) { push("out", t("cliSkinSet", { id })); action = true; }
        else if (r.reason === "locked") push("err", t("cliSkinLocked"));
        else push("err", t("cliSkinUnknown"));
      }
    } else if (q.cmd === "grimoire") {
      const filter = (q.args[0] || "").toLowerCase();
      const all = typeof deps.skins === "function" ? deps.skins() : [];
      const list = !filter || filter === "all" ? all
        : (CLI_CATS.includes(filter) ? all.filter(s => isCliCat(s.cats)) : all.filter(s => Array.isArray(s.cats) && s.cats.includes(filter)));
      if (!list.length) push("err", t("cliGrimoireNone"));
      else {
        push("out", filter && filter !== "all" ? t("cliGrimoireFilter", { cat: filter, n: list.length }) : t("cliGrimoireTitle", { n: list.length }));
        for (const s of list) {
          const mark = s.cli ? "⌨ " : "";
          push("out", mark + t("cliGrimoireItem", { id: s.id, label: s.label || s.id, cat: (s.cats || []).join("/") || "basic" }));
        }
        push("out", t("cliGrimoireCli"));
      }
    } else if (q.cmd === "volume") {
      const pct = clampPercent(q.args[0]);
      if (pct === null) push("err", t("cliVolumeNeed"));
      else {
        const r = (typeof deps.volume === "function" ? deps.volume(pct) : { ok: false }) || {};
        if (r.ok) { push("out", t("cliVolumeSet", { n: pct })); action = true; }
        else push("err", t("cliInternalError"));
      }
    } else if (q.cmd === "seek") {
      const sec = parseClock(q.args[0]);
      if (sec === null) push("err", t("cliSeekNeed"));
      else {
        const r = (typeof deps.seek === "function" ? deps.seek(sec) : { ok: false, reason: "none" }) || {};
        if (r.ok) { push("out", t("cliSeekSet", { t: formatClock(sec) })); action = true; }
        else if (r.reason === "beyond") push("err", t("cliSeekBeyond", { t: formatClock(r.max) }));
        else push("err", t("cliSeekNoTrack"));
      }
    } else if (q.cmd === "repeat") {
      const mode = (q.args[0] || "").toLowerCase();
      if (!["off", "one", "all"].includes(mode)) push("err", t("cliRepeatNeed"));
      else {
        const r = (typeof deps.repeat === "function" ? deps.repeat(mode) : { ok: false }) || {};
        if (r.ok) { push("out", t("cliRepeatSet", { mode })); action = true; }
        else push("err", t("cliInternalError"));
      }
    } else if (q.cmd === "shuffle") {
      const word = (q.args[0] || "").toLowerCase();
      const on = word === "on" || word === "1" || word === "true";
      const off = word === "off" || word === "0" || word === "false";
      if (!on && !off) push("err", t("cliNeedOnOff"));
      else {
        const r = (typeof deps.shuffle === "function" ? deps.shuffle(on) : { ok: false }) || {};
        if (r.ok) { push("out", t("cliShuffleSet", { mode: on ? t("cliOn") : t("cliOff") })); action = true; }
        else push("err", t("cliInternalError"));
      }
    } else if (q.cmd === "spell") {
      const sub = spellIdKey(q.args[0] || "");   /* ⌨ trk288（Q8）：全角・大文字も同じ名前として見る */
      const spells = typeof deps.spells === "function" ? deps.spells() : {};
      if (!sub) {
        const ids = Object.keys(spells);
        push("out", t("cliSpellTitle", { n: ids.length }));
        for (const id of ids) push("out", "  " + t("cliSpellItem", { id, cmds: spells[id] }));
        push("out", t("cliSpellUsage"));
      } else if (sub === "add") {
        const m = q.rest.match(/^add\s+(\S+)\s+([\s\S]+)$/i);
        const addId = m ? spellIdKey(m[1]) : "";
        if (!m) push("err", t("cliSpellUsage"));
        else if (!SPELL_ID_RE.test(addId)) push("err", t("cliSpellBadId"));
        else if (!m[2].trim()) push("err", t("cliSpellBadBody"));
        else {
          const r = (typeof deps.saveSpell === "function" ? deps.saveSpell(addId, m[2].trim()) : { ok: false }) || {};
          if (r.ok) push("out", t("cliSpellAdded", { id: addId }));
          else if (r.reason === "builtin") push("err", t("cliSpellBuiltin"));
          else if (r.reason === "full") push("err", t("cliSpellBadId"));
          else push("err", t("cliInternalError"));
        }
      } else if (sub === "del") {
        const id = spellIdKey(q.args[1] || "");
        if (!id) push("err", t("cliSpellUsage"));
        else {
          const r = (typeof deps.delSpell === "function" ? deps.delSpell(id) : { ok: false }) || {};
          if (r.ok) push("out", t("cliSpellRemoved", { id }));
          else if (r.reason === "builtin") push("err", t("cliSpellBuiltin"));
          else push("err", t("cliSpellUnknown"));
        }
      } else {
        const id = sub;
        const body = spells[id];
        if (!body) push("err", t("cliSpellUnknown"));
        else {
          const parts = splitSpells(body);
          for (const part of parts) {
            const r = await execute(part, deps, { depth: (ctx.depth || 0) + 1, fromSpell: true });
            for (const o of r.out) out.push(o);
            if (r.action) action = true;
          }
        }
      }
    } else if (q.cmd === "cast") {
      if (ctx.depth) push("err", t("cliNoNestedCast"));
      else {
        /* ⌨ trk288（R1）：cast の 1 語が辞書の名前なら、その呪文に広げる（spell と cast の食い違いをなくす） */
        const known = typeof deps.spells === "function" ? deps.spells() : {};
        const parts = [];
        for (const piece of splitSpells(q.rest)) {
          const head = normalizeCommand(piece.split(" ")[0]);
          if (!CLI_COMMANDS.includes(head) && Object.prototype.hasOwnProperty.call(known, spellIdKey(head))) {
            for (const inner of splitSpells(known[spellIdKey(head)])) parts.push(inner);
          } else parts.push(piece);
        }
        parts.splice(CAST_MAX);
        if (!parts.length) push("err", t("cliCastEmpty"));
        for (const part of parts) {
          const r = await execute(part, deps, { depth: 1 });
          for (const o of r.out) out.push(o);
          if (r.action) action = true;
          if (r.quit) { quit = true; break; }
        }
      }
    } else if (q.cmd === "pwd") {
      /* 定番の pwd。trk! には道がないので「いまの様子」を 1 行で返す */
      const cur = typeof deps.current === "function" ? deps.current() : {};
      push("out", t("cliPwd", { skin: cur.skin || "-", track: cur.track || t("cliPwdNone"), n: cur.volume == null ? 0 : cur.volume }));
    } else if (q.cmd === "grep") {
      const word = q.rest;
      const items = typeof deps.tracks === "function" ? deps.tracks() : [];
      if (!word) push("err", t("cliGrepNeed"));
      else if (!items.length) push("err", t("cliNoTracks"));
      else {
        const needle = word.toLowerCase();
        const hits = [];
        items.forEach((it, i) => {
          const name = String(typeof deps.name === "function" ? deps.name(it) : (it.title || "")).toLowerCase();
          const src = String(typeof deps.src === "function" ? deps.src(it) : "").toLowerCase();
          if (name.includes(needle) || src.includes(needle)) hits.push({ it, i });
        });
        if (!hits.length) push("err", t("cliGrepNone", { q: word }));
        else {
          const limit = Math.max(1, Math.min(200, Number(deps.listLimit) || CLI_LIST_LIMIT));
          push("out", t("cliGrepTitle", { q: word, n: hits.length }));
          for (const { it, i } of hits.slice(0, limit)) {
            const name = typeof deps.name === "function" ? deps.name(it) : (it.title || "");
            const src = typeof deps.src === "function" ? deps.src(it) : "";
            push("out", t("cliListItem", { i: i + 1, name, src }));
          }
        }
      }
    } else if (q.cmd === "cat") {
      /* cat：中身をのぞく。`cat spell <id>` は呪文の本文、それ以外は曲の詳細 */
      const words = q.args;
      if (words[0] && words[0].toLowerCase() === "spell") {
        const id = (words[1] || "").toLowerCase();
        const spells = typeof deps.spells === "function" ? deps.spells() : {};
        if (!id) push("err", t("cliSpellUsage"));
        else if (!Object.prototype.hasOwnProperty.call(spells, id)) push("err", t("cliSpellUnknown", { id }));
        else {
          push("out", t("cliSpellItem", { id, cmds: spells[id] }));
          push("out", t("cliCastHint"));
        }
      } else if (!q.rest) push("err", t("cliCatNeed"));
      else {
        const items = typeof deps.tracks === "function" ? deps.tracks() : [];
        const hit = pickTrack(items, q.rest);
        if (hit.kind === "path") push("err", t("cliPathRefused"));
        else if (hit.kind === "many") push("err", t("cliManyMatch", { q: q.rest, n: hit.count }));
        else if (hit.kind === "none") push("err", t("cliNoMatch", { q: q.rest }));
        else {
          const name = typeof deps.name === "function" ? deps.name(hit.item) : (hit.item.title || "");
          const src = typeof deps.src === "function" ? deps.src(hit.item) : "";
          const index = items.indexOf(hit.item) + 1;
          push("out", t("cliCatTitle", { i: index, name }));
          if (src) push("out", "  " + t("cliCatSrc", { src }));
          push("out", "  " + t("cliCatPlayHint", { i: index }));
        }
      }
    } else if (q.cmd === "history") {
      const hist = typeof deps.history === "function" ? deps.history() : [];
      if (!hist.length) push("out", t("cliHistoryEmpty"));
      else {
        push("out", t("cliHistoryTitle", { n: hist.length }));
        hist.forEach((h, i) => push("out", "  " + (i + 1) + ". " + h));
      }
    } else if (q.cmd === "clear") {
      clear = true;
      push("out", t("cliCleared"));
    } else if (q.cmd === "echo") {
      push("out", q.rest);
    } else if (q.cmd === "bell") {
      const word = (q.args[0] || "").toLowerCase();
      if (word !== "on" && word !== "off") push("err", t("cliBellUsage"));
      else {
        const ok = typeof deps.setBell === "function" ? deps.setBell(word === "on") !== false : false;
        push(ok ? "out" : "err", t(ok ? (word === "on" ? "cliBellOn" : "cliBellOff") : "cliInternalError"));
      }
    } else if (q.cmd === "quit" || q.cmd === "exit") {
      quit = true;
      push("out", t("cliQuit"));
    } else {
      push("err", t("cliUnknown", { cmd: q.cmd }));
    }
    return { out, quit, clear, action };
  }

  /* ==================== 純粋な計算（trk267）ここまで ==================== */

  window.Trk = window.Trk || {};
  window.Trk.cliPure = { SPELL_ID_RE, spellIdKey, CLI_RESERVED_CODES, cliKeyReserved, CLI_COMMANDS, CLI_ALIASES, CLI_HELP_SHORT, CLI_HELP, BUILTIN_SPELLS, CLI_CATS, isCliCat, SPELL_MAX, SPELL_ID_MAX, SPELL_BODY_MAX, CLI_LIST_LIMIT, CAST_MAX, normalizeCommand, compositionBlocked, tabShouldComplete, insertTextAt, PROMPT_STYLES, promptText, spellDraftProblem, parseLine, parseClock, formatClock, clampPercent, looksLikePath, pickTrack, splitSpells, pickCliSkin, execute };
})();

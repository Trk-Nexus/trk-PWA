// SPDX-License-Identifier: GPL-3.0-or-later
/* ============================================================================
   trk! cli.js — ⌨ ターミナル（trk267）
   trk-Avatar-Library の「trk CLI 設計書 v0.1」（2026-11-03）のフェーズ C を、
   trk! 本体側に入れたものです。呪文（コマンド）を打って、曲・スキン・音量・
   再生位置を直に操ります。

   ・置き場所：選曲画面の上に重ねる（全画面の重ね表示の名前は "cli"）
   ・入口：⚙ の「⌨ ターミナル」と、PC では Ctrl+.（Mac は ⌘+.）（trk288 から。それ以前は Ctrl+`）
   ・見た目：開いている間だけスキンを当てる（既定は wizard を含むスキン → 無ければ
     terminal。閉じたら元のスキンへ戻す）。色・書体は CSS 変数から取るので、
    スキン側が CLI 用のスキン（cat に wizard）を足せば、そのまま着られます。
   ・保存：localStorage のキーは増やしません（core.settings の中だけ）
   ・入力にファイルパスは受け付けません（list の番号か曲名だけ）
   ============================================================================ */
"use strict";
(() => {
  const core = window.Trk.core;

  /* ==================== 文言（4言語） ==================== */
  Object.assign(TEXT.ja, {
    cliTitle: "⌨ ターミナル",
    cliSubtitle: "呪文（コマンド）を打って、曲・スキン・音量・再生位置を直に操ります。Esc か quit で閉じます。",
    cliClose: "✕ 閉じる",
    cliPromptLabel: "呪文",
    cliRun: "唱える",
    cliHint: "↑↓ は履歴、Tab は補完、Esc は閉じる。help で一覧が出ます。",
    cliLogLabel: "端末の出力",
    cliPanelTitle: "⌨ ターミナル（trk CLI）",
    cliPanelHint: "呪文を打って、曲とスキンを直に操る画面です。下のボタンから開けます（PC では Ctrl+. / Mac は ⌘+. でも開きます）。",
    cliOpenBtn: "⌨ ターミナルを開く",
    cliPlayLabel: "play の行き先",
    cliPlayMedia: "メディアプレイヤーで鳴らす",
    cliPlayPreview: "曲リストの試聴で鳴らす",
    cliSkinLabel: "ターミナルの見た目",
    cliSkinAuto: "自動（wizard・cli・console のスキンがあればそれ、無ければ terminal）",
    cliSkinTerminal: "terminal を当てる",
    cliSkinKeep: "いまのスキンのまま",
    cliSkinHint: "既定はいまのスキンのまま（後ろと同じ見た目で下から出ます）。ここで別のスキンを選ぶと、ターミナルの中だけその見た目になります（閉じれば元どおり）。",
    /* ⌨ trk283：呼び出しキー・実行後に閉じる・スキンの個別指定・入力できるかの知らせ */
    cliKeyLabel: "🪄 Terminal Key Setting（Ctrl／⌘ ＋ このキー）",
    cliKeyHint: "呪文を呼ぶ鍵です。同じキーで開いて閉じます（Esc でも閉じられます）。割り当て中は Esc で取り消します。",
    cliKeyWaiting: "キーを押してください（Esc で取り消し・Backspace でオフ）。修飾キーだけでは決まりません。",
    cliKeyOff: "オフ（呼び出しキーなし）",
    cliKeyOffSaved: "呼び出しキーをオフにしました。⌨ ボタンからは開けます。",
    cliKeyBadKey: "そのキーだけでは決められません。文字・数字・矢印・ファンクションキーなどにしてください。",
    cliKeyReserved: "そのキーは、ブラウザーや OS が先に使うため登録できません（例：W・T・N・R・L・F・P・S・Tab・数字・F キー）。",
    cliModReserved: "その組み合わせは、ブラウザーや OS が先に使うため選べません。呼び出しキーを変えるか、別の修飾キーを選んでください。",
    cliBellSkinOff: "このスキンは音を出しません（スキンが「鳴らす」と言っているときだけ鳴ります）。",
    cliInsertLabel: "入力欄の文字の入れ方",
    cliInsertNative: "ブラウザーに任せる（既定）",
    cliInsertExec: "元に戻す（Ctrl+Z）に残す",
    cliInsertHint: "既定は、ふつうの入力欄と同じ動き（変換・自動修正・取り消し）。「元に戻す」を選ぶと、端末に打った文字も Ctrl+Z で戻せるようになります。",
    cliKeySaved: "呼び出しキーを {mod} + {key} にしました。",
    cliModLabel: "修飾キー（一緒に押すキー）",
    cliModCtrlOrMeta: "Ctrl または ⌘／Win（どちらでも）",
    cliModMeta: "Win／⌘（Super）だけ",
    cliModCtrl: "Ctrl だけ",
    cliModAlt: "Alt だけ",
    cliModHint: "「Win／⌘」を選ぶと Win + キー（Super + キー）で呼べます。ただし Windows は Win+D や Win+L など多くを OS が先に取るので、Win+Enter や Win+` のような空いている組み合わせにしてください。",
    cliHelpAll: "help all … 全部の呪文（{n} 本）を出す",
    cliSheetSizeLabel: "ターミナルの高さ",
    cliSheetHalf: "小さめ（画面の半分）",
    cliSheetTall: "ふつう（7 割）",
    cliSheetFull: "大きめ（ほぼ全画面）",
    cliSheetHint: "下から持ち上がる板（ボトムシート）です。中だけにスキンを当てるので、後ろの曲リストの色は変わりません。",
    cliSheetSkin: "このターミナルの見た目：{id}（後ろの画面はそのまま）",
    cliKeyTaken: "そのキーは、ほかの操作（遊ぶキー・メニュー・プレイヤー）で使っています。",
    cliAutoClose: "唱えたら閉じる（既定はオフ：開いたまま何度でも）",
    cliAutoCloseHint: "オフのままなら、当てたあとも板は開いたまま。続けて唱えられます（Esc・同じキーで閉じます）。",
    cliSkinPickChk: "端末のスキンを自分で選ぶ",
    cliSkinPickLabel: "端末のスキン",
    cliSkinPickAuto: "（上の「ターミナルの見た目」に任せる）",
    cliSkinApplied: "スキン：{id} を当てました（閉じると戻ります）。",
    cliSkinAppliedFail: "スキンを当てられませんでした。",
    cliTypingLabel: "入力できるかの知らせ",
    cliTypingBadge: "入力欄の上にバッジ（入力可／タップで入力）",
    cliTypingStatus: "開いたときに状態行へ 1 行",
    cliTypingQuiet: "打てないときだけ知らせる",
    cliTypingHint: "入力欄からフォーカスが外れたら、自動で戻します。",
    cliTypable: "⌨ 入力できます",
    cliNotTypable: "タップで入力",
    cliTypableLog: "⌨ 入力できます（ここに打ってください）。",
    cliNotTypableLog: "入力欄にフォーカスできませんでした。下の入力欄をタップしてください。",
    cliHelpNext: "next … 次の曲へ（play next と同じ）",
    cliHelpBack: "back … 前の曲へ（play prev と同じ）",
    cliHelpRe: "re … いまの曲を最初から（再生位置を 0 に）",
    cliRestartNone: "まだ鳴らしていません（先に play で選んでください）。",
    cliRestartDone: "{name} を最初からにしました。",
    /* ⌨ trk284：辞書登録（呪文）の GUI */
    cliSpellPanelTitle: "📖 辞書登録（呪文）",
    cliSpellPanelHint: "よく唱える並びを名前で覚えておけます（例：night → skin terminal; volume 30）。ここで足すと、端末で spell <名前> と打つだけで唱えられます。",
    cliSpellId: "名前（どの言語の文字・数字と - で 24 文字まで）",
    cliSpellBody: "唱える中身（; で区切る）",
    cliSpellAddBtn: "＋ 辞書に登録",
    cliSpellDelBtn: "削除",
    cliSpellCount: "辞書 {n} 本（うち自作 {m} 本・上限 {max}）",
    cliSpellFull: "辞書がいっぱいです（{max} 本まで）。使わないものを消してください。",
    /* ⌨ trk285：入力の合図（プロンプト） */
    cliPromptStyleLabel: "入力の合図（プロンプト）",
    cliPromptLinux: "Linux 系：<スキン名> ~ %",
    cliPromptBash: "bash 系：<スキン名>:~$",
    cliPromptRoot: "root 系：<スキン名>:~#",
    cliPromptFish: "fish 系：<スキン名> ~>",
    cliPromptPs: "PowerShell 系：PS <スキン名>>",
    cliPromptPlain: "シンプル：>",
    cliPromptSkin: "スキンに任せる（スキンの cli）",
    cliPromptPreview: "いまの見え方：{text}",
    cliPromptHint: "スキン名は English の表記です（例：The Art of War ~ %）。端末を開いているあいだは、画面のどこにフォーカスがあっても入力を奪います。",
    cliBellLabel: "エラーの音（ピン）を鳴らす",
    cliBellHint: "音は、スキンが「鳴らす」と言っているときだけ鳴ります。ここを切れば、どのスキンでも鳴りません（ターミナルで bell off と唱えても切れます）。",
    cliFeelHint: "Tab 補完の有無・履歴の長さ・カーソルの形・地の透け方は、スキン（cli の項目）が決めます。",
    cliOnlyTitle: "選曲画面で開けます",
    cliOnlyHint: "ゲーム中や、書斎・メディアプレイヤーを開いている間は開けません。曲リストに戻ってからどうぞ。",
    cliHelpTitle: "使える呪文",
    cliHelpPlay: "play <番号|曲名> … その曲を鳴らす（next・prev・random・fav も可）",
    cliHelpList: "list … 登録ファイルの一覧（番号つき）",
    cliHelpSkin: "skin <id> … スキンを切り替える（id を省くと、いまのスキン）",
    cliHelpGrimoire: "grimoire [カテゴリ] … 魔導書（スキンの一覧）",
    cliHelpVolume: "volume <0-100> … 音量",
    cliHelpSeek: "seek <mm:ss> … 再生位置",
    cliHelpRepeat: "repeat <off|one|all> … リピート",
    cliHelpShuffle: "shuffle <on|off> … シャッフル",
    cliHelpSpell: "spell <id> … 覚えた呪文を唱える（add・del で登録・削除）",
    cliHelpCast: "cast <呪文; 呪文> … 続けて唱える（; で区切る）",
    cliHelpHelp: "help … この一覧",
    cliHelpQuit: "quit / exit … 端末を閉じる",
    cliHelpPwd: "pwd … いまの様子（スキン・曲・音量）",
    cliHelpLs: "ls [言葉] … 曲の一覧（言葉を添えると絞り込み）",
    cliHelpCd: "cd <id> … スキンを移る（skin と同じ）",
    cliHelpCat: "cat <番号｜曲名> ／ cat spell <id> … 中身をのぞく",
    cliHelpGrep: "grep <言葉> … 曲をさがす",
    cliHelpHistory: "history … 打った呪文の履歴",
    cliHelpClear: "clear … 出力を消す",
    cliHelpEcho: "echo <文> … そのまま返す",
    cliHelpBell: "bell <on|off> … エラーの音（スキンが鳴らす端末だけ）",
    cliPwd: "いまの場所：スキン {skin} ／ 曲 {track} ／ 音量 {n}%",
    cliPwdNone: "まだ鳴らしていません",
    cliGrepNeed: "さがす言葉をください（例：grep 夜）",
    cliGrepNone: "「{q}」に合う曲がありません。",
    cliGrepTitle: "「{q}」に {n} 曲",
    cliCatNeed: "何をのぞくかください（例：cat 2 ／ cat spell midnight）",
    cliCatTitle: "{i}. {name}",
    cliCatSrc: "出どころ：{src}",
    cliCatPlayHint: "鳴らすときは play {i}",
    cliCastHint: "唱えるときは spell <id> か cast <本文>",
    cliHistoryEmpty: "まだ何も唱えていません。",
    cliHistoryTitle: "打った呪文 {n} 件（↑↓ でも辿れます）",
    cliCleared: "出力を消しました。",
    cliBellUsage: "bell <on|off> で鳴らす／止める",
    cliBellOn: "エラーの音：鳴らす",
    cliBellOff: "エラーの音：止める",
    cliNoTracks: "まだ曲がありません。曲リストに音源を足してください。",
    cliListTitle: "{n} 曲（{from}–{to} を表示）",
    cliListItem: "{i}. {name} — {src}",
    cliNeedIndex: "番号か曲名をください（list で一覧）。",
    cliPathRefused: "パスは使えません。list の番号か曲名で指定してください。",
    cliNoMatch: "「{q}」に合う曲がありません。",
    cliManyMatch: "「{q}」に {n} 件合いました。番号で指定してください。",
    cliPlaying: "▶ {name}",
    cliPlayFailed: "この曲を鳴らせませんでした。",
    cliSkinCurrent: "いまのスキン：{id}",
    cliSkinSet: "スキンを {id} にしました。",
    cliSkinUnknown: "そのスキンはありません（grimoire で一覧）。",
    cliSkinLocked: "このスキンはまだ解禁されていません（スタンプを5つ集めると使えます）。",
    cliVolumeSet: "音量 {n}%",
    cliVolumeNeed: "0〜100 の数をください。",
    cliSeekSet: "再生位置を {t} にしました。",
    cliSeekNeed: "mm:ss（例 1:30）でください。",
    cliSeekNoTrack: "先に曲を鳴らしてください。",
    cliSeekBeyond: "この曲は {t} までです。",
    cliGrimoireTitle: "魔導書：スキン {n} 種",
    cliGrimoireItem: "{id} — {label}（{cat}）",
    cliGrimoireFilter: "絞り込み：{cat} — {n} 種",
    cliGrimoireNone: "そのカテゴリのスキンはありません。",
    cliGrimoireCli: "⌨ の印は、CLI 向けのスキン（cat に wizard・cli・console のどれかを含む）です。",
    cliSpellTitle: "呪文（マクロ）{n} 本",
    cliSpellItem: "{id} → {cmds}",
    cliSpellUnknown: "その呪文はありません（spell で一覧）。",
    cliSpellAdded: "呪文 {id} を覚えました。",
    cliSpellRemoved: "呪文 {id} を忘れました。",
    cliSpellBuiltin: "最初から入っている呪文は消せません。",
    cliSpellUsage: "spell <id> で唱える／spell add <id> <呪文> で覚える／spell del <id> で忘れる",
    cliSpellBadId: "呪文の名前は、どの言語の文字でも・数字・- で 24 字までです。",
    cliSpellBadBody: "唱える中身をください（例：spell add night skin terminal; volume 30）。",
    cliCastEmpty: "唱える呪文が空です。",
    cliNoNestedCast: "cast の中で cast は使えません。",
    cliUnknown: "その呪文は分かりません：{cmd}（help で一覧）",
    cliQuit: "端末を閉じます。",
    cliRepeatSet: "リピート：{mode}",
    cliShuffleSet: "シャッフル：{mode}",
    cliOn: "オン",
    cliOff: "オフ",
    cliNeedOnOff: "on か off をください。",
    cliRepeatNeed: "off・one・all のどれかをください。",
    cliFavEmpty: "お気に入りが空です（⭐ を付けてから）。",
    cliInternalError: "うまくいきませんでした。",
  });
  Object.assign(TEXT.en, {
    cliTitle: "⌨ Terminal",
    cliSubtitle: "Type a spell (command) to drive tracks, skins, volume, and the play position directly. Esc or quit closes it.",
    cliClose: "✕ Close",
    cliPromptLabel: "Spell",
    cliRun: "Cast",
    cliHint: "↑↓ history, Tab completes, Esc closes. Type help for the list.",
    cliLogLabel: "Terminal output",
    cliPanelTitle: "⌨ Terminal (trk CLI)",
    cliPanelHint: "A console for driving tracks and skins directly. Open it with the button below (or Ctrl+. / ⌘+. on a computer).",
    cliOpenBtn: "⌨ Open the terminal",
    cliPlayLabel: "Where play goes",
    cliPlayMedia: "Play in the media player",
    cliPlayPreview: "Play as the song-list preview",
    cliSkinLabel: "Terminal look",
    cliSkinAuto: "Auto (a wizard / cli / console skin if present, otherwise terminal)",
    cliSkinTerminal: "Apply terminal",
    cliSkinKeep: "Keep the current skin",
    cliSkinHint: "By default the sheet keeps your current skin (it looks the same as the page). Pick another skin here to change only the terminal (closing it goes back).",
    /* ⌨ trk283：key · auto-close · a terminal skin of your own · the typing note */
    cliKeyLabel: "🪄 Terminal Key Setting (Ctrl / ⌘ + this key)",
    cliKeyHint: "The key that calls the spells. The same key opens and closes it (Esc also closes). While assigning, Esc cancels.",
    cliKeyWaiting: "Press a key (Esc to cancel, Backspace for off). A modifier alone will not do.",
    cliKeyOff: "Off (no call key)",
    cliKeyOffSaved: "The call key is off. You can still open it with the ⌨ button.",
    cliKeyBadKey: "That key alone cannot be used. Pick a letter, number, arrow or function key.",
    cliKeyReserved: "Browsers and the OS use that key first, so it can't be assigned (for example W T N R L F P S, Tab, digits, F-keys).",
    cliModReserved: "That combination is used first by the browser or OS, so it can't be selected. Change the call key or pick another modifier.",
    cliBellSkinOff: "This skin doesn't beep (it beeps only when the skin allows it).",
    cliInsertLabel: "How typed letters are entered",
    cliInsertNative: "Let the browser insert (default)",
    cliInsertExec: "Keep them in undo history (Ctrl+Z)",
    cliInsertHint: "By default it behaves like an ordinary text field (IME, autocorrect, undo). Choose undo history to make Ctrl+Z work for letters typed in the terminal.",
    cliKeySaved: "The call key is now {mod} + {key}.",
    cliModLabel: "Modifier (pressed with the key)",
    cliModCtrlOrMeta: "Ctrl or ⌘ / Win (either)",
    cliModMeta: "Win / ⌘ (Super) only",
    cliModCtrl: "Ctrl only",
    cliModAlt: "Alt only",
    cliModHint: "Choose Win / ⌘ to call it with Win + key (Super + key). Windows itself claims many of them (Win+D, Win+L, …), so use one that is free, such as Win+Enter or Win+`.",
    cliHelpAll: "help all … list every spell ({n})",
    cliSheetSizeLabel: "Terminal height",
    cliSheetHalf: "Small (half the screen)",
    cliSheetTall: "Normal (70%)",
    cliSheetFull: "Large (nearly full)",
    cliSheetHint: "A bottom sheet that rises from below. The skin is applied to the sheet only, so the song list behind keeps its colours.",
    cliSheetSkin: "This terminal looks like: {id} (the page behind is unchanged)",
    cliKeyTaken: "That key is already used for playing, the menu or the player.",
    cliAutoClose: "Close after casting (off by default: it stays open)",
    cliAutoCloseHint: "While off, the sheet stays open after a spell so you can keep casting (Esc or the same key closes it).",
    cliSkinPickChk: "Pick the terminal skin myself",
    cliSkinPickLabel: "Terminal skin",
    cliSkinPickAuto: "(leave it to “Terminal look” above)",
    cliSkinApplied: "Skin: {id} is on (it goes back when you close).",
    cliSkinAppliedFail: "Could not apply that skin.",
    cliTypingLabel: "Tell me when I can type",
    cliTypingBadge: "A badge above the input (ready / tap to type)",
    cliTypingStatus: "One line in the log when it opens",
    cliTypingQuiet: "Only warn when typing is not possible",
    cliTypingHint: "If the focus leaves the input, it comes back automatically.",
    cliTypable: "⌨ Ready to type",
    cliNotTypable: "Tap to type",
    cliTypableLog: "⌨ You can type here.",
    cliNotTypableLog: "Could not focus the input. Tap the input below.",
    cliHelpNext: "next … go to the next track (same as play next)",
    cliHelpBack: "back … go to the previous track (same as play prev)",
    cliHelpRe: "re … restart the current track from the beginning",
    cliRestartNone: "Nothing is playing yet (pick a track with play first).",
    cliRestartDone: "Restarted {name}.",
    /* ⌨ trk284：the spell dictionary GUI */
    cliSpellPanelTitle: "📖 Spell dictionary",
    cliSpellPanelHint: "Save a sequence you cast often under a name (e.g. night → skin terminal; volume 30). Register it here and cast it with spell <name>.",
    cliSpellId: "Name (letters in any language, digits and - up to 24)",
    cliSpellBody: "What it casts (separate with ;)",
    cliSpellAddBtn: "＋ Add to dictionary",
    cliSpellDelBtn: "Delete",
    cliSpellCount: "{n} spells ({m} of your own · up to {max})",
    cliSpellFull: "The dictionary is full (up to {max}). Delete one you no longer use.",
    /* ⌨ trk285：the prompt */
    cliPromptStyleLabel: "Prompt",
    cliPromptLinux: "Linux style: <skin> ~ %",
    cliPromptBash: "bash style: <skin>:~$",
    cliPromptRoot: "root style: <skin>:~#",
    cliPromptFish: "fish style: <skin> ~>",
    cliPromptPs: "PowerShell style: PS <skin>>",
    cliPromptPlain: "Plain: >",
    cliPromptSkin: "Leave it to the skin (its cli)",
    cliPromptPreview: "Looks like: {text}",
    cliPromptHint: "The skin name is the English label (e.g. The Art of War ~ %). While the terminal is open, typing anywhere lands in the input.",
    cliBellLabel: "Play the error beep",
    cliBellHint: "It only sounds when the skin says it may. Turn this off and no skin will beep (you can also cast bell off in the terminal).",
    cliFeelHint: "Tab completion, how long the history is, the cursor shape and how see-through the background is all come from the skin (its cli values).",
    cliOnlyTitle: "Open it from the song list",
    cliOnlyHint: "It can't open during a game, or while the study or media player is open. Come back to the song list first.",
    cliHelpTitle: "Spells you can cast",
    cliHelpPlay: "play <number|title> … play that track (next, prev, random, fav)",
    cliHelpList: "list … the registered files, with numbers",
    cliHelpSkin: "skin <id> … switch skin (no id shows the current one)",
    cliHelpGrimoire: "grimoire [category] … the grimoire (skin catalog)",
    cliHelpVolume: "volume <0-100> … volume",
    cliHelpSeek: "seek <mm:ss> … play position",
    cliHelpRepeat: "repeat <off|one|all> … repeat",
    cliHelpShuffle: "shuffle <on|off> … shuffle",
    cliHelpSpell: "spell <id> … cast a saved spell (add / del to keep or forget)",
    cliHelpCast: "cast <spell; spell> … cast several in a row (split by ;)",
    cliHelpHelp: "help … this list",
    cliHelpQuit: "quit / exit … close the terminal",
    cliHelpPwd: "pwd … where you are (skin, song, volume)",
    cliHelpLs: "ls [word] … the song list (with a word, it filters)",
    cliHelpCd: "cd <id> … move to a skin (same as skin)",
    cliHelpCat: "cat <number|title> / cat spell <id> … look inside",
    cliHelpGrep: "grep <word> … find songs",
    cliHelpHistory: "history … the spells you typed",
    cliHelpClear: "clear … clear the output",
    cliHelpEcho: "echo <text> … say it back",
    cliHelpBell: "bell <on|off> … error beep (only where the skin asks)",
    cliPwd: "Here: skin {skin} / song {track} / volume {n}%",
    cliPwdNone: "nothing playing yet",
    cliGrepNeed: "Give me a word to find (e.g. grep night)",
    cliGrepNone: "No songs match “{q}”.",
    cliGrepTitle: "{n} songs match “{q}”",
    cliCatNeed: "What should I look inside? (e.g. cat 2 / cat spell midnight)",
    cliCatTitle: "{i}. {name}",
    cliCatSrc: "from: {src}",
    cliCatPlayHint: "play {i} to hear it",
    cliCastHint: "cast it with spell <id> or cast <text>",
    cliHistoryEmpty: "Nothing cast yet.",
    cliHistoryTitle: "{n} lines typed (↑↓ also walks them)",
    cliCleared: "Output cleared.",
    cliBellUsage: "bell <on|off> to beep or stay quiet",
    cliBellOn: "Error beep: on",
    cliBellOff: "Error beep: off",
    cliNoTracks: "No tracks yet. Add audio from the song list.",
    cliListTitle: "{n} tracks (showing {from}–{to})",
    cliListItem: "{i}. {name} — {src}",
    cliNeedIndex: "Give a number or a title (see list).",
    cliPathRefused: "Paths are not accepted. Use a number from list, or a title.",
    cliNoMatch: "No track matches “{q}”.",
    cliManyMatch: "{n} tracks match “{q}”. Use the number.",
    cliPlaying: "▶ {name}",
    cliPlayFailed: "That track could not be played.",
    cliSkinCurrent: "Current skin: {id}",
    cliSkinSet: "Skin is now {id}.",
    cliSkinUnknown: "No such skin (see grimoire).",
    cliSkinLocked: "That skin is still locked (collect 5 stamps to unlock it).",
    cliVolumeSet: "Volume {n}%",
    cliVolumeNeed: "Give a number from 0 to 100.",
    cliSeekSet: "Position set to {t}.",
    cliSeekNeed: "Use mm:ss (for example 1:30).",
    cliSeekNoTrack: "Play a track first.",
    cliSeekBeyond: "This track ends at {t}.",
    cliGrimoireTitle: "Grimoire: {n} skins",
    cliGrimoireItem: "{id} — {label} ({cat})",
    cliGrimoireFilter: "Filter: {cat} — {n} skins",
    cliGrimoireNone: "No skins in that category.",
    cliGrimoireCli: "The ⌨ mark means a CLI-ready skin (its cat includes wizard, cli or console).",
    cliSpellTitle: "Spells (macros): {n}",
    cliSpellItem: "{id} → {cmds}",
    cliSpellUnknown: "No such spell (see spell).",
    cliSpellAdded: "Learned the spell {id}.",
    cliSpellRemoved: "Forgot the spell {id}.",
    cliSpellBuiltin: "Built-in spells can't be removed.",
    cliSpellUsage: "spell <id> to cast / spell add <id> <spells> to learn / spell del <id> to forget",
    cliSpellBadId: "Spell names: letters in any language, digits and - (24 characters at most).",
    cliSpellBadBody: "Give the spells to cast (for example: spell add night skin terminal; volume 30).",
    cliCastEmpty: "Nothing to cast.",
    cliNoNestedCast: "cast can't be used inside cast.",
    cliUnknown: "Unknown spell: {cmd} (type help)",
    cliQuit: "Closing the terminal.",
    cliRepeatSet: "Repeat: {mode}",
    cliShuffleSet: "Shuffle: {mode}",
    cliOn: "on",
    cliOff: "off",
    cliNeedOnOff: "Use on or off.",
    cliRepeatNeed: "Use off, one, or all.",
    cliFavEmpty: "No favourites yet (mark some with ⭐ first).",
    cliInternalError: "That did not work.",
  });
  Object.assign(TEXT.zh, {
    cliTitle: "⌨ 终端",
    cliSubtitle: "输入咒文（命令）直接操作曲目、皮肤、音量和播放位置。按 Esc 或输入 quit 关闭。",
    cliClose: "✕ 关闭",
    cliPromptLabel: "咒文",
    cliRun: "施放",
    cliHint: "↑↓ 查看历史，Tab 补全，Esc 关闭。输入 help 查看列表。",
    cliLogLabel: "终端输出",
    cliPanelTitle: "⌨ 终端（trk CLI）",
    cliPanelHint: "用咒文直接操作曲目和皮肤的界面。可从下面的按钮打开（电脑上也可用 Ctrl+. / ⌘+.）。",
    cliOpenBtn: "⌨ 打开终端",
    cliPlayLabel: "play 的去向",
    cliPlayMedia: "在媒体播放器中播放",
    cliPlayPreview: "作为曲目列表的试听播放",
    cliSkinLabel: "终端的外观",
    cliSkinAuto: "自动（有 wizard・cli・console 皮肤就用它，否则用 terminal）",
    cliSkinTerminal: "使用 terminal",
    cliSkinKeep: "保持当前皮肤",
    cliSkinHint: "默认保持当前皮肤（与后面的画面相同）。在这里另选皮肤时，只有终端内部改变（关闭后恢复）。",
    /* ⌨ trk283 */
    cliKeyLabel: "🪄 Terminal Key Setting（Ctrl／⌘ ＋ 此键）",
    cliKeyHint: "呼唤咒文的键。同一个键开关终端（Esc 也能关闭）。分配时按 Esc 取消。",
    cliKeyWaiting: "请按键（Esc 取消，Backspace 关闭）。只按修饰键不能确定。",
    cliKeyOff: "关闭（无呼叫键）",
    cliKeyOffSaved: "已关闭呼叫键。仍可用 ⌨ 按钮打开。",
    cliKeyBadKey: "仅凭这个键无法确定。请用字母、数字、方向键或功能键。",
    cliKeyReserved: "该键会被浏览器或系统先使用，无法设定（如 W T N R L F P S、Tab、数字、F 键）。",
    cliModReserved: "该组合会先被浏览器或系统使用，无法选择。请更换呼出键或修饰键。",
    cliBellSkinOff: "此皮肤不会发出声音（只有皮肤允许时才会响）。",
    cliInsertLabel: "输入框中文字的录入方式",
    cliInsertNative: "交给浏览器（默认）",
    cliInsertExec: "保留在撤销记录中（Ctrl+Z）",
    cliInsertHint: "默认与普通输入框相同（输入法、自动更正、撤销）。选择「保留撤销」后，终端里输入的字母也能用 Ctrl+Z 撤销。",
    cliKeySaved: "调用键已设为 {mod} + {key}。",
    cliModLabel: "修饰键（与之同时按下）",
    cliModCtrlOrMeta: "Ctrl 或 ⌘／Win（任一）",
    cliModMeta: "仅 Win／⌘（Super）",
    cliModCtrl: "仅 Ctrl",
    cliModAlt: "仅 Alt",
    cliModHint: "选择「Win／⌘」后可用 Win + 键（Super + 键）呼出。不过 Windows 会先占用 Win+D、Win+L 等，请选用 Win+Enter 或 Win+` 等空闲组合。",
    cliHelpAll: "help all … 列出全部咒文（{n} 条）",
    cliSheetSizeLabel: "终端高度",
    cliSheetHalf: "小（屏幕一半）",
    cliSheetTall: "普通（七成）",
    cliSheetFull: "大（几乎全屏）",
    cliSheetHint: "从下方升起的面板（底部抽屉）。皮肤只作用于其中，后面的曲目列表颜色不变。",
    cliSheetSkin: "此终端的观感：{id}（后面的画面不变）",
    cliKeyTaken: "该键已用于游玩按键、菜单或播放器。",
    cliAutoClose: "施法后关闭（默认关闭：保持打开）",
    cliAutoCloseHint: "保持关闭时，施法后面板不会收起，可以继续施法（Esc 或同一按键关闭）。",
    cliSkinPickChk: "自己选择终端皮肤",
    cliSkinPickLabel: "终端皮肤",
    cliSkinPickAuto: "（交给上面的“终端外观”）",
    cliSkinApplied: "已应用皮肤：{id}（关闭后恢复）。",
    cliSkinAppliedFail: "无法应用该皮肤。",
    cliTypingLabel: "能否输入的提示",
    cliTypingBadge: "输入框上方的徽章（可输入／点按输入）",
    cliTypingStatus: "打开时在状态行显示一行",
    cliTypingQuiet: "只在无法输入时提示",
    cliTypingHint: "焦点离开输入框时，会自动回到输入框。",
    cliTypable: "⌨ 可以输入",
    cliNotTypable: "点按输入",
    cliTypableLog: "⌨ 可以输入（请打在这里）。",
    cliNotTypableLog: "无法聚焦输入框。请点按下方的输入框。",
    cliHelpNext: "next … 下一曲（与 play next 相同）",
    cliHelpBack: "back … 上一曲（与 play prev 相同）",
    cliHelpRe: "re … 从头播放当前曲（播放位置归 0）",
    cliRestartNone: "还没有播放（请先用 play 选择）。",
    cliRestartDone: "已从头播放 {name}。",
    /* ⌨ trk284 */
    cliSpellPanelTitle: "📖 咒语词典（登记）",
    cliSpellPanelHint: "把常念的连招起个名字记住（例：night → skin terminal; volume 30）。在这里添加后，只需在终端输入 spell <名字>。",
    cliSpellId: "名字（任何语言的文字、数字和 -，最多 24 个）",
    cliSpellBody: "要念的内容（用 ; 分隔）",
    cliSpellAddBtn: "＋ 添加到词典",
    cliSpellDelBtn: "删除",
    cliSpellCount: "词典 {n} 条（自制 {m} 条・上限 {max}）",
    cliSpellFull: "词典已满（最多 {max} 条）。请删除不用的条目。",
    /* ⌨ trk285 */
    cliPromptStyleLabel: "输入提示符",
    cliPromptLinux: "Linux 系：<皮肤名> ~ %",
    cliPromptBash: "bash 系：<皮肤名>:~$",
    cliPromptRoot: "root 系：<皮肤名>:~#",
    cliPromptFish: "fish 系：<皮肤名> ~>",
    cliPromptPs: "PowerShell 系：PS <皮肤名>>",
    cliPromptPlain: "简洁：>",
    cliPromptSkin: "交给皮肤（其 cli）",
    cliPromptPreview: "现在看起来：{text}",
    cliPromptHint: "皮肤名用英文表记（例：The Art of War ~ %）。终端打开期间，无论焦点在哪里，输入都会进入终端的输入框。",
    cliBellLabel: "播放出错提示音",
    cliBellHint: "只有当皮肤说可以响时才会响。关掉这里，任何皮肤都不会响（也可以在终端里说 bell off）。",
    cliFeelHint: "Tab 补全的有无、历史长度、光标形状、背景的透明度，都由皮肤（cli 项）决定。",
    cliOnlyTitle: "请在选曲画面打开",
    cliOnlyHint: "游戏中、书房或媒体播放器打开时无法使用。请先回到曲目列表。",
    cliHelpTitle: "可用的咒文",
    cliHelpPlay: "play <编号|曲名> … 播放该曲目（也可用 next、prev、random、fav）",
    cliHelpList: "list … 已登记文件的列表（带编号）",
    cliHelpSkin: "skin <id> … 切换皮肤（省略 id 显示当前皮肤）",
    cliHelpGrimoire: "grimoire [分类] … 魔导书（皮肤列表）",
    cliHelpVolume: "volume <0-100> … 音量",
    cliHelpSeek: "seek <mm:ss> … 播放位置",
    cliHelpRepeat: "repeat <off|one|all> … 循环",
    cliHelpShuffle: "shuffle <on|off> … 随机",
    cliHelpSpell: "spell <id> … 施放已记住的咒文（add・del 用于登记和删除）",
    cliHelpCast: "cast <咒文; 咒文> … 连续施放（用 ; 分隔）",
    cliHelpHelp: "help … 此列表",
    cliHelpQuit: "quit / exit … 关闭终端",
    cliHelpPwd: "pwd … 现在的位置（皮肤・曲・音量）",
    cliHelpLs: "ls [词] … 曲目列表（带词则筛选）",
    cliHelpCd: "cd <id> … 换到某个皮肤（同 skin）",
    cliHelpCat: "cat <编号｜曲名> ／ cat spell <id> … 查看内容",
    cliHelpGrep: "grep <词> … 查找曲目",
    cliHelpHistory: "history … 输入过的咒文",
    cliHelpClear: "clear … 清空输出",
    cliHelpEcho: "echo <文字> … 原样返回",
    cliHelpBell: "bell <on|off> … 出错音（仅皮肤要求时）",
    cliPwd: "现在：皮肤 {skin} ／ 曲 {track} ／ 音量 {n}%",
    cliPwdNone: "尚未播放",
    cliGrepNeed: "请给出要查找的词（例：grep 夜）",
    cliGrepNone: "没有与“{q}”相符的曲目。",
    cliGrepTitle: "“{q}”共 {n} 首",
    cliCatNeed: "要查看什么？（例：cat 2 ／ cat spell midnight）",
    cliCatTitle: "{i}. {name}",
    cliCatSrc: "来源：{src}",
    cliCatPlayHint: "播放请用 play {i}",
    cliCastHint: "施放请用 spell <id> 或 cast <文字>",
    cliHistoryEmpty: "还没有施放过。",
    cliHistoryTitle: "已输入 {n} 条（↑↓ 也可回溯）",
    cliCleared: "已清空输出。",
    cliBellUsage: "bell <on|off> 开启／关闭",
    cliBellOn: "出错音：开启",
    cliBellOff: "出错音：关闭",
    cliNoTracks: "还没有曲目。请从曲目列表添加音频。",
    cliListTitle: "{n} 首（显示 {from}–{to}）",
    cliListItem: "{i}. {name} — {src}",
    cliNeedIndex: "请输入编号或曲名（用 list 查看）。",
    cliPathRefused: "不接受路径。请用 list 的编号或曲名。",
    cliNoMatch: "没有与“{q}”匹配的曲目。",
    cliManyMatch: "有 {n} 首与“{q}”匹配。请用编号指定。",
    cliPlaying: "▶ {name}",
    cliPlayFailed: "无法播放这首曲目。",
    cliSkinCurrent: "当前皮肤：{id}",
    cliSkinSet: "皮肤已切换为 {id}。",
    cliSkinUnknown: "没有这个皮肤（用 grimoire 查看）。",
    cliSkinLocked: "这个皮肤尚未解锁（集满 5 个印章即可使用）。",
    cliVolumeSet: "音量 {n}%",
    cliVolumeNeed: "请输入 0〜100 的数字。",
    cliSeekSet: "播放位置已设为 {t}。",
    cliSeekNeed: "请用 mm:ss（例如 1:30）。",
    cliSeekNoTrack: "请先播放曲目。",
    cliSeekBeyond: "这首曲目只到 {t}。",
    cliGrimoireTitle: "魔导书：皮肤 {n} 种",
    cliGrimoireItem: "{id} — {label}（{cat}）",
    cliGrimoireFilter: "筛选：{cat} — {n} 种",
    cliGrimoireNone: "该分类没有皮肤。",
    cliGrimoireCli: "⌨ 标记表示面向 CLI 的皮肤（cat 含 wizard・cli・console 之一）。",
    cliSpellTitle: "咒文（宏）：{n} 个",
    cliSpellItem: "{id} → {cmds}",
    cliSpellUnknown: "没有这个咒文（用 spell 查看）。",
    cliSpellAdded: "已记住咒文 {id}。",
    cliSpellRemoved: "已忘记咒文 {id}。",
    cliSpellBuiltin: "内置咒文不能删除。",
    cliSpellUsage: "spell <id> 施放／spell add <id> <咒文> 记住／spell del <id> 忘记",
    cliSpellBadId: "咒文名请使用任何语言的文字、数字和 -，最多 24 个字符。",
    cliSpellBadBody: "请输入要施放的内容（例：spell add night skin terminal; volume 30）。",
    cliCastEmpty: "没有要施放的咒文。",
    cliNoNestedCast: "cast 中不能再用 cast。",
    cliUnknown: "未知的咒文：{cmd}（用 help 查看）",
    cliQuit: "关闭终端。",
    cliRepeatSet: "循环：{mode}",
    cliShuffleSet: "随机：{mode}",
    cliOn: "开",
    cliOff: "关",
    cliNeedOnOff: "请输入 on 或 off。",
    cliRepeatNeed: "请输入 off、one 或 all。",
    cliFavEmpty: "收藏夹是空的（请先加上 ⭐）。",
    cliInternalError: "没有成功。",
  });
  Object.assign(TEXT.ko, {
    cliTitle: "⌨ 터미널",
    cliSubtitle: "주문(명령)을 입력해 곡·스킨·음량·재생 위치를 직접 다룹니다. Esc 또는 quit 로 닫습니다.",
    cliClose: "✕ 닫기",
    cliPromptLabel: "주문",
    cliRun: "외치기",
    cliHint: "↑↓ 기록, Tab 자동완성, Esc 닫기. help 로 목록을 봅니다.",
    cliLogLabel: "터미널 출력",
    cliPanelTitle: "⌨ 터미널 (trk CLI)",
    cliPanelHint: "주문으로 곡과 스킨을 직접 다루는 화면입니다. 아래 버튼으로 엽니다(PC에서는 Ctrl+. / Mac은 ⌘+.).",
    cliOpenBtn: "⌨ 터미널 열기",
    cliPlayLabel: "play 의 목적지",
    cliPlayMedia: "미디어 플레이어에서 재생",
    cliPlayPreview: "곡 목록의 미리듣기로 재생",
    cliSkinLabel: "터미널 겉모습",
    cliSkinAuto: "자동(wizard・cli・console 스킨이 있으면 그것, 없으면 terminal)",
    cliSkinTerminal: "terminal 적용",
    cliSkinKeep: "지금 스킨 그대로",
    cliSkinHint: "기본은 지금 스킨 그대로(뒤 화면과 같은 모습). 여기서 다른 스킨을 고르면 터미널 안만 바뀝니다(닫으면 원래대로).",
    /* ⌨ trk283 */
    cliKeyLabel: "🪄 Terminal Key Setting (Ctrl／⌘ ＋ 이 키)",
    cliKeyHint: "주문을 부르는 열쇠입니다. 같은 키로 열고 닫습니다(Esc 로도 닫힘). 지정 중에는 Esc 로 취소합니다.",
    cliKeyWaiting: "키를 눌러 주세요(Esc 로 취소, Backspace 로 끔). 수정 키만으로는 정해지지 않습니다.",
    cliKeyOff: "끔(호출 키 없음)",
    cliKeyOffSaved: "호출 키를 껐습니다. ⌨ 버튼으로는 열 수 있습니다.",
    cliKeyBadKey: "그 키만으로는 정할 수 없습니다. 문자·숫자·방향키·기능키 등을 눌러 주세요.",
    cliKeyReserved: "브라우저·OS 가 먼저 쓰는 키라 정할 수 없습니다(예: W T N R L F P S, Tab, 숫자, F키).",
    cliModReserved: "그 조합은 브라우저·OS 가 먼저 쓰므로 고를 수 없습니다. 호출 키를 바꾸거나 다른 수정 키를 고르세요.",
    cliBellSkinOff: "이 스킨은 소리를 내지 않습니다(스킨이 허용할 때만 울립니다).",
    cliInsertLabel: "입력 문자 넣는 방식",
    cliInsertNative: "브라우저에 맡김(기본)",
    cliInsertExec: "되돌리기(Ctrl+Z) 기록에 남김",
    cliInsertHint: "기본은 보통 입력칸과 같습니다(변환·자동 수정·되돌리기). 되돌리기 기록을 고르면 터미널에 친 글자도 Ctrl+Z 로 되돌릴 수 있습니다.",
    cliKeySaved: "호출 키를 {mod} + {key} 로 했습니다.",
    cliModLabel: "수정 키(함께 누르는 키)",
    cliModCtrlOrMeta: "Ctrl 또는 ⌘／Win(어느 쪽이든)",
    cliModMeta: "Win／⌘(Super)만",
    cliModCtrl: "Ctrl만",
    cliModAlt: "Alt만",
    cliModHint: "「Win／⌘」를 고르면 Win + 키(Super + 키)로 부를 수 있습니다. 다만 Windows 는 Win+D, Win+L 등 많은 조합을 먼저 가져가므로 Win+Enter 나 Win+` 처럼 비어 있는 조합을 쓰세요.",
    cliHelpAll: "help all … 모든 주문({n}개) 보기",
    cliSheetSizeLabel: "터미널 높이",
    cliSheetHalf: "작게(화면 절반)",
    cliSheetTall: "보통(70%)",
    cliSheetFull: "크게(거의 전체)",
    cliSheetHint: "아래에서 올라오는 시트입니다. 스킨은 시트 안에만 적용되어 뒤의 곡 목록 색은 그대로입니다.",
    cliSheetSkin: "이 터미널의 모습: {id} (뒤 화면은 그대로)",
    cliKeyTaken: "그 키는 이미 플레이 키·메뉴·플레이어에서 쓰고 있습니다.",
    cliAutoClose: "주문을 외치면 닫기 (기본은 꺼짐: 계속 열어 둠)",
    cliAutoCloseHint: "꺼 두면 주문 뒤에도 시트가 열린 채로 남아 계속 외울 수 있습니다 (Esc 또는 같은 키로 닫기).",
    cliSkinPickChk: "터미널 스킨을 직접 고르기",
    cliSkinPickLabel: "터미널 스킨",
    cliSkinPickAuto: "(위의 '터미널 모양'에 맡김)",
    cliSkinApplied: "스킨: {id} 을(를) 적용했습니다 (닫으면 돌아갑니다).",
    cliSkinAppliedFail: "스킨을 적용하지 못했습니다.",
    cliTypingLabel: "입력 가능 여부 알림",
    cliTypingBadge: "입력란 위에 배지 (입력 가능／탭하여 입력)",
    cliTypingStatus: "열 때 상태 줄에 한 줄",
    cliTypingQuiet: "입력할 수 없을 때만 알림",
    cliTypingHint: "입력란에서 포커스가 벗어나면 자동으로 돌아옵니다.",
    cliTypable: "⌨ 입력할 수 있습니다",
    cliNotTypable: "탭하여 입력",
    cliTypableLog: "⌨ 입력할 수 있습니다 (여기에 입력하세요).",
    cliNotTypableLog: "입력란에 포커스하지 못했습니다. 아래 입력란을 탭하세요.",
    cliHelpNext: "next … 다음 곡 (play next 와 같음)",
    cliHelpBack: "back … 이전 곡 (play prev 와 같음)",
    cliHelpRe: "re … 지금 곡을 처음부터 (재생 위치 0)",
    cliRestartNone: "아직 재생하지 않았습니다 (먼저 play 로 고르세요).",
    cliRestartDone: "{name} 을(를) 처음부터 재생합니다.",
    /* ⌨ trk284 */
    cliSpellPanelTitle: "📖 주문 사전(등록)",
    cliSpellPanelHint: "자주 외우는 순서를 이름으로 기억해 둘 수 있습니다(예: night → skin terminal; volume 30). 여기서 추가하면 터미널에서 spell <이름> 만 입력하면 됩니다.",
    cliSpellId: "이름(모든 언어의 문자·숫자·- 로 24자까지)",
    cliSpellBody: "외울 내용(; 로 구분)",
    cliSpellAddBtn: "＋ 사전에 등록",
    cliSpellDelBtn: "삭제",
    cliSpellCount: "사전 {n} 개(직접 만든 것 {m} 개・최대 {max})",
    cliSpellFull: "사전이 가득 찼습니다(최대 {max}개). 쓰지 않는 것을 지워 주세요.",
    /* ⌨ trk285 */
    cliPromptStyleLabel: "입력 프롬프트",
    cliPromptLinux: "Linux 계열: <스킨명> ~ %",
    cliPromptBash: "bash 계열: <스킨명>:~$",
    cliPromptRoot: "root 계열: <스킨명>:~#",
    cliPromptFish: "fish 계열: <스킨명> ~>",
    cliPromptPs: "PowerShell 계열: PS <스킨명>>",
    cliPromptPlain: "간단히: >",
    cliPromptSkin: "스킨에 맡김(스킨의 cli)",
    cliPromptPreview: "지금 보이는 모습: {text}",
    cliPromptHint: "스킨 이름은 English 표기입니다(예: The Art of War ~ %). 터미널이 열려 있는 동안에는 화면 어디에 포커스가 있어도 입력이 터미널로 들어갑니다.",
    cliBellLabel: "오류 소리(삑) 내기",
    cliBellHint: "스킨이 \"내도 된다\"고 할 때만 울립니다. 여기서 끄면 어떤 스킨도 울리지 않습니다(터미널에서 bell off 라고 외쳐도 꺼집니다).",
    cliFeelHint: "Tab 자동완성 여부, 기록 길이, 커서 모양, 배경의 투명도는 스킨(cli 항목)이 정합니다.",
    cliOnlyTitle: "곡 목록에서 열 수 있습니다",
    cliOnlyHint: "게임 중이거나 서재·미디어 플레이어가 열려 있을 때는 열 수 없습니다. 곡 목록으로 돌아와 주세요.",
    cliHelpTitle: "쓸 수 있는 주문",
    cliHelpPlay: "play <번호|곡명> … 그 곡을 재생(next·prev·random·fav)",
    cliHelpList: "list … 등록된 파일 목록(번호 포함)",
    cliHelpSkin: "skin <id> … 스킨 전환(id 를 빼면 지금 스킨)",
    cliHelpGrimoire: "grimoire [분류] … 마도서(스킨 목록)",
    cliHelpVolume: "volume <0-100> … 음량",
    cliHelpSeek: "seek <mm:ss> … 재생 위치",
    cliHelpRepeat: "repeat <off|one|all> … 반복",
    cliHelpShuffle: "shuffle <on|off> … 셔플",
    cliHelpSpell: "spell <id> … 외운 주문 사용(add·del 로 등록·삭제)",
    cliHelpCast: "cast <주문; 주문> … 이어서 외치기(; 로 구분)",
    cliHelpHelp: "help … 이 목록",
    cliHelpQuit: "quit / exit … 터미널 닫기",
    cliHelpPwd: "pwd … 지금 상태(스킨・곡・음량)",
    cliHelpLs: "ls [단어] … 곡 목록(단어를 붙이면 걸러내기)",
    cliHelpCd: "cd <id> … 스킨 옮기기(skin 과 같음)",
    cliHelpCat: "cat <번호|곡명> / cat spell <id> … 속을 들여다보기",
    cliHelpGrep: "grep <단어> … 곡 찾기",
    cliHelpHistory: "history … 입력한 주문 기록",
    cliHelpClear: "clear … 출력 지우기",
    cliHelpEcho: "echo <문장> … 그대로 돌려주기",
    cliHelpBell: "bell <on|off> … 오류음(스킨이 요청한 터미널만)",
    cliPwd: "지금: 스킨 {skin} / 곡 {track} / 음량 {n}%",
    cliPwdNone: "아직 재생하지 않음",
    cliGrepNeed: "찾을 단어를 주세요(예: grep 밤)",
    cliGrepNone: "“{q}”에 맞는 곡이 없습니다.",
    cliGrepTitle: "“{q}” {n}곡",
    cliCatNeed: "무엇을 볼까요? (예: cat 2 / cat spell midnight)",
    cliCatTitle: "{i}. {name}",
    cliCatSrc: "출처: {src}",
    cliCatPlayHint: "재생은 play {i}",
    cliCastHint: "사용은 spell <id> 또는 cast <문장>",
    cliHistoryEmpty: "아직 아무것도 사용하지 않았습니다.",
    cliHistoryTitle: "입력한 주문 {n}건(↑↓ 로도 가능)",
    cliCleared: "출력을 지웠습니다.",
    cliBellUsage: "bell <on|off> 로 켜기/끄기",
    cliBellOn: "오류음: 켬",
    cliBellOff: "오류음: 끔",
    cliNoTracks: "아직 곡이 없습니다. 곡 목록에서 음원을 추가해 주세요.",
    cliListTitle: "{n} 곡({from}–{to} 표시)",
    cliListItem: "{i}. {name} — {src}",
    cliNeedIndex: "번호나 곡명을 주세요(list 로 목록).",
    cliPathRefused: "경로는 쓸 수 없습니다. list 의 번호나 곡명으로 지정해 주세요.",
    cliNoMatch: "“{q}”에 맞는 곡이 없습니다.",
    cliManyMatch: "“{q}”에 {n} 곡이 맞았습니다. 번호로 지정해 주세요.",
    cliPlaying: "▶ {name}",
    cliPlayFailed: "이 곡을 재생할 수 없습니다.",
    cliSkinCurrent: "지금 스킨: {id}",
    cliSkinSet: "스킨을 {id} 로 했습니다.",
    cliSkinUnknown: "그 스킨이 없습니다(grimoire 로 목록).",
    cliSkinLocked: "이 스킨은 아직 해금되지 않았습니다(도장 5개를 모으면 쓸 수 있습니다).",
    cliVolumeSet: "음량 {n}%",
    cliVolumeNeed: "0〜100 의 수를 주세요.",
    cliSeekSet: "재생 위치를 {t} 로 했습니다.",
    cliSeekNeed: "mm:ss(예: 1:30)로 주세요.",
    cliSeekNoTrack: "먼저 곡을 재생해 주세요.",
    cliSeekBeyond: "이 곡은 {t} 까지입니다.",
    cliGrimoireTitle: "마도서: 스킨 {n} 종",
    cliGrimoireItem: "{id} — {label} ({cat})",
    cliGrimoireFilter: "필터: {cat} — {n} 종",
    cliGrimoireNone: "그 분류의 스킨이 없습니다.",
    cliGrimoireCli: "⌨ 표시는 CLI 용 스킨(cat 에 wizard・cli・console 중 하나 포함)입니다.",
    cliSpellTitle: "주문(매크로) {n} 개",
    cliSpellItem: "{id} → {cmds}",
    cliSpellUnknown: "그 주문이 없습니다(spell 로 목록).",
    cliSpellAdded: "주문 {id} 를 외웠습니다.",
    cliSpellRemoved: "주문 {id} 를 잊었습니다.",
    cliSpellBuiltin: "처음부터 있는 주문은 지울 수 없습니다.",
    cliSpellUsage: "spell <id> 로 사용／spell add <id> <주문> 로 외우기／spell del <id> 로 잊기",
    cliSpellBadId: "주문 이름은 모든 언어의 문자·숫자·- 로 24자까지입니다.",
    cliSpellBadBody: "외칠 내용을 주세요(예: spell add night skin terminal; volume 30).",
    cliCastEmpty: "외칠 주문이 비어 있습니다.",
    cliNoNestedCast: "cast 안에서는 cast 를 쓸 수 없습니다.",
    cliUnknown: "모르는 주문입니다: {cmd} (help 로 목록)",
    cliQuit: "터미널을 닫습니다.",
    cliRepeatSet: "반복: {mode}",
    cliShuffleSet: "셔플: {mode}",
    cliOn: "켜짐",
    cliOff: "꺼짐",
    cliNeedOnOff: "on 또는 off 를 주세요.",
    cliRepeatNeed: "off·one·all 중 하나를 주세요.",
    cliFavEmpty: "즐겨찾기가 비어 있습니다(⭐ 를 먼저 붙여 주세요).",
    cliInternalError: "잘 되지 않았습니다.",
  });

  /* ⌨ trk288：純粋な計算は js/cli-pure.js（window.Trk.cliPure）から取り出して使う */
  const { SPELL_ID_RE, spellIdKey, CLI_RESERVED_CODES, cliKeyReserved, CLI_COMMANDS, CLI_ALIASES, CLI_HELP_SHORT, CLI_HELP, BUILTIN_SPELLS, CLI_CATS, isCliCat, SPELL_MAX, SPELL_ID_MAX, SPELL_BODY_MAX, CLI_LIST_LIMIT, CAST_MAX, normalizeCommand, compositionBlocked, tabShouldComplete, insertTextAt, PROMPT_STYLES, promptText, spellDraftProblem, parseLine, parseClock, formatClock, clampPercent, looksLikePath, pickTrack, splitSpells, pickCliSkin, execute } = window.Trk.cliPure;


  /* ==================== 端末の見た目と配線（ここから下はブラウザー側） ==================== */
  let overlay = null, dialog = null, logNode = null, inputNode = null, typingBadge = null;
  /* ⌨ trk284：辞書登録（呪文）の GUI の部品 */
  let spellList = null, spellStatus = null, spellIdInput = null, spellBodyInput = null;
  /* ⌨ trk285：入力の合図（プロンプト）の見出し */
  let promptNode = null;
  const state = { built: false, open: false, history: [], hi: -1, swapSkin: "", userSkin: false, returnFocus: null, composing: false, sheetSkin: "" };

  const t = (key, vars) => tr(key, vars);

  /* 曲名・出どころ（曲リストと同じ見せ方を使う） */
  function songName(it) {
    try {
      const lib = window.Trk.library;
      if (lib && typeof lib.songDisplayTitle === "function") return lib.songDisplayTitle(it) || it.title || "song";
    } catch (_) {}
    return String((it && (it.title || it.base)) || "song");
  }
  function songSrc(it) {
    try {
      const lib = window.Trk.library;
      if (lib && typeof lib.srcLabel === "function") return lib.srcLabel(it) || "";
    } catch (_) {}
    return String((it && it.source) || "");
  }
  function trackList() {
    try {
      const lib = window.Trk.library;
      return lib && typeof lib.allSongs === "function" ? (lib.allSongs() || []).filter(Boolean) : [];
    } catch (_) { return []; }
  }
  function skinCatalog() {
    const all = (window.Trk.data && window.Trk.data.SKINS) || {};
    const lang = core.settings.language || "ja";
    return Object.keys(all).map(id => {
      const def = all[id] || {};
      const label = def.label && (def.label[lang] || def.label.ja || def.label.en) || id;
      const cats = Array.isArray(def.cat) ? def.cat.slice() : (def.custom || def.pack ? ["custom"] : ["basic"]);
      /* trk270：cli を名乗る（＝端末向けの見た目を持つ）ものは `look:true`。
         wizard 24 種のうち 12 種だけが cli を持つので、`auto` はそちらを先に選びます */
      return { id, label, cats, cli: isCliCat(cats), look: !!(def.cli && typeof def.cli === "object"), locked: !!def.locked };
    });
  }
  function readSpells() {
    const raw = core.settings.cliSpells;
    const out = {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
    for (const [rawId, body] of Object.entries(raw)) {
      const id = spellIdKey(rawId);   /* ⌨ trk288（Q8）：日本語の名前も読み戻す */
      if (!SPELL_ID_RE.test(id)) continue;
      if (typeof body !== "string") continue;
      const text = body.trim().slice(0, SPELL_BODY_MAX);
      if (!text) continue;
      out[id] = text;
      if (Object.keys(out).length >= SPELL_MAX) break;
    }
    return out;
  }
  function allSpells() { return Object.assign({}, BUILTIN_SPELLS, readSpells()); }

  function playTrack(it) {
    const mode = core.settings.cliPlay === "preview" ? "preview" : "media";
    if (mode === "preview") {
      if (!window.Trk.library || typeof window.Trk.library.selectSong !== "function") return Promise.resolve({ ok: false });
      return window.Trk.library.selectSong(it).then(() => ({ ok: true })).catch(() => ({ ok: false }));
    }
    const mp = window.TrkMediaPlayer;
    if (!mp || typeof mp.open !== "function" || typeof mp.play !== "function") return Promise.resolve({ ok: false });
    try { mp.open(); } catch (_) { return Promise.resolve({ ok: false }); }
    /* 端末は閉じて、鳴っている画面へ渡します（1行が見えるよう、少しだけ待つ） */
    setTimeout(() => { if (state.open) closeCli(); }, 400);
    return Promise.resolve(mp.play(it, true)).then(() => ({ ok: true })).catch(() => ({ ok: false }));
  }
  function playSpecial(kind) {
    const lib = window.Trk.library || {};
    if (kind === "fav") {
      const keys = new Set(Array.isArray(core.settings.songFav) ? core.settings.songFav : []);
      const favs = trackList().filter(it => keys.has(it.key));
      if (!favs.length) return Promise.resolve({ ok: false, reason: "empty" });
      const it = favs[Math.floor(Math.random() * favs.length)];
      return Promise.resolve(playTrack(it)).then(r => ({ ok: r.ok, name: songName(it) }));
    }
    if (kind === "random") {
      const pool = typeof lib.shufflePool === "function" ? (lib.shufflePool() || []) : trackList();
      if (!pool.length) return Promise.resolve({ ok: false, reason: "empty" });
      const it = pool[Math.floor(Math.random() * pool.length)];
      return Promise.resolve(playTrack(it)).then(r => ({ ok: r.ok, name: songName(it) }));
    }
    const it = kind === "prev"
      ? (typeof lib.prevSong === "function" ? lib.prevSong() : null)
      : (typeof lib.nextSong === "function" ? lib.nextSong() : null);
    if (!it) return Promise.resolve({ ok: false, reason: "empty" });
    return Promise.resolve(playTrack(it)).then(r => ({ ok: r.ok, name: songName(it) }));
  }
  function applySkinCmd(id) {
    const all = (window.Trk.data && window.Trk.data.SKINS) || {};
    if (!Object.prototype.hasOwnProperty.call(all, id)) return { ok: false, reason: "unknown" };
    const def = all[id] || {};
    if (def.locked && !core.settings.skinGradUnlocked) return { ok: false, reason: "locked" };
    state.userSkin = true;
    core.applySkin(id, true);
    return { ok: true };
  }
  function setVolume(pct) {
    const v = Math.max(0, Math.min(100, pct)) / 100;
    core.settings.musicVolume = v;
    if (v > 0) core.rememberMusicVolume(v);
    if (core.videoReady && core.video) { try { core.video.volume = v; } catch (_) {} }
    core.saveUserPrefs();
    return { ok: true };
  }
  function seekTo(sec) {
    if (!core.currentSong) return { ok: false, reason: "none" };
    if (!core.videoReady || !core.video || !Number.isFinite(core.video.duration)) return { ok: false, reason: "none" };
    const max = core.video.duration;
    if (sec > max) return { ok: false, reason: "beyond", max };
    try { core.video.currentTime = Math.max(0, sec); } catch (_) { return { ok: false, reason: "none" }; }
    return { ok: true };
  }
  /* ⌨ trk283：`re` ＝いまの曲を最初から（鳴らしていなければ reason:"none"） */
  function restartTrack() {
    if (!core.currentSong) return { ok: false, reason: "none" };
    const r = seekTo(0);
    if (!r.ok) return { ok: false, reason: r.reason || "none", max: r.max };
    return { ok: true, name: songName(core.currentSong) };
  }
  function setRepeat(mode) {
    core.settings.mediaRepeat = ["off", "one", "all"].includes(mode) ? mode : "off";
    core.saveUserPrefs();
    core.emit("mediaOptions");
    return { ok: true };
  }
  function setShuffle(on) {
    core.settings.mediaShuffle = !!on;
    core.saveUserPrefs();
    core.emit("mediaOptions");
    return { ok: true };
  }
  function saveSpell(id, body) {
    if (Object.prototype.hasOwnProperty.call(BUILTIN_SPELLS, id)) return { ok: false, reason: "builtin" };
    const map = readSpells();
    if (!(id in map) && Object.keys(map).length >= SPELL_MAX) return { ok: false, reason: "full" };
    map[id] = String(body).slice(0, SPELL_BODY_MAX);
    core.settings.cliSpells = map;
    core.saveUserPrefs();
    return { ok: true };
  }
  function delSpell(id) {
    if (Object.prototype.hasOwnProperty.call(BUILTIN_SPELLS, id)) return { ok: false, reason: "builtin" };
    const map = readSpells();
    if (!(id in map)) return { ok: false, reason: "unknown" };
    delete map[id];
    core.settings.cliSpells = map;
    core.saveUserPrefs();
    return { ok: true };
  }

  const deps = {
    t,
    name: songName,
    src: songSrc,
    tracks: trackList,
    play: playTrack,
    playSpecial,
    current: () => ({ skin: core.settings.skin, volume: Math.round((core.settings.musicVolume || 0) * 100), track: core.currentSong ? songName(core.currentSong) : "" }),
    skins: skinCatalog,
    applySkin: applySkinCmd,
    volume: setVolume,
    seek: seekTo,
    restart: restartTrack,
    repeat: setRepeat,
    shuffle: setShuffle,
    spells: allSpells,
    saveSpell,
    delSpell,
    listLimit: CLI_LIST_LIMIT,
    history: () => state.history.slice(-historyCap()),   /* trk269：定番の history */
    setBell: on => { core.settings.cliBell = on === true; core.saveUserPrefs(); return true; }
  };

  /* ---------- スキンが決める操作感（trk269） ---------- */
  /* いま当たっているスキンの cli.* を読む（color などは applySkin が CSS 変数にしている） */
  function skinCli() {
    try {
      const all = (window.Trk.data && window.Trk.data.SKINS) || {};
      const def = all[core.settings.skin];
      return def && def.cli && typeof def.cli === "object" ? def.cli : {};
    } catch (_) { return {}; }
  }
  const historyCap = () => Math.max(10, Math.min(200, Number(skinCli().history) || 50));
  const completionOn = () => skinCli().completion !== "off";

  /* エラーの音（trk269）。ファイルは使いません＝その場で作る短い音。
     鳴らす条件：スキンが bell:true を名乗っている かつ 設定が鳴らしてよい（bell off で止まる）。 */
  let audioCtx = null;
  function beep() {
    if (skinCli().bell !== true || core.settings.cliBell === false) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = audioCtx || new AC();
      if (audioCtx.state === "suspended" && typeof audioCtx.resume === "function") void audioCtx.resume();
      const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
      const now = audioCtx.currentTime;
      osc.type = "square"; osc.frequency.value = 180;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(now); osc.stop(now + 0.1);
    } catch (_) { /* 音が出せない環境では黙って諦める */ }
  }

  /* ---------- 見た目 ---------- */
  function log(kind, text) {
    if (!logNode) return;
    const line = core.el("div", "cliLine cli" + kind, String(text == null ? "" : text));
    logNode.append(line);
    while (logNode.childElementCount > 400 && logNode.firstElementChild) logNode.firstElementChild.remove();
    logNode.scrollTop = logNode.scrollHeight;
  }
  function labelled(tag, key, cls) {
    const n = core.el(tag, cls || "", tr(key));
    n.dataset.i18n = key;
    return n;
  }
  function ensureBuilt() {
    if (state.built) return true;
    if (!document.body) return false;
    /* ⌨ trk286：自前のオーバーレイ（role="dialog"・Esc・フォーカスの戻し）をやめ、
       ネイティブの <dialog> ＋ showModal() にします（modern-web-guidance：手で作り直さない）。
       見た目は下から持ち上がるボトムシート（CSS のアニメーション）。 */
    dialog = core.el("dialog", "cliDialog");
    dialog.id = "cliMode";
    dialog.setAttribute("aria-labelledby", "cliTitle");
    if (typeof HTMLDialogElement !== "undefined" && "closedBy" in HTMLDialogElement.prototype) dialog.setAttribute("closedby", "any");
    overlay = dialog;
    /* 背景クリックで閉じる（closedby="any" が無いブラウザーのための手当て） */
    let pressOutside = false;
    const outside = e => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    dialog.addEventListener("pointerdown", e => { pressOutside = outside(e); });
    dialog.addEventListener("pointerup", e => { if (pressOutside && outside(e)) closeCli(); pressOutside = false; });
    /* 閉じたとき（Esc・背景・閉じるボタン・closeCli のどれでも）に 1 か所で片づける */
    dialog.addEventListener("close", () => finishClose());
    /* ⌨ trk288（C2）：見える範囲の変化（キーボード・ピンチ・回転）に合わせる */
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", fitToViewport);
      window.visualViewport.addEventListener("scroll", fitToViewport);
    }

    const header = core.el("header", "instHeader cliHeader");
    const hwrap = core.el("div");
    const h = labelled("h2", "cliTitle");
    h.id = "cliTitle";
    hwrap.append(h, labelled("p", "cliSubtitle", "instSubtitle"));
    const closeNode = labelled("button", "cliClose", "instClose");
    closeNode.id = "cliClose";
    closeNode.type = "button";
    closeNode.addEventListener("click", () => closeCli());
    header.append(hwrap, closeNode);

    logNode = core.el("div", "cliLog");
    logNode.id = "cliLog";
    logNode.setAttribute("role", "log");
    logNode.setAttribute("aria-live", "polite");
    logNode.setAttribute("aria-label", tr("cliLogLabel"));
    logNode.dataset.i18nAria = "cliLogLabel";
    logNode.tabIndex = 0;

    /* ⌨ trk283：「いま打てるか」のバッジ（設定で 出す／状態行だけ／打てないときだけ を選ぶ） */
    typingBadge = core.el("div", "cliTypingBadge");
    typingBadge.id = "cliTypingBadge";
    typingBadge.hidden = true;
    typingBadge.setAttribute("aria-live", "polite");

    const form = core.el("form", "cliForm");
    form.id = "cliForm";
    /* ⌨ trk285：合図は「<スキン名(English)> ~ %」のように文字で出す（空のときはスキンの --cli-prompt） */
    promptNode = core.el("span", "cliPromptChar");
    promptNode.id = "cliPromptChar";
    promptNode.setAttribute("aria-hidden", "true");
    const prompt = promptNode;
    inputNode = core.el("input", "cliInput");
    inputNode.id = "cliInput";
    inputNode.type = "text";
    inputNode.autocomplete = "off";
    inputNode.setAttribute("autocapitalize", "off");
    inputNode.setAttribute("spellcheck", "false");
    inputNode.setAttribute("enterkeyhint", "send");
    inputNode.setAttribute("aria-label", tr("cliPromptLabel"));
    inputNode.dataset.i18nAria = "cliPromptLabel";
    const runBtn = labelled("button", "cliRun", "instSmallBtn cliRunBtn");
    runBtn.type = "submit";
    form.append(prompt, inputNode, runBtn);

    const hint = labelled("p", "cliHint", "hint cliHintText");
    hint.id = "cliHint";

    /* ⌨ trk284：辞書登録（呪文）の GUI。端末のいちばん下に置く（整理したいときに見つけやすい） */
    const spellBox = core.el("details", "cliSpellPanel");
    spellBox.id = "cliSpellPanel";
    const spellSum = labelled("summary", "cliSpellPanelTitle");
    const spellHint = labelled("p", "cliSpellPanelHint", "hint");
    spellList = core.el("ul", "cliSpellList");
    spellList.id = "cliSpellList";
    spellList.setAttribute("aria-label", tr("cliSpellPanelTitle"));
    spellList.dataset.i18nAria = "cliSpellPanelTitle";
    const spellAdd = core.el("div", "cliSpellAdd");
    const idField = core.el("label", "field");
    idField.append(labelled("span", "cliSpellId"));
    spellIdInput = core.el("input", "cliSpellIdInput");
    spellIdInput.id = "cliSpellIdInput";
    spellIdInput.type = "text";
    spellIdInput.maxLength = SPELL_ID_MAX;
    spellIdInput.autocomplete = "off";
    spellIdInput.setAttribute("autocapitalize", "off");
    spellIdInput.setAttribute("spellcheck", "false");
    spellIdInput.setAttribute("aria-label", tr("cliSpellId"));
    spellIdInput.dataset.i18nAria = "cliSpellId";
    idField.append(spellIdInput);
    const bodyField = core.el("label", "field");
    bodyField.append(labelled("span", "cliSpellBody"));
    spellBodyInput = core.el("input", "cliSpellBodyInput");
    spellBodyInput.id = "cliSpellBodyInput";
    spellBodyInput.type = "text";
    spellBodyInput.maxLength = SPELL_BODY_MAX;
    spellBodyInput.autocomplete = "off";
    spellBodyInput.setAttribute("autocapitalize", "off");
    spellBodyInput.setAttribute("spellcheck", "false");
    spellBodyInput.setAttribute("aria-label", tr("cliSpellBody"));
    spellBodyInput.dataset.i18nAria = "cliSpellBody";
    bodyField.append(spellBodyInput);
    spellStatus = core.el("p", "hint status cliSpellStatus");
    spellStatus.id = "cliSpellStatus";
    spellStatus.setAttribute("role", "status");
    spellStatus.setAttribute("aria-live", "polite");
    const spellAddBtn = labelled("button", "cliSpellAddBtn", "instSmallBtn");
    spellAddBtn.type = "button";
    spellAddBtn.id = "cliSpellAddBtn";
    spellAddBtn.addEventListener("click", () => addSpellFromGui());
    /* Enter でも登録できる（form の入れ子は作らない＝端末の form を壊さない） */
    for (const node of [spellIdInput, spellBodyInput]) {
      node.addEventListener("keydown", e => {
        if (compositionBlocked(e.isComposing, e.keyCode)) return;
        if (e.key !== "Enter") return;
        e.preventDefault();
        addSpellFromGui();
      });
    }
    spellAdd.append(idField, bodyField, spellAddBtn);
    spellBox.append(spellSum, spellHint, spellList, spellAdd, spellStatus);

    /* 上端のつまみ（見た目だけ・ドラッグは今後の課題） */
    const handle = core.el("div", "cliSheetHandle");
    handle.setAttribute("aria-hidden", "true");
    dialog.append(handle, header, logNode, typingBadge, form, hint, spellBox);
    document.body.append(dialog);

    form.addEventListener("submit", e => { e.preventDefault(); if (state.composing) return; void submit(); });
    /* ⌨ trk284：IME の変換中かどうかを持つ（変換中の Enter で、書きかけを唱えない） */
    inputNode.addEventListener("compositionstart", () => { state.composing = true; });
    inputNode.addEventListener("compositionend", () => { state.composing = false; });
    inputNode.addEventListener("keydown", onInputKey);
    /* ⌨ trk283：入力欄以外へフォーカスが逃げたら、打てる状態へ戻す（ボタン・選択は除く） */
    overlay.addEventListener("focusin", e => {
      if (!state.open) return;
      const t = e.target;
      if (!t || t === inputNode) return;
      /* 出力を読み返す・辞書を書く・ボタンを押す、は邪魔しない（trk284） */
      if (t.closest && t.closest("#cliLog, #cliSpellPanel")) return;
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(t.tagName)) return;
      focusInput();
    });
    /* 入力欄をタップ→フォーカスが戻ったら、バッジを更新する */
    overlay.addEventListener("focusout", () => { if (state.open) setTimeout(() => showTyping(false), 0); });
    /* Esc は <dialog> が閉じます（自前のハンドラは置きません） */
    state.built = true;
    return true;
  }
  /* ---------- ⌨ trk284：辞書登録（呪文）の GUI ---------- */
  function renderSpells() {
    if (!spellList) return;
    const spells = allSpells();
    const ids = Object.keys(spells);
    spellList.textContent = "";
    for (const id of ids) {
      const li = core.el("li", "cliSpellRow");
      const name = core.el("code", "cliSpellName", id);
      const body = core.el("span", "cliSpellText", String(spells[id]));
      const builtin = Object.prototype.hasOwnProperty.call(BUILTIN_SPELLS, id);
      const del = core.el("button", "miniBtn cliSpellDel", tr("cliSpellDelBtn"));
      del.type = "button";
      del.setAttribute("aria-label", tr("cliSpellDelBtn") + " " + id);
      if (builtin) { del.disabled = true; del.title = tr("cliSpellBuiltin"); }
      else del.addEventListener("click", () => {
        const r = delSpell(id);
        log(r.ok ? "out" : "err", tr(r.ok ? "cliSpellRemoved" : "cliSpellUnknown", { id }));
        renderSpells();
        focusInput();
      });
      li.append(name, body, del);
      spellList.append(li);
    }
    if (spellStatus) {
      const mine = ids.filter(id => !Object.prototype.hasOwnProperty.call(BUILTIN_SPELLS, id)).length;
      spellStatus.textContent = tr("cliSpellCount", { n: ids.length, m: mine, max: SPELL_MAX });
    }
  }
  function addSpellFromGui() {
    const key = String(spellIdInput ? spellIdInput.value : "").trim().toLowerCase();
    const body = String(spellBodyInput ? spellBodyInput.value : "").trim();
    const builtin = Object.prototype.hasOwnProperty.call(BUILTIN_SPELLS, key);
    const count = Object.keys(readSpells()).length;
    const problem = spellDraftProblem(key, body, { builtin, count, max: SPELL_MAX });
    const say = { id: "cliSpellBadId", body: "cliSpellBadBody", builtin: "cliSpellBuiltin", full: "cliSpellFull" }[problem] || "";
    if (problem) {
      log("err", tr(say || "cliInternalError", { max: SPELL_MAX }));
      if (spellStatus) spellStatus.textContent = tr(say || "cliInternalError", { max: SPELL_MAX });
      if (problem === "id" && spellIdInput) spellIdInput.focus();
      return false;
    }
    const r = saveSpell(key, body);
    if (!r.ok) {
      const why = r.reason === "builtin" ? "cliSpellBuiltin" : r.reason === "full" ? "cliSpellFull" : "cliInternalError";
      log("err", tr(why, { max: SPELL_MAX }));
      if (spellStatus) spellStatus.textContent = tr(why, { max: SPELL_MAX });
      return false;
    }
    log("out", tr("cliSpellAdded", { id: key }));
    if (spellStatus) spellStatus.textContent = tr("cliSpellAdded", { id: key });
    if (spellIdInput) spellIdInput.value = "";
    if (spellBodyInput) spellBodyInput.value = "";
    renderSpells();
    if (spellIdInput) { try { spellIdInput.focus({ preventScroll: true }); } catch (_) {} }
    return true;
  }
  function onInputKey(e) {
    /* ⌨ trk284：変換中（IME）は、Enter・Tab・矢印を端末の操作に使わない */
    if (compositionBlocked(e.isComposing, e.keyCode)) return;
    if (e.key === "Tab") {
      /* 補完がオフ・Shift+Tab・空のときは、フォーカスを動かす（Tab で閉じ込めない） */
      if (!tabShouldComplete(inputNode.value, e.shiftKey, completionOn())) return;
      e.preventDefault();
      const done = completeCommand(inputNode.value);
      if (done !== inputNode.value) inputNode.value = done;
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (!state.history.length) return;
      e.preventDefault();
      state.hi = e.key === "ArrowUp"
        ? Math.max(0, (state.hi < 0 ? state.history.length : state.hi) - 1)
        : Math.min(state.history.length, state.hi + 1);
      inputNode.value = state.hi >= state.history.length ? "" : state.history[state.hi];
      inputNode.setSelectionRange(inputNode.value.length, inputNode.value.length);
    }
  }
  function completeCommand(text) {
    const q = parseLine(text);
    if (!q.cmd || text.includes(" ")) return text;
    const hits = CLI_COMMANDS.filter(c => c.startsWith(q.cmd));
    return hits.length === 1 ? hits[0] + " " : text;
  }
  async function submit() {
    if (!inputNode || state.composing) return;
    const line = inputNode.value;
    inputNode.value = "";
    if (!line.trim()) return;
    state.history.push(line);
    if (state.history.length > historyCap()) state.history.shift();
    state.hi = state.history.length;
    log("in", "> " + line);
    const res = await execute(line, deps);
    if (res.clear && logNode) logNode.textContent = "";                 /* clear：先に消して、残すのは「消しました」だけ */
    for (const o of res.out) log(o.kind, o.text);
    if (res.out.some(o => o.kind === "err")) beep();                    /* エラーの音（スキンが名乗ったときだけ） */
    if (res.quit) { closeCli(); return; }
    /* ⌨ trk283：実行したら閉じる（既定）。1 行を見せてから戻り、同じ文をトーストでも出す */
    if (res.action && core.settings.cliAutoClose === true) {   /* ⌨ trk286：既定は閉じない */
      const last = res.out[res.out.length - 1];
      const say = last && last.kind !== "err" ? last.text : "";
      setTimeout(() => {
        if (!state.open) return;
        closeCli();
        if (say) toastNote(say);
      }, 520);
      return;
    }
    focusInput();
    showTyping(false);
    renderSpells();   /* 呪文を唱えて増減したときも、辞書の GUI を合わせる */
  }
  function focusInput() {
    if (!inputNode) return;
    try { inputNode.focus({ preventScroll: true }); } catch (_) { try { inputNode.focus(); } catch (__) {} }
  }

  /* ---------- ⌨ trk283：文字が打てる状態かのチェック ---------- */
  /* 入力欄が「使えて・見えていて・フォーカスされている」かを 1 つの形で返す（テストからも読める純関数寄り） */
  function typableState() {
    if (!state.open || !inputNode) return { ok: false, focused: false, why: "closed" };
    const blocked = inputNode.disabled === true || inputNode.readOnly === true;
    const visible = !!(inputNode.offsetParent || (inputNode.getClientRects && inputNode.getClientRects().length));
    const focused = document.activeElement === inputNode;
    const ok = !blocked && visible;
    return { ok, focused, why: blocked ? "blocked" : !visible ? "hidden" : focused ? "" : "unfocused" };
  }
  /* 知らせ方：badge（既定・常時バッジ）／status（開いたときに 1 行）／quiet（打てないときだけ） */
  const typingMode = () => (["badge", "status", "quiet"].includes(core.settings.cliTypingCheck) ? core.settings.cliTypingCheck : "badge");
  function showTyping(announce) {
    const st = typableState(), mode = typingMode();
    if (typingBadge) {
      typingBadge.hidden = !state.open || mode === "quiet";
      typingBadge.textContent = tr(st.ok ? "cliTypable" : "cliNotTypable");
      typingBadge.dataset.ok = st.ok ? "1" : "0";
      typingBadge.title = st.ok ? "" : tr("cliNotTypableLog");
    }
    if (announce) {
      if (st.ok && mode === "quiet") return st;          /* 静かにしてほしい人には黙る */
      log(st.ok ? "out" : "err", tr(st.ok ? "cliTypableLog" : "cliNotTypableLog"));
    }
    return st;
  }
  /* フォーカスを当て直す（描画直後は入らないことがあるので、少しだけ試す） */
  function ensureFocus(tries) {
    focusInput();
    const st = typableState();
    const left = Number(tries) || 0;
    if ((!st.ok || !st.focused) && left < 2) setTimeout(() => { if (state.open) ensureFocus(left + 1); }, 60);
    return st;
  }

  /* ---------- ⌨ trk285：入力の合図（<スキン名(English)> ~ %） ---------- */
  /* いまのスキンの English 名（label.en を優先。無ければ ja・id） */
  function skinEnglishName(id) {
    const all = (window.Trk.data && window.Trk.data.SKINS) || {};
    const key = id || state.sheetSkin || core.settings.skin;
    const def = all[key] || {};
    const label = def.label || {};
    return String(label.en || label.ja || key || "trk");
  }
  const promptStyle = () => (PROMPT_STYLES.includes(core.settings.cliPromptStyle) ? core.settings.cliPromptStyle : "linux");
  const promptNow = () => promptText(promptStyle(), skinEnglishName());
  /* 合図を出し直す（入力欄の読み上げ名にも入れる） */
  function updatePrompt() {
    const text = promptNow();
    if (promptNode) {
      promptNode.textContent = text;
      promptNode.dataset.text = text ? "1" : "0";
    }
    if (inputNode) inputNode.setAttribute("aria-label", (text ? text.trim() + " … " : "") + tr("cliPromptLabel"));
    return text;
  }
  /* ⚙ の「いまの見え方」を合わせる（スキン・言語・選んだ形が変わったとき） */
  function syncPromptPreview() {
    const sel = document.getElementById("cliPromptSel");
    const preview = document.getElementById("cliPromptPreview");
    if (sel) sel.value = promptStyle();
    if (preview) {
      const text = promptStyle() === "skin" ? String(skinCli().prompt || ">") : promptNow().trim();
      preview.textContent = tr("cliPromptPreview", { text });
    }
  }

  /* ⌨ trk283：開くときに当てるスキン（モード＝auto/terminal/keep、個別指定があれば優先） */
  function chooseCliSkin() {
    const mode = ["terminal", "keep"].includes(core.settings.cliSkin) ? core.settings.cliSkin : "keep";   /* ⌨ trk288（R5）：逃げ先は keep */
    const pick = core.settings.cliSkinPickOn === true ? core.settings.cliSkinPick : "";
    return pickCliSkin(skinCatalog(), mode, pick);
  }

  /* ⌨ trk286：スキンを**端末の中だけ**に当てる。
     背景（body / #app）の色は触らず、この <dialog> のサブツリーの CSS 変数だけ差し替えます。
     なので開閉で後ろの曲リストがちらつきません（modern-web-guidance の design-token-reactivity の考え方）。 */
  const SHEET_SIZES = ["half", "tall", "full"];
  /* ⌨ trk288（C2）：ソフトウェアキーボードが出て「見える範囲」が縮んだら、板もその中に収める。
     dvh は iOS のキーボードでは縮まないので、visualViewport の高さと位置で上限と底を決める。 */
  function fitToViewport() {
    if (!overlay) return;
    const vv = window.visualViewport;
    if (!vv) { overlay.style.removeProperty("max-height"); overlay.style.removeProperty("bottom"); return; }
    const h = Math.max(160, Math.round(vv.height));
    const bottom = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
    overlay.style.setProperty("max-height", h + "px");
    overlay.style.setProperty("bottom", bottom + "px");
  }
  function applySheetSkin() {
    if (!overlay) return "";
    const all = (window.Trk.data && window.Trk.data.SKINS) || {};
    const want = chooseCliSkin();
    const id = want && all[want] ? want : (all[core.settings.skin] ? core.settings.skin : "");
    state.sheetSkin = id;
    overlay.removeAttribute("style");
    fitToViewport();   /* removeAttribute で消えた上限を、すぐ当て直す */
    if (!id) return "";
    const ui = all[id].ui || {};
    for (const [k, v] of Object.entries(ui)) {
      if (typeof v === "string" && k.startsWith("--")) { try { overlay.style.setProperty(k, v); } catch (_) {} }
    }
    /* 小さい文字が読める色（data 側の計算をそのまま借りる） */
    try {
      const ink = window.Trk.data && window.Trk.data.accentInk && window.Trk.data.accentInk(ui);
      if (ink) overlay.style.setProperty("--ui-accent-ink", ink);
    } catch (_) { /* 計算できなければ既定のまま */ }
    overlay.dataset.cliSkin = id;
    return id;
  }
  /* 高さ（half / tall / full）とスキンをまとめて合わせる */
  function syncSheet() {
    if (!overlay) return "";
    const size = SHEET_SIZES.includes(core.settings.cliSheetSize) ? core.settings.cliSheetSize : "tall";
    overlay.dataset.size = size;
    const sel = document.getElementById("cliSheetSize");
    if (sel) sel.value = size;
    return applySheetSkin();
  }

  function canOpen() {
    if (core.phase !== "title") return false;
    const ov = window.Trk.overlay;
    if (!ov) return true;
    return !ov.is("study") && !ov.is("synth") && !ov.is("media");
  }
  function openCli() {
    if (state.open) { focusInput(); return true; }
    if (!canOpen() || (window.TrkSafeMode && TrkSafeMode())) return false;
    if (!ensureBuilt()) return false;
    state.open = true;
    state.history = [];
    state.hi = -1;
    state.userSkin = false;
    state.swapSkin = "";
    state.returnFocus = document.activeElement;
    if (logNode) logNode.textContent = "";
    /* ⌨ trk286：スキンは端末の中だけ・高さを合わせてから、下から持ち上げる */
    const sheet = syncSheet();
    window.Trk.overlay.set("cli", true);
    document.body.classList.add("cliOpen");
    if (typeof overlay.showModal === "function") {
      try { overlay.showModal(); } catch (_) { overlay.setAttribute("open", ""); }
    } else {
      overlay.setAttribute("open", "");
    }
    log("out", tr("cliSubtitle"));
    const cur = deps.current();
    log("out", tr("cliSkinCurrent", { id: cur.skin }) + "  ·  " + tr("cliVolumeSet", { n: cur.volume }));
    if (sheet) log("out", tr("cliSheetSkin", { id: sheet }));
    /* ⌨ trk283：打てる状態かを検めてから、知らせる（設定で バッジ／状態行／静か を選ぶ） */
    updatePrompt();   /* ⌨ trk285：当てたスキンの English 名で「<name> ~ %」を出す */
    renderSpells();
    ensureFocus(0);
    showTyping(true);
    return true;
  }
  /* 閉じる入口は 1 つ。実際の片づけは close イベントに集めます（Esc・背景・ボタン・closeCli のどれでも同じ） */
  function closeCli() {
    if (!state.open) return;
    state.open = false;
    if (overlay && overlay.open && typeof overlay.close === "function") {
      try { overlay.close(); return; } catch (_) { /* 下の片づけへ */ }
    }
    overlay && overlay.removeAttribute("open");
    finishClose();
  }
  function finishClose() {
    state.open = false;
    if (window.Trk && window.Trk.overlay && window.Trk.overlay.set) window.Trk.overlay.set("cli", false);
    document.body.classList.remove("cliOpen");
    if (typingBadge) typingBadge.hidden = true;
    state.swapSkin = "";
    /* フォーカスは <dialog> が元の場所へ戻します（手で戻さない） */
    const back = state.returnFocus;
    state.returnFocus = null;
    if (back && back.isConnected && typeof back.focus === "function" && !document.activeElement?.closest?.("dialog")) {
      try { back.focus({ preventScroll: true }); } catch (_) {}
    }
  }

  /* ---------- ⚙ の入口と設定の配線 ---------- */
  function wireSettings() {
    const openBtn = document.getElementById("cliOpenBtn");
    if (openBtn && !openBtn.dataset.cliWired) {
      openBtn.dataset.cliWired = "1";
      openBtn.addEventListener("click", () => {
        try { if (typeof core.closeSettings === "function") core.closeSettings(); } catch (_) {}
        if (!openCli()) toastNote(tr("cliOnlyTitle"));
      });
    }
    const playSel = document.getElementById("cliPlaySel");
    if (playSel && !playSel.dataset.cliWired) {
      playSel.dataset.cliWired = "1";
      playSel.value = core.settings.cliPlay === "preview" ? "preview" : "media";
      playSel.addEventListener("change", () => {
        core.settings.cliPlay = playSel.value === "preview" ? "preview" : "media";
        core.saveUserPrefs();
      });
    }
    const bellChk = document.getElementById("cliBellChk");
    if (bellChk && !bellChk.dataset.cliWired) {
      bellChk.dataset.cliWired = "1";
      bellChk.checked = core.settings.cliBell !== false;
      bellChk.addEventListener("change", () => {
        core.settings.cliBell = bellChk.checked;
        core.saveUserPrefs();
      });
    }
    const keyBtn = document.getElementById("cliKeyAssign");
    if (keyBtn && !keyBtn.dataset.cliWired) {
      keyBtn.dataset.cliWired = "1";
      /* ⌨ trk286：もう一度押したら取り消し（待ちっぱなしにしない） */
      keyBtn.addEventListener("click", () => {
        cliKeyBinding = cliKeyBinding === null ? 0 : null;
        syncCliKeyUI();
      });
    }
    /* ⌨ trk287：一緒に押す修飾キー（Ctrl／⌘・Win（Super）・Alt） */
    const modSel = document.getElementById("cliModSel");
    if (modSel && !modSel.dataset.cliWired) {
      modSel.dataset.cliWired = "1";
      modSel.value = cliMod();
      modSel.addEventListener("change", () => {
        const next = CLI_MODS.includes(modSel.value) ? modSel.value : "ctrlOrMeta";
        /* ⌨ trk289（N3）：修飾キーを変えて、予約のキーになるなら受けない（元に戻す） */
        if (cliKeyReserved(cliKeyCode(), next, core.settings.cliShift === true)) {
          modSel.value = cliMod();
          toastNote(tr("cliModReserved"));
          syncCliKeyUI(tr("cliModReserved"));
          return;
        }
        core.settings.cliMod = next;
        core.saveUserPrefs();
        syncCliKeyUI();
      });
    }
    /* ⌨ trk286：ほかを触ったら割り当てをやめる（キーを吸い続けるのを防ぐ） */
    if (!document.documentElement.dataset.cliKeyOutside) {
      document.documentElement.dataset.cliKeyOutside = "1";
      document.addEventListener("pointerdown", e => {
        if (cliKeyBinding === null) return;
        const t = e.target;
        if (t && t.closest && t.closest("#cliKeyAssign")) return;
        cliKeyBinding = null; syncCliKeyUI("");
      }, true);
    }
    syncCliKeyUI();
    const autoChk = document.getElementById("cliAutoCloseChk");
    if (autoChk && !autoChk.dataset.cliWired) {
      autoChk.dataset.cliWired = "1";
      autoChk.checked = core.settings.cliAutoClose === true;   /* ⌨ trk286：既定は「閉じない」 */
      autoChk.addEventListener("change", () => { core.settings.cliAutoClose = autoChk.checked; core.saveUserPrefs(); });
    }
    /* ⌨ trk286：板の高さを選ぶ（小さめ／ふつう／大きめ） */
    const sheetSel = document.getElementById("cliSheetSize");
    if (sheetSel && !sheetSel.dataset.cliWired) {
      sheetSel.dataset.cliWired = "1";
      sheetSel.value = SHEET_SIZES.includes(core.settings.cliSheetSize) ? core.settings.cliSheetSize : "tall";
      sheetSel.addEventListener("change", () => {
        core.settings.cliSheetSize = SHEET_SIZES.includes(sheetSel.value) ? sheetSel.value : "tall";
        core.saveUserPrefs();
        if (state.open) syncSheet();
      });
    }
    const pickChk = document.getElementById("cliSkinPickChk");
    const pickSel = document.getElementById("cliSkinPickSel");
    const syncPick = () => {
      if (pickSel) pickSel.disabled = core.settings.cliSkinPickOn !== true;
      if (pickChk) pickChk.checked = core.settings.cliSkinPickOn === true;
    };
    if (pickSel && !pickSel.dataset.cliWired) {
      pickSel.dataset.cliWired = "1";
      fillSkinPick(pickSel);
      pickSel.value = core.settings.cliSkinPick || "";
      pickSel.addEventListener("change", () => { core.settings.cliSkinPick = pickSel.value; core.saveUserPrefs(); });
    }
    if (pickChk && !pickChk.dataset.cliWired) {
      pickChk.dataset.cliWired = "1";
      syncPick();
      pickChk.addEventListener("change", () => { core.settings.cliSkinPickOn = pickChk.checked; syncPick(); core.saveUserPrefs(); });
    }
    const promptSel = document.getElementById("cliPromptSel");
    if (promptSel && !promptSel.dataset.cliWired) {
      promptSel.dataset.cliWired = "1";
      syncPromptPreview();
      promptSel.addEventListener("change", () => {
        core.settings.cliPromptStyle = PROMPT_STYLES.includes(promptSel.value) ? promptSel.value : "linux";
        core.saveUserPrefs();
        updatePrompt();
        syncPromptPreview();
      });
    }
    const typingSel = document.getElementById("cliTypingSel");
    if (typingSel && !typingSel.dataset.cliWired) {
      typingSel.dataset.cliWired = "1";
      typingSel.value = typingMode();
      typingSel.addEventListener("change", () => {
        core.settings.cliTypingCheck = ["badge", "status", "quiet"].includes(typingSel.value) ? typingSel.value : "badge";
        core.saveUserPrefs();
        if (state.open) showTyping(false);
      });
    }
    const skinSel = document.getElementById("cliSkinSel");
    if (skinSel && !skinSel.dataset.cliWired) {
      skinSel.dataset.cliWired = "1";
      skinSel.value = ["auto", "terminal", "keep"].includes(core.settings.cliSkin) ? core.settings.cliSkin : "keep";
      skinSel.addEventListener("change", () => {
        core.settings.cliSkin = ["auto", "terminal", "keep"].includes(skinSel.value) ? skinSel.value : "keep";
        core.saveUserPrefs();
      });
    }
    /* ⌨ trk288（R2）：入力欄の文字の入れ方 */
    const insertSel = document.getElementById("cliInsertSel");
    if (insertSel && !insertSel.dataset.cliWired) {
      insertSel.dataset.cliWired = "1";
      insertSel.value = core.settings.cliInsert === "exec" ? "exec" : "native";
      insertSel.addEventListener("change", () => {
        core.settings.cliInsert = insertSel.value === "exec" ? "exec" : "native";
        core.saveUserPrefs();
      });
    }
    /* ⌨ trk288（R7）：音の二重の関門の見せ方。音はアプリのいまのスキン（beep と同じ）で決まる */
    if (bellChk && !bellChk.dataset.cliNoteWired) {
      bellChk.dataset.cliNoteWired = "1";
      bellChk.addEventListener("change", syncBellNote);
    }
    if (skinSel && !skinSel.dataset.cliNoteWired) { skinSel.dataset.cliNoteWired = "1"; skinSel.addEventListener("change", syncBellNote); }
    syncBellNote();
  }
  /* ⌨ trk288（R7）：いまのスキン（アプリの skin）が「鳴らす」と言っていなければ、⚙ の横に一言出す */
  function syncBellNote() {
    const note = document.getElementById("cliBellNote");
    if (!note) return;
    const all = (window.Trk.data && window.Trk.data.SKINS) || {};
    const def = all[core.settings.skin];
    const cli = def && def.cli && typeof def.cli === "object" ? def.cli : {};
    note.hidden = cli.bell === true;
  }
  /* 端末のスキンの選択肢（スキン名は、いまの言語のもの） */
  function fillSkinPick(sel) {
    const all = (window.Trk.data && window.Trk.data.SKINS) || {};
    const lang = core.settings.language || "ja";
    const labelOf = id => {
      const def = all[id] || {};
      return String((def.label && (def.label[lang] || def.label.ja || def.label.en)) || id);
    };
    sel.textContent = "";
    const auto = core.el("option", "", tr("cliSkinPickAuto"));
    auto.value = "";
    sel.append(auto);
    for (const id of Object.keys(all).sort((a, b) => labelOf(a).localeCompare(labelOf(b), lang) || a.localeCompare(b))) {
      const o = core.el("option", "", labelOf(id) + (all[id] && all[id].locked ? " 🔒" : ""));
      o.value = id;
      if (all[id] && all[id].locked) o.disabled = true;
      sel.append(o);
    }
  }
  function toastNote(text) {
    try {
      if (window.Trk.play && typeof window.Trk.play.showToast === "function") { window.Trk.play.showToast(text); return; }
    } catch (_) {}
    if (typeof window.showToast === "function") { try { window.showToast(text); } catch (_) {} }
  }

  /* ---------- 呼び出しキー（Ctrl／⌘ + 選んだキー・同じキーで開閉） ---------- */
  /* ⌨ trk288（Q1）：既定は Backquote（JIS では半角／全角で IME に取られる）→ Period（Ctrl+.）へ */
  const cliKeyCode = () => (core.validCode(core.settings.cliKey) ? core.settings.cliKey : "");   /* trk290："" ＝オフ（既定） */
  /* ⌨ trk287：一緒に押す修飾キー。既定は Ctrl か ⌘／Win のどちらでも。
     "meta"＝Win／⌘（Super）だけ／"ctrl"＝Ctrl だけ／"alt"＝Alt だけ */
  const CLI_MODS = ["ctrlOrMeta", "meta", "ctrl", "alt"];
  const cliMod = () => (CLI_MODS.includes(core.settings.cliMod) ? core.settings.cliMod : "ctrlOrMeta");
  /* 表示用の短い名前（キーの名前なので、どの言語でも同じ） */
  const CLI_MOD_SHORT = { ctrlOrMeta: "Ctrl／⌘", meta: "Win／⌘", ctrl: "Ctrl", alt: "Alt" };
  const modShort = () => CLI_MOD_SHORT[cliMod()] || CLI_MOD_SHORT.ctrlOrMeta;
  /* ⌨ trk288（C3）：Shift を一緒に押すかどうか（登録したときの状態を覚える。既定は押さない） */
  const modLabel = () => modShort() + (core.settings.cliShift === true ? " + Shift" : "");
  /* 押されている修飾キーが、選んだものと合うか */
  function cliModPressed(e) {
    const m = cliMod();
    if (m === "meta") return e.metaKey === true && !e.ctrlKey && !e.altKey;
    if (m === "ctrl") return e.ctrlKey === true && !e.metaKey && !e.altKey;
    if (m === "alt") return e.altKey === true && !e.ctrlKey && !e.metaKey;
    return (e.ctrlKey === true || e.metaKey === true) && !e.altKey;
  }
  let cliKeyBinding = null;
  /* ⌨ trk286：割り当てに使えないキー。
     ・修飾キーだけ（Ctrl／Shift／Alt／⌘・CapsLock など）＝押すと「Ctrl+Ctrl」になって呼び出せない
     ・Esc ＝取り消しに使う／Tab ＝フォーカス移動を奪う */
  const CLI_KEY_MODIFIERS = ["ControlLeft", "ControlRight", "ShiftLeft", "ShiftRight", "AltLeft", "AltRight",
    "MetaLeft", "MetaRight", "OSLeft", "OSRight", "CapsLock", "NumLock", "ScrollLock", "Dead"];
  const cliKeyUsable = code => !!code && code !== "Escape" && code !== "Tab" && !CLI_KEY_MODIFIERS.includes(code) && core.validCode(code);
  /* ⌨ trk288（C3）：遊ぶキー・メニュー・プレイヤーのキーと重なっても**登録できる**（呼び出しは修飾キー付きなので、
     遊びの操作と同時には起きない）。拒むのはブラウザー・OS が先に取るキー（cliKeyReserved）だけ。 */
  function syncCliKeyUI(message) {
    const value = document.getElementById("cliKeyValue"), button = document.getElementById("cliKeyAssign");
    const status = document.getElementById("cliKeyStatus");
    const on = cliKeyBinding !== null;
    const modSel = document.getElementById("cliModSel");
    if (modSel) modSel.value = cliMod();
    if (value) value.textContent = cliKeyCode() ? modLabel() + " + " + core.formatKey(cliKeyCode()) : tr("cliKeyOff");
    if (button) { button.classList.toggle("listening", on); button.setAttribute("aria-pressed", String(on)); }
    if (status) status.textContent = message !== undefined ? message : (on ? tr("cliKeyWaiting") : "");
  }
  /* 押されたキーを覚える。Esc は取り消し。使えないキーは受けない（待ちは続ける） */
  function captureCliKey(code, shift) {
    if (cliKeyBinding === null) return false;
    if (!code || code === "Escape") { cliKeyBinding = null; syncCliKeyUI(""); return false; }
    if (code === "Backspace" || code === "Delete") {   /* trk290：Backspace・Delete で呼び出しキーをオフ */
      core.settings.cliKey = "";
      cliKeyBinding = null;
      core.saveUserPrefs();
      syncCliKeyUI(tr("cliKeyOffSaved"));
      return true;
    }
    if (!cliKeyUsable(code)) { syncCliKeyUI(tr("cliKeyBadKey")); return false; }
    if (cliKeyReserved(code, cliMod(), shift === true)) { toastNote(tr("cliKeyReserved")); syncCliKeyUI(tr("cliKeyReserved")); return false; }
    core.settings.cliKey = code;
    core.settings.cliShift = shift === true;   /* ⌨ trk288：Shift を押して決めたときは、Shift 付きで呼ぶ */
    cliKeyBinding = null;
    core.saveUserPrefs();
    syncCliKeyUI(tr("cliKeySaved", { mod: modLabel(), key: core.formatKey(code) }));
    return true;
  }

  addEventListener("keydown", e => {
    /* 割り当て中は、押されたキーをそのまま受け取る（Esc は取り消し） */
    if (cliKeyBinding !== null) {
      e.preventDefault(); e.stopPropagation();
      if (!e.repeat) captureCliKey(core.keyCodeOf(e), e.shiftKey === true);
      return;
    }
    if (e.defaultPrevented) return;
    if (!cliKeyCode()) return;   /* trk290：オフのときは何もしない */
    if (!cliModPressed(e)) return;
    if ((e.shiftKey === true) !== (core.settings.cliShift === true)) return;   /* ⌨ trk288：Shift は登録どおりに */
    if ((core.keyCodeOf(e) || "") !== cliKeyCode()) return;
    const tag = (e.target && e.target.tagName || "").toLowerCase();
    if (!state.open && (tag === "input" || tag === "textarea" || tag === "select" || (e.target && e.target.isContentEditable))) return;
    e.preventDefault();
    /* ⌨ trk283：同じキーで開いて閉じる（トグル） */
    if (state.open) closeCli();
    else if (!openCli()) toastNote(tr("cliOnlyTitle"));
  }, true);

  /* ⌨ trk287：開いているあいだは、端末がキーボードを握る。
     trk285 は「フォーカスが入力欄の外のときだけ」拾っていたので、ブラウザーやほかの処理が
     preventDefault した文字（報告のあった p・: など）が落ちることがありました。
     いまは**入力欄にフォーカスがあっても、文字はこちらで入れる**（＝どこで止められても落ちない）。
     端末の外の操作（P＝一時停止・/＝設定の検索・`＝リトライ）には渡しません。 */
  /* ⌨ trk288（C1）：キーボードで押せる部品（この上の Space・Enter は、押す働きに譲る） */
  const CLI_CONTROL_SEL = "button, summary, select, a, [role=button]";
  const isTypeable = e => typeof e.key === "string" && e.key.length === 1 &&
    !e.ctrlKey && !e.metaKey && !e.altKey;
  addEventListener("keydown", e => {
    if (!state.open || !inputNode || cliKeyBinding !== null) return;
    if (compositionBlocked(e.isComposing, e.keyCode)) return;   /* IME の変換中は、そのまま渡す */
    const t = e.target;
    if (t && t.closest && t.closest("#cliSpellPanel")) return;   /* 辞書の入力欄は邪魔しない */
    const inside = !!(t && t.closest && t.closest("#cliMode"));
    if (!inside && t && (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.isContentEditable)) return;
    /* ⌨ trk288（C1）：ボタン・選択・リンクの上では、キーは本来の働きに任せる（Space で押す・Enter で押す）。
       以前は Space や Enter を入力欄へ送ってしまい、✕ や「唱える」をキーボードで押せませんでした。 */
    if (t && t.closest && t.closest(CLI_CONTROL_SEL)) return;
    if (isTypeable(e)) {
      /* ⌨ trk288（R2）：入力欄の上の 1 文字。
         規定（cliInsert＝native）は、ブラウザーの挿入に任せる（元に戻す・変換・自動修正が効く）。
         ほかの処理が止めたときだけ、下の bubble の listener で端末が入れる。
         cliInsert＝exec を選んだ人は、execCommand で入れる（元に戻す履歴に残る）。 */
      if (t === inputNode) {
        if (core.settings.cliInsert !== "exec") return;
        e.preventDefault();
        e.stopPropagation();
        if (!insertViaExec(e.key)) insertOwn(e.key);
        return;
      }
      e.preventDefault();
      e.stopPropagation();   /* 外の操作に渡さない（1 文字を二重にしない） */
      insertOwn(e.key);
      return;
    }
    if (!inside) return;
    if (e.key === "Tab") return;                                                    /* Tab はフォーカス移動に譲る（trk284） */
    if (t && t.closest && t.closest("#cliLog") && /^(Arrow|Page|Home|End)/.test(e.key)) return;  /* 出力の読み返し */
    focusInput();
  }, true);

  /* ⌨ trk288（R2）：1 文字を、入力欄のカーソル位置へ端末が入れる */
  function insertOwn(ch) {
    if (!inputNode) return;
    const r = insertTextAt(inputNode.value, ch, inputNode.selectionStart, inputNode.selectionEnd);
    inputNode.value = r.value;
    try { inputNode.setSelectionRange(r.caret, r.caret); } catch (_) {}
    focusInput();
  }
  /* execCommand で入れる（元に戻す履歴に残す）。使えなければ false（呼び元で insertOwn） */
  function insertViaExec(ch) {
    try {
      focusInput();
      return !!document.execCommand && document.execCommand("insertText", false, ch) === true;
    } catch (_) { return false; }
  }
  /* bubble の段：入力欄で、ほかの処理が keydown を止めた（＝ブラウザーは入れない）1 文字だけ、端末が入れる。
     例：trk287 の p・: のように、preventDefault された文字が落ちるのを防ぐ。 */
  addEventListener("keydown", e => {
    if (!state.open || !inputNode || e.target !== inputNode) return;
    if (core.settings.cliInsert === "exec") return;
    if (!e.defaultPrevented || !isTypeable(e) || compositionBlocked(e.isComposing, e.keyCode)) return;
    insertOwn(e.key);
  }, false);

  /* 言語を変えたら、端末の中の文言も入れ替える */
  core.on("language", () => {
    if (!state.built || !overlay) return;
    overlay.querySelectorAll("[data-i18n]").forEach(n => { n.textContent = tr(n.dataset.i18n); });
    overlay.querySelectorAll("[data-i18n-aria]").forEach(n => n.setAttribute("aria-label", tr(n.dataset.i18nAria)));
    renderSpells();   /* ⌨ trk284：辞書の「削除」など、GUI が作る文言も入れ替える */
    updatePrompt();   /* ⌨ trk285：合図の読み上げ名も入れ替える */
    syncPromptPreview();
  });
  /* ⌨ trk285：スキンが変わったら合図も変える（スキン名を出しているため） */
  core.on("skin", () => {
    /* ⌨ trk286：端末の中のスキンも追いかける（このあと updatePrompt で合図の名も変わる） */
    if (state.open) syncSheet(); else state.sheetSkin = "";
    if (state.open || promptNode) updatePrompt();
    syncPromptPreview();
  });

  /* 選曲画面を離れたら閉じる（ゲーム・書斎・プレイヤーへ行ったとき） */
  core.on("phase", p => { if (p !== "title" && state.open) closeCli(); });

  /* ⌨ trk290（推奨1）：保存済みの呼び出しキーが、いまの修飾キーでは予約になっているとき（trk288 までに試した保存）は、
     貼り付けなどを奪わないよう Period に戻す。未配布なので、影響は試した人だけ。 */
  if (cliKeyCode() && cliKeyReserved(cliKeyCode(), cliMod(), core.settings.cliShift === true)) { core.settings.cliKey = ""; core.saveUserPrefs(); }
  wireSettings();
  if (!state.built && document.readyState === "loading") addEventListener("DOMContentLoaded", wireSettings, { once: true });

  window.Trk.cli = Object.assign(window.Trk.cli || {}, {
    open: openCli,
    close: closeCli,
    isOpen: () => state.open,
    run: line => execute(line, deps),
    commands: () => CLI_COMMANDS.slice(),
    spells: allSpells,
    parseLine,
    parseClock,
    formatClock,
    pickTrack,
    splitSpells,
    pickCliSkin,
    chooseCliSkin,
    sheetSize: () => (SHEET_SIZES.includes(core.settings.cliSheetSize) ? core.settings.cliSheetSize : "tall"),
    spellDraftProblem,
    promptText,
    PROMPT_STYLES,
    skinEnglishName,
    normalizeCommand,
    compositionBlocked,
    tabShouldComplete,
    typableState,
    typingMode,
    cliKeyCode,
    cliMod,
    cliModPressed,
    insertTextAt,
    historyCap,
    completionOn
  });
})();

// SPDX-License-Identifier: GPL-3.0-or-later
/* ============================================================================
   trk! cli.js — ⌨ ターミナル（trk267）
   trk-Avatar-Library の「trk CLI 設計書 v0.1」（2026-11-03）のフェーズ C を、
   trk! 本体側に入れたものです。呪文（コマンド）を打って、曲・スキン・音量・
   再生位置を直に操ります。

   ・置き場所：選曲画面の上に重ねる（全画面の重ね表示の名前は "cli"）
   ・入口：⚙ の「⌨ ターミナル」と、PC では Ctrl+`（Mac は ⌘+`）
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
    cliPanelHint: "呪文を打って、曲とスキンを直に操る画面です。下のボタンから開けます（PC では Ctrl+` / Mac は ⌘+` でも開きます）。",
    cliOpenBtn: "⌨ ターミナルを開く",
    cliPlayLabel: "play の行き先",
    cliPlayMedia: "メディアプレイヤーで鳴らす",
    cliPlayPreview: "曲リストの試聴で鳴らす",
    cliSkinLabel: "ターミナルの見た目",
    cliSkinAuto: "自動（wizard・cli・console のスキンがあればそれ、無ければ terminal）",
    cliSkinTerminal: "terminal を当てる",
    cliSkinKeep: "いまのスキンのまま",
    cliSkinHint: "ここで当てたスキンは、ターミナルを開いている間だけです。閉じると元のスキンに戻ります（ターミナルで skin を唱えたときは、そのスキンが残ります）。",
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
    cliSpellBadId: "呪文の名前は英数字と - で 24 文字までにしてください。",
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
    cliPanelHint: "A console for driving tracks and skins directly. Open it with the button below (or Ctrl+` / ⌘+` on a computer).",
    cliOpenBtn: "⌨ Open the terminal",
    cliPlayLabel: "Where play goes",
    cliPlayMedia: "Play in the media player",
    cliPlayPreview: "Play as the song-list preview",
    cliSkinLabel: "Terminal look",
    cliSkinAuto: "Auto (a wizard / cli / console skin if present, otherwise terminal)",
    cliSkinTerminal: "Apply terminal",
    cliSkinKeep: "Keep the current skin",
    cliSkinHint: "The skin here lasts only while the terminal is open; it goes back when you close it (a skin you cast inside stays).",
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
    cliSpellBadId: "Spell names use letters, digits and - (24 characters at most).",
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
    cliPanelHint: "用咒文直接操作曲目和皮肤的界面。可从下面的按钮打开（电脑上也可用 Ctrl+` / ⌘+`）。",
    cliOpenBtn: "⌨ 打开终端",
    cliPlayLabel: "play 的去向",
    cliPlayMedia: "在媒体播放器中播放",
    cliPlayPreview: "作为曲目列表的试听播放",
    cliSkinLabel: "终端的外观",
    cliSkinAuto: "自动（有 wizard・cli・console 皮肤就用它，否则用 terminal）",
    cliSkinTerminal: "使用 terminal",
    cliSkinKeep: "保持当前皮肤",
    cliSkinHint: "这里应用的皮肤只在终端打开期间有效，关闭后恢复原皮肤（在终端里用 skin 指定的皮肤会保留）。",
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
    cliSpellBadId: "咒文名请使用字母、数字和 -，最多 24 个字符。",
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
    cliPanelHint: "주문으로 곡과 스킨을 직접 다루는 화면입니다. 아래 버튼으로 엽니다(PC에서는 Ctrl+` / Mac은 ⌘+`).",
    cliOpenBtn: "⌨ 터미널 열기",
    cliPlayLabel: "play 의 목적지",
    cliPlayMedia: "미디어 플레이어에서 재생",
    cliPlayPreview: "곡 목록의 미리듣기로 재생",
    cliSkinLabel: "터미널 겉모습",
    cliSkinAuto: "자동(wizard・cli・console 스킨이 있으면 그것, 없으면 terminal)",
    cliSkinTerminal: "terminal 적용",
    cliSkinKeep: "지금 스킨 그대로",
    cliSkinHint: "여기서 적용한 스킨은 터미널을 여는 동안만입니다. 닫으면 원래 스킨으로 돌아갑니다(터미널에서 skin 을 외친 경우는 그 스킨이 남습니다).",
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
    cliSpellBadId: "주문 이름은 영문·숫자·- 로 24자까지입니다.",
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

  /* ==================== 純粋な計算（trk267） ====================
     ここから「純粋な計算（trk267）ここまで」までは DOM も core も触りません。
     入力 → 文字列 だけで動くので、tests/trk267-cli.test.mjs が vm で読みます。 */

  /* 使えるコマンド（補完と help の並び順もこの配列） */
  const CLI_COMMANDS = ["help", "list", "play", "skin", "grimoire", "volume", "seek", "repeat", "shuffle", "spell", "cast",
    "pwd", "ls", "cd", "cat", "grep", "history", "clear", "man", "echo", "bell", "quit", "exit"];
  /* ⌨ trk269：端末の定番の呼び名。trk! の言葉に橋渡しする（ls＝一覧、cd＝スキンを移る、man＝説明） */
  const CLI_ALIASES = { ls: "list", dir: "list", cd: "skin", man: "help" };
  const CLI_HELP = [
    ["play", "cliHelpPlay"], ["list", "cliHelpList"], ["skin", "cliHelpSkin"], ["grimoire", "cliHelpGrimoire"],
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
  const SPELL_BODY_MAX = 200;
  const CLI_LIST_LIMIT = 40;
  const CAST_MAX = 12;

  function parseLine(line) {
    const raw = String(line == null ? "" : line).replace(/\s+/g, " ").trim();
    if (!raw) return { cmd: "", args: [], rest: "", raw: "" };
    const sp = raw.indexOf(" ");
    const cmd = (sp < 0 ? raw : raw.slice(0, sp)).toLowerCase();
    const rest = sp < 0 ? "" : raw.slice(sp + 1).trim();
    return { cmd, args: rest ? rest.split(" ") : [], rest, raw };
  }

  /* mm:ss / h:mm:ss / 秒（数だけ）。読めなければ null。 */
  function parseClock(text) {
    const s = String(text == null ? "" : text).trim();
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
    const n = Number(value);
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
  function pickCliSkin(skins, mode) {
    const list = Array.isArray(skins) ? skins.filter(s => s && typeof s.id === "string") : [];
    const has = id => list.some(s => s.id === id);
    if (mode === "keep") return "";
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
    if (!q0.cmd) return { out, quit: false, clear: false };
    /* パイプ `|` は「続けて唱える」と同じ（cast の入れ子では見ない） */
    if (!ctx.depth && q0.raw.includes("|")) {
      const parts = splitSpells(q0.raw);
      if (parts.length > 1) {
        let quit = false;
        for (const part of parts) {
          const r = await execute(part, deps, { depth: 1 });
          for (const o of r.out) out.push(o);
          if (r.quit) { quit = true; break; }
        }
        return { out, quit, clear: false };
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

    if (q.cmd === "help") {
      /* man <cmd> は 1 つだけ（trk269）。無ければ全部 */
      const only = q.rest ? q.rest.split(" ")[0].toLowerCase() : "";
      const picked = only ? CLI_HELP.filter(([word, key]) => word === only || key === only) : [];
      if (only && !picked.length) {
        push("err", t("cliUnknown", { cmd: only }));
      } else {
        push("out", t("cliHelpTitle"));
        for (const [, key] of (picked.length ? picked : CLI_HELP)) push("out", "  " + t(key));
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
        if (r.ok) push("out", t("cliPlaying", { name: r.name || "" }));
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
          if (r.ok) push("out", t("cliPlaying", { name }));
          else push("err", t("cliPlayFailed"));
        }
      }
    } else if (q.cmd === "skin") {
      const id = (q.args[0] || "").toLowerCase();
      if (!id) {
        const cur = (typeof deps.current === "function" ? deps.current() : {}) || {};
        push("out", t("cliSkinCurrent", { id: cur.skin || "shadow" }));
      } else {
        const r = (typeof deps.applySkin === "function" ? deps.applySkin(id) : { ok: false }) || {};
        if (r.ok) push("out", t("cliSkinSet", { id }));
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
        if (r.ok) push("out", t("cliVolumeSet", { n: pct }));
        else push("err", t("cliInternalError"));
      }
    } else if (q.cmd === "seek") {
      const sec = parseClock(q.args[0]);
      if (sec === null) push("err", t("cliSeekNeed"));
      else {
        const r = (typeof deps.seek === "function" ? deps.seek(sec) : { ok: false, reason: "none" }) || {};
        if (r.ok) push("out", t("cliSeekSet", { t: formatClock(sec) }));
        else if (r.reason === "beyond") push("err", t("cliSeekBeyond", { t: formatClock(r.max) }));
        else push("err", t("cliSeekNoTrack"));
      }
    } else if (q.cmd === "repeat") {
      const mode = (q.args[0] || "").toLowerCase();
      if (!["off", "one", "all"].includes(mode)) push("err", t("cliRepeatNeed"));
      else {
        const r = (typeof deps.repeat === "function" ? deps.repeat(mode) : { ok: false }) || {};
        if (r.ok) push("out", t("cliRepeatSet", { mode }));
        else push("err", t("cliInternalError"));
      }
    } else if (q.cmd === "shuffle") {
      const word = (q.args[0] || "").toLowerCase();
      const on = word === "on" || word === "1" || word === "true";
      const off = word === "off" || word === "0" || word === "false";
      if (!on && !off) push("err", t("cliNeedOnOff"));
      else {
        const r = (typeof deps.shuffle === "function" ? deps.shuffle(on) : { ok: false }) || {};
        if (r.ok) push("out", t("cliShuffleSet", { mode: on ? t("cliOn") : t("cliOff") }));
        else push("err", t("cliInternalError"));
      }
    } else if (q.cmd === "spell") {
      const sub = (q.args[0] || "").toLowerCase();
      const spells = typeof deps.spells === "function" ? deps.spells() : {};
      if (!sub) {
        const ids = Object.keys(spells);
        push("out", t("cliSpellTitle", { n: ids.length }));
        for (const id of ids) push("out", "  " + t("cliSpellItem", { id, cmds: spells[id] }));
        push("out", t("cliSpellUsage"));
      } else if (sub === "add") {
        const m = q.rest.match(/^add\s+(\S+)\s+([\s\S]+)$/i);
        if (!m) push("err", t("cliSpellUsage"));
        else if (!/^[a-z0-9][a-z0-9-]{0,23}$/i.test(m[1])) push("err", t("cliSpellBadId"));
        else if (!m[2].trim()) push("err", t("cliSpellBadBody"));
        else {
          const r = (typeof deps.saveSpell === "function" ? deps.saveSpell(m[1].toLowerCase(), m[2].trim()) : { ok: false }) || {};
          if (r.ok) push("out", t("cliSpellAdded", { id: m[1].toLowerCase() }));
          else if (r.reason === "builtin") push("err", t("cliSpellBuiltin"));
          else if (r.reason === "full") push("err", t("cliSpellBadId"));
          else push("err", t("cliInternalError"));
        }
      } else if (sub === "del") {
        const id = (q.args[1] || "").toLowerCase();
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
          }
        }
      }
    } else if (q.cmd === "cast") {
      if (ctx.depth) push("err", t("cliNoNestedCast"));
      else {
        const parts = splitSpells(q.rest);
        if (!parts.length) push("err", t("cliCastEmpty"));
        for (const part of parts) {
          const r = await execute(part, deps, { depth: 1 });
          for (const o of r.out) out.push(o);
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
    return { out, quit, clear };
  }

  /* ==================== 純粋な計算（trk267）ここまで ==================== */

  /* ==================== 端末の見た目と配線（ここから下はブラウザー側） ==================== */
  let overlay = null, dialog = null, logNode = null, inputNode = null;
  const state = { built: false, open: false, history: [], hi: -1, swapSkin: "", userSkin: false, returnFocus: null };

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
    for (const [id, body] of Object.entries(raw)) {
      if (!/^[a-z0-9][a-z0-9-]{0,23}$/.test(id)) continue;
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
    overlay = core.el("div", "instOverlay cliOverlay");
    overlay.id = "cliMode";
    overlay.hidden = true;
    const backdrop = core.el("div", "instBackdrop");
    backdrop.addEventListener("click", () => closeCli());

    dialog = core.el("section", "instDialog cliDialog");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "cliTitle");

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

    const form = core.el("form", "cliForm");
    form.id = "cliForm";
    const prompt = core.el("span", "cliPromptChar");   /* 記号は CSS（--cli-prompt）。スキンが変えられます */
    prompt.setAttribute("aria-hidden", "true");
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

    dialog.append(header, logNode, form, hint);
    overlay.append(backdrop, dialog);
    document.body.append(overlay);

    form.addEventListener("submit", e => { e.preventDefault(); void submit(); });
    inputNode.addEventListener("keydown", onInputKey);
    overlay.addEventListener("keydown", e => { if (e.key === "Escape") { e.preventDefault(); closeCli(); } });
    state.built = true;
    return true;
  }
  function onInputKey(e) {
    if (e.key === "Tab") {
      if (!completionOn()) return;   /* スキンが completion:"off" と言ったら、Tab は何もしない */
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
    if (!inputNode) return;
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
    if (res.quit) closeCli();
    else focusInput();
  }
  function focusInput() {
    if (!inputNode) return;
    try { inputNode.focus({ preventScroll: true }); } catch (_) { try { inputNode.focus(); } catch (__) {} }
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
    const mode = core.settings.cliSkin === "terminal" || core.settings.cliSkin === "keep" ? core.settings.cliSkin : "auto";
    const want = pickCliSkin(skinCatalog(), mode);
    if (want && want !== core.settings.skin) {
      state.swapSkin = core.settings.skin;
      core.applySkin(want, false);
    }
    window.Trk.overlay.set("cli", true);
    overlay.hidden = false;
    document.body.classList.add("cliOpen");
    log("out", tr("cliSubtitle"));
    const cur = deps.current();
    log("out", tr("cliSkinCurrent", { id: cur.skin }) + "  ·  " + tr("cliVolumeSet", { n: cur.volume }));
    focusInput();
    return true;
  }
  function closeCli() {
    if (!state.open) return;
    state.open = false;
    window.Trk.overlay.set("cli", false);
    if (overlay) overlay.hidden = true;
    document.body.classList.remove("cliOpen");
    if (state.swapSkin && !state.userSkin) { try { core.applySkin(state.swapSkin, false); } catch (_) {} }
    state.swapSkin = "";
    const back = state.returnFocus;
    state.returnFocus = null;
    if (back && back.isConnected && typeof back.focus === "function") { try { back.focus({ preventScroll: true }); } catch (_) {} }
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
    const skinSel = document.getElementById("cliSkinSel");
    if (skinSel && !skinSel.dataset.cliWired) {
      skinSel.dataset.cliWired = "1";
      skinSel.value = ["auto", "terminal", "keep"].includes(core.settings.cliSkin) ? core.settings.cliSkin : "auto";
      skinSel.addEventListener("change", () => {
        core.settings.cliSkin = ["auto", "terminal", "keep"].includes(skinSel.value) ? skinSel.value : "auto";
        core.saveUserPrefs();
      });
    }
  }
  function toastNote(text) {
    try {
      if (window.Trk.play && typeof window.Trk.play.showToast === "function") { window.Trk.play.showToast(text); return; }
    } catch (_) {}
    if (typeof window.showToast === "function") { try { window.showToast(text); } catch (_) {} }
  }

  /* ---------- Ctrl+` / ⌘+` ---------- */
  addEventListener("keydown", e => {
    if (e.key !== "`" && e.code !== "Backquote") return;
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    if (e.defaultPrevented) return;
    const tag = (e.target && e.target.tagName || "").toLowerCase();
    if (!state.open && (tag === "input" || tag === "textarea" || tag === "select" || (e.target && e.target.isContentEditable))) return;
    e.preventDefault();
    if (state.open) closeCli();
    else if (!openCli()) toastNote(tr("cliOnlyTitle"));
  }, true);

  /* 言語を変えたら、端末の中の文言も入れ替える */
  core.on("language", () => {
    if (!state.built || !overlay) return;
    overlay.querySelectorAll("[data-i18n]").forEach(n => { n.textContent = tr(n.dataset.i18n); });
    overlay.querySelectorAll("[data-i18n-aria]").forEach(n => n.setAttribute("aria-label", tr(n.dataset.i18nAria)));
  });
  /* 選曲画面を離れたら閉じる（ゲーム・書斎・プレイヤーへ行ったとき） */
  core.on("phase", p => { if (p !== "title" && state.open) closeCli(); });

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
    historyCap,
    completionOn
  });
})();

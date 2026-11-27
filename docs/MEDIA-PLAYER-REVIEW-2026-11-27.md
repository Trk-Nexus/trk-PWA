# trk! のメディアプレイヤー再点検（統合版・安定版を出す前に）

- 日付：2026-11-27
- 前提：trk326（Avatar 倉庫の受け子 7 件）を `main` へマージ済み（PR #112 → `ef23c4d`）
- 方法：①リポジトリの実装をコードから棚卸し（推測で書かない）②他のプレイヤーの思想・UX 原則と突き合わせ ③足りない物を重要度順に整理
- これは**決まりごとではなく点検表**です。採る／採らないは利用者（作者）の判断で、採らないものは理由を残すのが目的です。

## 1. trk! のプレイヤーの思想（実装から読み取れる現在の立ち位置）

1. **ローカル優先**：同梱曲・持ち込みファイル・（明示保存した）曲だけ。HLS/DASH のような配信の受け口は無い。
2. **アカウント無し・広告無し・外部送信無し**（`docs/HANDOFF.md` の方針、`tools/check-security.mjs` が検査）。
3. **ゲームと同じ画面に住む**：プレイヤーは「📺 メディア」の上に載り、題字・スキン・書体の設定と共有する。単体の音楽アプリではない。
4. **選んだものを勝手に変えない**：設定は 4 言語・既定は「今のまま」。読み込み（受け子）も「検証 → 予告 → 本人の選択」。
5. **細かい設定は ❓謎設定へ**：主要な操作だけ表に出し、残りは折りたたむ（＝progressive disclosure と相性が良い）。

## 2. いま出来ていること（コードで確認した事実）

| 分類 | 実装 | 主な場所 |
| --- | --- | --- |
| 再生・停止・前後曲 | あり | `js/media-player-mode.js`、`js/player-bar.js` |
| シーク（波形つき） | あり（`mediaWave`） | `js/media-player-mode.js` |
| 再生速度 | あり（0.5–2.0x。ゲーム側は 3.0x も設定で） | `js/media-player-mode.js`、`js/speed.js` |
| 音量・ミュート | あり | `js/media-player-mode.js` |
| リピート（なし／1曲／全曲）・シャッフル | あり（一覧内シャッフルも設定で） | `js/core.js`（`mediaRepeat`／`mediaShuffle`） |
| A-B リピート・プリセット・ランダム区間 | あり | `js/media-player-mode.js` |
| 章（M4B/MP4 の `chpl`） | あり（読み取りのみ） | `js/audio-art.js`、`js/media-player-mode.js` |
| 睡眠タイマー | あり（分指定・曲末・章末・15 秒フェード） | `js/media-player-mode.js` |
| 歌詞 | あり（パネル・保存） | `js/lyrics.js` |
| 字幕 | あり（`.srt`/`.vtt`・位置 3 段・大きさ 3 段・遅延調整） | `js/subtitles.js` |
| 全画面・画中画（PiP） | あり（`mediaPipKeep`・webkit 対応） | `js/video-max.js`、`js/media-player-mode.js` |
| 背景の壁（Wall） | あり（時計・4 スタイル・カスタム） | `js/media-player-mode.js` |
| キーボード | あり（動画キー割当・終了キー・Esc 方針） | `js/core.js`、`js/media-player-mode.js` |
| MediaSession（ロック画面・ハードキー） | あり（play/pause/前後/seek±/seekto） | `js/media-player-mode.js`、`js/fx-dock.js` |
| 画面消灯の抑止（Wake Lock） | あり（既定オン） | `js/media-player-mode.js` |
| 続きから再生・スマート巻き戻し | あり（位置保存＋再開時に 0/3/5/10/15/30 秒戻す） | `js/media-player-mode.js` |
| キューの検索・選択 | あり（300 件まで表示） | `js/media-player-mode.js` |
| プレイリスト・お気に入り | あり（プレイリストへドラッグ追加） | `js/library.js`、`js/favs.js` |
| 明示保存（オフライン） | あり（上限つき） | `js/audio-keep.js` |
| 逆再生・フレーム補間・エフェクト | あり（trk! 固有の遊び） | `js/media-player-mode.js`、`js/fx.js` |

→ **一般的な動画／音楽プレイヤーが持つ要素の大半は既にあります。** 足りないのは「壊れたとき・待たされるとき・並べ替えたいとき」の体験と、**OS 統合の詰め**です。

## 3. 足りない・弱い（重要度順）

### P1：安定版を出す前に片づけたい（小さく、効果が大きい）

1. **MediaSession の `playbackState` が、メディアプレイヤー本体では設定されていない**
   `js/fx-dock.js` だけが `play`/`pause` で `playbackState` を更新しています。`js/media-player-mode.js` の `updateMediaSession()` は metadata と `setPositionState` だけ。
   仕様では `playbackState` を**要素の play/pause から**同期しないと、ロック画面のボタンが逆のアイコンになることがあります（[1](https://apurvkhare.com/articles/frontend/web-platform-apis/media-session/)、[3](https://progressivewebapps.com/capabilities/media-and-system/)）。
   → `core.video` の `play`/`pause`/`ended` で `navigator.mediaSession.playbackState` を同期。**受け入れ**：ロック画面のボタンと実状態が一致（実機で確認）。

2. **ロック画面のアートが「アプリのアイコン 1 枚」だけ**
   `artwork: [{ src: "icons/icon-512.png", sizes: "512x512" }]` の 1 枚。曲のアート（`js/audio-art.js` が抽出済み）は使っていません。OS は必要な大きさを選ぶので、**複数サイズと曲のアート**が望ましい（[1](https://apurvkhare.com/articles/frontend/web-platform-apis/media-session/)、[3](https://progressivewebapps.com/capabilities/media-and-system/)）。
   → 192/512 の 2 枚＋「曲のアートがあれば 1 枚差し替え」。**受け入れ**：アートのある曲でロック画面に出る（実機）。

3. **待つ・詰まる・失敗するときの表示が無い**
   メディアプレイヤー側に読み込み中の表示・詰まりの説明・再試行がありません（`audio-keep.js` の番犬はバックグラウンド用）。UX 原則では「バッファ中は即スピナー、失敗は理由＋再試行」が基本（[3](https://www.fluxplays.live/blog/streaming-ui-ux-best-practices)、[1](https://adspyder.io/blog/ux-design-for-video-content/)）。
   → `waiting`/`stalled`/`error` で状態行に出す＋「⟳ もう一度」ボタン（`mediaClipFailed` の文言は既にある）。**受け入れ**：大きいファイルで待機が見え、失敗時に再試行で戻る。

4. **キューが「選ぶだけ」で、並べ替え・次に再生・外すが出来ない**
   いまのキューは一覧から選ぶだけ（プレイリスト側はドラッグ可）。Spotify などは「次に再生」「キューに追加」「キューから削除」が中核の操作です（[2](https://www.vidzflow.com/blog/mastering-video-player-controls-ux-best-practices) の「主要操作は 1 タップ」の考え方と同じ）。
   → 曲の長押し（既存の 🎶 ボタン流儀）に「次に再生／最後に回す／キューから外す」を足す。※キューは「一覧の写し」なので、外すは「今回の再生対象から外す」意味に限定するなど、**意味の設計**が要ります。

5. **「続きから」が見えない**
   位置は保存していますが、再開したときに「前回の 12:34 から（10 秒戻して）再開しました」のような一言がありません。巻き戻し秒の設定（`mediaResumeRewind`）があるので、**説明が無いと設定の意味が伝わらない**。

### P2：統合版の後でも間に合う（音楽体験の質）

6. **ギャップレス／クロスフェードが無い**（`grep` で該当なし）。アルバム通し・ライブ盤で無音が挟まります。クロスフェードは「勝手に曲を混ぜない」思想と衝突するので、**既定オフの設定**にするのが筋。
7. **音量の正規化（ラウドネス差）が無い**。曲ごとの音量差が大きいパックでは、曲送りのたびに音量を直すことになります（端末側の音量は触らず、要素の `volume` に係数をかける形なら既存の保存と衝突しません）。
8. **再生系のイコライザーが無い**。`js/fx.js` の BiquadFilter/Compressor は**ゲーム音**のための音響で、再生（`core.video`）には掛かっていません。ポッドキャスト／音楽用途で要るなら別枠の設計が要ります。
9. **複数の音声トラック・複数字幕の切替が限定的**。字幕はファイル指定＋同名の相乗りで、動画内の複数字幕・音声言語の切替は扱っていません（`<track>` 相当が無い）。
10. **「最近再生した」の一覧が無い**（キュー・プレイリスト・お気に入りはある）。ポッドキャスト的に使うなら欲しくなります。

### P3：「やらない」と決めて、理由を残す候補

11. **ストリーミング（HLS/DASH）・キャスト（Chromecast/AirPlay）・アカウント同期**。いずれも外部依存と通信を持ち込み、いまの「ローカル・オフライン・送信しない」方針と正面から衝突します。
    → **実装しない**なら、README か HANDOFF §1 に「なぜやらないか」を 3 行で書いておくと、後から「抜け」と誤解されません（受け子の要項でも「自動ダウンロードは行わない」と線を引いています）。

## 4. 参照した思想・原則（要点だけ）

- **段階的开示（progressive disclosure）**：主要操作（再生・音量・全画面）は常時、二次操作（速度・字幕・画質）はホバーやメニューへ。これは trk! の「表は少なく、❓謎設定に逃がす」と同型です（[1](https://adspyder.io/blog/ux-design-for-video-content/)）。
- **3 秒ルール**：操作で即出し、再生中は約 3 秒で引っ込める。trk! の `mediaWallChrome`（`full`/`bottom`/`always`/`none`）はこの思想の別解（自分で選べる）として説明できます（[3](https://www.fluxplays.live/blog/streaming-ui-ux-best-practices)）。
- **主要操作の取りこぼし禁止**：play/pause・音量・シーク・全画面・字幕・速度が「基礎の 6 つ」（[2](https://www.vidzflow.com/blog/mastering-video-player-controls-ux-best-practices)）。trk! は 6 つとも有り。
- **Media Session の作法**：metadata は「実際に再生していて音声フォーカスを持つ間」だけ出る／`playbackState` は要素のイベントから同期／`setPositionState` は離散的な変化（loadedmetadata・seeked・ratechange・play・pause）で呼ぶ・検証してから呼ぶ／**出来ないアクションは登録しない**・ページ内のボタンは常に残す（[1](https://apurvkhare.com/articles/frontend/web-platform-apis/media-session/)、[3](https://progressivewebapps.com/capabilities/media-and-system/)、[2](https://botbrowser.io/en/blog/media-session-api-controls-and-user-intent/)）。
  → trk! は `try { setActionHandler } catch` で包んでおり good。`setPositionState` も `renderMedia()` 経由で離散イベント時に呼んでおり good。**残る穴は playbackState と artwork**（上の P1-1・P1-2）。
- **PiP と位置の同期**：`setPositionState` を更新しないと PiP の進捗バーがずれる（[5](https://developer.chrome.com/blog/automatic-picture-in-picture-initiated-by-the-browser)）。trk! は更新しているので good。
- **失敗の扱い**：理由の分かる文と再試行。無期限のローディングは禁止（[3](https://www.fluxplays.live/blog/streaming-ui-ux-best-practices)）。→ P1-3。

## 5. 出荷前チェックリスト（実機で見る）

- [ ] ロック画面：曲名・アーティスト・アート（複数サイズ）・ボタンのアイコンが実状態と一致
- [ ] ハードキー（Bluetooth の再生／前後）で、メディアプレイヤーとゲーム中の両方が動く
- [ ] 大容量ファイル：待機表示 → 再試行 → 復帰
- [ ] 画中画：抜けても進捗が合う・閉じても音が続く（`mediaPipKeep`）
- [ ] iOS のホーム画面アプリで、バックグラウンド音声とロック画面操作（過去に不具合が多い領域）
- [ ] 睡眠タイマー（曲末・章末・フェード）が、画面ロック中でも効く
- [ ] 字幕（.srt/.vtt）の位置・大きさ・遅延が、全画面とPiPで崩れない
- [ ] 4 言語で主要な文言が欠けない（`npm run check:a11y`・i18n の 4 言語検査）

## 6. 決めてほしいこと（次に進む前に）

1. **P1 の 5 件を、安定版の前に入れますか？**（見積り：MediaSession 2 件は小・待機表示は小・キュー操作は中・続きからの一言は小）
2. **キュー編集の意味**：Spotify 型（次に再生・キューに追加）まで行くか、trk! 型（プレイリストへ入れる）に留めるか。
3. **ギャップレス／クロスフェード**を入れるか（入れるなら既定オフ）。
4. **やらないことの明文化**：ストリーミング・キャスト・アカウント同期を README／HANDOFF に「やらない理由」として書いてよいか。

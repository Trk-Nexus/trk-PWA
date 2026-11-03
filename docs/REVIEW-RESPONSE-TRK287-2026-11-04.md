# trk287 ⌨ ターミナル・CLI 設定のレビューへの返事（trk288・2026-11-04）

レビュー本文（`trk-Nexus-review-trk287-cli-2026-11-04.zip` の `01-レビュー-trk287-CLI.md`）に、§番号で返します。
**この節だけ読めば、何が直り、何が直っていないかが分かります。**

- 版：`trk288`（`index.html` の `trk-build`・`sw.js` の cache `trk-v2026.11.04-trk288`）
- 検査：`npm run check` **1746 pass / 0 fail**（exit 0）。新しい見張りは `tests/trk288-review.test.mjs`（29 件）と `tests/trk288-boot.test.mjs`（3 件）。
- **この環境には実ブラウザーが無い**ため、レイアウトと実際の打鍵は**静的な見張りと vm の単体テスト**で確かめただけです。実機で見る項目は §7 にまとめました。

---

## 0. 最優先：起動時の例外（直した）

- **原因**（レビューの診断どおり）：`js/catch.js` の `Trk.modes` の一覧に `ROAD_IDS`・`ROAD_WEIGHTS` が入っていたが、これは `truck.js` の IIFE の中の `const` で、別ファイルからは見えない。代入の行ごと `ReferenceError` で落ち、`Trk.modes` が空になっていた。
- **直し**：道の定数は `truck.js` の中で `window.Trk.modes` に公開し、`catch.js` の一覧からは外した。
- **再発を止める見張り**：`tests/trk288-boot.test.mjs`。`Trk.modes = Object.assign(…, { … })` の一覧の名前が、同じファイルの宣言か `window` の名前で解決できるかを全ファイルで見る（`npm run check` に入る）。
- **まだ入れていないこと**：ブラウザーで `index.html` を開いて `pageerror` が 0 件であることの自動検査。`tools/smoke-browser.mjs` は既にあるが、Chrome が要るため `npm run check` には入れていない。Chrome のある環境で `SMOKE_CHROME=… node tools/smoke-browser.mjs --compare` を回す手順を次回に。

## 1. C1 端末の中のボタンがキーボードで押せない（直した）

- ✕・「唱える」・⚙ の部品（`button`・`summary`・`select`・`a`・`[role=button]`）の上では、キーを奪わない（`CLI_CONTROL_SEL`）。Space は押す働き、Enter も押す働きに任せる。
- 文字を奪うのは、入力欄・端末の板そのもの・出力（ログ）のときだけ。

## 2. C2 低い画面で、入力欄が板の外へ切れる（直した）

- 入力の行・ボタン・案内は縮まない（`dialog.cliDialog>*{flex:none}`）。縮むのは出力（ログ）だけ（`flex:1 1 0; min-height:72px`）。
- 高さが 520px 以下の画面では、案内・バッジ・つまみを畳み、辞書の欄は 22vh まで（`@media (max-height:520px)`）。
- `visualViewport` の `resize`・`scroll` で、板の上限（`max-height`）と底（`bottom`）を見えている範囲に合わせる（`fitToViewport()`）。`applySheetSkin()` が `style` を消した直後にも当て直す。
- **見送った**：viewport の `interactive-widget=resizes-content`。ページ全体のレイアウトに効くため、この作業の範囲では入れない。
- **未確認**：iPhone・Android で実際にソフトウェアキーボードを出したときの見え方（§7）。

## 3. C3 呼び出しキーに、ブラウザーの予約を登録できる（直した）

- **判定を逆にした**：遊ぶキーとの重なりは**許す**（呼び出しは修飾キー付きなので、遊びと同時には起きない）。拒むのは **ブラウザー・OS が先に取るキー**だけ（`cliKeyReserved`）。
  - 文字：W・T・N・Q（閉じる・タブ・ウインドウ）、R（再読み込み）・L・F・P・S・H・J・D、そのほか E・G・O・U（検索・開く・ソース）
  - 数字 0〜9・テンキーの数字・`+ − =`（拡大縮小）・Tab・Escape・F1〜F12
- **既定は `Period`（Ctrl+.）**（§6 の 1）。`Backquote`（JIS では半角／全角で IME に取られる）は既定から外した。
- **Shift を覚える**（§6 の 4）：`settings.cliShift`。Shift を押して決めたときは Shift 付きで呼ぶ（Ctrl+Shift+K）。⚙ の表示は `Ctrl／⌘ + Shift + K`。

## 4. R1 `cast night` と `spell night` の食い違い（直した）

- `cast` の 1 語が辞書の名前なら、その呪文に広げて唱える（`spell` と同じ）。コマンドの名前は辞書より優先（`cast volume 30` は volume）。
- cast は従来どおり 12 件まで、cast の中の cast は不可。

## 5. R2〜R8

| 番号 | 内容 | 状態 |
|---|---|---|
| R2 | Ctrl+Z が効かない | **直した**。規定（`cliInsert=native`）は**ブラウザーに任せる**。ほかの処理が `preventDefault` した 1 文字だけ、bubble の段で端末が入れる（trk287 の p・: の落ちを防ぐ形を残す）。`cliInsert=exec` を選んだ人は `execCommand` で入れるので、Ctrl+Z の履歴に残る。⚙ に「文字の入れ方」の 2 択。 |
| R2 の注意 | | 途中の処理が `stopPropagation` した keydown の 1 文字は、bubble の見張りに届かない。現在の本文では、入力中にそういう処理は見つかっていない（`main.js` は端末が開いている間は戻る）。実機で確認する。 |
| R3 | iOS の自動修正・予測変換 | **未確認**（実機項目 §7）。 |
| R4 | Shift 付きの呼び出し | **直した**（§3 の Shift を覚える）。 |
| R5 | ⚙ の逃げ先が `auto`（core の既定は `keep`） | **直した**。`chooseCliSkin`・⚙ の初期値・変更時の逃げ先を `keep` に。 |
| R6 | locked のスキンを選んでいた場合 | **変更なし**。`locked` は選択肢から出さない、が仕様（`pickCliSkin`）。 |
| R7 | 音の二重の関門 | **直した**。⚙ の「エラーの音」の下に、**いまのスキン（アプリの skin）が音を出さないとき**だけ一言（`cliBellSkinOff`）。音は `beep()` と同じく、アプリのいまのスキンで決まる。 |
| R8 | cli.js 2,140 行の分け方 | **一部**。純粋な計算（`parseLine`・`execute`・`pickCliSkin`・`insertTextAt`・`spellDraftProblem` など）を **`js/cli-pure.js`** に分けた（`window.Trk.cliPure`）。板（`ensureBuilt`・開閉）と ⚙ の配線は `cli.js` に残した。**分割の 2 本目（板と ⚙）は次回**。 |

## 6. 判断してほしかった 6 件への答え（ユーザーの回答どおり）

| 問い | 答え | 反映 |
|---|---|---|
| 呼び出しキーの既定 | **Ctrl+.**（Period） | 既定を `Period` に。保存の無い人だけ変わる。案内文（4 言語）も Ctrl+. に |
| 重なりの扱い | **予約キーは拒む**（遊ぶキーとの重なりは許す） | `cliKeyReserved`。§3 |
| 元に戻す | **両方を設定にして、既定は規定の挿入** | `cliInsert`（native／exec）。§5 R2 |
| Ctrl+Shift+K | **登録できる** | `cliShift`。§3 |
| 辞書の名前（日本語） | **どの言語の文字でもよい**（英字だけの思い込みはやめる） | `SPELL_ID_RE`（`\p{L}\p{N}` と `-`・24 字）。保存・読み戻し・`spell add`・`del`・`spell <id>` のすべてで同じ鍵（NFKC・小文字） |
| cli.js の分割 | **今回やる**（一部。§5 R8） | `js/cli-pure.js` を新設 |

## 7. 実機で見てほしいこと（ヘッドレスでは見られない）

1. iPhone・Android でソフトウェアキーボードを出したとき、入力欄が板の中に残るか（C2。直す前と後の比較）。
2. iOS の英字キーボードで、自動修正・予測・ダブルスペースのピリオドが壊れないか（R3・R2 の bubble の見張り）。
3. **JIS の Windows・JIS の Mac で、既定の Ctrl+. が IME や他の操作に取られないか**（Q1 の確認）。
4. JIS と US で、Ctrl+Shift+K（Shift 付き）が期待どおり開閉するか。
5. Ctrl+Z：⚙ の「文字の入れ方」を「元に戻す」にしたときに、端末の入力欄で元に戻るか（R2）。
6. ⚙ で音を出さないスキンを選んだとき、「このスキンは音を出しません」が出るか（R7）。
7. VoiceOver・NVDA で、板の開閉と ✕・唱える・⚙ の選択がキーボードで押せるか（C1）。

## 8. 変えたファイル

- `js/cli-pure.js`（新規）：純粋な計算。辞書の名前の規則・予約キー・cast の広げ・挿入の道具。
- `js/cli.js`：純粋な部分を外へ。割り当ての予約・Shift・入力の入れ方（native／exec・bubble の見張り）・⚙ の注記・`fitToViewport`・4 言語の文言。
- `js/core.js`：`cliKey` の既定（Period）、`cliShift`、`cliInsert`、工場出荷の戻し。
- `js/truck.js`・`js/catch.js`：起動時の例外（§0）。
- `index.html`：`cli-pure.js` の読み込み（`cli.js` の前）、⚙ の入れ方の選択と音の注記。`trk-build` を trk288 に。
- `css/style.css`：低い画面と、入力欄を押し出さない配置（C2）。
- `sw.js`：cache を trk288 に。
- `tests/helpers/cli-src.mjs`（新規）：ターミナルの本文（cli-pure と cli をつないだもの）を読む。既存の文字列の見張りはこれを読む。
- `tests/trk288-boot.test.mjs`・`tests/trk288-review.test.mjs`（新規）。既存の trk267・trk283〜trk287 のテストは、**古い既定・古い形を固定していた箇所だけ**新しい形に合わせた（既定キー・重なりの拒否・入力の経路・Shift・辞書の名前の例）。

## 9. 返し方

- その場で：この文書の §番号（例：`6-3`）と、端末・OS・ブラウザー・拡大率・スキン名を添えて。
- GitHub：PR のコメントに §番号で。

# trk288 の確認へのお返事（trk289・2026-11-04）

レビュー（`trk-Nexus-review-trk288-2026-11-04.zip` の `01-確認-trk288.md`）に、番号どおりに返します。
**この節だけ読めば、何が直り、何が直っていないかが分かります。**

- 版：`trk289`（`index.html` の `trk-build`・`sw.js` の cache `trk-v2026.11.04-trk289`）。前の版は trk288。
- 検査：`npm run check` **1760 pass / 0 fail**（exit 0）。新しい見張りは `tests/trk289-review.test.mjs`（N1〜N3・R-b・R-c）。
- **確かめた範囲**：Chromium 131（npm の配布物から取得・ヘッドレス）で、次を実測した。
  - 起動時のページエラー 0 件。
  - N1：日本語の辞書の名前（「朝」）と「Ｎight」が、再読み込みの後も残る。
  - N2・N3：Ctrl+V・Ctrl+Shift+I は拒まれる。Alt+K を Ctrl に変えようとすると、Alt に戻って案内が出る。Ctrl+K では端末が開かない。
  - R-b：390×360（half・tall）・390×500・390×844・800×420 で、入力欄が板の中に残る。
- レビューの実測は Chromium 156 だった。こちらは Chromium 131 なので、細かな見た目の差は残りうる。
- **実機（iPhone・Android・JIS の IME・Firefox）は、この環境では確かめていません**（§7）。

---

## 必須

### N1 日本語の辞書の名前が、再読み込みで消える（直した）

- **原因**（診断どおり）：`js/core.js` の `cleanCliSpells` が古い規則（英数字だけ）のまま。読み込みで日本語の名前を捨て、次の保存で保存先からも消えた。
- **直し**：`core.js` に `CLI_SPELL_ID_RE`（`\p{L}\p{N}`・24 字）と `cliSpellKey`（NFKC・trim・小文字）を置き、読み込みでも同じ鍵に揃えた。`cli-pure.js` の `SPELL_ID_RE` と `spellIdKey` と同じ規則であることを、テストが両方の正規表現を見比べて確かめる。
- **確認**：実ブラウザーで `{"朝":"volume 50","night":"volume 25"}` を保存して再読み込み → 両方残った。

### N2 編集キーを呼び出しキーにできる（直した）

- **直し**（`cliKeyReserved(code, mod, shift)`）：
  - Ctrl（⌘）と組むと予約：**A・C・V・X・Z・Y**（Shift を足しても＝やり直し Ctrl+Shift+Z も）。
  - Ctrl＋Shift と組むと予約：**I・C・J**（開発者ツール）。
  - **Ctrl＋Shift＋K は登録できる**（前の判断どおり）。Ctrl＋K は予約（検索を残す、前の判断どおり）。
  - Alt と組むなら、これらは予約しない（ブラウザーの編集に当たらないため）。
- **確認**：Ctrl+V・Ctrl+Shift+I は「ブラウザーや OS が先に使うため登録できません」で拒まれる。Ctrl+Shift+K は登録できる（単体テストで確認。実ブラウザーの手順では待ち状態の残りで空表示になったが、判定の結果は単体で確かめた）。

### N3 修飾キーを後から変えて、予約のキーになる（直した）

- **直し**：`cliModSel` の change で、いまのキー（と Shift）を `cliKeyReserved(キー, 新しい修飾キー, Shift)` で見る。予約なら**選び直しを元に戻し**、案内を出す（4 言語の `cliModReserved`）。Ctrl+K を Ctrl に戻すことはできなくなった。
- **確認**：Alt＋K を登録 → Ctrl にしようとすると、欄は Alt に戻り、案内が出る。保存される修飾キーも Alt のまま。Ctrl+K で端末は開かない。

---

## 推奨

### R-a 既存の人の呼び出しキー（**未対応・判断待ち**）

- 事実：保存には毎回 `cliKey` が入るので、trk287 以前に設定を一度でも保存した人は、`Backquote` のまま残る。返事の「保存の無い人だけ変わる」は、実際には「新しい人だけ」に近い。JIS で Backquote が押せない問題は、既存の人には残る。
- 選択肢（ユーザーに聞く・§判断）：
  1. 一度だけ移行する：`cliKey === "Backquote"` かつ自分で割り当てた印が無ければ Period にし、トーストで知らせる。
  2. 移行はしない。⚙ に「Ctrl+` が押せないときは Ctrl+. に」の案内だけを出す。
- **いまは変えていません。**

### R-b 背の低い画面の出力の最小（直した）

- **原因**（2 つ）：
  1. 幅 560px 以下の `.cliLog` の最小（`clamp(96px,28vh,320px)`）が、高さ 520px 以下の規則より後ろで勝っていた。
  2. 「半分」（52dvh）の板は、見出し（約 84px）と入力の行（約 115px）が入らず、入力欄が板の外に出た（390×360 で 13px）。
- **直し**：`@media (max-height:520px)` の中で、出力の最小を 48px にし（560px 以下の規則より後ろに置く）、「半分」を 80dvh にした。tall・full は変えない。
- **確認**：390×360（half・tall）・390×500（half・tall）・390×844（half・tall）・800×420（half・tall）で、入力欄が板の中に残る。

### R-c 注記の版番号（直した）

- C1・C2 の注記にあった trk289・trk290 を trk288 に直した（この版の前段の内容）。今回の新しい修正の注記だけ trk289。

### R-d Firefox の Ctrl+Shift+K（**未対応・§7 に追加**）

- Firefox では Ctrl+Shift+K が Web コンソールに使われる。Ctrl+Shift+K を登録できる判断は変えていない。Firefox で実機確認する項目を §7 に足した。

### R-e ブラウザーの smoke を CI に入れる（**未対応・方針を確認したい**）

- 事実：`tools/smoke-browser.mjs` は既にあり（`SMOKE_CHROME`・`SMOKE_PUPPETEER` で動く）、`npm run check` には入れていない（ブラウザーが要るため）。CI（`.github/workflows/check.yml`）に入れるには、ワークフローの変更と、基準（`tests/fixtures/smoke-baseline.json`）の扱いを決める必要がある。
- 今回は CI は変えていない。方針を決めてから入れる（§判断）。

---

## 実機で見てほしいこと（§7 の更新）

1. iPhone・Android でソフトウェアキーボードを出したとき、入力欄が板の中に残るか（C2・R-b。390×360 の「半分」が直ったか）。
2. iOS の英字キーボードで、自動修正・予測・ダブルスペースのピリオドが壊れないか（R3・R2）。
3. JIS の Windows・Mac で、既定の Ctrl+. が IME や他の操作に取られないか。
4. **Firefox で、Ctrl+Shift+K が Web コンソールに取られないか**（R-d。登録は可能のまま）。
5. Ctrl+Z：⚙ の「文字の入れ方」を「元に戻す」にしたときに、端末の入力欄で元に戻るか（R2）。
6. VoiceOver・NVDA で、板の開閉と ✕・唱える・⚙ の選択がキーボードで押せるか（C1）。
7. 修飾キーを Alt にして Alt＋K を登録し、Ctrl に切り替えると、欄が Alt に戻って案内が出るか（N3）。

## 変えたファイル（trk289）

- `js/core.js`：辞書の名前の規則（`CLI_SPELL_ID_RE`・`cliSpellKey`・`cleanCliSpells`）（N1）。
- `js/cli-pure.js`：予約キーの判定を修飾キーごとに（`cliKeyReserved(code, mod, shift)`）（N2）。
- `js/cli.js`：修飾キーの変更で予約を見る・案内（N3）。C1・C2 の注記の版番号（R-c）。
- `css/style.css`：背の低い画面の出力の最小・「半分」の高さ（R-b）。C1・C2 の注記（R-c）。
- `index.html`・`sw.js`：版を trk289 に。`docs/HANDOFF.md`：cache の行。
- `tests/trk289-review.test.mjs`（新規）。`tests/trk287-cli-input.test.mjs`・`tests/trk288-review.test.mjs`：古い形を固定していた箇所を新しい仕様に合わせた。

## 判断してほしいこと（まとめ）

- **R-a**：既存の人の呼び出しキー（Backquote のまま）を、一度だけ Period に移行するか。
- **R-e**：CI に実ブラウザーの smoke を入れるか（ワークフローの変更と基準ファイルの扱いを含む）。

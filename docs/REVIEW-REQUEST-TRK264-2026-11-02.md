# 📝 レビューと実機確認のお願い（2026-11-02・trk264）

> **対象**：`Trk-Nexus/trk-PWA` の `main` = `52b61fc3279f784133b64eefed97e4a59c51e0fa`（PR **#59**）／版 **trk264**
> **対象範囲**：**trk264（Safari でも画中画）の 1 回分だけ**。trk263（閉じても画中画を残す）は**前提**として §1.3 に要点だけ置いています。
> **読み方**：コードを見てくれる人＝§1・付録A／実機で触ってくれる人＝§2／決めてくれる人＝§3・§4。
> **この文書の立ち位置**：**自動検査で確かめたこと**（§1.5）と、**まだ確かめていないこと**（§2）を分けて書いています。実機で見ていないものを「確認済み」とは書いていません。
> **注意**：この文書は配布 ZIP（`trk-standalone-2026-11-02-trk264.zip`）を作った**後に足した docs だけ**の追加です。**アプリのコードは ZIP と同一**（`52b61fc`）です。

---

## 0. 30秒でわかること

- **やったこと**：📌 画中画が **Safari でも使える**ようにしました。ブラウザーには API が 2 つあり、trk はこれまで**標準 API だけ**を見ていたため、Safari で「非対応」と出ていました。
- **決めたこと（3 つ）**：U1＝**標準を先に**試し、断られたら Safari の `webkitSetPresentationMode` へ／U2＝ホーム画面アプリでは**押せなくして理由**を出す／U3＝開けなかったときは**新しい言葉**（「非対応」と分ける）。
- **自動で確かめたこと**：`npm run check` **1429 pass / 0 fail**（1407 から +22）・`check-repo` **0/0**・`check-security` **64/0**・`check-a11y` **9/0**。さらに **jsdom でアプリの殻を起こし、画中画を 2 つの API の代役にして 7 場面 24 項目を実測 → すべて期待どおり・例外 0**（配布 ZIP を展開したものでも同じ）。
- **確かめていないこと**：**Safari の実機**（この作業環境に Safari も端末もありません）。特に **trk の `<video>` は 2px の見えない要素**なので、**Safari がこの形で小窓に入れるか**は実機でしか分かりません（§2-4・§1 の Q2）。
- **変えていない約束**：**`js/core.js` は触っていません**（設定を増やしていない＝localStorage のキーも増えていません）／外部へ通信しない／trk263 の動き（閉じても残す・音量を下げない・映像を隠す）は変えていません。

---

## 1. コードレビューしてほしいこと

見てほしい順です。「気にしてほしいこと」が、こちらで不安に思っている点です。
（行番号は `main`＝`52b61fc` の `js/media-player-mode.js`）

| # | 場所 | 何をしたか | 気にしてほしいこと |
| --- | --- | --- | --- |
| 1 | **`pipBackend()`**（L1051・純粋な計算） | 2 つの API から `"standard"` / `"webkit"` / `""` を決める。標準を先、`prefer`（前回通ったほう）を尊重 | **判定の順序が妥当か**。`standardEnabled !== false` と **`undefined` を「使える」と見る**のは、古い Safari で `pictureInPictureEnabled` が無い場合のため。緩すぎないか |
| 2 | **`pipHomeApp()`**（L984）＋`pipWebkitProbe()`（L992） | ホーム画面アプリを `navigator.standalone` **または** `display-mode: standalone` で見分け、`webkitSupportsPresentationMode("picture-in-picture")` が **false のときだけ**標準 API を切る | **名前と中身のずれ**（Q4）。PC のインストール済み PWA でも `display-mode: standalone` は真になる。いまは webkit の probe が `false` のときしか効かないので**実害は無い**が、iOS 判定（`/iP(hone\|ad\|od)/`・`maxTouchPoints`）を足すべきか |
| 3 | **`pipWebkitProbe()`**（L992） | `readyState >= 1` のときだけ聞く。**読み込み前の `false` は「分からない」（`undefined`）** として捨てる | この「分からない」を `pipBackend` が**使える扱い**にしている点（`webkitProbe !== false`）。押した瞬間に失敗する確率と、押せないままにする確率のどちらを取るか（**Q1**） |
| 4 | **`pipEnterWebkit()`**（L1095） | `webkitSetPresentationMode("picture-in-picture")` は **Promise を返さない**ので、**100ms × 12＝最大 1.2 秒**、`pipIsOn()` を見ながら待つ | **1.2 秒のポーリング**をどう見るか。`webkitpresentationmodechanged` 待ちにしたほうが素直か。待っている間、`togglePip()` が await で止まる（他の操作は止まらない） |
| 5 | **`enterPip()`**（L1109） | まず `pipBackend()` の答え。標準で失敗したら **同じ操作の中で** webkit へ。失敗は `console.warn`（`console.error` ではない） | **「あるのに断る」Safari を、失敗として騒がずに流す**判断。ユーザーには最後まで失敗したときだけトーストが出る（`mediaPipFailed`）。二重に小窓が出る事故はないか |
| 6 | **`exitPip()`／`closeMedia()`**（L1075・L1677） | 出るときは標準 → だめなら `webkitSetPresentationMode("inline")`。`closeMedia()` の「閉じる」側も同じ | **どちらで入ったかを覚えていない**（`pipIsOn()` の見え方で決める）。両方立っている状態は起きないはずだが、**取り違えると小窓が残る**。ここが一番壊れやすい |
| 7 | **`webkitpresentationmodechanged`**（L1804） | Safari の出入りを拾い、`pipActive` と映像の出し入れを合わせる | Safari の ✕ では `leavepictureinpicture` が来ないので**こちらが主経路**。`renderMedia()` まで呼ぶので 250ms 周期と二重にならないか |
| 8 | **文言 4 言語**（L38・L82・L124・L166） | `mediaPipHomeApp`／`mediaPipFailed` を追加、`mediaPipHint` を書き直し（「スマホは非対応」を削除） | 4 言語で**同じ意味**か。特に `mediaPipHint` の「ホーム画面のアプリでは使えないことがあります」が**断定しすぎ／曖昧すぎ**でないか |
| 9 | **`tests/trk264-pip-safari.test.mjs`**（19 個の `test()`＝22 件） | `pipBackend`／`pipRunning` の判断（vm で切り出し）＋配線の目印＋文言 4 言語 | **実装を写しただけのテスト**になっていないか。特に「読み込み前の `false` は捨てる」「覚えたほうが使えなければ戻る」の 2 件が**本当に効く**か |

### 1.1 レビューで特に見てほしい 1 点

**#6 の「どちらで入ったか」を覚えていない設計**です。
`pipIsOn()` は `document.pictureInPictureElement` と `webkitPresentationMode` の**両方**を見て「出ている」と判断し、出るときは「標準が立っていれば標準、そうでなければ webkit」の順で閉じます。
取り違えが起きると **小窓が閉じない／閉じすぎる**という、利用者に一番見える壊れ方をします。
`pipPrefer` を持っているのに**閉じる側では使っていない**ので、そこを揃えるべきか判断をもらえると助かります。

### 1.2 こちらから見てほしい 4 点（質問）

| # | 質問 | いまの答え | 代案 |
| --- | --- | --- | --- |
| **Q1** | `webkitProbe === undefined`（読み込み前）を「使える」と見てよいか | 見ている（押した瞬間に失敗したら `mediaPipFailed`） | 押せなくする（`=== true` を要求）。ただし Safari で**読み込み前に押せない**時間が延びる |
| **Q2** | **2px の `<video>` で Safari は小窓に入るか**（実測してほしい） | 未確認。Chrome では動いている | 入れない場合、**小窓の間だけ実寸にする**手当て（`position` を切る）を trk265 で |
| **Q3** | ホーム画面アプリで「押せない＋理由」でよいか（U2 の決定） | 押せない＋title | 押せて案内を出す／📌 を隠す |
| **Q4** | `pipHomeApp()` の判定を **iOS に限定**すべきか | していない（`standalone` だけ） | `/iP(hone\|ad\|od)/` か `maxTouchPoints > 1` を足す |

### 1.3 前提（trk263 の動き・変えていないこと）

- `mediaPipKeep`（既定オン）：✕／ESC でプレーヤーを閉じても小窓が残り、**再生も音量もそのまま**。**ゲーム開始・タイトル以外・設定オフ・小窓の ✕ では閉じる**。
- `mediaPipHideStage`（既定オン）：画中画の間はプレーヤー側の映像を隠し、**1 行の案内**（「ここにも表示」「画中画を終了」）を出す。
- 純粋な計算：`pipExitPlan`／`stageVisible`／`pipNoticeVisible`（trk263）＋`pipBackend`／`pipRunning`（trk264）。

### 1.5 数字の裏取り（こちらで実測したもの）

| 確かめたこと | 結果 |
| --- | --- |
| `npm run check` | ✅ **1429 pass / 0 fail**（trk263 の 1407 から **+22**） |
| `node tools/check-repo.mjs` | ✅ **0 failure / 0 warning** |
| `node tools/check-security.mjs` | ✅ **64 check / 0 warning** |
| `node tools/check-a11y.mjs` | ✅ **9 check / 0 warning** |
| 配布 ZIP | ✅ **327 ファイル・7,519,415 B・sha256 `817e1aebc2e148d129153cbe964fad0fabff8f7092bbda80176d03dc4925c465`** |
| 版の一致 | ✅ `index.html` の `trk-build=trk264`／`sw.js` の `CACHE="trk-v2026.11.02-trk264"`／`HANDOFF §1.5` がすべて同じ |
| 見張りの件数 | ✅ `tests/trk264-pip-safari.test.mjs` は **22 件**（ソース上の `test()` 19 個のうち 1 つが 4 言語のループ） |
| `core.js` の差分 | ✅ **0 行**（設定を増やしていない＝localStorage のキーは増えていない） |

---

## 2. 実機で確かめてほしいこと（記入式）

**この作業環境には Safari も端末もありません。** 下の表は「やった／見た」を書いて返してください（§5 の型にまとめてもらえれば、そのまま `HANDOFF §4` に写します）。

### 2-0 まず版

| # | 手順 | 期待 | 結果 |
| --- | --- | --- | --- |
| 0-1 | ⚙ 設定 → 🔄 アプリの更新 | 「いまの版：**trk264**」（違うときは一度オンラインで開き直す） | |

### 2-1 Mac の Safari（本命）

| # | 手順 | 期待 | 結果 |
| --- | --- | --- | --- |
| 1-1 | ▶ メディアプレーヤーを開き、動画の曲を選ぶ → 📌 | **小窓が出る**。ボタンが「📌 画中画を終了」に変わる | |
| 1-2 | そのままプレーヤー側を見る | **映像が隠れ、1 行の案内**（📌 画中画で表示中／ここにも表示／画中画を終了）が出る | |
| 1-3 | 「ここにも表示」 | プレーヤー側にも絵が出る（ボタンが「こちらの絵を隠す」に） | |
| 1-4 | プレーヤーを ✕（または ESC）で閉じる | **小窓が残り、動き続ける**（音もそのまま） | |
| 1-5 | 小窓の ✕ | **音が止まり**、次に開いたとき**映像が戻っている**（案内が消えている） | |
| 1-6 | 小窓を出したまま曲送り | **小窓の曲が変わる**（`video` 要素そのものを映すため） | |
| 1-7 | 小窓を出したままゲーム開始 | **小窓が閉じる**（ゲームの曲が小窓に出ない） | |

### 2-2 iPad／iPhone の Safari

| # | 手順 | 期待 | 結果 |
| --- | --- | --- | --- |
| 2-1 | Safari で開く → ▶ → 📌 | 小窓が出る（**2-1 の 1-1〜1-5 と同じ**） | |
| 2-2 | 小窓を出したままホームへ戻る | 小窓が残る（OS の仕様に従う） | |

### 2-3 ホーム画面のアプリ（U2 の確認）

| # | 手順 | 期待 | 結果 |
| --- | --- | --- | --- |
| 3-1 | ホーム画面に追加したアプリで開く → ▶ → **📌 を長押し**（または読み上げで確認） | **押せない**まま、理由が「**ホーム画面のアプリでは画中画を使えません（Safari で開くと使えます）**」 | |
| 3-2 | 同じ端末の **Safari** で開き直す | 📌 が押せる（＝アプリだけの制限だと分かる） | |

### 2-4 一番の懸念（trk の `<video>` は 2px の見えない要素）

| # | 手順 | 期待 | 結果 |
| --- | --- | --- | --- |
| 4-1 | Safari で 📌 を押した直後 | 小窓に**絵が出る**（真っ黒でない） | |
| 4-2 | 出ない／真っ黒だった場合 | **その旨を書いてください**（trk265 で「小窓の間だけ実寸」に直します） | |

### 2-5 退行していないか（Chrome／Edge・各 1 分）

| # | 手順 | 期待 | 結果 |
| --- | --- | --- | --- |
| 5-1 | Chrome で 📌 → プレーヤーを ✕ | 小窓が残り、映像が戻る（trk263 のまま） | |
| 5-2 | Chrome で小窓の ✕ | 音が止まり、映像が戻る（trk263 のまま） | |
| 5-3 | Chrome で小窓を出したままゲーム開始 | 小窓が閉じる（trk263 のまま） | |
| 5-4 | ⚙ → 🎬 動画キー → 📌 パネルの説明文 | 「スマホは非対応」ではなく、**iPhone／iPad の Safari も可**と読める文になっている | |

---

## 3. お願いしたいこと（3 つ）

1. **`TRK_PWA_REF` を 40 桁の `52b61fc3279f784133b64eefed97e4a59c51e0fa` に**（7 桁だと `actions/checkout` が枝名として探して失敗します）。trk264 のアプリ本体が入った commit です。次にこちらがコードを動かすのは**実機とレビューの結果が出てから**なので、それまで固定して大丈夫です。
2. **返事の置き場所は Drive の `trk-PWA-trk264-Safariの画中画-2026-11-02` の中だけ**にしてください（§5 の型で）。
3. **Q1〜Q4（§1.2）に答えてください。** 特に **Q2（2px の `<video>` で Safari が小窓に入るか）** は、実機で見ないと分かりません。ここが駄目なら trk265 で手当てを入れます。

---

## 4. 判定の線引き

**ここが崩れたら安定版に進めない**（先に直す）：

1. **Safari で 📌 が押せない**（対応しているのに「非対応」と出る）
2. **押しても小窓が出ない**（2px の `<video>` が原因の疑い＝Q2）
3. **小窓が閉じない／閉じすぎる**（§1.1 の取り違え）
4. **Chrome で trk263 の動きが壊れた**（2-5 が NG）

**記録だけでよい**：1.2 秒待ってから出る／Safari の小窓の大きさが好みでない（ブラウザー側の設定）／ホーム画面アプリで使えない（既知・ブラウザー側）。

---

## 5. 記入の型（そのまま返してください）

```
2026-11-02 / <端末・OS・ブラウザ> / trk264
0 版：OK（trk264）
1 Mac Safari：1-1 OK / 1-2 OK / 1-3 OK / 1-4 OK / 1-5 OK / 1-6 OK / 1-7 OK
2 iPad・iPhone Safari：2-1 OK / 2-2 OK
3 ホーム画面アプリ：3-1 OK（押せない＋理由） / 3-2 OK
4 2px video：4-1 OK（小窓に絵が出る）
5 退行（Chrome）：5-1 OK / 5-2 OK / 5-3 OK / 5-4 OK
Q1：<undefined を使える扱いでよい／=== true を要求> 
Q2：<小窓に絵が出る／出ない>
Q3：<押せない＋理由でよい／案内を出す／隠す>
Q4：<iOS に限定する／しない>
判定：安定版に進めてよい
```

---

## 6. 再現コマンド（こちらの `main` でそのまま）

```sh
npm run check                                 # 1429 pass / 0 fail
node tools/check-repo.mjs                     # 0 failure / 0 warning
node tools/check-security.mjs                 # 64 check / 0 warning
node tools/check-a11y.mjs                     # 9 check / 0 warning

# 新しく足した見張りだけ
node --test tests/trk264-pip-safari.test.mjs  # 22 pass
node --test tests/trk263-pip.test.mjs         # 15 pass（trk264 でも不変）
```

---

## 7. このレビューで見てほしい文書

| 文書 | 中身 |
| --- | --- |
| `docs/VIEWER-TRK264-2026-11-02.md` | 決定・作り・**jsdom の実測（7 場面 24 項目）**・実機で残る確認 |
| `docs/PLAN-TRK264-2026-11-02.md` | 洗い出し（§3 が決定表・U1〜U3） |
| `docs/VIEWER-TRK263-2026-11-02.md` | 前提の trk263（閉じても残す・映像を隠す） |

---

## 付録A コードの点検項目（チェック式）

### A-1 純粋な計算（ブラウザーなしで読める）

- [ ] `pipBackend({ standard:true })` → `"standard"`
- [ ] `pipBackend({ standard:false, webkit:true })` → `"webkit"`
- [ ] `pipBackend({ standard:true, standardEnabled:false, webkit:true })` → `"webkit"`
- [ ] `pipBackend({ webkit:true, webkitProbe:false })` → `""`（ホーム画面アプリ）
- [ ] `pipBackend({ webkit:true, webkitProbe:undefined })` → `"webkit"`（Q1 の判断）
- [ ] `pipBackend({ standard:true, webkit:true, prefer:"webkit" })` → `"webkit"`（覚えたほう）
- [ ] `pipBackend({ standard:true, webkit:true, webkitProbe:false, prefer:"webkit" })` → `"standard"`（戻る）
- [ ] `pipRunning({ webkitMode:"picture-in-picture" })` → `true`
- [ ] `pipRunning({ webkitMode:"inline" })` → `false`
- [ ] `pipExitPlan`／`stageVisible`／`pipNoticeVisible`（trk263）が **変わっていない**

### A-2 配線

- [ ] 押したとき：`togglePip()` → `enterPip()` → 標準 →（失敗）→ webkit
- [ ] 通ったほうを `pipPrefer` に覚える／次回はそこから
- [ ] 出るとき：標準 → だめなら webkit `inline`（`exitPip()` と `closeMedia()` の両方）
- [ ] Safari の出入り：`webkitpresentationmodechanged` で `pipActive` と映像を合わせる
- [ ] 押せないとき：`disabled` ＋ `title` に理由（ホーム画面アプリだけ言い方を変える）
- [ ] 開けなかったとき：`mediaPipFailed`（「非対応」と分ける）
- [ ] 4 言語 × 4 キー（`mediaPip`・`mediaPipHomeApp`・`mediaPipFailed`・`mediaPipHint`）
- [ ] `core.js` に差分が無い（設定を増やしていない）
- [ ] trk263 の見張り（`tests/trk263-pip.test.mjs` 15 件）が**そのまま通る**

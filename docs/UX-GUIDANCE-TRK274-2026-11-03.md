# 画面の手当ては Web 標準のガイドに合わせる（trk274・2026-11-03）

**元：** [`GoogleChrome/modern-web-guidance-src`](https://github.com/GoogleChrome/modern-web-guidance-src)
（main・`dbf45b904d8fbb2fe0d89afad4f6061f871db2a6`・2026-11-02 時点）。
**これは何：** trk-PWA の画面（UX）を足す・直すときに読む「物差し」の記録です。
trk274 の UX の 4 つ（U4-A）は、ここから採りました。
**これは何ではない：** 部品集でもライブラリでもありません。**写しは同梱しません・実行時に取りに行きません**
（このアプリは外へ通信しない・file: でも動く、が先にあります）。

---

## 0. 3 行まとめ

1. 読むのは各ガイドの **`guide.md`**（守るべきこと）と **`features/*.md`**（機能の説明）。
   `demo.html` は動く見本、`expectations.md` は確かめ方、`grader.ts` は機械採点です。
2. 採るのは **「今日のブラウザで効き、効かないブラウザでは黙って素通りする」もの**だけ。
   **素通りしない**（古いブラウザで崩れる・出っぱなしになる）ものは、JS で出し分けるか採りません。
3. 採らなかったものも**理由ごと残します**（同じ相談が来たときに、もう一度調べ直さないため）。

---

## 1. 読んだ版と範囲

| 項目 | 値 |
|---|---|
| 版 | main **`dbf45b9`**（2026-11-02・"cli: refine origin trial gate message for memory fallback (#3214)"） |
| 分類 | `features/` 17・`guides/` 20（`guides/<分類>/<名前>/guide.md` の形） |
| 読み方 | `guide.md` を読み、必要なときだけ `expectations.md`・`demo.html`・`negative-demo.html` を開く |
| 写し | **置かない**。`/tmp/mwg` は作業用の clone で、リポジトリには入れません |
| 実行時 | **読まない・取りに行かない**（この文書の表がすべて） |

### 1.1 読んだもの（と、どこに効いたか）

| 出どころ | 要点 | 採否 | trk274 での行き先 |
|---|---|---|---|
| `features/popover.md` | `popover` 属性でトップレイヤー。light-dismiss（外側タップ・`Esc`）が標準で付く。モーダルにしない | **採る**（G-1） | 📚 巻のパネル |
| `guides/ui-behaviors/light-dismiss-a-dialog/guide.md` | 閉じる操作は「外側」「`Esc`」「もう一度押す」。確認ダイアログを重ねない | **採る**（G-1） | 同上（`Esc` と外側タップで閉じる） |
| `guides/user-experience/content-first-noise-reduction/guide.md` | 固い帯（常時見える箱）を減らし、必要なときだけ出す。本文を押し下げない | **採る**（G-1） | 巻の一覧は**出したときだけ** |
| `guides/ui-behaviors/animate-element-entry-exit/guide.md` | 出る/消えるは `@starting-style`＋`transition-behavior: allow-discrete`（`display` を transition に含める） | **採る**（G-2） | 巻のカード・取り込み結果 |
| `guides/accessibility/accessible-error-announcement/guide.md` | `aria-live` で結果を読み上げる。入力の誤りは `:user-invalid` と `aria-invalid` を blur/input で同期 | **採る**（G-3） | 取り込み結果・ファイル選択の誤り |
| `guides/performance/defer-rendering-heavy-content/`（`content-visibility` の項） | 画面の外を描かない。`contain-intrinsic-size` で高さを確保してスクロールバーを暴れさせない | **採る**（G-4） | 348 枚のスキンの棚 |
| `guides/ui-behaviors/same-document-transitions/guide.md` | `document.startViewTransition` で画面の切り替えを撮って動かす | 採らない | §3-1 |
| `guides/ui-atoms/scrollability-affordance-hints/guide.md` | `container-type: scroll-state` で「まだ先がある」を帯で知らせる | 採らない | §3-2 |
| `features/interest-invokers.md` | `interestfor` でホバーの予告 | 採らない | §3-3 |
| `features/light-dark.md`・`guides/user-experience/preference-aware-ui/guide.md` | OS の明暗に合わせる | 採らない | §3-4 |
| `features/customizable-select.md` | 選択肢を自前の見た目にする | 採らない | §3-5 |
| `features/user-pseudos.md` | 入力の状態を CSS の擬似クラスで表す（`:user-invalid` など） | 一部だけ（`:user-invalid`） | G-3 |

---

## 2. 採る 4 つ（U4-A）

### G-1 `popover`（巻のパネル）

- **何を：** 📚「巻から選ぶ」を **モーダルにしない**。`<button popovertarget="…">` で開き、外側タップ・`Esc`・
  もう一度押すで閉じる（light-dismiss はブラウザが持ちます）。
- **古いブラウザでの素通り：** `popover` を知らないブラウザは属性を無視するので、**そのままだとパネルが出っぱなし**になります。
  → 起動時に `!("popover" in HTMLElement.prototype)` を見て、**パネルを `hidden` にする**。
  その場合も棚の `<select id="skinVol">` で巻を選べるので、**用は足ります**（パネルは上乗せ）。
- **守ること：** パネルの中に**確認ダイアログを重ねない**。開いたままスキンを着てもよい（見ながら選べる）。

### G-2 `@starting-style` ＋ `transition-behavior: allow-discrete`

- **何を：** 巻のカードと取り込み結果を「ふっと出す」。閉じるときも `display: none` までアニメーションする
  （`allow-discrete` が無いと `display` は切り替わりません）。
- **古いブラウザでの素通り：** アニメーションが付かず**即座に出る**だけ。崩れません。
- **守ること：** `prefers-reduced-motion: reduce` では 0 秒（既存の `css/style.css` の指定がそのまま効きます）。

### G-3 `aria-live` の結果読み上げ

- **何を：** 「16 枚を入れました／3 枚は同じ ID なので飛ばしました」を、**画面に出したのと同じ文**で読み上げる
  （`role="status"`＋`aria-live="polite"`・文は 1 回だけ差し替える）。
- **ファイル選択の誤り：** `:user-invalid` で見た目、`aria-invalid` で読み上げの両方を同期する。
  **入力のたびに鳴らさない**（`blur` と `change` のときだけ）。
- **古いブラウザでの素通り：** 読み上げが弱いだけ。**見た目は同じ**。

### G-4 `content-visibility: auto` ＋ `contain-intrinsic-size`

- **何を：** 棚のカード（最大 348 枚）のうち、**画面の外を描かない**。`contain-intrinsic-size` で 1 枚の高さを先に伝え、
  スクロールバーが飛ばないようにする。
- **古いブラウザでの素通り：** 全部描くだけ（いままでどおり）。
- **守ること：** **棚の一覧にだけ**当てる（`#skinGrid`）。設定のパネルや再生バーには当てない
  （フォーカスや読み上げの順番に触れないため）。

---

## 3. 採らない（理由と、もう一度考える条件）

| # | 技 | 出どころ | 採らない理由 | もう一度考える条件 |
|---|---|---|---|---|
| 1 | `startViewTransition` | `guides/ui-behaviors/same-document-transitions/guide.md` | スキンを当てると**画面全体の色が入れ替わる**ので、撮った絵が古い色のまま残る | 殻（設定画面）の中だけで切り替える案が出たとき |
| 2 | `container-type: scroll-state` | `guides/ui-atoms/scrollability-affordance-hints/guide.md` | まだ新しく、**隠したい帯が無い**（設定画面が主戦場） | 棚や一覧に「まだ下がある」帯を出すとき |
| 3 | `interestfor` | `features/interest-invokers.md` | 触れる端末が主。**ホバー前提の操作を増やさない** | PC 型の画面だけで予告を出す案が出たとき |
| 4 | `light-dark()` の全面採用 | `features/light-dark.md`・`guides/user-experience/preference-aware-ui/guide.md` | **色はスキンが決める**。OS の明暗よりスキンを優先する | スキンを着ていない画面（初回案内など）だけに使うとき |
| 5 | `customizable-select` | `features/customizable-select.md` | 設定の選択肢は**素の `<select>`** がキーボード・読み上げともに確実 | どうしても見た目を揃える必要が出たとき（代替の確認とセットで） |

---

## 4. これからの運用（画面を触るときの 4 手）

1. `guides/` の該当を **`guide.md` まで読む**（見出しだけ・demo だけにしない）。
2. **採る／採らないを §2・§3 に 1 行**足す（採らないときは理由と「もう一度考える条件」も）。
3. **効かないブラウザでの見え方**を 1 行書く（素通りか、出し分けが要るか）。
4. 画面のテストで**属性・CSS・文言**を固定する（`tests/trk274-*.test.mjs` のように）。
   「見た目がきれい」はテストにしません。**消えて困る 1 行**だけを守ります。

> 版を上げて読み直したときは、**§1 の sha を書き換えて**、変わった採否だけ §2・§3 に足します。

---

## 5. trk274 で触る場所（予定）

| 場所 | 何 |
|---|---|
| `index.html` | `<select id="skinVol">`（巻の絞り込み）・`<button popovertarget="skinVolPanel">`・`#skinVolPanel`・`#skinImportState`（`role="status"`） |
| `css/style.css` | `#skinVolPanel`（`popover`）・`@starting-style`・`#skinGrid > .skinCard` の `content-visibility` |
| `js/core.js` | `settings.skinShelfVol`（既定は定番＋Wizard だけ）・`popover` の有無でパネルを `hidden` |
| `tests/trk274-*.test.mjs` | 上記の 1 行ずつ（`popover` 属性・`@starting-style`・`aria-live`・`content-visibility`） |

---

## 6. 読むときの入り口（開発者の手元で）

```sh
git clone --depth 1 https://github.com/GoogleChrome/modern-web-guidance-src.git /tmp/mwg
sed -n 1,120p /tmp/mwg/guides/ui-behaviors/animate-element-entry-exit/guide.md
sed -n 1,120p /tmp/mwg/features/popover.md
```

**アプリには入れません。** 参照するのは開発のときだけです（§1 の「写し」）。

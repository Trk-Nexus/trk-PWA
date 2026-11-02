# 🔤 書体の組み合わせ14組（2026-11-01・trk246）

> **これは何**：trk-Avatar-Library 側が作ってくれた**書体の組み合わせ14組**（`catalog/typography.json`）を、
> このアプリで**見出し用の字から**受け取る形の記録です。方針の相談は [`PLAN-R6-PHASE4-TYPOGRAPHY-2026-11-01.md`](PLAN-R6-PHASE4-TYPOGRAPHY-2026-11-01.md) §3、
> 相手の文書は 返事12（`docs/2026-11-01-返事11への返事.md`）と 設計メモ（`docs/2026-11-01-書体の組み合わせとエディター設定.md`）。
> **状態**：段階②（`pair`＝見出し＋本文）までを実装。**実ブラウザ・実機での見え方は未確認**（この環境にブラウザが無い）。

---

## 1. 事実（相手の側にあるもの）

- 14組は相手の **`catalog/typography.json`**（version 1・base 16・scale 5段階・6役）に格納されている。
- 各組は `display`（題字）／`heading`（見出し）／`body`（本文）／`caption`（注記）／`numeral`（数字）／`accent`（差し色）の6役に
  `{pack, family, weight}` を持ち、`tracking`／`leading`／`sample`／`packs`（必要な書体パック）が付く。
- 実物は相手の `gallery/pairings.html`（はじめてセット r6 に同梱・外部参照0）にあり、`tools/check-typography.mjs` が検査する
  （**本文まわり3家族まで**・ライセンス・役のそろい・見本文の長さ）。
- **書体ファイル（woff2）は相手の `.stpack` パック側**にある（26.5 MB あるのでこのアプリには同梱しない）。
  Kosugi Maru だけは **Apache-2.0**（他は OFL-1.1）＝表記はパック側についてくる。

## 2. 実装した範囲（段階②まで）

| 場所 | 内容 |
| --- | --- |
| `js/typography.js` | **新規**。14組の目録の写し（`PAIRINGS`）＋ `sanitize()` ＋ `cssVars()` ＋ `apply()` ＋ `available()`。外部取得なし・オフラインで動く。 |
| `js/core.js` | `settings.typography`（**保存は `core.settings` の中だけ＝localStorage のキーは増やさない**）。`?reset=all` で `null`。`applySkin()` の `--font` を置いた**後**に `apply()`。 |
| `css/style.css` | `body.trk-typo-on` のときだけ `.brand h1`／`details.panel>summary`／`.panel h3` に `--trk-typo-display`、`.hint`／`.brand p` に `--trk-typo-body`。 |
| `index.html` | ⚙ → 🎨 見た目（`secDisplay`）に `<select id="typoPairing">` を1つ（既定は「使わない」）＋ `#typoState`（`role="status"`）。`js/data.js` の後・`js/core.js` の前に読む。 |
| `js/ui-prefs.js` | 選択肢を目録から1回だけ並べる・値を写す・選んだら `sanitize → apply → 保存`（開き直さない）。状態欄に「{name}：見出し {display}／本文 {body}」。 |
| `js/i18n.js` | 5キー（`typoLabel`／`typoOff`／`typoHint`／`typoState`／`typoMissing`）× **4言語**。 |
| `sw.js` | cache を **`trk-v2026.11.01-trk246`** に（JS を1つ増やしたので上げる）。 |

### 2.1 値の形（相手の §6 の契約の案のまま）

```js
settings.typography = {
  format: "trk-typography", version: 1,
  pairing: "shinbun",            // 14組の id
  preset: "pair",                // いま app が描き方に使うのは 2役
  base: 16, scale: "1.25",
  slots: { display:{family,weight,tracking,leading}, heading:{…}, body:{…}, caption:{…}, numeral:{…}, accent:{…} }
}
```

- **知らない値は捨てる**（`sanitize()`）：組名が分からない・`pairing` が文字列でない・ slots が壊れている → `null`＝「使わない」。
  `family` は `FAMILY_RE`（引用符・セミコロンを通さない）だけ通す。`weight` は 100〜900 の100刻み、`base` は 8〜40。
- **未知の項目はここから先へコピーしない**ので、相手が将来足した項目をこの版が読んでも「消えるだけ」で壊れない。
- `slots` を自分で上書きできる（相手の目録の1組から1役だけ差し替える使い道）。壊れた差し替えは目録の値へ戻る。
- 6役のうち `heading`／`caption`／`numeral`／`accent` は**保存はするがまだ描き方に使わない**（段階③ `roles` の受け口）。

### 2.2 CSS 変数2本に集約する理由

`font-family` は「無い書体名は黙って次の名前へ落ちる」ので、パック未導入の端末でも**文字化けもレイアウト崩れも起きない**
（`var(--font)`＝スキンの書体がそのまま出る）。だから `apply()` は `--trk-typo-display`／`--trk-typo-body` を**置くだけ**。
`trk-typo-on` クラスが無い端末には規則が当たらないので、**何も選んでいない人の見た目は1ピクセルも変わらない**。
`document.fonts.check()` で有無が見えるときは、状態欄に「この端末に書体パックが無いので、いつもの字で出ています」を足す（**判定できない環境では何も言わない**）。

## 3. 見送り（わざとやっていない）

- **`ctx.font`（canvas 内の20か所）は触らない**：スコア・判定文字・PERFECT などの大きさは実機で比較して決めたい。
  相手が出した「役 → 描画箇所」の対応（判定文字=`display`、曲名=`heading`、設定説明=`body`、キー表示=`caption`、スコア=`numeral`、PERFECT=`accent`）は §5 に置いておく。
- **スライダー群のエディター**（size・tracking・leading の調整）：相手の `gallery/pairings.html` の試作を**実機で見比べてから**。
- **`pack.json` の `skin.typography`**：相手が「書面で合意してから」と言っているので**今は読まない**（将来 `packRuntime` で拾う）。
- **woff2 の同梱**：26.5 MB。このアプリは**書体の名指しだけ**をして、実物は `.stpack` を持ち込む人に任せる。
- **14組の名前の翻訳**：目録の日本語をそのまま出す（意訳して相手の事実をずらさないため）。欄の名前・ヒント・状態は4言語。

## 4. テスト

`tests/trk246-typography.test.mjs`（**16件**）＝ 14組ぞろい・id 一意・本文まわり3家族まで・scale5段階／
sanitize（未選定・不明な組名・型違いは `null`／未知の項目を捨てる・範囲外は挟む・壊れた差し替えは目録へ戻る）／
CSS 変数2本（見出しは `display`→`heading`、本文は `body`→`caption`、無ければ空）／`apply` の張りと外し／
パック未導入でも文字列が壊れない／`core.settings` に入り専用キーを作らない／`applySkin` の後に当たる／
見出し類だけ・`font-size` を変えない／**canvas を触らない**／欄が1つ・読み込み順／4言語／cache 名。

`npm run check` は **1243 pass / 0 fail**、`check-repo` 0/0、`check:a11y` 8項目 0/0、`check-security` 64/0。

## 5. 実機で見てほしいこと（まだ未確認）

1. ⚙ → 🎨 見た目の「🔤 書体の組み合わせ」で **新聞の顔** を選ぶ → タイトル「trk!」と設定のパネルの見出し（🖥 画面と再生バー など）が**明朝の太字**に変わる。本文（曲リスト・再生バー）は変わらない。
2. **使わない** に戻すと、選ぶ前と**ピクセル単位で同じ**に見える。
3. 書体パック（`.stpack`）を入れていない端末では、選んでもいつもの字のまま・状態欄に「この端末に書体パックが無いので…」だけが出る（**崩れない**）。
4. スキン（🧺 棚）を切り替えても組み合わせが生きること（`applySkin` の後に `apply()` している）。切り替え直後に**設定を開き直さなくても**反映されること。
5. 言葉（🇯🇵／🇬🇧／🇨🇳／🇰🇷）を替えても欄名・ヒント・状態が4言語で出ること。
6. `?reset=all` で「使わない」に戻ること。

### 5.1 段階③以降にやること（ここには入れていない）

`ctx.font` への割り当て案（相手が設計メモ §5 に書いた対応）：判定文字＝`display`、曲名＝`heading`、設定説明＝`body`、
キー表示＝`caption`、スコア＝`numeral`、PERFECT＝`accent`。`js/catch.js`・`js/modes.js`・`js/spectrum.js` など **20か所**を
`Trk.core.fontFamily()` の読み替えにする形で、**文字の大きさの式は変えない**（見え方が変わる所は1か所ずつ実機で確認）。

## 6. 相手へ返すこと（返事13）

- 14組は **`pair`（2役）だけ**受け取って、見出し類に当てた（**woff2 は同梱しない**・名指しだけ）。**段階③（6役）は保存できる形にしてある**ので、`roles` を出すかどうかはそちらの都合に合わせる。
- 契約の案（`settings.typography` の形・`slots`・`scale`）は**相手の §6 のまま**で通った。`pack.json` の `skin.typography` は読んでいない（書面合意を待つ）。
- `check-typography.mjs` の「本文まわり3家族まで」は**こちらのテストでも同じ目盛り**で検査している（14組すべて3家族以内）。
- お願い：`gallery/pairings.html` の**縮刷版を1枚 Drive に置けるか**（実機で「このくらいの差」と見比べたい）。エディター試作の操作感は、実機が見えてから②③の続きを決める。

## 7. trk254（2026-11-02）：写しを「目録から生成」に切り替え

返事15 §2 に **trk-PWA の写しは自動では届きません（手取り直しをお願いします）** とあったので、手写しをやめました。

- **固定版**：`tests/fixtures/avatar-library-typography.json`＝相手の `catalog/typography.json` そのもの（34,194 B）。隣の `.meta.json` に `ref`（`7d7e5aec59…`）と `sha256`（`4301ac045b…`）
- **生成**：`node tools/sync-typography-catalog.mjs --from=../trk-Avatar-Library/catalog/typography.json --ref=<sha>`（または `--against=main`）。写しの形（`packs` から `font-packs/` を落とす・役ごとに `tracking`/`leading` を畳む）は trk246 のまま、**値はすべて目録から**
- **検査**：`tests/trk254-typography-copy.test.mjs`（固定版の sha256 がメタと合う／`PAIRINGS` ＝ 目録から作ったもの／r9 の直しが載っている／`trkUse` が14組にあり1〜34字／cache 名）。`npm run check` **1285 pass / 0 fail**
- **進んだかどうかの照合**（通信が必要なので CI か手元）：`node tools/sync-typography-catalog.mjs --against=main --check` → ズレがあえば exit 1 と changed の組一覧
- **r9 で入った中身**：雑誌の飾り=**見出し TrkHinaMincho 400**（注記は本文と同じ TrkShipporiMincho に寄せて家族数は3のまま）／電子ゲーム=注記 TrkZenKaku・見本文「こうげきは はやめに。ひかりの つぶを よけて。」／古道具と活字・しずかな読み物=「余白の書体」→「古い活字風のアンティーク体」／14組に `trkUse`（**UI にはまだ出しません**）
- trk253 でこちらが変えた「雑誌の飾り」の説明は、**先方がデータ側を説明に合わせた**ので目録どおりに戻しました（二者が1点でそろった）


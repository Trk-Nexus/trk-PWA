# 💾 容量の見える化と「まとめて消す」（trk234・2026-11-01）

> **対象**：trk-PWA（アプリ側）。開発案は [`LIBRARY-UX-PLAN-2026-11-01.md`](LIBRARY-UX-PLAN-2026-11-01.md) §5（F6）。
> **状態**：実装・テスト済み（`tests/trk234-pack-storage.test.mjs` 25 件・`npm run check` 1053 pass / 0 fail）。
> **未確認**：実ブラウザ・実端末での見え方（バーの伸び方・チェックの押し心地・確認ダイアログの文面）。この作業環境にブラウザがありません。

---

## 1. なぜ要るか

trk233 で書体パック **14 種（26.5 MB）** を作りました。書体パックは 1 本 0.4〜3.9 MB で、
**「いま何 MB 使っているのか」「どれが重いのか」「まとめて消すには」** が分からないと、
容量の不安からパックを入れづらくなります。これまでは 1 件ずつ「🗑 削除」を押し、確認も 1 回ずつ出ていました。

trk234 は、**見える化（合計・上限・端末の空き・重い順）** と **まとめて消す（選択 → 1 回の確認）** を足します。

---

## 2. 何を足したか

| 場所 | できること |
| --- | --- |
| 設定 → 📦 カスタムパック（一覧の上） | **💾 保存 {n}個・合計 {size}（上限 {cap}）** ／ 上限に対する割合（%）／ バー ／ **端末の空き 約{free}** ／ **大きいもの: 名前 2.9 MB / …**（重い順 3 件）／ **使っていないもの {n}個・{size}** |
| 同じ場所（選択） | 各パックの左にチェック。**☑ 全部選ぶ** ／ **☑ 使っていないものを選ぶ** ／ **☐ 選択を解除** ／ **🗑 選んだ {n}個を消す（{size}）**＋「{n}個を選んでいます（{size}）」 |
| 目録の一覧（📚 目録から入れる） | 概要に **目録の合計 {size}** ／ 導入済みがあるときだけ **🧹 この目録のぶんを消す（{n}個・{size}）** |
| ❓ 謎設定 | **🧨 パックを全部消す**（確認 2 回。1 回目＝件数と合計、2 回目＝**DELETE と入力**） |

### 守ったこと

- **確認は 1 回**。まとめて消すときは「{n}個（{size}）を消します。元に戻せません。」を 1 回だけ出します。
  いま使っているパックが混ざっているときは、**先に外す**ことを文面に出します（`packDeleteSelectedConfirmActive`）。
- **曲リストへの合図（`packsChanged`）は 1 回だけ**。1 件ずつ `deletePackById` を呼ぶと、
  曲を含むパックの数だけ曲リストが作り直されて重くなるため、`deletePacksByIds` の中でまとめて 1 回にしています。
- **古い選択でも安全**。画面の選択（id の集合）は、消す直前に `packDeletePlan` で
  「実際にまだ入っているものだけ」に選び直します（別タブで消えていた等）。
- **数字は 1 か所で計算**。`packSizeText` / `packUsageInfo` / `packDeletePlan` は DOM を触らない純粋関数で、
  画面（`renderPackUsage`）も目録の一覧も同じ関数を通します。
- **外部へ取りに行かない**。端末の空きは `navigator.storage.estimate()`（ブラウザ内）だけ。取れない環境では何も出しません。
- **上限の数え方は trk232 のまま**（`packDB.usage()` が size の index のキーだけを読み、件数と食い違えば全件を数え直す）。
  表示のために Blob を復元することはありません。

---

## 3. 数え方（表示の根拠）

| 出すもの | 計算 |
| --- | --- |
| 合計 | 保存しているレコードの `size` の合計（古いレコードは `files[].size` から数え直す） |
| 上限 | `PACK_STORE_MAX`（1 GiB）。`storageLimitsIgnored()` が真のときは「上限なし」として % とバーを出さない |
| 割合 | `min(100, round(合計 / 上限 × 100))`。90% 以上はバーの色を変える |
| 端末の空き | `navigator.storage.estimate()` の `quota − usage`（取れたときだけ） |
| 使っていないもの | いま使っているパック（`packRuntime.id`）以外の件数と合計 |
| 重い順 | 大きい順に 3 件（同じ大きさは名前順） |

バイト数の表示は **1024 進**（`512 B` / `1.0 KB` / `26.5 MB` / `1.00 GB`）。
書体パック 14 種なら **26.5 MB**（27,765,040 B）と出ます。

---

## 4. 確かめたこと（この環境で）

- `node --test tests/trk234-pack-storage.test.mjs` → **25 pass / 0 fail**
  - 表示の計算（0 B・負の値・size→bytes→files の順・割合・上限なし・使っていない分・重い順・空の一覧）
  - 消す対象の選び直し（実在しない id・重複・使っているパックの検出）
  - `packsChanged` が 1 回だけ／先に外してから消す順序／確認文の出し分け／二重確認（`confirm` → `prompt` で `DELETE`）
  - 画面の入口（`#packUsage` ほか）・❓謎設定のボタン・目録の「まとめて消す」・**鍵が 4 言語そろっている**
  - `sw.js` の cache が `trk-v2026.11.01-trk234` になっている
- `npm run check` → **1053 pass / 0 fail**（trk233 の 1028 件＋今回 25 件）
- `node tools/check-repo.mjs` → 0 failure / 0 warning、`check-a11y` 8/8、`check-security` 64/64、`check-lite` 123 件

## 5. 未確認（実機で見てください）

1. バーの伸び方・90% 以上の色・「端末の空き」が実際に出るか（`estimate()` はブラウザごとに返し方が違います）
2. チェックの押し心地と、選択したときの枠の色（`.packCard.picked`）
3. `confirm` / `prompt` の文面が、スマホのブラウザで読みやすい長さか（「DELETE」の入力は日本語キーボードでも打てます）
4. **14 種を入れたときの実際の使用量**（`estimate()` の値と、こちらの合計がどれだけ近いか）
5. 目録が 16 行になったときの「🧹 この目録のぶんを消す（16個・26.5 MB）」の見え方

---

## 6. 触ったファイル

| ファイル | 変更 |
| --- | --- |
| `index.html` | `#packUsage`（合計・バー・空き・選択の操作）／`#catalogBulkActions`＋`#catalogRemoveAll`／`#packWipeBtn` |
| `js/custom.js` | `packSizeText`・`packRecordSize`・`packUsageInfo`・`packDeletePlan`（純粋関数）／`renderPackUsage`・`renderPackPick`・`pickPacks`／`deletePacksByIds`・`wipeAllPacks`／公開（`window.Trk.custom`） |
| `js/pack-catalog.js` | 目録の合計（`catalogTotalBytes`）／「この目録のぶんを消す」（`deletePacksByIds` を再利用）／言語を変えたら描き直す |
| `js/i18n.js` | 25＋4 の鍵 × 4 言語 |
| `css/style.css` | `.packUsage`・`.packUsageBar`・`.packPick`・`.packCard.picked` |
| `sw.js` | cache を `trk-v2026.11.01-trk234` へ |
| `tests/trk234-pack-storage.test.mjs` | 新規 25 件 |

## 7. 次の段

**trk235＝`.stlib`（目録＋パックを 1 ファイルにした「セット」）**。倉庫の `tools/build-set.mjs` と対なので、着手前に倉庫側と相談します。

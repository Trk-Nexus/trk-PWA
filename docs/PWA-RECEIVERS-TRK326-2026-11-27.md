# trk326：Avatar 倉庫の受け子（7 件）実装マイルストーン（2026-11-27）

- **受け取った案内**：`00-PWA宛て-統合ライブラリ受け渡し案内と受け子要項.md`（`Trk-Nexus/trk-Avatar-Library` `main` @ `3246524`）
- **正式仕様**：`01-2026-11-27-pwa-receiver-requirements.md`（同梱。倉庫内 `docs/2026-11-27-pwa-receiver-requirements.md`）
- **照合済みの基準版**：`trk325`（`e30eb2ce98490c94b7768dd2ddf768fab7fe726d`）
- **検査 CLI**：`TRK_PWA=/path/to/trk-PWA node tools/check-pwa-receivers.mjs`（倉庫側）

## 0. 受領時の状態（変更前）

| 項目 | 結果 |
| --- | --- |
| 稼働済み契約 `C-*` | **7/7 合格**（変更なしで維持する） |
| 要望受け子 `R-*` | **0/7 実装**（`requested-pending`） |
| 凍結 `r10` 配布物 | 触らない（SHA-256 を 1 バイトも変えない） |

## 1. 方針

1. **受け子は「検証 → 予告 → 本人の選択 → 保存」の順**。読み込んだだけで利用者の設定（書体・読書テーマ・ノーツ・題字）を上書きしない。
2. **データだけを受け取る**。受け取るのは JSON / ZIP の構造化データだけで、コード・CSS 文字列・URL は取り込まない（許可パターン方式）。
3. **純粋な道具と画面を分ける**。検証・変換は `js/library-receiver.js`（DOM も保存もしない）に置き、画面と保存は各担当ファイルが行う。テストは純粋な道具を直接動かす。
4. **段階ごとに検査 CLI の `R-*` が `implemented` へ自動で昇格**することを受け入れ条件にする。

## 2. マイルストーン

| # | 受け子 | 内容 | 触るファイル | 受け入れ条件 |
| --- | --- | --- | --- | --- |
| **M1** | `R-VOL-1`（高） | 巻別・単体スキン JSON（`trk-avatar-library-skins` v1）の実行時インポート。内蔵・カスタム 20 件枠とは**別の保存領域**（IndexedDB）へ。`readability: "intentional-low"` と 4 言語の理由を保持し、警告を出す。重複は**スキップ／上書き／キャンセル**を選ばせる | `js/library-receiver.js`（新規）、`js/custom.js`、`js/core.js`、`index.html`、`js/i18n.js` | 1 MiB 上限・14 色の許可パターン・合計 300 種。棚に「📚 取り込んだ巻」が出る。CLI の `R-VOL-1` が `implemented` |
| **M2** | `R-REM-1`（高）／`R-REM-2`（中） | ①作品ごとの題字書体の画面接続（`trkTitleFontWorks`）。全体設定が優先・未導入なら案内だけ・切替で即解除。②退避封筒 `trk-title-font-works-backup` v1 の**復元**受け子（`state: "invalid"` は拒否・プロトタイプ汚染よけ・Web Locks 直列化） | `js/title-font.js`、`js/remodern-ui.js`、`index.html`、`js/i18n.js` | 全体設定 > 作品連携の優先順位。壊れた封筒は書き戻さない。`R-REM-1`／`R-REM-2` が `implemented` |
| **M3** | `R-REM-3`（中）／`R-TYP-1`（中） | ①書斎（`study`）・基地（`base`）への作品配色は**領域ごとの独立オプトイン**（既定オフ）。②書体の組み合わせ単体 JSON（`trk-typography-pairing` v1）の受け子と、不足 `.stpack` の具体名案内 | `js/remodern-regions.js`、`js/remodern-ui.js`、`js/typography.js`、`js/ui-prefs.js`、`index.html` | 既定では書斎・基地の見た目を変えない。未導入パック名を `typoState` に列挙（自動取得なし）。`R-REM-3`／`R-TYP-1` が `implemented` |
| **M4** | `R-SKIN-1`（中）／`R-WIZ-1`（低） | ①`SKIN_HOLDBACK` の単一定義化（意図的低可読と調整待ちを区別）＋ `legacyColors`（旧配色トグル）の受け口。②Advance Wizard 設定・辞書の取り込み（禁止文字の厳格拒否）＋統合マニフェストの前方互換参照 | `tools/lib/skin-holdback.mjs`（新規）、`tools/import-skin-catalog.mjs`、`tools/check-skin-contrast.mjs`、`js/custom.js`（棚のトグル）、`js/cli.js`、`js/pack-catalog.js` | 保留リストの二重定義がない。`futureSlots` を知らない版でも落ちない。`R-SKIN-1`／`R-WIZ-1` が `implemented` |
| **M5** | 仕上げ | 4 言語の文言・テスト・受け入れ記録。`npm test`／`npm run check` を通す | `tests/*`、`js/i18n.js`、本書 | CLI で **7/7 implemented**、`check-pwa-receivers` が `ok: true` |

### 補遺（案内文 §4 と仕様書 §3 の差分）

案内文（`00-…`）と仕様書（`01-…`）では `R-REM-1`〜`R-REM-3` の割り当てが一部異なる。**検査 CLI の判定（`tools/check-pwa-receivers.mjs`）に合わせて仕様書の割り当てを正**とし、案内文が求める `re-modern` 作品の退避（`trk-re-modern-works-backup` v1）も M2 で併せて実装する（どちらも利用者のデータ保全のため）。

## 3. 進め方

1. M1 から順に実装し、各段で `node tools/run-tests.mjs` と `node tools/check-pwa-receivers.mjs` を実行する。
2. 凍結物（`release/first-set.json`・`catalog/*.json`・`skin-volumes/**`）には触らない。
3. 各段の終わりに、倉庫側の CLI が `implemented` に変わったことを記録する。

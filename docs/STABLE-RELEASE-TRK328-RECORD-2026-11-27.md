# trk328 を安定版 `/trk/` に公開した記録（2026-11-27）

上流 [`Trk-Nexus/trk`](https://github.com/Trk-Nexus/trk) の担当から届いた報告書
「trk328-公開完了報告とPWA側への依頼-2026-11-27.md」（Google Drive）を受けて、
こちら（`trk-PWA` 側）で**公開サイトの実測**と**記録の更新**を行ったものです。
作り方そのものは [統合版 trk を作る指示書](STABLE-RELEASE-INSTRUCTIONS-TRK328-2026-11-27.md)、
期待値の一覧は [TRK-STABLE-RUNBOOK-2026-11-02.md](TRK-STABLE-RUNBOOK-2026-11-02.md) にあります。

## 1. 出したもの（上流 `trk` 側の実績）

| 項目 | 結果 |
| --- | --- |
| 写し元 | `Trk-Nexus/trk-PWA` の `main` = **`ac36bd9`**（trk328。PR #116 のマージ後。増えたのは docs と README・HANDOFF・PWA.md の記述だけ） |
| 写した方法 | `node tools/make-stable.mjs --repo=<trk> --apply`（**`--prune` なし・`--cache=` なし**） |
| 写した件数 | 追跡ファイル **704** 件（追加 304・更新 56・同一 344）／住所の反転 **96 ファイル・529 語** |
| 版名 | `sw.js` の `CACHE = "trk-v2026.11.27-trk328"`、`index.html` の `trk-build = trk328`（一致） |
| 検査 | `npm run check` = **2069 pass / 0 fail**（終了コード 0）、`node tools/check-repo.mjs` = **0 failure / 0 warning** |
| PR・マージ | **`Trk-Nexus/trk` #103**（枝 `arena/ee8fc9ea-trk`）→ **2026-11-27 16:06:59Z に `--merge`**、マージコミット **`02d5fd3`** |
| 公開 | Deploy GitHub Pages（run **`46030828778`**）**success**、head `02d5fd3` |

## 2. 公開サイトの実測（こちら側で確認済み）

前の報告で「未確認」だった **HTTP で本当に出ているか**を、こちらから確かめました。

| 見たもの | 実測（2026-11-27） |
| --- | --- |
| `https://trk-nexus.github.io/trk/sw.js` | **`const CACHE = "trk-v2026.11.27-trk328";`**（実体 `trkPWA-trk-v2026.11.27-trk328@trk`）。trk326・trk327・trk328 の説明コメントも入っている |
| `https://trk-nexus.github.io/trk/index.html` | 画面が描画される（題 **「trk! — AGRG」**・`docs/og.png` を参照） |
| `gh api repos/Trk-Nexus/trk/actions/runs/46030828778` | `Deploy GitHub Pages` / `completed` / **`success`** / head `02d5fd3` |
| `gh api repos/Trk-Nexus/trk/commits/main` | `02d5fd344d…`（＝報告どおり） |

⇒ **公開は trk328 で成立しています。** 版の取り違え（古い殻が残る）は、`CACHE` が trk328 であることで否定できました。

## 3. 実機チェック（利用者さんの端末・**まだ未実施**）

`/trk/` を実機で開いて、下の表を埋めてください。**崩れていたら 1 回だけ開き直す**のが先です
（更新直後の 1 回目は、古い殻と新しい殻が混ざることがあります＝trk242 からの既知の挙動）。

| # | 見るところ | 期待 | 記録 |
| --- | --- | --- | --- |
| 1 | ⚙ →「🔄 アプリの更新」 | 「いまの版：…**trk328**」 | |
| 2 | 設定（スキン・音量・段など） | 前の版のまま残っている | |
| 3 | キャッシュの名前（開発者ツール不要） | 版表示が trk328 なら実体は `trkPWA-trk-v2026.11.27-trk328@trk` | |
| 4 | 更新直後の 1 回目 | 崩れたら**開き直すと直る** | |
| 5 | 機内モードで起動 | オフラインでも開く（殻の先読み） | |
| 6 | 曲を 1 つ再生 | 音が出る・シークできる | |
| 7 | ロック画面／コントロールセンター | 題・絵・⏯ の状態が合う（trk327） | |
| 8 | ⏭（次へ） | キューの次が消費される（trk327） | |
| 9 | 曲間のつなぎ（フェード・既定オフ） | オンにすると重なる／**iOS は効かない旨の 1 行が出る**（trk328） | |
| 10 | フェード中に巻き戻す | 音量が下がったままにならない（trk328 の M3） | |

## 4. まだ決めていないこと（報告書 §3 の B・C・D）

| 論点 | いまの状態 |
| --- | --- |
| A. 版名 | **決定済み**：`trk-v2026.11.27-trk328` のまま出した。上流の番号（1.2.0 など）に変えるなら `--cache=` と `index.html`・`tests/trk259-review.test.mjs` を**同時に**直す（実測で 1 件落ちる） |
| B. 取り込みの理由文の 4 言語化 | 次回（レビュー返事のまとめ） |
| C. 「全部消す」で取り込み前のスキンに戻す | 次回（保存の形を 1 つ増やすので単独の回） |
| D. 公開の確認を誰がするか | **運用を決めました**：HTTP の確認はこちら（`trk-PWA` 側）が `sw.js` の `CACHE` と `index.html` で行い、**実機は利用者さんの端末**で行う（§3 の表）。結果はこの文書と [`HANDOFF.md`](HANDOFF.md) §1.5 に残す |

## 5. 次の鏡を当てるときの注意（報告書 §4 を反映）

- 指示書の「枝 `trk-stable-2026-11-27` を作る」は**例**です。実際は作業セッションの枝（例 `arena/<id>-trk`）で構いません。
- 指示書の「写し元 `9b3169d`」のような**特定のハッシュは書かない**書き方に直しました（そのときの `trk-PWA` の `main` を写す）。
- 上流の `.github/workflows/pages.yml` は、公開物から `tests/`・`tools/`・`package.json`・`package-lock.json`・`capacitor.config.ts`・`CONTRIBUTING.md` を除く形です（**開発用のファイルが公開物に残るとワークフローが止まります**）。
- 鏡は `docs/` の中の住所も `trk-PWA` → `trk` に反転させます（過去の記録の住所も変わります＝意図どおり）。

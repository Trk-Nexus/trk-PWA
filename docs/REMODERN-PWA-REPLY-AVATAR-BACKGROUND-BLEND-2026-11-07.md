# PWA → Avatar：背景の混ぜ方（background-blend-mode）の追補への返事（2026-11-07）

## 受けた指摘
- 追補（`AVATAR-FOLLOWUP-PWA-TRK314-BACKGROUND-BLEND-2026-11-07.md`）：`background-color: rgb(150,150,150)` と `background-image: linear-gradient(rgb(180,180,180), rgb(180,180,180))` に `background-blend-mode: multiply` を付けると、実描画は約 `[106,106,106]`。黒文字との対比は約 3.88:1 で、4.5 に届かない。
- 修正前の PWA（`575cb07`）は、この例で黒文字を当てていた。候補は `[150,150,150]` と `[180,180,180]` だけで、混ぜ方を見ていなかった。

## 確認したこと（PWA 側）
- 数値を再現した。修正前は `titlePaint` が黒（`#000000`）を返すことを確認。
- 修正：`layerOptions` が `background-blend-mode` を見る。`normal` 以外（`multiply` など、`normal, multiply` のような並びを含む）が一つでもあれば判定しない（null）。空や未設定は `normal` とみなし、従来どおり判定する。
- 祖先の要素の混ぜ方も、判定の対象の層に含める（`effectiveBgs` は要素の連鎖を全部読むため）。どれか一つが `normal` 以外なら判定しない。
- テスト：`tests/trk314-remodern-title-gradient.test.mjs` 13 件（`multiply` は null、`normal` と未設定は判定する）。`npm run check` 1892 pass。
- アプリの CSS は `background-blend-mode` を使っていない（検索して確認）。smoke の画面は影響を受けない。ただし、この回はブラウザ検証環境（`/tmp`）が消えていたため、ブラウザ smoke は再実行していない。

## まだ残る限界
- 判定の対象は、`normal` の重なり・停止点の色・半透明の一部に限る。混ぜ方（`multiply` など）の計算は実装しない。混ぜ方があれば当てない。
- 近似（刻みの間の極値は保証しない）。画像・未知の背景・動画・canvas は判定しない。
- 実機・他ブラウザ・支援技術は未検証。

## 依頼者への扱い
- フォント（手順 4）は、Avatar 側の完成案が出てから検証する。完成案ごとに「こちらが乗せる」か「実装する」かを決める方針（依頼者の判断）に従う。
- merge は依頼者の判断後にする。

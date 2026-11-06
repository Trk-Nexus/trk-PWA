# PWA → Avatar-Library：開発用の切り替えの置き場所について（2026-11-07）

Avatar 側のみなさま。trk-PWA（trk309）からの質問です。

## 決まったこと（依頼者の判断）
- 登録簿に無い（未確認の）作品の色は、**既定で当てません**（題字・書斎・基地の外枠のすべて）。
- 将来、種類が増えたときに、「色を当てる／当てない」を切り替えられる**開発用の受け子**を用意しました（trk309）。
  - 判定は `R.mayPaint(status, devOn)`（`js/remodern-regions.js`）。既定は当てない。
  - 切り替えの保存先は `settings.remodernDevPaint`（既定 false）。
  - 今は画面に出していません。`window.TrkReModernDev.setUnverifiedPaint(true|false)` で入れます。
  - 対象は題字（実装済み）。書斎・基地の外枠は、判定だけ用意してあり、色の当て方は後の段階です。

## 質問
1. **切り替えを置く場所**はどこがよいですか。
   - (a) 設定画面の隠し項目（開発者向けの段）
   - (b) URL の指定（例：`?dev=remodern`）
   - (c) 手順書だけの操作（コンソールから `window.TrkReModernDev` を呼ぶ）
   - (d) その他
2. 切り替えが**入っているとき**、画面にそれを示す印を出すべきですか（例：題字の近くに「開発用」）。
3. Avatar 側の**検証の手順**で、この切り替えを使う場面はありますか（例：未確認の pixel-console の見た目の確認）。

## PWA 側の状態
- trk309 は `main` へ merge予定（PR #103 に含める）。`npm run check` 1866 件 pass。
- smoke：`tools/smoke/remodern-dev-paint-smoke.mjs`（4 OK / 0 NG、README §8）。

ご返事は、このファイルへの返信（`docs/` の別名）か、Drive の親フォルダーへの返信文書で構いません。

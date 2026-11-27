# Avatar 側へのお願い：1 行だけ（安定版 `/trk/` の公開）— 2026-11-27

上流 `Trk-Nexus/trk` の担当からの報告書「trk328-公開完了報告とPWA側への依頼」（§2 の (3)）にもとづくお願いです。
**変えるのは `HANDOFF.md` の 1 行だけ**で、コード・固定 ref・PINS は触りません。

## 1. 貼っていただきたい行（そのまま）

置き場所：`HANDOFF.md` **§7 変更履歴**の「2026-11-27 trk328 照合・固定 ref / PINS 更新・受け子 7/7 実装確認」の節の末尾（§2.5 に足す形でも可）。

```markdown
- **安定版 `/trk/` を trk328 で公開**（2026-11-27・上流 `Trk-Nexus/trk` PR #103・マージ `02d5fd3`・Deploy Pages run `46030828778` success・写した 704 ファイル）。公開サイトの `sw.js` の `CACHE` は `trk-v2026.11.27-trk328` を実測。**`TRK_PWA_REF` と `PINS` は動かしません**（照合の基準は開発版 `trk-PWA` の `d5de065…`（trk328）のままで、安定版は別物）。
```

## 2. 変えないでいただきたいもの

| 対象 | いまの値 | 扱い |
| --- | --- | --- |
| `.github/workflows/check.yml`・`release-set.yml` の `TRK_PWA_REF` | `d5de0656278e66e7ed7adb9be0147b2323e628ee`（trk328） | **そのまま**（`d5de065` → `ac36bd9` の間に `js/`・`css/`・`tools/`・`tests/`・`sw.js`・`index.html` の変更はありません＝確認済み） |
| `tools/check-re-modern-work-pack.mjs` の `PINS`（4 ファイル） | `ebb4dce…`／`6db59bc…`／`aa13b1f…`／`5e5b274…` | **そのまま** |
| `package.json` の版 | `2026.11.27-trk328` | **そのまま** |
| `docs/2026-11-27-pwa-receiver-requirements.md` の照合基準 | trk328（`d5de065…`） | **そのまま** |

理由：**照合の基準は開発版（`Trk-Nexus/trk-PWA`）**で、安定版 `/trk/` はそこから鏡で写した配布物だからです。安定版を基準にすると、鏡を当てるたびに照合が動いてしまいます。

## 3. こちらでの確認（2026-11-27・Avatar `main` = `0027628`）

| 検査 | 結果 |
| --- | --- |
| `node tools/check-pwa-receivers.mjs --trk=<trk328>` | 稼働契約 **7/7**・受け子 **7/7 implemented** |
| `TRK_PWA=<trk328> node tools/check-pwa-skin-compat.mjs` | ✅ **238 種／13 巻**（既知の差し戻し 3 種 33 組） |
| `tests/re-modern-work-preflight.test.mjs`（`TRK_PWA_320` 併用） | **6 pass / 0 fail** |
| `PWA_REF` と `PINS` の突き合わせ | **4/4 一致** |
| `npm run check` | 合格 |

この 1 行は**記録だけ**なので、検査の結果は変わりません。

## 4. 補足（こちらの権限について）

こちらの作業環境から `Trk-Nexus/trk-Avatar-Library` へ push しようとすると
`remote: Permission to Trk-Nexus/trk-Avatar-Library.git denied`（403）で拒否されました。
そのため **PR を代行できていません**。上の行をコピーして 1 行足すか、いつもの手順で PR にしてください。

（`Trk-Nexus/trk-PWA` と `Trk-Nexus/trk` へは push できます。`trk` 側の鏡は、この経路で出しています。）

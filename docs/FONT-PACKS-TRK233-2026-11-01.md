# 書体パック 14 種（2026-11-01・trk-PWA から倉庫へ置くぶん）

> **これは何**：trk-PWA 側で作った **書体パック（`.stpack`）14 種**の記録です。
> 倉庫 [trk-Avatar-Library](https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk-Avatar-Library) に置いていただくためのもので、
> アプリ本体（このリポジトリ）には**入れていません**（26.5 MB あるため。配布は Drive／倉庫で行います）。
> **状態**：14 種すべて、倉庫の `tools/build-pack.mjs` で組み立て、`tools/verify-pack.mjs` の検査に合格。
> アプリの `sanitizeManifest` にも通して、書体と **`licenseFile`（ライセンス全文）が保たれる**ことを確認済み。
> **実ブラウザでの見え方は未確認**（この環境にブラウザが無い）。

---

## 1. なぜ作ったか

- 倉庫は trk232 のお願い（L1〜L9）にすべて応えてくれて、**書体パックの受け皿**（目録・`licenseFile`・`check-fonts`・見本）が整いました。
- アプリ側も **trk232 で書体が本当に効く**ようになり、**trk233 でライセンス全文が読める**ようになりました。
- 残るのは**中身（書体パック）の数**です。倉庫の主役である「手元に並べて、見て、選んで、持ち込む」を成立させるため、
  OFL-1.1 の書体を 14 種そろえて、そのまま倉庫に置ける形（フォルダ＋`.stpack`＋`SOURCE.json`＋`NOTICE.md`）にしました。

## 2. 14 種（大きさと指紋）

| パック | family | 太さ | 見た目 | ファイル | バイト | sha256 |
| --- | --- | --- | --- | --- | ---: | --- |
| 角ゴのしらゆき | `TrkZenKaku` | 400／700 | 白銀の夜・すっきりした角ゴ | `zen-kaku.stpack` | 1,969,655 | `b12dc221636c…` |
| まるゴのミルクティー | `TrkMPlusRounded` | 400／700 | ミルクティー色の丸ゴ | `m-plus-rounded.stpack` | 1,902,101 | `4bc6536e7059…` |
| 筆ペンの手紙 | `TrkKleeOne` | 400／600 | 和紙・鉛筆と筆の間 | `klee-one.stpack` | 3,929,934 | `68cca8094cf2…` |
| 筆ポップの夜祭 | `TrkYuseiMagic` | 400 | 提灯と屋台の暖色 | `yusei-magic.stpack` | 902,975 | `71ecd40d9057…` |
| まるぽっぷ いちご | `TrkHachiMaru` | 400 | いちごミルク | `hachi-maru-pop.stpack` | 1,973,189 | `c7992ad1ffc7…` |
| ドットの電子音 | `TrkDotGothic` | 400 | 走査線つきドット | `dotgothic.stpack` | 403,458 | `68fa7f0a5b4d…` |
| 墨と金の明朝 | `TrkShipporiMincho` | 400／700 | 墨と金 | `shippori-mincho.stpack` | 2,850,282 | `26dd978727dd…` |
| 古明朝の藍 | `TrkZenOldMincho` | 400／700 | 藍色の和室 | `zen-old-mincho.stpack` | 3,899,129 | `5269a4797cfc…` |
| 極太ポスター | `TrkDelaGothic` | 400 | 黒地に赤と黄 | `dela-gothic.stpack` | 951,499 | `8a183e3982c9…` |
| ラインのネオン | `TrkRampart` | 400 | 紫と水色の袋文字 | `rampart-one.stpack` | 1,577,304 | `9a865737c756…` |
| ロックの夜 | `TrkRocknRoll` | 400 | 焚き火の暖色 | `rocknroll-one.stpack` | 981,561 | `bb2a5765fc90…` |
| 看板のポップ | `TrkPottaOne` | 400 | 青緑に黄色 | `potta-one.stpack` | 2,020,608 | `137c00a2cdf4…` |
| 飾り明朝のラベンダー | `TrkKaiseiDecol` | 400／700 | 明るいラベンダー | `kaisei-decol.stpack` | 3,399,530 | `7e2db0319f8d…` |
| もちもちポップ | `TrkMochiyPop` | 400 | 夜紫に桃色 | `mochiy-pop.stpack` | 999,719 | `1431c09a4b10…` |

- 合計 **27,765,040 B（26.5 MB）**・20 ウェイト・全 14 パックに `fonts/OFL.txt`（ライセンス全文）。
- 各パックは `skin`（5色＋glow／scanlines／font／video）と `notes` を持つので、**入れて「使う」だけで見た目と本文の書体が変わり**ます。
- `release` はすべて `1.0.0`（目録の `version` と一致させています＝L8 の約束）。

## 3. 出どころ（すべて OFL-1.1）

| 書体 | npm（版を固定） | 上流 |
| --- | --- | --- |
| Zen Kaku Gothic New | `@fontsource/zen-kaku-gothic-new@5.3.1` | googlefonts/zen-kakugothic |
| M PLUS Rounded 1c | `@fontsource/m-plus-rounded-1c@5.3.0` | coz-m/MPLUS_FONTS |
| Klee One | `@fontsource/klee-one@5.3.1` | fontworks-fonts/Klee |
| Yusei Magic | `@fontsource/yusei-magic@5.3.0` | tanukifont/YuseiMagic |
| Hachi Maru Pop | `@fontsource/hachi-maru-pop@5.3.0` | noriokanisawa/HachiMaruPop |
| DotGothic16 | `@fontsource/dotgothic16@5.3.1` | lastrites-net/dotgothic |
| Shippori Mincho | `@fontsource/shippori-mincho@5.3.0` | fontdaso/shippori-mincho |
| Zen Old Mincho | `@fontsource/zen-old-mincho@5.3.1` | googlefonts/zen-oldmincho |
| Dela Gothic One | `@fontsource/dela-gothic-one@5.3.0` | artakana/delagothic |
| Rampart One | `@fontsource/rampart-one@5.3.1` | fontdaso/rampart-one |
| RocknRoll One | `@fontsource/rocknroll-one@5.3.1` | fontdaso/rocknroll-one |
| Potta One | `@fontsource/potta-one@5.3.0` | fontdaso/potta-one |
| Kaisei Decol | `@fontsource/kaisei-decol@5.3.1` | fontdaso/kaisei |
| Mochiy Pop One | `@fontsource/mochiy-pop-one@5.3.0` | fontdaso/mochiy-pop |

- 各パックの `SOURCE.json` に、**tarball の URL・中のパス・sha256・バイト数・上流**を書いてあります（`--fetch` で照合しながら取り直せます）。
- `NOTICE.md` に、家族名（`Trk…` は**このパックの中での名前**）・著作権・入手元・ライセンスを書いています。
- 書体そのものの名前は変えていません（OFL の「予約名」を避けるため、family は `Trk…` にしています）。

## 4. 倉庫への置き方（倉庫側の手順）

```
font-packs/
  zen-kaku/          ← このフォルダをそのまま置く（pack.json・SOURCE.json・NOTICE.md・fonts/）
  zen-kaku.stpack    ← 組み立て済み（tools/build-pack.mjs で --check が通ります）
  …
```

1. Drive の `font-packs-src.zip` を展開して、`font-packs/` に**フォルダごと**置く
2. `node tools/build-pack.mjs font-packs/<slug> --check`（フォルダと `.stpack` が合うか）
3. `node tools/build-catalog.mjs` → `node tools/check-contract.mjs`（`release` と `version` の一致も見てもらえます）
4. `node tools/check-docs.mjs`（README のパックの表を、`build-catalog` の出力に合わせて更新）
5. はじめてセットを作り直すなら `sets/first-set.json` に `"rev": "r3"` を書いて `node tools/build-set.mjs sets/first-set.json --release`

- `.stpack` は**こちらで組み立て済み**のものと**バイト単位で同じ**になります（trk-PWA の `js/zip-io.js` で無圧縮・決定的）。
  食い違う場合は `--fetch` を付けて作り直してください。

## 5. こちらで確かめたこと

| 検査 | 結果 |
| --- | --- |
| `tools/build-pack.mjs`（組み立て＋`verify-pack` の検査） | **14/14 合格**（`licenseFile` の実在・woff2 の署名・family・weight・`release`） |
| `tools/verify-pack.mjs` を単体で | **14/14 合格** |
| アプリの `sanitizeManifest`（trk233） | 14/14 で **`fonts[].licenseFile` が保たれ**、保存対象が `font`＋`license` になる |
| 大きさの上限 | 1書体 16 MB・全文 256 KB・パック 500 MB の内側（最大 3.9 MB） |
| 目録の形 | `packs[].fonts[].licenseFile` を持つ（trk233 の目録読み取りで落ちない） |

## 6. 未確認

- **実ブラウザ・実端末での見え方**（書体が当たるか、読みやすさ、太さの切り替わり）。この環境にブラウザがありません。
- 14 種を**同時に**入れたときの IndexedDB の使用量（合計 26.5 MB なので 1 GiB の上限には遠く、端末の空きにもよります）。
- 書体ごとの**ライセンス全文の表示**（trk233 の新機能）は、偽 DOM のテストのみ。実画面では未確認。

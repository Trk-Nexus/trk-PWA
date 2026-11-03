# Skin 側へ返す：4 ファイルの受け取りと、Wizard のスキン 12 種（trk269・2026-11-03）

宛先：trk-Avatar-Library（Skin 側）／差出：trk-PWA（本体）
受け取ったもの：`CLI-定番機能とWizardスキン案.md`・`check-cli-skin.mjs`・`catalog/skins.json`（253 種）・`HANDOFF.md`（いずれも 2026-11-03 の Drive）。

---

## 1. ひとこと

**4 ファイルとも読みました。そのまま本体に入れました。** Wizard のスキンは **CLI 対応の 12 種**を `js/skins-wizard.js` として取り込み、端末の定番コマンドも一通り入れています。

`TRK_PWA_REF` は **`6f60e234fca63cf47a2cba4bbcd954ee3850dacd`**（40 桁）に進めてください（trk269 のマージ）。

残り **12 種**（`wizard-hermetic` 〜 `wizard-cauldron`）は、**色を直してもらえれば、こちらは 1 コマンドで入ります**（§4）。理由は `muted` のコントラストです（§3）。

---

## 2. 取り込んだもの（そのまま動きます）

| 何を | どう入れたか |
|---|---|
| Wizard のスキン **12 種** | `tools/import-skin-catalog.mjs` で目録から生成 → `js/skins-wizard.js`（**手で直しません**） |
| `cli` の **5 つ**（§4-1） | `cursor`／`opacity`／`history`／`completion`／`bell` を本体で受け取ります |
| 定番コマンド（§1・§3） | `ls`／`cd`／`man` の別名＋`pwd`・`cat`・`grep`・`history`・`clear`・`echo`・`bell` |
| 自動切替のトリガー（§4-2） | `wizard`・`cli`・`console` のどれでも CLI 用として見分けます（trk268 から変更なし） |
| コントラスト基準（§4-3） | 4.5:1（本文）／3:1（エラー行）で見ています。**12 種はすべて合格** |
| 検査ツール（§4-4） | そちらの `check-cli-skin.mjs` を土台に **v2** へ（§5） |

入れた 12 種：`wizard-arcane`／`-cli`／`-console`／`-grep`／`-grimoire`／`-history`／`-man`／`-nord`／`-pipe`／`-sudo`／`-terminal`／`-tmux`。

---

## 3. 残り 12 種を入れられなかった理由（数字で）

**`muted`（うすい文字）と入力欄の比**が 4.5:1 に届いていません。**`cli` の有無とは別**の問題です（`cli` を持たない 12 種とちょうど一致しました）。

| スキン | `muted`／入力欄 | 参考：`text`／入力欄 |
|---|---|---|
| `wizard-cauldron` | 3.33 | 4.79 |
| `wizard-eldritch` | 2.53 | 7.86 |
| `wizard-rune` | 2.36 | 14.48 |
| `wizard-tarot` | 2.01 | 12.39 |
| `wizard-alchemy` | 1.90 | 5.93 |
| `wizard-seance` | 1.90 | 9.64 |
| `wizard-crystal` | 1.69 | 7.19 |
| `wizard-spell` | 1.62 | 13.29 |
| `wizard-ouija` | 1.38 | 15.96 |
| `wizard-necromancer` | 1.38 | 6.57 |
| `wizard-void` | 1.21 | **1.00**（`text` も未達） |
| `wizard-hermetic` | 1.01 | 3.19 |

**直し方**：`colors.muted` を `panel`／`field` に対して **4.5:1 以上**に（`wizard-void` は `text` も）。暗い背景なら `muted` を 2〜3 段明るくするだけで届きます。

---

## 4. 直してもらったあとの入れ方（こちらは 1 コマンド）

```
node tools/import-skin-catalog.mjs <目録.json> --cat=wizard --out=js/skins-wizard.js
```

- `--cli-only` を**外すだけ**で 24 種すべてが入ります（色が合格しているものが対象）。
- **同じ目録なら同じバイト列**になります。`--check` で「いまの生成物が目録どおりか」を見張れます。
- 届かない色（エラー色など）は、こちらの `fitInk` が**合格点まで寄せて**から入れます（例：`wizard-arcane` の `game.miss` は `#0c8fa1` になりました）。

---

## 5. 検査ツール `check-cli-skin.mjs` を v2 にしました（**終了コードの意味が変わります**）

そちらの版は**スキン 1 枚用**で、253 種の目録に当てると全件 NG になります（大半が `cat` に `wizard` を持たないため）。そこで目録も受けるように広げました。

| 変わったこと | 中身 |
|---|---|
| 目録を受ける | `{"skins":[…]}` を渡すと、**CLI を名乗るスキンだけ**を判定し、他は `notes` に回します |
| 道の文字を断る | `id`・`cli.font`・`cli.prompt` に `/` `\` `` ` `` `~` `:` `..` `C:` があったら NG |
| 5 つの操作感 | `cursor`／`opacity`／`history`／`completion`／`bell` も見ます |
| **終了コード** | **0＝受け取れる／1＝直すところがある（全部）／2＝読めない**。⚠ そちらの「1＝名なし」とは**意味が違います**。種類は `--json` の `reason`（`name`／`color`／`contrast`／`cli`）で分かります |
| 色の見方 | 目録が `muted`／`button`／`onAccent` を持っていれば**その色で測ります**（本体はそのまま使うため） |

**これは関門ではありません**。値が基準に届かなくてもこちらは受け取れます（助言の道具です）。

---

## 6. 目録の気づき（3 つ・できれば直してほしい）

| 件 | 数 | 中身 |
|---|---|---|
| `font` の**二重エスケープ** | **167 種** | `"font": "\\\"Courier New\\\", monospace"` のように `\"` が残っています。こちらは取り込み時に戻していますが、**他の読み手（カタログ画面など）では書体指定が壊れます** |
| 余計な鍵 `"cli.font"` | 3 種 | `wizard-grep`／`wizard-man`／`wizard-sudo`。`cli` の中に `font` を置いてください（点の入った鍵は読まれません） |
| `cli` の持ち主 | 24 種中 **12 種** | 上の 12 種には `cli` がありません。色を直すときに一緒に `cli`（書体・合図・カーソルの色・走査線）も付けてもらえると、端末らしさが出ます |

良いところ：`colors` の必須 5 つ（`bg`／`panel`／`text`／`accent`／`gold`）は **253 種すべて**にあり、id の重複も 0 でした。

---

## 7. `cli` に書ける値（v2・そのまま受け取ります）

| 鍵 | 受ける値 | 既定 |
|---|---|---|
| `font` | 書体名（120 字・記号不可） | OS の等幅 |
| `prompt` | 1〜4 文字 | `>` |
| `caret` | `#rgb`／`#rrggbb`／`currentColor` | 文字色 |
| `scan` | 0〜0.6 | 0 |
| `cursor` | `block`／`underline`／`bar` | ブラウザー任せ |
| `opacity` | 0.5〜1 | 1 |
| `history` | 10〜200 | 50 |
| `completion` | `tab`／`off` | `tab` |
| `bell` | `true`（false は書かない） | 鳴らさない |

`opacity` は**地だけ**に掛かるので、文字は薄くなりません。`cursor`（`caret-shape`）は未対応のブラウザーでは無視されます。

---

## 8. こちらの状態

- 版：`trk-build=trk269`／`CACHE="trk-v2026.11.03-trk269"`／`npm run check` **1524 pass / 0 fail**。
- スキンは **61 種**（本体 49＋ミク 4＋Wizard 12）。**65 種すべて**のコントラストが基準内。
- `/trk/`（安定版）に当てる版は**保留のまま**です（そちらの応答を見てから決めます）。

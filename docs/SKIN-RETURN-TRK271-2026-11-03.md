# 返事：trk271 — 届いた 3 ファイル（目録・生成物・検査の道具）を受けて（2026-11-03）

`Trk-Nexus/trk-PWA` 側の `TRK_PWA_REF`（この回の `main`）＝ **`8d17a1a938c53f1f19e9559ca626990d4ea0e22a`**

---

## 1. 届いた 3 ファイルの確認結果

Drive の `trk-PWA-trk269-端末の定番とWizardのスキン-2026-11-03` に **10:43** 付けで置いていただいた 3 本、確かに受け取りました。

| ファイル | 大きさ | こちらの判定 |
|---|---|---|
| `catalog-skins-trk269-2026-11-03.json` | 361,311 B | ✅ **`trk-Avatar-Library` の `main` の `catalog/skins.json` と同一**（sha256 `b0591370…8bbf48d6`）。253 種・wizard 24 種・`cli` は 12 種 |
| `js-skins-wizard-trk269-2026-11-03.js` | 26,480 B | ✅ 24 種。**値はこちらの取り込みと同じ**（`--check` で「目録どおり」）。形が `.js` なので、**そのまま読めるようにしました**（§4） |
| `check-cli-skin-trk269-v2.mjs` | 10,469 B | ✅ 動きました（24 種 checked / 24 passed）— ただし**見ていない行がある**ので、結果がこちらと違います（§2） |

**スキンの値は 1 つも変えていません**（trk270 で 24 種を入れてあるので、今回は「受け口」の回です）。

---

## 2. 先方 v2 とこちらの見立ての差（ここだけお願いしたいところ）

同じ目録に当てた結果：

| 道具 | 結果 |
|---|---|
| そちら `check-cli-skin.mjs` **v2**（`--catalog --json`） | **24 / 24 passed** |
| こちら `tools/check-cli-skin.mjs` **v3** | **17 OK ／ 7 NG（10 件）** |

差は**測っている行の数**です。

| 測る行 | そちら v2 | こちら v3 |
|---|---|---|
| `text` ／ `panel`・`field` | ○ | ○ |
| `muted` ／ `panel`・`field` | ○ | ○ |
| `text` ／ **`button`** | — | ○ |
| **`onAccent` ／ `accent`**（選択中のボタン） | — | ○ |
| **`accentInk` ／ `panel`**（ちょっとした文字） | — | ○ |
| **`game.miss` ／ `field`**（エラー行・**3:1**） | — | ○ |
| 必須の色 | `bg` `panel` `text` `muted` `field` `border` `accent` | `bg` `panel` `text` `accent` `gold`（足りないものだけ言う） |

そちらの v2 は**パネルと入力欄の上の文字**を見ています。こちらはそこに**ボタンの上の文字・選択中のボタン・ちょっとした文字・エラー行**を足しています（アプリの `buildCustomSkin` が実際に作る面と同じ数を測るため）。

### 2.1 生の目録で残っている 10 件

| スキン | 直すなら |
|---|---|
| `wizard-alchemy` | `text`／`button` 4.43:1（4.5 へ）・`miss`／`field` 2.51:1（3 へ） |
| `wizard-cauldron` | `text`／`button` 3.12:1・`accentInk`／`panel` 3.91:1・`miss` 2.13:1 |
| `wizard-hermetic` | `text`／`button` 2.39:1（明るいテーマ。地も明るいので `button` を暗く） |
| `wizard-necromancer` | `miss`／`field` 2.58:1 |
| `wizard-sudo` | `onAccent`／`accent` 3.94:1 |
| `wizard-tmux` | `onAccent`／`accent` 3.79:1 |
| `wizard-void` | `onAccent`／`accent` 1.21:1（`accent` がほぼ黒なので `onAccent` が沈む） |

**どれも「直さないと着られない」ものではありません。** こちらは取り込みのときに `fitAway`（**文字ではなく背景**を文字から遠ざける）で寄せているので、77 種すべて合格しています（`text` は 1 色も動かしていません・寄せた 14 件は trk270 の返し文書 §3）。
生の目録を直すかどうかは**そちらの判断**で大丈夫です。直していただければ、こちらの「寄せる」処理は**何もしなくなります**（同じ目録なら同じ生成物、は変わりません）。

---

## 3. こちらの道具（v3）の使い方

```
node tools/check-cli-skin.mjs <目録> [--json] [--catalog]
```

| 渡せる形 | 例 |
|---|---|
| ① スキン 1 枚 | `{ "id": "wizard-cli", … }` |
| ② パックの目録 | `{ "skin": { … } }`（`.stpack` の `pack.json`） |
| ③ 倉庫の目録 | `{ "format": …, "skins": [ … ] }` |
| ④ **生成物の `.js`**（v3 で追加） | `const SKINS_WIZARD = [ … ]; export { SKINS_WIZARD };` ← **そのまま渡せます** |

- `--catalog` を付けると「CLI を名乗るスキンだけ」を見ます（③④ は付けなくても自動でその扱い）。
- `--json` は `{ ok, reason, problems, notes, skins }`。`reason` は **`name` / `color` / `contrast` / `cli` / `ok`** の 1 語。
- **終了コードは 0（受け取れる）／1（直すところがある・全部）／2（読めない）**。そちらの v2 の「1＝名なし」とは**意味が違う**ままです（trk269 からお伝えしているとおり）。
- v3 からは **`import` しても使えます**（CI から呼ぶ用）：

```js
import { validateSkin, checkList, loadCatalog, reasonFromErrors } from "./tools/check-cli-skin.mjs";
const { list, shape } = loadCatalog("catalog/skins.json");   // .js でも同じ
const res = checkList(list, { fromCatalog: shape === "catalog" });
console.log(res.ok, res.reason, res.problems);
```

⚠ これは**助言の道具**です（関門ではありません）。通らなくてもこちらは受け取れます。

---

## 4. 生成物（`.js`）をそのまま受け取れるようにしました

trk271 で読み口を 1 か所にまとめました（`tools/lib/skin-catalog.mjs`）。

- **目録 JSON・スキン 1 枚・パック・生成物 `.js`** の 4 つを同じ「スキンの配列」にします。
- `.js` は **`vm` の中で評価**します（`require`・`fetch`・ネットワークは渡しません＝データとして読むだけ・2 秒で打ち切ります）。
- ESM の `export { … }` は落として読みます（`export const`・`export default`・`module.exports` も可）。
- 見分けは**拡張子ではなく中身**（`.json` という名前の `.js` でも読めます）。
- 取り込みは `.js` からでも **JSON と同じバイト列**になります（テストで固定）。

つまり次回からは、**そちらで回した生成物（`.js`）をそのまま置いていただければ、こちらで JSON に直す必要はありません**。

---

## 5. こちらの状態

| 項目 | 値 |
|---|---|
| `TRK_PWA_REF` | **`8d17a1a938c53f1f19e9559ca626990d4ea0e22a`** |
| 版 | `trk-build=trk271`／`CACHE="trk-v2026.11.03-trk271"` |
| スキン | **77 種**（本体 49 ＋ ミク 4 ＋ **Wizard 24**）。`cli` を名乗るのは **12 種** |
| 自動確認 | `npm run check` **1548 pass / 0 fail** |
| 本体（`js/*`）の変更 | **0 バイト**（今回の変更は道具とテストだけ） |
| 新しい保存キー | **0** |
| `/trk/`（安定版）に当てる版 | **保留**のまま |

---

## 6. こちらのお願い（次に送っていただくとき）

1. **形はそのままで大丈夫です**（目録 JSON でも生成物 `.js` でも受け取れます）。JSON に直す手間は要りません。
2. `cli` を持つのは 12 種のままです。**残り 12 種に付けるかはそちらの判断**で大丈夫です（付いた時点で、こちらは同じ目録を取り込み直すだけで全部に反映されます）。
3. §2.1 の 10 件は**任意**です。直していただければ寄せる処理が黙ります。
4. そちらの `check-cli-skin.mjs` を v3 の行にそろえるなら、**`button` の上の文字・`onAccent`/`accent`・`accentInk`/`panel`・`game.miss`/`field`（3:1）** の 4 行を足すと、こちらの結果と一致します（こちらは助言の道具なので、そろわなくても受け取れます）。

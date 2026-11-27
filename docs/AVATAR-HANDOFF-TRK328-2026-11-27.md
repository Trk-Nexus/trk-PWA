# trk-Avatar-Library 側へのお願い（trk-PWA trk328 に合わせる）

- 日付：2026-11-27
- 差出：trk-PWA（`Trk-Nexus/trk-PWA`）
- 宛先：trk-Avatar-Library（`Trk-Nexus/trk-Avatar-Library`）
- 根拠：外部レビュー「trk-PWA ＋ trk-Avatar-Library 統合・安定版（/trk/）に出せるかの品質チェック（2026-11-27）」の **M2**、および同 §3「統合で決めてほしいこと」
- こちらの返事：PWA 側は [`STABLE-REVIEW-TRK328-2026-11-27.md`](STABLE-REVIEW-TRK328-2026-11-27.md)（M1・M3 を実装、推奨の一部を実装、残りは次回）

---

## 1. 結論：お願いしたいことは 3 つ＋検査の再実行

| # | お願い | 直す場所 |
| --- | --- | --- |
| **A** | PWA の固定 ref を **`d5de0656278e66e7ed7adb9be0147b2323e628ee`**（trk328）へ上げてください | `.github/workflows/check.yml` と `.github/workflows/release-set.yml` の `TRK_PWA_REF` |
| **B** | 作品の事前確認の固定（`PWA_REF`）と **4 ファイルの SHA-256** をご更新ください | `tools/check-re-modern-work-pack.mjs` の `PWA_REF` と `PINS` |
| **C** | 受け渡し要項の「照合基準」を trk328 に（trk325 のままだと、要項のとおりに照合した相手と実物がずれます） | 要項（該当の節・版を書いている行） |
| **D** | 上げたあと、下の 4 つの検査を回して結果を共有してください（§6） | — |

**M1（PWA 側の不具合）は直しました。** これで `check-pwa-skin-compat` の「gold-chip: 不正な差し戻し ID」は出ません（§5）。

---

## 2. 上げていただく ref

```
TRK_PWA_REF: d5de0656278e66e7ed7adb9be0147b2323e628ee
```

- これは **trk328 のコミット**（`trk-PWA` の枝 → `main` にマージ済み／マージ後も同じ木）です。
- 40 桁で書いてください（短い SHA は枝名として探されるため。PWA 側の試験 `trk259` も同じ理由で 40 桁を要求しています）。
- `main` の先頭を使いたい場合は、**マージコミットではなくこの SHA** を指すほうが安全です（同じ内容でも、`main` は次の版で動きます）。

---

## 3. 4 ファイルの新しい SHA-256（`PINS` に入れる値）

`tools/check-re-modern-work-pack.mjs` が読む 4 ファイルです。**trk326 で 2 つが変わりました**（`remodern-regions.js`・`remodern-ui.js`）。

| ファイル | trk325（いま固定している値） | **trk328（新しい値）** | 変わった理由 |
| --- | --- | --- | --- |
| `js/remodern-regions.js` | `40a57a0d…` | **`ebb4dceb5f9a52b370687d36106ff1b6ae4dc96f71d91d62eb0888b5d8a21cd9`** | trk326（R-REM-3：書斎・基地の独立オプトイン） |
| `js/remodern-work.js` | `6db59bcb…` | `6db59bcb17b39bd6de1c84145ee2862ff69b17c77f560ae56172357435f4d86d`（**同じ**） | 変更なし |
| `js/remodern-ui.js` | `c910b1e4…` | **`aa13b1f3f00fd8c202955da6279222a7d12d213d922b980719609ba240158f6b`** | trk326（R-REM-1：作品の題字の書体も一緒に当てる） |
| `js/zip-io.js` | `5e5b274f…` | `5e5b274f8656d469fcc25e95f83a7379fa2c3f36a28e79bcbc83b20d34f2fcbf`（**同じ**） | 変更なし |

貼り付け用：

```js
export const PWA_REF='d5de0656278e66e7ed7adb9be0147b2323e628ee'; // trk328 (pinned files: remodern-regions.js/ui.js changed at trk326; remodern-work.js/zip-io.js unchanged since trk320)
const PINS={
 'remodern-regions.js':'ebb4dceb5f9a52b370687d36106ff1b6ae4dc96f71d91d62eb0888b5d8a21cd9',
 'remodern-work.js':'6db59bcb17b39bd6de1c84145ee2862ff69b17c77f560ae56172357435f4d86d',
 'remodern-ui.js':'aa13b1f3f00fd8c202955da6279222a7d12d213d922b980719609ba240158f6b',
 'zip-io.js':'5e5b274f8656d469fcc25e95f83a7379fa2c3f36a28e79bcbc83b20d34f2fcbf'
};
```

- コメントの「pinned files unchanged since trk320: 8531b4e2…」は **もう成り立ちません**（trk326 で 2 つ変わりました）。上の文に差し替えてください。
- 新しい固定値はこちらで `git cat-file` から計算した実値です（`sha256(js/<name>)`・改行は LF のまま）。

---

## 4. 受け渡し要項の「照合基準」

要項に trk325（`e30eb2c`）と書いてある箇所を、上の **`d5de0656278e66e7ed7adb9be0147b2323e628ee`（trk328）** に。
あわせて、要項の受け子の状態を次のように更新いただけると、次回の照合が 1 回で済みます。

| 受け子 | 状態 | 根拠 |
| --- | --- | --- |
| R-VOL-1（巻別スキンの取り込み） | implemented | trk326（変わりません） |
| R-REM-1／2／3 | implemented | trk326（変わりません） |
| R-TYP-1 | implemented | trk326（変わりません） |
| R-SKIN-1（差し戻しの単一定義） | implemented ＋ **生成物とのずれを修正** | trk328（§5） |
| R-WIZ-1 | implemented | trk326（変わりません） |

---

## 5. M1：PWA 側で直したこと（そちらの赤が消える理由）

**直したこと（`tools/import-skin-catalog.mjs`・1 行＋コメント）**

```diff
-  const hb = [...new Set(computed.concat(holdbackIds()))].sort();
+  const inFile = new Set(chosen.map(c => c.id));
+  const hb = [...new Set(computed.concat(holdbackIds().filter(id => inFile.has(id))))].sort();
```

trk326（R-SKIN-1）で `holdbackIds()`（`gold-chip`・`house-edge`・`orichalcum` の 3 種）を**出力ファイルごとに全部**足していたため、`gold-chip` の居ない wizard の生成物にも `SKIN_HOLDBACK = ["gold-chip", …]` が書かれていました。
→ そのファイルに居る ID だけを足す形にしました。**差し戻しの判断そのものは変えていません**（色の差で決まることに変わりなし）。

**こちらの検算（そちらの `catalog/skins.json`・sha256 `8f1e9fa7…` を使用）**

| 検査 | 直す前 | 直したあと |
| --- | --- | --- |
| `import-skin-catalog.mjs --cat=wizard --check`（`js/skins-wizard.js`） | ✗ 目録と違う | ✓ **62 種** |
| `import-skin-catalog.mjs --cat= --exclude-cat=wizard --only-new --volumes=… --check`（`js/skins-volumes.js`） | ✓ | ✓ **176 種・巻 13**（other 53 種と差 0） |
| `check-pwa-skin-compat`（`TRK_PWA=<trk-PWA>`） | ❌ gold-chip: 不正な差し戻し ID | ✅ **238 種／13 巻・既知の差し戻し 3 種・33 組** |

PWA 側の試験も足しました（`tests/trk328-stable-fixes.test.mjs`：居ない ID を書かない・そのファイルに居る分だけ書く）。

---

## 6. 上げたあとに回してほしい検査と期待値

```bash
# 1) そちらの通常検査
npm run check

# 2) 受け渡しの受け子（PWA の main 相当を指定）
node tools/check-pwa-receivers.mjs --trk=<trk-PWA のチェックアウト>

# 3) スキン互換（M1 の修正で緑になるはず）
TRK_PWA=<trk-PWA のチェックアウト> node tools/check-pwa-skin-compat.mjs

# 4) 作品の事前確認（新しい PINS で）
TRK_PWA=<trk-PWA のチェックアウト> node tools/check-re-modern-work-pack.mjs <作品.stpack>
```

| 検査 | 期待値（こちらで実測したもの） |
| --- | --- |
| `check-pwa-receivers` | **稼働契約 7/7・受け子 7/7 implemented**（trk327 の時点で確認済み。trk328 は受け子を変えていません） |
| `check-pwa-skin-compat` | **✅ 238 種／13 巻・既知の差し戻し 3 種・33 組** |
| `check-re-modern-work-pack` | 上の `PINS` で `PWA source mismatch` が出ないこと（作品の中身の判定結果は作品しだい） |
| `npm run check`（そちら） | 失敗 0 |

---

## 7. 版の呼び方

- PWA 側：`trk-build=trk328`／cache `trk-v2026.11.27-trk328`（`/trk/` に写すときも、`--cache=` を付けなければこの名前がそのまま入ります）。
- そちらの `package.json` の版は **`2026.11.27-trk328`** に上げていただけると、突き合わせが楽になります（前回 trk325 で上げていただいたのと同じ形）。

---

## 8. まだ渡していないもの・こちらで見送ったもの

| 項目 | 状態 |
| --- | --- |
| 取り込みの**理由文**の 4 言語化（いまは英語画面でも日本語） | **次回**（理由文 20 本を `key + 変数` に置き換える。話者確認も要るため、安定版の直前にまとめて変えない） |
| 「全部消す」で取り込み前のスキンに戻す | **次回**（取り込み前のスキンを覚える＝保存の形を 1 つ増やす。動きが変わるので単独の回で） |
| Avatar 39・40 の文書と trk321 の試験が PWA の `main` に無い件（レビュー §2） | こちらでは作れません（そちらの記録）。**必要なら同じ形で送ってください**（`docs/` に置きます） |
| iOS ではフェードが効かない件 | 説明文に明記しました（選択肢は隠していません） |

---

## 9. こちらの検算（参考）

- `npm run check`：**2069 pass / 0 fail**（trk328 の試験 8 件を含む）
- `node tools/check-repo.mjs`：**0 failure / 0 warning**
- 鏡（`tools/make-stable.mjs` の dry-run）：**703 ファイル・追加 303／更新 56／同一 344・反転 95 ファイル 517 語**（trk328 の時点）
- まだ実機では見ていません：ロック画面の絵、⏭ の消化、フェードで曲が重ならないこと、**フェード中の巻き戻しで音量が戻ること**（今回直した箇所）

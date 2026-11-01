# 📤📥 設定の書き出し・読み込みの導線（trk247・2026-11-01）

> **何をした**：[`PHASE4-ONBOARDING-BACKUP-2026-11-01.md`](PHASE4-ONBOARDING-BACKUP-2026-11-01.md) §3 の **③を実装**しました。Phase 4 の ①オリジン・②初回案内・④告知は**触っていません**（①④は利用者さんの判断、②は次の節）。
> 状態＝**コード・検査は通った／実ブラウザ未確認**。

---

## 1. 実装した3点

### ① 上限を 2 MiB → 20 MiB に緩めた

| | 前 | いま |
| --- | --- | --- |
| 設定1本の読み込み（`PREFS_IMPORT_MAX`） | **2 MiB** | **20 MiB** |
| まるごとバックアップが読む設定JSON（`js/backup.js` の `MAX_LS_VALUE`） | 20 MiB | 20 MiB（同じ） |

**実体は「書き出せない」ではなく「読み返せない」でした。** 書き出し（`exportPrefs`）には元々サイズ制限が無く、大きい `notes` を含む `all` でもファイルは出ています。それが 🛟 の読み込みだけ 2 MiB で縛られていたので、**自分の書き出しを自分が読み込めない**状態でした（`docs/HANDOFF.md` の trk162 の記録どおり、バックアップは 20 MiB まで読む設計）。

- 上限は**読む前**に見ます（`file.size` → `file.text()` の順）。順が逆だと「読んでから捨てる」ので、上限の意味が落ちます（アドオンの読み込みが 4MiB を `file.text()` の前に拒否するのと同じ型＝`docs/ADDONS.md` の制限の項。`tools/check-security.mjs` の規則が順序まで見ています）。
- `size` が読めない環境（0 や `NaN`）も**通しません**。
- 数字を i18n の文面に直書きせず `{mb}` で渡しています（次回また動くので）。

### ② 読み込みは「項目だけ」落とす（3層の隔離）

前は**1つの try** で囲んでいて、`notes` の sanitation などが throw すると外側の catch に落ちて「読み込み失敗」だけが出て**何も適用されませんでした**。

| 層 | 場所 | 何を守る |
| --- | --- | --- |
| 1 | `pickImportedPrefs(data, base, enumOk, skip)`（純関数） | 既知キーだけ・型が合うものだけ・列挙IDは許可リストを通ったものだけ。`enumOk` が例外を投げたら**そのキーだけ** `enum` で返す |
| 2 | `attempt(k, run)`（手書きの13項目） | 項目ごとに try/catch。throw なら `failed` として1件だけ報告し、次へ進む |
| 3 | generic な代入のループ | 代入自体が失敗したキーだけ `failed` |

**全体が失敗になるのは3つだけ**：上限超過（`prefImportTooBig`）／JSON として読めない（`prefImportNotObject`）／根元がオブジェクトで無い。あとは全部「**当たった項目は当たり、外れた項目は理由つきで外れた**」で返ります。

- 理由は `enum`（この端末に無いID）／`type`（型が違う）／`unknown`（この版が知らないキー）／`failed`（試したが出来なかった）で分けて出し、表示は `SKIP_WHY` → `prefSkipWhyId`／`prefSkipWhyType`／`prefSkipWhyUnknown`（既存キーをそのまま流用）。
- 報告は先頭12件まで＋`…+n`（長いと読めないため）。
- **見つけて塞いだ穴**：`trkFixedNotice` と `language` は「読み込める項目」の数え方に入っていましたが、**代入する場所が無くて毎度「未適用」に並ぶ**状態でした。両方 `attempt` で扱うようにしました（`language` は起動時と同じ `["ja","en","zh","ko"]` だけ通り、違う値は `enum` として報告）。
- **保存出来なかったとき**：読み込みは通っても `localStorage` が詰まる場合があります。`saveUserPrefs()` は true/false を返すようになり、書き込めたら `prefImportUnsaved`（適用しようとした項目名つき）を出して**再読み込みしません**（黙って元に戻すのがいちばん悪いので）。

### ③ 導線を ⚙ → 💾 端末の保存 に移した（🛟 は残す）

| 場所 | 中身 |
| --- | --- |
| ⚙ → 💾 端末の保存（`#storagePanel`） | **📤 設定をまとめて書き出す**／**🎨 ノートをのぞいて書き出す**（`kind:"core"`＝`settings` から `notes` を除く）／**🎨 ノートだけ書き出す**・**📥 設定ファイルを読み込む**（`#storageImportFile`）・結果は `#storageTransferState`（`role="status" aria-live="polite"`）に出る |
| 🛟 緊急復旧 | 入口はそのまま（`#emergencyExportNotesBtn`／`#emergencyExportAllBtn`／`#emergencyImportFile`）。🛟 側に「⚙ にも同じことができます」を1行（`emergencyTransferNote`） |

**入口は複製したが、手続きは1本**です（`runPrefsImport(file, setSt)`／`runPrefsExport(kind, setSt)`）。🛟 だけが壊れて ⚙ だけ動く、という形を避けるため。モバイルの設定パネルは `js/mobile-settings-panels.js` が `<details>` をノードごと移すので、**新しい欄も自動的に載ります**（実装者の側でモバイル用の作業は足していません）。

- 断り文（`storageTransferHint`）：保存は**このブラウザの中だけ**で、自動同期は無い、と4言語で言い切っています（独自同期を作らない方針の裏づけ）。
- 書き出しの報告は実際のファイルの KB 数と項目数を出します（`prefExportedAll`／`Core`／`Notes`）。読み込み上限も併記するので、**自分の書き出しが読み込める大きさか**がその場で分かります。
- 読み込みの口は既存の JSON 入力（`#recImportFile`・`#makerImportFile`・`#tvmImportFile`）と同じ `accept="application/json,.json"` にそろえました（ほかの形式を受け入口に混ぜていません）。
- **localStorage のキーは増やしていません**（`docs/MIGRATIONS.md` の行は不要。書き出し先の中身は既存の `core.settings` の写し）。

---

## 2. Phase 4 の ②（初回案内の2行）は今回やらなかった

下書きの 2 行（`welcomeOffline`／`welcomeBackup`）は **`index.html` の `#welcomeBox` に何も入れていません**。理由：

- 「どこで配る版か」（①オリジン）が未確定のあいだ、1枚目に**保存場所の話を書くと取り消せなくなる**（この文書 §1 の判断と同じ理由で、下書きの時点で保留になっていた）。
- 判断が要らない仕事（③）を先に片付ける、という段取りどおりです。

やる気になれば**1ファイル・2キー×4言語**で終わるサイズです（`docs/PHASE4-ONBOARDING-BACKUP-2026-11-01.md` §2 に文面案あり）。

## 3. ①ドメイン（組織「trk company」）の検討

**事実**（`api.github.com` を直接引いた結果・2026-11-01）：

- `orgs/trk-company`・`users/trk-company`・`orgs/trkcompany`・`users/trkcompany`・`orgs/trk-company-taiko` はいずれも **404（＝その名前は空いている見込み）**。
- GitHub は組織 Pages を `https://<org>.github.io/<repo>/` の形で配る。つまり組織 `trk-company` にこのリポジトリを移せば **`https://trk-company.github.io/trk-PWA/`** が狙える（想定）。

**推測・未確認**：組織の作成権限、無料枠で公開リポジトリの Pages が使えるか、Pages のビルド時間、組織のログイン名として他に何もぶつからないかは**まだ実測していません**（組織を作る操作は利用者さん側）。

**③との関係（重要）**：組織へ移すと**オリジンが変わる**ので、`localStorage`／`IndexedDB` は引き継がれません（同一オリジン前提の保存域が変わるため。`docs/PWA.md` §2.1 と同じ話）。移す前日に **📤 設定をまとめて書き出す**を実行して、新しい場所で **📥 読み込む**——という手順が効くようにしたのが今回の ③ です。

## 4. わざと手を入れなかった所（未決着）

- **`js/backup.js:465 restoreBackup`（🛟 のまるごと復元）は Import の検証関数を通していません**。別経路で独自の検査をしているので直撃はしていませんが、**項目隔離の考え方（②）はまだこちらの復元には入っていない**。ここを手入れると復元の仕様そのものに触るので、今回の commit では**変更前の挙動のまま**残しています。
- `trkFixedNotice`／`language` の「読み込めるのに適用されない」は今回塞ぎましたが、**同じ形の欠けが他にも無いかは網羅していません**（`PREFS_IMPORT_HANDLED` と手書き項目の対応をテストで13キーぶん固定し、**そこに無いキーは generic 経路に落ちる**作りで吸収しています）。

## 5. 実機で見てほしいこと（未確認リスト）

1. ⚙ → 💾 端末の保存 に「📤／📥」の欄が出て、**モバイル（📱 の設定パネル）にも同じ欄が載るか**
2. 大きめの `all`（ノートを作り込んだ状態）を書き出して**そのまま読み戻せる**こと（前は 2 MiB で弾かれていたはず）
3. 壊れたJSON（途中まで書いたファイル）を選んだとき「**読み込めませんでした**」の1行で、**設定が消えていない**こと
4. `notes` だけ型を壊したJSON（例：`{"notes":"xxx","uiScale":125}`）で、`uiScale` が当たり `notes` だけが**未適用の理由つき**で出ること
5. 適用後の再読み込み（900ms／未適用ありは2600ms）のあと、**案内が重複して出ない**こと
6. 🛟 側のボタンが引き続き動くこと（同じ手続きを共有しているので、片方が壊れたら両方が壊れている）

## 6. 検査側

- `tools/check-security.mjs`：`prefsImportCap` の規則を**新しい目盛り（20 MiB）と新しい実体**に合わせて更新。要求する文字列は「読む前に `file.size`」「`const attempt = (k, run) =>`」「`function pickImportedPrefs(`」「`reject(k, "failed")`」など。
- 同じ規則で見ていた「`__proto__` 選別」と「列挙IDの許可リスト」は、**純関数へ移ったので検査の文字列も移した**（強さは同じ：`SETTING_ENUM_KEYS` の一覧・`validImportedSettingEnum` の挙動テスト・呼び出しの結線まで見る）。
- 新規テスト：`tests/trk247-prefs-transfer.test.mjs`（18 テスト）。上限が2 MiB のままになっていないこと／バックアップと同じ目盛りであること／`pickImportedPrefs` を vm で実際に動かして部分適用を確認／`saveUserPrefs` が成否を返すこと／id 重複なし／4言語ぞろい。
- 既存テストの結線を3本直した（`tests/trk246-typography.test.mjs` の cache 名を正規表現に緩和、`tests/song-art-display.test.mjs` が書き出しの塊を見る場所、`tests/trk218-trk-list-visibility.test.mjs` の `trkListed` の形）。

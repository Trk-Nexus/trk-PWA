# 🔧 上流 `trk` に「置き場所の印」の掃除を当てる（2026-11-02・trk252 の続き）

> **状態**：この作業セッションからは **PR を作れません**（下欄の実測）。代わりに **当てる道具** `tools/backport-trk-scope-tag.mjs` を trk-PWA に入れました。上流を触れる人（利用者さん本人）は**コマンド4つ**で当てられますし、権限が通ればこちらで代行します。
> **急ぎではない理由**：trk-PWA 側は trk252 で自分のキャッシュ名を `trkPWA-` 始まりに変えて**すでに被害を受けない**ようになっています（上流が未修正のままでも、上流が版を上げても、うちのオフライン殻・3D vendor・📥共有の一時置き場は消えません）。残っているのは「上流が余計なものを探しに行く」構造的な危うさの除去です。

## 1. 何をする変更か

上流 `trk` の `sw.js` は activate 時に

```js
keys.filter(key => key.startsWith("trk-") && key !== CACHE && key !== SHARE_CACHE).map(key => caches.delete(key))
```

という**旧式（スコープを見ない掃除）**です。Pages のプロジェクトサイトは同じアカウント／同じ組織の `*.github.io` が **1つのオリジン**なので、`https://trk-nexus.github.io/trk/` と `https://trk-nexus.github.io/trk-PWA/` は `CacheStorage` を共有します。→ 上流が版を上げたとき、**trk-PWA の `trk-…@trk-pwa` を全部消しに行く**。

trk-PWA 側は trk223 で「名前の末尾に `@<置き場所の印>` を付ける」方式を入れていて、自分の名前の見通しで相手のものを避けます。上流にも**同じ考え方**を乗せるのがこの変更です（印が付いている名前は、自分のスコープと合うときだけ消す／印の無い名前＝このアプリ自身の古い版はこれまでどおり片付ける）。

## 2. 当てかた（上流リポジトリで）

```bash
git clone https://github.com/Trk-Nexus/trk.git ../trk
node ../trk-PWA/tools/backport-trk-scope-tag.mjs --repo=../trk --check   # 書き換えずに、当たり方を見る
node ../trk-PWA/tools/backport-trk-scope-tag.mjs --repo=../trk          # 当てる
cd ../trk && npm run check                                              # 実測で 747 pass / 0 fail
git checkout -b fix/sw-scope-tag && git add -A && git commit && git push -u origin fix/sw-scope-tag
gh pr create --repo Trk-Nexus/trk --base main --fill
```

道具が直すのは3点だけです：

| # | 内容 |
| --- | --- |
| ① | `sw.js`：`scopeTagOf()` と `cacheIsOurs()` を追加し、activate の掃除に `cacheIsOurs(key)` の条件を足す |
| ② | URL24か所：`…/trk` → `Trk-Nexus/trk`、`tonbokiri…github.io/trk/` → `trk-nexus.github.io/trk/`（`index.html` の `og:url`／`og:image`・`README.md`・`credits.html`・`privacy.html`・`js/library.js`・`CONTRIBUTING.md`・`docs/SECURITY.md`・`docs/guide/en.md`・`.github/ISSUE_TEMPLATE/config.yml`） |
| ③ | `tools/make-icons.html`：og.png に住所を焼き込まなくする（**既存の `docs/og.png` の右下には旧URLが残っているので、画像の作り直しはブラウザ作業です**） |

・**上流の版名（`CACHE = "trk-v…-trk…"`）は上げません**：変えるのは掃除の条件だけで殻の中身は無変更なので、利用者さんに再ダウンロードをさせないためです（`sw.js` 自体が変わるので更新は普段どおり届きます）
・**冪等**です（2回目を run すると「もう入っています（スキップ）」で止まる）
・想定した形が見つからない場合は**そこで止めて**教えてくれます（上流が先に進んでいたら手で合わせる）
・音源 `music-library`・`trk-apk`・`trk-Standalone` は個人配下のままなので、この道具は触りません

## 3. なぜ PR を代行できなかったか（2026-11-02 実測）

| 試したこと | 結果 |
| --- | --- |
| `git push origin …`（`Trk-Nexus/trk`） | `Permission to Trk-Nexus/trk.git denied to TonbokiriRaikiriMuramasa-Taikoubou` → **403** |
| `POST /repos/Trk-Nexus/trk/git/refs` | **403 `Resource not accessible by integration`** |
| `POST /repos/Trk-Nexus/trk-PWA/git/refs` | **OK**（作って消せた＝同じ資格情報で trk-PWA は書ける） |
| `GET /repos/Trk-Nexus/trk` | `permissions.admin=true`・`permissions.push=true`（※これは**ユーザー自身**の権限の値で、コネクションのアクセス範囲とは別物） |
| `GET /user` | `TonbokiriRaikiriMuramasa-Taikoubou`（User）／`X-Oauth-Scopes:` は**空** |

**結論（実測から言える範囲）**：Arena の GitHub App は組織 `Trk-Nexus` に入っている（前回の transfer が通った・`/orgs/Trk-Nexus/installations` は 403 のまま＝一覧権限が無いだけ）が、**インストールのリポジトリ選択が `trk-PWA` だけ**で、`trk` が含まれていません。書き込み系だけが 403 になり、読み取り（public）は通る、という出方と一致します。

**直し方**：GitHub → `Trk-Nexus` → **Settings → Third-party Access（組織の外部アプリ）→ Arena → Configure** → *Repository access* を **All repositories**（または `trk` を Add）→ **Save／Update**。追加後に必要なら **Permissions** で *Contents: Read and write* が入っていることを確認してください。

**直ったかの1行検査**（こちらでも実行します）：

```bash
gh api -X POST repos/Trk-Nexus/trk/git/refs -f ref=refs/heads/probe -f sha=$(gh api repos/Trk-Nexus/trk/git/ref/heads/main -q .object.sha)
```

`ref` が返れば OK（その後 `gh api -X DELETE repos/Trk-Nexus/trk/git/refs/heads/probe` で消す）。403 が返るなら、まだ `trk` が入っていません。

## 4. 関連

- 実測表と A〜D の実施状況：[`ORIGIN.md`](ORIGIN.md) §7・§7.1
- 移籍の経緯・権限の教訓：[`ORIGIN-TRK-NEXUS-2026-11-02.md`](ORIGIN-TRK-NEXUS-2026-11-02.md) §5・§6
- trk-PWA 側の自衛（`trkPWA-` 接頭辞）：`sw.js` の `CACHE_KEY_PREFIX` と `docs/HANDOFF.md` の trk252 の行

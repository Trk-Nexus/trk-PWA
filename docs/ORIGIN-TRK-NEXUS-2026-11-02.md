# 🏛 trk-PWA を組織 `Trk-Nexus` へ移籍した（2026-11-02・trk250）

> **要旨**：`trk-PWA` を **個人アカウント → 組織 `Trk-Nexus`** に移しました。本番URLは **`https://trk-nexus.github.io/trk-PWA/`**、リポジトリは **`https://github.com/Trk-Nexus/trk-PWA`**。コードの挙動は変えていません（変わるのは URL を書いている場所と cache 名だけ）。
> この文書は「**なぜ・どうやって・今何が残っているか**」の記録です（同じ内容を Drive の保管庫にも置きます）。

---

## 1. なぜ移したか（理由）

| # | 理由 | 根拠 |
| --- | --- | --- |
| 1 | **上流 `trk` と保存領域を共有していた** | GitHub Pages のプロジェクトサイトは同じアカウントの `*.github.io` が**1つのオリジン**。`.../trk/` と `.../trk-PWA/` はパスが違うだけで、`localStorage`・`IndexedDB`・`CacheStorage` を共有していました（`docs/PWA.md` §2.1）。**`sw.js` は `trk-` 始まりのキャッシュを版更新で消す**ので、PWA と上流が互いのオフラインキャッシュを消し得る状態でした |
| 2 | **分離の受け皿が無料で手に入った** | 独自ドメインは 0円方針（2026-10-30 決定）で取らない。組織 Pages は追加費用なしの想定（**組織の Plan は `none` を実測**＝無料枠） |
| 3 | **まだ外部に配っていない** | 「オリジンは案内する前に決める」という原則（`docs/ORIGIN.md` §0）に、**配る前なら費用ゼロ**で従えた形になります。移籍は保存データを持って行けないので、配った後だと利用者に 📤 を頼むはめになっていました |
| 4 | 信頼感・共同管理者 | 個人名の長い `github.io` より組織名が見やすくなる。組織にすれば管理者を増やせる（`docs/ORIGIN.md` §2 の比較どおり） |

**名称**：`trk-company` 案（2026-10-31 時点のメモ）は使いませんでした。実際の組織は **`Trk-Nexus`**（表示名 Trk Nexus・位置 Japan）で作られました（2026-11-01）。

## 2. 経緯（実測したものだけ）

1. **2026-11-01（trk247）**：先に**設定の書き出し・読み込みの導線**を作りました（⚙ → 💾 端末の保存／上限 20 MiB／壊れた項目だけ除く）。**オリジンが変わると保存は引き継がれない**ので、移籍を安全にするための準備でした。
2. **2026-11-01（返事13のあとの調査）**：`api.github.com` で `trk-company`・`trkcompany` などが **404（空き見込み）** であることを確認。
3. **2026-11-02（trk249）**：URLの記述が **1か所だけ更新されて他が古い**、という事故を止める検査 `tests/trk249-origin-consistency.test.mjs` を入れた（値は固定せず相互比較）。
4. **移籍を試みて詰まった**：
   - `POST /repos/TonbokiriRaikiriMuramasa-Taikoubou/trk-PWA/transfer` → **403 `Resource not accessible by integration`**
   - `/orgs/Trk-Nexus/installations` → **404**
   - `/user/orgs`・`/orgs/Trk-Nexus/members` → **空**
   - 私の側の誤読：これを「**アカウントが組織に未所属**」と判定しました。**正しくは「Arena の GitHub App が組織にインストールされていないので、組織の情報が見えないだけ」**でした（UI では同じアカウントが **Owner** 表示）。`X-Oauth-Scopes:` が**空**だった＝トークンは GitHub App 経由、という事実で見極めるべき所でした。
5. **Arena の GitHub App を `Trk-Nexus` にインストール**（Install → All repositories）→ 同じ transfer API が**成功**。
6. **移籍後の実測**：`gh api repos/Trk-Nexus/trk-PWA` → `full_name=Trk-Nexus/trk-PWA`・`private=false`・`default_branch=main`・**`has_pages=true`**・**`admin=true`**。Pages 設定は `build_type=workflow`・`source=main:/`・`html_url=https://trk-nexus.github.io/trk-PWA/` のまま**引き継がれていました**（再設定不要）。
7. **`/orgs/Trk-Nexus/installations` は 403 のまま**：アプリは入ったが「組織のインストール一覧を読む権限」は持たない、という別物。作業には支障なし。

## 3. 変わったもの・変わらないもの

| 項目 | 前後 |
| --- | --- |
| リポジトリ | `TonbokiriRaikiriMuramasa-Taikoubou/trk-PWA` → **`Trk-Nexus/trk-PWA`**（このサンドボックスの `origin` は差し替え済み） |
| **旧 git URL** | `...Taikoubou/trk-PWA.git` は**使えません**（`git ls-remote` が空）。HTTPS のクローン先は新URLにしてください。**README・ドキュメントの URL を指すリンクは trk250 で更新済み** |
| **旧 Pages URL** | `tonbokiriraikirimuramasa-taikoubou.github.io/trk-PWA/` は**無くなります**（リポジトリごと移動したため）。**外部に案内していなかったので影響はゼロ** |
| 本番URL | **`https://trk-nexus.github.io/trk-PWA/`** |
| `index.html` の `og:url`／`og:image` | 新オリジンへ更新（trk250） |
| `README.md` | ▶ 遊ぶ／▶ Play のリンク3本（badge含む）を新URLへ |
| `manifest.webmanifest` | **無変更**（`start_url`・`scope`・`id` がすべて `./` 相対なので、移籍で書き換える必要が無い） |
| `js/`・`css/`・`sw.js` | **無変更**（オリジンの直書きがゼロ。trk249 の検査がそれを毎回見ています）。**外部取りに行かない作りはそのまま** |
| Service Worker のキャッシュ名 | `trk-v2026.11.01-trk248` → **`trk-v2026.11.02-trk250`**。スコープ印（`@trk-pwa`）はパスから作るので、そのまま残っています（`sw.js` の `scopeTagOf`） |
| 上流 `trk`（個人） | **そのまま**。`/trk/` と `/trk-PWA/` が**別オリジンになった**のが今回の目的 |
| 保存データ | 新オリジンでは**空**で始まります（旧オリジンのデータは引き継がれません）。既存の利用者さん本人は ⚙ → 💾  端末の保存 の **📤 書き出し → 新しい場所で 📥 読み込み**で移せます |

## 4. 今後の作業

- [x] transfer 実行（2026-11-02・trk250）
- [x] `og:url`・`og:image`・README・docs のURL更新（`docs/PWA.md`・`docs/ORIGIN.md`・`docs/PERMISSIONS.md`・`docs/HANDOFF-TRK-STANDALONE.md`・`docs/PLAN-R6-PHASE4-TYPOGRAPHY-2026-11-01.md`・`docs/PREFS-TRANSFER-TRK247-2026-11-01.md` を追記・更新）
- [x] この文書（経緯の記録）
- [x] **Pages のビルド確認（済み・実測）**：组织移籍後も Actions は動きます（`Deploy GitHub Pages` と `Check` が main 入力で **completed / success**、組織側の Actions 設定変更は不要でした）。
  - ⚠ **`GET /repos/Trk-Nexus/trk-PWA/pages/builds` は `status=null` のまま**です。これは壊れではなく、**Source が `GitHub Actions` の Pages ではこの API が埋まらない**ため（`gh api repos/Trk-Nexus/trk-PWA/pages` → `build_type=workflow`・`html_url=https://trk-nexus.github.io/trk-PWA/`・`https_enforced=true`）。**見るものは Workflow の実行結果**
  - **ライブ実測**：`https://trk-nexus.github.io/trk-PWA/` が200でアプリを出し、`🛟` の中に `🎨 ノーツ設定を書き出し／💾 全設定を書き出し／📥 設定を読み込み`（trk247 のUI）が見えました。`.../sw.js` は **`const CACHE = "trk-v2026.11.02-trk250"`** ＝trk250 がそのまま配られています
- [x] **配布ZIPを作り直し**（trk250）。旧URLが入っていた trk248 版に代えて、Drive の `trk-PWA-trk250-2026-11-02` に standalone／handover／README／SHA256SUMS の4点を置きました（**ハッシュはZIPの中の文書ではなく README と SHA256SUMS にだけ**）
- [ ] **実機確認**（trk247・trk248 の欄）：新しいオリジンで ⚙ → 💾 端末の保存 の 📤📥、モバイルのパネル載せ、初回案内の1行
- [ ] **④告知の判断**：どこに・いつ案内するか（`docs/ORIGIN.md` §6 の残件）。**本番URLが決まったので、告知文は `https://trk-nexus.github.io/trk-PWA/` を指せます**
- [ ] 上流 `trk` を組織へ移すかは**未決**（今回は `trk-PWA` だけ）。移すと `/trk/` のURLも変わる（**すでに案内済みなので、移すなら 📤 書き出し → 先で 📥 読み込みの手順を案内する必要が出ます**）
- [ ] `docs/REVIEW-REQUEST-*` など**履歴の文書は古いURLのまま**にしています（書き換えると記録が偽るため）

**触らないもの**（この作業セッションの範囲）：組織の設定変更・課金・SSO・リポジトリの再移籍・リポジトリの削除／可視性変更。権限が必要になったときは都度ご相談します。

## 5. 同じ轍を踏まないための1行

> **GitHub の「リポジトリ移籍」は、リポジトリの所有者が組織の Owner でも、作業セッション（GitHub App）がその組織にインストールされていなければ 403 になる。**（`X-Oauth-Scopes:` が空のトークンは、組織の情報を何も見られない。「メンバー一覧が空」＝「未所属」とは限らない）

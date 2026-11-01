# 配布オリジンの選択（GitHub組織 vs 独自ドメイン）

記録日：2026-10-30。Phase 1の公開URLを決めるための比較メモです。

## 0. 先に結論

- **アイコン（ホーム画面アプリ）は、どのオリジンでも作れます。** 組織に移すかどうかとは別の話です。決めるのは「保存領域をどこに置くか」＝**ホスト**です。
- **不特定多数に案内するなら、個人アカウントの `tonbokiriraikirimuramasa-taikoubou.github.io` は使わない**。他のプロジェクトサイトと保存領域・キャッシュを共有します。
- **2026-10-30 決定：0円。** したがって独自ドメインは取りません。
- **2026-10-31 決定（所有者）：配布URLは `https://tonbokiriraikirimuramasa-taikoubou.github.io/trk/`。**
  リポジトリ `TonbokiriRaikiriMuramasa-Taikoubou/trk`（既存・フルバージョンの本体）を使います。**いちばん短く、覚えやすい**ためです。
  `trk-Standalone` は名前のとおり「**通信を行わない**ことを守った完成系」として残します。
  このホストは個人アカウントの `github.io` なので、§1 のとおり同じアカウントの他のページと保存領域を共有します（承知のうえの決定）。
- 分離が必要になったときの受け皿は **GitHub組織 `Trk-Nexus`**（表示名 Trk Nexus）に決まりました（それ以前の案 `trk-company` は使いません）。
- **2026-11-02 実行：`trk-PWA` を組織 `Trk-Nexus` へ移籍済み。** 本番URLは **`https://trk-nexus.github.io/trk-PWA/`**、リポジトリは **`https://github.com/Trk-Nexus/trk-PWA`**。上流 `trk`（個人アカウント）はそのままなので、**これで `/trk/` と `/trk-PWA/` のオリジンが分かれた**（§0 上の懸案が解消）。経緯と実測は [`ORIGIN-TRK-NEXUS-2026-11-02.md`](ORIGIN-TRK-NEXUS-2026-11-02.md)。
- 選択肢は2つ（比較は §2）。
  - **A. trk! 専用のGitHub組織**（無料。`trk-company.github.io` など）
  - **B. 独自ドメイン**（年1,000〜2,000円程度。`trk.example.com` など）
- どちらも「PWAをホーム画面に追加して使う」形は同じ。違うのは**URLの覚えやすさ・信頼感・分離の強さ・移行の手間**です。
- **利用者に案内する前に決める。** ホストを変えると別オリジンになり、保存データは移行されません。

## 1. なぜホストが重要か

Webの保存領域（`localStorage`・`IndexedDB`・`CacheStorage`）は、**オリジン＝scheme + host + port** ごとに分かれます。**パスは関係ありません。**

| URL | オリジン | 保存領域 |
| --- | --- | --- |
| `https://tonbokiriraikirimuramasa-taikoubou.github.io/trk/` | `https://tonbokiriraikirimuramasa-taikoubou.github.io` | 共有 |
| `https://tonbokiriraikirimuramasa-taikoubou.github.io/trk-PWA/` | 同上 | **同じ** |
| `https://trk-company.github.io/trk-PWA/` | `https://trk-company.github.io` | 別 |
| **`https://trk-nexus.github.io/trk-PWA/`** | `https://trk-nexus.github.io` | **別**（2026-11-02 から本番） |
| `https://trk.example.com/` | `https://trk.example.com` | 別 |

現在の個人アカウントの `github.io` では、次が起きます。

- 上流 `/trk/` と `/trk-PWA/` で設定・曲・記録が同じ場所に入る。
- `sw.js` は `trk-` で始まるキャッシュを版更新時に消すため、**上流とPWAが互いのオフラインキャッシュを消し得る**。
- 同じアカウントの他の公開リポジトリ（`Actor-si` など）のページも、同じ保存領域を読める。

## 2. 比較

| 観点 | A. 専用GitHub組織 | B. 独自ドメイン | C. 個人github.io（現状） |
| --- | --- | --- | --- |
| 費用 | **0円** | 年1,000〜2,000円程度＋DNS | 0円 |
| URLの例 | `trk-company.github.io/trk-PWA/` | `trk.example.com` | `tonbokiri...github.io/trk-PWA/` |
| 覚えやすさ・信頼感 | 中（github.ioが残る） | **高** | 低〜中 |
| 他のプロジェクトとの分離 | **組織内だけ分離**（組織に他のリポジトリを置かなければ実質分離） | **完全に分離** | 分離なし |
| 上流 `/trk/` とのキャッシュ競合 | なし | なし | **あり** |
| リポジトリの移動作業 | **必要**（mirror push、Pages再設定、権限） | 不要 | 不要 |
| この作業セッションとの相性 | 低（セッションは現リポジトリに固定） | **高**（このまま進められる） | 高 |
| HTTPS | GitHubが自動 | GitHubが自動（DNS設定後） | 自動 |
| 向いている人 | 無料で分離したい／組織運用に慣れている | ブランド・信頼感・URLを重視 | 試験だけ |

### アイコンについての補足

「単体アプリとしてアイコンを作れる」は、**A/B/Cのどれでも可能**です。必要なのは次のセットで、ホストとは無関係です。

- `manifest.webmanifest` の `icons`（192 / 512、可能なら maskable）
- `apple-touch-icon`（iOS用。180×180が望ましい。現在は192を指定）
- `display: standalone`（iOS 26はホーム画面追加で既定、古いiOS向けに指定）
- 起動画面（任意。`apple-touch-startup-image`）
- ホーム画面追加の案内（iOSは自動プロンプトが無い）

つまり、**組織に移すかどうかと、アイコンの良し悪しは独立**です。アイコンはPhase 3でどの道でも磨けます。

## 3. A. 専用GitHub組織にする場合

### メリット

- 無料。
- 個人アカウントの他のリポジトリから保存領域を分離できる。
- 将来、共同管理者を置ける。

### デメリット・注意

- URLは `github.io` のまま。一般利用者にはやや技術的に見える。
- 組織内に別のリポジトリを置くと、そのページと保存領域を共有する。**trk! 専用の組織にする**こと。
- リポジトリの移動作業が必要。
- **この作業セッションは `TonbokiriRaikiriMuramasa-Taikoubou/trk-PWA` に固定**されているため、移行後は新しいセッションを開くか、手作業が必要になる。
- 組織にArenaのGitHub接続（GitHub App）をインストールし直す必要がある。

### 手順（案）

> **2026-11-02 現在の状況**：1 は**済み**（組織 `Trk-Nexus` 作成済み）。**2〜3 は「mirror で作り直す」ではなく `transfer`（移籍）でやる**ことにしました（旧URLが 301 で追従するため）。ただし **このサンドボックスからは移籍を実行できません**（§3.1）。手順としては 1 → §3.1 の権限2点 → 4 以降を順に実行します。

1. GitHubで無料の組織を作る（**完了：`Trk-Nexus`**）。個人アカウントと同じく2FAが必要な場合あり。
2. 組織に空のリポジトリ `trk-PWA` を作る。（**transfer でやるなら不要**）
3. 現在のリポジトリをmirrorで移す。（**transfer でやるなら不要**）

   ```sh
   git clone --mirror https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk-PWA.git trk-PWA.git
   cd trk-PWA.git
   git push --mirror https://github.com/trk-company/trk-PWA.git
   ```

4. 組織のリポジトリで **Settings → Pages → Source: GitHub Actions** を設定。
5. 組織にArenaのGitHub Appをインストール（作業を続ける場合）。
6. `README.md` のURL、`index.html` の `og:url` / `og:image`、`docs/PWA.md` を新URLに更新。**この文書（`docs/ORIGIN.md`）と `docs/PERMISSIONS.md`、`docs/HANDOFF-TRK-STANDALONE.md` も古いオリジンを踏んでいる**ので同じ commit でそろう（`docs/REVIEW-REQUEST-*` は履歴なので変えない）。
   - **検査が縛る**：`tests/trk249-origin-consistency.test.mjs` は「URLの値」を固定せず、`og:url`・README の ▶ Play・badge・この文書の記述が**同じオリジンを指しているか**だけを見るので、1か所だけ更新して他を古いままにする事故は落ちます。
   - `manifest.webmanifest` は `start_url`/`scope`/`id` がすべて `./` 相対、`js/`・`css/`・`sw.js` にオリジン直書きは**ゼロ**（この検査が見ています）。なので**マニフェストとアプリのコードは移籍で書き換える必要がありません**。
7. 旧リポジトリはアーカイブし、READMEに移転先を書く。
8. 旧URLの利用者データは移行されない。案内文を用意する。

### 3.1 移籍をこの作業セッションから実行するときに要ったもの（2026-11-02 実測・**解決済み**）

> **結論**：必要だったのは **Arena の GitHub App を組織にインストールすることだけ**でした（メンバー招待は**元から Owner**）。アプリが入った時点で `POST /repos/…/transfer` が通り、`gh api repos/Trk-Nexus/trk-PWA` は `admin=true`・Pages の `build_type=workflow` も引き継がれていました（下表は詰まる前に見た値）。

| 確認したこと | 結果 |
| --- | --- |
| `POST /repos/TonbokiriRaikiriMuramasa-Taikoubou/trk-PWA/transfer`（`new_owner=Trk-Nexus`） | **403 `Resource not accessible by integration`** |
| `/orgs/Trk-Nexus/memberships/TonbokiriRaikiriMuramasa-Taikoubou` | **403**（未所属） |
| `/users/TonbokiriRaikiriMuramasa-Taikoubou/orgs` | **空** |
| `/orgs/Trk-Nexus/installations` | **404**（組織のアプリ一覧が見えない） |
| リポジトリ側の権限 | `admin=true`・`has_pages=true`（**個人側は足りる**） |
| `gh auth status` | `Logged in as TonbokiriRaikiriMuramasa-Taikoubou (GH_TOKEN)`＝**GitHub App 経由** |

**必要な操作は2つ**（どちらも組織を作ったアカウント側で）：

1. **メンバー招待**：`https://github.com/organizations/Trk-Nexus/people` → Invite member → `TonbokiriRaikiriMuramasa-Taikoubou` → ロール **Owner** → そのアカウントで承認。GitHub の仕様上、**移籍を実行するユーザーは移し先の組織のメンバー**である必要がある
2. **組織へのアプリインストール**：`https://github.com/organizations/Trk-Nexus/settings/installations` → Add GitHub Apps → Arena の GitHub App → Repository access は All repositories（または `trk-PWA`）、**Repository permissions の `Administration` を Read & write**（transfer に必要）。**これを忘れると移籍した瞬間に push も PR もできなくなります**

SSO を有効にしている場合は、招待されたアカウント側で Authorize が1回要ります。

## 4. B. 独自ドメインにする場合

### メリット

- **最も分離が強い**（GitHub Pagesの他のサイトと保存領域を共有しない）。
- URLが短く、覚えてもらいやすい。アプリらしく見える。
- 現在のリポジトリ・セッションのまま進められる。
- 将来ストアやネイティブに移っても、案内URLを変えずに済む可能性がある。

### デメリット・注意

- ドメイン代（年1,000〜2,000円程度）とDNS設定。
- ドメインを失効するとURLも失う。
- 設定後にHTTPS証明書の発行を待つ（通常は数分〜数時間）。

### 手順（案）

1. ドメインを取得（例 `trk-company.com`、`trk-game.jp`）。サブドメイン `trk.example.com` でも可。
2. DNSで `trk` の **CNAME** を `tonbokiriraikirimuramasa-taikoubou.github.io` に向ける（apexドメインならAレコード4本）。
3. GitHubの **Settings → Pages → Custom domain** にドメインを入力して Save。
4. DNSチェックが通ったら **Enforce HTTPS** をオン。
5. リポジトリに `CNAME` ファイル（ドメイン名1行）を置く。Actions配信でもカスタムドメインを維持するため。
6. `og:url` / `og:image` / README / docs を新URLに更新。
7. iPhoneで「ホーム画面に追加」→ standalone起動→オフラインを確認。

### 4.4 追加確認（2026-10-31）

- **リポジトリ `TonbokiriRaikiriMuramasa-Taikoubou/trk` は存在する**（`api.github.com/repos/...` が 200）。ここが配布URLの本体になります。
- `trk` 個人アカウント（`https://trk.github.io/`）は**他人が使用中**なので、そのURLは取れません。
- 組織の名前候補：`trk-company`・`trkcompany`・`trk-co` は **404（空き）**、`trk-corp` は使用中（いずれも 2026-10-31 の API 確認）。**組織の作成は未実施**。
- `TonbokiriRaikiriMuramasa-Taikoubou/trk-Standalone` は同じ個人アカウントなので、ホストは `tonbokiriraikirimuramasa-taikoubou.github.io` のままで、**オリジンは分離されない**（コード分割用）。
- この作業セッションは `trk-PWA` に固定されている。`trk` へ移したあとの継続作業は**新しいセッション**で行う（引き継ぎは `docs/HANDOFF-TRK-STANDALONE.md`）。

## 5. 決定と、残っている選択

- **決定（2026-10-31）**：URL は `https://tonbokiriraikirimuramasa-taikoubou.github.io/trk/`（リポジトリ `trk`）。0円。独自ドメインは取らない。
- **2026-11-02 判断（所有者）**：**まだ配っていないプロダクトなので、組織 `Trk-Nexus` へ移籍してよい**。移籍するとオリジンが変わり保存データは移行されませんが、**配布前なので実害がありません**（告知の前に決める、という原則は守れた形になります）。実行手順と必要権限は §3.1。
- **移行の手順**：`docs/HANDOFF-TRK-STANDALONE.md` §5。実行の時期は所有者の判断です。

## 6. まだ決めていないこと

1. ~~組織を作るか~~ → **`Trk-Nexus` を作成済み（2026-11-01）・trk-PWA の移籍を執行（§3.1 の権限待ち）**。上流 `trk` の方をどこへ置くかは未決定のまま。
2. `trk` へコードを移す時期と、旧 `trk-PWA` / `trk-Standalone` をアーカイブする時期。
3. Arenaの接続を移してよいか（作業セッションが変わります）。
4. アイコンの方向性（現行の `trk!` ロゴを磨くか、新規に作るか）。
5. 公開告知の時期（Phase 0の実機チェック前か後か）。

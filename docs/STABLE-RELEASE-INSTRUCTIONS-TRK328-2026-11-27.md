# 統合版 `trk`（`/trk/`）を作る指示書 — trk328（2026-11-27）

- これは **実行する人のための手順書**です（読むだけの記録ではありません）。所要 20〜30 分＋CI 待ち。
- 作るもの：上流 **`Trk-Nexus/trk`**（利用者さんに配る安定版・公開 URL は `https://trk-nexus.github.io/trk/`）を、いまの **`trk-PWA` の `main`（trk328）** の中身にそろえる。
- 前提：PWA は **trk328 が `main` に入っている**（この版の作業時は `9b3169d`、実施時は `ac36bd9`）。Avatar 側は **trk328 を固定して緑**（§2 の実測）。
- **`trk-PWA` の `main` が本番**です。上流 `trk` で直接開発しません（二重管理をなくすため）。だからこの作業は「写して・検査して・PR」だけです。

---

## 1. 参照するもの（ここだけ見れば足ります）

| 参照 | どこ | 何のために |
| --- | --- | --- |
| **道具** | `tools/make-stable.mjs`（`--repo` / `--apply` / `--prune` / `--cache=` / `--date=`） | 写す・住所を反転する・差分を出す。**push も PR もしません** |
| **手順と期待値** | `docs/TRK-STABLE-RUNBOOK-2026-11-02.md`（§2 手順 A・期待値の表） | 数字の目安と注意（`--prune` を使わない等）。数字は trk328 の実測に更新済み |
| **いまの状態** | `docs/HANDOFF.md` §1.5（Service Worker の行）・§7（履歴） | PWA 側の cache 名（`trk-v2026.11.27-trk328`）と、この版に何が入ったか |
| **この版の中身** | `docs/STABLE-REVIEW-TRK328-2026-11-27.md` | レビュー対応（M1・M3）と見送りの理由。告知文の材料 |
| **Avatar との統合状態** | `docs/AVATAR-HANDOFF-TRK328-2026-11-27.md` | 相手側の固定（`TRK_PWA_REF`・`PINS`）と検査の期待値 |
| **cache のスコープ印** | `docs/PWA.md`（`CacheStorage` の項）・`docs/ORIGIN.md` §7.1 | 同じオリジンで `/trk/` と `/trk-PWA/` が互いのキャッシュを消さない理由（実体名は `trkPWA-…@trk`） |
| **公開のしくみ** | 上流リポジトリの `.github/workflows/pages.yml`・`manifest.webmanifest` | マージ＝そのまま公開（別のデプロイ作業はありません） |
| **Avatar 側の記録** | `trk-Avatar-Library` の `docs/2026-11-27-pwa-receiver-requirements.md`（照合基準 trk328）・`HANDOFF.md` §2.5/§7 | 出したあとに「安定版も trk328 になった」と書くため |

---

## 2. いま緑なこと（2026-11-27 にこちらで実測）

| 検査 | 結果 |
| --- | --- |
| PWA `npm run check` | **2069 pass / 0 fail** |
| PWA `node tools/check-repo.mjs` | **0 failure / 0 warning** |
| 鏡を当てた `trk` の `npm run check`（`/tmp` で予行） | **2069 pass / 0 fail** |
| 鏡を当てた `trk` の `node tools/check-repo.mjs` | **0 failure / 0 warning** |
| Avatar `npm run check` | 合格（wizard 62/62・台帳・統合マニフェスト） |
| Avatar `check-pwa-receivers --trk=<trk328>` | **稼働契約 7/7・受け子 7/7 implemented** |
| Avatar `check-pwa-skin-compat` | **✅ 238 種／13 巻・差し戻し 3 種 33 組** |
| Avatar `tests/re-modern-work-preflight.test.mjs`（新しい `PINS`） | **6 pass / 0 fail** |
| Avatar の `PINS` 4 本 | **4/4 一致**（`remodern-regions.js` `ebb4dce…`／`remodern-ui.js` `aa13b1f…`） |

---

## 3. 手順

### 0) 準備（1 回だけ）

```bash
# 書き込む先（上流）を clone（既にあれば最新へ）
git clone https://github.com/Trk-Nexus/trk.git trk
git -C trk pull --ff-only

# 写す元（PWA）を main に
cd trk-PWA
git switch main && git pull --ff-only
git log --oneline -1        # trk328 のマージが先頭にあること（版は index.html の trk-build で確認）
grep -m1 'trk-build' index.html   # trk328 であること
```

- 必要：**Node 22**・`gh` の認証（`gh auth status`）・`trk` への書き込み権限。
- ⚠ **`--prune` は付けない**（今回の差分に「上流だけにあるファイルの削除」は 0 件でした。付けると上流専用のファイルを消します）。

### 1) 見るだけ（書き換えない）

```bash
node tools/make-stable.mjs --repo=../trk
```

期待（2026-11-27 の実測）:

```
写す集合：703 ファイル（追跡している全部＝鏡）／住所の反転：する（trk-PWA → trk）
  追加 303・更新 56・同一 344／反転したファイル 95 件（語 517）
  版名：trk-PWA のものをそのまま持っていく（上げるなら --cache= を使う）
```

### 2) 当てる

```bash
node tools/make-stable.mjs --repo=../trk --apply
```

期待：`✅ 当てました：…/trk`

### 3) 検査（**ここが緑になるのが合格**）

```bash
cd ../trk
npm run check                  # 期待：2069 pass / 0 fail
node tools/check-repo.mjs      # 期待：Static check: passed · 0 failure(s) · 0 warning(s)

git status --short | wc -l     # 期待：359（追加 303＋更新 56）
grep -n 'const CACHE' sw.js    # 期待：const CACHE = "trk-v2026.11.27-trk328";
grep -n 'trk-build' index.html # 期待：<meta name="trk-build" content="trk328">
```

- **合否の線は「`npm run check` が fail 0」だけ**です。件数が上の表と違っても止めないでください（`docs/` が増えるたびに動きます）。
- 数字を固定したいときは、**実機で確かめた版に `git checkout` してから**当ててください。

### 4) 差分を一目見る（事故よけ・2 分）

```bash
git status --short | head -20
git diff --stat | tail -5
```

見るポイント：
- `sw.js` の `CACHE` が **trk328** になっている（trk219 のままだと更新が届きません）。
- `index.html` の `trk-build` も **trk328**（cache と食い違うと `tests/trk259-review.test.mjs` が落ちます＝§4）。
- `js/` に **意図しない差分がない**（`--apply` は PWA の写しなので、上流で手直ししていた場合はここで消えます。残したい直しは PWA 側へ）。

### 5) 枝・コミット・PR（**main へ直接 push しない**）

```bash
git checkout -b trk-stable-<日付>        # 枝の名前は例。作業セッションの枝（arena/<id>-trk など）でもよい
git add -A
git commit -m "🏗 安定版を trk328 にそろえる（trk-PWA の鏡）"
git push -u origin trk-stable-<日付>         # 実際に使った枝名
gh pr create --repo Trk-Nexus/trk --base main --title "🏗 安定版 trk328（trk-PWA の鏡）" --fill
```

PR 本文に 1 行足すと親切です：**「docs は住所を反転済み（`trk-PWA` → `trk`）」**（鏡の副作用で、過去の記録の住所も変わるため）。

### 6) マージ → 公開

- PR をマージすると `.github/workflows/pages.yml` が動いて公開されます（別のデプロイ作業はありません）。
- 公開 URL：`https://trk-nexus.github.io/trk/`

### 7) 公開後の確認（実機・ブラウザ）

| 見る | 期待 |
| --- | --- |
| `/trk/` を開いて版 | **trk328**（⚙ の「🔄 アプリの更新」に「いまの版：…trk328」） |
| 設定が残っている | スキン・音量など、更新前のまま |
| 旧キャッシュが置き換わる | DevTools → Application → Cache Storage に `trkPWA-trk-v2026.11.27-trk328@trk` があり、`trk-v2026.10.29-trk219` が消えている |
| **更新直後の 1 回目** | 古い SW の配り方で「新しい `index.html`＋古い JS」になることがあります（レビュー実測）。**変なら一度開き直す**（2 回目でそろいます） |
| オフライン | 機内モードで開き直しても起動する（モード・曲リストが出る） |
| 音 | 曲を選んで鳴る・メディアプレイヤーが開く |

### 8) 記録の更新（公開できたら・PWA 側に 3 か所）

| 直す場所 | いまの記述 | 新しい記述 |
| --- | --- | --- |
| `docs/HANDOFF.md` 冒頭（§0 の 1 段落） | 「上流 `trk` の配布版は **1.1.8（trk219）**」 | 「上流 `trk` の配布版は **trk328**（`/trk/`・cache 実体 `trkPWA-trk-v2026.11.27-trk328@trk`）」 |
| `docs/PWA.md` 冒頭 | 「**1.1.8（trk219）** をそのまま取り込み」 | 同上（trk328） |
| `docs/HANDOFF.md` §1.5 の表 | （行を足す） | 「**trk328 を `/trk/` に出した（日付・PR 番号・写したファイル数）**」 |
| `README.md` 57 行目 | 「ここは**開発版**です。ふだん使う安定版は …」 | 変更なし（鏡で両方が `Trk-Nexus/trk` に見える件は PR で 1 行直すだけ・次の鏡で戻ります） |

- Avatar 側にも 1 行：「安定版 `/trk/` を trk328 で公開」を `HANDOFF.md` §2.5 か §7 に（照合基準 `TRK_PWA_REF` は **PWA の `d5de065…` のまま**で正しい。安定版は別物なので**触りません**）。

---

## 4. 版名（`sw.js` の `CACHE`）の決め方 — **既定のままを推奨**

| 案 | コマンド | 結果 | 判断 |
| --- | --- | --- | --- |
| **A（推奨）** | `--apply`（`--cache=` なし） | `trk-v2026.11.27-trk328` | 番号が PWA と 1 対 1 で追える。219 → 328 の飛びは「そのぶん進んだ」という事実 |
| B | `--apply --cache="trk-v2026.11.27-1.2.0"` | `trk-v2026.11.27-1.2.0` | **そのままでは検査が落ちます**（下記） |

**実測（2026-11-27）**：B を当てると `tests/trk259-review.test.mjs` が **1 件だけ落ちます**（`sw.js` の `CACHE` と `index.html` の `trk-build` が食い違う／試験の正規表現が `trkNNN` を要求）。
B を選ぶなら **同時に** ①`index.html` の `trk-build` を `1.2.0` に ②`tests/trk259-review.test.mjs` の正規表現を直す必要があり、**PWA 側の番号とずれます**。→ **A を推奨**。

---

## 5. うまくいかないとき（巻き戻し）

1. **PR をマージする前**：枝を消すだけ（`git push origin --delete <使った枝>`）。公開物は変わりません。
2. **マージしたあと**：`trk` で revert の PR を作る（`git revert -m 1 <merge の SHA>`）。`CACHE` が trk219 に戻るので、利用者には「もう一度更新」が届きます。
   - 注意：戻したあと、こちら（PWA）の `main` は trk328 のままなので、**次の鏡でまた trk328 に戻ります**。直すべき原因は PWA 側で直してから出し直してください。
3. **一部の端末だけ古いまま**：SW の更新はタブを閉じるまで待つことがあります。告知の「変なら一度開き直す」で足ります。

---

## 6. やってはいけないこと

- `main` へ直接 push（必ず枝＋PR）。
- `--prune` を付ける（上流専用のファイルが消えます）。
- 上流 `trk` で直接ファイルを直す（次の鏡で消えます。直すのは PWA 側）。
- `sw.js` の `CACHE` を手で書き換える（`trk-build` と食い違うと試験が落ち、更新も届きません）。
- `docs/og.png` をブラウザで焼き直さない（焼き込み住所を消した版です。作り直すのは見た目を変えるときだけ）。

---

## 7. 告知文（下書き・そのまま使えます）

> **trk! 更新のお知らせ（trk328）**
>
> `/trk/` を新しい版にしました。今回は「音まわり」と「持ち込みのスキン」の仕上げです。
>
> - 🎧 **メディアプレイヤー**：ロック画面の再生／一時停止の表示が実際の状態と合うように。読み込み中・止まったとき・失敗したときは**理由と「⟳ もう一度」**を出します。キューは「次に再生」を挟め、**そのキューからプレイリスト**を作れます。曲間のつなぎ（フェード／先読み）は**設定で入れた人だけ**（既定はオフ。iPhone・iPad ではフェードは効きません）。
> - 📚 **持ち込みのスキン**：巻ごとの取り込み、作品ごとの題字の書体、旧配色の切り替え。取り込みの検査はこれまでどおり（色の差で判定）。
> - 🧾 安定版の前の不具合 2 件を直しました（スキン目録の生成のずれ・フェード中に巻き戻すと音量が戻らない）。
>
> ⚠ 更新した直後に画面が変だなと思ったら、**もう一度開き直してください**（古い版の一部が残ることがあります）。設定・記録はそのまま残ります。
> 不具合は [Issues](https://github.com/Trk-Nexus/trk/issues) か X [@ttrk143](https://x.com/ttrk143) まで。

---

## 8. こちらの実測ログ（2026-11-27・予行）

```
# PWA main（予行のとき）
$ git log --oneline -1
9b3169d Merge pull request #114 from Trk-Nexus/arena/58233b14-trk-pwa

# 見るだけ
写す集合：703 ファイル／追加 303・更新 56・同一 344／反転 95 ファイル（語 517）

# 上流クローン（06cef87・trk219）に --apply
$ grep 'const CACHE = ' sw.js
const CACHE = "trk-v2026.11.27-trk328";
$ git status --short | wc -l
359
$ npm run check      → 2069 pass / 0 fail
$ node tools/check-repo.mjs → Static check: passed · 0 failure(s) · 0 warning(s)

# 版名を変えた場合（参考）
$ node tools/make-stable.mjs --repo=<別クローン> --apply --cache="trk-v2026.11.27-1.2.0"
$ node --test tests/trk259-review.test.mjs  → 1 件だけ落ちる（cache と meta の不一致）
```

---

## 9. 実施の結果（2026-11-27・本番。この手順で出しました）

| 項目 | 結果 |
| --- | --- |
| 枝 | `arena/ee8fc9ea-trk`（作業セッションの枝。`trk-stable-<日付>` でなくても問題ありませんでした） |
| 写し元 | `trk-PWA` の `main` `ac36bd9`（trk328） |
| 写した件数 | **704** ファイル（追加 304・更新 56・同一 344）／住所の反転 **96** ファイル・**529** 語 |
| 検査 | `npm run check` **2069 pass / 0 fail**、`check-repo` **0 failure / 0 warning** |
| PR・マージ | `Trk-Nexus/trk` **#103** → 2026-11-27 16:06:59Z に `--merge`（**`02d5fd3`**） |
| 公開 | Deploy GitHub Pages **run `46030828778`** success |
| 公開サイトの実測 | `https://trk-nexus.github.io/trk/sw.js` の **`CACHE` = `trk-v2026.11.27-trk328`**（＝trk328 が出ている） |

- 予行（§8）は **703 ファイル**でした。本番の 704 との差 1 件は、予行のあとに写し元と上流の状態が進んだぶんと見られます（手順そのものの違いではありません）。
- **`--prune` を使わなかったので削除は 0 件**でした。§4 の版名も既定（`trk-v2026.11.27-trk328`）のままで、検査は全部通りました。
- 実機の確認は利用者さんの端末で行い、[`STABLE-RELEASE-TRK328-RECORD-2026-11-27.md`](STABLE-RELEASE-TRK328-RECORD-2026-11-27.md) §3 の表に残します。

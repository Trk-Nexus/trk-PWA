# 🏗 上流 `Trk-Nexus/trk`（安定版 `/trk/`）を更新する手順書

- 日付：2026-11-02／版：**trk259**（trk258 のアプリ本体は `722409a`・以後は `docs/` と trk259 の手当て）
- これは**向こうのリポジトリで動かす人**（空さん、または trk 側で動かすエージェント）向けの手順書です
- こちら（trk-PWA の作業セッション）からは **push も PR もできません（403）**。できるのは**材料と期待値をそろえること**まで
- 先方の合意（返事17 §2）：**実機 → 安定版**の順。実機は [`DEVICE-CHECK-R10-2026-11-02.md`](DEVICE-CHECK-R10-2026-11-02.md)

---

## 0. 3行

1. **鏡（`make-stable`）を 1 回当てる**のが本筋です。trk-PWA の追跡ファイルを上流へ写し、住所を `trk-PWA` → `trk` に反転します。**①〜④ も一緒に入ります**（別に `backport` を当てる必要はありません）。
2. 当てた上流で `npm run check` が **1350 pass / 0 fail** になることを、こちらで**実測済み**です（§3）。**数字は版ごとに動くので、当てる直前の dry-run を正**にしてください（§2 の表は 2026-11-02 13:30 の実測）。
3. `backport-trk-scope-tag.mjs` は「**上流の中身はそのままで、①〜④ だけ直したい**」ときの道具です。鏡と併用しないでください（`--check` が「もう入っています」と出ます）。

---

## 1. どっちを選ぶか

| やりたいこと | 使う道具 | 向き |
| --- | --- | --- |
| `/trk/` を **trk-PWA と同じ中身**にしたい（本筋・二重管理をやめる） | `tools/make-stable.mjs` | ✅ おすすめ |
| 上流の中身は触らず、**掃除の取り合い（①〜④）だけ**直したい | `tools/backport-trk-scope-tag.mjs` | 最小の手当て |
| 両方 | ❌ やらない | 鏡に ①〜④ が入っているので、二重に当てる意味がない |

---

## 2. 手順 A：鏡を当てる（おすすめ）

```bash
# 1) 上流を clone（まだ無ければ）
git clone https://github.com/Trk-Nexus/trk.git ../trk
cd ../trk && git switch -c trk-stable-2026-11-02

# 2') どの版で当てるかを決める（実機で確かめた版＝そのときの main。迷ったら trk-PWA の main の先頭）

# 2) まず見るだけ（1 行も書き換えない）
cd /path/to/trk-PWA
node tools/make-stable.mjs --repo=../trk

# 3) 写す
node tools/make-stable.mjs --repo=../trk --apply

# 4) 上流側で検査（**ここが緑になるのが合格**）
cd ../trk && npm run check

# 5) コミットして PR（main へ直接 push しない）
git add -A && git commit -m "🏗 安定版を trk259 にそろえる（trk-PWA の鏡）"
git push -u origin trk-stable-2026-11-02
gh pr create --repo Trk-Nexus/trk --base main --fill
```

### 期待値（2026-11-02 13:30・外部レビューで実測／`main` = `959e2ab` の時点）

| 段階 | 値 |
| --- | --- |
| 写す集合 | **516 ファイル**（trk-PWA の追跡ファイル全部＝鏡） |
| 差分 | **追加 116・更新 45・同一 355**（上流は 400 ファイル） |
| 住所の反転 | **62 ファイル・語 425 か所** |
| `--apply` 後の `git status` | **161 件**（追加＋更新） |
| 上流での `npm run check` | **1339 pass / 0 fail**・Static 0/0・Security 64/0・a11y 9/0（trk258 の時点） |

> ⚠ **この表は「だいたいこのくらい」の目安です。** main に `docs/` が増えるたびに写す集合と反転の数は動きます（trk259 でも動きます）。
> **合否の線は「上流で `npm run check` が緑（fail 0）」だけ**にして、件数が表と違っても止めないでください。
> 件数を固定したいときは、**実機で確かめた版（例：`722409a`）に `git checkout` してから**当てると動きません。

### 気をつけること

- **`--prune` は初回は付けない**。上流だけにあるファイル（`docs/og.png` など）を消してしまいます。差分を見てから判断してください。
- **書簡・計画書の住所も反転します**（425 語の多くは `docs/`）。過去の記録の `trk-PWA` が `trk` に変わるので、記録として読む人には紛らわしく見えます。**いまは「そのまま反転する」で進めます**（反転しないと、安定版の `HANDOFF` や `README` が自分の住所を `trk-PWA` と書いてしまうため）。気になるときは PR 本文に「docs は反転済み」と 1 行足してください。
- **版名（`sw.js` の `CACHE`）**：既定では trk-PWA の番号（`trk-v2026.11.02-trk259`）がそのまま入ります。上流の番号体系（`1.1.8（trk219）`）を続けたいなら `--cache=` で指定するか、PR のときに手で決めてください。**どちらでも動きます**が、`/trk/` を見ている人には番号が変わって見えます。
- **README の「開発版／安定版」の 1 行**は、鏡だと両方が `Trk-Nexus/trk` になって同じ名前になります（反転の副作用・**動きには影響なし**）。見た目が気になるなら PR のときに 1 行だけ直してください（次の鏡で戻ります）。
- 上流の `.github/workflows/` も**SHA 固定版**に置き換わります（trk256 の M1）。上流で Actions を動かしている場合、権限はそのままです。

---

## 3. 手順 B：①〜④ だけ当てる（最小）

```bash
git clone https://github.com/Trk-Nexus/trk.git ../trk
cd /path/to/trk-PWA
node tools/backport-trk-scope-tag.mjs --repo=../trk --check   # 当たり方の確認だけ
node tools/backport-trk-scope-tag.mjs --repo=../trk           # 当てる
cd ../trk && npm run check && git switch -c trk-scope-2026-11-02 && git add -A && git commit
```

`--check` の実測（上流 `06cef87` のまま・2026-11-02）：

| # | 当てる所 | 件数 |
| --- | --- | --- |
| ① | `sw.js` activate の掃除をスコープ対応に（`trk-PWA` の殻を消さない） | 1 か所 |
| ② | 住所の書き換え（`index.html` 5・`README.md` 10・`credits.html` 1・`privacy.html` 2・`js/library.js` 1・`CONTRIBUTING.md` 1・`docs/SECURITY.md` 1・`docs/guide/en.md` 1・`ISSUE_TEMPLATE/config.yml` 2） | **24 か所** |
| ③ | `tools/make-icons.html` の URL 描画を削除（焼き込みは別作業） | 1 |
| ④ | `js/core.js` の設定保存を「いま保存されている値に重ねる」方式へ（工場出荷リセット 2 か所に `fresh`） | 1 |

> 鏡（手順 A）を当てたあとに `--check` を流すと、**①「もう入っています」②「変更なし」③「見つかりません（スキップ）」④「もう入っています」** と出ます（実測）。**それが正常**です。

---

## 4. 出したあとに確かめること（`/trk/`）

| # | 見る所 | 期待 |
| --- | --- | --- |
| 1 | `https://trk-nexus.github.io/trk/` を開く | 起動する（真っ白でない） |
| 2 | ⚙ → 🔄 アプリの更新 | 「いまの版：**trk259**」 |
| 3 | DevTools → Application → Cache Storage | `trk-v2026.11.02-trk259@trk` ができている（`trkPWA-` の殻が**消えていない**） |
| 4 | `/trk-PWA/` を開く | 設定・パックがそのまま（同居の ④ が効いている） |
| 5 | `/trk/` で設定を 1 つ変えて `/trk-PWA/` に戻る | こちらの設定が消えない |

---

## 5. 告知（T3）

- **一般向け**：`https://trk-nexus.github.io/trk/`（安定版・trk259）
- **試す人向け**：`https://trk-nexus.github.io/trk-PWA/`（開発版・同じ中身）
- **旧 URL は r10 で終了**（先方が「もうやめた」と明言）。古いリンクを貼らない
- 文面の下書きは `docs/` の既存の告知メモ（`docs/ORIGIN-TRK-NEXUS-2026-11-02.md` §告知）を流用できます

---

## 6. 困ったとき

| 症状 | 原因の候補 | 手当て |
| --- | --- | --- |
| `make-stable` が「git ls-files が失敗」 | `--repo=` の先が git リポジトリでない | clone し直す（`.git` が要ります） |
| 上流の `npm run check` が落ちる | 上流だけにあるファイルが混ざった／`--no-flip` を使った | もう一度 `--apply`（`--prune` 無し）で当て直し、差分を見る |
| 鏡のあと `/trk/` が真っ白 | `sw.js` の `CACHE` 名だけ変えて中身が古い、など | DevTools でキャッシュを消して再読み込み→それでも駄目なら PR を revert |
| 戻したい | — | PR を `gh pr revert` するか、`git revert` で 1 本戻す（鏡は冪等なので、次に当て直せば同じ形に戻ります） |

---

## 7. こちらの準備状況

| もの | 状態 |
| --- | --- |
| `tools/make-stable.mjs` | ✅ 2026-11-02 に dry-run・`--apply`・上流 `npm run check` まで実測（§2 の表） |
| `tools/backport-trk-scope-tag.mjs` | ✅ `--check` で ①〜④ が当たることを実測（§3 の表） |
| 鏡の検査が赤くなる 1 件 | ✅ trk257 で修正（README の `trk-PWA`/`trk` を origin から決めるようにした。**直す前は鏡でだけ 1 件落ちました**） |
| `/trk/` の初回更新の材料 | ✅ この手順書＋trk259 の中身（ZIP と返事は Drive の 1 か所） |

# 📄 2026-11-02 レビュー（`trk-Nexus-review-2026-11-02.zip`）への回答

いただいた 5 枚（`00-まず読む`／`01-レビュー`／`02-求められている操作への回答`／`03-trk-Avatar-Library-への返事`／`04-実機の通し-記録シート`）への回答です。**指摘はすべてこの倉庫の実物と GitHub API で確かめてから**、入るものを trk253 に入れました（`main` は PR 経由）。

## 1. 検証結果（実測したか）

| 指摘 | 確かめ方 | 結果 |
| --- | --- | --- |
| 必須1（上流の保存が同一オリジンを消す） | 上流 `06cef87` を clone して `js/core.js:406` を確認＋`uiScale`・`uiMode`・`playerBar`・`typography`・`uiDensity` を grep | **そのとおり**（5語とも上流 `core.js` で **0件**）。patched の実物2関数を抜いた再現で、直し前は `soundOn,volume` だけになって相手の項目が消え、④後は全部残ることを確認 |
| 必須2（移転転送が切れている） | `GET /repos/Tonbokiri…/trk-PWA`・`…/trk-Avatar-Library` | **そのとおり**（両方 `size=0` の空リポジトリが同名で存在・`pages=false`）。`trk` だけが 301 生存 |
| 必須3（「雑誌の飾り」の説明と実物） | `trk-Avatar-Library` の `catalog/typography.json` と `js/typography.js` を付き合わせ | **そのとおり**（`why` は「ひな明朝の見出し」、実物の `heading` は `TrkKaiseiDecol` 400。`hina-mincho.stpack` は目録にあるが**この組のパック一覧に入っていない**） |
| 必須4（告知先） | `docs/ORIGIN-TRK-NEXUS-2026-11-02.md` §4 を読む | **そのとおり**。trk-PWA は開発版なので、一般向けは安定版 `/trk/` に書き分け。安定版の初回更新＋実機確認まで告知しない、で同意 |
| 推奨 C-1（個人 Pages は生存） | `GET /repos/Tonbokiri…/SHADOW-TAIKO` と `/pages` | **そのとおり**（`has_pages=true`・`status=built`・URL は `.../SHADOW-TAIKO/`）。こちらの「Pages が1つも残っていない」は**誤り**だったので訂正 |
| 推奨 C-2（`preset` が甘い） | `js/typography.js:47` と呼び出し側を grep | **そのとおり**（アプリは段階に4つしか書き込まないので、役の名前を通す理由がない）。限定しました |
| 推奨 A-2（IDB の版） | 両リポジトリの `IDB_VERSION` | **一致を確認**（両方 `2`）。約束として HANDOFF §3 に2行追記 |
| 推奨 A-3（App の権限は `trk` だけで足りる） | `POST /repos/Trk-Nexus/trk/git/refs`（403）・`…/trk-PWA/git/refs`（OK）・`…/trk-Avatar-Library/git/refs`（**403**） | **同意**。`trk` だけ追加が最小。**Avatar-Library も範囲外**なので、そちらへの修正もPR代行できません（§3） |

## 2. trk253 で入れたもの

- **道具に④を足した**（`tools/backport-trk-scope-tag.mjs`）：上流 `js/core.js` の `saveUserPrefs()` を「いま保存されている値に重ねる」方式に。工場出荷リセット2か所には `{ fresh: true }` を渡す。**上流 main `06cef87` に素で当てて上流自身の `npm run check`（tests 747 pass / 0 fail）**、二重適用はスキップ、`--check` は無変更
- **🔤「雑誌の飾り」の説明を実物に合わせた**（`js/typography.js`）：「飾り明朝の題字と見出しに、しっぽり明朝の本文。紙の雑誌の感じ」。**目録側の `why` も同じ食い違い**なので、Avatar-Library 側で直してもらわないと写しがまたずれます（推奨 C-3 と同じ話）
- **`preset` を契約の4段階に限定**（`PRESETS` を公開）＋検査3本（段位の限定／説明に書いた書体を実際のパックに持っているか／雑誌の飾りの実物）。`tests/trk246-typography.test.mjs` は **19件**、`npm run check` は **1280 pass / 0 fail**
- **`tools/make-stable.mjs`（新規）**：推奨 A-1 の「安定版を切る」道具。上記の実測どおり。付随して `tests/trk165`・`tests/trk223-review` のスコープ印の検査を `mine`/`theirs` の中立な名前に（「相手は `/trk/`」前提だと、住所を反転した途端に**自分と相手の区別が消えて**落ちるため）
- **docs**：`ORIGIN.md` §7・§7.1（Pages 生存の訂正・④・同居の実害と実機確かめ方・救出案は `SHADOW-TAIKO` に1枚）、`ORIGIN-TRK-NEXUS-2026-11-02.md` §4/§6（告知の書き分け・権限は `trk` だけ追加）、`UPSTREAM-TRK-SCOPE-TAG-2026-11-02.md` §1.5（④の根拠と再現表）、`HANDOFF.md`（trk253 の行＋§3 に同居の約束2行）
- `sw.js` のコメントにあった「上流には trk252 の PR で入れた」趣旨の記述は**事実に合わないので訂正**（PR は未作成・道具が置き場所）

## 3. 入らなかったもの／他リポジトリ側の話

| 項目 | 状態 |
| --- | --- |
| 必須2-①（`trk-Avatar-Library` の `2026-11-02-組織の引っ越し.md` §1・§3「旧URLは転送される」の訂正） | **未適用**。このセッションの App は `Trk-Nexus/trk-Avatar-Library` にも ref を作れません（実測 403）。r9 の URL 統一に合わせるのが早いので、**この文書への差し替え指示として先方へ渡す**のが妥当 |
| 必須3（目録 `catalog/typography.json` の `why`） | 同上（アプリ側の写しは trk253 で修正済み） |
| 推奨 B-1〜B-9（README の MB 統一・はじめての3手順 ①③・用途に「trk! では」1行・縮刷版の見出し表記・「電子ゲーム」の見本文・「余白の書体」の言い換え・タグの語・`release-set` の Run workflow・`TRK_PWA_REF` を trk252 以降へ） | **未適用**（同リポジトリ）。内容自体は同意。B-4（Run workflow で書き込み権限を試す）は**空さんの手なら今すぐ2分**でできます |
| C-1（個人側の空リポジトリ2本に墓標 README） | **空さんの手**（このセッションの倉庫ではない）。**消さない**で、移転先URLを1行置くだけ。文言はレビュー §B-5 のものを使えます |
| 推奨 A-1（「安定版を切る」を道具にする） | **trk253 に入れました**：`tools/make-stable.mjs`。追跡ファイル497点（`tools/`・`tests/` も含む鏡）を上流クローンへ写し、`trk-PWA`→`trk`（スコープ印 `trk-pwa`→`trk` も）を反転して差分を出す。**既定は見るだけで、`--apply` で書き込み＋`git add -A`（上流の検査は `git ls-files` を見ます）**、`--prune` で上流専用ファイルも削除、`--cache=` で版名。**push・PR はしません**（main に直接 push しないが約束）。実測：上流 main をミラーにして**上流側の `npm run check` = 1280 pass / 0 fail**、二重適用は 追加0・更新0。道としては **①④を上流へ別当てもなく運べる**ので、安定版の初回更新はこちらが本筋になります（`backport-trk-scope-tag.mjs` は「上流を触らず直す」用のまま残す） |
| 実機の通し（記録シート §1・§2・§3・§4） | **空さんの手**。特に §3（同居）は④が要るかの実地確認になります |

**2026-11-02 午後の追記（返事15 で先方が r9 を出した）**：必須3は**先方がデータ側で直した**（雑誌の飾りの見出しを `TrkHinaMincho` 400 にし、`hina-mincho.stpack` をその組のパックに追加）。こちら trk254 で写しを目録から生成する形に作り直し、r9 を反映しました（trk253 の説明変更は目録どおりに戻した）。推奨 C-3（写しが倉庫の固定版と同じかを見る検査）も `tests/trk254-typography-copy.test.mjs` ＋ `tools/sync-typography-catalog.mjs --against=main --check` として入れました。B-9 の `TRK_PWA_REF` は `d93d98b`（trk252 まで）に上がっていることを実測（`trk-Avatar-Library/.github/workflows/check.yml:18`）。

## 3.5 判断メモ（2026-11-02・空さん）

**上流 `trk` への適用（①〜④・安定版の初回更新）は「trk-PWA が完成してからの材料」**と判断しました。なので：

- PR は打ちません（App に `trk` を足す依頼も取り下げ）。`tools/backport-trk-scope-tag.mjs`（①〜④）と `tools/make-stable.mjs`（鏡）とこの文書は**置いておく**だけ
- trk-PWA 側の自衛（trk252 の `trkPWA-` 接頭辞／trk247 の「足すだけ」保存）で**うちは壊れない**ので、実害待ちで構いません
- 実機確認と PWA の仕上げが終わったら、①〜④または鏡のどちらかで上流へ流す（順序は `ORIGIN-TRK-NEXUS-2026-11-02.md` §6 と `UPSTREAM-TRK-SCOPE-TAG-2026-11-02.md`）

## 4. 判断項目への答え（レビュー §4 の表に対するこちらの見解）

1〜9 の答え案は**すべて同意**です。追加で1つだけ補足：

- **②の権限**は `trk` **と** `trk-Avatar-Library` を足すと、こちらで両方に PR まで出せます（目録の `why`・転送の記述・README の数字ゆれまで一気に片付く）。最小権限の考え方はそのまま（All repositories にはしない）
- **③の救出**は「しない」維持。ただし `SHADOW-TAIKO` が生きているので、必要になったときのコストは「1枚置く」だけで済みます

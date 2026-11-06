# ブラウザー確認（smoke）の立て方

`npm run check` には入っていません（Chromium が要るため）。手で動かす確認です。

## 1. 準備（一度だけ。リポジトリの外に入れる）

```bash
mkdir -p /tmp/browser && cd /tmp/browser
npm install --silent @sparticuz/chromium@141 puppeteer-core@24
```

Chromium の共有ライブラリ（libnspr4・libnss3 など）は、`@sparticuz/chromium` に同梱の `al2023.tar.br` を展開して得る。

```bash
mkdir -p /tmp/al2023x && cd /tmp/al2023x
node -e 'const fs=require("fs"),z=require("zlib");fs.writeFileSync("al2023.tar",z.brotliDecompressSync(fs.readFileSync("/tmp/browser/node_modules/@sparticuz/chromium/bin/al2023.tar.br")))'
tar -xf al2023.tar        # → /tmp/al2023x/lib/libnspr4.so など
```

## 2. アプリを配る（別のプロセスで、起動したままにする）

```bash
cd /home/user/trk-PWA
python3 -m http.server 8770 --bind 0.0.0.0
```

（この環境では `start_process` で起動すると、プレビューとしても見られる。）

## 3. 確認を走らせる

```bash
cp /home/user/trk-PWA/tools/smoke/remodern-dialog-smoke.mjs /tmp/browser/smoke.mjs
cd /tmp/browser
LD_LIBRARY_PATH=/tmp/al2023x/lib timeout 170 node smoke.mjs
```

- 所要時間は約 30 秒。
- 期待される結果：`base dialog` と `study dialog` の `open` が `true`・`modal` が `true`・幅と高さが 0 より大きい。`after close` は `open: false`。`page errors` は 0。
- スクリーンショットは `/home/user/smoke-1280.png` と `/home/user/smoke-390.png` に出る。

## 注意（つまずいた点）

- `cwd` に指定したフォルダーが存在しないと、ツールが `shell_error` を返す（コマンドは動いていない）。先に作る。
- `/tmp` の中身は途中で消えることがある。消えたら 1 からやり直す。
- Chromium が「libnspr4.so が無い」と言う → `LD_LIBRARY_PATH` の指定を忘れている。
- 日本語が□に化ける → この環境に CJK フォントが無いだけ。レイアウトの確認には影響しない（文字の見た目は実機で見る）。
- 1 つのブラウザーで 2 ページ目を開くとクラッシュすることがあるので、画面サイズごとに起動し直す（smoke.mjs はそうしている）。
- 学習室を開くと「キー操作のヘルプ」が出る場合がある。スクリーンショットに映ったら、ダイアログとは別の画面。

## 4. 作品の色（trk305・共通の題字）

`tools/smoke/remodern-paint-smoke.mjs` を使う。手順は 3 と同じ（`cp` して `/tmp/browser` で `LD_LIBRARY_PATH=/tmp/al2023x/lib node` で動かす）。

- 期待される結果：`before` は色が空、`applied` は `text` の色（`rgb(224, 232, 255)`）、「!」（span）は空（対比が足りないので当てない）、`cleared` は両方空。`errors` は 0。
- 実行は数秒〜数分。ブラウザーの終了待ちで止まる問題は、スクリプトの末尾で直接止めて避けている（trk306）。
- スクリーンショットは `/home/user/smoke-paint.png`。

## 5. スキンを変えたときの題字（trk306）

`tools/smoke/remodern-paint-skin-smoke.mjs`。作品を選んでから、明るい通常のスキン（最初に見つかったもの）に変え、暗いスキンに戻す。

- 期待される結果：`applied` は文字色が当たる。`afterLight` は文字色が空（読めないので既定へ戻る）。「!」の色は、明るい背景で対比が足りるなら残ってよい。`backDark` は文字色がもう一度当たる。`errors` は 0。
- 手順は 3 と同じ（`cp` して `/tmp/browser` で `LD_LIBRARY_PATH=/tmp/al2023x/lib node` で動かす）。

## 6. 登録簿との照合（trk307）

`tools/smoke/remodern-registry-smoke.mjs`。作品の ID が登録簿（同梱の写し）に無いときは「未確認」、有るときは「登録済み」になるかを見る。

- 期待される結果：`A_empty_registry` は `label` に「（unverified）」（日本語では「（未確認）」）が付き、`title` は空。`B_registered` は `label` に印が付かず、`title` に色が入る。`errors` は 0。
- 登録簿の差し替えは、ページの読み込み時だけ（同梱の写し `data/re-modern-registry.json` は変えない）。
- 手順は 3 と同じ（`cp` して `/tmp/browser` で `LD_LIBRARY_PATH=/tmp/al2023x/lib node` で動かす）。


## 7. 書斎への適用と「戻す」（trk308）

手で動かす（`npm run check` には入れない）。`tools/smoke/remodern-apply-smoke.mjs`。

```sh
mkdir -p /tmp/browser && cd /tmp/browser   # 6 の手順で @sparticuz/chromium と puppeteer-core を入れておく
cp /home/user/trk-PWA/tools/smoke/remodern-apply-smoke.mjs /tmp/browser/apply-smoke.mjs
LD_LIBRARY_PATH=/tmp/al2023x/lib timeout 170 node apply-smoke.mjs
```

見ること：選んだだけでは変わらない → 適用で書斎が変わる → 他の領域は変わらない → 戻すで直前へ → 適用後に変えていれば戻さず競合 → リセットで直前の記録も消える。エラーなし。期待は **11 OK / 0 NG**。

## 8. 未確認の作品の題字（開発用の受け子・trk309）

手で動かす（`npm run check` には入れない）。`tools/smoke/remodern-dev-paint-smoke.mjs`。

```sh
cp /home/user/trk-PWA/tools/smoke/remodern-dev-paint-smoke.mjs /tmp/browser/dev-smoke.mjs
cd /tmp/browser && LD_LIBRARY_PATH=/tmp/al2023x/lib timeout 170 node dev-smoke.mjs
```

見ること：既定では未確認の作品は題字に当たらない → `window.TrkReModernDev.setUnverifiedPaint(true)` で当たる → `false` で戻る。期待は **6 OK / 0 NG**（trk310 で、印の表示とオフのボタンを足した）。

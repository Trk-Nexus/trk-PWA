trk! — 手渡し用ビルド（trk272＝スキン 77 種・🧙 Wizard 24 種・⌨ 端末（trk CLI）入り。実機の記録はこの箱の 1 枚にまとめてあります）
================================================================

レビューと実機確認のために、そのまま動かせる形にしたZIPです。
公式の配布版ではなく、確認用のビルドです（版の番号は付けていません）。

このZIPのファイル数と sha256 は、ZIPの**外側**にある `00-まず読む.txt` / `SHA256SUMS-*.txt` に書いてあります。
（この文書はZIPの中に入るので、自分のZIPのハッシュをここに書くと、固めた瞬間に古くなります。trk224 の F2）

このZIPは `node tools/pack-standalone.mjs` で作れます（リポジトリの中身から、
git が追跡しているファイルだけを集めます）。


■ 開き方（2通り）

1. いちばん簡単: このフォルダの index.html をダブルクリックする。
   入口が trk-files/index.html へ進みます（ゲーム・譜面・プレーヤー・書斎・端末が動きます）。

2. オフラインも試す: ローカルサーバーで開く（Service Worker は file:// では動きません）。
       cd <このフォルダ>
       python3 -m http.server 8000
   ブラウザで http://127.0.0.1:8000/ を開く → 一度読み込めば、機内モードでも起動します。

   ※ 保存データ（曲・設定・記録）は「開き方」ごとに別です。
      file:// と http://127.0.0.1:8000/ は別のオリジンなので、データは共有されません。
      公開URLとも別です。


■ 中身

    index.html   … 入口（trk-files/index.html へ進むだけ）
    README.txt   … この文書
    trk-files/   … アプリ本体（リポジトリと同じ中身）

    trk-files/ の中: index.html / sw.js / manifest.webmanifest / css/ / js/ /
                     assets/（同梱ライブラリ・MMDのプリセットモデル・チュートリアル曲）/
                     icons/ / docs/guide/（利用者向けの説明）/ LICENSE / NOTICE.md など

    見る順番の 1 枚（このZIPにも入っています）:
        docs/DEVICE-CHECK-TRK265-271-2026-11-03.md
      … trk265〜trk271 の「まだ実機で見ていないこと」を 1 枚にまとめた記入式の表です。
        日付・端末・結果を書き込んで返してください（必須は 8 件だけです）。


■ この版で入っているもの（trk255〜trk272 の要点）

    trk255  アプリの更新の知らせ（あとで／眠らせる）と、更新の取りこぼし対策
    trk259  書斎（📚）— 端末の中の曲を読む・探す・試聴する
    trk260  起動の直し（最初の画面が出ないことがあった）
    trk261  ❓謎設定の整理（初期値・3種・音まわり・1回だけ）
    trk262  字幕の自動生成まわり（both／four／pos_size／doc）
    trk263  動画の小窓（PiP）の詰め（manual_only／keep_volume／hide_notice）
    trk264  動画キーの説明と、押せない理由の見える化
    trk265  小窓の終了の直し（M1）・理由の 1 行・ホーム画面アプリの扱い
    trk266  Firefox の「非対応」表示・連打の重複・説明文に Dock
    trk267  ⌨ ターミナル（trk CLI）— 10 のコマンド＋repeat/shuffle・Ctrl+`
    trk268  CLI 用スキンの受け口（cat に wizard/cli/console・cli の見た目）
    trk269  端末の定番（pwd/cat/grep/history/clear/echo/bell/man・別名 ls/cd/dir）と
            操作感 5 つ（cursor/opacity/history/completion/bell）・検査の道具
    trk270  🧙 Wizard のスキンを **24 種**に（棚の「🧙 Wizard」）
    trk271  目録・生成物（.js）・検査の道具 v3 を受ける（スキンの値は変えていません）
    trk272  この README と実機の 1 枚・UX 改修の許諾のお願い（アプリ本体は変えていません）

    スキンは **77 種**（本体 49＋ミク 4＋Wizard 24）。うち ⌨ を名乗るのは **12 種**です。


■ 何を見てほしいか

    まず `docs/DEVICE-CHECK-TRK265-271-2026-11-03.md` の §2（必須 8 件）を見てください。
    要点だけ書くと:

      ・▶ で動画の曲 → 📌（画中画）。**1 回目で出たか／2 回目で出たか**を書いてください
      ・小窓を出した状態で、案内の「📌 画中画を終了」→ 小窓が閉じ、ボタンが戻ること
      ・ホーム画面のアプリでは 📌 が押せない。**ボタンの下に理由の 1 行**が見えること
      ・⚙ →「⌨ ターミナル」→ 開く。`help` → `play 2` → `skin wizard-void` → 閉じる
      ・スキンの棚に「🧙 Wizard」が **24 枚**並び、`wizard-hermetic`（明るい紙）で文字が読めること
      ・端末でわざと打ち間違えて、⚙ の「エラーの音」を外すと鳴らなくなること
      ・スマホ幅で端末を開いても、入力欄と合図の記号が崩れないこと

    見つけた点は、**端末・OS・ブラウザ・拡大率・スキン名**を添えて教えてください。


■ 入っていないもの（開発用）

    tests/  tools/  .github/  package.json  capacitor.config.ts など、
    それと開発者向けの文書（HANDOFF 類・MIGRATIONS・PLAN/VIEWER/SKIN-RETURN 類）。

    実機で見てくださる人向けの文書は、あえて入れています:
    docs/DEVICE-CHECK-TRK265-271-2026-11-03.md（この版の記入式 1 枚）／
    docs/VIEWER-TRK267-2026-11-03.md（端末の見どころ C-1〜C-8）／
    docs/VIEWER-TRK270-2026-11-03.md（Wizard 24 種の見どころ F-1〜F-5）／
    docs/REVIEW-REQUEST-TRK223-2026-10-31.md（見る順番と期待）／
    docs/LIBRARY-UX-PLAN-2026-11-01.md（倉庫まわりの開発案と、この版で入れたこと）／
    docs/LIBRARY-TRK230-2026-10-31.md（倉庫の目録から入れる）／
    docs/SKIN-SHELF-TRK229-2026-10-31.md（スキンの棚の整理）／
    docs/FONT-SKINS-TRK228-2026-10-31.md（書体スキン9種）／
    docs/PLAYER-BAR-TRK227-2026-10-31.md（リピートの段・シャッフルの範囲）／
    docs/PLAYER-BAR-TRK226-2026-10-31.md（バーでシーク・シャッフル・リピート・別窓パネル）／
    docs/PLAYER-BAR-TRK225-2026-10-31.md（下の再生バーの置き場所・隠さない設定）／
    docs/REVIEW-FIX-TRK224-2026-10-31.md（レビューで直したこと）。
    ソース一式はリポジトリから:
        https://github.com/Trk-Nexus/trk-PWA


■ 動く環境

    Chrome / Edge / Safari / Firefox の最近のもの。
    ファイルの取り込み（フォルダー共有・書斎のフォルダ読み）は Chrome 系の
    File System Access API が要ります（Safari・Firefox では出ません）。
    Service Worker（オフライン起動・ホーム画面追加）は https か localhost でだけ動きます。
    再生バーの拡大（CSS の zoom）は Firefox 126 以降・Safari 16 以降で効きます。
    効かないブラウザでは、バーが拡大されないだけで、ほかの機能は変わりません。
    ⧉（操作パネルを別窓に出す）は Document PiP が使えるブラウザ
    （Chrome／Edge 116 以降、Firefox 151 以降）では常に手前の小窓、
    それ以外（Safari など）では普通の小窓になります。スマホ型では ⧉ を出しません。
    動画の小窓（📌）は Safari（iPhone／iPad はホーム画面のアプリを除く）と Chrome／Edge。
    端末（⌨）のカーソルの形は一部のブラウザだけ、エラーの音（ピン）は
    音を出す設定がオンのときだけ鳴ります（音のファイルは増やしていません）。


■ 確かめたこと・確かめていないこと

    npm run check               1548 pass / 0 fail（trk272 時点）
    node tools/check-repo.mjs   0 failure / 0 warning
    node tools/check-cli-skin.mjs <目録>   … 受け取る前の検査（助言の道具）
    node tools/import-skin-catalog.mjs --check … スキンの生成物が目録どおりか

    実ブラウザ・実機での見た目と操作感は未確認です
    （作業環境にブラウザも端末もないため）。
    `docs/DEVICE-CHECK-TRK265-271-2026-11-03.md` に書き込んで返してください。

    ※ このZIPには tests/ と tools/ を入れていないので、上の 2 つの道具は
      リポジトリ（https://github.com/Trk-Nexus/trk-PWA）で実行してください。


■ ライセンス

    GPL-3.0-or-later。LICENSE と NOTICE.md を見てください。
    クレジットとソースは保持してください（同梱ライブラリの権利は NOTICE.md にまとめています）。

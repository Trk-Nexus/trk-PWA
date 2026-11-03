trk! — 手渡し用ビルド（trk273＝スキン 77 種・🧙 Wizard 24 種・⌨ 端末（trk CLI）入り。実機の記録はこの箱の 1 枚にまとめてあります）
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
      … trk265〜trk272 の「まだ実機で見ていないこと」を 1 枚にまとめた記入式の表です。
        日付・端末・結果を書き込んで返してください（必須は 8 件だけです）。


■ この版で入っているもの（trk255〜trk273 の要点）

    （この一覧は docs/HANDOFF.md §7 の見出しから作る: node tools/readme-versions.mjs --write）

    trk255  小粒の仕上げ（判断項目 U1〜U7）
    trk256  小粒のセット A／配布物 B
    trk257  r10 を受けての洗い出しと、実機・上流の手順書
    trk258  r10 の受け皿（R3・R4・R5・2026-11-02）
    trk259  レビュー（trk-Nexus-review-trk258-2026-11-02）の推奨 3 点を手当て
    trk260  開いた直後が「枠だけ・文字なし・ボタンが効かない」を修正
    trk261  シンセの鍵盤を 25／49／61／88 鍵に、MIDI キーボードに対応
    trk262  映像の操作パネルの出かたと、字幕の置き場所・大きさ
    trk263  画中画をメディアプレーヤーの外でも残す・画中画の間は映像を隠す
    trk264  Safari でも画中画を使えるようにする
    trk265  trk264 レビューの手当て
    trk266  trk265 レビューの小さな推奨
    trk267  trk CLI（Wizard のターミナル）— Skin 側の設計書 v0.1 のフェーズ C
    trk268  CLI 用スキンの受け口
    trk269  端末の定番コマンドと Wizard のスキン 12 種
    trk270  Skin 側の返事を受けて Wizard を 24 種に
    trk271  Skin 側から届いた 3 ファイル（目録・生成物・検査の道具）を受ける
    trk272  README を今の姿に・実機の項目を 1 枚に・/trk/ の許諾の文面
    trk273  レビュー（M1〜M3・R1〜R3）を反映して、送る前の文面を整える
    trk274  巻別スキン 291 種の受け皿と、画面の手当て 4 つ
    trk275  trk274 のレビュー（必須 M1〜M3・推奨 R1〜R9・Q1〜Q4）を反映
    trk276  📚（巻から選ぶ）をキーで動かす — アサイン・使わない・縦読み

    スキンは 77 種（本体 49＋ミク 4＋Wizard 24）。うち ⌨ を名乗るのは 12 種です。

    ※ この束は**開発版**です。安定版 `/trk/` はいま **trk219**（`trk-v2026.10.29-trk219`）で止まっています。
      そこから先の trk220〜trk273（書体の 14 組・画中画まわり・端末 ⌨・Wizard 24 種 など）は、
      `/trk/` にはまだ入っていません（入れ替えはリポジトリの持ち主の判断待ちです）。


■ 何を見てほしいか

    まず `docs/DEVICE-CHECK-TRK265-271-2026-11-03.md` の §2（必須 8 件）を見てください。
    要点だけ書くと:

      ・▶ で動画の曲 → 📌（画中画）。1 回目で出たか／2 回目で出たかを書いてください
      ・小窓を出した状態で、案内の「📌 画中画を終了」→ 小窓が閉じ、ボタンが戻ること
      ・ホーム画面のアプリでは 📌 が押せない。ボタンの下に理由の 1 行が見えること
      ・⚙ →「⌨ ターミナル」→ 開く。help → play 2 → skin wizard-void → 閉じる
      ・スキンの棚に「🧙 Wizard」が 24 枚並び、wizard-hermetic（明るい紙）で文字が読めること
      ・端末でわざと打ち間違えて、⚙ の「エラーの音」を外すと鳴らなくなること
      ・スマホ幅で端末を開いても、入力欄と合図の記号が崩れないこと

    見つけた点は、端末・OS・ブラウザ・拡大率・スキン名を添えて教えてください。


■ 入っていないもの（開発用）

    tests/  tools/  .github/  package.json  capacitor.config.ts など、
    それと開発者向けの文書（HANDOFF 類・MIGRATIONS・PLAN/VIEWER/SKIN-RETURN/LETTER 類）。

    実機で見てくださる人向けの文書は、あえて入れています:
    docs/DEVICE-CHECK-TRK265-271-2026-11-03.md（この版の記入式 1 枚）／
    docs/VIEWER-TRK267-2026-11-03.md（端末の見どころ C-1〜C-8）／
    docs/VIEWER-TRK270-2026-11-03.md（Wizard 24 種の見どころ F-1〜F-6）／
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

    npm run check               （この束を作った時点の記録）
    node tools/check-repo.mjs   0 failure / 0 warning
    node tools/check-cli-skin.mjs <目録>   … 受け取る前の検査（助言の道具）
    node tools/import-skin-catalog.mjs <目録.json> --check … スキンの生成物が目録どおりか
    node tools/readme-versions.mjs --check     … この一覧が HANDOFF と合っているか

    実ブラウザ・実機での見た目と操作感は未確認です
    （作業環境にブラウザも端末もないため）。
    `docs/DEVICE-CHECK-TRK265-271-2026-11-03.md` に書き込んで返してください。

    ※ このZIPには tests/ と tools/ を入れていないので、上の道具は
      リポジトリ（https://github.com/Trk-Nexus/trk-PWA）で実行してください。


■ ライセンス

    GPL-3.0-or-later。LICENSE と NOTICE.md を見てください。
    クレジットとソースは保持してください（同梱ライブラリの権利は NOTICE.md にまとめています）。

// SPDX-License-Identifier: GPL-3.0-or-later
/* 🧙 ウィザードのスキン（trk269・Skin 側の目録から生成）

   出どころ：trk-Avatar-Library の `catalog/skins.json`（wizard カテゴリ・cli あり）
   作り方：node tools/import-skin-catalog.mjs <目録.json> --cat=wizard --cli-only --out=js/skins-wizard.js
   ・手で直さないでください（次の取り込みで消えます）。直すときは目録側（Skin 側）で。
   ・このファイルは data.js の後・core.js の前に読みます（起動時のスキン復元より先に要るため）。
   ============================================================================ */
"use strict";
(() => {
  const S = window.Trk && window.Trk.data && window.Trk.data.SKINS;
  if (!S) return;   /* data.js が無い（別の読み込み方）ときは何もしない */
  S["wizard-arcane"] = {
    cat:["wizard","fun","grad"],
    font:"\"Cinzel\",\"Trajan Pro\",serif",
    type:{"title":"\"Cinzel\",serif","weight":"700","lh":"1.5","titleWeight":"800","titleSpace":".1em","titleTransform":"uppercase","mark":"✧ ARCANE ✧"},
    label:{"ja":"アーケイン","en":"Arcane","zh":"奥秘","ko":"신비"},
    desc:{"ja":"神秘の魔法陣、発光する古代文字","en":"Mystic magic circle, glowing ancient script","zh":"神秘魔法阵，发光的古代文字","ko":"신비한 마법 진, 빛나는 고대 문자"},
    ui:{"--ui-bg":"#1a052e","--ui-panel":"rgba(26,5,46,0.96)","--ui-soft":"rgba(0,255,255,0.05)","--ui-text":"#00ffff","--ui-muted":"#b39ddb","--ui-border":"rgba(255,0,255,.35)","--ui-button":"#3d154e","--ui-button-hover":"#353365","--ui-field":"#2d0a3e","--ui-accent":"#ff00ff","--ui-on-accent":"#000000","--ui-gold":"#00ffff","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,0,255,0.14)"},
    game:{"don":"#ff00ff","ka":"#74b9ff","stage":"#2d0a3e","lane":"rgba(26,5,46,0.6)","track":"rgba(0,255,255,0.24)","ink":"#00ffff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,5,46,0.95)","perfect":"#00ffff","good":"#00ffff","miss":"#0c8fa1","glow":false},
    shapes:["circle","diamond"],
    video:"hue-rotate(280deg) saturate(1.6) brightness(.8) contrast(1.3)",
    cli:{"font":"Cinzel, Trajan Pro, serif","prompt":"✦","caret":"#ff00ff","scan":0.18}
  };
  S["wizard-cli"] = {
    cat:["wizard","dark","access"],
    font:"\"Courier New\",\"Courier\",monospace",
    type:{"title":"\"Courier New\",monospace","weight":"600","lh":"1.3","titleWeight":"700","titleSpace":".03em","mark":"> cast spell"},
    label:{"ja":"ウィザードCLI","en":"Wizard CLI","zh":"巫师命令行","ko":"마법사 CLI"},
    desc:{"ja":"黒い端末に白い呪文、コマンドライン魔術","en":"Black terminal with white spells, command line wizardry","zh":"黑色终端上的白色咒语，命令行巫术","ko":"검은 터미널의 하얀 주문, 명령줄 마법"},
    ui:{"--ui-bg":"#050505","--ui-panel":"rgba(3,20,6,0.96)","--ui-soft":"rgba(224,224,224,0.05)","--ui-text":"#e0e0e0","--ui-muted":"#8fd79a","--ui-border":"#d4af37","--ui-button":"#1a1a1a","--ui-button-hover":"#343434","--ui-field":"#0a0a0a","--ui-accent":"#d4af37","--ui-on-accent":"#000000","--ui-gold":"#ffffff","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#666666","stage":"#0a0a0a","lane":"rgba(3,20,6,0.6)","track":"rgba(224,224,224,0.24)","ink":"#e0e0e0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(3,20,6,0.95)","perfect":"#ffffff","good":"#e0e0e0","miss":"#7d7d7d","glow":false},
    shapes:["square","square"],
    video:"contrast(1.2) brightness(.85)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"λ","caret":"#39ff14","scan":0.12}
  };
  S["wizard-console"] = {
    cat:["wizard","dark","fun"],
    font:"\"Press Start 2P\",\"Courier New\",monospace",
    type:{"title":"\"Press Start 2P\",monospace","weight":"400","lh":"1.25","titleWeight":"700","titleSpace":".04em","titleTransform":"uppercase","mark":"KEYPRESS"},
    label:{"ja":"ウィザードコンソール","en":"Wizard Console","zh":"巫师控制台","ko":"마법사 콘솔"},
    desc:{"ja":"打鍵感を重視したコンソール、CRTのざらつきと魔法の輝き","en":"Console emphasizing keystroke feel, CRT grain and magical gl","zh":"强调敲击感的控制台，CRT颗粒感与魔法光芒","ko":"타건감을 중시한 콘솔, CRT의 거친 느낌과 마법의 광채"},
    ui:{"--ui-bg":"#050505","--ui-panel":"rgba(3,20,6,0.96)","--ui-soft":"rgba(0,255,0,0.05)","--ui-text":"#00ff00","--ui-muted":"#66ff66","--ui-border":"rgba(57,255,20,.30)","--ui-button":"#1a1a1a","--ui-button-hover":"#173817","--ui-field":"#0a0a0a","--ui-accent":"#39ff14","--ui-on-accent":"#000000","--ui-gold":"#66ff66","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(57,255,20,0.14)"},
    game:{"don":"#39ff14","ka":"#00cc00","stage":"#0a0a0a","lane":"rgba(3,20,6,0.6)","track":"rgba(0,255,0,0.24)","ink":"#00ff00","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(3,20,6,0.95)","perfect":"#66ff66","good":"#00ff00","miss":"#028f02","glow":false},
    shapes:["square","square"],
    video:"saturate(1.6) contrast(1.3) brightness(.85) hue-rotate(110deg)",
    cli:{"font":"Courier New,Courier,monospace","prompt":"λ","caret":"#39ff14","scan":0.2}
  };
  S["wizard-grep"] = {
    cat:["wizard","fun","access"],
    font:"\"Courier New\",\"Courier\",monospace",
    type:{"title":"\"Courier New\",monospace","weight":"600","lh":"1.3","titleWeight":"700","titleSpace":".03em","titleTransform":"uppercase","mark":"grep"},
    label:{"ja":"ウィザード・グレップ","en":"Wizard Grep","zh":"巫师搜索","ko":"마법사 검색"},
    desc:{"ja":"テキスト検索・マッチ強調・黄色マーカー","en":"Text search, match highlight, yellow marker","zh":"文本搜索，匹配高亮，黄色标记","ko":"텍스트 검색, 일치 강조, 노란색 마커"},
    ui:{"--ui-bg":"#0a0a0a","--ui-panel":"rgba(26,26,46,0.96)","--ui-soft":"rgba(248,248,242,0.05)","--ui-text":"#f8f8f2","--ui-muted":"#bd93f9","--ui-border":"rgba(255,255,0,.30)","--ui-button":"#1a1a2e","--ui-button-hover":"#373747","--ui-field":"#0a0a0a","--ui-accent":"#ffff00","--ui-on-accent":"#000000","--ui-gold":"#ffff00","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,255,0,0.14)"},
    game:{"don":"#ff79c6","ka":"#bd93f9","stage":"#0a0a0a","lane":"rgba(26,26,46,0.6)","track":"rgba(248,248,242,0.24)","ink":"#f8f8f2","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,26,46,0.95)","perfect":"#ffff00","good":"#f8f8f2","miss":"#8d8d8a","glow":false},
    shapes:["square","square"],
    video:"saturate(1.4) contrast(1.2) brightness(.9)",
    cli:{"font":"Courier New,Courier,monospace","prompt":"?","caret":"#ffff00","scan":0.1}
  };
  S["wizard-grimoire"] = {
    cat:["wizard","life","grad"],
    font:"\"Trajan Pro\",\"Garamond\",\"Noto Serif JP\",serif",
    type:{"title":"\"Trajan Pro\",serif","weight":"400","lh":"1.75","titleWeight":"600","titleSpace":".05em","mark":"あア漢 Aa 12"},
    label:{"ja":"魔導書","en":"Grimoire","zh":"魔导书","ko":"마도서"},
    desc:{"ja":"古びた魔導書、革製表紙と金箔文字","en":"Ancient grimoire, leather cover and gold foil lettering","zh":"古旧魔导书，皮革封面与金箔文字","ko":"낡은 마도서, 가죽 표지와 금박 글씨"},
    ui:{"--ui-bg":"#261411","--ui-panel":"rgba(38,20,17,0.96)","--ui-soft":"rgba(245,245,245,0.05)","--ui-text":"#f5f5f5","--ui-muted":"#e2d7d1","--ui-border":"rgba(212,175,55,.35)","--ui-button":"#5d4037","--ui-button-hover":"#715850","--ui-field":"#3e2723","--ui-accent":"#d4af37","--ui-on-accent":"#000000","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#8d6e63","stage":"#3e2723","lane":"rgba(38,20,17,0.6)","track":"rgba(245,245,245,0.24)","ink":"#f5f5f5","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(38,20,17,0.95)","perfect":"#ffe082","good":"#f5f5f5","miss":"#98908e","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.35) contrast(1.15) brightness(.9)",
    cli:{"font":"Trajan Pro, Garamond, serif","prompt":">","caret":"#d4af37","scan":0.08}
  };
  S["wizard-history"] = {
    cat:["wizard","life","dark"],
    font:"Courier New, Courier, monospace",
    type:{"title":"Courier New, monospace","weight":"400","lh":"1.4","titleWeight":"600","titleSpace":"0","mark":"@"},
    label:{"ja":"ウィザード・ヒストリー","en":"Wizard History","zh":"巫师历史","ko":"마법사 기록"},
    desc:{"ja":"コマンド履歴・過去の呪文・タイムスタンプ","en":"Command history, past spells, timestamps","zh":"命令历史，过去的咒语，时间戳","ko":"명령어 기록, 과거 주문, 타임스탬프"},
    ui:{"--ui-bg":"#000005","--ui-panel":"rgba(10,10,21,0.96)","--ui-soft":"rgba(128,222,234,0.05)","--ui-text":"#80deea","--ui-muted":"#4db6ac","--ui-border":"rgba(128,222,234,.30)","--ui-button":"#0a0a2a","--ui-button-hover":"#192643","--ui-field":"#00000a","--ui-accent":"#80deea","--ui-on-accent":"#000000","--ui-gold":"#b2ebf2","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(128,222,234,0.14)"},
    game:{"don":"#4db6ac","ka":"#4a4a6a","stage":"#00000a","lane":"rgba(10,10,21,0.6)","track":"rgba(128,222,234,0.24)","ink":"#80deea","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,10,21,0.95)","perfect":"#b2ebf2","good":"#80deea","miss":"#467a83","glow":false},
    shapes:["square","square"],
    video:"brightness(1.05) saturate(.9) contrast(1.02)",
    cli:{"font":"Courier New, Courier, monospace","prompt":"@","caret":"#80deea","scan":0.1}
  };
  S["wizard-man"] = {
    cat:["wizard","life","grad"],
    font:"\"Trajan Pro\",\"Garamond\",serif",
    type:{"title":"\"Trajan Pro\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"あア漢 Aa 12"},
    label:{"ja":"ウィザード・マン","en":"Wizard Man","zh":"巫师手册","ko":"마법사 매뉴얼"},
    desc:{"ja":"manページ・ドキュメント閲覧・serifフォント","en":"man page, document viewing, serif font","zh":"man页面，文档查看，衬线字体","ko":"man 페이지, 문서 조회, 세리프 글꼴"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(245,245,245,0.96)","--ui-soft":"rgba(26,26,26,0.05)","--ui-text":"#1a1a1a","--ui-muted":"#7b1fa2","--ui-border":"rgba(203,213,225,.30)","--ui-button":"#e0e0e0","--ui-button-hover":"#c6c6c6","--ui-field":"#ffffff","--ui-accent":"#cbd5e1","--ui-on-accent":"#000000","--ui-gold":"#ffe082","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(203,213,225,0.14)"},
    game:{"don":"#d4af37","ka":"#8d6e63","stage":"#f5f5f5","lane":"rgba(245,245,245,0.82)","track":"rgba(26,26,26,0.24)","ink":"#1a1a1a","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(245,245,245,0.95)","perfect":"#ffe082","good":"#1a1a1a","miss":"#818181","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.1) brightness(1.02)",
    cli:{"font":"Trajan Pro,Garamond,serif","prompt":">","caret":"#cbd5e1","scan":0.05}
  };
  S["wizard-nord"] = {
    cat:["wizard","grad","light"],
    font:"JetBrains Mono, monospace",
    type:{"title":"JetBrains Mono, monospace","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"あア漢 Aa 12"},
    label:{"ja":"ウィザード・ノルド","en":"Wizard Nord","zh":"巫师北欧","ko":"마법사 노르딕"},
    desc:{"ja":"青灰系・落ち着いた夜間モード","en":"Blue-gray, calm night mode","zh":"蓝灰色，平静的夜间模式","ko":"청회색, 차분한 야간 모드"},
    ui:{"--ui-bg":"#2e3440","--ui-panel":"rgba(59,66,82,0.96)","--ui-soft":"rgba(216,222,233,0.05)","--ui-text":"#d8dee9","--ui-muted":"#c7dedd","--ui-border":"rgba(136,192,208,.30)","--ui-button":"#434c5e","--ui-button-hover":"#565f70","--ui-field":"#2e3440","--ui-accent":"#88c0d0","--ui-on-accent":"#2e3440","--ui-gold":"#eceff4","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(136,192,208,0.14)"},
    game:{"don":"#88c0d0","ka":"#81a1c1","stage":"#2e3440","lane":"rgba(59,66,82,0.6)","track":"rgba(216,222,233,0.24)","ink":"#d8dee9","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(59,66,82,0.95)","perfect":"#eceff4","good":"#d8dee9","miss":"#8c929d","glow":false},
    shapes:["square","square"],
    video:"saturate(.8) brightness(1.02)",
    cli:{"font":"JetBrains Mono, monospace","prompt":">","caret":"#88c0d0","scan":0.06}
  };
  S["wizard-pipe"] = {
    cat:["wizard","fun","grad"],
    font:"Rajdhani, Oswald, sans-serif",
    type:{"title":"Rajdhani, sans-serif","weight":"600","lh":"1.25","titleWeight":"700","titleSpace":"-.01em","mark":"→"},
    label:{"ja":"ウィザード・パイプ","en":"Wizard Pipe","zh":"巫师管道","ko":"마법사 파이프"},
    desc:{"ja":"コマンドをつなぐ・矢印・フロー感","en":"Connecting commands, arrows, flow","zh":"连接命令，箭头，流程感","ko":"명령어 연결, 화살표, 흐름감"},
    ui:{"--ui-bg":"#05050a","--ui-panel":"rgba(10,10,26,0.96)","--ui-soft":"rgba(0,255,255,0.05)","--ui-text":"#00ffff","--ui-muted":"#88c0d0","--ui-border":"rgba(0,255,255,.35)","--ui-button":"#1a1a2a","--ui-button-hover":"#173846","--ui-field":"#0a0a10","--ui-accent":"#00ffff","--ui-on-accent":"#000000","--ui-gold":"#ff00ff","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,255,255,0.14)"},
    game:{"don":"#ff00ff","ka":"#4a4a6a","stage":"#050510","lane":"rgba(10,10,26,0.6)","track":"rgba(0,255,255,0.24)","ink":"#00ffff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,10,26,0.95)","perfect":"#ff00ff","good":"#00ffff","miss":"#028f91","glow":false},
    shapes:["square","square"],
    video:"hue-rotate(200deg) saturate(1.6) brightness(.75) contrast(1.3)",
    cli:{"font":"Rajdhani, Oswald, sans-serif","prompt":"→","caret":"#00ffff","scan":0.12}
  };
  S["wizard-sudo"] = {
    cat:["wizard","dark","access"],
    font:"\"Cascadia Mono\",\"Consolas\",monospace",
    type:{"title":"\"Cascadia Mono\",monospace","weight":"700","lh":"1.25","titleWeight":"900","titleSpace":"-.03em","titleTransform":"uppercase","mark":"root"},
    label:{"ja":"ウィザード・スードー","en":"Wizard Sudo","zh":"巫师根权限","ko":"마법사 루트"},
    desc:{"ja":"root権限・警告色・赤アクセント","en":"root permission, warning color, red accent","zh":"root权限，警告色，红色强调","ko":"root 권한, 경고색, 빨간색 강조"},
    ui:{"--ui-bg":"#0a0a0a","--ui-panel":"rgba(26,26,26,0.96)","--ui-soft":"rgba(248,248,242,0.05)","--ui-text":"#f8f8f2","--ui-muted":"#ff79c6","--ui-border":"rgba(255,0,64,.35)","--ui-button":"#1a1a2e","--ui-button-hover":"#373747","--ui-field":"#0a0a0a","--ui-accent":"#ff0040","--ui-on-accent":"#000000","--ui-gold":"#ff5555","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,0,64,0.14)"},
    game:{"don":"#ff0040","ka":"#ff5555","stage":"#0a0a0a","lane":"rgba(26,26,26,0.6)","track":"rgba(248,248,242,0.24)","ink":"#f8f8f2","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,26,26,0.95)","perfect":"#ff5555","good":"#f8f8f2","miss":"#8d8d8a","glow":false},
    shapes:["square","diamond"],
    video:"hue-rotate(0deg) saturate(1.5) contrast(1.3) brightness(.8)",
    cli:{"font":"Cascadia Mono,Consolas,monospace","prompt":"#","caret":"#ff0040","scan":0.15}
  };
  S["wizard-terminal"] = {
    cat:["wizard","dark","life"],
    font:"\"Courier New\",\"Courier\",monospace",
    type:{"title":"\"Courier New\",monospace","weight":"500","lh":"1.4","titleWeight":"700","titleSpace":"0","mark":"grimoire> _"},
    label:{"ja":"魔導ターミナル","en":"Wizard Terminal","zh":"巫师终端","ko":"마법사 터미널"},
    desc:{"ja":"琥珀色モノクロCRT、呪文のプロンプト","en":"Amber monochrome CRT, spell prompt","zh":"琥珀色单色CRT，咒语提示符","ko":"호박색 단색 CRT, 주문 프롬프트"},
    ui:{"--ui-bg":"#0a0a00","--ui-panel":"rgba(10,10,0,0.96)","--ui-soft":"rgba(255,191,0,0.05)","--ui-text":"#ffbf00","--ui-muted":"#bfa640","--ui-border":"rgba(255,191,0,.30)","--ui-button":"#2a2a00","--ui-button-hover":"#463d00","--ui-field":"#1a1a00","--ui-accent":"#ffbf00","--ui-on-accent":"#000000","--ui-gold":"#ffff99","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,191,0,0.14)"},
    game:{"don":"#ccaa00","ka":"#4a4a00","stage":"#1a1a00","lane":"rgba(10,10,0,0.6)","track":"rgba(255,191,0,0.24)","ink":"#ffbf00","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,10,0,0.95)","perfect":"#ffff99","good":"#ffbf00","miss":"#916e00","glow":false},
    shapes:["square","square"],
    video:"sepia(.5) contrast(1.15) brightness(.85)",
    cli:{"font":"Courier New, Courier, monospace","prompt":">","caret":"#ffbf00","scan":0.15}
  };
  S["wizard-tmux"] = {
    cat:["wizard","fun","access"],
    font:"JetBrains Mono, monospace",
    type:{"title":"JetBrains Mono, monospace","weight":"600","lh":"1.3","titleWeight":"700","titleSpace":"-.02em","mark":"+"},
    label:{"ja":"ウィザード・ティムックス","en":"Wizard Tmux","zh":"巫师分屏","ko":"마법사 다중창"},
    desc:{"ja":"画面分割・グリッド・ペイン操作","en":"Screen split, grid, pane operation","zh":"屏幕分割，网格，窗格操作","ko":"화면 분할, 그리드, 창 분할 조작"},
    ui:{"--ui-bg":"#272822","--ui-panel":"rgba(62,61,50,0.96)","--ui-soft":"rgba(248,248,242,0.05)","--ui-text":"#f8f8f2","--ui-muted":"#a6e22e","--ui-border":"rgba(249,38,114,.30)","--ui-button":"#3e3d32","--ui-button-hover":"#56554b","--ui-field":"#272822","--ui-accent":"#f92672","--ui-on-accent":"#000000","--ui-gold":"#a6e22e","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(249,38,114,0.14)"},
    game:{"don":"#f92672","ka":"#a6e22e","stage":"#272822","lane":"rgba(62,61,50,0.6)","track":"rgba(248,248,242,0.24)","ink":"#f8f8f2","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(62,61,50,0.95)","perfect":"#a6e22e","good":"#f8f8f2","miss":"#9a9a94","glow":false},
    shapes:["square","square"],
    video:"saturate(1.2) contrast(1.15) brightness(.95)",
    cli:{"font":"JetBrains Mono, monospace","prompt":"+","caret":"#f92672","scan":0.08}
  };
})();

// SPDX-License-Identifier: GPL-3.0-or-later
/* 🧙 ウィザードのスキン（trk269・trk270・Skin 側の目録から生成）

   出どころ：trk-Avatar-Library の `catalog/skins.json`（wizard カテゴリ）
   作り方：node tools/import-skin-catalog.mjs <目録.json> --cat=wizard --out=js/skins-wizard.js
   ・手で直さないでください（次の取り込みで消えます）。直すときは目録側（Skin 側）で。
   ・このファイルは data.js の後・core.js の前に読みます（起動時のスキン復元より先に要るため）。
   ============================================================================ */
"use strict";
(() => {
  const S = window.Trk && window.Trk.data && window.Trk.data.SKINS;
  if (!S) return;   /* data.js が無い（別の読み込み方）ときは何もしない */
  S["wizard-alchemy"] = {
    cat:["wizard","fun","grad"],
    font:"\"Caslon\",\"Garamond\",serif",
    type:{"title":"\"Caslon\",serif","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".03em","mark":"☿ ☽ ♀"},
    label:{"ja":"錬金術","en":"Alchemy","zh":"炼金术","ko":"연금술"},
    desc:{"ja":"賢者の石、鉛から金への変容、錬金実験","en":"Philosopher's stone, transmutation of lead to gold, alchemic","zh":"贤者之石，铅转化为金，炼金实验","ko":"현자의 돌, 납에서 금으로의 변환, 연금술 실험"},
    ui:{"--ui-bg":"#2a1a15","--ui-panel":"rgba(42,26,21,0.96)","--ui-soft":"rgba(212,175,55,0.05)","--ui-text":"#d4af37","--ui-muted":"#d9ab9b","--ui-border":"rgba(212,175,55,.35)","--ui-button":"#583d34","--ui-button-hover":"#5a3f34","--ui-field":"#4a2c2a","--ui-accent":"#ffd700","--ui-on-accent":"#000000","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,215,0,0.14)"},
    game:{"don":"#ffd700","ka":"#8b4513","stage":"#4a2c2a","lane":"rgba(42,26,21,0.6)","track":"rgba(212,175,55,0.24)","ink":"#d4af37","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(42,26,21,0.95)","perfect":"#ffe082","good":"#d4af37","miss":"#947b3e","glow":false},
    shapes:["circle","square"],
    video:"sepia(.4) saturate(1.2) contrast(1.15) brightness(.9)"
  };
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
    cli:{"font":"Cinzel, Trajan Pro, serif","prompt":"✦","caret":"#ff00ff","scan":0.18,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-cauldron"] = {
    cat:["wizard","fun","dark"],
    font:"\"Comic Sans MS\",\"Cursive\",fantasy",
    type:{"title":"\"Comic Sans MS\",cursive","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".04em","mark":"🧪 BUBBLE"},
    label:{"ja":"大釜","en":"Cauldron","zh":"大锅","ko":"대솥"},
    desc:{"ja":"魔女の大釜、泡立つ緑のポーション","en":"Witch's cauldron, bubbling green potion","zh":"女巫的大锅，冒泡的绿色药水","ko":"마녀의 대솥, 끓는 녹색 포션"},
    ui:{"--ui-bg":"#0d3b0d","--ui-panel":"rgba(13,59,13,0.96)","--ui-soft":"rgba(165,214,167,0.05)","--ui-text":"#a5d6a7","--ui-muted":"#7ae07f","--ui-border":"rgba(129,199,132,.35)","--ui-button":"#235e26","--ui-button-hover":"#266029","--ui-field":"#1b5e20","--ui-accent":"#81c784","--ui-on-accent":"#000000","--ui-gold":"#c8e6c9","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(129,199,132,0.14)"},
    game:{"don":"#81c784","ka":"#388e3c","stage":"#1b5e20","lane":"rgba(13,59,13,0.6)","track":"rgba(165,214,167,0.24)","ink":"#a5d6a7","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(13,59,13,0.95)","perfect":"#c8e6c9","good":"#a5d6a7","miss":"#89ac89","glow":false},
    shapes:["circle","circle"],
    video:"hue-rotate(100deg) saturate(1.3) contrast(1.1) brightness(.9)"
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
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"λ","caret":"#39ff14","scan":0.12,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
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
    cli:{"font":"Courier New, Courier, monospace","prompt":"λ","caret":"#39ff14","scan":0.2,"cursor":"block","opacity":0.85,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-crystal"] = {
    cat:["wizard","grad","light"],
    font:"\"Playfair Display\",\"Noto Serif JP\",serif",
    type:{"title":"\"Playfair Display\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"あア漢 Aa"},
    label:{"ja":"クリスタルボール","en":"Crystal Ball","zh":"水晶球","ko":"크리스털 볼"},
    desc:{"ja":"水晶占い、未来を映す球体と紫の霧","en":"Crystal gazing, sphere reflecting the future and purple mist","zh":"水晶占卜，映照未来的球体与紫色薄雾","ko":"수정 구 점술, 미래를 비추는 구체와 보라색 안개"},
    ui:{"--ui-bg":"#311b92","--ui-panel":"rgba(49,27,146,0.96)","--ui-soft":"rgba(225,190,231,0.05)","--ui-text":"#e1bee7","--ui-muted":"#ffffff","--ui-border":"rgba(206,147,216,.35)","--ui-button":"#7b1fa2","--ui-button-hover":"#7f25a5","--ui-field":"#4a148c","--ui-accent":"#ce93d8","--ui-on-accent":"#000000","--ui-gold":"#f3e5f5","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(206,147,216,0.14)"},
    game:{"don":"#ce93d8","ka":"#ba68c8","stage":"#4a148c","lane":"rgba(49,27,146,0.6)","track":"rgba(225,190,231,0.24)","ink":"#e1bee7","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(49,27,146,0.95)","perfect":"#f3e5f5","good":"#e1bee7","miss":"#9275c1","glow":false},
    shapes:["circle","circle"],
    video:"hue-rotate(280deg) saturate(1.2) brightness(.9) contrast(1.1)"
  };
  S["wizard-eldritch"] = {
    cat:["wizard","dark","fun"],
    font:"\"Cinzel\",\"Trajan Pro\",serif",
    type:{"title":"\"Cinzel\",serif","weight":"700","lh":"1.4","titleWeight":"800","titleSpace":".12em","titleTransform":"uppercase","mark":"∿"},
    label:{"ja":"エルドリッチ","en":"Eldritch","zh":"异形","ko":"엘드리트치"},
    desc:{"ja":"クトゥルフ的異形、不可視の恐怖と深淵の緑","en":"Eldritch abomination, invisible terror and abyssal green","zh":"克苏鲁式异形，无形的恐怖与深渊之绿","ko":"크툴루식 이형체, 불가시의 공포와 심연의 녹색"},
    ui:{"--ui-bg":"#061a1a","--ui-panel":"rgba(6,26,26,0.96)","--ui-soft":"rgba(78,205,196,0.05)","--ui-text":"#4ecdc4","--ui-muted":"#8fbdbd","--ui-border":"rgba(78,205,196,.35)","--ui-button":"#1d3a3a","--ui-button-hover":"#234d4c","--ui-field":"#0d2a2a","--ui-accent":"#4ecdc4","--ui-on-accent":"#000000","--ui-gold":"#a8e6cf","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(78,205,196,0.14)"},
    game:{"don":"#45b7aa","ka":"#2c7873","stage":"#0d2a2a","lane":"rgba(6,26,26,0.6)","track":"rgba(78,205,196,0.24)","ink":"#4ecdc4","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(6,26,26,0.95)","perfect":"#a8e6cf","good":"#4ecdc4","miss":"#2e7c78","glow":false},
    shapes:["diamond","square"],
    video:"hue-rotate(180deg) saturate(1.3) contrast(1.2) brightness(.8)"
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
    cli:{"font":"Courier New, Courier, monospace","prompt":"?","caret":"#ffff00","scan":0.1,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
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
    cli:{"font":"Trajan Pro, Garamond, serif","prompt":">","caret":"#d4af37","scan":0.08,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-hermetic"] = {
    cat:["wizard","grad","light"],
    font:"\"Trajan Pro\",\"Caslon\",serif",
    type:{"title":"\"Trajan Pro\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".04em","mark":"☿"},
    label:{"ja":"ヘルメティック","en":"Hermetic","zh":"赫密斯","ko":"헤르메스"},
    desc:{"ja":"ヘルメス主義、黄金の黄昏と秘教幾何学","en":"Hermeticism, golden twilight and occult geometry","zh":"赫密斯主义，金色黄昏与秘教几何","ko":"헤르메스주의, 황금 황혼과 비밀 기하학"},
    ui:{"--ui-bg":"#aea099","--ui-panel":"rgba(224,192,160,0.96)","--ui-soft":"rgba(58,42,90,0.05)","--ui-text":"#3a2a5a","--ui-muted":"#3a2a5a","--ui-border":"rgba(212,175,55,.35)","--ui-button":"#b49b5e","--ui-button-hover":"#b2995e","--ui-field":"#ffe0b2","--ui-accent":"#ffd700","--ui-on-accent":"#000000","--ui-gold":"#ffe082","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(255,215,0,0.14)"},
    game:{"don":"#ffd700","ka":"#d4af37","stage":"#b8860b","lane":"rgba(224,192,160,0.82)","track":"rgba(58,42,90,0.24)","ink":"#fffdf0","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(224,192,160,0.95)","perfect":"#ffe082","good":"#fffdf0","miss":"#493448","glow":false},
    shapes:["square","circle"],
    video:"sepia(.25) saturate(1.1) brightness(1.02)"
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
    cli:{"font":"Courier New, Courier, monospace","prompt":"@","caret":"#80deea","scan":0.1,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
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
    cli:{"font":"Trajan Pro, Garamond, serif","prompt":">","caret":"#cbd5e1","scan":0.05,"cursor":"block","opacity":1,"history":50,"completion":"tab"}
  };
  S["wizard-necromancer"] = {
    cat:["wizard","dark","fun"],
    font:"\"Cinzel\",\"Trajan Pro\",serif",
    type:{"title":"\"Cinzel\",serif","weight":"700","lh":"1.35","titleWeight":"800","titleSpace":".08em","titleTransform":"uppercase","mark":"☠"},
    label:{"ja":"ネクロマンサー","en":"Necromancer","zh":"死灵法师","ko":"네크로맨서"},
    desc:{"ja":"死霊術、墓場の土と腐敗の紫","en":"Necromancy, graveyard soil and decayed purple","zh":"死灵法术，墓地土壤与腐败紫","ko":"네크로맨시, 묘지 토양과 부패한 보라색"},
    ui:{"--ui-bg":"#0a0a0a","--ui-panel":"rgba(10,10,10,0.96)","--ui-soft":"rgba(187,134,252,0.05)","--ui-text":"#bb86fc","--ui-muted":"#9f9f9f","--ui-border":"rgba(187,134,252,.35)","--ui-button":"#2a2a2a","--ui-button-hover":"#39333f","--ui-field":"#1a1a1a","--ui-accent":"#bb86fc","--ui-on-accent":"#000000","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(187,134,252,0.14)"},
    game:{"don":"#d4af37","ka":"#4a4a4a","stage":"#1a1a1a","lane":"rgba(10,10,10,0.6)","track":"rgba(187,134,252,0.24)","ink":"#bb86fc","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,10,10,0.95)","perfect":"#ffe082","good":"#bb86fc","miss":"#7a609a","glow":false},
    shapes:["square","diamond"],
    video:"hue-rotate(260deg) saturate(1.3) contrast(1.25) brightness(.8)"
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
    cli:{"font":"JetBrains Mono, monospace","prompt":">","caret":"#88c0d0","scan":0.06,"cursor":"block","opacity":0.95,"history":50,"completion":"tab"}
  };
  S["wizard-ouija"] = {
    cat:["wizard","fun","dark"],
    font:"\"Trajan Pro\",\"Papyrus\",fantasy",
    type:{"title":"\"Trajan Pro\",fantasy","weight":"400","lh":"1.5","titleWeight":"600","titleSpace":".06em","titleTransform":"uppercase","mark":"YES NO"},
    label:{"ja":"ウィジャ板","en":"Ouija","zh":"灵派","ko":"위자 보드"},
    desc:{"ja":"ウィジャ盤面、文字と数字の円周配置","en":"Ouija board, letters and numbers in circular layout","zh":"灵派板面，字母和数字的圆周布置","ko":"위자 보드, 알파벳과 숫자의 원형 배치"},
    ui:{"--ui-bg":"#0f0f0f","--ui-panel":"rgba(15,15,15,0.96)","--ui-soft":"rgba(245,245,245,0.05)","--ui-text":"#f5f5f5","--ui-muted":"#b1b1b1","--ui-border":"rgba(224,224,224,.25)","--ui-button":"#2a2a2a","--ui-button-hover":"#444444","--ui-field":"#1a1a1a","--ui-accent":"#e0e0e0","--ui-on-accent":"#000000","--ui-gold":"#ffffff","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(224,224,224,0.14)"},
    game:{"don":"#e0e0e0","ka":"#666666","stage":"#1a1a1a","lane":"rgba(15,15,15,0.6)","track":"rgba(245,245,245,0.24)","ink":"#f5f5f5","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(15,15,15,0.95)","perfect":"#ffffff","good":"#f5f5f5","miss":"#8e8e8e","glow":false},
    shapes:["circle","square"],
    video:"grayscale(.4) contrast(1.2) brightness(.85)"
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
    cli:{"font":"Rajdhani, Oswald, sans-serif","prompt":"→","caret":"#00ffff","scan":0.12,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-rune"] = {
    cat:["wizard","dark","access"],
    font:"\"Cinzel\",\"Trajan Pro\",serif",
    type:{"title":"\"Cinzel\",serif","weight":"700","lh":"1.4","titleWeight":"800","titleSpace":".15em","titleTransform":"uppercase","mark":"ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ"},
    label:{"ja":"ルーン文字","en":"Rune","zh":"卢恩文字","ko":"룬 문자"},
    desc:{"ja":"北欧ルーン刻印、石板と氷の青","en":"Nordic rune carving, stone tablet and ice blue","zh":"北欧卢恩刻印，石板与冰蓝","ko":"노르드 룬 문자 새김, 돌판과 얼음 파랑"},
    ui:{"--ui-bg":"#020617","--ui-panel":"rgba(2,6,23,0.96)","--ui-soft":"rgba(226,232,240,0.05)","--ui-text":"#e2e8f0","--ui-muted":"#a2b0c5","--ui-border":"rgba(203,213,225,.30)","--ui-button":"#1e293b","--ui-button-hover":"#374253","--ui-field":"#0f172a","--ui-accent":"#cbd5e1","--ui-on-accent":"#000000","--ui-gold":"#f8fafc","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(203,213,225,0.14)"},
    game:{"don":"#cbd5e1","ka":"#64748b","stage":"#0f172a","lane":"rgba(2,6,23,0.6)","track":"rgba(226,232,240,0.24)","ink":"#e2e8f0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(2,6,23,0.95)","perfect":"#f8fafc","good":"#e2e8f0","miss":"#7d828e","glow":false},
    shapes:["square","diamond"],
    video:"saturate(.6) contrast(1.25) brightness(.8)"
  };
  S["wizard-seance"] = {
    cat:["wizard","life","dark"],
    font:"\"Garamond\",\"Noto Serif JP\",serif",
    type:{"title":"\"Garamond\",serif","weight":"400","lh":"1.75","titleWeight":"600","titleSpace":".05em","mark":"🕯️"},
    label:{"ja":"降霊術","en":"Seance","zh":"降灵术","ko":"강령술"},
    desc:{"ja":"ろうそくの灯りと霊媒、あの世との対話","en":"Candlelight and medium, dialogue with the other world","zh":"蜡烛之光与降灵师，与另一个世界的对话","ko":"초불과 영매, 저세상과의 대화"},
    ui:{"--ui-bg":"#2a1a15","--ui-panel":"rgba(42,26,21,0.96)","--ui-soft":"rgba(255,224,130,0.05)","--ui-text":"#ffe082","--ui-muted":"#e8cdc3","--ui-border":"rgba(212,175,55,.30)","--ui-button":"#5d4037","--ui-button-hover":"#725541","--ui-field":"#4a2c2a","--ui-accent":"#ffe082","--ui-on-accent":"#000000","--ui-gold":"#ffecb3","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,224,130,0.14)"},
    game:{"don":"#d4af37","ka":"#8d6e63","stage":"#4a2c2a","lane":"rgba(42,26,21,0.6)","track":"rgba(255,224,130,0.24)","ink":"#ffe082","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(42,26,21,0.95)","perfect":"#ffecb3","good":"#ffe082","miss":"#9f8751","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.45) brightness(1.05) contrast(1.1)"
  };
  S["wizard-spell"] = {
    cat:["wizard","fun","grad"],
    font:"\"Trajan Pro\",\"Papyrus\",fantasy",
    type:{"title":"\"Trajan Pro\",fantasy","weight":"400","lh":"1.6","titleWeight":"700","titleSpace":".08em","titleTransform":"uppercase","mark":"✦ CAST ✦"},
    label:{"ja":"スペルキャスト","en":"Spell Cast","zh":"施法","ko":"주문 시전"},
    desc:{"ja":"呪文の発動エフェクト、光の粒子と轟音","en":"Spell activation effect, particles of light and roar","zh":"咒语发动效果，光之粒子与轰鸣","ko":"주문 발동 이펙트, 빛의 입자와 굉음"},
    ui:{"--ui-bg":"#0f051a","--ui-panel":"rgba(15,5,26,0.96)","--ui-soft":"rgba(255,215,0,0.05)","--ui-text":"#ffd700","--ui-muted":"#bd8ced","--ui-border":"rgba(187,134,252,.35)","--ui-button":"#2a1a3e","--ui-button-hover":"#463336","--ui-field":"#1a0a2e","--ui-accent":"#bb86fc","--ui-on-accent":"#000000","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(187,134,252,0.14)"},
    game:{"don":"#bb86fc","ka":"#74b9ff","stage":"#1a0a2e","lane":"rgba(15,5,26,0.6)","track":"rgba(255,215,0,0.24)","ink":"#ffd700","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(15,5,26,0.95)","perfect":"#ffe082","good":"#ffd700","miss":"#93790c","glow":false},
    shapes:["circle","diamond"],
    video:"hue-rotate(270deg) saturate(1.5) brightness(.85) contrast(1.2)"
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
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"#","caret":"#ff0040","scan":0.15,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-tarot"] = {
    cat:["wizard","fun","dark"],
    font:"\"Trajan Pro\",\"Garamond\",serif",
    type:{"title":"\"Trajan Pro\",serif","weight":"400","lh":"1.65","titleWeight":"600","titleSpace":".04em","mark":"♰"},
    label:{"ja":"タロット","en":"Tarot","zh":"塔罗牌","ko":"타로"},
    desc:{"ja":"タロットカード、運命のカードリーディング","en":"Tarot cards, card reading of fate","zh":"塔罗牌，命运的卡片占卜","ko":"타로 카드, 운명의 카드 리딩"},
    ui:{"--ui-bg":"#0f0b1e","--ui-panel":"rgba(15,11,30,0.96)","--ui-soft":"rgba(224,216,240,0.05)","--ui-text":"#e0d8f0","--ui-muted":"#a0a0c9","--ui-border":"rgba(187,134,252,.35)","--ui-button":"#2a163e","--ui-button-hover":"#422f55","--ui-field":"#1a1a2e","--ui-accent":"#bb86fc","--ui-on-accent":"#0d0b1e","--ui-gold":"#ccd6f6","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(187,134,252,0.14)"},
    game:{"don":"#bb86fc","ka":"#74b9ff","stage":"#1a1a2e","lane":"rgba(15,11,30,0.6)","track":"rgba(224,216,240,0.24)","ink":"#e0d8f0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(15,11,30,0.95)","perfect":"#ccd6f6","good":"#e0d8f0","miss":"#827c92","glow":false},
    shapes:["diamond","circle"],
    video:"hue-rotate(260deg) saturate(1.2) brightness(.85) contrast(1.15)"
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
    cli:{"font":"Courier New, Courier, monospace","prompt":">","caret":"#ffbf00","scan":0.15,"cursor":"block","opacity":0.9,"history":50,"completion":"tab","bell":true}
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
    cli:{"font":"JetBrains Mono, monospace","prompt":"+","caret":"#f92672","scan":0.08,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-void"] = {
    cat:["wizard","dark","access"],
    font:"\"Rajdhani\",\"Oswald\",sans-serif",
    type:{"title":"\"Rajdhani\",sans-serif","weight":"700","lh":"1.1","titleWeight":"900","titleSpace":"-.04em","titleTransform":"uppercase","mark":"Ø"},
    label:{"ja":"ヴォイド","en":"Void","zh":"虚空","ko":"보이드"},
    desc:{"ja":"虚無の空間、すべてを飲み込む黒","en":"Void space, black that swallows everything","zh":"虚空，吞噬一切的黑","ko":"공허 공간, 모든 것을 삼키는 검정"},
    ui:{"--ui-bg":"#000000","--ui-panel":"rgba(0,0,0,0.96)","--ui-soft":"rgba(224,224,224,0.05)","--ui-text":"#e0e0e0","--ui-muted":"#8a8a8a","--ui-border":"rgba(26,26,26,.20)","--ui-button":"#050505","--ui-button-hover":"#212121","--ui-field":"#000000","--ui-accent":"#1a1a1a","--ui-on-accent":"#ffffff","--ui-gold":"#2a2a2a","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(26,26,26,0.14)"},
    game:{"don":"#111111","ka":"#0a0a0a","stage":"#000000","lane":"rgba(0,0,0,0.6)","track":"rgba(224,224,224,0.24)","ink":"#000000","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(0,0,0,0.95)","perfect":"#2a2a2a","good":"#000000","miss":"#7b7b7b","glow":false},
    shapes:["square","square"],
    video:"brightness(.6) contrast(1.4)"
  };
})();

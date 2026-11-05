// SPDX-License-Identifier: GPL-3.0-or-later
/* 🧙 ウィザードのスキン（trk269・trk270・trk274・Skin 側の目録から生成）

   出どころ：trk-Avatar-Library の `catalog/skins.json`（wizard カテゴリ）
   目録の sha256：8f1e9fa713c1b2c62567fba074f1c3cf245eac4e02d94f6aa515c74b683727e7（この写しがどの目録から作られたかの印）
   作り方：node tools/import-skin-catalog.mjs <目録.json> --cat=wizard --out=js/skins-wizard.js
   ・手で直さないでください（次の取り込みで消えます）。直すときは目録側（Skin 側）で。
   ・このファイルは data.js の後・core.js の前に読みます（起動時のスキン復元より先に要るため）。
   ============================================================================ */
"use strict";
(() => {
  const D = window.Trk && window.Trk.data;
  const S = D && D.SKINS;
  if (!S) return;   /* data.js が無い（別の読み込み方）ときは何もしない */
  S["wizard-abramelin"] = {
    cat:["wizard","life","grad"],
    font:"\"Playfair Display\",\"Noto Serif JP\",serif",
    type:{"title":"\"Playfair Display\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"あア漢 Aa"},
    label:{"ja":"アブラメリンの書","en":"Book of Abramelin","zh":"亚伯拉梅林之书","ko":"아브라멜린의 서"},
    desc:{"ja":"守護聖天使との交信を目的とした白魔術の書、浄化と祈りの儀式","en":"White magic grimoire for communion with the Holy Guardian An","zh":"旨在与圣守护天使交流的白魔术之书，净化与祈祷仪式","ko":"신성 수호천사와의 교신을 목적으로 한 백마술의 서, 정화와 기도 의식"},
    ui:{"--ui-bg":"#223022","--ui-panel":"rgba(34,48,34,0.96)","--ui-soft":"rgba(232,240,232,0.05)","--ui-text":"#e8f0e8","--ui-muted":"#e9efe9","--ui-border":"rgba(143,188,143,.35)","--ui-button":"#4a5d4a","--ui-button-hover":"#5f705f","--ui-field":"#2d3a2a","--ui-accent":"#8fbc8f","--ui-on-accent":"#000000","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(143,188,143,0.14)"},
    game:{"don":"#d4af37","ka":"#8fbc8f","stage":"#2d3a2a","lane":"rgba(34,48,34,0.6)","track":"rgba(232,240,232,0.24)","ink":"#e8f0e8","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(34,48,34,0.95)","perfect":"#ffe082","good":"#e8f0e8","miss":"#8f9a8f","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.15) saturate(1.1) brightness(1.0)",
    cli:{"font":"Cinzel, Trajan Pro, serif","prompt":"👼","caret":"#8fbc8f","scan":0.15,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-agrippa"] = {
    cat:["wizard","grad","light"],
    font:"\"Caslon\",\"Garamond\",serif",
    type:{"title":"\"Caslon\",serif","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".03em","mark":"☉ ♀ ♂"},
    label:{"ja":"オカルト哲学三書","en":"Three Books of Occult Philosophy","zh":"秘术哲学三书","ko":"오컬트 철학 삼부작"},
    desc:{"ja":"ヘンリヒュス・コルネリウス・アグリッパによる白魔術の体系化、天使・惑星・調和","en":"Heinrich Cornelius Agrippa\\u2019s systematization of white m","zh":"海因里希·科尔内利乌斯·阿格里帕对白魔术的系统化：天使、行星与和谐","ko":"하인리히 코르넬리우스 아그리파의 백마술 체계화: 천사, 행성과 조화"},
    ui:{"--ui-bg":"#f0e8d8","--ui-panel":"rgba(240,232,216,0.96)","--ui-soft":"rgba(42,36,30,0.05)","--ui-text":"#2a241e","--ui-muted":"#5f513a","--ui-border":"rgba(184,134,11,.35)","--ui-button":"#e8e0d0","--ui-button-hover":"#cfc8b9","--ui-field":"#f5efe0","--ui-accent":"#b8860b","--ui-on-accent":"#000000","--ui-gold":"#ffd700","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(184,134,11,0.14)"},
    game:{"don":"#b8860b","ka":"#8b4513","stage":"#f5efe0","lane":"rgba(240,232,216,0.82)","track":"rgba(42,36,30,0.24)","ink":"#2a241e","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(240,232,216,0.95)","perfect":"#ffd700","good":"#2a241e","miss":"#837c72","glow":false},
    shapes:["square","square"],
    video:"sepia(.2) contrast(1.1) brightness(1.05)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"☉","caret":"#b8860b","scan":0.14,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
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
  S["wizard-anchor-positioner"] = {
    cat:["wizard","dark","access"],
    font:"\"Cinzel\",\"Trajan Pro\",serif",
    type:{"title":"\"Cinzel\",serif","weight":"700","lh":"1.5","titleWeight":"800","titleSpace":".1em","titleTransform":"uppercase","mark":"⚓"},
    label:{"ja":"アンカーポジショナー","en":"Anchor Positioner","zh":"锚点定位器","ko":"앵커 위치잡기"},
    desc:{"ja":"Anchor Positioning をフル活用、ツールチップとポップオーバーをアンカー要素に固定","en":"Full use of Anchor Positioning, tooltips and popovers anchor","zh":"全面使用Anchor Positioning，工具提示和弹出窗口固定到锚点元素","ko":"Anchor Positioning를 완전히 활용, 툴팁과 팝오버를 앵커 요소에 고정"},
    ui:{"--ui-bg":"#050505","--ui-panel":"rgba(3,20,6,0.96)","--ui-soft":"rgba(224,224,224,0.05)","--ui-text":"#e0e0e0","--ui-muted":"#8fd79a","--ui-border":"#d4af37","--ui-button":"#1a1a1a","--ui-button-hover":"#343434","--ui-field":"#0a0a0a","--ui-accent":"#d4af37","--ui-on-accent":"#000000","--ui-gold":"#ffffff","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#666666","stage":"#0a0a0a","lane":"rgba(3,20,6,0.6)","track":"rgba(224,224,224,0.24)","ink":"#e0e0e0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(3,20,6,0.95)","perfect":"#ffffff","good":"#e0e0e0","miss":"#7d7d7d","glow":false},
    shapes:["square","square"],
    video:"contrast(1.2) brightness(.85)",
    cli:{"font":"Courier New, Courier, monospace","prompt":"⚓","caret":"#d4af37","scan":0.12,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-arbatel"] = {
    cat:["wizard","life","grad"],
    font:"\"Caslon\",\"Garamond\",serif",
    type:{"title":"\"Caslon\",serif","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".03em","mark":"☆"},
    label:{"ja":"アルバテル","en":"Arbatel of Magick","zh":"阿巴特尔魔术书","ko":"알바텔"},
    desc:{"ja":"7人の大天使を崇拝するクリスチャン白魔術、オリンピックの霊と調和","en":"Christian white magic venerating the seven archangels, Olymp","zh":"尊崇七位大天使的基督教白魔术，奥林匹克之灵与和谐","ko":"7명의 대천사를 숭배하는 크리스천 백마술, 올림픽의 정령과 조화"},
    ui:{"--ui-bg":"#1a252f","--ui-panel":"rgba(26,37,47,0.96)","--ui-soft":"rgba(236,240,241,0.05)","--ui-text":"#ecf0f1","--ui-muted":"#d1d9e0","--ui-border":"rgba(52,152,219,.35)","--ui-button":"#34495e","--ui-button-hover":"#4c5f71","--ui-field":"#2c3e50","--ui-accent":"#3498db","--ui-on-accent":"#000000","--ui-gold":"#f1c40f","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(52,152,219,0.14)"},
    game:{"don":"#f1c40f","ka":"#3498db","stage":"#2c3e50","lane":"rgba(26,37,47,0.6)","track":"rgba(236,240,241,0.24)","ink":"#ecf0f1","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,37,47,0.95)","perfect":"#f1c40f","good":"#ecf0f1","miss":"#8e959a","glow":false},
    shapes:["square","circle"],
    video:"contrast(1.1) brightness(1.0)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"☆","caret":"#3498db","scan":0.13,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
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
  S["wizard-aura-caster"] = {
    cat:["wizard","grad","light"],
    font:"\"Cinzel\",\"Trajan Pro\",serif",
    type:{"title":"\"Cinzel\",serif","weight":"700","lh":"1.5","titleWeight":"800","titleSpace":".1em","titleTransform":"uppercase","mark":"✦"},
    label:{"ja":"オーラキャスター","en":"Aura Caster","zh":"光环施法者","ko":"오라 캐스터"},
    desc:{"ja":"マウス追従の発光オーラとグラデーションアニメーション、神秘的な光の軌跡","en":"Mouse-following glowing aura and gradient animation, mystica","zh":"鼠标跟随的发光光环和渐变动画，神秘的光之轨迹","ko":"마우스 추종 발광 오라와 그라데이션 애니메이션, 신비한 빛의 궤적"},
    ui:{"--ui-bg":"#f0e6ff","--ui-panel":"rgba(240,230,255,0.96)","--ui-soft":"rgba(45,27,105,0.05)","--ui-text":"#2d1b69","--ui-muted":"#6a3d9a","--ui-border":"rgba(255,0,255,.35)","--ui-button":"#e8d9ff","--ui-button-hover":"#d0c0ec","--ui-field":"#fdfbf7","--ui-accent":"#ff00ff","--ui-on-accent":"#000000","--ui-gold":"#ffe082","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(255,0,255,0.14)"},
    game:{"don":"#ff00ff","ka":"#7b2cbf","stage":"#fdfbf7","lane":"rgba(240,230,255,0.82)","track":"rgba(45,27,105,0.24)","ink":"#2d1b69","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(240,230,255,0.95)","perfect":"#ffe082","good":"#2d1b69","miss":"#8576ad","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.2) contrast(1.15) brightness(1.05)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"✦","caret":"#ff00ff","scan":0.14,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
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
  S["wizard-clausewitz"] = {
    cat:["wizard","dark","fun"],
    font:"\"Cinzel\",\"Trajan Pro\",serif",
    type:{"title":"\"Cinzel\",serif","weight":"700","lh":"1.5","titleWeight":"800","titleSpace":".1em","titleTransform":"uppercase","mark":"K"},
    label:{"ja":"クラウゼヴィッツ 戦争論","en":"Clausewitz On War","zh":"克劳塞维茨 战争论","ko":"클라우제비츠 전쟁론"},
    desc:{"ja":"近代戦争の哲学、戦争は他の手段による政治の継続","en":"Philosophy of modern war, war is the continuation of politic","zh":"近代战争的哲学，战争是以其他手段继续政治","ko":"근대 전쟁의 철학, 전쟁은 다른 수단에 의한 정치의 계속"},
    ui:{"--ui-bg":"#050505","--ui-panel":"rgba(3,20,6,0.96)","--ui-soft":"rgba(224,224,224,0.05)","--ui-text":"#e0e0e0","--ui-muted":"#8fd79a","--ui-border":"#d4af37","--ui-button":"#1a1a1a","--ui-button-hover":"#343434","--ui-field":"#0a0a0a","--ui-accent":"#d4af37","--ui-on-accent":"#000000","--ui-gold":"#ffffff","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#666666","stage":"#0a0a0a","lane":"rgba(3,20,6,0.6)","track":"rgba(224,224,224,0.24)","ink":"#e0e0e0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(3,20,6,0.95)","perfect":"#ffffff","good":"#e0e0e0","miss":"#7d7d7d","glow":false},
    shapes:["square","square"],
    video:"contrast(1.2) brightness(.85)",
    cli:{"font":"Courier New, Courier, monospace","prompt":"K","caret":"#d4af37","scan":0.12,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
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
  S["wizard-container-query-responder"] = {
    cat:["wizard","light","access"],
    font:"\"Playfair Display\",\"Noto Serif JP\",serif",
    type:{"title":"\"Playfair Display\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"📐"},
    label:{"ja":"コンテナクエリ・レスポンシバー","en":"Container Query Responder","zh":"容器查询响应者","ko":"컨테이너 쿼리 응답자"},
    desc:{"ja":"Container Queries をフル活用、@container でコンテナ幅に応じたレイアウト自動適応","en":"Full use of Container Queries, @container for automatic layo","zh":"全面使用Container Queries，@container用于根据容器宽度自动适应布局","ko":"Container Queries를 완전히 활용, @container로 컨테이너 너비에 따른 레이아웃 자동 적"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(26,26,26,0.05)","--ui-text":"#1a1a1a","--ui-muted":"#4a5568","--ui-border":"rgba(44,82,130,.35)","--ui-button":"#e2e8f0","--ui-button-hover":"#c8cdd4","--ui-field":"#fafafa","--ui-accent":"#2c5282","--ui-on-accent":"#ffffff","--ui-gold":"#7aa2f7","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(44,82,130,0.14)"},
    game:{"don":"#2c5282","ka":"#4a5568","stage":"#fafafa","lane":"rgba(255,255,255,0.82)","track":"rgba(26,26,26,0.24)","ink":"#1a1a1a","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#7aa2f7","good":"#1a1a1a","miss":"#818181","glow":false},
    shapes:["circle","circle"],
    video:"contrast(1.05) brightness(1.0)",
    cli:{"font":"Courier New, Courier, monospace","prompt":"📐","caret":"#2c5282","scan":0.1,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
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
  S["wizard-crystal-gazer"] = {
    cat:["wizard","grad","dark"],
    font:"\"Playfair Display\",\"Noto Serif JP\",serif",
    type:{"title":"\"Playfair Display\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"🔮"},
    label:{"ja":"クリスタルゲイザー","en":"Crystal Gazer","zh":"水晶凝视者","ko":"크리스털 게이저"},
    desc:{"ja":"ガラスモーフィズムとbackdrop-filterぼかし、半透明パネルの水晶占い体験","en":"Glassmorphism and backdrop-filter blur, semi-transparent pan","zh":"玻璃拟态和backdrop-filter模糊，半透明面板的水晶占卜体验","ko":"글라스모피즘과 backdrop-filter 블러, 반투명 패널의 수정 구 점술 체험"},
    ui:{"--ui-bg":"#090d1c","--ui-panel":"rgba(9,13,28,0.96)","--ui-soft":"rgba(220,230,255,0.05)","--ui-text":"#dce6ff","--ui-muted":"#b8c8f0","--ui-border":"rgba(122,162,255,.35)","--ui-button":"#1a2440","--ui-button-hover":"#333d59","--ui-field":"#0b1026","--ui-accent":"#7aa2ff","--ui-on-accent":"#000000","--ui-gold":"#e0c38c","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(122,162,255,0.14)"},
    game:{"don":"#7aa2ff","ka":"#9fbbff","stage":"#0b1026","lane":"rgba(9,13,28,0.6)","track":"rgba(220,230,255,0.24)","ink":"#dce6ff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(9,13,28,0.95)","perfect":"#e0c38c","good":"#dce6ff","miss":"#7d8499","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.2) contrast(1.15) brightness(1.05)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"🔮","caret":"#7aa2ff","scan":0.12,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-douhet"] = {
    cat:["wizard","dark","fun"],
    font:"\"Cinzel\",\"Trajan Pro\",serif",
    type:{"title":"\"Cinzel\",serif","weight":"700","lh":"1.5","titleWeight":"800","titleSpace":".1em","titleTransform":"uppercase","mark":"✈"},
    label:{"ja":"ドゥーエ 制空","en":"Douhet The Command of the Air","zh":"杜埃 制空权","ko":"두에 공중제공"},
    desc:{"ja":"航空戦略の先駆、制空権と戦略爆撃の理論","en":"Pioneer of air strategy, command of the air and strategic bo","zh":"航空战略的先驱，制空权与战略轰炸理论","ko":"항공전략의 선구자, 공중제공과 전략폭격 이론"},
    ui:{"--ui-bg":"#0f0f3d","--ui-panel":"rgba(15,15,61,0.96)","--ui-soft":"rgba(230,230,250,0.05)","--ui-text":"#e6e6fa","--ui-muted":"#c4b0eb","--ui-border":"rgba(65,105,225,.35)","--ui-button":"#2c2c6c","--ui-button-hover":"#44447e","--ui-field":"#1a1a2e","--ui-accent":"#4169e1","--ui-on-accent":"#ffffff","--ui-gold":"#ffd700","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(65,105,225,0.14)"},
    game:{"don":"#4169e1","ka":"#6495ed","stage":"#1a1a2e","lane":"rgba(15,15,61,0.6)","track":"rgba(230,230,250,0.24)","ink":"#e6e6fa","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(15,15,61,0.95)","perfect":"#ffd700","good":"#e6e6fa","miss":"#8585a5","glow":false},
    shapes:["circle","circle"],
    video:"hue-rotate(220deg) saturate(1.1) contrast(1.2) brightness(.85)",
    cli:{"font":"Courier New, Courier, monospace","prompt":"✈","caret":"#4169e1","scan":0.22,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
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
  S["wizard-focus-ring-navigator"] = {
    cat:["wizard","light","access"],
    font:"\"Caslon\",\"Garamond\",serif",
    type:{"title":"\"Caslon\",serif","weight":"500","lh":"1.6","titleWeight":"600","titleSpace":".03em","mark":"◎"},
    label:{"ja":"フォーカスリング・ナビゲーター","en":"Focus Ring Navigator","zh":"焦点环导航者","ko":"포커스 링 항해사"},
    desc:{"ja":":focus-visible をフル活用、キーボードのみでの完全操作とフォーカスリング強化","en":"Full use of :focus-visible, keyboard-only full operation and","zh":"全面使用:focus-visible，仅键盘的完全操作和焦点环增强","ko":":focus-visible를 완전히 활용, 키보드만으로의 완전한 조작과 포커스 링 강화"},
    ui:{"--ui-bg":"#fafafa","--ui-panel":"rgba(250,250,250,0.96)","--ui-soft":"rgba(26,26,26,0.05)","--ui-text":"#1a1a1a","--ui-muted":"#575757","--ui-border":"rgba(212,175,55,.35)","--ui-button":"#e8e8e8","--ui-button-hover":"#cdcdcd","--ui-field":"#ffffff","--ui-accent":"#d4af37","--ui-on-accent":"#000000","--ui-gold":"#ffd700","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#8b4513","stage":"#ffffff","lane":"rgba(250,250,250,0.82)","track":"rgba(26,26,26,0.24)","ink":"#1a1a1a","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(250,250,250,0.95)","perfect":"#ffd700","good":"#1a1a1a","miss":"#7f7f7f","glow":false},
    shapes:["circle","circle"],
    video:"contrast(1.05) brightness(1.0)",
    cli:{"font":"Courier New, Courier, monospace","prompt":"◎","caret":"#d4af37","scan":0.1,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-glitch-sorcerer"] = {
    cat:["wizard","dark","fun"],
    font:"\"Courier New\",\"Courier\",monospace",
    type:{"title":"\"Courier New\",monospace","weight":"700","lh":"1.4","titleWeight":"900","titleSpace":".05em","titleTransform":"uppercase","mark":"═▓▒░"},
    label:{"ja":"グリッチソーサラー","en":"Glitch Sorcerer","zh":"故障术士","ko":"글리치 소서러"},
    desc:{"ja":"CSSアニメーションによるグリッチ・色ずれ・走査線エフェクト、デジタル魔術","en":"CSS animation glitch, chromatic aberration and scanline effe","zh":"CSS动画故障、色差和扫描线效果，数字魔术","ko":"CSS 애니메이션 글리치, 색수차 및 주사선 효과, 디지털 마술"},
    ui:{"--ui-bg":"#050505","--ui-panel":"rgba(3,20,6,0.96)","--ui-soft":"rgba(0,255,0,0.05)","--ui-text":"#00ff00","--ui-muted":"#00cc00","--ui-border":"rgba(0,255,255,.30)","--ui-button":"#1a1a1a","--ui-button-hover":"#173817","--ui-field":"#0a0a0a","--ui-accent":"#ff00ff","--ui-on-accent":"#000000","--ui-gold":"#00ffff","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,0,255,0.14)"},
    game:{"don":"#ff00ff","ka":"#00ffff","stage":"#0a0a0a","lane":"rgba(3,20,6,0.6)","track":"rgba(0,255,0,0.24)","ink":"#00ff00","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(3,20,6,0.95)","perfect":"#00ffff","good":"#00ff00","miss":"#028f02","glow":false},
    shapes:["square","square"],
    video:"hue-rotate(180deg) saturate(1.6) contrast(1.3) brightness(.85)",
    cli:{"font":"Courier New, Courier, monospace","prompt":"▓","caret":"#00ffff","scan":0.25,"cursor":"block","opacity":0.9,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-goetia"] = {
    cat:["wizard","dark","fun"],
    font:"\"Cinzel\",\"Trajan Pro\",serif",
    type:{"title":"\"Cinzel\",serif","weight":"700","lh":"1.5","titleWeight":"800","titleSpace":".1em","titleTransform":"uppercase","mark":"72"},
    label:{"ja":"ゴエティア","en":"Goetia","zh":"高蒂亚","ko":"고에티아"},
    desc:{"ja":"72柱の悪魔を列伝するソロモンの鍵の一部分、深紅の魔術陣","en":"Part of the Lesser Key of Solomon listing 72 demons, crimson","zh":"所罗门钥匙的一部分，列传72柱恶魔，深红色魔法阵","ko":"솔로몬의 소록의 일부, 72귀리를 나열하는 것, 진홍색 마법진"},
    ui:{"--ui-bg":"#100000","--ui-panel":"rgba(16,0,0,0.96)","--ui-soft":"rgba(255,215,0,0.05)","--ui-text":"#ffd700","--ui-muted":"#c38686","--ui-border":"rgba(139,0,0,.35)","--ui-button":"#3d0000","--ui-button-hover":"#561c00","--ui-field":"#1a0000","--ui-accent":"#8b0000","--ui-on-accent":"#ffffff","--ui-gold":"#ffd700","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(139,0,0,0.14)"},
    game:{"don":"#8b0000","ka":"#a52a2a","stage":"#1a0000","lane":"rgba(16,0,0,0.6)","track":"rgba(255,215,0,0.24)","ink":"#ffd700","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(16,0,0,0.95)","perfect":"#ffd700","good":"#ffd700","miss":"#937600","glow":false},
    shapes:["square","square"],
    video:"hue-rotate(0deg) saturate(1.4) contrast(1.25) brightness(.85)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"72","caret":"#8b0000","scan":0.25,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
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
  S["wizard-grimoire-aureate"] = {
    cat:["wizard","grad","light"],
    font:"\"Playfair Display\",\"Noto Serif JP\",serif",
    type:{"title":"\"Playfair Display\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"あア漢 Aa"},
    label:{"ja":"黄金の魔導書","en":"Grimoire Aureate","zh":"黄金之魔导书","ko":"황금의 마도서"},
    desc:{"ja":"金箔押しの魔導書、錬金術師の秘録","en":"Gold-leaf grimoire, alchemist’s secret record","zh":"金箔装饰魔导书，炼金术师秘录","ko":"금박 인쇄 마도서, 연금술사 비급"},
    ui:{"--ui-bg":"#3e2f14","--ui-panel":"rgba(62,47,20,0.96)","--ui-soft":"rgba(240,230,210,0.05)","--ui-text":"#f0e6d2","--ui-muted":"#e4d8c5","--ui-border":"rgba(212,175,55,.35)","--ui-button":"#5d4524","--ui-button-hover":"#705a3b","--ui-field":"#4a3a1a","--ui-accent":"#d4af37","--ui-on-accent":"#000000","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#c5a059","stage":"#4a3a1a","lane":"rgba(62,47,20,0.6)","track":"rgba(240,230,210,0.24)","ink":"#f0e6d2","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(62,47,20,0.95)","perfect":"#ffe082","good":"#f0e6d2","miss":"#a0947d","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.2) saturate(1.15) brightness(1.05)",
    cli:{"font":"Cinzel, Trajan Pro, serif","prompt":"✦","caret":"#d4af37","scan":0.18,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-grimoire-celestial"] = {
    cat:["wizard","grad","light"],
    font:"\"Playfair Display\",\"Noto Serif JP\",serif",
    type:{"title":"\"Playfair Display\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"あア漢 Aa"},
    label:{"ja":"天球の魔導書","en":"Grimoire Celestial","zh":"天球之魔导书","ko":"천구의 마도서"},
    desc:{"ja":"星図を描いた魔導書、星座が導く魔術","en":"Grimoire painted with star charts, constellations guide the ","zh":"绘有星图的魔导书，星座引导魔术","ko":"별자리를 그린 마도서, 별자리가 이끄는 마법"},
    ui:{"--ui-bg":"#090d1c","--ui-panel":"rgba(9,13,28,0.96)","--ui-soft":"rgba(220,230,255,0.05)","--ui-text":"#dce6ff","--ui-muted":"#b8c8f0","--ui-border":"rgba(122,162,255,.35)","--ui-button":"#1a2440","--ui-button-hover":"#333d59","--ui-field":"#0b1026","--ui-accent":"#7aa2ff","--ui-on-accent":"#000000","--ui-gold":"#e0c38c","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(122,162,255,0.14)"},
    game:{"don":"#7aa2ff","ka":"#9fbbff","stage":"#0b1026","lane":"rgba(9,13,28,0.6)","track":"rgba(220,230,255,0.24)","ink":"#dce6ff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(9,13,28,0.95)","perfect":"#e0c38c","good":"#dce6ff","miss":"#7d8499","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.2) contrast(1.15) brightness(1.05)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"★","caret":"#7aa2ff","scan":0.12,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-grimoire-noir"] = {
    cat:["wizard","dark","access"],
    font:"\"Caslon\",\"Garamond\",serif",
    type:{"title":"\"Caslon\",serif","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".03em","mark":"☿ ☽ ♀"},
    label:{"ja":"黒の魔導書","en":"Grimoire Noir","zh":"黑之魔导书","ko":"흑의 마도서"},
    desc:{"ja":"羊皮紙と黒革の魔導書、禁忌の呪文が刻まれる","en":"Parchment and black leather grimoire, forbidden spells inscr","zh":"羊皮纸与黑皮魔导书，刻印禁忌咒语","ko":"양피지와 흑색 가죽 마도서, 금기의 주문 각인"},
    ui:{"--ui-bg":"#100e0a","--ui-panel":"rgba(16,14,10,0.96)","--ui-soft":"rgba(212,199,184,0.05)","--ui-text":"#d4c7b8","--ui-muted":"#ac9b8a","--ui-border":"rgba(139,0,0,.35)","--ui-button":"#241e18","--ui-button-hover":"#3b342d","--ui-field":"#141210","--ui-accent":"#8b0000","--ui-on-accent":"#ffffff","--ui-gold":"#d4af37","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(139,0,0,0.14)"},
    game:{"don":"#8b0000","ka":"#a67c52","stage":"#141210","lane":"rgba(16,14,10,0.6)","track":"rgba(212,199,184,0.24)","ink":"#d4c7b8","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(16,14,10,0.95)","perfect":"#d4af37","good":"#d4c7b8","miss":"#7c746a","glow":false},
    shapes:["circle","square"],
    video:"sepia(.3) contrast(1.15) brightness(.9)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"🔮","caret":"#8b0000","scan":0.15,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-grimoire-umbra"] = {
    cat:["wizard","dark","fun"],
    font:"\"Cinzel\",\"Trajan Pro\",serif",
    type:{"title":"\"Cinzel\",serif","weight":"700","lh":"1.5","titleWeight":"800","titleSpace":".1em","titleTransform":"uppercase","mark":"✧ UMBRA ✧"},
    label:{"ja":"影の魔導書","en":"Grimoire Umbra","zh":"影之魔导书","ko":"그림자의 마도서"},
    desc:{"ja":"闇に沈む魔導書、影獣がうごめくページ","en":"Grimoire sunk in darkness, shadow beasts stir in the pages","zh":"沉没在黑暗中的魔导书，影兽蠢动的书页","ko":"어둠에 잠긴 마도서, 그림자 짐승이 꿈틀하는 페이지"},
    ui:{"--ui-bg":"#06060c","--ui-panel":"rgba(6,6,12,0.96)","--ui-soft":"rgba(200,208,224,0.05)","--ui-text":"#c8d0e0","--ui-muted":"#9aa0b8","--ui-border":"rgba(107,91,149,.35)","--ui-button":"#1a1a24","--ui-button-hover":"#31323c","--ui-field":"#0a0a12","--ui-accent":"#6b5b95","--ui-on-accent":"#ffffff","--ui-gold":"#b8a040","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(107,91,149,0.14)"},
    game:{"don":"#6b5b95","ka":"#8b7cb8","stage":"#0a0a12","lane":"rgba(6,6,12,0.6)","track":"rgba(200,208,224,0.24)","ink":"#c8d0e0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(6,6,12,0.95)","perfect":"#b8a040","good":"#c8d0e0","miss":"#717581","glow":false},
    shapes:["square","diamond"],
    video:"hue-rotate(240deg) saturate(.9) contrast(1.25) brightness(.85)",
    cli:{"font":"Courier New, Courier, monospace","prompt":"☽","caret":"#6b5b95","scan":0.2,"cursor":"block","opacity":0.9,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-heptameron"] = {
    cat:["wizard","grad","light"],
    font:"\"Playfair Display\",\"Noto Serif JP\",serif",
    type:{"title":"\"Playfair Display\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"7日"},
    label:{"ja":"ヘプタメロン","en":"Heptameron","zh":"七天书","ko":"헵타메론"},
    desc:{"ja":"7日間の天使魔術、ポーピアーノによる天使召喚と白魔術の儀式","en":"Seven days of angelic magic, Pietro d\\u2019Abano\\u2019s ange","zh":"七天的天使魔术：彼得罗·达巴诺的天使召唤与白魔术仪式","ko":"7일간의 천사 마법, 피에트로・다바노의 천사 소환과 백마술 의식"},
    ui:{"--ui-bg":"#4a3520","--ui-panel":"rgba(74,53,32,0.96)","--ui-soft":"rgba(240,230,210,0.05)","--ui-text":"#f0e6d2","--ui-muted":"#efe6d7","--ui-border":"rgba(212,175,55,.35)","--ui-button":"#7a5d40","--ui-button-hover":"#7f6246","--ui-field":"#5d4a3a","--ui-accent":"#c5a059","--ui-on-accent":"#000000","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(197,160,89,0.14)"},
    game:{"don":"#d4af37","ka":"#c5a059","stage":"#5d4a3a","lane":"rgba(74,53,32,0.6)","track":"rgba(240,230,210,0.24)","ink":"#f0e6d2","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(74,53,32,0.95)","perfect":"#ffe082","good":"#f0e6d2","miss":"#aa9b88","glow":false},
    shapes:["circle","square"],
    video:"sepia(.3) saturate(1.1) contrast(1.15) brightness(.95)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"☿","caret":"#c5a059","scan":0.16,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-hermetic"] = {
    cat:["wizard","grad","light"],
    font:"\"Trajan Pro\",\"Caslon\",serif",
    type:{"title":"\"Trajan Pro\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".04em","mark":"☿"},
    label:{"ja":"ヘルメティック","en":"Hermetic","zh":"赫密斯","ko":"헤르메스"},
    desc:{"ja":"ヘルメス主義、黄金の黄昏と秘教幾何学","en":"Hermeticism, golden twilight and occult geometry","zh":"赫密斯主义，金色黄昏与秘教几何","ko":"헤르메스주의, 황금 황혼과 비밀 기하학"},
    ui:{"--ui-bg":"#5c4033","--ui-panel":"rgba(224,192,160,0.96)","--ui-soft":"rgba(58,42,90,0.05)","--ui-text":"#3a2a5a","--ui-muted":"#3a2a5a","--ui-border":"rgba(212,175,55,.35)","--ui-button":"#b49b5e","--ui-button-hover":"#b2995e","--ui-field":"#ffe0b2","--ui-accent":"#ffd700","--ui-on-accent":"#000000","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,215,0,0.14)"},
    game:{"don":"#ffd700","ka":"#d4af37","stage":"#936b09","lane":"rgba(224,192,160,0.6)","track":"rgba(58,42,90,0.24)","ink":"#fffdf0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(224,192,160,0.95)","perfect":"#ffe082","good":"#fffdf0","miss":"#493448","glow":false},
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
  S["wizard-honorius"] = {
    cat:["wizard","light","access"],
    font:"\"Cinzel\",\"Trajan Pro\",serif",
    type:{"title":"\"Cinzel\",serif","weight":"700","lh":"1.5","titleWeight":"800","titleSpace":".1em","titleTransform":"uppercase","mark":"✝"},
    label:{"ja":"ホノリウスの誓約書","en":"Sworn Book of Honorius","zh":"霍诺留斯誓约书","ko":"호노리우스의 맹약서"},
    desc:{"ja":"教会に認められた白魔術、神の御名と祈り、浄化と防御の儀式","en":"Church-sanctioned white magic, the holy name of God and pray","zh":"教会认可的白魔术，上帝的圣名与祈祷，净化与防御仪式","ko":"교회가 인정한 백마술, 하느님의 거룩한 이름과 기도, 정화와 방어 의식"},
    ui:{"--ui-bg":"#fafafa","--ui-panel":"rgba(250,250,250,0.96)","--ui-soft":"rgba(26,26,26,0.05)","--ui-text":"#1a1a1a","--ui-muted":"#575757","--ui-border":"rgba(212,175,55,.35)","--ui-button":"#e8e8e8","--ui-button-hover":"#cdcdcd","--ui-field":"#ffffff","--ui-accent":"#d4af37","--ui-on-accent":"#000000","--ui-gold":"#ffd700","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#8b4513","stage":"#ffffff","lane":"rgba(250,250,250,0.82)","track":"rgba(26,26,26,0.24)","ink":"#1a1a1a","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(250,250,250,0.95)","perfect":"#ffd700","good":"#1a1a1a","miss":"#7f7f7f","glow":false},
    shapes:["circle","circle"],
    video:"contrast(1.05) brightness(1.0)",
    cli:{"font":"Courier New, Courier, monospace","prompt":"✝","caret":"#d4af37","scan":0.1,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-jomini"] = {
    cat:["wizard","light","access"],
    font:"\"Playfair Display\",\"Noto Serif JP\",serif",
    type:{"title":"\"Playfair Display\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"J"},
    label:{"ja":"ジョミニ 戦争概論","en":"Jomini Summary of the Art of War","zh":"若米尼 战争概论","ko":"조미니 전쟁 개론"},
    desc:{"ja":"ナポレオン戦争の戦術家、戦争の原理と体系化","en":"Napoleonic wars tactician, principles and systematization of","zh":"拿破仑战争的战术家，战争的原理与体系化","ko":"나폴레옹 전쟁의 전략가, 전쟁의 원리와 체계화"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(26,26,26,0.05)","--ui-text":"#1a1a1a","--ui-muted":"#4a5568","--ui-border":"rgba(44,82,130,.35)","--ui-button":"#e2e8f0","--ui-button-hover":"#c8cdd4","--ui-field":"#fafafa","--ui-accent":"#2c5282","--ui-on-accent":"#ffffff","--ui-gold":"#7aa2f7","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(44,82,130,0.14)"},
    game:{"don":"#2c5282","ka":"#4a5568","stage":"#fafafa","lane":"rgba(255,255,255,0.82)","track":"rgba(26,26,26,0.24)","ink":"#1a1a1a","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#7aa2f7","good":"#1a1a1a","miss":"#818181","glow":false},
    shapes:["circle","circle"],
    video:"contrast(1.05) brightness(1.0)",
    cli:{"font":"Courier New, Courier, monospace","prompt":"J","caret":"#2c5282","scan":0.1,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-lemgeton"] = {
    cat:["wizard","dark","access"],
    font:"\"Cinzel\",\"Trajan Pro\",serif",
    type:{"title":"\"Cinzel\",serif","weight":"700","lh":"1.5","titleWeight":"800","titleSpace":".1em","titleTransform":"uppercase","mark":"⛤"},
    label:{"ja":"レメゲトン","en":"Lesser Key of Solomon","zh":"所罗门小钥匙","ko":"솔로몬의 작은 열쇠"},
    desc:{"ja":" goetiaを含む禁忌の魔導書、72柱の悪魔を従属させる印","en":"Lemegeton, forbidden grimoire including Goetia, seals to com","zh":"《小钥匙》，包含高蒂亚的禁忌魔导书，征服72柱恶魔的印记","ko":"레메게톤, 고에티아를 포함한 금기의 마도서와 72 악마의 인장"},
    ui:{"--ui-bg":"#06050a","--ui-panel":"rgba(6,5,10,0.96)","--ui-soft":"rgba(216,208,224,0.05)","--ui-text":"#d8d0e0","--ui-muted":"#a199b3","--ui-border":"rgba(75,0,130,.35)","--ui-button":"#1a1624","--ui-button-hover":"#332e3c","--ui-field":"#0a0810","--ui-accent":"#4b0082","--ui-on-accent":"#ffffff","--ui-gold":"#d4af37","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(75,0,130,0.14)"},
    game:{"don":"#4b0082","ka":"#6a5acd","stage":"#0a0810","lane":"rgba(6,5,10,0.6)","track":"rgba(216,208,224,0.24)","ink":"#d8d0e0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(6,5,10,0.95)","perfect":"#d4af37","good":"#d8d0e0","miss":"#7a7580","glow":false},
    shapes:["square","diamond"],
    video:"hue-rotate(260deg) saturate(1.2) contrast(1.3) brightness(.8)",
    cli:{"font":"Courier New, Courier, monospace","prompt":"⛤","caret":"#8b00ff","scan":0.2,"cursor":"block","opacity":0.9,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-liu-tao"] = {
    cat:["wizard","grad","light"],
    font:"\"KaiTi\",\"SimSun\",serif",
    type:{"title":"\"KaiTi\",serif","weight":"500","lh":"1.7","titleWeight":"700","titleSpace":".04em","mark":"韜"},
    label:{"ja":"六韜","en":"Six Secret Teachings","zh":"六韬","ko":"육도"},
    desc:{"ja":"姜太公が文王に伝えたとされる中国最古の軍略書、韜略の六篇","en":"Chinese military classic attributed to Jiang Taigong, six se","zh":"据说姜太公传给文王的中国最古老的军略书，六韬六篇","ko":"강태공이 문왕에 전했다고 하는 중국最古의 군사전략서, 육도 육편"},
    ui:{"--ui-bg":"#f0e8d8","--ui-panel":"rgba(240,232,216,0.96)","--ui-soft":"rgba(42,36,30,0.05)","--ui-text":"#2a241e","--ui-muted":"#5f513a","--ui-border":"rgba(184,134,11,.35)","--ui-button":"#e8e0d0","--ui-button-hover":"#cfc8b9","--ui-field":"#f5efe0","--ui-accent":"#b8860b","--ui-on-accent":"#000000","--ui-gold":"#ffd700","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(184,134,11,0.14)"},
    game:{"don":"#b8860b","ka":"#8b4513","stage":"#f5efe0","lane":"rgba(240,232,216,0.82)","track":"rgba(42,36,30,0.24)","ink":"#2a241e","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(240,232,216,0.95)","perfect":"#ffd700","good":"#2a241e","miss":"#837c72","glow":false},
    shapes:["square","square"],
    video:"sepia(.25) contrast(1.1) brightness(1.05)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"韜","caret":"#b8860b","scan":0.14,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-machiavelli"] = {
    cat:["wizard","grad","light"],
    font:"\"Caslon\",\"Garamond\",serif",
    type:{"title":"\"Caslon\",serif","weight":"500","lh":"1.6","titleWeight":"600","titleSpace":".03em","mark":"V"},
    label:{"ja":"マキアヴェッリ 戦術論","en":"Machiavelli The Art of War","zh":"马基雅维利 战争术","ko":"마키아벨리 전쟁론"},
    desc:{"ja":"ルネサンス期の政治・軍事論、君主論と戦争の芸術","en":"Renaissance political military treatise, The Prince and the ","zh":"文艺复兴时期的政治军事论，君主论与战争艺术","ko":"르네상스期의 정치 군사론, 군주론과 전쟁 예술"},
    ui:{"--ui-bg":"#f0e8d8","--ui-panel":"rgba(240,232,216,0.96)","--ui-soft":"rgba(42,36,30,0.05)","--ui-text":"#2a241e","--ui-muted":"#5f513a","--ui-border":"rgba(184,134,11,.35)","--ui-button":"#e8e0d0","--ui-button-hover":"#cfc8b9","--ui-field":"#f5efe0","--ui-accent":"#b8860b","--ui-on-accent":"#000000","--ui-gold":"#ffd700","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(184,134,11,0.14)"},
    game:{"don":"#b8860b","ka":"#8b4513","stage":"#f5efe0","lane":"rgba(240,232,216,0.82)","track":"rgba(42,36,30,0.24)","ink":"#2a241e","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(240,232,216,0.95)","perfect":"#ffd700","good":"#2a241e","miss":"#837c72","glow":false},
    shapes:["square","circle"],
    video:"sepia(.25) contrast(1.1) brightness(1.05)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"V","caret":"#b8860b","scan":0.14,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-mahan"] = {
    cat:["wizard","grad","dark"],
    font:"\"Caslon\",\"Garamond\",serif",
    type:{"title":"\"Caslon\",serif","weight":"500","lh":"1.6","titleWeight":"600","titleSpace":".03em","mark":"⚓"},
    label:{"ja":"マハン 海上権力史論","en":"Mahan The Influence of Sea Power","zh":"马汉 海权史论","ko":"마한 해상권력사론"},
    desc:{"ja":"海戦略の古典、制海権と海上貿易の重要性","en":"Classic of naval strategy, command of the sea and maritime t","zh":"海战略的经典，制海权与海上贸易的重要性","ko":"해전략의 고전, 제해권과 해상 무역의 중요성"},
    ui:{"--ui-bg":"#0b1420","--ui-panel":"rgba(11,20,32,0.96)","--ui-soft":"rgba(220,230,240,0.05)","--ui-text":"#dce6f0","--ui-muted":"#b2babb","--ui-border":"rgba(52,152,219,.35)","--ui-button":"#223040","--ui-button-hover":"#3a4857","--ui-field":"#121e2e","--ui-accent":"#3498db","--ui-on-accent":"#000000","--ui-gold":"#f1c40f","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(52,152,219,0.14)"},
    game:{"don":"#3498db","ka":"#2c3e50","stage":"#121e2e","lane":"rgba(11,20,32,0.6)","track":"rgba(220,230,240,0.24)","ink":"#dce6f0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(11,20,32,0.95)","perfect":"#f1c40f","good":"#dce6f0","miss":"#7e8892","glow":false},
    shapes:["circle","square"],
    video:"hue-rotate(200deg) saturate(1.1) contrast(1.15) brightness(.85)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"⚓","caret":"#3498db","scan":0.16,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
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
  S["wizard-necronomicon"] = {
    cat:["wizard","dark","fun"],
    font:"\"Cinzel\",\"Trajan Pro\",serif",
    type:{"title":"\"Cinzel\",serif","weight":"700","lh":"1.5","titleWeight":"800","titleSpace":".1em","titleTransform":"uppercase","mark":"📖"},
    label:{"ja":"ネクロノミコン","en":"Necronomicon","zh":"死灵名册","ko":"네크로노미콘"},
    desc:{"ja":"アブドル・アラハズレッドが執筆した禁書、死者の名を記す黒き書","en":"Forbidden book by Abdul Alhazred, black volume recording the","zh":"阿卜杜勒·阿尔哈兹莱德撰写的禁书，记载死者名字的黑色书卷","ko":"압둘 알하즈레드가 집필한 금서, 죽은 자의 이름을 기록하는 검은 책"},
    ui:{"--ui-bg":"#0a1408","--ui-panel":"rgba(10,20,8,0.96)","--ui-soft":"rgba(143,188,143,0.05)","--ui-text":"#8fbc8f","--ui-muted":"#8fb08f","--ui-border":"rgba(85,107,47,.35)","--ui-button":"#1a2e14","--ui-button-hover":"#294024","--ui-field":"#0d1b0a","--ui-accent":"#556b2f","--ui-on-accent":"#ffffff","--ui-gold":"#bdb76b","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(85,107,47,0.14)"},
    game:{"don":"#556b2f","ka":"#6b8e23","stage":"#0d1b0a","lane":"rgba(10,20,8,0.6)","track":"rgba(143,188,143,0.24)","ink":"#8fbc8f","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,20,8,0.95)","perfect":"#bdb76b","good":"#8fbc8f","miss":"#537052","glow":false},
    shapes:["circle","square"],
    video:"hue-rotate(100deg) saturate(.8) contrast(1.3) brightness(.8)",
    cli:{"font":"Courier New, Courier, monospace","prompt":"📖","caret":"#006400","scan":0.3,"cursor":"block","opacity":0.85,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-necronomicon-azif"] = {
    cat:["wizard","grad","dark"],
    font:"\"Playfair Display\",\"Noto Serif JP\",serif",
    type:{"title":"\"Playfair Display\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"アジ"},
    label:{"ja":"ネクロノミコン（アル・アジフ）","en":"Necronomicon (Al Azif)","zh":"死灵名册（阿赞飞）","ko":"네크로노미콘（알 아지프）"},
    desc:{"ja":"元のアラビア語名「アル・アジフ」、夜の蝿が囁く狂気の書","en":"Original Arabic name Al Azif, book of madness whispered by n","zh":"原阿拉伯语名“阿赞飞”，夜之蝿低语的疯狂之书","ko":"원래 아랍어명 \"알 아지프\", 밤파리가 속삭이는 광기의 책"},
    ui:{"--ui-bg":"#0f0f3d","--ui-panel":"rgba(15,15,61,0.96)","--ui-soft":"rgba(230,230,250,0.05)","--ui-text":"#e6e6fa","--ui-muted":"#c8c8ff","--ui-border":"rgba(65,105,225,.35)","--ui-button":"#2c2c6c","--ui-button-hover":"#44447e","--ui-field":"#191970","--ui-accent":"#4169e1","--ui-on-accent":"#ffffff","--ui-gold":"#ffd700","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(65,105,225,0.14)"},
    game:{"don":"#4169e1","ka":"#6495ed","stage":"#191970","lane":"rgba(15,15,61,0.6)","track":"rgba(230,230,250,0.24)","ink":"#e6e6fa","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(15,15,61,0.95)","perfect":"#ffd700","good":"#e6e6fa","miss":"#8585a5","glow":false},
    shapes:["circle","circle"],
    video:"hue-rotate(220deg) saturate(1.1) contrast(1.2) brightness(.85)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"アジ","caret":"#191970","scan":0.28,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
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
  S["wizard-raziel"] = {
    cat:["wizard","light","access"],
    font:"\"Caslon\",\"Garamond\",serif",
    type:{"title":"\"Caslon\",serif","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".03em","mark":"☿ ☽ ♀"},
    label:{"ja":"ラジエルの書","en":"Book of Raziel","zh":"拉齐尔之书","ko":"라지엘의 서"},
    desc:{"ja":"天使ラジエルがアダムに授けたとされるカバラ的グリモワール、宇宙の秘密と守護の知識","en":"Cabalistic grimoire said to be given by Archangel Raziel to ","zh":"据传由大天使拉齐尔赐予亚当的卡巴拉式魔导书，宇宙的奥秘与守护知识","ko":"천사 라지엘이 아담에게 주었다고 하는 카발라적 그모아르, 우주의 비밀과 보호의 지식"},
    ui:{"--ui-bg":"#e8edf4","--ui-panel":"rgba(232,237,244,0.96)","--ui-soft":"rgba(26,35,50,0.05)","--ui-text":"#1a2332","--ui-muted":"#3b556a","--ui-border":"rgba(122,162,247,.35)","--ui-button":"#dbe5f0","--ui-button-hover":"#c2ccd7","--ui-field":"#f0f4f8","--ui-accent":"#7aa2f7","--ui-on-accent":"#000000","--ui-gold":"#ffd700","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(122,162,247,0.14)"},
    game:{"don":"#d4af37","ka":"#7aa2f7","stage":"#f0f4f8","lane":"rgba(232,237,244,0.82)","track":"rgba(26,35,50,0.24)","ink":"#1a2332","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(232,237,244,0.95)","perfect":"#ffd700","good":"#1a2332","miss":"#777e89","glow":false},
    shapes:["circle","square"],
    video:"sepia(.05) contrast(1.05) brightness(1.05)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"ℜ","caret":"#7aa2f7","scan":0.12,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-reduce-motion-accessor"] = {
    cat:["wizard","dark","access"],
    font:"\"Cinzel\",\"Trajan Pro\",serif",
    type:{"title":"\"Cinzel\",serif","weight":"700","lh":"1.5","titleWeight":"800","titleSpace":".1em","titleTransform":"uppercase","mark":"♿"},
    label:{"ja":"リデュース・モーション・アクセシビラー","en":"Reduce Motion Accessor","zh":"减少动作的可达者","ko":"움직임 감소 접근자"},
    desc:{"ja":"prefers-reduced-motion をフル活用、モーション削減設定に応じたアニメーション制御","en":"Full use of prefers-reduced-motion, animation control based ","zh":"全面使用prefers-reduced-motion，根据运动减少设置进行动画控制","ko":"prefers-reduced-motion을 완전히 활용, 움직임 감소 설정에 따른 애니메이션 제어"},
    ui:{"--ui-bg":"#101010","--ui-panel":"rgba(16,16,16,0.96)","--ui-soft":"rgba(224,224,224,0.05)","--ui-text":"#e0e0e0","--ui-muted":"#d3a6a6","--ui-border":"rgba(139,0,0,.35)","--ui-button":"#2a2a2a","--ui-button-hover":"#424242","--ui-field":"#1a1a1a","--ui-accent":"#8b0000","--ui-on-accent":"#ffffff","--ui-gold":"#d4af37","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(139,0,0,0.14)"},
    game:{"don":"#8b0000","ka":"#a52a2a","stage":"#1a1a1a","lane":"rgba(16,16,16,0.6)","track":"rgba(224,224,224,0.24)","ink":"#e0e0e0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(16,16,16,0.95)","perfect":"#d4af37","good":"#e0e0e0","miss":"#828282","glow":false},
    shapes:["square","square"],
    video:"hue-rotate(0deg) saturate(1.4) contrast(1.25) brightness(.85)",
    cli:{"font":"Courier New, Courier, monospace","prompt":"♿","caret":"#8b0000","scan":0.2,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
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
  S["wizard-san-lue"] = {
    cat:["wizard","dark","access"],
    font:"\"KaiTi\",\"SimSun\",serif",
    type:{"title":"\"KaiTi\",serif","weight":"500","lh":"1.6","titleWeight":"600","titleSpace":".03em","mark":"略"},
    label:{"ja":"三略","en":"Three Strategies","zh":"三略","ko":"삼략"},
    desc:{"ja":"黄石公が張良に授けたとされる軍略書、上・中・下三篇","en":"Military classic attributed to Huang Shigong given to Zhang ","zh":"据说黄石公传给张良的军略书，上中下三篇","ko":"황석공이 장량에 전했다고 하는 군사전략서, 상·중·하 三篇"},
    ui:{"--ui-bg":"#101f10","--ui-panel":"rgba(16,31,16,0.96)","--ui-soft":"rgba(212,232,212,0.05)","--ui-text":"#d4e8d4","--ui-muted":"#c1d4c1","--ui-border":"rgba(74,124,89,.35)","--ui-button":"#2a4a2a","--ui-button-hover":"#405f40","--ui-field":"#1a2e1a","--ui-accent":"#4a7c59","--ui-on-accent":"#ffffff","--ui-gold":"#c5a059","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(74,124,89,0.14)"},
    game:{"don":"#4a7c59","ka":"#2f4f2f","stage":"#1a2e1a","lane":"rgba(16,31,16,0.6)","track":"rgba(212,232,212,0.24)","ink":"#d4e8d4","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(16,31,16,0.95)","perfect":"#c5a059","good":"#d4e8d4","miss":"#7c8e7c","glow":false},
    shapes:["circle","square"],
    video:"hue-rotate(100deg) saturate(1.1) contrast(1.15) brightness(.85)",
    cli:{"font":"Courier New, Courier, monospace","prompt":"略","caret":"#4a7c59","scan":0.16,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-scroll-driven-visionary"] = {
    cat:["wizard","grad","dark"],
    font:"\"Playfair Display\",\"Noto Serif JP\",serif",
    type:{"title":"\"Playfair Display\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"👁️"},
    label:{"ja":"スクロールドリブン・ビジョナー","en":"Scroll-Driven Visionary","zh":"滚动驱动的先知","ko":"스크롤 구동 예언자"},
    desc:{"ja":"Scroll-driven Animations をフル活用、animation-timeline: view() でス","en":"Full use of Scroll-driven Animations, animation-timeline: vi","zh":"全面使用Scroll-driven Animations，animation-timeline: view()用于滚动关","ko":"Scroll-driven Animations를 완전히 활용, animation-timeline: view()"},
    ui:{"--ui-bg":"#090d1c","--ui-panel":"rgba(9,13,28,0.96)","--ui-soft":"rgba(220,230,255,0.05)","--ui-text":"#dce6ff","--ui-muted":"#b8c8f0","--ui-border":"rgba(122,162,255,.35)","--ui-button":"#1a2440","--ui-button-hover":"#333d59","--ui-field":"#0b1026","--ui-accent":"#7aa2ff","--ui-on-accent":"#000000","--ui-gold":"#e0c38c","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(122,162,255,0.14)"},
    game:{"don":"#7aa2ff","ka":"#9fbbff","stage":"#0b1026","lane":"rgba(9,13,28,0.6)","track":"rgba(220,230,255,0.24)","ink":"#dce6ff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(9,13,28,0.95)","perfect":"#e0c38c","good":"#dce6ff","miss":"#7d8499","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.2) contrast(1.15) brightness(1.05)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"👁️","caret":"#7aa2ff","scan":0.12,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
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
  S["wizard-seven-military-classics"] = {
    cat:["wizard","life","grad"],
    font:"\"KaiTi\",\"SimSun\",serif",
    type:{"title":"\"KaiTi\",serif","weight":"500","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"七"},
    label:{"ja":"武経七書","en":"Seven Military Classics","zh":"武经七书","ko":"무경칠서"},
    desc:{"ja":"孫子・呉子・司馬法・尉繚子・李衛公問対・三略・六韜の七つの兵書","en":"Seven Chinese military classics, including Sunzi and Wuzi","zh":"孙子、吴子、司马法、尉缭子、李卫公问对、三略与六韬七部兵书","ko":"손자·오자·사마법·위료자·이위공문대·삼략·육도의 일곱 병서"},
    ui:{"--ui-bg":"#3e2f14","--ui-panel":"rgba(62,47,20,0.96)","--ui-soft":"rgba(240,230,210,0.05)","--ui-text":"#f0e6d2","--ui-muted":"#e4d8c5","--ui-border":"rgba(212,175,55,.35)","--ui-button":"#5d4524","--ui-button-hover":"#705a3b","--ui-field":"#4a3a1a","--ui-accent":"#d4af37","--ui-on-accent":"#000000","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#c5a059","stage":"#4a3a1a","lane":"rgba(62,47,20,0.6)","track":"rgba(240,230,210,0.24)","ink":"#f0e6d2","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(62,47,20,0.95)","perfect":"#ffe082","good":"#f0e6d2","miss":"#a0947d","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.2) saturate(1.15) contrast(1.1) brightness(1.0)",
    cli:{"font":"Cinzel, Trajan Pro, serif","prompt":"七","caret":"#d4af37","scan":0.18,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-sima-fa"] = {
    cat:["wizard","light","access"],
    font:"\"KaiTi\",\"SimSun\",serif",
    type:{"title":"\"KaiTi\",serif","weight":"500","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"司"},
    label:{"ja":"司馬法","en":"Methods of the Sima","zh":"司马法","ko":"사마법"},
    desc:{"ja":"春秋時代の軍律書、齊の司馬穰苴が著したとされる兵法","en":"Spring and Autumn period military code, attributed to Tian R","zh":"春秋时期的军律书，据说由齐的田穰苴著作的兵法","ko":"춘추 시대의 군율서, 제의 사마려주가 저술했다고 하는 병법"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(26,26,26,0.05)","--ui-text":"#1a1a1a","--ui-muted":"#4a5568","--ui-border":"rgba(44,82,130,.35)","--ui-button":"#e2e8f0","--ui-button-hover":"#c8cdd4","--ui-field":"#fafafa","--ui-accent":"#2c5282","--ui-on-accent":"#ffffff","--ui-gold":"#7aa2f7","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(44,82,130,0.14)"},
    game:{"don":"#2c5282","ka":"#4a5568","stage":"#fafafa","lane":"rgba(255,255,255,0.82)","track":"rgba(26,26,26,0.24)","ink":"#1a1a1a","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#7aa2f7","good":"#1a1a1a","miss":"#818181","glow":false},
    shapes:["circle","circle"],
    video:"contrast(1.05) brightness(1.0)",
    cli:{"font":"Courier New, Courier, monospace","prompt":"司","caret":"#2c5282","scan":0.1,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-solomon-book"] = {
    cat:["wizard","life","grad"],
    font:"\"Playfair Display\",\"Noto Serif JP\",serif",
    type:{"title":"\"Playfair Display\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"あア漢 Aa"},
    label:{"ja":"ソロモンの書","en":"Book of Solomon","zh":"所罗门之书","ko":"솔로몬의 서"},
    desc:{"ja":"賢王ソロモンの知恵が記された羊皮紙、黄金の知識と卓越した魔術","en":"Parchment of wise King Solomon, golden knowledge and transce","zh":"智慧之王所罗门记载的羊皮纸，黄金知识与卓越魔术","ko":"현왕 솔로몬의 지혜가 적힌 양피지, 황금 지식과 초월한 마술"},
    ui:{"--ui-bg":"#342810","--ui-panel":"rgba(52,40,16,0.96)","--ui-soft":"rgba(240,230,210,0.05)","--ui-text":"#f0e6d2","--ui-muted":"#e4d8c5","--ui-border":"rgba(212,175,55,.35)","--ui-button":"#5d4524","--ui-button-hover":"#705a3b","--ui-field":"#3e2f14","--ui-accent":"#d4af37","--ui-on-accent":"#000000","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#c5a059","stage":"#3e2f14","lane":"rgba(52,40,16,0.6)","track":"rgba(240,230,210,0.24)","ink":"#f0e6d2","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(52,40,16,0.95)","perfect":"#ffe082","good":"#f0e6d2","miss":"#9b917b","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.25) saturate(1.1) brightness(1.05)",
    cli:{"font":"Cinzel, Trajan Pro, serif","prompt":"📜","caret":"#8b4513","scan":0.12,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-solomon-key"] = {
    cat:["wizard","grad","light"],
    font:"\"Caslon\",\"Garamond\",serif",
    type:{"title":"\"Caslon\",serif","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".03em","mark":"☿ ☽ ♀"},
    label:{"ja":"ソロモンの鍵","en":"Key of Solomon","zh":"所罗门之钥","ko":"솔로몬의 열쇠"},
    desc:{"ja":" clavicula salomonis、神聖幾何学の印章と天使召喚の儀式","en":"Clavicula Salomonis, sacred geometry seals and angelic summo","zh":"《所罗门钥匙》，神圣几何学印记与天使召唤仪式","ko":"클라비cula 솔로몬니스, 신성 기하학 인장과 천사 소환 의식"},
    ui:{"--ui-bg":"#fffaf0","--ui-panel":"rgba(255,250,240,0.96)","--ui-soft":"rgba(42,36,30,0.05)","--ui-text":"#2a241e","--ui-muted":"#5f523a","--ui-border":"rgba(184,134,11,.35)","--ui-button":"#e8e0d0","--ui-button-hover":"#cfc8b9","--ui-field":"#f5f1e6","--ui-accent":"#b8860b","--ui-on-accent":"#000000","--ui-gold":"#ffd700","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(184,134,11,0.14)"},
    game:{"don":"#b8860b","ka":"#8b4513","stage":"#f5f1e6","lane":"rgba(255,250,240,0.82)","track":"rgba(42,36,30,0.24)","ink":"#2a241e","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,250,240,0.95)","perfect":"#ffd700","good":"#2a241e","miss":"#8a847d","glow":false},
    shapes:["circle","square"],
    video:"sepia(.15) contrast(1.1) brightness(1.05)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"🗝️","caret":"#b8860b","scan":0.15,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
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
  S["wizard-sun-tzu"] = {
    cat:["wizard","dark","fun"],
    font:"\"KaiTi\",\"SimSun\",serif",
    type:{"title":"\"KaiTi\",serif","weight":"700","lh":"1.5","titleWeight":"800","titleSpace":".1em","mark":"孫"},
    label:{"ja":"孫子","en":"The Art of War","zh":"孙子兵法","ko":"손자"},
    desc:{"ja":"孫武が著したとされる兵法の最高峰、知略と戦略の極意","en":"Sun Tzu’s supreme military classic, essence of stratagem and","zh":"据说孙武著作的兵法最高峰，智略与战略的极意","ko":"손무가 저술했다고 하는 병법의 최고봉, 지략과 전략의 극의"},
    ui:{"--ui-bg":"#100000","--ui-panel":"rgba(16,0,0,0.96)","--ui-soft":"rgba(255,215,0,0.05)","--ui-text":"#ffd700","--ui-muted":"#c38686","--ui-border":"rgba(139,0,0,.35)","--ui-button":"#3d0000","--ui-button-hover":"#561c00","--ui-field":"#1a0a0a","--ui-accent":"#8b0000","--ui-on-accent":"#ffffff","--ui-gold":"#d4af37","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(139,0,0,0.14)"},
    game:{"don":"#8b0000","ka":"#a52a2a","stage":"#1a0a0a","lane":"rgba(16,0,0,0.6)","track":"rgba(255,215,0,0.24)","ink":"#ffd700","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(16,0,0,0.95)","perfect":"#d4af37","good":"#ffd700","miss":"#937600","glow":false},
    shapes:["square","square"],
    video:"hue-rotate(0deg) saturate(1.4) contrast(1.25) brightness(.85)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"孫","caret":"#8b0000","scan":0.2,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
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
  S["wizard-vegetius"] = {
    cat:["wizard","grad","dark"],
    font:"\"Caslon\",\"Garamond\",serif",
    type:{"title":"\"Caslon\",serif","weight":"500","lh":"1.6","titleWeight":"600","titleSpace":".03em","mark":"M"},
    label:{"ja":"ウェゲティウス 軍事論","en":"Vegetius De Re Militari","zh":"韦格提乌 兵法论","ko":"ウェ게티우스 군사론"},
    desc:{"ja":"古代ローマの軍事論、軍制・訓練・戦術の体系","en":"Ancient Roman military treatise, system of military organiza","zh":"古罗马的军事论，军制训练与战术体系","ko":"고대 로마의 군사론, 군제 훈련 및 전술 체계"},
    ui:{"--ui-bg":"#1e1e28","--ui-panel":"rgba(30,30,40,0.96)","--ui-soft":"rgba(216,212,192,0.05)","--ui-text":"#d8d4c0","--ui-muted":"#c6c0b3","--ui-border":"rgba(139,115,85,.35)","--ui-button":"#3a3a4a","--ui-button-hover":"#4f4e59","--ui-field":"#2a2a3a","--ui-accent":"#8b7355","--ui-on-accent":"#000000","--ui-gold":"#d4af37","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(139,115,85,0.14)"},
    game:{"don":"#8b7355","ka":"#5d4037","stage":"#2a2a3a","lane":"rgba(30,30,40,0.6)","track":"rgba(216,212,192,0.24)","ink":"#d8d4c0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(30,30,40,0.95)","perfect":"#d4af37","good":"#d8d4c0","miss":"#84827c","glow":false},
    shapes:["square","square"],
    video:"sepia(.3) contrast(1.15) brightness(.9)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"M","caret":"#8b7355","scan":0.14,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-view-transition-master"] = {
    cat:["wizard","grad","light"],
    font:"\"Caslon\",\"Garamond\",serif",
    type:{"title":"\"Caslon\",serif","weight":"500","lh":"1.6","titleWeight":"600","titleSpace":".03em","mark":"✦"},
    label:{"ja":"遷移マスター","en":"View Transition Master","zh":"视图过渡大师","ko":"뷰 전환 마스터"},
    desc:{"ja":"View Transitions API をフル活用、スキン変更時の要素ごとのスムーズ遷移アニメーション","en":"Full use of View Transitions API, element-by-element smooth ","zh":"全面使用View Transitions API，皮肤更换时元素之间的平滑过渡动画","ko":"View Transitions API를 완전히 활용, 스킨 변경 시 요소별 부드러운 전환 애니메이션"},
    ui:{"--ui-bg":"#f0e8d8","--ui-panel":"rgba(240,232,216,0.96)","--ui-soft":"rgba(42,36,30,0.05)","--ui-text":"#2a241e","--ui-muted":"#5f513a","--ui-border":"rgba(184,134,11,.35)","--ui-button":"#e8e0d0","--ui-button-hover":"#cfc8b9","--ui-field":"#f5f1e6","--ui-accent":"#b8860b","--ui-on-accent":"#000000","--ui-gold":"#ffd700","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(184,134,11,0.14)"},
    game:{"don":"#b8860b","ka":"#8b4513","stage":"#f5f1e6","lane":"rgba(240,232,216,0.82)","track":"rgba(42,36,30,0.24)","ink":"#2a241e","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(240,232,216,0.95)","perfect":"#ffd700","good":"#2a241e","miss":"#837c72","glow":false},
    shapes:["circle","square"],
    video:"sepia(.2) contrast(1.1) brightness(1.05)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"✦","caret":"#b8860b","scan":0.14,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-void"] = {
    cat:["wizard","dark","access"],
    font:"\"Rajdhani\",\"Oswald\",sans-serif",
    type:{"title":"\"Rajdhani\",sans-serif","weight":"700","lh":"1.1","titleWeight":"900","titleSpace":"-.04em","titleTransform":"uppercase","mark":"Ø"},
    label:{"ja":"ヴォイド","en":"Void","zh":"虚空","ko":"보이드"},
    desc:{"ja":"虚無の空間、すべてを飲み込む黒","en":"Void space, black that swallows everything","zh":"虚空，吞噬一切的黑","ko":"공허 공간, 모든 것을 삼키는 검정"},
    ui:{"--ui-bg":"#000000","--ui-panel":"rgba(0,0,0,0.96)","--ui-soft":"rgba(224,224,224,0.05)","--ui-text":"#e0e0e0","--ui-muted":"#8a8a8a","--ui-border":"rgba(26,26,26,.20)","--ui-button":"#050505","--ui-button-hover":"#212121","--ui-field":"#000000","--ui-accent":"#1a1a1a","--ui-on-accent":"#ffffff","--ui-gold":"#2a2a2a","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(26,26,26,0.14)"},
    game:{"don":"#111111","ka":"#0a0a0a","stage":"#000000","lane":"rgba(0,0,0,0.6)","track":"rgba(224,224,224,0.24)","ink":"#ffffff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(0,0,0,0.95)","perfect":"#2a2a2a","good":"#ffffff","miss":"#7b7b7b","glow":false},
    shapes:["square","square"],
    video:"brightness(.6) contrast(1.4)"
  };
  S["wizard-void-walker"] = {
    cat:["wizard","dark","access"],
    font:"\"Cinzel\",\"Trajan Pro\",serif",
    type:{"title":"\"Cinzel\",serif","weight":"700","lh":"1.5","titleWeight":"800","titleSpace":".1em","titleTransform":"uppercase","mark":"◊"},
    label:{"ja":"ボイドウォーカー","en":"Void Walker","zh":"虚空行者","ko":"보이드 워커"},
    desc:{"ja":"暗闇に浮かぶ発光テキストと星屑エフェクト、虚空を歩く魔術師","en":"Glowing text floating in darkness and stardust effects, sorc","zh":"黑暗中漂浮的发光文字和星尘效果，在虚空中行走的魔术师","ko":"어둠에 떠 있는 발광 텍스트와 별가루 효과,虚空을 걷는 마법사"},
    ui:{"--ui-bg":"#000000","--ui-panel":"rgba(0,0,0,0.96)","--ui-soft":"rgba(0,255,255,0.05)","--ui-text":"#00ffff","--ui-muted":"#00cccc","--ui-border":"rgba(0,255,255,.35)","--ui-button":"#0a0a0f","--ui-button-hover":"#092a2e","--ui-field":"#020205","--ui-accent":"#00ffff","--ui-on-accent":"#000000","--ui-gold":"#ff00ff","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,255,255,0.14)"},
    game:{"don":"#ff00ff","ka":"#7b2cbf","stage":"#020205","lane":"rgba(0,0,0,0.6)","track":"rgba(0,255,255,0.24)","ink":"#00ffff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(0,0,0,0.95)","perfect":"#ff00ff","good":"#00ffff","miss":"#008c8c","glow":false},
    shapes:["square","diamond"],
    video:"contrast(1.3) brightness(.8)",
    cli:{"font":"Courier New, Courier, monospace","prompt":"◊","caret":"#00ffff","scan":0.2,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
  S["wizard-wei-liao-zi"] = {
    cat:["wizard","grad","dark"],
    font:"\"KaiTi\",\"SimSun\",serif",
    type:{"title":"\"KaiTi\",serif","weight":"500","lh":"1.6","titleWeight":"700","titleSpace":".04em","mark":"尉"},
    label:{"ja":"尉繚子","en":"Wei Liaozi","zh":"尉繚子","ko":"위료자"},
    desc:{"ja":"戦国時代の軍事論、尉繚子が著したとされる覇術の書","en":"Warring States period military treatise, attributed to Wei L","zh":"战国时代的军事论，据说尉繚子著作的霸术之书","ko":"전국 시대의 군사론, 위료자가 저술했다고 하는 패술의 서"},
    ui:{"--ui-bg":"#223022","--ui-panel":"rgba(34,48,34,0.96)","--ui-soft":"rgba(232,240,232,0.05)","--ui-text":"#e8f0e8","--ui-muted":"#e9efe9","--ui-border":"rgba(107,142,35,.35)","--ui-button":"#4a5d4a","--ui-button-hover":"#5f705f","--ui-field":"#2d3a2a","--ui-accent":"#6b8e23","--ui-on-accent":"#000000","--ui-gold":"#8fbc8f","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(107,142,35,0.14)"},
    game:{"don":"#6b8e23","ka":"#556b2f","stage":"#2d3a2a","lane":"rgba(34,48,34,0.6)","track":"rgba(232,240,232,0.24)","ink":"#e8f0e8","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(34,48,34,0.95)","perfect":"#8fbc8f","good":"#e8f0e8","miss":"#8f9a8f","glow":false},
    shapes:["circle","square"],
    video:"sepia(.15) saturate(1.1) contrast(1.15) brightness(.9)",
    cli:{"font":"Cascadia Mono, Consolas, monospace","prompt":"尉","caret":"#6b8e23","scan":0.15,"cursor":"block","opacity":1,"history":50,"completion":"tab","bell":true}
  };
})();

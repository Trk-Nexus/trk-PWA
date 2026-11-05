// SPDX-License-Identifier: GPL-3.0-or-later
/* 📚 巻別のスキン（trk274・Skin 側の目録から生成）

   出どころ：trk-Avatar-Library の `catalog/skins.json`（巻の目録は `skin-volumes/volumes.json`）
   目録の sha256：6e064f0b18e422cb245c30c5f74750b55088b828e45986bd6ddfa768350b2a76（この写しがどの目録から作られたかの印）
   作り方：node tools/import-skin-catalog.mjs <目録.json> --cat= --exclude-cat=wizard --only-new --volumes=<volumes.json> --kind=volumes --out=js/skins-volumes.js
   ・手で直さないでください（次の取り込みで消えます）。直すときは目録側（Skin 側）で。
   ・このファイルは data.js の後・core.js の前に読みます（起動時のスキン復元より先に要るため）。
   ・`--only-new`：本体が既に持っている ID（定番・ミク・Wizard）は書きません（上書きしないため）。
   ============================================================================ */
"use strict";
(() => {
  const D = window.Trk && window.Trk.data;
  const S = D && D.SKINS;
  if (!S) return;   /* data.js が無い（別の読み込み方）ときは何もしない */
  S["absinthe"] = {
    cat:["dark","grad"],
    font:"\"Papyrus\",\"Papyrus Custom\",fantasy",
    type:{"title":"\"Papyrus\",fantasy","weight":"400","lh":"1.55","titleWeight":"600","titleSpace":".05em","mark":"あア漢 Aa 12"},
    label:{"ja":"アブシント","en":"Absinthe","zh":"苦艾酒","ko":"압생트"},
    desc:{"ja":"緑の妖精、苦味と神秘の緑","en":"Green fairy, bitterness and mystery of green","zh":"绿色仙女，苦味与神秘的绿","ko":"녹색 요정, 쓰음과 신비의 초록"},
    ui:{"--ui-bg":"#0d400d","--ui-panel":"rgba(27,94,32,0.96)","--ui-soft":"rgba(255,253,240,0.05)","--ui-text":"#fffdf0","--ui-muted":"#f9f9f8","--ui-border":"rgba(212,175,55,.28)","--ui-button":"#2e7d32","--ui-button-hover":"#36823a","--ui-field":"#1b5e20","--ui-accent":"#d4af37","--ui-on-accent":"#0d400d","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#8c9eac","stage":"#1b5e20","lane":"rgba(27,94,32,0.6)","track":"rgba(255,253,240,0.24)","ink":"#fffdf0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(27,94,32,0.95)","perfect":"#ffe082","good":"#fffdf0","miss":"#92a88a","glow":false},
    shapes:["circle","diamond"],
    video:"sepia(.35) contrast(1.1) brightness(.9)"
  };
  S["adamantium"] = {
    cat:["dark","access","fun"],
    font:"\"Oswald\",\"Impact\",sans-serif",
    type:{"title":"\"Oswald\",sans-serif","weight":"700","lh":"1.3","titleWeight":"800","titleSpace":"-.04em","titleTransform":"uppercase","mark":"あア漢 Aa 12"},
    label:{"ja":"アダマンチウム","en":"Adamantium","zh":"亚当合金","ko":"아다만티움"},
    desc:{"ja":"不壊の金属、ダークで重厚な鋼鉄の質感","en":"Indestructible metal, dark and heavy steel texture","zh":"不可破坏的金属，深色厚重的钢铁质感","ko":"불가파괴 금속, 다크하고 무거운 강철 질감"},
    ui:{"--ui-bg":"#0d0d0d","--ui-panel":"rgba(26,26,26,0.96)","--ui-soft":"rgba(224,224,224,0.05)","--ui-text":"#e0e0e0","--ui-muted":"#b3b3b3","--ui-border":"rgba(224,224,224,.20)","--ui-button":"#2d2d2d","--ui-button-hover":"#444444","--ui-field":"#1a1a1a","--ui-accent":"#d4af37","--ui-on-accent":"#0d0d0d","--ui-gold":"#ffd700","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#95a5a6","stage":"#1a1a1a","lane":"rgba(26,26,26,0.6)","track":"rgba(224,224,224,0.24)","ink":"#e0e0e0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,26,26,0.95)","perfect":"#ffd700","good":"#e0e0e0","miss":"#818181","glow":false},
    shapes:["square","square"],
    video:"grayscale(.7) contrast(1.25) brightness(.75)"
  };
  S["akzidenz"] = {
    cat:["type","dark"],
    font:"\"Akzidenz-Grotesk\",\"Alternate Gothic\",system-ui,sans-serif",
    type:{"title":"\"Akzidenz-Grotesk\",sans-serif","weight":"400","lh":"1.45","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"アクシデンツ","en":"Akzidenz","zh":"阿克齐登茨","ko":"악시덴츠"},
    desc:{"ja":"グロテスク、無骨で実用的な書体","en":"Grotesque sans, rugged and practical","zh":"粗犷无衬线体，粗犷且实用","ko":"그로테스크, 거칠고 실용적인 서체"},
    ui:{"--ui-bg":"#0d0d0d","--ui-panel":"rgba(26,26,26,0.96)","--ui-soft":"rgba(224,224,224,0.05)","--ui-text":"#e0e0e0","--ui-muted":"#b1b7b9","--ui-border":"rgba(224,224,224,.15)","--ui-button":"#2d2d2d","--ui-button-hover":"#444444","--ui-field":"#1a1a1a","--ui-accent":"#74b9ff","--ui-on-accent":"#0d0d0d","--ui-gold":"#fdcb6e","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(116,185,255,0.14)"},
    game:{"don":"#ff7675","ka":"#74b9ff","stage":"#1a1a1a","lane":"rgba(26,26,26,0.6)","track":"rgba(224,224,224,0.24)","ink":"#e0e0e0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,26,26,0.95)","perfect":"#fdcb6e","good":"#e0e0e0","miss":"#818181","glow":false},
    shapes:["square","square"],
    video:"contrast(1.08) brightness(.88)"
  };
  S["amber"] = {
    cat:["grad","fun","light"],
    label:{"ja":"アンバー","en":"Amber","zh":"琥珀","ko":"호박"},
    desc:{"ja":"黄金色の樹脂、温もりと記憶の琥珀","en":"Golden resin, warmth and memory in amber","zh":"金色树脂，温暖与记忆的琥珀","ko":"금색 수지, 온기와 기억의 호박"},
    ui:{"--ui-bg":"linear-gradient(180deg,#4a370b,#2a1d05)","--ui-panel":"rgba(133,97,9,0.96)","--ui-soft":"rgba(255,255,255,0.05)","--ui-text":"#ffffff","--ui-muted":"#ffffff","--ui-border":"rgba(255,107,87,.30)","--ui-button":"#8a6a0b","--ui-button-hover":"#8f7015","--ui-field":"#936b09","--ui-accent":"#ff6b6b","--ui-on-accent":"#2a1d05","--ui-gold":"#ffe0b3","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,107,107,0.14)"},
    game:{"don":"#ff6b6b","ka":"#4ecdc4","stage":"linear-gradient(180deg,#8a6508,#4a370b)","lane":"rgba(133,97,9,0.6)","track":"rgba(255,255,255,0.24)","ink":"#fff4e6","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(133,97,9,0.95)","perfect":"#ffe0b3","good":"#fff4e6","miss":"#23211d","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.5) saturate(1.2) hue-rotate(-20deg) brightness(.85) contrast(1.1)"
  };
  S["amethyst"] = {
    cat:["dark","grad","fun"],
    label:{"ja":"アメジスト","en":"Amethyst","zh":"紫水晶","ko":"자수정"},
    desc:{"ja":"高貴な紫の宝石、平和と癒やしの紫","en":"Noble purple jewel, peace and healing in purple","zh":"高贵紫色宝石，平和与治愈的紫","ko":"고귀한 보라색 보석, 평화와 치유의 보라"},
    ui:{"--ui-bg":"linear-gradient(180deg,#1a0633,#0d031a)","--ui-panel":"rgba(59,26,90,0.96)","--ui-soft":"rgba(240,230,255,0.05)","--ui-text":"#f0e6ff","--ui-muted":"#d9c7e4","--ui-border":"rgba(162,155,254,.30)","--ui-button":"#5b2a7a","--ui-button-hover":"#6e428b","--ui-field":"#3b1a5a","--ui-accent":"#a29bfe","--ui-on-accent":"#1a0633","--ui-gold":"#e6ccff","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(162,155,254,0.14)"},
    game:{"don":"#ff6b9d","ka":"#a29bfe","stage":"linear-gradient(180deg,#3b1a5a,#1a0633)","lane":"rgba(59,26,90,0.6)","track":"rgba(240,230,255,0.24)","ink":"#f0e6ff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(59,26,90,0.95)","perfect":"#e6ccff","good":"#f0e6ff","miss":"#9081a3","glow":false},
    shapes:["circle","diamond"],
    video:"grayscale(.4) hue-rotate(240deg) saturate(1.3) brightness(.8) contrast(1.2)"
  };
  S["ancient-bronze"] = {
    cat:["life","grad"],
    font:"\"Trajan Pro\",\"Garamond\",serif",
    type:{"title":"\"Trajan Pro\",serif","weight":"400","lh":"1.65","titleWeight":"600","titleSpace":".04em","mark":"あア漢 Aa 12"},
    label:{"ja":"古銅","en":"Ancient Bronze","zh":"古铜","ko":"고대 청동"},
    desc:{"ja":"緑青の古銅、歴史と時の重みを纏う","en":"Verdigris ancient bronze, wearing history and time","zh":"铜绿古铜，披着历史与时间的重量","ko":"녹청 고대 청동, 역사와 시간의 무게를 두른"},
    ui:{"--ui-bg":"#5c4033","--ui-panel":"rgba(139,69,19,0.96)","--ui-soft":"rgba(245,222,179,0.05)","--ui-text":"#f5deb3","--ui-muted":"#a0522d","--ui-border":"rgba(160,82,45,.24)","--ui-button":"#8b4513","--ui-button-hover":"#995928","--ui-field":"#f5deb3","--ui-accent":"#d4af37","--ui-on-accent":"#5c4033","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#b8860b","stage":"#8b4513","lane":"rgba(139,69,19,0.6)","track":"rgba(245,222,179,0.24)","ink":"#f5deb3","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(139,69,19,0.95)","perfect":"#ffe082","good":"#f5deb3","miss":"#b09779","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.5) contrast(1.15) brightness(.9)",
    holdback:true
  };
  S["art-deco"] = {
    cat:["grad","fun","light"],
    font:"\"Trajan Pro\",\"Papyrus\",fantasy",
    type:{"title":"\"Trajan Pro\",fantasy","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".05em","titleTransform":"uppercase","mark":"あア漢 Aa 12"},
    label:{"ja":"アールデコ","en":"Art Deco","zh":"装饰艺术","ko":"아르데코"},
    desc:{"ja":"幾何学的黄金時代、ゴージャスでモダンな装飾","en":"Geometric golden age, gorgeous and modern ornament","zh":"几何学黄金时代，华丽而现代的装饰","ko":"기하학적 황금기, 화려하고 현대적인 장식"},
    ui:{"--ui-bg":"linear-gradient(180deg,#5c4033,#3e2723)","--ui-panel":"rgba(139,69,19,0.96)","--ui-soft":"rgba(255,253,240,0.05)","--ui-text":"#fffdf0","--ui-muted":"#faf9f7","--ui-border":"rgba(212,175,55,.30)","--ui-button":"#a0522d","--ui-button-hover":"#a75e3b","--ui-field":"#8b4513","--ui-accent":"#ffd700","--ui-on-accent":"#3e2723","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,215,0,0.14)"},
    game:{"don":"#ffd700","ka":"#bdc3c7","stage":"linear-gradient(180deg,#8a7224,#936b09,#8b4513)","lane":"rgba(139,69,19,0.6)","track":"rgba(255,253,240,0.24)","ink":"#fffdf0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(139,69,19,0.95)","perfect":"#ffe082","good":"#fffdf0","miss":"#b6a89b","glow":false},
    shapes:["square","square"],
    video:"sepia(.3) saturate(1.2) brightness(1.02) contrast(1.1)"
  };
  S["asteroid-belt"] = {
    cat:["dark","grad"],
    font:"\"Caslon\",\"Garamond\",serif",
    type:{"title":"\"Caslon\",serif","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".03em","mark":"あア漢 Aa 12"},
    label:{"ja":"小惑星帯","en":"Asteroid Belt","zh":"小行星带","ko":"소행성대"},
    desc:{"ja":"宇宙の破片の集積、岩だらけの帯域","en":"Collection of space debris, rock-filled belt","zh":"宇宙碎片的集成，岩石遍布的带状区域","ko":"우주 파편의 집적, 암석으로 가득한 지대"},
    ui:{"--ui-bg":"#2c241d","--ui-panel":"rgba(74,55,40,0.96)","--ui-soft":"rgba(239,230,212,0.05)","--ui-text":"#efe6d4","--ui-muted":"#cbc6c0","--ui-border":"rgba(227,192,137,.25)","--ui-button":"#4a3728","--ui-button-hover":"#5f4e3e","--ui-field":"#3a3028","--ui-accent":"#d4af37","--ui-on-accent":"#2c241d","--ui-gold":"#e3c089","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#8c9eac","stage":"#4a3728","lane":"rgba(74,55,40,0.6)","track":"rgba(239,230,212,0.24)","ink":"#efe6d4","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(74,55,40,0.95)","perfect":"#e3c089","good":"#efe6d4","miss":"#978f82","glow":false},
    shapes:["square","square"],
    video:"sepia(.35) contrast(1.05) brightness(.9)"
  };
  S["autumnMaple"] = {
    cat:["grad","fun"],
    label:{"ja":"紅葉の夜","en":"Autumn Maple Night","zh":"红叶之夜","ko":"단풍밤"},
    desc:{"ja":"赤と橙と黄色、夜に舞う紅葉のグラデ","en":"Red, orange, and yellow autumn maple gradient dancing at nig","zh":"红、橙、黄，夜晚飞舞的红叶渐变","ko":"빨강과 주황과 노랑, 밤에 춤추는 단풍 그라데이션"},
    ui:{"--ui-bg":"linear-gradient(180deg,#1a0a05,#0d0502)","--ui-panel":"rgba(74,21,21,0.96)","--ui-soft":"rgba(255,241,224,0.05)","--ui-text":"#fff1e0","--ui-muted":"#d7cbc5","--ui-border":"rgba(224,86,120,.30)","--ui-button":"#6b2a2a","--ui-button-hover":"#7e4442","--ui-field":"#4a1515","--ui-accent":"#e0568a","--ui-on-accent":"#000000","--ui-gold":"#d9782a","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(224,86,138,0.14)"},
    game:{"don":"#e0568a","ka":"#a8b545","stage":"linear-gradient(180deg,#4a1515,#1a0a05)","lane":"rgba(74,21,21,0.6)","track":"rgba(255,241,224,0.24)","ink":"#fff1e0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(74,21,21,0.95)","perfect":"#d9782a","good":"#fff1e0","miss":"#98897d","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.3) saturate(1.25) hue-rotate(-20deg) brightness(.7) contrast(1.2)"
  };
  S["avenir"] = {
    cat:["type","light"],
    font:"\"Avenir\",\"Avenir Next\",system-ui,sans-serif",
    type:{"title":"\"Avenir\",sans-serif","weight":"400","lh":"1.55","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"アヴェニール","en":"Avenir","zh":"未来体","ko":"아베니르"},
    desc:{"ja":"フランス生まれの幾何学ゴシック、洗練された書体","en":"French geometric sans, refined and elegant","zh":"法国几何学无衬线体，精致优雅","ko":"프랑스 기하학적 고딕, 세련되고 우아한 서체"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(55,71,79,0.05)","--ui-text":"#37474f","--ui-muted":"#424f56","--ui-border":"rgba(55,71,79,.12)","--ui-button":"#cfd8dc","--ui-button-hover":"#bbc5ca","--ui-field":"#ffffff","--ui-accent":"#0288d1","--ui-on-accent":"#000000","--ui-gold":"#ffb300","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(2,136,209,0.14)"},
    game:{"don":"#d32f2f","ka":"#0288d1","stage":"#eceff1","lane":"rgba(255,255,255,0.82)","track":"rgba(55,71,79,0.24)","ink":"#37474f","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffb300","good":"#37474f","miss":"#8a9296","glow":false},
    shapes:["circle","circle"],
    video:"contrast(1.03) brightness(1.01)"
  };
  S["bamboo-forest"] = {
    cat:["light","grad"],
    font:"\"Hiragino Mincho ProN\",\"Yu Mincho\",\"YuMincho\",\"Noto Serif JP\",serif",
    type:{"title":"\"Hiragino Mincho ProN\",serif","weight":"400","lh":"1.75","titleWeight":"600","titleSpace":".1em","mark":"あア漢 Aa 12"},
    label:{"ja":"竹林","en":"Bamboo Forest","zh":"竹林","ko":"대나무 숲"},
    desc:{"ja":"京都の竹林、緑の階調と静寂","en":"Kyoto bamboo forest, green gradient and silence","zh":"京都竹林，绿色渐变与寂静","ko":"교토 대나무 숲, 초록 농담과 정적"},
    ui:{"--ui-bg":"#c8e6c9","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(27,94,32,0.05)","--ui-text":"#1b5e20","--ui-muted":"#2e5430","--ui-border":"rgba(46,125,50,.22)","--ui-button":"#a5d6a7","--ui-button-hover":"#9fd1a2","--ui-field":"#ffffff","--ui-accent":"#4caf50","--ui-on-accent":"#000000","--ui-gold":"#d4e157","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(76,175,80,0.14)"},
    game:{"don":"#ffab91","ka":"#4caf50","stage":"#9ad29d","lane":"rgba(255,255,255,0.82)","track":"rgba(27,94,32,0.24)","ink":"#1b5e20","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#d4e157","good":"#1b5e20","miss":"#699b6c","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.05) brightness(1.03)"
  };
  S["baskerville"] = {
    cat:["type","light"],
    font:"\"Baskerville\",\"Noto Serif JP\",serif",
    type:{"title":"\"Baskerville\",\"Noto Serif JP\",serif","weight":"400","lh":"1.65","titleWeight":"600","titleSpace":".02em","mark":"あア漢 Aa 12"},
    label:{"ja":"バスカービル","en":"Baskerville","zh":"巴斯克维尔","ko":"바스커빌"},
    desc:{"ja":"移行期の衬线、均整のとれた美しい書体","en":"Transitional serif, balanced and beautiful","zh":"过渡期衬线体，均衡而美丽","ko":"전이 시기 서체, 균형 잡힌 아름다운 서체"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(26,32,44,0.05)","--ui-text":"#1a202c","--ui-muted":"#4f5a69","--ui-border":"rgba(26,32,44,.12)","--ui-button":"#edf2f7","--ui-button-hover":"#d2d7dd","--ui-field":"#ffffff","--ui-accent":"#2b6cb0","--ui-on-accent":"#ffffff","--ui-gold":"#d69e2e","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(43,108,176,0.14)"},
    game:{"don":"#c53030","ka":"#2b6cb0","stage":"#f5f5f0","lane":"rgba(255,255,255,0.82)","track":"rgba(26,32,44,0.24)","ink":"#1a202c","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#d69e2e","good":"#1a202c","miss":"#81848b","glow":false},
    shapes:["circle","circle"],
    video:"contrast(1.05) brightness(1.01)"
  };
  S["beer-foam"] = {
    cat:["light","grad"],
    font:"\"Trajan Pro\",\"Papyrus\",fantasy",
    type:{"title":"\"Trajan Pro\",fantasy","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".04em","mark":"あア漢 Aa 12"},
    label:{"ja":"ビールフォーム","en":"Beer Foam","zh":"啤酒泡沫","ko":"맥주 거품"},
    desc:{"ja":"泡と黄金、爽やかな喉越し","en":"Foam and gold, refreshing throat feel","zh":"泡沫和金色，清爽的喉感","ko":"거품과 금, 상쾌한 목넘김"},
    ui:{"--ui-bg":"#ffecb3","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(191,54,12,0.05)","--ui-text":"#bf360c","--ui-muted":"#a64800","--ui-border":"rgba(245,127,23,.22)","--ui-button":"#ffe3ba","--ui-button-hover":"#ffe3ba","--ui-field":"#ffffff","--ui-accent":"#ffa000","--ui-on-accent":"#000000","--ui-gold":"#ffeb3b","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(255,160,0,0.14)"},
    game:{"don":"#ffd54f","ka":"#ffe082","stage":"#ffe595","lane":"rgba(255,255,255,0.82)","track":"rgba(191,54,12,0.24)","ink":"#bf360c","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffeb3b","good":"#bf360c","miss":"#d18153","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.15) saturate(1.1) brightness(1.02)"
  };
  S["black-hole"] = {
    cat:["dark","access"],
    font:"\"Rajdhani\",\"Oswald\",sans-serif",
    type:{"title":"\"Rajdhani\",sans-serif","weight":"400","lh":"1.4","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"ブラックホール","en":"Black Hole","zh":"黑洞","ko":"블랙홀"},
    desc:{"ja":"光を吸い込む究極のダーク、事件の地平線","en":"Ultimate dark absorbing light, event horizon","zh":"吸收光的究极深色，事件视界","ko":"빛을 흡수하는究极 다크, 사건의 지평선"},
    ui:{"--ui-bg":"#050505","--ui-panel":"rgba(5,5,5,0.96)","--ui-soft":"rgba(224,224,224,0.05)","--ui-text":"#e0e0e0","--ui-muted":"#969696","--ui-border":"#ffffff","--ui-button":"#101010","--ui-button-hover":"#2b2b2b","--ui-field":"#000000","--ui-accent":"#00ff88","--ui-on-accent":"#000000","--ui-gold":"#ff0040","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,255,136,0.14)"},
    game:{"don":"#ff0040","ka":"#00ff88","stage":"#000000","lane":"rgba(5,5,5,0.6)","track":"rgba(224,224,224,0.24)","ink":"#e0e0e0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(5,5,5,0.95)","perfect":"#ff0040","good":"#e0e0e0","miss":"#7d7d7d","glow":false},
    shapes:["circle","circle"],
    video:"grayscale(1) brightness(.55) contrast(1.5)"
  };
  S["blackjack-21"] = {
    cat:["fun","dark"],
    font:"\"Oswald\",\"Impact\",sans-serif",
    type:{"title":"\"Oswald\",sans-serif","weight":"700","lh":"1.35","titleWeight":"800","titleSpace":"-.03em","mark":"21"},
    label:{"ja":"ブラックジャック21","en":"Blackjack 21","zh":"二十一点","ko":"블랙잭 21"},
    desc:{"ja":"ブラックジャック、21を目指す緊張と興奮","en":"Blackjack, tension and excitement aiming for 21","zh":"二十一点，瞄准21的紧张与兴奋","ko":"블랙잭, 21을 목표로 하는 긴장과 흥분"},
    ui:{"--ui-bg":"#1a1a1a","--ui-panel":"rgba(10,10,10,0.96)","--ui-soft":"rgba(255,255,255,0.05)","--ui-text":"#ffffff","--ui-muted":"#b3b3b3","--ui-border":"rgba(255,255,255,.18)","--ui-button":"#2a2a2a","--ui-button-hover":"#464646","--ui-field":"#0a0a0a","--ui-accent":"#d4af37","--ui-on-accent":"#000000","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#ffd700","stage":"#0a0a0a","lane":"rgba(10,10,10,0.6)","track":"rgba(255,255,255,0.24)","ink":"#ffffff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,10,10,0.95)","perfect":"#ffe082","good":"#ffffff","miss":"#989898","glow":false},
    shapes:["square","square"],
    video:"grayscale(.3) contrast(1.25) brightness(.85)"
  };
  S["bodoni"] = {
    cat:["type","dark","fun"],
    font:"\"Didot\",\"Bodoni MT\",\"Noto Serif JP\",serif",
    type:{"title":"\"Didot\",\"Bodoni MT\",serif","weight":"300","lh":"1.6","titleWeight":"800","titleSpace":".02em","mark":"あア漢 Aa 12"},
    label:{"ja":"ボドーニ","en":"Bodoni","zh":"博多尼","ko":"보도니"},
    desc:{"ja":"コントラストの強い近代明朝、華やかで気高い","en":"High-contrast modern serif, gorgeous and noble","zh":"高对比度现代衬线体，华丽而高贵","ko":"높은 대비를 가진 현대 명조체, 화려하고 기품 있음"},
    ui:{"--ui-bg":"#000000","--ui-panel":"rgba(10,10,10,0.96)","--ui-soft":"rgba(250,250,250,0.05)","--ui-text":"#fafafa","--ui-muted":"#bdc3c7","--ui-border":"rgba(255,255,255,.12)","--ui-button":"#1a1a1a","--ui-button-hover":"#373737","--ui-field":"#0a0a0a","--ui-accent":"#c0392b","--ui-on-accent":"#ffffff","--ui-gold":"#f1c40f","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(192,57,43,0.14)"},
    game:{"don":"#c0392b","ka":"#f1c40f","stage":"#0a0a0a","lane":"rgba(10,10,10,0.6)","track":"rgba(250,250,250,0.24)","ink":"#fafafa","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,10,10,0.95)","perfect":"#f1c40f","good":"#fafafa","miss":"#8a8a8a","glow":false},
    shapes:["square","diamond"],
    video:"contrast(1.25) saturate(1.05) brightness(.85)"
  };
  S["brutalist"] = {
    cat:["dark","access"],
    font:"\"Oswald\",\"Rajdhani\",sans-serif",
    type:{"title":"\"Oswald\",sans-serif","weight":"700","lh":"1.3","titleWeight":"800","titleSpace":"-.02em","titleTransform":"uppercase","mark":"あア漢 Aa 12"},
    label:{"ja":"ブルータリズム","en":"Brutalist","zh":"粗野主义","ko":"브루탈리즘"},
    desc:{"ja":"コンクリートの無骨さ、素材そのままの質感","en":"Roughness of concrete, raw material texture","zh":"混凝土的粗犷，原材料质感","ko":"콘크리트의 투박함, 원재료 그대로의 질감"},
    ui:{"--ui-bg":"#2c2c2c","--ui-panel":"rgba(44,44,44,0.96)","--ui-soft":"rgba(224,224,224,0.05)","--ui-text":"#e0e0e0","--ui-muted":"#d9dddd","--ui-border":"rgba(189,195,199,.20)","--ui-button":"#4a4a4a","--ui-button-hover":"#5e5e5e","--ui-field":"#3a3a3a","--ui-accent":"#95a5a6","--ui-on-accent":"#000000","--ui-gold":"#bdc3c7","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(149,165,166,0.14)"},
    game:{"don":"#95a5a6","ka":"#7f8c8d","stage":"#4a4a4a","lane":"rgba(44,44,44,0.6)","track":"rgba(224,224,224,0.24)","ink":"#e0e0e0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(44,44,44,0.95)","perfect":"#bdc3c7","good":"#e0e0e0","miss":"#8f8f8f","glow":false},
    shapes:["square","square"],
    video:"grayscale(.8) contrast(1.15) brightness(.9)"
  };
  S["casino-royale"] = {
    cat:["light","grad","fun"],
    font:"\"Playfair Display\",\"Noto Serif JP\",serif",
    type:{"title":"\"Playfair Display\",serif","weight":"400","lh":"1.7","titleWeight":"700","titleSpace":".03em","mark":"あア漢 Aa 12"},
    label:{"ja":"カジノロワイヤル","en":"Casino Royale","zh":"赌场皇家","ko":"카지노 로얄"},
    desc:{"ja":"王族のような気高さ、エメラルドグリーンのカジノテーブル","en":"Royal nobility, emerald green casino table","zh":"王族般的高贵，祖母绿赌场桌面","ko":"왕족 같은 고귀함, 에메랄드 그린 카지노 테이블"},
    ui:{"--ui-bg":"linear-gradient(180deg,#0f3d24,#0a2b1a)","--ui-panel":"rgba(26,94,58,0.96)","--ui-soft":"rgba(240,244,248,0.05)","--ui-text":"#f0f4f8","--ui-muted":"#f2f4f7","--ui-border":"rgba(255,215,0,.30)","--ui-button":"#2c6e4a","--ui-button-hover":"#407b5b","--ui-field":"#1a5e3a","--ui-accent":"#ffd700","--ui-on-accent":"#0f3d24","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,215,0,0.14)"},
    game:{"don":"#ffd700","ka":"#4ecdc4","stage":"linear-gradient(180deg,#1a5e3a,#0f3d24)","lane":"rgba(26,94,58,0.6)","track":"rgba(240,244,248,0.24)","ink":"#f0f4f8","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,94,58,0.95)","perfect":"#ffe082","good":"#f0f4f8","miss":"#91a79e","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.2) saturate(1.15) brightness(.95) contrast(1.1)"
  };
  S["caslon"] = {
    cat:["type","light"],
    font:"\"ITC Caslon\",\"Caslon\",serif",
    type:{"title":"\"ITC Caslon\",\"Caslon\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"あア漢 Aa 12"},
    label:{"ja":"キャスロン","en":"Caslon","zh":"卡斯隆","ko":"캐슬론"},
    desc:{"ja":"オールドスタイルの衬线、伝統と信頼の書体","en":"Old-style serif, tradition and reliability","zh":"旧式衬线体，传统与可靠","ko":"올드스타일 서체, 전통과 신뢰성"},
    ui:{"--ui-bg":"#faf7f2","--ui-panel":"rgba(255,254,248,0.96)","--ui-soft":"rgba(44,36,29,0.05)","--ui-text":"#2c241d","--ui-muted":"#5b534b","--ui-border":"rgba(44,36,29,.15)","--ui-button":"#eae4d9","--ui-button-hover":"#d1cbc1","--ui-field":"#ffffff","--ui-accent":"#a5522e","--ui-on-accent":"#f4f1ea","--ui-gold":"#b8860b","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(165,82,46,0.14)"},
    game:{"don":"#a5522e","ka":"#4a5d6a","stage":"#f4f1ea","lane":"rgba(255,254,248,0.82)","track":"rgba(44,36,29,0.24)","ink":"#2c241d","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,254,248,0.95)","perfect":"#b8860b","good":"#2c241d","miss":"#89837d","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.18) brightness(1.01)"
  };
  S["celestial-bronze"] = {
    cat:["life","grad"],
    font:"\"Caslon\",\"Garamond\",serif",
    type:{"title":"\"Caslon\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"あア漢 Aa 12"},
    label:{"ja":"天鋼ブロンズ","en":"Celestial Bronze","zh":"天青铜","ko":"천강 청동"},
    desc:{"ja":"ギリシャ神話の半神のための金属、古代の緑青","en":"Metal for Greek demigods, ancient verdigris","zh":"希腊半神的金属，古代铜绿","ko":"그리스 반신반인을 위한 금속, 고대의 청동 녹청"},
    ui:{"--ui-bg":"#5c4033","--ui-panel":"rgba(139,69,19,0.96)","--ui-soft":"rgba(255,253,240,0.05)","--ui-text":"#fffdf0","--ui-muted":"#faf6f5","--ui-border":"rgba(160,82,45,.24)","--ui-button":"#a0522d","--ui-button-hover":"#a75e3b","--ui-field":"#8b4513","--ui-accent":"#d4af37","--ui-on-accent":"#000000","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#b8860b","stage":"#8b4513","lane":"rgba(139,69,19,0.6)","track":"rgba(255,253,240,0.24)","ink":"#fffdf0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(139,69,19,0.95)","perfect":"#ffe082","good":"#fffdf0","miss":"#b6a89b","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.4) contrast(1.1) brightness(.95)"
  };
  S["champagne"] = {
    cat:["light","grad"],
    font:"\"Didot\",\"Bodoni MT\",serif",
    type:{"title":"\"Didot\",serif","weight":"300","lh":"1.65","titleWeight":"800","titleSpace":".02em","mark":"あア漢 Aa 12"},
    label:{"ja":"シャンパン","en":"Champagne","zh":"香槟","ko":"샴페인"},
    desc:{"ja":"泡立ち、祝勝の軽やかな金","en":"Bubbling, light and celebratory gold","zh":"气泡，庆祝的轻快金色","ko":"거품, 승리 축하의 가벼운 금"},
    ui:{"--ui-bg":"linear-gradient(180deg,#d4c0a8,#b8a080)","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(74,55,40,0.05)","--ui-text":"#4a3728","--ui-muted":"#5b534b","--ui-border":"rgba(140,158,172,.20)","--ui-button":"#e8dec7","--ui-button-hover":"#d3c8b2","--ui-field":"#fffef5","--ui-accent":"#d4af37","--ui-on-accent":"#4a3728","--ui-gold":"#ffe082","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#8c9eac","stage":"linear-gradient(180deg,#f5e6d3,#d4c0a8)","lane":"rgba(255,255,255,0.82)","track":"rgba(74,55,40,0.24)","ink":"#4a3728","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffe082","good":"#4a3728","miss":"#887562","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.2) saturate(1.05) brightness(1.03)"
  };
  S["champagne-gold"] = {
    cat:["light","grad"],
    font:"\"Playfair Display\",\"Noto Serif JP\",serif",
    type:{"title":"\"Playfair Display\",serif","weight":"400","lh":"1.7","titleWeight":"700","titleSpace":".03em","mark":"あア漢 Aa 12"},
    label:{"ja":"シャンパンゴールド","en":"Champagne Gold","zh":"香槟金","ko":"샴페인 골드"},
    desc:{"ja":"シャンパンの祝勝、軽やかで贅沢な金","en":"Champagne celebration, light and luxurious gold","zh":"香槟庆祝，轻快奢华的金","ko":"샴페인 승리 축하, 가볍고 호화로운 금"},
    ui:{"--ui-bg":"linear-gradient(180deg,#d4c0a8,#b8a080)","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(74,55,40,0.05)","--ui-text":"#4a3728","--ui-muted":"#5b534b","--ui-border":"rgba(140,158,172,.20)","--ui-button":"#e8dec7","--ui-button-hover":"#d3c8b2","--ui-field":"#fffef5","--ui-accent":"#d4af37","--ui-on-accent":"#4a3728","--ui-gold":"#ffe082","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#8c9eac","stage":"linear-gradient(180deg,#f5e6d3,#d4c0a8)","lane":"rgba(255,255,255,0.82)","track":"rgba(74,55,40,0.24)","ink":"#4a3728","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffe082","good":"#4a3728","miss":"#887562","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.2) saturate(1.05) brightness(1.03)"
  };
  S["cherrySnow"] = {
    cat:["light","fun","grad"],
    label:{"ja":"桜吹雪の夜","en":"Cherry Blossom Snow Night","zh":"樱花飘雪之夜","ko":"벚꽃 눈비 밤"},
    desc:{"ja":"桜の花びらが舞う、淡いピンクの夜","en":"A pale pink night with cherry blossom petals dancing","zh":"樱花花瓣飞舞的淡粉色之夜","ko":"벚꽃 꽃잎이舞는 연분홍색 밤"},
    ui:{"--ui-bg":"linear-gradient(180deg,#fff0f4,#ffe6f0)","--ui-panel":"rgba(255,250,252,0.96)","--ui-soft":"rgba(58,35,48,0.05)","--ui-text":"#3a2330","--ui-muted":"#70505e","--ui-border":"rgba(214,77,128,.24)","--ui-button":"#ffe6ee","--ui-button-hover":"#e5cdd5","--ui-field":"#ffffff","--ui-accent":"#e0568a","--ui-on-accent":"#000000","--ui-gold":"#d9782a","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(224,86,138,0.14)"},
    game:{"don":"#e0568a","ka":"#5aa9e6","stage":"linear-gradient(180deg,#ffeef3,#ffd1dc)","lane":"rgba(255,250,252,0.82)","track":"rgba(58,35,48,0.24)","ink":"#3a2330","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,250,252,0.95)","perfect":"#d9782a","good":"#3a2330","miss":"#937f88","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.25) saturate(1.15) brightness(1.06)"
  };
  S["chocolate"] = {
    cat:["light","grad"],
    label:{"ja":"ショコラ","en":"Chocolate","zh":"巧克力","ko":"초콜릿"},
    desc:{"ja":"濃厚なチョコレート、大人っぽい茶色","en":"Rich chocolate, adult brown","zh":"浓郁巧克力，成人色调的棕色","ko":"진한 초콜릿, 어른스러운 갈색"},
    ui:{"--ui-bg":"linear-gradient(180deg,#d7ccc8,#bcaaa4)","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(239,235,233,0.05)","--ui-text":"#efebe9","--ui-muted":"#a1887f","--ui-border":"rgba(141,110,99,.24)","--ui-button":"#bcaaa4","--ui-button-hover":"#c3b2ad","--ui-field":"#ffffff","--ui-accent":"#8d6e63","--ui-on-accent":"#efebe9","--ui-gold":"#ffe0b2","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(141,110,99,0.14)"},
    game:{"don":"#ffab91","ka":"#bcaaa4","stage":"linear-gradient(180deg,#8d6e63,#4e342e)","lane":"rgba(255,255,255,0.82)","track":"rgba(239,235,233,0.24)","ink":"#efebe9","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffe0b2","good":"#efebe9","miss":"#e4ddda","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.3) saturate(1.05) brightness(.95)",
    holdback:true
  };
  S["chrome-steel"] = {
    cat:["dark","fun","access"],
    font:"\"Orbitron\",\"Rajdhani\",system-ui,sans-serif",
    type:{"title":"\"Orbitron\",sans-serif","weight":"400","lh":"1.35","titleWeight":"700","titleSpace":"-.02em","titleTransform":"uppercase","mark":"あア漢 Aa 12"},
    label:{"ja":"クロムスチール","en":"Chrome Steel","zh":"铬钢","ko":"크롬 스틸"},
    desc:{"ja":"鏡面メッキの鋼、現代的でスタイリッシュな輝き","en":"Mirror-plated steel, modern and stylish shine","zh":"镜面镀铬钢，现代时尚的光泽","ko":"거울면 도금 강철, 현대적이고 세련된 광채"},
    ui:{"--ui-bg":"#0a0a0a","--ui-panel":"rgba(26,26,26,0.96)","--ui-soft":"rgba(250,250,250,0.05)","--ui-text":"#fafafa","--ui-muted":"#bababa","--ui-border":"rgba(255,255,255,.18)","--ui-button":"#2d2d2d","--ui-button-hover":"#484848","--ui-field":"#1a1a1a","--ui-accent":"#00ffff","--ui-on-accent":"#000000","--ui-gold":"#ffffff","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,255,255,0.14)"},
    game:{"don":"#00ffff","ka":"#bdc3c7","stage":"#1a1a1a","lane":"rgba(26,26,26,0.6)","track":"rgba(250,250,250,0.24)","ink":"#fafafa","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,26,26,0.95)","perfect":"#ffffff","good":"#fafafa","miss":"#8e8e8e","glow":false},
    shapes:["square","square"],
    video:"contrast(1.3) saturate(1.1) brightness(.85)"
  };
  S["citrine"] = {
    cat:["grad","fun","light"],
    label:{"ja":"シトリン","en":"Citrine","zh":"黄水晶","ko":"시트린"},
    desc:{"ja":"鮮やかな黄色の宝石、富と繁栄の黄","en":"Vivid yellow jewel, wealth and prosperity in yellow","zh":"鲜艳黄色宝石，富与繁荣的黄","ko":"선명한 노란색 보석, 부와 번영의 노랑"},
    ui:{"--ui-bg":"linear-gradient(180deg,#b7950b,#6b5605)","--ui-panel":"rgba(241,196,15,0.96)","--ui-soft":"rgba(45,52,54,0.05)","--ui-text":"#2d3436","--ui-muted":"#4c4929","--ui-border":"rgba(225,112,85,.30)","--ui-button":"#fdcb6e","--ui-button-hover":"#e2b767","--ui-field":"#ffeaa7","--ui-accent":"#e17055","--ui-on-accent":"#000000","--ui-gold":"#ffeaa7","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(225,112,85,0.14)"},
    game:{"don":"#e17055","ka":"#00b894","stage":"linear-gradient(180deg,#f1c40f,#bb9a17)","lane":"rgba(241,196,15,0.6)","track":"rgba(45,52,54,0.24)","ink":"#2d3436","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(241,196,15,0.95)","perfect":"#ffeaa7","good":"#2d3436","miss":"#6b6023","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.15) saturate(1.25) brightness(1.1) contrast(1.05)"
  };
  S["clock-tower"] = {
    cat:["dark","basic"],
    font:"\"Caslon\",\"Garamond\",serif",
    type:{"title":"\"Caslon\",serif","weight":"400","lh":"1.65","titleWeight":"600","titleSpace":".03em","mark":"あア漢 Aa 12"},
    label:{"ja":"時計塔","en":"Clock Tower","zh":"钟楼","ko":"시계탑"},
    desc:{"ja":"ビッグベン、時を告げる鐘の音","en":"Big Ben, bell sound telling time","zh":"大笨钟，报时的钟声","ko":"빅벤, 시간을 알려주는 종소리"},
    ui:{"--ui-bg":"#1a252f","--ui-panel":"rgba(26,37,47,0.96)","--ui-soft":"rgba(236,240,241,0.05)","--ui-text":"#ecf0f1","--ui-muted":"#d9dddd","--ui-border":"rgba(189,195,199,.20)","--ui-button":"#3a4a5a","--ui-button-hover":"#51606e","--ui-field":"#2c3e50","--ui-accent":"#d4af37","--ui-on-accent":"#1a252f","--ui-gold":"#f1c40f","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#bdc3c7","stage":"#2c3e50","lane":"rgba(26,37,47,0.6)","track":"rgba(236,240,241,0.24)","ink":"#ecf0f1","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,37,47,0.95)","perfect":"#f1c40f","good":"#ecf0f1","miss":"#8e959a","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.2) contrast(1.1) brightness(.9)"
  };
  S["copperHour"] = {
    cat:["grad","fun"],
    label:{"ja":"銅色の時","en":"Copper Hour","zh":"铜色时刻","ko":"구리색 시간"},
    desc:{"ja":"夕日に染まる銅色の空と、街の灯り","en":"Copper-colored sky dyed by sunset and city lights","zh":"夕阳染成的铜色天空与城市灯火","ko":"노을로 물든 구리색 하늘과 도시 불빛"},
    ui:{"--ui-bg":"linear-gradient(180deg,#4a1e1e,#2a0f0f)","--ui-panel":"rgba(143,89,40,0.96)","--ui-soft":"rgba(255,255,255,0.05)","--ui-text":"#ffffff","--ui-muted":"#ffffff","--ui-border":"rgba(255,112,67,.30)","--ui-button":"#8d4e2a","--ui-button-hover":"#9c6546","--ui-field":"#a6682e","--ui-accent":"#ff7043","--ui-on-accent":"#2a0f0f","--ui-gold":"#ffc861","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,112,67,0.14)"},
    game:{"don":"#ff7043","ka":"#8d6e63","stage":"linear-gradient(180deg,#9c622b,#4a1e1e)","lane":"rgba(143,89,40,0.6)","track":"rgba(255,255,255,0.24)","ink":"#fff7e0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(143,89,40,0.95)","perfect":"#ffc861","good":"#fff7e0","miss":"#2c2727","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.4) saturate(1.2) hue-rotate(-10deg) brightness(.8) contrast(1.1)"
  };
  S["copperplate"] = {
    cat:["type","dark","fun"],
    font:"\"Copperplate\",\"Papyrus\",fantasy",
    type:{"title":"\"Copperplate\",fantasy","weight":"400","lh":"1.5","titleWeight":"600","titleSpace":".05em","titleTransform":"uppercase","mark":"あア漢 Aa 12"},
    label:{"ja":"カッパープレート","en":"Copperplate","zh":"铜版印刷","ko":"코퍼플레이트"},
    desc:{"ja":"銅版彫刻のような大文字、格調高い書体","en":"Engraved capitals, distinguished and formal","zh":"铜版雕刻风格的大写，高雅而正式","ko":"구리판 조각 같은 대문자, 고상하고 정중한 서체"},
    ui:{"--ui-bg":"#121212","--ui-panel":"rgba(18,18,18,0.96)","--ui-soft":"rgba(212,197,168,0.05)","--ui-text":"#d4c5a8","--ui-muted":"#afa89c","--ui-border":"rgba(212,197,168,.25)","--ui-button":"#2a2a2a","--ui-button-hover":"#403e3a","--ui-field":"#1a1a1a","--ui-accent":"#d65a31","--ui-on-accent":"#121212","--ui-gold":"#e3c089","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(214,90,49,0.14)"},
    game:{"don":"#d65a31","ka":"#8c9eac","stage":"#1a1a1a","lane":"rgba(18,18,18,0.6)","track":"rgba(212,197,168,0.24)","ink":"#d4c5a8","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(18,18,18,0.95)","perfect":"#e3c089","good":"#d4c5a8","miss":"#7d7465","glow":false},
    shapes:["square","diamond"],
    video:"sepia(.3) contrast(1.1) brightness(.85)"
  };
  S["corrupted"] = {
    cat:["glitch","fun","dark"],
    font:"\"Courier New\",monospace",
    type:{"title":"\"Courier New\",monospace","weight":"700","lh":"1.2","titleWeight":"800","titleSpace":"0","mark":"ERR"},
    label:{"ja":"コラプテッド","en":"Corrupted","zh":"损坏","ko":"손상됨"},
    desc:{"ja":"壊れたファイルの美学、断片化と色破綻","en":"Corrupted file aesthetics, fragmentation and color breakdown","zh":"损坏文件美学，碎片化和色彩崩溃","ko":"손상된 파일 미학, 단편화와 색상 붕괴"},
    ui:{"--ui-bg":"#0f0f0f","--ui-panel":"rgba(15,15,15,0.96)","--ui-soft":"rgba(255,26,83,0.05)","--ui-text":"#ff1a53","--ui-muted":"#858585","--ui-border":"rgba(255,0,64,.35)","--ui-button":"#1b1b1b","--ui-button-hover":"#1b1b1b","--ui-field":"#1a1a1a","--ui-accent":"#ff0040","--ui-on-accent":"#000000","--ui-gold":"#00ffff","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,0,64,0.14)"},
    game:{"don":"#00ffff","ka":"#4a4a4a","stage":"#171717","lane":"rgba(15,15,15,0.6)","track":"rgba(255,26,83,0.24)","ink":"#ff0040","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(15,15,15,0.95)","perfect":"#00ffff","good":"#ff0040","miss":"#a9445d","glow":false},
    shapes:["diamond","square"],
    video:"hue-rotate(0deg) saturate(1.6) contrast(1.35) brightness(.8)"
  };
  S["cosmic-dust"] = {
    cat:["light","grad"],
    font:"\"Caveat\",\"Komodo Axis\",cursive",
    type:{"title":"\"Caveat\",cursive","weight":"400","lh":"1.5","titleWeight":"600","titleSpace":".02em","mark":"あア漢 Aa 12"},
    label:{"ja":"宇宙塵","en":"Cosmic Dust","zh":"宇宙尘埃","ko":"우주 먼지"},
    desc:{"ja":"星間物質のきらめき、微細な粒子の舞い","en":"Interstellar matter shimmer, fine particles dancing","zh":"星际物质的闪烁，细微粒子的舞蹈","ko":"성간 물질의 반짝임, 미세한 입자의 춤"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(38,38,38,0.05)","--ui-text":"#262626","--ui-muted":"#545454","--ui-border":"rgba(38,38,38,.12)","--ui-button":"#eaeaea","--ui-button-hover":"#d1d1d1","--ui-field":"#ffffff","--ui-accent":"#d4af37","--ui-on-accent":"#000000","--ui-gold":"#fffdf0","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#7f8c8d","stage":"#f5f5f5","lane":"rgba(255,255,255,0.82)","track":"rgba(38,38,38,0.24)","ink":"#262626","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#fffdf0","good":"#262626","miss":"#888888","glow":false},
    shapes:["circle","circle"],
    video:"contrast(1.08) brightness(1.03)"
  };
  S["creme-brulee"] = {
    cat:["light","grad"],
    label:{"ja":"クレームブリュレ","en":"Creme Brulee","zh":"焦糖布丁","ko":"크렘 브륄레"},
    desc:{"ja":"カラメルの表面、ゴールドの輝き","en":"Caramel surface, golden shine","zh":"焦糖表面，金色光泽","ko":"캐러멜 표면, 골드 빛깔"},
    ui:{"--ui-bg":"linear-gradient(180deg,#ffecb3,#ffe082)","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(116,48,0,0.05)","--ui-text":"#743000","--ui-muted":"#804000","--ui-border":"rgba(230,81,0,.24)","--ui-button":"#ffecb3","--ui-button-hover":"#edd49c","--ui-field":"#ffffff","--ui-accent":"#ffa000","--ui-on-accent":"#3d2500","--ui-gold":"#ffd54f","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(255,160,0,0.14)"},
    game:{"don":"#ffd54f","ka":"#ffe082","stage":"linear-gradient(180deg,#ffe082,#ffb74d)","lane":"rgba(255,255,255,0.82)","track":"rgba(116,48,0,0.24)","ink":"#743000","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffd54f","good":"#743000","miss":"#b38551","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.15) saturate(1.1) brightness(1.02)"
  };
  S["crepe"] = {
    cat:["light","fun"],
    label:{"ja":"クレープ","en":"Crepe","zh":"薄煎饼","ko":"크레페"},
    desc:{"ja":"フランスの屋台、やわらかな肌色","en":"French street crepe, soft skin tone","zh":"法式路边煎饼，柔和肤色","ko":"프랑스 노점, 부드러운 살색"},
    ui:{"--ui-bg":"#ffe0b2","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(78,52,46,0.05)","--ui-text":"#4e342e","--ui-muted":"#594b46","--ui-border":"rgba(78,52,46,.20)","--ui-button":"#ffccbc","--ui-button-hover":"#e8b8aa","--ui-field":"#ffffff","--ui-accent":"#ff7043","--ui-on-accent":"#000000","--ui-gold":"#ffd54f","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(255,112,67,0.14)"},
    game:{"don":"#ff7043","ka":"#ffccbc","stage":"#ffe0b2","lane":"rgba(255,255,255,0.82)","track":"rgba(78,52,46,0.24)","ink":"#4e342e","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffd54f","good":"#4e342e","miss":"#9e8169","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.2) brightness(1.03)"
  };
  S["croissant"] = {
    cat:["light","grad","life"],
    label:{"ja":"クロワッサン","en":"Croissant","zh":"可颂","ko":"크루아상"},
    desc:{"ja":"朝のカフェ、バターの香るゴールド","en":"Morning cafe, buttery gold","zh":"早 morning 咖啡厅，黄油香的金色","ko":"아침 카페, 버터 향의 골드"},
    ui:{"--ui-bg":"linear-gradient(180deg,#ffecb3,#ffe0b2)","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(191,54,12,0.05)","--ui-text":"#bf360c","--ui-muted":"#a74c00","--ui-border":"rgba(251,140,0,.22)","--ui-button":"#ffecb3","--ui-button-hover":"#fce5ac","--ui-field":"#ffffff","--ui-accent":"#fb8c00","--ui-on-accent":"#000000","--ui-gold":"#ffe082","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(251,140,0,0.14)"},
    game:{"don":"#ffcc80","ka":"#ffe0b2","stage":"linear-gradient(180deg,#ffe595,#ffe3b9)","lane":"rgba(255,255,255,0.82)","track":"rgba(191,54,12,0.24)","ink":"#bf360c","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffe082","good":"#bf360c","miss":"#d18153","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.15) saturate(1.1) brightness(1.04)"
  };
  S["crypto"] = {
    cat:["glitch","fun","grad"],
    font:"\"Rajdhani\",\"Oswald\",sans-serif",
    type:{"title":"\"Rajdhani\",sans-serif","weight":"700","lh":"1.2","titleWeight":"800","titleSpace":"-.02em","titleTransform":"uppercase","mark":"₿"},
    label:{"ja":"クリプト","en":"Crypto","zh":"加密","ko":"크립토"},
    desc:{"ja":"ブロックチェーンと暗号通貨、デジタルゴールド","en":"Blockchain and cryptocurrency, digital gold","zh":"区块链和加密货币，数字黄金","ko":"블록체인과 암호화폐, 디지털 골드"},
    ui:{"--ui-bg":"#050510","--ui-panel":"rgba(5,5,16,0.96)","--ui-soft":"rgba(247,147,26,0.05)","--ui-text":"#f7931a","--ui-muted":"#9595a5","--ui-border":"rgba(247,147,26,.35)","--ui-button":"#1a1a2a","--ui-button-hover":"#372a28","--ui-field":"#0a0a1a","--ui-accent":"#f7931a","--ui-on-accent":"#000000","--ui-gold":"#ffd700","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(247,147,26,0.14)"},
    game:{"don":"#ffd700","ka":"#4a4a6a","stage":"#0a0a1a","lane":"rgba(5,5,16,0.6)","track":"rgba(247,147,26,0.24)","ink":"#f7931a","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(5,5,16,0.95)","perfect":"#ffd700","good":"#f7931a","miss":"#8a5316","glow":false},
    shapes:["square","circle"],
    video:"saturate(1.3) contrast(1.2) brightness(.9)"
  };
  S["cyberpunk"] = {
    cat:["glitch","fun","grad"],
    font:"\"Orbitron\",\"Futura\",system-ui,sans-serif",
    type:{"title":"\"Orbitron\",sans-serif","weight":"800","lh":"1.05","titleWeight":"900","titleSpace":"-.06em","titleTransform":"uppercase","mark":"NEON"},
    label:{"ja":"サイバーパンク","en":"Cyberpunk","zh":"赛博朋克","ko":"사이버펑크"},
    desc:{"ja":"ネオンと雨の近未来、 magenta×cyan のコントラスト","en":"Neon and rainy near-future, magenta×cyan contrast","zh":"霓虹和雨的近未来，品红×青色对比","ko":"네온과 비의 근미래, 마젠타×시안 대비"},
    ui:{"--ui-bg":"#00000a","--ui-panel":"rgba(5,5,16,0.96)","--ui-soft":"rgba(0,255,255,0.05)","--ui-text":"#00ffff","--ui-muted":"#9f98ae","--ui-border":"rgba(0,255,255,.35)","--ui-button":"#15152a","--ui-button-hover":"#123346","--ui-field":"#050510","--ui-accent":"#ff00ff","--ui-on-accent":"#000000","--ui-gold":"#ffff00","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,0,255,0.14)"},
    game:{"don":"#ff00ff","ka":"#ff0040","stage":"#050510","lane":"rgba(5,5,16,0.6)","track":"rgba(0,255,255,0.24)","ink":"#00ffff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(5,5,16,0.95)","perfect":"#ffff00","good":"#00ffff","miss":"#008c91","glow":false},
    shapes:["square","square"],
    video:"hue-rotate(200deg) saturate(1.7) brightness(.75) contrast(1.4)"
  };
  S["dango"] = {
    cat:["fun","grad","life"],
    label:{"ja":"だんご","en":"Dango","zh":"团子","ko":"단고"},
    desc:{"ja":"三色団子、祭りの屋台をイメージ","en":"Three-color dango, festival street food","zh":"三色团子，节日摊位风格","ko":"삼색 단고, 축제 노점 이미지"},
    ui:{"--ui-bg":"#fff176","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(51,105,30,0.05)","--ui-text":"#33691e","--ui-muted":"#685f12","--ui-border":"rgba(51,105,30,.20)","--ui-button":"#fff59d","--ui-button-hover":"#e4e38c","--ui-field":"#ffffff","--ui-accent":"#f48fb1","--ui-on-accent":"#000000","--ui-gold":"#fff176","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(244,143,177,0.14)"},
    game:{"don":"#f48fb1","ka":"#4db6ac","stage":"#dce775","lane":"rgba(255,255,255,0.82)","track":"rgba(51,105,30,0.24)","ink":"#33691e","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#fff176","good":"#33691e","miss":"#81953f","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.2) brightness(1.03)"
  };
  S["dark-matter"] = {
    cat:["dark","grad"],
    font:"\"Rajdhani\",\"Oswald\",sans-serif",
    type:{"title":"\"Rajdhani\",sans-serif","weight":"400","lh":"1.4","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"ダークマター","en":"Dark Matter","zh":"暗物质","ko":"다크 매터"},
    desc:{"ja":"見えない物質の気配、宇宙を支配する闇","en":"Invisible matter presence, darkness ruling universe","zh":"不可见物质的气息，统治宇宙的黑暗","ko":"보이지 않는 물질의 기세, 우주를 지배하는 어둠"},
    ui:{"--ui-bg":"#0d0b1e","--ui-panel":"rgba(13,11,30,0.96)","--ui-soft":"rgba(204,214,246,0.05)","--ui-text":"#ccd6f6","--ui-muted":"#9ea5b6","--ui-border":"rgba(100,255,218,.28)","--ui-button":"#2a163e","--ui-button-hover":"#3f2f56","--ui-field":"#1a0b2e","--ui-accent":"#64ffda","--ui-on-accent":"#0d0b1e","--ui-gold":"#ccd6f6","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(100,255,218,0.14)"},
    game:{"don":"#64ffda","ka":"#8892b0","stage":"#1a0b2e","lane":"rgba(13,11,30,0.6)","track":"rgba(204,214,246,0.24)","ink":"#ccd6f6","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(13,11,30,0.95)","perfect":"#ccd6f6","good":"#ccd6f6","miss":"#767b95","glow":false},
    shapes:["circle","circle"],
    video:"hue-rotate(200deg) saturate(1.2) brightness(.85) contrast(1.15)"
  };
  S["datamosh"] = {
    cat:["glitch","fun","dark"],
    font:"\"Courier New\",monospace",
    type:{"title":"\"Courier New\",monospace","weight":"700","lh":"1.2","titleWeight":"800","titleSpace":"0","mark":"MOSH"},
    label:{"ja":"データモッシュ","en":"Datamosh","zh":"数据压缩","ko":"데이터 모시"},
    desc:{"ja":"動画データ破壊アート、ブロックノイズと色ズレ","en":"Video data destruction art, block noise and color shift","zh":"视频数据破坏艺术，块状噪声和色偏","ko":"동영상 데이터 파괴 예술, 블록 노이즈와 색 이동"},
    ui:{"--ui-bg":"#0f0f1a","--ui-panel":"rgba(26,26,46,0.96)","--ui-soft":"rgba(255,0,255,0.05)","--ui-text":"#ff00ff","--ui-muted":"#9292a6","--ui-border":"rgba(0,255,255,.30)","--ui-button":"#28283b","--ui-button-hover":"#2c273f","--ui-field":"#1a1a2e","--ui-accent":"#00ffff","--ui-on-accent":"#000000","--ui-gold":"#ffff00","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,255,255,0.14)"},
    game:{"don":"#00ffff","ka":"#ff0040","stage":"#1a1a2e","lane":"rgba(26,26,46,0.6)","track":"rgba(255,0,255,0.24)","ink":"#ff00ff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,26,46,0.95)","perfect":"#ffff00","good":"#ff00ff","miss":"#a939ad","glow":false},
    shapes:["diamond","square"],
    video:"hue-rotate(280deg) saturate(1.5) contrast(1.3) brightness(.8)"
  };
  S["desert-mosque"] = {
    cat:["light","grad"],
    font:"\"Trajan Pro\",\"Garamond\",serif",
    type:{"title":"\"Trajan Pro\",serif","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".04em","mark":"あア漢 Aa 12"},
    label:{"ja":"砂漠モスク","en":"Desert Mosque","zh":"沙漠清真寺","ko":"사막 모스크"},
    desc:{"ja":"砂色とミナレット、砂漠の聖域","en":"Sand color and minaret, desert sanctuary","zh":"沙色和宣礼塔，沙漠圣域","ko":"모래색과 미나레트, 사막 성역"},
    ui:{"--ui-bg":"#deb887","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(74,55,40,0.05)","--ui-text":"#4a3728","--ui-muted":"#714923","--ui-border":"rgba(205,133,63,.24)","--ui-button":"#e8dec7","--ui-button-hover":"#d3c8b2","--ui-field":"#fffef5","--ui-accent":"#d4af37","--ui-on-accent":"#4a3728","--ui-gold":"#ffe082","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#8c9eac","stage":"#f4a460","lane":"rgba(255,255,255,0.82)","track":"rgba(74,55,40,0.24)","ink":"#4a3728","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffe082","good":"#4a3728","miss":"#8d7153","glow":false},
    shapes:["circle","diamond"],
    video:"sepia(.25) saturate(1.1) brightness(1.02)"
  };
  S["diamond"] = {
    cat:["light","grad","access"],
    label:{"ja":"ダイヤモンド","en":"Diamond","zh":"钻石","ko":"다이아몬드"},
    desc:{"ja":"無色透明の宝石、純粋と永遠の輝き","en":"Colorless transparent jewel, purity and eternity shining","zh":"无色透明宝石，纯粹与永恒的光芒","ko":"무색 투명 보석, 순수와 영원의 반짝임"},
    ui:{"--ui-bg":"#e0e0e0","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(38,38,38,0.05)","--ui-text":"#262626","--ui-muted":"#454545","--ui-border":"rgba(100,100,100,.25)","--ui-button":"#d0d0d0","--ui-button-hover":"#bababa","--ui-field":"#ffffff","--ui-accent":"#747d8c","--ui-on-accent":"#000000","--ui-gold":"#ffd700","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(116,125,140,0.14)"},
    game:{"don":"#ff4757","ka":"#747d8c","stage":"#f0f0f0","lane":"rgba(255,255,255,0.82)","track":"rgba(38,38,38,0.24)","ink":"#262626","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffd700","good":"#262626","miss":"#7a7a7a","glow":false},
    shapes:["square","square"],
    video:"grayscale(.1) contrast(1.1) brightness(1.05)"
  };
  S["diamond-club"] = {
    cat:["light","grad"],
    font:"\"Trajan Pro\",\"Garamond\",serif",
    type:{"title":"\"Trajan Pro\",serif","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".03em","mark":"♦ ♣ ♥ ♠"},
    label:{"ja":"ダイアモンドクラブ","en":"Diamond Club","zh":"钻石俱乐部","ko":"다이아몬드 클럽"},
    desc:{"ja":"ダイヤモンドの輝き、特別な会員制クラブ","en":"Diamond shine, exclusive members club","zh":"钻石光芒，专属会员俱乐部","ko":"다이아몬드 빛, 특별 회원제 클럽"},
    ui:{"--ui-bg":"#e0e0e0","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(26,26,26,0.05)","--ui-text":"#1a1a1a","--ui-muted":"#464646","--ui-border":"rgba(189,195,199,.20)","--ui-button":"#d0d0d0","--ui-button-hover":"#b8b8b8","--ui-field":"#ffffff","--ui-accent":"#bdc3c7","--ui-on-accent":"#000000","--ui-gold":"#ffd700","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(189,195,199,0.14)"},
    game:{"don":"#d4af37","ka":"#bdc3c7","stage":"#f0f0f0","lane":"rgba(255,255,255,0.82)","track":"rgba(26,26,26,0.24)","ink":"#1a1a1a","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffd700","good":"#1a1a1a","miss":"#737373","glow":false},
    shapes:["diamond","diamond"],
    video:"grayscale(.1) contrast(1.05) brightness(1.01)"
  };
  S["didot"] = {
    cat:["type","dark"],
    font:"\"Didot\",\"Bodoni MT\",serif",
    type:{"title":"\"Didot\",serif","weight":"300","lh":"1.6","titleWeight":"800","titleSpace":".02em","mark":"あア漢 Aa 12"},
    label:{"ja":"ディドー","en":"Didot","zh":"迪多","ko":"디도"},
    desc:{"ja":"モダン・ロマンの衬线、シャープで洗練された書体","en":"Modern romantic serif, sharp and refined","zh":"现代浪漫衬线体，锐利而精致","ko":"모던 로맨틱 세리프, 샤프하고 정교한 서체"},
    ui:{"--ui-bg":"#000000","--ui-panel":"rgba(10,10,10,0.96)","--ui-soft":"rgba(250,250,250,0.05)","--ui-text":"#fafafa","--ui-muted":"#b2bec3","--ui-border":"rgba(255,255,255,.12)","--ui-button":"#1a1a1a","--ui-button-hover":"#373737","--ui-field":"#0a0a0a","--ui-accent":"#e84393","--ui-on-accent":"#000000","--ui-gold":"#fd79a8","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(232,67,147,0.14)"},
    game:{"don":"#e84393","ka":"#00cec9","stage":"#0a0a0a","lane":"rgba(10,10,10,0.6)","track":"rgba(250,250,250,0.24)","ink":"#fafafa","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,10,10,0.95)","perfect":"#fd79a8","good":"#fafafa","miss":"#8a8a8a","glow":false},
    shapes:["square","diamond"],
    video:"contrast(1.3) saturate(1.1) brightness(.8)"
  };
  S["din"] = {
    cat:["type","dark"],
    font:"\"DIN Alternate\",\"DIN\",system-ui,sans-serif",
    type:{"title":"\"DIN Alternate\",\"DIN\",sans-serif","weight":"700","lh":"1.4","titleWeight":"800","titleSpace":"-.02em","titleTransform":"uppercase","mark":"あア漢 Aa 12"},
    label:{"ja":"DIN","en":"DIN","zh":"DIN体","ko":"DIN체"},
    desc:{"ja":"工業的なゴシック、機能的で無駄のない書体","en":"Industrial sans, functional and waste-free","zh":"工业无衬线体，功能性强且简洁","ko":"산업용 고딕, 기능적이고 낭비 없는 서체"},
    ui:{"--ui-bg":"#2d3748","--ui-panel":"rgba(45,55,72,0.96)","--ui-soft":"rgba(250,250,250,0.05)","--ui-text":"#fafafa","--ui-muted":"#b8c2d0","--ui-border":"rgba(255,255,255,.18)","--ui-button":"#2d3748","--ui-button-hover":"#48505f","--ui-field":"#1a202c","--ui-accent":"#4299e1","--ui-on-accent":"#000000","--ui-gold":"#f6e05e","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(66,153,225,0.14)"},
    game:{"don":"#f56565","ka":"#4299e1","stage":"#1a202c","lane":"rgba(45,55,72,0.6)","track":"rgba(250,250,250,0.24)","ink":"#fafafa","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(45,55,72,0.95)","perfect":"#f6e05e","good":"#fafafa","miss":"#9ea2aa","glow":false},
    shapes:["square","square"],
    video:"contrast(1.1) brightness(.9)"
  };
  S["donut"] = {
    cat:["fun","grad"],
    label:{"ja":"ドーナツ","en":"Donut","zh":"甜甜圈","ko":"도넛"},
    desc:{"ja":"カラフルな glazed ドーナツ、遊び心たっぷり","en":"Colorful glazed donut, full of playfulness","zh":"彩色糖霜甜甜圈，充满童心","ko":"컬러풀한 글레이즈 도넛, 재미가득"},
    ui:{"--ui-bg":"linear-gradient(180deg,#ff79a8,#fd79a8)","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(45,52,54,0.05)","--ui-text":"#2d3436","--ui-muted":"#474c4e","--ui-border":"rgba(253,121,168,.24)","--ui-button":"#ffc8dd","--ui-button-hover":"#e4b5c7","--ui-field":"#ffffff","--ui-accent":"#fd79a8","--ui-on-accent":"#2d3436","--ui-gold":"#ffeaa7","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(253,121,168,0.14)"},
    game:{"don":"#fd79a8","ka":"#a29bfe","stage":"linear-gradient(180deg,#ff9ce0,#ff6b9d)","lane":"rgba(255,255,255,0.82)","track":"rgba(45,52,54,0.24)","ink":"#2d3436","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffeaa7","good":"#2d3436","miss":"#8c5369","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.2) brightness(1.05)"
  };
  S["draconic-iron"] = {
    cat:["fun","grad","dark"],
    font:"\"Papyrus\",\"Papyrus Custom\",fantasy",
    type:{"title":"\"Papyrus\",fantasy","weight":"400","lh":"1.5","titleWeight":"700","titleSpace":".04em","mark":"あア漢 Aa 12"},
    label:{"ja":"ドラゴンアイアン","en":"Draconic Iron","zh":"龙铁","ko":"드래곤 아이언"},
    desc:{"ja":"竜の鱗を思わせる赤黒い鉄、炎の質感","en":"Red-black iron like dragon scales, flame texture","zh":"像龙鳞的红黑铁，火焰质感","ko":"용 비늘을 연상시키는 붉은 검은 철, 불꽃 질감"},
    ui:{"--ui-bg":"linear-gradient(180deg,#1a0303,#0a0101)","--ui-panel":"rgba(74,14,14,0.96)","--ui-soft":"rgba(255,230,230,0.05)","--ui-text":"#ffe6e6","--ui-muted":"#c9ad96","--ui-border":"rgba(255,107,107,.32)","--ui-button":"#4a0e0e","--ui-button-hover":"#622a2a","--ui-field":"#2a0e0e","--ui-accent":"#ff6b6b","--ui-on-accent":"#000000","--ui-gold":"#ffc861","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,107,107,0.14)"},
    game:{"don":"#ff6b6b","ka":"#46c2cb","stage":"linear-gradient(180deg,#4a0e0e,#1a0303)","lane":"rgba(74,14,14,0.6)","track":"rgba(255,230,230,0.24)","ink":"#ffe6e6","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(74,14,14,0.95)","perfect":"#ffc861","good":"#ffe6e6","miss":"#988080","glow":false},
    shapes:["circle","diamond"],
    video:"sepia(.5) saturate(1.3) hue-rotate(-10deg) brightness(.8) contrast(1.25)"
  };
  S["emerald"] = {
    cat:["grad","light"],
    label:{"ja":"エメラルド","en":"Emerald","zh":"绿宝石","ko":"에메랄드"},
    desc:{"ja":"深緑の宝石、成長と希望の緑","en":"Deep green jewel, growth and hope in green","zh":"深绿宝石，成长与希望的绿","ko":"깊은 초록 보석, 성장과 희망의 초록"},
    ui:{"--ui-bg":"linear-gradient(180deg,#031a0f,#010d07)","--ui-panel":"rgba(14,59,46,0.96)","--ui-soft":"rgba(230,255,230,0.05)","--ui-text":"#e6ffe6","--ui-muted":"#b8d9c7","--ui-border":"rgba(78,205,196,.30)","--ui-button":"#1e4b3e","--ui-button-hover":"#386254","--ui-field":"#0e3b2e","--ui-accent":"#4ecdc4","--ui-on-accent":"#031a0f","--ui-gold":"#ccffe6","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(78,205,196,0.14)"},
    game:{"don":"#ff6b6b","ka":"#4ecdc4","stage":"linear-gradient(180deg,#0e3b2e,#031a0f)","lane":"rgba(14,59,46,0.6)","track":"rgba(230,255,230,0.24)","ink":"#e6ffe6","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(14,59,46,0.95)","perfect":"#ccffe6","good":"#e6ffe6","miss":"#809885","glow":false},
    shapes:["circle","circle"],
    video:"grayscale(.3) hue-rotate(120deg) saturate(1.4) brightness(.85) contrast(1.15)"
  };
  S["emeraldNight"] = {
    cat:["dark","grad"],
    label:{"ja":"エメラルドの夜","en":"Emerald Night","zh":"翡翠之夜","ko":"에메랄드 밤"},
    desc:{"ja":"深い緑の宝石色、夜の海の底","en":"Deep green jewel color, the bottom of the night sea","zh":"深绿宝石色，夜海之底","ko":"깊은 녹색 보석색, 밤바다 바닥"},
    ui:{"--ui-bg":"linear-gradient(180deg,#062a33,#010a10)","--ui-panel":"rgba(6,32,40,0.96)","--ui-soft":"rgba(230,251,255,0.05)","--ui-text":"#e6fbff","--ui-muted":"#9abfc7","--ui-border":"rgba(64,220,220,.28)","--ui-button":"#0a3540","--ui-button-hover":"#274f59","--ui-field":"#052028","--ui-accent":"#3ee6c8","--ui-on-accent":"#032a24","--ui-gold":"#ffd166","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(62,230,200,0.14)"},
    game:{"don":"#ff7a6b","ka":"#3ee6c8","stage":"linear-gradient(180deg,#052028,#000609)","lane":"rgba(6,32,40,0.6)","track":"rgba(230,251,255,0.24)","ink":"#e6fbff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(6,32,40,0.95)","perfect":"#ffd166","good":"#e6fbff","miss":"#819da3","glow":false},
    shapes:["circle","circle"],
    video:"grayscale(.7) hue-rotate(160deg) saturate(1.3) brightness(.55) contrast(1.2)"
  };
  S["energy-drink"] = {
    cat:["fun","grad"],
    font:"\"Orbitron\",\"Rajdhani\",system-ui,sans-serif",
    type:{"title":"\"Orbitron\",sans-serif","weight":"700","lh":"1.2","titleWeight":"900","titleSpace":"-.05em","titleTransform":"uppercase","mark":"ENERGY"},
    label:{"ja":"エナジードリンク","en":"Energy Drink","zh":"能量饮料","ko":"에너지 드링크"},
    desc:{"ja":"蛍光色、覚醒とアドレナリン","en":"Fluorescent color, awakening and adrenaline","zh":"荧光色，觉醒与肾上腺素","ko":"형광색, 각성과 아드레날린"},
    ui:{"--ui-bg":"#1a1a1a","--ui-panel":"rgba(57,255,20,0.96)","--ui-soft":"rgba(0,0,0,0.05)","--ui-text":"#000000","--ui-muted":"#003300","--ui-border":"rgba(0,255,255,.30)","--ui-button":"#2ecc40","--ui-button-hover":"#28b138","--ui-field":"#39ff14","--ui-accent":"#ff00ff","--ui-on-accent":"#000000","--ui-gold":"#ffff00","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,0,255,0.14)"},
    game:{"don":"#ff00ff","ka":"#00ffff","stage":"#39ff14","lane":"rgba(57,255,20,0.6)","track":"rgba(0,0,0,0.24)","ink":"#000000","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(57,255,20,0.95)","perfect":"#ffff00","good":"#000000","miss":"#0c0c0c","glow":false},
    shapes:["square","square"],
    video:"saturate(1.7) brightness(.8) contrast(1.4)"
  };
  S["espresso"] = {
    cat:["dark","grad"],
    label:{"ja":"エスプレッソ","en":"Espresso","zh":"浓缩咖啡","ko":"에스프레소"},
    desc:{"ja":"濃いコーヒー、ダークでシックな夜","en":"Strong coffee, dark and chic night","zh":"浓缩咖啡，深色时尚之夜","ko":"진한 커피, 다크하고 시크한 밤"},
    ui:{"--ui-bg":"linear-gradient(180deg,#212121,#121212)","--ui-panel":"rgba(33,33,33,0.96)","--ui-soft":"rgba(255,235,238,0.05)","--ui-text":"#ffebee","--ui-muted":"#d0c4bf","--ui-border":"rgba(121,85,72,.24)","--ui-button":"#4e342e","--ui-button-hover":"#654c47","--ui-field":"#3e2723","--ui-accent":"#8d6e63","--ui-on-accent":"#ffffff","--ui-gold":"#d7ccc8","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(141,110,99,0.14)"},
    game:{"don":"#ffccbc","ka":"#8d6e63","stage":"linear-gradient(180deg,#3e2723,#212121)","lane":"rgba(33,33,33,0.6)","track":"rgba(255,235,238,0.24)","ink":"#ffebee","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(33,33,33,0.95)","perfect":"#d7ccc8","good":"#ffebee","miss":"#9b9092","glow":false},
    shapes:["circle","square"],
    video:"sepia(.5) contrast(1.15) brightness(.85)"
  };
  S["espresso-martini"] = {
    cat:["dark","access"],
    font:"\"Oswald\",\"Impact\",sans-serif",
    type:{"title":"\"Oswald\",sans-serif","weight":"700","lh":"1.3","titleWeight":"800","titleSpace":"-.03em","titleTransform":"uppercase","mark":"ESPRESSO MARTINI"},
    label:{"ja":"エスプレッソマティーニ","en":"Espresso Martini","zh":"浓缩咖啡马天尼","ko":"에스프레소 마티니"},
    desc:{"ja":"コーヒーとウォッカ、ダークでスタイリッシュ","en":"Coffee and vodka, dark and stylish","zh":"咖啡和伏特加，深色时尚","ko":"커피와 보드카, 다크하고 세련된"},
    ui:{"--ui-bg":"#0d0d0d","--ui-panel":"rgba(26,26,26,0.96)","--ui-soft":"rgba(240,240,240,0.05)","--ui-text":"#f0f0f0","--ui-muted":"#acb4b5","--ui-border":"rgba(240,240,240,.18)","--ui-button":"#2a2a2a","--ui-button-hover":"#444444","--ui-field":"#1a1a1a","--ui-accent":"#e74c3c","--ui-on-accent":"#000000","--ui-gold":"#f1c40f","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(231,76,60,0.14)"},
    game:{"don":"#e74c3c","ka":"#3498db","stage":"#1a1a1a","lane":"rgba(26,26,26,0.6)","track":"rgba(240,240,240,0.24)","ink":"#f0f0f0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,26,26,0.95)","perfect":"#f1c40f","good":"#f0f0f0","miss":"#8a8a8a","glow":false},
    shapes:["square","square"],
    video:"grayscale(.4) contrast(1.25) brightness(.85)"
  };
  S["event-horizon"] = {
    cat:["dark","access"],
    font:"\"Oswald\",\"Impact\",sans-serif",
    type:{"title":"\"Oswald\",sans-serif","weight":"700","lh":"1.3","titleWeight":"800","titleSpace":"-.03em","titleTransform":"uppercase","mark":"あア漢 Aa 12"},
    label:{"ja":"事象の地平線","en":"Event Horizon","zh":"事件视界","ko":"사건의 지평선"},
    desc:{"ja":"回復不能な境界線、ブラックホールの端","en":"Irrecoverable boundary line, edge of black hole","zh":"无法恢复的边界线，黑洞边缘","ko":"복구할 수 없는 경계선, 블랙홀 가장자리"},
    ui:{"--ui-bg":"#050505","--ui-panel":"rgba(10,10,10,0.96)","--ui-soft":"rgba(224,224,224,0.05)","--ui-text":"#e0e0e0","--ui-muted":"#9c9c9c","--ui-border":"rgba(189,195,199,.18)","--ui-button":"#1a1a1a","--ui-button-hover":"#343434","--ui-field":"#0a0a0a","--ui-accent":"#d4af37","--ui-on-accent":"#050505","--ui-gold":"#ffd700","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#bdc3c7","stage":"#0a0a0a","lane":"rgba(10,10,10,0.6)","track":"rgba(224,224,224,0.24)","ink":"#e0e0e0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,10,10,0.95)","perfect":"#ffd700","good":"#e0e0e0","miss":"#7d7d7d","glow":false},
    shapes:["square","square"],
    video:"grayscale(.7) contrast(1.25) brightness(.75)"
  };
  S["exoplanet"] = {
    cat:["light","grad"],
    font:"\"Montserrat\",system-ui,sans-serif",
    type:{"title":"\"Montserrat\",sans-serif","weight":"400","lh":"1.55","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"系外惑星","en":"Exoplanet","zh":"系外行星","ko":"계외 행성"},
    desc:{"ja":"未知の惑星表面、異星の風景","en":"Unknown planet surface, alien landscape","zh":"未知行星表面，异星风景","ko":"알 수 없는 행성 표면, 이질 풍경"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(44,62,80,0.05)","--ui-text":"#2c3e50","--ui-muted":"#4c5455","--ui-border":"rgba(52,152,219,.24)","--ui-button":"#d5dbdb","--ui-button-hover":"#bfc7c9","--ui-field":"#ffffff","--ui-accent":"#3498db","--ui-on-accent":"#000000","--ui-gold":"#f1c40f","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(52,152,219,0.14)"},
    game:{"don":"#e74c3c","ka":"#3498db","stage":"linear-gradient(180deg,#99a8b3,#eef2f3)","lane":"rgba(255,255,255,0.82)","track":"rgba(44,62,80,0.24)","ink":"#2c3e50","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#f1c40f","good":"#2c3e50","miss":"#8b959f","glow":false},
    shapes:["circle","circle"],
    video:"brightness(1.03) contrast(1.01)"
  };
  S["fireflyValley"] = {
    cat:["dark","grad","fun"],
    label:{"ja":"蛍の谷","en":"Firefly Valley","zh":"萤火谷","ko":"반딧불 계곡"},
    desc:{"ja":"暗闇に浮かぶ緑と黄色の蛍の光","en":"Green and yellow firefly lights floating in the dark","zh":"黑暗中漂浮的绿色和黄色萤火虫光","ko":"어둠에 떠 있는 초록과 노랑 반딧불 빛"},
    ui:{"--ui-bg":"linear-gradient(180deg,#000000,#050805)","--ui-panel":"rgba(0,8,0,0.96)","--ui-soft":"rgba(212,245,196,0.05)","--ui-text":"#d4f5c4","--ui-muted":"#8fb88f","--ui-border":"rgba(110,255,110,.30)","--ui-button":"#0a1c0a","--ui-button-hover":"#243822","--ui-field":"#050805","--ui-accent":"#6eff6e","--ui-on-accent":"#000000","--ui-gold":"#ffd93d","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(110,255,110,0.14)"},
    game:{"don":"#ffd93d","ka":"#6eff6e","stage":"linear-gradient(180deg,#050805,#000000)","lane":"rgba(0,8,0,0.6)","track":"rgba(212,245,196,0.24)","ink":"#d4f5c4","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(0,8,0,0.95)","perfect":"#ffd93d","good":"#d4f5c4","miss":"#75876c","glow":false},
    shapes:["circle","circle"],
    video:"grayscale(.4) hue-rotate(100deg) saturate(1.5) brightness(.5) contrast(1.3)"
  };
  S["frutiger"] = {
    cat:["type","light"],
    font:"\"Frutiger\",\"Frutiger LT\",system-ui,sans-serif",
    type:{"title":"\"Frutiger\",sans-serif","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"フルティガ","en":"Frutiger","zh":"佛鲁迪杰","ko":"루티거"},
    desc:{"ja":"看板用のヒューマニスト、視認性と開放感","en":"Humanist sans, legibility and openness","zh":"人本主义无衬线体，可读性和开放感","ko":"간판용 휴먼체, 가독성과 개방감"},
    ui:{"--ui-bg":"#c3e6e6","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(26,32,44,0.05)","--ui-text":"#1a202c","--ui-muted":"#444d5a","--ui-border":"rgba(26,32,44,.12)","--ui-button":"#bee3e8","--ui-button-hover":"#a9cad0","--ui-field":"#ffffff","--ui-accent":"#4299e1","--ui-on-accent":"#000000","--ui-gold":"#faf089","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(66,153,225,0.14)"},
    game:{"don":"#fc8181","ka":"#4299e1","stage":"#e6fffa","lane":"rgba(255,255,255,0.82)","track":"rgba(26,32,44,0.24)","ink":"#1a202c","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#faf089","good":"#1a202c","miss":"#667980","glow":false},
    shapes:["square","square"],
    video:"brightness(1.04) contrast(.98)"
  };
  S["futura"] = {
    cat:["type","dark","fun"],
    font:"\"Futura\",\"Avant Garde\",\"ITC AvantGarde Gothic\",system-ui,sans-serif",
    type:{"title":"\"Futura\",\"Avant Garde\",sans-serif","weight":"700","lh":"1.3","titleWeight":"900","titleSpace":"-.04em","titleTransform":"uppercase","mark":"あア漢 Aa 12"},
    label:{"ja":"フューチュラ","en":"Futura","zh":"未来体","ko":"퓨투라"},
    desc:{"ja":"幾何学的なゴシック、近未来的でシャープ","en":"Geometric sans, sharp and near-futuristic","zh":"几何学无衬线体，锐利且近未来感","ko":"기하학적 고딕, 근미래적이고 샤프함"},
    ui:{"--ui-bg":"#000000","--ui-panel":"rgba(10,10,10,0.96)","--ui-soft":"rgba(250,250,250,0.05)","--ui-text":"#fafafa","--ui-muted":"#a3a3a3","--ui-border":"rgba(255,255,255,.15)","--ui-button":"#1a1a1a","--ui-button-hover":"#373737","--ui-field":"#0a0a0a","--ui-accent":"#00ffcc","--ui-on-accent":"#000000","--ui-gold":"#ffd700","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,255,204,0.14)"},
    game:{"don":"#ff0055","ka":"#00ffcc","stage":"#0a0a0a","lane":"rgba(10,10,10,0.6)","track":"rgba(250,250,250,0.24)","ink":"#fafafa","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,10,10,0.95)","perfect":"#ffd700","good":"#fafafa","miss":"#8a8a8a","glow":false},
    shapes:["square","square"],
    video:"contrast(1.15) saturate(1.1) brightness(.9)"
  };
  S["garamond"] = {
    cat:["type","light"],
    font:"\"Hiragino Mincho ProN\",\"Yu Mincho\",\"YuMincho\",\"Noto Serif JP\",\"Noto Serif CJK JP\",serif",
    type:{"title":"\"Hiragino Mincho ProN\",\"Yu Mincho\",\"YuMincho\",\"Noto Serif JP\",serif","weight":"400","lh":"1.8","titleWeight":"600","titleSpace":".04em","mark":"あア漢 Aa 12"},
    label:{"ja":"ガラモン","en":"Garamond","zh":"加拉蒙","ko":"가라몽"},
    desc:{"ja":"クラシックな明朝、上品で落ち着いた書体","en":"Classic serif, elegant and composed","zh":"经典衬线体，优雅而沉稳","ko":"클래식한 명조체, 우아하고 차분한 서체"},
    ui:{"--ui-bg":"#fff8e1","--ui-panel":"rgba(255,248,225,0.96)","--ui-soft":"rgba(62,39,35,0.05)","--ui-text":"#3e2723","--ui-muted":"#61524c","--ui-border":"rgba(62,39,35,.15)","--ui-button":"#efe4cc","--ui-button-hover":"#d8cbb6","--ui-field":"#fffef5","--ui-accent":"#8d6e63","--ui-on-accent":"#ffffff","--ui-gold":"#d7ccc8","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(141,110,99,0.14)"},
    game:{"don":"#8d6e63","ka":"#5d4037","stage":"#faf5ee","lane":"rgba(255,248,225,0.82)","track":"rgba(62,39,35,0.24)","ink":"#3e2723","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,248,225,0.95)","perfect":"#d7ccc8","good":"#3e2723","miss":"#958579","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.12) brightness(1.02)"
  };
  S["garnet"] = {
    cat:["grad","dark"],
    label:{"ja":"ガーネット","en":"Garnet","zh":"石榴石","ko":"가넷"},
    desc:{"ja":"深紅褐色の宝石、友愛と忠実の赤褐","en":"Deep red-brown jewel, friendship and loyalty in red-brown","zh":"深红褐色宝石，友谊与忠诚的红褐","ko":"깊은 붉은 갈색 보석, 우정과 충실의 빨간 갈색"},
    ui:{"--ui-bg":"linear-gradient(180deg,#1a0a0a,#0d0505)","--ui-panel":"rgba(93,46,46,0.96)","--ui-soft":"rgba(255,230,230,0.05)","--ui-text":"#ffe6e6","--ui-muted":"#d9c5c5","--ui-border":"rgba(214,48,49,.30)","--ui-button":"#5d2e2e","--ui-button-hover":"#724646","--ui-field":"#3d1e1e","--ui-accent":"#d63031","--ui-on-accent":"#ffffff","--ui-gold":"#fab1a0","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(214,48,49,0.14)"},
    game:{"don":"#d63031","ka":"#74b9ff","stage":"linear-gradient(180deg,#5d2e2e,#1a0a0a)","lane":"rgba(93,46,46,0.6)","track":"rgba(255,230,230,0.24)","ink":"#ffe6e6","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(93,46,46,0.95)","perfect":"#fab1a0","good":"#ffe6e6","miss":"#988383","glow":false},
    shapes:["circle","square"],
    video:"sepia(.4) saturate(1.25) hue-rotate(-15deg) brightness(.75) contrast(1.2)"
  };
  S["gill-sans"] = {
    cat:["type","light"],
    font:"\"Gill Sans\",\"Gill Sans MT\",system-ui,sans-serif",
    type:{"title":"\"Gill Sans\",sans-serif","weight":"400","lh":"1.55","titleWeight":"700","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"ギルサンド","en":"Gill Sans","zh":"吉尔桑","ko":"길 산스"},
    desc:{"ja":"ヒューマニスト・ゴシック、人間味あふれる書体","en":"Humanist sans, warm and human","zh":"人本主义无衬线体，温暖且亲切","ko":"휴먼체 고딕, 따뜻하고 인간미 넘치는 서체"},
    ui:{"--ui-bg":"#bbdefb","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(26,35,126,0.05)","--ui-text":"#1a237e","--ui-muted":"#374073","--ui-border":"rgba(26,35,126,.15)","--ui-button":"#c5cae9","--ui-button-hover":"#afb4db","--ui-field":"#ffffff","--ui-accent":"#0288d1","--ui-on-accent":"#000000","--ui-gold":"#fff176","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(2,136,209,0.14)"},
    game:{"don":"#d32f2f","ka":"#0288d1","stage":"#e3f2fd","lane":"rgba(255,255,255,0.82)","track":"rgba(26,35,126,0.24)","ink":"#1a237e","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#fff176","good":"#1a237e","miss":"#6277b6","glow":false},
    shapes:["square","square"],
    video:"brightness(1.03) saturate(.95)"
  };
  S["glitch-core"] = {
    cat:["glitch","fun","dark"],
    font:"\"Orbitron\",\"Courier New\",\"Courier\",monospace",
    type:{"title":"\"Orbitron\",monospace","weight":"700","lh":"1.15","titleWeight":"900","titleSpace":"-.03em","titleTransform":"uppercase","mark":"GLITCH 01"},
    label:{"ja":"グリッチコア","en":"Glitch Core","zh":"故障核心","ko":"글리치 코어"},
    desc:{"ja":"RGB分解とデータ破壊の美学、デジタルノイズ","en":"RGB decomposition and data destruction aesthetics, digital n","zh":"RGB分解与数据破坏美学，数字噪声","ko":"RGB 분해와 데이터 파괴 미학, 디지털 노이즈"},
    ui:{"--ui-bg":"#050505","--ui-panel":"rgba(10,10,10,0.96)","--ui-soft":"rgba(0,255,255,0.05)","--ui-text":"#00ffff","--ui-muted":"#a3a3a3","--ui-border":"rgba(255,0,255,.35)","--ui-button":"#1a1a1a","--ui-button-hover":"#173838","--ui-field":"#0a0a0a","--ui-accent":"#ff00ff","--ui-on-accent":"#000000","--ui-gold":"#ffff00","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,0,255,0.14)"},
    game:{"don":"#ff00ff","ka":"#ffff00","stage":"#0a0a0a","lane":"rgba(10,10,10,0.6)","track":"rgba(0,255,255,0.24)","ink":"#00ffff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,10,10,0.95)","perfect":"#ffff00","good":"#00ffff","miss":"#028f8f","glow":false},
    shapes:["square","diamond"],
    video:"hue-rotate(0deg) saturate(1.8) contrast(1.4) brightness(.85)"
  };
  S["glitch-text"] = {
    cat:["glitch","fun","dark"],
    font:"\"Orbitron\",\"Courier New\",monospace",
    type:{"title":"\"Orbitron\",monospace","weight":"800","lh":"1.0","titleWeight":"900","titleSpace":"-.05em","titleTransform":"uppercase","mark":"TEXT"},
    label:{"ja":"グリッチテキスト","en":"Glitch Text","zh":"故障文字","ko":"글리치 텍스트"},
    desc:{"ja":"文字のデジタル変形、色ずれと断片","en":"Digital text deformation, color shift and fragments","zh":"文字的数字变形，色偏和碎片","ko":"문자의 디지털 변형, 색 이동과 파편"},
    ui:{"--ui-bg":"#000000","--ui-panel":"rgba(0,0,0,0.96)","--ui-soft":"rgba(255,0,255,0.05)","--ui-text":"#ff00ff","--ui-muted":"#919191","--ui-border":"rgba(255,0,255,.35)","--ui-button":"#151515","--ui-button-hover":"#331233","--ui-field":"#050505","--ui-accent":"#00ffff","--ui-on-accent":"#000000","--ui-gold":"#ffff00","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,255,255,0.14)"},
    game:{"don":"#00ffff","ka":"#ffff00","stage":"#050505","lane":"rgba(0,0,0,0.6)","track":"rgba(255,0,255,0.24)","ink":"#ff00ff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(0,0,0,0.95)","perfect":"#ffff00","good":"#ff00ff","miss":"#9d269d","glow":false},
    shapes:["square","diamond"],
    video:"hue-rotate(180deg) saturate(1.8) contrast(1.5) brightness(.8)"
  };
  S["gold"] = {
    cat:["grad","fun","light"],
    font:"\"Playfair Display\",\"Noto Serif JP\",serif",
    type:{"title":"\"Playfair Display\",serif","weight":"400","lh":"1.7","titleWeight":"700","titleSpace":".03em","mark":"あア漢 Aa 12"},
    label:{"ja":"王家の黄金","en":"Royal Gold","zh":"王室黄金","ko":"왕실의 금"},
    desc:{"ja":"豪華で気高い黄金、王冠と王座の輝き","en":"Luxurious and noble gold, crown and throne shining","zh":"豪华高贵的黄金，王冠和王座的光芒","ko":"호화롭고 기품 있는 금, 왕관과 왕좌의 빛"},
    ui:{"--ui-bg":"linear-gradient(180deg,#b8860b,#6b4a0b)","--ui-panel":"rgba(255,215,0,0.96)","--ui-soft":"rgba(26,26,26,0.05)","--ui-text":"#1a1a1a","--ui-muted":"#614c29","--ui-border":"rgba(212,175,55,.32)","--ui-button":"#ffe082","--ui-button-hover":"#e1c674","--ui-field":"#fffdf0","--ui-accent":"#d4af37","--ui-on-accent":"#1a1a1a","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#ffd700","stage":"linear-gradient(180deg,#ffd700,#b8860b)","lane":"rgba(255,215,0,0.6)","track":"rgba(26,26,26,0.24)","ink":"#1a1a1a","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(255,215,0,0.95)","perfect":"#ffe082","good":"#1a1a1a","miss":"#614b13","glow":false},
    shapes:["circle","diamond"],
    video:"sepia(.15) saturate(1.3) brightness(1.08) contrast(1.1)"
  };
  S["gold-chip"] = {
    cat:["grad","light"],
    font:"\"Montserrat\",system-ui,sans-serif",
    type:{"title":"\"Montserrat\",sans-serif","weight":"500","lh":"1.5","titleWeight":"700","titleSpace":"-.01em","mark":"$100 $500 $1000"},
    label:{"ja":"金チップ","en":"Gold Chip","zh":"金色筹码","ko":"골드 칩"},
    desc:{"ja":"カジノチップの積み重ね、黄金の賭け","en":"Stacked casino chips, golden bet","zh":"叠叠的赌场筹码，金色的赌注","ko":"쌓인 카지노 칩, 황금의 베팅"},
    ui:{"--ui-bg":"linear-gradient(180deg,#8b4513,#4a2505)","--ui-panel":"rgba(218,165,32,0.96)","--ui-soft":"rgba(255,253,240,0.05)","--ui-text":"#fffdf0","--ui-muted":"#b8860b","--ui-border":"rgba(255,215,0,.30)","--ui-button":"#daa520","--ui-button-hover":"#dfb03b","--ui-field":"#fffdf0","--ui-accent":"#ffd700","--ui-on-accent":"#4a2505","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,215,0,0.14)"},
    game:{"don":"#ffd700","ka":"#b8860b","stage":"linear-gradient(180deg,#daa520,#8b4513)","lane":"rgba(218,165,32,0.6)","track":"rgba(255,253,240,0.24)","ink":"#fffdf0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(218,165,32,0.95)","perfect":"#ffe082","good":"#fffdf0","miss":"#cbaa8d","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.3) saturate(1.2) brightness(1.02)",
    holdback:true
  };
  S["goldLeafNight"] = {
    cat:["dark","grad","fun"],
    label:{"ja":"金箔の夜","en":"Gold Leaf Night","zh":"金箔之夜","ko":"금박 밤"},
    desc:{"ja":"黒地に輝く金箔、豪華で気高い夜","en":"Gold leaf shining on black, a luxurious and noble night","zh":"黑地上闪耀的金箔，豪华高贵之夜","ko":"검은 배경에 빛나는 금박, 호화롭고 기품 있는 밤"},
    ui:{"--ui-bg":"linear-gradient(180deg,#0a0500,#050200)","--ui-panel":"rgba(26,21,16,0.96)","--ui-soft":"rgba(253,246,227,0.05)","--ui-text":"#fdf6e3","--ui-muted":"#cabfe0","--ui-border":"rgba(255,209,102,.34)","--ui-button":"#2a2018","--ui-button-hover":"#453c32","--ui-field":"#1a1510","--ui-accent":"#ffd166","--ui-on-accent":"#1a1000","--ui-gold":"#ffe9a8","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,209,102,0.14)"},
    game:{"don":"#ffd166","ka":"#b8912e","stage":"linear-gradient(180deg,#1a1510,#0a0500)","lane":"rgba(26,21,16,0.6)","track":"rgba(253,246,227,0.24)","ink":"#fdf6e3","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,21,16,0.95)","perfect":"#ffe9a8","good":"#fdf6e3","miss":"#908a7d","glow":false},
    shapes:["circle","diamond"],
    video:"grayscale(1) contrast(1.5) sepia(1) hue-rotate(18deg) saturate(1.4) brightness(.55)"
  };
  S["gothic-cathedral"] = {
    cat:["dark","grad"],
    font:"\"Trajan Pro\",\"Garamond\",serif",
    type:{"title":"\"Trajan Pro\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".04em","mark":"あア漢 Aa 12"},
    label:{"ja":"ゴシック大聖堂","en":"Gothic Cathedral","zh":"哥特式大教堂","ko":"고딕 대성당"},
    desc:{"ja":"ステンドグラス、高天井と神秘的な光","en":"Stained glass, high ceiling and mystical light","zh":"彩色玻璃，高天井与神秘光芒","ko":"스테인드글라스, 높은 천장과 신비로운 빛"},
    ui:{"--ui-bg":"#0d0b1e","--ui-panel":"rgba(13,11,30,0.96)","--ui-soft":"rgba(224,216,240,0.05)","--ui-text":"#e0d8f0","--ui-muted":"#a79bbf","--ui-border":"rgba(187,134,252,.28)","--ui-button":"#2a163e","--ui-button-hover":"#422f55","--ui-field":"#1a1a2e","--ui-accent":"#bb86fc","--ui-on-accent":"#0d0b1e","--ui-gold":"#ccd6f6","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(187,134,252,0.14)"},
    game:{"don":"#bb86fc","ka":"#74b9ff","stage":"#1a1a2e","lane":"rgba(13,11,30,0.6)","track":"rgba(224,216,240,0.24)","ink":"#e0d8f0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(13,11,30,0.95)","perfect":"#ccd6f6","good":"#e0d8f0","miss":"#817c92","glow":false},
    shapes:["circle","diamond"],
    video:"hue-rotate(260deg) saturate(1.2) brightness(.9) contrast(1.1)"
  };
  S["hacker"] = {
    cat:["glitch","dark","access"],
    font:"\"Courier New\",\"Courier\",monospace",
    type:{"title":"\"Courier New\",monospace","weight":"600","lh":"1.3","titleWeight":"700","titleSpace":".03em","mark":"root@trk:~#"},
    label:{"ja":"ハッカー・ターミナル","en":"Hacker Terminal","zh":"黑客终端","ko":"해커 터미널"},
    desc:{"ja":"黒背景緑文字の端末、コマンドライン美学","en":"Black background green text terminal, command line aesthetic","zh":"黑色背景绿色文字终端，命令行美学","ko":"검은 배경 녹색 문자 터미널, 명령줄 미학"},
    ui:{"--ui-bg":"#000000","--ui-panel":"rgba(0,0,0,0.96)","--ui-soft":"rgba(0,255,0,0.05)","--ui-text":"#00ff00","--ui-muted":"#669966","--ui-border":"rgba(0,255,0,.25)","--ui-button":"#0a0a0a","--ui-button-hover":"#092a09","--ui-field":"#000000","--ui-accent":"#00ff00","--ui-on-accent":"#000000","--ui-gold":"#66ff66","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,255,0,0.14)"},
    game:{"don":"#00cc00","ka":"#333333","stage":"#000000","lane":"rgba(0,0,0,0.6)","track":"rgba(0,255,0,0.24)","ink":"#00ff00","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(0,0,0,0.95)","perfect":"#66ff66","good":"#00ff00","miss":"#008c00","glow":false},
    shapes:["square","square"],
    video:"hue-rotate(110deg) saturate(1.4) brightness(.75) contrast(1.25)"
  };
  S["helvetica"] = {
    cat:["type","basic"],
    type:{"title":"system-ui,-apple-system,\"Segoe UI\",sans-serif","weight":"400","lh":"1.5","titleWeight":"700","titleSpace":"-.01em","mark":"あア漢 Aa 12"},
    label:{"ja":"ヘルベチカ","en":"Helvetica","zh":"黑体","ko":"헤르베티카"},
    desc:{"ja":"中立的な書体、明快で機能的なニュートラル","en":"Neutral typeface, clear and functional","zh":"中性字体，清晰且功能性强","ko":"중립적인 서체, 명확하고 기능적"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(45,55,72,0.05)","--ui-text":"#2d3748","--ui-muted":"#556071","--ui-border":"rgba(45,55,72,.12)","--ui-button":"#edf2f7","--ui-button-hover":"#d4dae0","--ui-field":"#ffffff","--ui-accent":"#3182ce","--ui-on-accent":"#000000","--ui-gold":"#f6e05e","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(49,130,206,0.14)"},
    game:{"don":"#e53e3e","ka":"#3182ce","stage":"#f7fafc","lane":"rgba(255,255,255,0.82)","track":"rgba(45,55,72,0.24)","ink":"#2d3748","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#f6e05e","good":"#2d3748","miss":"#8c919a","glow":false},
    shapes:["square","square"],
    video:"brightness(1.02) contrast(1.01)"
  };
  S["high-roller"] = {
    cat:["grad","fun","light"],
    font:"\"Didot\",\"Bodoni MT\",serif",
    type:{"title":"\"Didot\",serif","weight":"300","lh":"1.6","titleWeight":"800","titleSpace":".02em","mark":"あア漢 Aa 12"},
    label:{"ja":"ハイローラー","en":"High Roller","zh":"大赌客","ko":"하이 롤러"},
    desc:{"ja":"大金持ちのギャンブラー、シャンパンと黄金","en":"Wealthy gambler, champagne and gold","zh":"富豪赌客，香槟和黄金","ko":"부유한 도박꾼, 샴페인과 금"},
    ui:{"--ui-bg":"linear-gradient(180deg,#d4af37,#b8860b)","--ui-panel":"rgba(245,245,220,0.96)","--ui-soft":"rgba(44,44,44,0.05)","--ui-text":"#2c2c2c","--ui-muted":"#535353","--ui-border":"rgba(212,175,55,.30)","--ui-button":"#ffe082","--ui-button-hover":"#e4c977","--ui-field":"#ffffff","--ui-accent":"#ff6b6b","--ui-on-accent":"#2c2c2c","--ui-gold":"#ffe082","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(255,107,107,0.14)"},
    game:{"don":"#ff6b6b","ka":"#4ecdc4","stage":"linear-gradient(180deg,#f5f5dc,#d4af37)","lane":"rgba(245,245,220,0.82)","track":"rgba(44,44,44,0.24)","ink":"#2c2c2c","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(245,245,220,0.95)","perfect":"#ffe082","good":"#2c2c2c","miss":"#786731","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.15) saturate(1.2) brightness(1.05)"
  };
  S["hiragino-kaku"] = {
    cat:["type","light"],
    font:"\"Hiragino Kaku Gothic ProN\",\"Hiragino Sans\",sans-serif",
    type:{"title":"\"Hiragino Kaku Gothic ProN\",sans-serif","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"ヒラギノ角ゴ","en":"Hiragino Kaku Gothic","zh":"椿圆角ゴシック","ko":"히라기노 각 고딕"},
    desc:{"ja":"macOS の定番、丸みを帯びた上品な角ゴシック","en":"macOS standard, rounded elegant gothic","zh":"macOS 标准，圆润优雅的角ゴシック","ko":"macOS 표준, 둥글고 우아한 각 고딕"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(44,62,80,0.05)","--ui-text":"#2c3e50","--ui-muted":"#535b5c","--ui-border":"rgba(44,62,80,.12)","--ui-button":"#ecf0f1","--ui-button-hover":"#d3d9dc","--ui-field":"#ffffff","--ui-accent":"#2980b9","--ui-on-accent":"#000000","--ui-gold":"#f1c40f","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(41,128,185,0.14)"},
    game:{"don":"#c0392b","ka":"#2980b9","stage":"#fbfcfc","lane":"rgba(255,255,255,0.82)","track":"rgba(44,62,80,0.24)","ink":"#2c3e50","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#f1c40f","good":"#2c3e50","miss":"#8b959f","glow":false},
    shapes:["circle","circle"],
    video:"brightness(1.01) contrast(1.01)"
  };
  S["hot-cocoa"] = {
    cat:["light","life"],
    font:"\"Comic Sans MS\",\"Cursive\",fantasy",
    type:{"title":"\"Comic Sans MS\",cursive","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".04em","mark":"あア漢 Aa 12"},
    label:{"ja":"ホットココア","en":"Hot Cocoa","zh":"热可可","ko":"핫 코코아"},
    desc:{"ja":"温かい茶色、マシュマロの柔らかさ","en":"Warm brown, marshmallow softness","zh":"温暖的棕色，棉花糖的柔软","ko":"따뜻한 갈색, 마쉬멜로우의 부드러움"},
    ui:{"--ui-bg":"#d7ccc8","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(255,243,224,0.05)","--ui-text":"#fff3e0","--ui-muted":"#8d6e63","--ui-border":"rgba(141,110,99,.24)","--ui-button":"#bcaaa4","--ui-button-hover":"#c5b3ac","--ui-field":"#ffffff","--ui-accent":"#795548","--ui-on-accent":"#fff3e0","--ui-gold":"#ffe0b2","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(121,85,72,0.14)"},
    game:{"don":"#ffcc80","ka":"#bcaaa4","stage":"#795548","lane":"rgba(255,255,255,0.82)","track":"rgba(255,243,224,0.24)","ink":"#fff3e0","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffe0b2","good":"#fff3e0","miss":"#ede1d5","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.25) contrast(1.05) brightness(.98)",
    holdback:true
  };
  S["house-edge"] = {
    cat:["dark","access"],
    font:"\"Oswald\",\"Impact\",sans-serif",
    type:{"title":"\"Oswald\",sans-serif","weight":"700","lh":"1.3","titleWeight":"800","titleSpace":"-.03em","titleTransform":"uppercase","mark":"HOUSE WINS"},
    label:{"ja":"ハウスエッジ","en":"House Edge","zh":"庄家优势","ko":"하우스 에지"},
    desc:{"ja":"カジノの暗い面、ハウスの勝利と絶望","en":"Casino dark side, house victory and despair","zh":"赌场的黑暗面，庄家胜利与绝望","ko":"카지노의 어두운 면, 하우스 승리와 절망"},
    ui:{"--ui-bg":"#0a0a0a","--ui-panel":"rgba(10,10,10,0.96)","--ui-soft":"rgba(102,102,102,0.05)","--ui-text":"#666666","--ui-muted":"#333333","--ui-border":"rgba(150,150,150,.18)","--ui-button":"#2a2a2a","--ui-button-hover":"#323232","--ui-field":"#1a1a1a","--ui-accent":"#ff0040","--ui-on-accent":"#ffffff","--ui-gold":"#999999","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,0,64,0.14)"},
    game:{"don":"#ff0040","ka":"#999999","stage":"#1a1a1a","lane":"rgba(10,10,10,0.6)","track":"rgba(102,102,102,0.24)","ink":"#666666","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,10,10,0.95)","perfect":"#999999","good":"#666666","miss":"#3d3d3d","glow":false},
    shapes:["square","square"],
    video:"grayscale(.8) contrast(1.3) brightness(.7)",
    holdback:true
  };
  S["ice-hotel"] = {
    cat:["light","grad","access"],
    font:"\"Rajdhani\",\"Oswald\",sans-serif",
    type:{"title":"\"Rajdhani\",sans-serif","weight":"400","lh":"1.4","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"アイスホテル","en":"Ice Hotel","zh":"冰酒店","ko":"아이스 호텔"},
    desc:{"ja":"氷の部屋とオーロラ、北国の冷気","en":"Ice room and aurora, northern cold air","zh":"冰房和极光，北国冷气","ko":"얼음 방과 오로라, 북극 냉기"},
    ui:{"--ui-bg":"#b2ebf2","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(0,96,100,0.05)","--ui-text":"#006064","--ui-muted":"#0f6a6d","--ui-border":"rgba(77,182,172,.24)","--ui-button":"#e0f7fa","--ui-button-hover":"#c3e3e7","--ui-field":"#ffffff","--ui-accent":"#4db6ac","--ui-on-accent":"#000000","--ui-gold":"#fff9c4","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(77,182,172,0.14)"},
    game:{"don":"#b2ebf2","ka":"#80deea","stage":"#e0f7fa","lane":"rgba(255,255,255,0.82)","track":"rgba(0,96,100,0.24)","ink":"#006064","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#fff9c4","good":"#006064","miss":"#509fa4","glow":false},
    shapes:["square","square"],
    video:"brightness(1.05) saturate(.9) contrast(1.02)"
  };
  S["inkWash"] = {
    cat:["light","type"],
    font:"\"Hiragino Mincho ProN\",\"Yu Mincho\",\"YuMincho\",\"Noto Serif JP\",\"Noto Serif CJK JP\",\"Noto Serif SC\",\"Noto Serif KR\",serif",
    type:{"weight":"400","lh":"1.75","titleWeight":"600","titleSpace":".1em","mark":"あア漢 Aa 12"},
    label:{"ja":"墨流し","en":"Ink Wash Flow","zh":"墨流し","ko":"먹 흘림"},
    desc:{"ja":"和紙に墨の濃淡、朱の判子だけの差し色","en":"Ink wash on washi paper, with only a red seal as accent","zh":"宣纸上的墨色浓淡，仅以朱印点缀","ko":"한지 위의 먹 농담, 주인 한 점만 더한 색"},
    ui:{"--ui-bg":"#f3efe6","--ui-panel":"rgba(251,248,241,0.96)","--ui-soft":"rgba(27,27,27,0.05)","--ui-text":"#1b1b1b","--ui-muted":"#56534c","--ui-border":"rgba(27,27,27,.25)","--ui-button":"#e7e1d3","--ui-button-hover":"#ccc7bb","--ui-field":"#ffffff","--ui-accent":"#b3261e","--ui-on-accent":"#ffffff","--ui-gold":"#8f3500","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(179,38,30,0.14)"},
    game:{"don":"#1d1d1d","ka":"#7d7a72","stage":"#f3efe6","lane":"rgba(251,248,241,0.82)","track":"rgba(27,27,27,0.24)","ink":"#1b1b1b","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(251,248,241,0.95)","perfect":"#8f3500","good":"#1b1b1b","miss":"#7c7a76","glow":false},
    shapes:["circle","circle"],
    video:"grayscale(.6) contrast(1.05)"
  };
  S["inter"] = {
    cat:["type","basic"],
    font:"\"Inter\",system-ui,sans-serif",
    type:{"title":"\"Inter\",sans-serif","weight":"400","lh":"1.5","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"インタ","en":"Inter","zh":"间体","ko":"인터"},
    desc:{"ja":"UI/UX デザインの定番、画面に最適化された書体","en":"UI/UX design standard, screen-optimized","zh":"UI/UX 设计标准，屏幕优化","ko":"UI/UX 디자인 표준, 화면 최적화된 서체"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(26,32,44,0.05)","--ui-text":"#1a202c","--ui-muted":"#4f5a69","--ui-border":"rgba(26,32,44,.12)","--ui-button":"#edf2f7","--ui-button-hover":"#d2d7dd","--ui-field":"#ffffff","--ui-accent":"#3182ce","--ui-on-accent":"#000000","--ui-gold":"#f6e05e","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(49,130,206,0.14)"},
    game:{"don":"#e53e3e","ka":"#3182ce","stage":"#f8f9fa","lane":"rgba(255,255,255,0.82)","track":"rgba(26,32,44,0.24)","ink":"#1a202c","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#f6e05e","good":"#1a202c","miss":"#81848b","glow":false},
    shapes:["square","square"],
    video:"contrast(1.01) brightness(1.01)"
  };
  S["ironMorning"] = {
    cat:["dark","access"],
    font:"\"Courier New\",Courier,\"Cascadia Mono\",Consolas,\"Noto Sans Mono\",monospace",
    label:{"ja":"鉄の朝","en":"Iron Morning","zh":"铁之晨","ko":"철의 아침"},
    desc:{"ja":"工場地帯の朝、鉄とコンクリートの灰色","en":"Industrial district morning, gray of iron and concrete","zh":"工业区的早晨，铁与混凝土的灰色","ko":"공업 지대의 아침, 철과 콘크리트의 회색"},
    ui:{"--ui-bg":"#1a1a1a","--ui-panel":"rgba(42,42,42,0.96)","--ui-soft":"rgba(224,224,224,0.05)","--ui-text":"#e0e0e0","--ui-muted":"#c6c6c6","--ui-border":"#ffffff","--ui-button":"#3a3a3a","--ui-button-hover":"#505050","--ui-field":"#2a2a2a","--ui-accent":"#ffff00","--ui-on-accent":"#000000","--ui-gold":"#ffff00","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,255,0,0.14)"},
    game:{"don":"#ffff00","ka":"#00e5ff","stage":"#2a2a2a","lane":"rgba(42,42,42,0.6)","track":"rgba(224,224,224,0.24)","ink":"#e0e0e0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(42,42,42,0.95)","perfect":"#ffff00","good":"#e0e0e0","miss":"#878787","glow":false},
    shapes:["square","square"],
    video:"grayscale(1) brightness(.6) contrast(1.4)"
  };
  S["jackpot-777"] = {
    cat:["fun","grad"],
    font:"\"Orbitron\",\"Rajdhani\",system-ui,sans-serif",
    type:{"title":"\"Orbitron\",sans-serif","weight":"700","lh":"1.25","titleWeight":"900","titleSpace":"-.04em","titleTransform":"uppercase","mark":"7 7 7"},
    label:{"ja":"ジャックポット777","en":"Jackpot 777","zh":"头奖777","ko":"잭팟 777"},
    desc:{"ja":"スロットの大当たり、777の歓喜と黄金の輝き","en":"Slot machine jackpot, 777 joy and golden shine","zh":"老虎机大奖，777的狂喜和金色光芒","ko":"슬롯 머신 잭팟, 777의 환희와 황금빛"},
    ui:{"--ui-bg":"linear-gradient(180deg,#b8860b,#6b4a0b)","--ui-panel":"rgba(255,215,0,0.96)","--ui-soft":"rgba(26,26,26,0.05)","--ui-text":"#1a1a1a","--ui-muted":"#614c29","--ui-border":"rgba(255,107,107,.32)","--ui-button":"#ffe082","--ui-button-hover":"#e1c674","--ui-field":"#fffdf0","--ui-accent":"#ff6b6b","--ui-on-accent":"#1a1a1a","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,107,107,0.14)"},
    game:{"don":"#ff6b6b","ka":"#4ecdc4","stage":"linear-gradient(180deg,#ffd700,#b8860b)","lane":"rgba(255,215,0,0.6)","track":"rgba(26,26,26,0.24)","ink":"#1a1a1a","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(255,215,0,0.95)","perfect":"#ffe082","good":"#1a1a1a","miss":"#614b13","glow":false},
    shapes:["circle","diamond"],
    video:"sepia(.1) saturate(1.4) brightness(1.08) contrast(1.15)"
  };
  S["jade"] = {
    cat:["light","grad"],
    label:{"ja":"ジェイド","en":"Jade","zh":"翡翠","ko":"제이드"},
    desc:{"ja":"優しい緑の宝石、安定と調和の緑","en":"Gentle green jewel, stability and harmony in green","zh":"温柔绿色宝石，稳定与和谐的绿","ko":"부드러운 초록 보석, 안정과 조화의 초록"},
    ui:{"--ui-bg":"#d1f2eb","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(30,39,46,0.05)","--ui-text":"#1e272e","--ui-muted":"#465449","--ui-border":"rgba(46,204,113,.24)","--ui-button":"#abebc6","--ui-button-hover":"#99d2b2","--ui-field":"#ffffff","--ui-accent":"#2ecc71","--ui-on-accent":"#1e272e","--ui-gold":"#f9e79f","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(46,204,113,0.14)"},
    game:{"don":"#e74c3c","ka":"#2ecc71","stage":"#52b788","lane":"rgba(255,255,255,0.82)","track":"rgba(30,39,46,0.24)","ink":"#1e272e","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#f9e79f","good":"#1e272e","miss":"#6f8283","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.1) brightness(1.05)"
  };
  S["kir-royale"] = {
    cat:["light","grad"],
    font:"\"Playfair Display\",\"Noto Serif JP\",serif",
    type:{"title":"\"Playfair Display\",serif","weight":"400","lh":"1.7","titleWeight":"700","titleSpace":".03em","mark":"あア漢 Aa 12"},
    label:{"ja":"キールロワイヤル","en":"Kir Royale","zh":"基尔皇家","ko":"키르 로얄"},
    desc:{"ja":"シャンパンとカシス、紫色の祝勝","en":"Champagne and cassis, purple celebration","zh":"香槟和黑加仑，紫色庆祝","ko":"샴페인과 카시스, 보라색 승리 축하"},
    ui:{"--ui-bg":"linear-gradient(180deg,#f3e5f5,#e1bee7)","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(74,20,140,0.05)","--ui-text":"#4a148c","--ui-muted":"#751d84","--ui-border":"rgba(171,71,188,.22)","--ui-button":"#e1bee7","--ui-button-hover":"#cda8db","--ui-field":"#ffffff","--ui-accent":"#ab47bc","--ui-on-accent":"#ffffff","--ui-gold":"#f3e5f5","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(171,71,188,0.14)"},
    game:{"don":"#ce93d8","ka":"#b39ddb","stage":"linear-gradient(180deg,#e1bee7,#f3e5f5)","lane":"rgba(255,255,255,0.82)","track":"rgba(74,20,140,0.24)","ink":"#4a148c","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#f3e5f5","good":"#4a148c","miss":"#9672bb","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.1) brightness(1.05)"
  };
  S["kyoto-machiya"] = {
    cat:["light","life"],
    font:"\"Hiragino Kaku Gothic ProN\",\"Hiragino Sans\",sans-serif",
    type:{"title":"\"Hiragino Kaku Gothic ProN\",sans-serif","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".02em","mark":"あア漢 Aa 12"},
    label:{"ja":"京都町家","en":"Kyoto Machiya","zh":"京都町家","ko":"쿄토 정가"},
    desc:{"ja":"格子と坪庭、和の町並み","en":"Lattice and tsuboniwa, Japanese townscape","zh":"格子和坪庭，和风街道","ko":"격자와 츠보니와, 와풍 거리"},
    ui:{"--ui-bg":"#faf7f2","--ui-panel":"rgba(255,254,248,0.96)","--ui-soft":"rgba(44,36,29,0.05)","--ui-text":"#2c241d","--ui-muted":"#5b534b","--ui-border":"rgba(44,36,29,.15)","--ui-button":"#eae4d9","--ui-button-hover":"#d1cbc1","--ui-field":"#ffffff","--ui-accent":"#a5522e","--ui-on-accent":"#f4f1ea","--ui-gold":"#b8860b","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(165,82,46,0.14)"},
    game:{"don":"#a5522e","ka":"#4a5d6a","stage":"#f5f5dc","lane":"rgba(255,254,248,0.82)","track":"rgba(44,36,29,0.24)","ink":"#2c241d","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,254,248,0.95)","perfect":"#b8860b","good":"#2c241d","miss":"#89837d","glow":false},
    shapes:["square","square"],
    video:"sepia(.18) brightness(1.01)"
  };
  S["lanternAlley"] = {
    cat:["life","fun","grad"],
    label:{"ja":"提灯横丁","en":"Lantern Alley","zh":"提灯横丁","ko":"등불 골목"},
    desc:{"ja":"暖かな提灯の光が並ぶ祭りの夜道","en":"A festival night street lined with warm lantern lights","zh":"暖暖提灯光排列的祭夜街道","ko":"따뜻한 등불이 늘어선 축제 밤길"},
    ui:{"--ui-bg":"linear-gradient(180deg,#0f0703,#060301)","--ui-panel":"rgba(26,10,5,0.96)","--ui-soft":"rgba(255,244,230,0.05)","--ui-text":"#fff4e6","--ui-muted":"#c9ad96","--ui-border":"rgba(255,90,46,.30)","--ui-button":"#2a1810","--ui-button-hover":"#46352c","--ui-field":"#1a0a05","--ui-accent":"#ff5a2e","--ui-on-accent":"#000000","--ui-gold":"#ffc861","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,90,46,0.14)"},
    game:{"don":"#ff5a2e","ka":"#46c2cb","stage":"linear-gradient(180deg,#2a1810,#0f0703)","lane":"rgba(26,10,5,0.6)","track":"rgba(255,244,230,0.24)","ink":"#fff4e6","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,10,5,0.95)","perfect":"#ffc861","good":"#fff4e6","miss":"#938980","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.5) saturate(1.3) hue-rotate(-15deg) brightness(.7) contrast(1.2)"
  };
  S["lato"] = {
    cat:["type","light"],
    font:"\"Lato\",system-ui,sans-serif",
    type:{"title":"\"Lato\",sans-serif","weight":"400","lh":"1.6","titleWeight":"700","titleSpace":".02em","mark":"あア漢 Aa 12"},
    label:{"ja":"ラト","en":"Lato","zh":"拉托","ko":"라토"},
    desc:{"ja":"夏の意味を持つ、温かみのあるサンセリフ","en":"Warm sans-serif meaning summer","zh":"意为夏天的温暖无衬线体","ko":"여름을 의미하는 따뜻한 산세리프"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(27,94,32,0.05)","--ui-text":"#1b5e20","--ui-muted":"#2a602c","--ui-border":"rgba(27,94,32,.12)","--ui-button":"#c8e6c9","--ui-button-hover":"#b2d4b3","--ui-field":"#ffffff","--ui-accent":"#1e88e5","--ui-on-accent":"#000000","--ui-gold":"#ffb300","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(30,136,229,0.14)"},
    game:{"don":"#c62828","ka":"#1e88e5","stage":"#e8f5e9","lane":"rgba(255,255,255,0.82)","track":"rgba(27,94,32,0.24)","ink":"#1b5e20","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffb300","good":"#1b5e20","miss":"#759577","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.05) brightness(1.02)"
  };
  S["lavenderHill"] = {
    cat:["light","grad"],
    label:{"ja":"ラベンダーの丘","en":"Lavender Hill","zh":"薰衣草之丘","ko":"라벤더 언덕"},
    desc:{"ja":"紫色に包まれた丘と、静寂な夜","en":"A hill wrapped in purple and a quiet night","zh":"紫色包裹的山丘与寂静之夜","ko":"보라색에 싸인 언덕과 고요한 밤"},
    ui:{"--ui-bg":"linear-gradient(180deg,#f0e6ff,#e0d0e8)","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(74,64,96,0.05)","--ui-text":"#4a4060","--ui-muted":"#5a5368","--ui-border":"rgba(193,122,216,.24)","--ui-button":"#e8e0f0","--ui-button-hover":"#d3cbdd","--ui-field":"#ffffff","--ui-accent":"#c17ad8","--ui-on-accent":"#000000","--ui-gold":"#d8bfd8","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(193,122,216,0.14)"},
    game:{"don":"#c17ad8","ka":"#9fd8ff","stage":"linear-gradient(180deg,#e6e6fa,#d8bfd8)","lane":"rgba(255,255,255,0.82)","track":"rgba(74,64,96,0.24)","ink":"#4a4060","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#d8bfd8","good":"#4a4060","miss":"#958ba8","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.05) brightness(1.05)"
  };
  S["letterpress"] = {
    cat:["type","light"],
    font:"\"Courier New\",\"Courier\",monospace",
    type:{"title":"\"Courier New\",monospace","weight":"400","lh":"1.75","titleWeight":"700","titleSpace":".1em","titleTransform":"uppercase","mark":"あア漢 Aa 12"},
    label:{"ja":"レタープレス","en":"Letterpress","zh":"活版印刷","ko":"레터프레스"},
    desc:{"ja":"活版印刷のインク、レトロで温かみのある書体","en":"Letterpress ink, retro and warm","zh":"活版印刷油墨，复古而温暖","ko":"활판 인쇄 잉크, 레트로하고 따뜻한 서체"},
    ui:{"--ui-bg":"#e3d5c4","--ui-panel":"rgba(255,250,240,0.96)","--ui-soft":"rgba(74,55,40,0.05)","--ui-text":"#4a3728","--ui-muted":"#54493b","--ui-border":"rgba(74,55,40,.20)","--ui-button":"#d7cbbd","--ui-button-hover":"#c5b8aa","--ui-field":"#fffaf0","--ui-accent":"#8d4e2a","--ui-on-accent":"#efe6d4","--ui-gold":"#b8860b","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(141,78,42,0.14)"},
    game:{"don":"#8d4e2a","ka":"#5d6d7e","stage":"#efe6d4","lane":"rgba(255,250,240,0.82)","track":"rgba(74,55,40,0.24)","ink":"#4a3728","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,250,240,0.95)","perfect":"#b8860b","good":"#4a3728","miss":"#8f7e6e","glow":false},
    shapes:["square","square"],
    video:"sepia(.35) contrast(1.05) brightness(1.02)"
  };
  S["lighthouse"] = {
    cat:["grad","life"],
    font:"\"Montserrat\",system-ui,sans-serif",
    type:{"title":"\"Montserrat\",sans-serif","weight":"400","lh":"1.55","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"灯台","en":"Lighthouse","zh":"灯塔","ko":"등대"},
    desc:{"ja":"灯台の光と海、夜道を照らす","en":"Lighthouse light and sea, illuminating the night road","zh":"灯塔的光和海，照亮夜路","ko":"등대의 빛과 바다, 밤길을 비추는"},
    ui:{"--ui-bg":"linear-gradient(180deg,#071a33,#050c17)","--ui-panel":"rgba(10,25,47,0.96)","--ui-soft":"rgba(204,214,246,0.05)","--ui-text":"#ccd6f6","--ui-muted":"#9ea5b6","--ui-border":"rgba(255,215,0,.28)","--ui-button":"#16213e","--ui-button-hover":"#2e3956","--ui-field":"#0a192f","--ui-accent":"#ffd700","--ui-on-accent":"#050c17","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,215,0,0.14)"},
    game:{"don":"#ffd700","ka":"#4ecdc4","stage":"linear-gradient(180deg,#0a192f,#071a33)","lane":"rgba(10,25,47,0.6)","track":"rgba(204,214,246,0.24)","ink":"#ccd6f6","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,25,47,0.95)","perfect":"#ffe082","good":"#ccd6f6","miss":"#73819e","glow":false},
    shapes:["circle","circle"],
    video:"hue-rotate(200deg) saturate(1.2) brightness(.85) contrast(1.15)"
  };
  S["lofi-crt"] = {
    cat:["glitch","dark","life"],
    font:"\"Courier New\",\"Courier\",monospace",
    type:{"title":"\"Courier New\",monospace","weight":"400","lh":"1.4","titleWeight":"600","titleSpace":"0","mark":"あア漢 Aa 12"},
    label:{"ja":"ローファイCRT","en":"Lo-fi CRT","zh":"低保真CRT","ko":"로파이 CRT"},
    desc:{"ja":"低解像度ブラウン管、ざらついたアナログ感","en":"Low-resolution CRT, grainy analog feel","zh":"低分辨率CRT，粗糙的模拟感","ko":"저해상도 CRT, 거친 아날로그 느낌"},
    ui:{"--ui-bg":"#0f0f0f","--ui-panel":"rgba(15,15,15,0.96)","--ui-soft":"rgba(224,224,224,0.05)","--ui-text":"#e0e0e0","--ui-muted":"#aeaeae","--ui-border":"rgba(170,170,170,.20)","--ui-button":"#2a2a2a","--ui-button-hover":"#424242","--ui-field":"#1a1a1a","--ui-accent":"#aaaaaa","--ui-on-accent":"#000000","--ui-gold":"#ffffff","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(170,170,170,0.14)"},
    game:{"don":"#aaaaaa","ka":"#666666","stage":"#1a1a1a","lane":"rgba(15,15,15,0.6)","track":"rgba(224,224,224,0.24)","ink":"#e0e0e0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(15,15,15,0.95)","perfect":"#ffffff","good":"#e0e0e0","miss":"#828282","glow":false},
    shapes:["square","square"],
    video:"grayscale(.6) contrast(1.15) brightness(.85)"
  };
  S["lunar-surface"] = {
    cat:["light","access"],
    font:"\"Inter\",system-ui,sans-serif",
    type:{"title":"\"Inter\",sans-serif","weight":"400","lh":"1.5","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"月面","en":"Lunar Surface","zh":"月面","ko":"달 표면"},
    desc:{"ja":"クレーターだらけの灰色、静寂の月","en":"Crater-filled gray, silent moon","zh":"陨石坑遍布的灰色，寂静的月球","ko":"분화구 투성이의 회색, 고요한 달"},
    ui:{"--ui-bg":"#bdc3c7","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(44,62,80,0.05)","--ui-text":"#2c3e50","--ui-muted":"#525b5b","--ui-border":"rgba(128,128,128,.20)","--ui-button":"#ecf0f1","--ui-button-hover":"#d3d9dc","--ui-field":"#ffffff","--ui-accent":"#7f8c8d","--ui-on-accent":"#000000","--ui-gold":"#f1c40f","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(127,140,141,0.14)"},
    game:{"don":"#95a5a6","ka":"#7f8c8d","stage":"#d3d3d3","lane":"rgba(255,255,255,0.82)","track":"rgba(44,62,80,0.24)","ink":"#2c3e50","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#f1c40f","good":"#2c3e50","miss":"#6d7a86","glow":false},
    shapes:["square","square"],
    video:"grayscale(.1) contrast(1.1) brightness(1.05)"
  };
  S["macaron"] = {
    cat:["light","fun","grad"],
    label:{"ja":"マカロン","en":"Macaron","zh":"马卡龙","ko":"마카롱"},
    desc:{"ja":"パステルカラーのフランス菓子、かわいらしい色合い","en":"Pastel French confectionery, cute colors","zh":"淡色法国点心，可爱色调","ko":"파스텔 컬러 프랑스 과자, 귀여운 색감"},
    ui:{"--ui-bg":"linear-gradient(180deg,#e1bee7,#ce93d8)","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(74,20,140,0.05)","--ui-text":"#4a148c","--ui-muted":"#751d84","--ui-border":"rgba(171,71,188,.22)","--ui-button":"#e1bee7","--ui-button-hover":"#cda8db","--ui-field":"#ffffff","--ui-accent":"#ab47bc","--ui-on-accent":"#ffffff","--ui-gold":"#f3e5f5","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(171,71,188,0.14)"},
    game:{"don":"#ce93d8","ka":"#b39ddb","stage":"linear-gradient(180deg,#f3e5f5,#e1bee7)","lane":"rgba(255,255,255,0.82)","track":"rgba(74,20,140,0.24)","ink":"#4a148c","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#f3e5f5","good":"#4a148c","miss":"#8e61b5","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.1) brightness(1.05)"
  };
  S["martian-red"] = {
    cat:["fun","grad"],
    font:"\"Papyrus\",\"Papyrus Custom\",fantasy",
    type:{"title":"\"Papyrus\",fantasy","weight":"400","lh":"1.5","titleWeight":"600","titleSpace":".04em","mark":"あア漢 Aa 12"},
    label:{"ja":"火星赤","en":"Martian Red","zh":"火星红","ko":"화성 빨강"},
    desc:{"ja":"鉄分の赤い砂漠、惑星表面の赤","en":"Iron-rich red desert, planet surface red","zh":"富铁的红色沙漠，行星表面的红","ko":"철분이 많은 빨간 사막, 행성 표면의 빨강"},
    ui:{"--ui-bg":"#8e2f0a","--ui-panel":"rgba(183,65,13,0.96)","--ui-soft":"rgba(255,253,240,0.05)","--ui-text":"#fffdf0","--ui-muted":"#fdeee6","--ui-border":"rgba(230,81,0,.24)","--ui-button":"#a03309","--ui-button-hover":"#ac4d27","--ui-field":"#c1440e","--ui-accent":"#d4af37","--ui-on-accent":"#000000","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#e65100","ka":"#d4af37","stage":"#c1440e","lane":"rgba(183,65,13,0.6)","track":"rgba(255,253,240,0.24)","ink":"#fffdf0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(183,65,13,0.95)","perfect":"#ffe082","good":"#fffdf0","miss":"#29201b","glow":false},
    shapes:["circle","square"],
    video:"sepia(.4) contrast(1.1) brightness(.95)"
  };
  S["matcha"] = {
    cat:["light","grad","life"],
    label:{"ja":"抹茶","en":"Matcha","zh":"抹茶","ko":"말차"},
    desc:{"ja":"和スイーツの定番、落ち着いた緑色","en":"Japanese sweet standard, calm green","zh":"日式甜点标准，平静的绿色","ko":"일본 디저트 표준, 차분한 초록색"},
    ui:{"--ui-bg":"linear-gradient(180deg,#c8e6c9,#a5d6a7)","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(27,94,32,0.05)","--ui-text":"#1b5e20","--ui-muted":"#3a5a3b","--ui-border":"rgba(46,125,50,.22)","--ui-button":"#c8e6c9","--ui-button-hover":"#b2d4b3","--ui-field":"#ffffff","--ui-accent":"#4caf50","--ui-on-accent":"#000000","--ui-gold":"#d4e157","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(76,175,80,0.14)"},
    game:{"don":"#ffab91","ka":"#a5d6a7","stage":"linear-gradient(180deg,#548156,#2e7d32)","lane":"rgba(255,255,255,0.82)","track":"rgba(27,94,32,0.24)","ink":"#ffffff","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#d4e157","good":"#ffffff","miss":"#699b6c","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.1) brightness(1.02)"
  };
  S["matcha-latte"] = {
    cat:["light","grad"],
    font:"\"Garamond\",\"Noto Serif JP\",serif",
    type:{"title":"\"Garamond\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".04em","mark":"あア漢 Aa 12"},
    label:{"ja":"抹茶ラテ","en":"Matcha Latte","zh":"抹茶拿铁","ko":"녹차 라테"},
    desc:{"ja":"落ち着いた緑、ミルクとの調和","en":"Calm green, harmony with milk","zh":"平静的绿色，与牛奶的和谐","ko":"차분한 초록색, 우유와의 조화"},
    ui:{"--ui-bg":"linear-gradient(180deg,#c8e6c9,#a5d6a7)","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(27,94,32,0.05)","--ui-text":"#1b5e20","--ui-muted":"#3a5a3b","--ui-border":"rgba(46,125,50,.22)","--ui-button":"#c8e6c9","--ui-button-hover":"#b2d4b3","--ui-field":"#ffffff","--ui-accent":"#4caf50","--ui-on-accent":"#000000","--ui-gold":"#d4e157","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(76,175,80,0.14)"},
    game:{"don":"#ffab91","ka":"#a5d6a7","stage":"linear-gradient(180deg,#9ad29d,#9dd39f)","lane":"rgba(255,255,255,0.82)","track":"rgba(27,94,32,0.24)","ink":"#1b5e20","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#d4e157","good":"#1b5e20","miss":"#699b6c","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.1) brightness(1.02)"
  };
  S["matrix-rain"] = {
    cat:["glitch","dark","fun"],
    font:"\"Courier New\",\"Courier\",monospace",
    type:{"title":"\"Courier New\",monospace","weight":"700","lh":"1.1","titleWeight":"800","titleSpace":"0","mark":"01"},
    label:{"ja":"マトリックス・レイン","en":"Matrix Rain","zh":"黑客帝国数字雨","ko":"매트릭스 비"},
    desc:{"ja":"デジタルの緑の雨、落ちゆくコード","en":"Digital green rain, falling code","zh":"数字的绿色雨，坠落的代码","ko":"디지털 녹색 비, 떨어지는 코드"},
    ui:{"--ui-bg":"#000000","--ui-panel":"rgba(0,0,0,0.96)","--ui-soft":"rgba(0,255,0,0.05)","--ui-text":"#00ff00","--ui-muted":"#739873","--ui-border":"rgba(0,255,0,.25)","--ui-button":"#0a0a0a","--ui-button-hover":"#092a09","--ui-field":"#000000","--ui-accent":"#00ff00","--ui-on-accent":"#000000","--ui-gold":"#66ff66","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,255,0,0.14)"},
    game:{"don":"#00cc00","ka":"#33ff33","stage":"#000000","lane":"rgba(0,0,0,0.6)","track":"rgba(0,255,0,0.24)","ink":"#00ff00","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(0,0,0,0.95)","perfect":"#66ff66","good":"#00ff00","miss":"#008c00","glow":false},
    shapes:["square","square"],
    video:"hue-rotate(120deg) saturate(1.6) brightness(.7) contrast(1.3)"
  };
  S["melon-pan"] = {
    cat:["life","fun"],
    label:{"ja":"メロンパン","en":"Melon Pan","zh":"瓜面包","ko":"멜론빵"},
    desc:{"ja":"日本の菓子パン、クッキー生地のグリッド","en":"Japanese sweet bread, cookie dough grid","zh":"日本甜面包，饼干面团网格","ko":"일본 과자빵, 쿠키 반죽 그리드"},
    ui:{"--ui-bg":"#ffe082","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(117,58,8,0.05)","--ui-text":"#753a08","--ui-muted":"#814516","--ui-border":"rgba(245,127,23,.22)","--ui-button":"#ffecb3","--ui-button-hover":"#edd59d","--ui-field":"#ffffff","--ui-accent":"#ffa000","--ui-on-accent":"#3d2500","--ui-gold":"#ffd54f","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(255,160,0,0.14)"},
    game:{"don":"#ffcc80","ka":"#ffe0b2","stage":"#fff9c4","lane":"rgba(255,255,255,0.82)","track":"rgba(117,58,8,0.24)","ink":"#753a08","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffd54f","good":"#753a08","miss":"#b3853f","glow":false},
    shapes:["square","square"],
    video:"sepia(.1) saturate(1.1) brightness(1.02)"
  };
  S["mercury-core"] = {
    cat:["dark","access"],
    font:"\"Oswald\",\"Rajdhani\",sans-serif",
    type:{"title":"\"Oswald\",sans-serif","weight":"700","lh":"1.3","titleWeight":"800","titleSpace":"-.03em","titleTransform":"uppercase","mark":"CORE"},
    label:{"ja":"水星コア","en":"Mercury Core","zh":"水星核心","ko":"수성 코어"},
    desc:{"ja":"灼熱の惑星コア、鉄とニッケルの融合","en":"Scorching planet core, iron and nickel fusion","zh":"灼热行星核心，铁和镍的融合","ko":"뜨거운 행성 코어, 철과 니켈의 융합"},
    ui:{"--ui-bg":"#1a1a1a","--ui-panel":"rgba(42,42,42,0.96)","--ui-soft":"rgba(224,224,224,0.05)","--ui-text":"#e0e0e0","--ui-muted":"#c2c2c2","--ui-border":"rgba(189,195,199,.20)","--ui-button":"#3a3a3a","--ui-button-hover":"#505050","--ui-field":"#2a2a2a","--ui-accent":"#ffd700","--ui-on-accent":"#1a1a1a","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,215,0,0.14)"},
    game:{"don":"#ffd700","ka":"#bdc3c7","stage":"#2a2a2a","lane":"rgba(42,42,42,0.6)","track":"rgba(224,224,224,0.24)","ink":"#e0e0e0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(42,42,42,0.95)","perfect":"#ffe082","good":"#e0e0e0","miss":"#878787","glow":false},
    shapes:["square","square"],
    video:"grayscale(.5) contrast(1.2) brightness(.8)"
  };
  S["merriweather"] = {
    cat:["type","light"],
    font:"\"Merriweather\",\"Noto Serif JP\",serif",
    type:{"title":"\"Merriweather\",serif","weight":"400","lh":"1.75","titleWeight":"700","titleSpace":".02em","mark":"あア漢 Aa 12"},
    label:{"ja":"メリウェザー","en":"Merriweather","zh":"梅里韦瑟","ko":"메리웨더"},
    desc:{"ja":"画面読みやすさ重視の明朝、落ち着いた書体","en":"Screen-optimized serif, calm and readable","zh":"屏幕优化衬线体，平静且易读","ko":"화면 읽기 쉬운 명조체, 차분하고 읽기 쉬움"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(26,32,44,0.05)","--ui-text":"#1a202c","--ui-muted":"#4f5a69","--ui-border":"rgba(26,32,44,.12)","--ui-button":"#edf2f7","--ui-button-hover":"#d2d7dd","--ui-field":"#ffffff","--ui-accent":"#2b6cb0","--ui-on-accent":"#ffffff","--ui-gold":"#d69e2e","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(43,108,176,0.14)"},
    game:{"don":"#c53030","ka":"#2b6cb0","stage":"#f5f5f0","lane":"rgba(255,255,255,0.82)","track":"rgba(26,32,44,0.24)","ink":"#1a202c","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#d69e2e","good":"#1a202c","miss":"#81848b","glow":false},
    shapes:["circle","circle"],
    video:"contrast(1.04) brightness(1.01)"
  };
  S["midnight-casino"] = {
    cat:["dark","grad"],
    font:"\"Rajdhani\",\"Oswald\",sans-serif",
    type:{"title":"\"Rajdhani\",sans-serif","weight":"400","lh":"1.45","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"ミッドナイトカジノ","en":"Midnight Casino","zh":"午夜赌场","ko":"미드나잇 카지노"},
    desc:{"ja":"真夜中のカジノ、ダークブルーの静寂","en":"Midnight casino, dark blue silence","zh":"午夜赌场，深蓝色寂静","ko":"자정 카지노, 다크 블루 정적"},
    ui:{"--ui-bg":"#050a1a","--ui-panel":"rgba(10,15,42,0.96)","--ui-soft":"rgba(224,231,255,0.05)","--ui-text":"#e0e7ff","--ui-muted":"#a8b8d0","--ui-border":"rgba(116,185,255,.24)","--ui-button":"#15203a","--ui-button-hover":"#2f3a54","--ui-field":"#0a0f2a","--ui-accent":"#74b9ff","--ui-on-accent":"#050a1a","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(116,185,255,0.14)"},
    game:{"don":"#ff6b6b","ka":"#74b9ff","stage":"#0a0f2a","lane":"rgba(10,15,42,0.6)","track":"rgba(224,231,255,0.24)","ink":"#e0e7ff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,15,42,0.95)","perfect":"#ffe082","good":"#e0e7ff","miss":"#7d8498","glow":false},
    shapes:["circle","circle"],
    video:"hue-rotate(200deg) saturate(1.1) brightness(.85) contrast(1.1)"
  };
  S["midnightCafe"] = {
    cat:["life","light"],
    label:{"ja":"深夜喫茶","en":"Midnight Cafe","zh":"深夜咖啡厅","ko":"심야 찻집"},
    desc:{"ja":"コーヒーの香りと、ブラウンのやさしい夜","en":"Coffee aroma and gentle brown night","zh":"咖啡香气与温柔棕色之夜","ko":"커피 향과 부드러운 브라운 밤"},
    ui:{"--ui-bg":"#4e342e","--ui-panel":"rgba(62,39,35,0.96)","--ui-soft":"rgba(239,235,233,0.05)","--ui-text":"#efebe9","--ui-muted":"#ded5d2","--ui-border":"rgba(255,112,67,.28)","--ui-button":"#5d4037","--ui-button-hover":"#70564e","--ui-field":"#3e2723","--ui-accent":"#ff7043","--ui-on-accent":"#3e2723","--ui-gold":"#d7ccc8","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,112,67,0.14)"},
    game:{"don":"#ff7043","ka":"#8d6e63","stage":"#3e2723","lane":"rgba(62,39,35,0.6)","track":"rgba(239,235,233,0.24)","ink":"#efebe9","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(62,39,35,0.95)","perfect":"#d7ccc8","good":"#efebe9","miss":"#a79995","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.4) saturate(1.1) brightness(.85) contrast(1.05)"
  };
  S["mithril"] = {
    cat:["light","grad","fun"],
    font:"\"Garamond\",\"Noto Serif JP\",serif",
    type:{"title":"\"Garamond\",serif","weight":"300","lh":"1.75","titleWeight":"600","titleSpace":".04em","mark":"あア漢 Aa 12"},
    label:{"ja":"ミスリル","en":"Mithril","zh":"秘银","ko":"미스릴"},
    desc:{"ja":"ファンタジーの軽銀、妖精と王族が愛した金属","en":"Fantasy light-silver, metal loved by fairies and royalty","zh":"奇幻的轻银，精灵和王族喜爱的金属","ko":"판타지의 경은, 요정과 왕족이 사랑한 금속"},
    ui:{"--ui-bg":"linear-gradient(180deg,#7f8fa6,#5d6d7e)","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(44,62,80,0.05)","--ui-text":"#2c3e50","--ui-muted":"#4c5455","--ui-border":"rgba(52,152,219,.22)","--ui-button":"#d5dbdb","--ui-button-hover":"#bfc7c9","--ui-field":"#ffffff","--ui-accent":"#3498db","--ui-on-accent":"#000000","--ui-gold":"#d4e6f1","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(52,152,219,0.14)"},
    game:{"don":"#aed6f1","ka":"#3498db","stage":"linear-gradient(180deg,#d4e6f1,#9fabbc)","lane":"rgba(255,255,255,0.6)","track":"rgba(44,62,80,0.24)","ink":"#2c3e50","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#d4e6f1","good":"#2c3e50","miss":"#516277","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.1) brightness(1.05) contrast(1.02)"
  };
  S["mochi"] = {
    cat:["light","life"],
    label:{"ja":"餅","en":"Mochi","zh":"糯米饼","ko":"떡"},
    desc:{"ja":"和菓子の餅、柔らかく白い食感","en":"Japanese mochi, soft and white texture","zh":"日式年糕，柔软白色","ko":"일본 떡, 부드럽고 하얀 식감"},
    ui:{"--ui-bg":"#f5f5f5","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(74,74,74,0.05)","--ui-text":"#4a4a4a","--ui-muted":"#5f5f5f","--ui-border":"rgba(74,74,74,.18)","--ui-button":"#eeeeee","--ui-button-hover":"#d9d9d9","--ui-field":"#ffffff","--ui-accent":"#d1c4e9","--ui-on-accent":"#4a4a4a","--ui-gold":"#fff59d","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(209,196,233,0.14)"},
    game:{"don":"#d1c4e9","ka":"#ffccbc","stage":"#fdfdfd","lane":"rgba(255,255,255,0.82)","track":"rgba(74,74,74,0.24)","ink":"#4a4a4a","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#fff59d","good":"#4a4a4a","miss":"#8f8f8f","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.05) brightness(1.06) contrast(.95)"
  };
  S["mojito"] = {
    cat:["light","grad","fun"],
    font:"\"Montserrat\",system-ui,sans-serif",
    type:{"title":"\"Montserrat\",sans-serif","weight":"400","lh":"1.5","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"モヒート","en":"Mojito","zh":"莫吉托","ko":"모히토"},
    desc:{"ja":"ミントとライム、爽やかな酸味","en":"Mint and lime, refreshing acidity","zh":"薄荷和青柠，清爽的酸味","ko":"민트와 라임, 상큼한 신맛"},
    ui:{"--ui-bg":"#dcedc1","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(27,67,50,0.05)","--ui-text":"#1b4332","--ui-muted":"#25523d","--ui-border":"rgba(84,160,255,.24)","--ui-button":"#b2dfdb","--ui-button-hover":"#9ecbc5","--ui-field":"#ffffff","--ui-accent":"#54a0ff","--ui-on-accent":"#000000","--ui-gold":"#fbc4ab","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(84,160,255,0.14)"},
    game:{"don":"#ff9ff3","ka":"#54a0ff","stage":"linear-gradient(180deg,#a8e6cf,#dcedc1)","lane":"rgba(255,255,255,0.82)","track":"rgba(27,67,50,0.24)","ink":"#1b4332","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#fbc4ab","good":"#1b4332","miss":"#729072","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.2) brightness(1.05)"
  };
  S["montserrat"] = {
    cat:["type","basic"],
    font:"\"Montserrat\",system-ui,sans-serif",
    type:{"title":"\"Montserrat\",sans-serif","weight":"400","lh":"1.5","titleWeight":"700","titleSpace":"-.02em","mark":"あア漢 Aa 12"},
    label:{"ja":"モントセラート","en":"Montserrat","zh":"蒙特塞拉特","ko":"몬트세라트"},
    desc:{"ja":"幾何学的なゴシック、モダンでクリーンな書体","en":"Geometric sans, modern and clean","zh":"几何学无衬线体，现代且简洁","ko":"기하학적 고딕, 모던하고 깨끗한 서체"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(33,37,41,0.05)","--ui-text":"#212529","--ui-muted":"#535b5c","--ui-border":"rgba(33,37,41,.12)","--ui-button":"#ecf0f1","--ui-button-hover":"#d2d6d7","--ui-field":"#ffffff","--ui-accent":"#3498db","--ui-on-accent":"#000000","--ui-gold":"#f1c40f","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(52,152,219,0.14)"},
    game:{"don":"#e74c3c","ka":"#3498db","stage":"#f8f9fa","lane":"rgba(255,255,255,0.82)","track":"rgba(33,37,41,0.24)","ink":"#212529","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#f1c40f","good":"#212529","miss":"#858789","glow":false},
    shapes:["square","square"],
    video:"brightness(1.02) contrast(1.01)"
  };
  S["moonlitTerrace"] = {
    cat:["light","grad"],
    label:{"ja":"月光テラス","en":"Moonlit Terrace","zh":"月光露台","ko":"달빛 테라스"},
    desc:{"ja":"静かな月明かりの下、銀色に染まるテラス","en":"A terrace dyed silver under quiet moonlight","zh":"安静月光下，染成银色的露台","ko":"조용한 달빛 아래 은빛으로 물든 테라스"},
    ui:{"--ui-bg":"#0a1422","--ui-panel":"rgba(10,20,34,0.96)","--ui-soft":"rgba(224,231,255,0.05)","--ui-text":"#e0e7ff","--ui-muted":"#a8b8d0","--ui-border":"rgba(127,211,196,.25)","--ui-button":"#15263a","--ui-button-hover":"#2f3f54","--ui-field":"#0d1b2a","--ui-accent":"#7fd3c4","--ui-on-accent":"#050c14","--ui-gold":"#c89bff","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(127,211,196,0.14)"},
    game:{"don":"#ff8abf","ka":"#7fd3c4","stage":"#0d1b2a","lane":"rgba(10,20,34,0.6)","track":"rgba(224,231,255,0.24)","ink":"#e0e7ff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,20,34,0.95)","perfect":"#c89bff","good":"#e0e7ff","miss":"#80889c","glow":false},
    shapes:["circle","circle"],
    video:"grayscale(.3) hue-rotate(180deg) saturate(.8) brightness(.8) contrast(1.1)"
  };
  S["motherboard"] = {
    cat:["glitch","dark","access"],
    font:"\"Rajdhani\",\"Oswald\",sans-serif",
    type:{"title":"\"Rajdhani\",sans-serif","weight":"600","lh":"1.3","titleWeight":"800","titleSpace":"-.01em","titleTransform":"uppercase","mark":"M/B"},
    label:{"ja":"マザーボード","en":"Motherboard","zh":"主板","ko":"마더보드"},
    desc:{"ja":"回路基板と電子回路、基板緑と金属パッド","en":"Circuit board and electronic circuits, PCB green and metal p","zh":"电路板和电子线路，PCB绿与金属焊盘","ko":"회로 기판과 전자 회로, PCB 녹색과 금속 패드"},
    ui:{"--ui-bg":"#142214","--ui-panel":"rgba(20,34,20,0.96)","--ui-soft":"rgba(0,255,65,0.05)","--ui-text":"#00ff41","--ui-muted":"#cad2ca","--ui-border":"rgba(0,255,65,.30)","--ui-button":"#2a4a2a","--ui-button-hover":"#25622d","--ui-field":"#1e3a1e","--ui-accent":"#00ff41","--ui-on-accent":"#000000","--ui-gold":"#b8860b","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,255,65,0.14)"},
    game:{"don":"#b8860b","ka":"#4a4a4a","stage":"#1e3a1e","lane":"rgba(20,34,20,0.6)","track":"rgba(0,255,65,0.24)","ink":"#00ff41","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(20,34,20,0.95)","perfect":"#b8860b","good":"#00ff41","miss":"#099c2d","glow":false},
    shapes:["square","square"],
    video:"hue-rotate(100deg) saturate(1.4) brightness(.85) contrast(1.15)"
  };
  S["nebula"] = {
    cat:["grad","fun","light"],
    font:"\"Orbitron\",\"Rajdhani\",system-ui,sans-serif",
    type:{"title":"\"Orbitron\",sans-serif","weight":"400","lh":"1.5","titleWeight":"700","titleSpace":".02em","mark":"あア漢 Aa 12"},
    label:{"ja":"星雲","en":"Nebula","zh":"星云","ko":"성운"},
    desc:{"ja":"ガスと塵のカラフルな星雲、星の誕生の場","en":"Colorful gas and dust nebula, birthplace of stars","zh":"色彩缤纷的气体和尘埃星云，恒星诞生之地","ko":"컬러풀한 가스와 먼지 성운, 별의 탄생지"},
    ui:{"--ui-bg":"linear-gradient(180deg,#0f0c29,#302b63,#24243e)","--ui-panel":"rgba(15,12,41,0.96)","--ui-soft":"rgba(255,255,255,0.05)","--ui-text":"#ffffff","--ui-muted":"#a8b8d0","--ui-border":"rgba(0,210,255,.28)","--ui-button":"#16213e","--ui-button-hover":"#343e57","--ui-field":"#1a1a2e","--ui-accent":"#00d2ff","--ui-on-accent":"#000000","--ui-gold":"#ffd700","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,210,255,0.14)"},
    game:{"don":"#ffd700","ka":"#00d2ff","stage":"linear-gradient(180deg,#576bc7,#764ba2,#9c60a3,#c44656)","lane":"rgba(15,12,41,0.6)","track":"rgba(255,255,255,0.24)","ink":"#ffffff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(15,12,41,0.95)","perfect":"#ffd700","good":"#ffffff","miss":"#93929f","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.3) hue-rotate(30deg) brightness(.9) contrast(1.15)"
  };
  S["negroni"] = {
    cat:["dark","fun"],
    font:"\"Papyrus\",\"Papyrus Custom\",fantasy",
    type:{"title":"\"Papyrus\",fantasy","weight":"400","lh":"1.5","titleWeight":"600","titleSpace":".05em","mark":"あア漢 Aa 12"},
    label:{"ja":"ネグローニ","en":"Negroni","zh":"内格罗尼","ko":"네그로니"},
    desc:{"ja":"苦い赤、イタリアのカクテル","en":"Bitter red, Italian cocktail","zh":"苦红色，意大利鸡尾酒","ko":"쓴 빨강, 이탈리아 칵테일"},
    ui:{"--ui-bg":"#7b1113","--ui-panel":"rgba(179,38,30,0.96)","--ui-soft":"rgba(255,253,240,0.05)","--ui-text":"#fffdf0","--ui-muted":"#f6eeea","--ui-border":"rgba(212,175,55,.28)","--ui-button":"#b3261e","--ui-button-hover":"#bd4239","--ui-field":"#9c221f","--ui-accent":"#d4af37","--ui-on-accent":"#7b1113","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#8c9eac","stage":"#b3261e","lane":"rgba(179,38,30,0.6)","track":"rgba(255,253,240,0.24)","ink":"#fffdf0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(179,38,30,0.95)","perfect":"#ffe082","good":"#fffdf0","miss":"#c79893","glow":false},
    shapes:["circle","diamond"],
    video:"sepia(.45) contrast(1.15) brightness(.88)"
  };
  S["neon-grid"] = {
    cat:["glitch","grad","fun"],
    font:"\"Rajdhani\",\"Oswald\",sans-serif",
    type:{"title":"\"Rajdhani\",sans-serif","weight":"600","lh":"1.25","titleWeight":"700","titleSpace":"-.01em","mark":"GRID"},
    label:{"ja":"ネオングリッド","en":"Neon Grid","zh":"霓虹网格","ko":"네온 그리드"},
    desc:{"ja":"発光する格子、ワイヤーフレーム空間","en":"Glowing grid, wireframe space","zh":"发光的网格，线框空间","ko":"발광하는 그리드, 와이어프레임 공간"},
    ui:{"--ui-bg":"#05050a","--ui-panel":"rgba(10,10,26,0.96)","--ui-soft":"rgba(0,255,255,0.05)","--ui-text":"#00ffff","--ui-muted":"#a3a3b0","--ui-border":"rgba(0,255,255,.35)","--ui-button":"#1a1a2a","--ui-button-hover":"#173846","--ui-field":"#0a0a1a","--ui-accent":"#00ffff","--ui-on-accent":"#000000","--ui-gold":"#ff00ff","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,255,255,0.14)"},
    game:{"don":"#ff00ff","ka":"#4a4a6a","stage":"#0a0a1a","lane":"rgba(10,10,26,0.6)","track":"rgba(0,255,255,0.24)","ink":"#00ffff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,10,26,0.95)","perfect":"#ff00ff","good":"#00ffff","miss":"#028f91","glow":false},
    shapes:["square","square"],
    video:"hue-rotate(200deg) saturate(1.6) brightness(.75) contrast(1.3)"
  };
  S["neon-sign"] = {
    cat:["fun","dark"],
    font:"\"Caveat\",\"Komodo Axis\",cursive",
    type:{"title":"\"Caveat\",cursive","weight":"400","lh":"1.4","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"ネオンサイン","en":"Neon Sign","zh":"霓虹招牌","ko":"네온 사인"},
    desc:{"ja":"カジノのネオン看板、派手で目を引く","en":"Casino neon sign, flashy and eye-catching","zh":"赌场霓虹招牌，花哨引人注目","ko":"카지노 네온 사인, 화려하고 눈길을 끄는"},
    ui:{"--ui-bg":"#000000","--ui-panel":"rgba(10,10,10,0.96)","--ui-soft":"rgba(255,0,255,0.05)","--ui-text":"#ff00ff","--ui-muted":"#8c8c8c","--ui-border":"rgba(255,255,255,.15)","--ui-button":"#1a1a1a","--ui-button-hover":"#381738","--ui-field":"#0a0a0a","--ui-accent":"#00ffff","--ui-on-accent":"#000000","--ui-gold":"#ffff00","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,255,255,0.14)"},
    game:{"don":"#00ffff","ka":"#ffff00","stage":"#0a0a0a","lane":"rgba(10,10,10,0.6)","track":"rgba(255,0,255,0.24)","ink":"#ff00ff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,10,10,0.95)","perfect":"#ffff00","good":"#ff00ff","miss":"#9d269d","glow":false},
    shapes:["square","square"],
    video:"saturate(1.7) brightness(.7) contrast(1.4)"
  };
  S["neon-vegas"] = {
    cat:["fun","grad"],
    font:"\"Orbitron\",\"Futura\",system-ui,sans-serif",
    type:{"title":"\"Orbitron\",sans-serif","weight":"700","lh":"1.2","titleWeight":"900","titleSpace":"-.05em","titleTransform":"uppercase","mark":"VEGAS"},
    label:{"ja":"ネオンベガス","en":"Neon Vegas","zh":"霓虹拉斯维加斯","ko":"네온 베가스"},
    desc:{"ja":"ラスベガスのネオン街、派手で賑やかな夜","en":"Las Vegas neon street, flashy and lively night","zh":"拉斯维加斯霓虹街，花哨热闹的夜晚","ko":"라스베이거스 네온 거리, 화려하고 시끌벅적한 밤"},
    ui:{"--ui-bg":"#000000","--ui-panel":"rgba(10,10,26,0.96)","--ui-soft":"rgba(0,255,255,0.05)","--ui-text":"#00ffff","--ui-muted":"#a79bbf","--ui-border":"rgba(0,255,255,.30)","--ui-button":"#1a1a2a","--ui-button-hover":"#173846","--ui-field":"#0a0a1a","--ui-accent":"#ff00ff","--ui-on-accent":"#000000","--ui-gold":"#00ffff","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,0,255,0.14)"},
    game:{"don":"#ff00ff","ka":"#00ffcc","stage":"#0a0a1a","lane":"rgba(10,10,26,0.6)","track":"rgba(0,255,255,0.24)","ink":"#00ffff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,10,26,0.95)","perfect":"#00ffff","good":"#00ffff","miss":"#008c8c","glow":false},
    shapes:["square","square"],
    video:"hue-rotate(180deg) saturate(1.6) brightness(.75) contrast(1.3)"
  };
  S["new-york-subway"] = {
    cat:["dark","fun"],
    font:"\"Impact\",\"Haettenschweiler\",sans-serif",
    type:{"title":"\"Impact\",sans-serif","weight":"900","lh":"1.1","titleWeight":"900","titleSpace":"-.05em","titleTransform":"uppercase","mark":"NYC"},
    label:{"ja":"ニューヨーク地下鉄","en":"New York Subway","zh":"纽约地铁","ko":"뉴욕 지하철"},
    desc:{"ja":"タイルと電車の音、都会の鼓動","en":"Tiles and train sounds, urban pulse","zh":"瓷砖和火车声，都市脉搏","ko":"타일과 전차 소리, 대도시 맥박"},
    ui:{"--ui-bg":"#1a252f","--ui-panel":"rgba(26,37,47,0.96)","--ui-soft":"rgba(240,240,240,0.05)","--ui-text":"#f0f0f0","--ui-muted":"#d9dddd","--ui-border":"rgba(52,152,219,.24)","--ui-button":"#3a4a5a","--ui-button-hover":"#52606e","--ui-field":"#2c3e50","--ui-accent":"#3498db","--ui-on-accent":"#000000","--ui-gold":"#f1c40f","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(52,152,219,0.14)"},
    game:{"don":"#e74c3c","ka":"#3498db","stage":"#2c3e50","lane":"rgba(26,37,47,0.6)","track":"rgba(240,240,240,0.24)","ink":"#f0f0f0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,37,47,0.95)","perfect":"#f1c40f","good":"#f0f0f0","miss":"#909599","glow":false},
    shapes:["square","square"],
    video:"contrast(1.15) brightness(.9)"
  };
  S["noto-sans-jp"] = {
    cat:["type","basic"],
    font:"\"Noto Sans JP\",\"Noto Sans CJK JP\",sans-serif",
    type:{"title":"\"Noto Sans JP\",sans-serif","weight":"400","lh":"1.7","titleWeight":"700","titleSpace":".02em","mark":"あア漢 Aa 12"},
    label:{"ja":"ノトサンスJP","en":"Noto Sans JP","zh":"思源黑体 JP","ko":"노토 산스 JP"},
    desc:{"ja":"日本語ウェブの定番、バランスの取れた角ゴシック","en":"Japanese web standard, balanced gothic","zh":"日语网页标准，均衡的角ゴシック","ko":"일본어 웹 표준, 균형 잡힌 고딕"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(26,26,26,0.05)","--ui-text":"#1a1a1a","--ui-muted":"#585858","--ui-border":"rgba(26,26,26,.12)","--ui-button":"#eeeeee","--ui-button-hover":"#d2d2d2","--ui-field":"#ffffff","--ui-accent":"#1976d2","--ui-on-accent":"#ffffff","--ui-gold":"#ffa000","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(25,118,210,0.14)"},
    game:{"don":"#d32f2f","ka":"#1976d2","stage":"#fafafa","lane":"rgba(255,255,255,0.82)","track":"rgba(26,26,26,0.24)","ink":"#1a1a1a","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffa000","good":"#1a1a1a","miss":"#818181","glow":false},
    shapes:["square","square"],
    video:"contrast(1.02) brightness(1.01)"
  };
  S["obsidian"] = {
    cat:["dark","grad"],
    label:{"ja":"オブシディアン","en":"Obsidian","zh":"黒曜石","ko":"흑요석"},
    desc:{"ja":"火山ガラスの黒、真実と洞察の黒","en":"Volcanic glass black, truth and insight in black","zh":"火山玻璃黑，真理与洞察的黑","ko":"화산 유리 검정, 진실과 통찰의 검정"},
    ui:{"--ui-bg":"linear-gradient(180deg,#000000,#0d0d0d)","--ui-panel":"rgba(26,26,26,0.96)","--ui-soft":"rgba(223,230,233,0.05)","--ui-text":"#dfe6e9","--ui-muted":"#b1b7b9","--ui-border":"rgba(223,230,233,.20)","--ui-button":"#2d2d2d","--ui-button-hover":"#444545","--ui-field":"#1a1a1a","--ui-accent":"#00b894","--ui-on-accent":"#000000","--ui-gold":"#fdcb6e","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,184,148,0.14)"},
    game:{"don":"#e17055","ka":"#0984e3","stage":"linear-gradient(180deg,#1a1a1a,#000000)","lane":"rgba(26,26,26,0.6)","track":"rgba(223,230,233,0.24)","ink":"#dfe6e9","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,26,26,0.95)","perfect":"#fdcb6e","good":"#dfe6e9","miss":"#7b7f80","glow":false},
    shapes:["square","square"],
    video:"grayscale(.7) contrast(1.15) brightness(.7)"
  };
  S["old-fashioned"] = {
    cat:["dark","basic"],
    font:"\"Caslon\",\"Garamond\",serif",
    type:{"title":"\"Caslon\",serif","weight":"400","lh":"1.65","titleWeight":"600","titleSpace":".03em","mark":"あア漢 Aa 12"},
    label:{"ja":"オールドファッション","en":"Old Fashioned","zh":"老式鸡尾酒","ko":"올드 패션드"},
    desc:{"ja":"ウイスキーとビターズ、レトロなカクテル","en":"Whiskey and bitters, retro cocktail","zh":"威士忌和苦精，复古鸡尾酒","ko":"위스키와 비터스, 레트로 칵테일"},
    ui:{"--ui-bg":"#263238","--ui-panel":"rgba(62,39,35,0.96)","--ui-soft":"rgba(215,204,200,0.05)","--ui-text":"#d7ccc8","--ui-muted":"#cbbeb9","--ui-border":"rgba(140,158,172,.20)","--ui-button":"#4e342e","--ui-button-hover":"#604842","--ui-field":"#3e2723","--ui-accent":"#d4af37","--ui-on-accent":"#263238","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#b8860b","stage":"#3e2723","lane":"rgba(62,39,35,0.6)","track":"rgba(215,204,200,0.24)","ink":"#d7ccc8","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(62,39,35,0.95)","perfect":"#ffe082","good":"#d7ccc8","miss":"#878787","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.4) contrast(1.1) brightness(.85)"
  };
  S["onyx"] = {
    cat:["dark","access"],
    label:{"ja":"オニキス","en":"Onyx","zh":"玛瑙","ko":"오닉스"},
    desc:{"ja":"漆黒の宝石、強さと守護の黒","en":"Jet black jewel, strength and protection in black","zh":"漆黑宝石，强壮与守护的黑","ko":"칠흑 보석, 강함과 보호의 검정"},
    ui:{"--ui-bg":"#000000","--ui-panel":"rgba(10,10,10,0.96)","--ui-soft":"rgba(224,224,224,0.05)","--ui-text":"#e0e0e0","--ui-muted":"#9c9c9c","--ui-border":"#ffffff","--ui-button":"#1a1a1a","--ui-button-hover":"#343434","--ui-field":"#0a0a0a","--ui-accent":"#4ecdc4","--ui-on-accent":"#000000","--ui-gold":"#ffd700","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(78,205,196,0.14)"},
    game:{"don":"#ff6b6b","ka":"#4ecdc4","stage":"#0a0a0a","lane":"rgba(10,10,10,0.6)","track":"rgba(224,224,224,0.24)","ink":"#e0e0e0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,10,10,0.95)","perfect":"#ffd700","good":"#e0e0e0","miss":"#7b7b7b","glow":false},
    shapes:["square","square"],
    video:"grayscale(1) brightness(.6) contrast(1.4)"
  };
  S["opal"] = {
    cat:["grad","fun"],
    label:{"ja":"オパール","en":"Opal","zh":"欧泊","ko":"오팔"},
    desc:{"ja":"虹色に輝く宝石、創造と想像の虹色","en":"Rainbow-shining jewel, creativity and imagination in rainbow","zh":"彩虹色闪耀宝石，创造与想象的彩虹","ko":"무지개빛으로 빛나는 보석, 창의와 상상의 무지개"},
    ui:{"--ui-bg":"linear-gradient(90deg,#241539,#123041,#153829,#38300f,#3b1526)","--ui-panel":"rgba(18,16,32,0.96)","--ui-soft":"rgba(244,242,255,0.05)","--ui-text":"#f4f2ff","--ui-muted":"#b0aecb","--ui-border":"rgba(255,255,255,.22)","--ui-button":"#201a35","--ui-button-hover":"#3c364f","--ui-field":"#151126","--ui-accent":"#f0eeff","--ui-on-accent":"#241a3a","--ui-gold":"#ffd166","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(240,238,255,0.14)"},
    game:{"don":"#ff6b9d","ka":"#a29bfe","stage":"linear-gradient(90deg,#1a0f2e,#0e2233,#0e2e22,#2e2a0c,#33101f)","lane":"rgba(18,16,32,0.6)","track":"rgba(244,242,255,0.24)","ink":"#f4f2ff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(18,16,32,0.95)","perfect":"#ffd166","good":"#f4f2ff","miss":"#968fa6","glow":false},
    shapes:["circle","diamond"],
    video:"saturate(1.4) contrast(1.2) brightness(.75) hue-rotate(30deg)"
  };
  S["opensans"] = {
    cat:["type","light"],
    font:"\"Open Sans\",system-ui,sans-serif",
    type:{"title":"\"Open Sans\",sans-serif","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"オープンサンス","en":"Open Sans","zh":"开放无衬线","ko":"오픈 산스"},
    desc:{"ja":"人間的なゴシック、読みやすさと親しみやすさ","en":"Humanist sans, legibility and friendliness","zh":"人本主义无衬线体，可读性和亲和力","ko":"휴먼체 고딕, 가독성과 친근함"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(52,73,94,0.05)","--ui-text":"#34495e","--ui-muted":"#4b5353","--ui-border":"rgba(52,73,94,.12)","--ui-button":"#d5dbdb","--ui-button-hover":"#c0c8cb","--ui-field":"#ffffff","--ui-accent":"#2ecc71","--ui-on-accent":"#000000","--ui-gold":"#f39c12","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(46,204,113,0.14)"},
    game:{"don":"#e74c3c","ka":"#2ecc71","stage":"#eef2f3","lane":"rgba(255,255,255,0.82)","track":"rgba(52,73,94,0.24)","ink":"#34495e","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#f39c12","good":"#34495e","miss":"#88939e","glow":false},
    shapes:["circle","circle"],
    video:"brightness(1.03) contrast(.99)"
  };
  S["optima"] = {
    cat:["type","light"],
    font:"\"Optima\",\"URW Palladio\",serif",
    type:{"title":"\"Optima\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".02em","mark":"あア漢 Aa 12"},
    label:{"ja":"オプティマ","en":"Optima","zh":"奥普蒂玛","ko":"옵티마"},
    desc:{"ja":"セリフとサンセリフの間、柔らかな書体","en":"Between serif and sans, soft and balanced","zh":"介于衬线与无衬线之间，柔和平衡","ko":"세리프와 산세리프 사이, 부드럽고 균형 잡힌 서체"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(45,52,54,0.05)","--ui-text":"#2d3436","--ui-muted":"#4f585b","--ui-border":"rgba(45,52,54,.12)","--ui-button":"#dfe6e9","--ui-button-hover":"#c8cfd2","--ui-field":"#ffffff","--ui-accent":"#0984e3","--ui-on-accent":"#000000","--ui-gold":"#fdcb6e","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(9,132,227,0.14)"},
    game:{"don":"#d63031","ka":"#0984e3","stage":"#fafafa","lane":"rgba(255,255,255,0.82)","track":"rgba(45,52,54,0.24)","ink":"#2d3436","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#fdcb6e","good":"#2d3436","miss":"#8c8f90","glow":false},
    shapes:["circle","circle"],
    video:"contrast(1.03) brightness(1.01)"
  };
  S["orichalcum"] = {
    cat:["grad","fun","light"],
    font:"\"Trajan Pro\",\"Papyrus\",fantasy",
    type:{"title":"\"Trajan Pro\",fantasy","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".05em","titleTransform":"uppercase","mark":"あア漢 Aa 12"},
    label:{"ja":"オリハルコン","en":"Orichalcum","zh":"奥尔哈尔库姆","ko":"오리HAL콘"},
    desc:{"ja":"古代ギリシャの神聖金属、山吹色の輝き","en":"Ancient Greek sacred metal, golden-yellow shine","zh":"古希腊神圣金属，山吹色光泽","ko":"고대 그리스의 신성한 금속, 산죽색 광채"},
    ui:{"--ui-bg":"linear-gradient(180deg,#8b4513,#4a2505)","--ui-panel":"rgba(218,165,32,0.96)","--ui-soft":"rgba(255,253,240,0.05)","--ui-text":"#fffdf0","--ui-muted":"#b8860b","--ui-border":"rgba(255,215,0,.30)","--ui-button":"#daa520","--ui-button-hover":"#dfb03b","--ui-field":"#fffdf0","--ui-accent":"#ffd700","--ui-on-accent":"#4a2505","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,215,0,0.14)"},
    game:{"don":"#ffd700","ka":"#b8860b","stage":"linear-gradient(180deg,#daa520,#8b4513)","lane":"rgba(218,165,32,0.6)","track":"rgba(255,253,240,0.24)","ink":"#fffdf0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(218,165,32,0.95)","perfect":"#ffe082","good":"#fffdf0","miss":"#cbaa8d","glow":false},
    shapes:["circle","diamond"],
    video:"sepia(.3) saturate(1.25) brightness(1.05) contrast(1.1)",
    holdback:true
  };
  S["oswald"] = {
    cat:["type","dark","fun"],
    font:"\"Oswald\",\"Impact\",sans-serif",
    type:{"title":"\"Oswald\",sans-serif","weight":"400","lh":"1.3","titleWeight":"700","titleSpace":"-.03em","titleTransform":"uppercase","mark":"あア漢 Aa 12"},
    label:{"ja":"オズワルド","en":"Oswald","zh":"奥斯瓦尔德","ko":"오스왈드"},
    desc:{"ja":"圧縮されたゴシック、見出しに強い書体","en":"Condensed sans, strong for headlines","zh":"压缩无衬线体，标题有力","ko":"압축된 고딕, 제목에 강한 서체"},
    ui:{"--ui-bg":"#2d3748","--ui-panel":"rgba(45,55,72,0.96)","--ui-soft":"rgba(250,250,250,0.05)","--ui-text":"#fafafa","--ui-muted":"#b8c2d0","--ui-border":"rgba(255,255,255,.18)","--ui-button":"#2d3748","--ui-button-hover":"#48505f","--ui-field":"#1a202c","--ui-accent":"#4299e1","--ui-on-accent":"#000000","--ui-gold":"#f6e05e","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(66,153,225,0.14)"},
    game:{"don":"#fc8181","ka":"#4299e1","stage":"#1a202c","lane":"rgba(45,55,72,0.6)","track":"rgba(250,250,250,0.24)","ink":"#fafafa","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(45,55,72,0.95)","perfect":"#f6e05e","good":"#fafafa","miss":"#9ea2aa","glow":false},
    shapes:["square","square"],
    video:"contrast(1.15) brightness(.9)"
  };
  S["pancake"] = {
    cat:["light","life"],
    label:{"ja":"パンケーキ","en":"Pancake","zh":"松饼","ko":"팬케이크"},
    desc:{"ja":"朝食のパンケーキ、バターのイエロー","en":"Breakfast pancake, buttery yellow","zh":"早餐松饼，黄油黄色","ko":"아침 팬케이크, 버터 노란색"},
    ui:{"--ui-bg":"#fff59d","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(112,64,25,0.05)","--ui-text":"#704019","--ui-muted":"#7b4720","--ui-border":"rgba(245,127,23,.22)","--ui-button":"#ffe082","--ui-button-hover":"#eccb74","--ui-field":"#ffffff","--ui-accent":"#ffa000","--ui-on-accent":"#3d2500","--ui-gold":"#ffeb3b","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(255,160,0,0.14)"},
    game:{"don":"#ffd54f","ka":"#ffe082","stage":"#fff176","lane":"rgba(255,255,255,0.82)","track":"rgba(112,64,25,0.24)","ink":"#704019","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffeb3b","good":"#704019","miss":"#a78a50","glow":false},
    shapes:["circle","circle"],
    video:"brightness(1.05) saturate(1.05)"
  };
  S["paperMoon"] = {
    cat:["light","grad"],
    label:{"ja":"紙月の夜","en":"Paper Moon Night","zh":"纸月之夜","ko":"종이 달밤"},
    desc:{"ja":"和紙の灯りと、やわらかな月の光","en":"Washi paper light and soft moonlight","zh":"和纸灯与柔和的月光","ko":"와시 종이 불빛과 부드러운 달빛"},
    ui:{"--ui-bg":"#efe9dc","--ui-panel":"rgba(251,248,241,0.96)","--ui-soft":"rgba(43,38,32,0.05)","--ui-text":"#2b2620","--ui-muted":"#564f46","--ui-border":"rgba(60,45,30,.25)","--ui-button":"#e6dfd0","--ui-button-hover":"#cec7b9","--ui-field":"#fffdf8","--ui-accent":"#b5533c","--ui-on-accent":"#fff8f0","--ui-gold":"#a67c2e","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(181,83,60,0.14)"},
    game:{"don":"#b5533c","ka":"#5f7f8f","stage":"#f4eee0","lane":"rgba(251,248,241,0.82)","track":"rgba(43,38,32,0.24)","ink":"#2b2620","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(251,248,241,0.95)","perfect":"#a67c2e","good":"#2b2620","miss":"#837e75","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.2) brightness(1.1) contrast(.95)"
  };
  S["parfait"] = {
    cat:["fun","grad"],
    label:{"ja":"パフェ","en":"Parfait","zh":"圣代","ko":"파르페"},
    desc:{"ja":"層になったアイスパフェ、色とりどり","en":"Layered ice parfait, colorful","zh":"分层冰淇淋圣代，色彩缤纷","ko":"층을 이룬 아이스 파르페, 색색깔"},
    ui:{"--ui-bg":"linear-gradient(180deg,#ffc3a1,#afd9fe)","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(45,52,54,0.05)","--ui-text":"#2d3436","--ui-muted":"#474c4e","--ui-border":"rgba(225,112,85,.24)","--ui-button":"#ffc8dd","--ui-button-hover":"#e4b5c7","--ui-field":"#ffffff","--ui-accent":"#e17055","--ui-on-accent":"#000000","--ui-gold":"#ffeaa7","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(225,112,85,0.14)"},
    game:{"don":"#fd79a8","ka":"#a29bfe","stage":"linear-gradient(180deg,#ff9a9e,#fecfef,#ff9a9e)","lane":"rgba(255,255,255,0.82)","track":"rgba(45,52,54,0.24)","ink":"#2d3436","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffeaa7","good":"#2d3436","miss":"#8c7466","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.15) brightness(1.04)"
  };
  S["paris-cafe"] = {
    cat:["light","life"],
    font:"\"Playfair Display\",\"Noto Serif JP\",serif",
    type:{"title":"\"Playfair Display\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"あア漢 Aa 12"},
    label:{"ja":"パリカフェ","en":"Paris Cafe","zh":"巴黎咖啡厅","ko":"파리 카페"},
    desc:{"ja":"テラス席とエッフェル塔、優雅な午後","en":"Terrace seats and Eiffel Tower, elegant afternoon","zh":"露台座位和埃菲尔铁塔，优雅的下午","ko":"테라스席과 에펠탑, 우아한 오후"},
    ui:{"--ui-bg":"#ffe082","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(74,55,40,0.05)","--ui-text":"#4a3728","--ui-muted":"#5b534b","--ui-border":"rgba(140,158,172,.20)","--ui-button":"#e8dec7","--ui-button-hover":"#d3c8b2","--ui-field":"#fffef5","--ui-accent":"#d4af37","--ui-on-accent":"#4a3728","--ui-gold":"#ffe082","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#8c9eac","stage":"#f5e6d3","lane":"rgba(255,255,255,0.82)","track":"rgba(74,55,40,0.24)","ink":"#4a3728","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffe082","good":"#4a3728","miss":"#9b8351","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.2) saturate(1.05) brightness(1.03)"
  };
  S["pearl"] = {
    cat:["light","grad"],
    label:{"ja":"パール","en":"Pearl","zh":"珍珠","ko":"진주"},
    desc:{"ja":"乳白色の宝石、純真と慈愛の白","en":"Creamy white jewel, purity and compassion in white","zh":"乳白色宝石，纯真与慈爱的白","ko":"크림색 하양 보석, 순수와 연민의 하양"},
    ui:{"--ui-bg":"#dfe6e9","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(45,52,54,0.05)","--ui-text":"#2d3436","--ui-muted":"#505558","--ui-border":"rgba(178,190,195,.20)","--ui-button":"#e5e7e9","--ui-button-hover":"#cdd0d2","--ui-field":"#ffffff","--ui-accent":"#74b9ff","--ui-on-accent":"#2d3436","--ui-gold":"#fdcb6e","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(116,185,255,0.14)"},
    game:{"don":"#e17055","ka":"#74b9ff","stage":"#fdfefe","lane":"rgba(255,255,255,0.82)","track":"rgba(45,52,54,0.24)","ink":"#2d3436","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#fdcb6e","good":"#2d3436","miss":"#7d8487","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.05) brightness(1.08) contrast(.98)"
  };
  S["pixel-8bit"] = {
    cat:["glitch","fun","light"],
    font:"\"Press Start 2P\",\"Courier New\",monospace",
    type:{"title":"\"Press Start 2P\",monospace","weight":"400","lh":"1.2","titleWeight":"600","titleSpace":".05em","titleTransform":"uppercase","mark":"8BIT"},
    label:{"ja":"ピクセル8ビット","en":"Pixel 8-bit","zh":"8位元像素","ko":"8비트 픽셀"},
    desc:{"ja":"8ビット低解像度ドット絵、限定パレット","en":"8-bit low-resolution pixel art, limited palette","zh":"8位元低分辨率像素画，有限调色板","ko":"8비트 저해상도 도트아트, 제한된 팔레트"},
    ui:{"--ui-bg":"#1a1a1a","--ui-panel":"rgba(26,26,26,0.96)","--ui-soft":"rgba(255,255,255,0.05)","--ui-text":"#ffffff","--ui-muted":"#cccccc","--ui-border":"rgba(0,255,0,.30)","--ui-button":"#3a3a3a","--ui-button-hover":"#545454","--ui-field":"#2a2a2a","--ui-accent":"#00ff00","--ui-on-accent":"#000000","--ui-gold":"#ffff00","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,255,0,0.14)"},
    game:{"don":"#ff0000","ka":"#00ff00","stage":"#2a2a2a","lane":"rgba(26,26,26,0.6)","track":"rgba(255,255,255,0.24)","ink":"#ffffff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,26,26,0.95)","perfect":"#ffff00","good":"#ffffff","miss":"#989898","glow":false},
    shapes:["square","square"],
    video:"saturate(1.4) contrast(1.25) brightness(.95)"
  };
  S["pixel-art"] = {
    cat:["glitch","fun","light"],
    font:"\"Press Start 2P\",\"Courier New\",monospace",
    type:{"title":"\"Press Start 2P\",monospace","weight":"400","lh":"1.25","titleWeight":"700","titleSpace":".04em","titleTransform":"uppercase","mark":"PX"},
    label:{"ja":"ピクセルアート","en":"Pixel Art","zh":"像素艺术","ko":"픽셀 아트"},
    desc:{"ja":"ドット絵キャラ、クラシックゲーム画面","en":"Dot art characters, classic game screen","zh":"点阵画角色，经典游戏画面","ko":"도트 아트 캐릭터, 클래식 게임 화면"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(26,26,26,0.05)","--ui-text":"#1a1a1a","--ui-muted":"#525252","--ui-border":"rgba(255,0,0,.20)","--ui-button":"#e0e0e0","--ui-button-hover":"#c6c6c6","--ui-field":"#ffffff","--ui-accent":"#ff0000","--ui-on-accent":"#000000","--ui-gold":"#ffd700","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(255,0,0,0.14)"},
    game:{"don":"#ff0000","ka":"#888888","stage":"#f0f0f0","lane":"rgba(255,255,255,0.82)","track":"rgba(26,26,26,0.24)","ink":"#1a1a1a","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffd700","good":"#1a1a1a","miss":"#818181","glow":false},
    shapes:["square","square"],
    video:"saturate(1.2) contrast(1.15) brightness(1.02)"
  };
  S["platinum"] = {
    cat:["light","access"],
    font:"\"Didot\",\"Bodoni MT\",serif",
    type:{"title":"\"Didot\",serif","weight":"300","lh":"1.65","titleWeight":"800","titleSpace":".02em","mark":"あア漢 Aa 12"},
    label:{"ja":"プラチナ","en":"Platinum","zh":"铂金","ko":"백금"},
    desc:{"ja":"純白の高貴な金属、気高く清らかな輝き","en":"Pure white noble metal, noble and pure shine","zh":"纯白高贵金属，高贵清澈的光泽","ko":"순백의 고귀한 금속, 기품 있고 깨끗한 광채"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(38,38,38,0.05)","--ui-text":"#262626","--ui-muted":"#545454","--ui-border":"rgba(38,38,38,.12)","--ui-button":"#eaeaea","--ui-button-hover":"#d1d1d1","--ui-field":"#ffffff","--ui-accent":"#d4af37","--ui-on-accent":"#000000","--ui-gold":"#fffdf0","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#7f8c8d","stage":"#f5f5f5","lane":"rgba(255,255,255,0.82)","track":"rgba(38,38,38,0.24)","ink":"#262626","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#fffdf0","good":"#262626","miss":"#888888","glow":false},
    shapes:["circle","circle"],
    video:"contrast(1.08) brightness(1.03)"
  };
  S["playfair-display"] = {
    cat:["type","light","fun"],
    font:"\"Playfair Display\",\"Noto Serif JP\",serif",
    type:{"title":"\"Playfair Display\",serif","weight":"400","lh":"1.7","titleWeight":"700","titleSpace":".03em","mark":"あア漢 Aa 12"},
    label:{"ja":"プレイフェアディスプレイ","en":"Playfair Display","zh":"博尼塔展示体","ko":"플레이페어 디스플레이"},
    desc:{"ja":"エレガントな明朝、雑誌の見出しに最適","en":"Elegant serif, ideal for magazine headlines","zh":"优雅衬线体，适合杂志标题","ko":"우아한 명조체, 잡지 제목에 적합"},
    ui:{"--ui-bg":"#fffef5","--ui-panel":"rgba(255,255,245,0.96)","--ui-soft":"rgba(44,36,29,0.05)","--ui-text":"#2c241d","--ui-muted":"#5b534b","--ui-border":"rgba(44,36,29,.15)","--ui-button":"#eae4d9","--ui-button-hover":"#d1cbc1","--ui-field":"#ffffff","--ui-accent":"#a5522e","--ui-on-accent":"#fdfcf0","--ui-gold":"#b8860b","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(165,82,46,0.14)"},
    game:{"don":"#a5522e","ka":"#4a5d6a","stage":"#fdfcf0","lane":"rgba(255,255,245,0.82)","track":"rgba(44,36,29,0.24)","ink":"#2c241d","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,245,0.95)","perfect":"#b8860b","good":"#2c241d","miss":"#8b867e","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.15) brightness(1.01)"
  };
  S["poker-face"] = {
    cat:["dark","basic"],
    font:"\"Caslon\",\"Garamond\",serif",
    type:{"title":"\"Caslon\",serif","weight":"400","lh":"1.65","titleWeight":"600","titleSpace":".03em","mark":"♠ ♥ ♦ ♣"},
    label:{"ja":"ポーカーフェイス","en":"Poker Face","zh":"扑克脸","ko":"포커 페이스"},
    desc:{"ja":"ポーカーの緊張感、深緑のフェルトと無表情","en":"Poker tension, deep green felt and expressionless","zh":"扑克的紧张感，深绿色呢绒和无表情","ko":"포커의 긴장감, 깊은 초록색 펠트와 무표정"},
    ui:{"--ui-bg":"#152a15","--ui-panel":"rgba(26,58,26,0.96)","--ui-soft":"rgba(232,240,232,0.05)","--ui-text":"#e8f0e8","--ui-muted":"#d0d6d0","--ui-border":"rgba(140,158,172,.24)","--ui-button":"#2a4a2a","--ui-button-hover":"#436043","--ui-field":"#1a3a1a","--ui-accent":"#d4af37","--ui-on-accent":"#152a15","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#8c9eac","stage":"#1a3a1a","lane":"rgba(26,58,26,0.6)","track":"rgba(232,240,232,0.24)","ink":"#e8f0e8","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,58,26,0.95)","perfect":"#ffe082","good":"#e8f0e8","miss":"#899789","glow":false},
    shapes:["square","square"],
    video:"sepia(.3) contrast(1.1) brightness(.9)"
  };
  S["poppins"] = {
    cat:["type","fun","light"],
    font:"\"Poppins\",system-ui,sans-serif",
    type:{"title":"\"Poppins\",sans-serif","weight":"400","lh":"1.5","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"ポピンズ","en":"Poppins","zh":"波平斯","ko":"포핀스"},
    desc:{"ja":"インド発の幾何学ゴシック、丸みがかわいい書体","en":"Indian geometric sans, round and cute","zh":"印度几何学无衬线体，圆润可爱","ko":"인도 기하학적 고딕, 둥글고 귀여운 서체"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(45,52,54,0.05)","--ui-text":"#2d3436","--ui-muted":"#505558","--ui-border":"rgba(45,52,54,.12)","--ui-button":"#ffe5f0","--ui-button-hover":"#e4ced8","--ui-field":"#ffffff","--ui-accent":"#e84393","--ui-on-accent":"#000000","--ui-gold":"#fd79a8","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(232,67,147,0.14)"},
    game:{"don":"#e84393","ka":"#00cec9","stage":"#fff0f5","lane":"rgba(255,255,255,0.82)","track":"rgba(45,52,54,0.24)","ink":"#2d3436","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#fd79a8","good":"#2d3436","miss":"#8c8f90","glow":false},
    shapes:["circle","circle"],
    video:"brightness(1.04) saturate(1.05)"
  };
  S["proxima-nova"] = {
    cat:["type","basic"],
    font:"\"Proxima Nova\",system-ui,sans-serif",
    type:{"title":"\"Proxima Nova\",sans-serif","weight":"400","lh":"1.5","titleWeight":"600","titleSpace":"-.01em","mark":"あア漢 Aa 12"},
    label:{"ja":"プロキシマノヴァ","en":"Proxima Nova","zh":"近星新星","ko":"프록시노바"},
    desc:{"ja":"ウェブで人気の幾何学ゴシック、柔軟でモダン","en":"Popular web geometric sans, flexible and modern","zh":"流行网页几何学无衬线体，灵活且现代","ko":"웹 인기 기하학적 고딕, 유연하고 현대적"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(38,50,56,0.05)","--ui-text":"#263238","--ui-muted":"#485e68","--ui-border":"rgba(38,50,56,.12)","--ui-button":"#eceff1","--ui-button-hover":"#d2d6d9","--ui-field":"#ffffff","--ui-accent":"#1565c0","--ui-on-accent":"#ffffff","--ui-gold":"#ff9800","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(21,101,192,0.14)"},
    game:{"don":"#c62828","ka":"#1565c0","stage":"#f5f5f5","lane":"rgba(255,255,255,0.82)","track":"rgba(38,50,56,0.24)","ink":"#263238","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ff9800","good":"#263238","miss":"#888e92","glow":false},
    shapes:["square","square"],
    video:"contrast(1.02) brightness(1.01)"
  };
  S["pulsar"] = {
    cat:["grad","fun"],
    font:"\"Orbitron\",\"Futura\",system-ui,sans-serif",
    type:{"title":"\"Orbitron\",sans-serif","weight":"700","lh":"1.2","titleWeight":"900","titleSpace":"-.04em","titleTransform":"uppercase","mark":"PULSE"},
    label:{"ja":"パルサー","en":"Pulsar","zh":"脉冲星","ko":"펄사"},
    desc:{"ja":"回転する電波の点滅、規則的な光のパルス","en":"Rotating radio wave flashing, regular light pulse","zh":"旋转无线电闪烁，规律光脉冲","ko":"회전하는 전파 점멸, 규칙적인 빛 펄스"},
    ui:{"--ui-bg":"#000000","--ui-panel":"rgba(10,10,26,0.96)","--ui-soft":"rgba(0,255,255,0.05)","--ui-text":"#00ffff","--ui-muted":"#a0a0b0","--ui-border":"rgba(0,255,255,.30)","--ui-button":"#1a1a2a","--ui-button-hover":"#173846","--ui-field":"#0a0a1a","--ui-accent":"#00ffff","--ui-on-accent":"#000000","--ui-gold":"#ffff00","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,255,255,0.14)"},
    game:{"don":"#ff00ff","ka":"#00ffcc","stage":"#0a0a1a","lane":"rgba(10,10,26,0.6)","track":"rgba(0,255,255,0.24)","ink":"#00ffff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,10,26,0.95)","perfect":"#ffff00","good":"#00ffff","miss":"#008c8c","glow":false},
    shapes:["square","square"],
    video:"hue-rotate(180deg) saturate(1.6) brightness(.75) contrast(1.3)"
  };
  S["quartz"] = {
    cat:["light","access"],
    label:{"ja":"クォーツ","en":"Quartz","zh":"石英","ko":"쿼츠"},
    desc:{"ja":"透明な結晶、調和と浄化の白","en":"Transparent crystal, harmony and purification in white","zh":"透明水晶，和谐与净化的白","ko":"투명한 결정, 조화와 정화의 하양"},
    ui:{"--ui-bg":"#e9ecef","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(73,80,87,0.05)","--ui-text":"#495057","--ui-muted":"#4e5155","--ui-border":"rgba(100,100,100,.18)","--ui-button":"#dee2e6","--ui-button-hover":"#cbcfd3","--ui-field":"#ffffff","--ui-accent":"#6c757d","--ui-on-accent":"#ffffff","--ui-gold":"#ffc107","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(108,117,125,0.14)"},
    game:{"don":"#e83e8c","ka":"#6c757d","stage":"#f8f9fa","lane":"rgba(255,255,255,0.82)","track":"rgba(73,80,87,0.24)","ink":"#495057","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffc107","good":"#495057","miss":"#8a8f93","glow":false},
    shapes:["square","square"],
    video:"grayscale(.1) brightness(1.05) contrast(1.02)"
  };
  S["quasar"] = {
    cat:["dark","grad"],
    font:"\"Trajan Pro\",\"Papyrus\",fantasy",
    type:{"title":"\"Trajan Pro\",fantasy","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".04em","titleTransform":"uppercase","mark":"あア漢 Aa 12"},
    label:{"ja":"クエーサー","en":"Quasar","zh":"类星体","ko":"퀘이사"},
    desc:{"ja":"遠方宇宙の超高エネルギー、活動銀河核","en":"Distant universe ultra-high energy, active galactic nucleus","zh":"远方宇宙超高能量，活跃星系核","ko":"먼 우주의 초고에너지, 활동은하핵"},
    ui:{"--ui-bg":"#000000","--ui-panel":"rgba(0,0,0,0.96)","--ui-soft":"rgba(224,231,255,0.05)","--ui-text":"#e0e7ff","--ui-muted":"#a8a8b8","--ui-border":"rgba(187,134,252,.30)","--ui-button":"#1a0f2a","--ui-button-hover":"#342b46","--ui-field":"#0d0b1e","--ui-accent":"#bb86fc","--ui-on-accent":"#000000","--ui-gold":"#03dac6","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(187,134,252,0.14)"},
    game:{"don":"#bb86fc","ka":"#03dac6","stage":"linear-gradient(180deg,#2c003e,#000000,#2c003e)","lane":"rgba(0,0,0,0.6)","track":"rgba(224,231,255,0.24)","ink":"#e0e7ff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(0,0,0,0.95)","perfect":"#03dac6","good":"#e0e7ff","miss":"#7b7f8c","glow":false},
    shapes:["circle","circle"],
    video:"hue-rotate(270deg) saturate(1.4) brightness(.8) contrast(1.2)"
  };
  S["quicksilver"] = {
    cat:["grad","fun","light"],
    font:"\"Caveat\",\"Komodo Axis\",cursive",
    type:{"title":"\"Caveat\",cursive","weight":"400","lh":"1.5","titleWeight":"600","titleSpace":".02em","mark":"あア漢 Aa 12"},
    label:{"ja":"水銀","en":"Quicksilver","zh":"水银","ko":"수은"},
    desc:{"ja":"流動する銀、液体金属のような変幻自在な質感","en":"Flowing silver, liquid metal ever-changing texture","zh":"流动的银，液态金属般的变幻莫测质感","ko":"흐르는 은, 액체 금속 같은 변화무쌍한 질감"},
    ui:{"--ui-bg":"linear-gradient(180deg,#7f8c8d,#5d6d7e)","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(44,62,80,0.05)","--ui-text":"#2c3e50","--ui-muted":"#525b5b","--ui-border":"rgba(52,152,219,.24)","--ui-button":"#ecf0f1","--ui-button-hover":"#d3d9dc","--ui-field":"#ffffff","--ui-accent":"#3498db","--ui-on-accent":"#000000","--ui-gold":"#bdc3c7","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(52,152,219,0.14)"},
    game:{"don":"#3498db","ka":"#e74c3c","stage":"linear-gradient(180deg,#bdc3c7,#9fa9aa)","lane":"rgba(255,255,255,0.6)","track":"rgba(44,62,80,0.24)","ink":"#2c3e50","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#bdc3c7","good":"#2c3e50","miss":"#51616b","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.15) contrast(1.08) brightness(1.04)"
  };
  S["raleway"] = {
    cat:["type","light"],
    font:"\"Raleway\",system-ui,sans-serif",
    type:{"title":"\"Raleway\",sans-serif","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".02em","mark":"あア漢 Aa 12"},
    label:{"ja":"ラレーウェイ","en":"Raleway","zh":"拉雷维","ko":"랄레웨이"},
    desc:{"ja":"エレガントなゴシック、細身で洗練された書体","en":"Elegant sans, slim and refined","zh":"优雅无衬线体，纤细精致","ko":"우아한 고딕, 날렵하고 정교한 서체"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(45,52,54,0.05)","--ui-text":"#2d3436","--ui-muted":"#4f585b","--ui-border":"rgba(45,52,54,.12)","--ui-button":"#dfe6e9","--ui-button-hover":"#c8cfd2","--ui-field":"#ffffff","--ui-accent":"#0984e3","--ui-on-accent":"#000000","--ui-gold":"#fdcb6e","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(9,132,227,0.14)"},
    game:{"don":"#d63031","ka":"#0984e3","stage":"#fafafa","lane":"rgba(255,255,255,0.82)","track":"rgba(45,52,54,0.24)","ink":"#2d3436","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#fdcb6e","good":"#2d3436","miss":"#8c8f90","glow":false},
    shapes:["circle","circle"],
    video:"contrast(1.03) brightness(1.01)"
  };
  S["roboto"] = {
    cat:["type","basic"],
    font:"\"Roboto\",system-ui,sans-serif",
    type:{"title":"\"Roboto\",sans-serif","weight":"400","lh":"1.5","titleWeight":"500","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"ロボト","en":"Roboto","zh":"机器人","ko":"로보토"},
    desc:{"ja":"Material Design の定番、機械的で読みやすい書体","en":"Material Design standard, mechanical and legible","zh":"Material Design 标准，机械且易读","ko":"머티리얼 디자인 표준, 기계적이고 읽기 쉬운 서체"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(33,33,33,0.05)","--ui-text":"#212121","--ui-muted":"#4c4c4c","--ui-border":"rgba(33,33,33,.12)","--ui-button":"#cfd8dc","--ui-button-hover":"#b8c0c4","--ui-field":"#ffffff","--ui-accent":"#2196f3","--ui-on-accent":"#000000","--ui-gold":"#ffc107","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(33,150,243,0.14)"},
    game:{"don":"#f44336","ka":"#2196f3","stage":"#eceff1","lane":"rgba(255,255,255,0.82)","track":"rgba(33,33,33,0.24)","ink":"#212121","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffc107","good":"#212121","miss":"#858585","glow":false},
    shapes:["square","square"],
    video:"contrast(1.01) brightness(1.01)"
  };
  S["rockwell"] = {
    cat:["type","dark","fun"],
    font:"\"Rockwell\",\"Courier New\",monospace",
    type:{"title":"\"Rockwell\",serif","weight":"700","lh":"1.45","titleWeight":"800","titleSpace":"-.02em","mark":"あア漢 Aa 12"},
    label:{"ja":"ロックウェル","en":"Rockwell","zh":"ロックウェル","ko":"록웰"},
    desc:{"ja":"スラブセリフ、力強く重厚な書体","en":"Slab serif, powerful and substantial","zh":"方体衬线体，有力且厚重","ko":"슬래브 세리프, 강력하고 중후한 서체"},
    ui:{"--ui-bg":"#2d3748","--ui-panel":"rgba(45,55,72,0.96)","--ui-soft":"rgba(250,250,250,0.05)","--ui-text":"#fafafa","--ui-muted":"#b8c2d0","--ui-border":"rgba(255,255,255,.18)","--ui-button":"#2d3748","--ui-button-hover":"#48505f","--ui-field":"#1a202c","--ui-accent":"#fc8181","--ui-on-accent":"#1a202c","--ui-gold":"#f6e05e","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(252,129,129,0.14)"},
    game:{"don":"#fc8181","ka":"#63b3ed","stage":"#1a202c","lane":"rgba(45,55,72,0.6)","track":"rgba(250,250,250,0.24)","ink":"#fafafa","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(45,55,72,0.95)","perfect":"#f6e05e","good":"#fafafa","miss":"#9ea2aa","glow":false},
    shapes:["square","square"],
    video:"contrast(1.15) saturate(1.05) brightness(.9)"
  };
  S["roulette-wheel"] = {
    cat:["grad","fun"],
    font:"\"Trajan Pro\",\"Papyrus\",fantasy",
    type:{"title":"\"Trajan Pro\",fantasy","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".04em","titleTransform":"uppercase","mark":"RED BLACK"},
    label:{"ja":"ルーレットホイール","en":"Roulette Wheel","zh":"轮盘赌","ko":"룰렛 휠"},
    desc:{"ja":"ルーレットの回転、赤と黒の運命の輪","en":"Roulette spin, red and black wheel of fate","zh":"轮盘旋转，红黑命运之轮","ko":"룰렛 회전, 빨강과 검정 운명의 바퀴"},
    ui:{"--ui-bg":"#0a0a0a","--ui-panel":"rgba(10,10,10,0.96)","--ui-soft":"rgba(240,240,240,0.05)","--ui-text":"#f0f0f0","--ui-muted":"#b3b3b3","--ui-border":"rgba(255,255,255,.20)","--ui-button":"#2a2a2a","--ui-button-hover":"#444444","--ui-field":"#1a1a1a","--ui-accent":"#ffd700","--ui-on-accent":"#000000","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,215,0,0.14)"},
    game:{"don":"#ffd700","ka":"#ffffff","stage":"linear-gradient(90deg,#8e1222,#1a1a1a,#8e1222,#1a1a1a)","lane":"rgba(10,10,10,0.6)","track":"rgba(240,240,240,0.24)","ink":"#f0f0f0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,10,10,0.95)","perfect":"#ffe082","good":"#f0f0f0","miss":"#898989","glow":false},
    shapes:["circle","diamond"],
    video:"contrast(1.2) saturate(1.1) brightness(.9)"
  };
  S["ruby"] = {
    cat:["grad","fun","dark"],
    label:{"ja":"ルビー","en":"Ruby","zh":"红宝石","ko":"루비"},
    desc:{"ja":"深紅の宝石、情熱と勇気の赤","en":"Deep red jewel, passion and courage in red","zh":"深红宝石，激情与勇气的红","ko":"깊은 붉은 보석, 열정과 용기의 빨강"},
    ui:{"--ui-bg":"linear-gradient(180deg,#1a0303,#0a0101)","--ui-panel":"rgba(26,3,3,0.96)","--ui-soft":"rgba(255,230,230,0.05)","--ui-text":"#ffe6e6","--ui-muted":"#ca9b9b","--ui-border":"rgba(255,26,26,.32)","--ui-button":"#4a0e0e","--ui-button-hover":"#622a2a","--ui-field":"#2a0e0e","--ui-accent":"#ff1a1a","--ui-on-accent":"#000000","--ui-gold":"#ffcccc","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,26,26,0.14)"},
    game:{"don":"#ff1a1a","ka":"#4da6ff","stage":"linear-gradient(180deg,#4a0e0e,#1a0303)","lane":"rgba(26,3,3,0.6)","track":"rgba(255,230,230,0.24)","ink":"#ffe6e6","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,3,3,0.95)","perfect":"#ffcccc","good":"#ffe6e6","miss":"#988080","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.3) saturate(1.4) hue-rotate(-10deg) brightness(.75) contrast(1.25)"
  };
  S["runic-iron"] = {
    cat:["dark","type"],
    font:"\"MedievalSharp\",\"Papyrus\",fantasy",
    type:{"title":"\"MedievalSharp\",fantasy","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".08em","titleTransform":"uppercase","mark":"あア漢 Aa 12"},
    label:{"ja":"ルーンアイアン","en":"Runic Iron","zh":"符文铁","ko":"룬 아이언"},
    desc:{"ja":"北欧神話のルーン文字、古き鉄の重み","en":"Norse rune letters, weight of ancient iron","zh":"北欧神话的符文文字，古老铁的重量","ko":"북유럽 신화의 룬 문자, 고대 철의 무게"},
    ui:{"--ui-bg":"#1a1510","--ui-panel":"rgba(44,36,29,0.96)","--ui-soft":"rgba(212,197,168,0.05)","--ui-text":"#d4c5a8","--ui-muted":"#bab4aa","--ui-border":"rgba(212,197,168,.25)","--ui-button":"#3a3028","--ui-button-hover":"#4e4339","--ui-field":"#2c241d","--ui-accent":"#d65a31","--ui-on-accent":"#1a1510","--ui-gold":"#e3c089","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(214,90,49,0.14)"},
    game:{"don":"#d65a31","ka":"#8c9eac","stage":"#2c241d","lane":"rgba(44,36,29,0.6)","track":"rgba(212,197,168,0.24)","ink":"#d4c5a8","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(44,36,29,0.95)","perfect":"#e3c089","good":"#d4c5a8","miss":"#807664","glow":false},
    shapes:["square","diamond"],
    video:"sepia(.35) contrast(1.1) brightness(.85)"
  };
  S["sake"] = {
    cat:["light","life"],
    font:"\"Hiragino Mincho ProN\",\"Yu Mincho\",\"YuMincho\",\"Noto Serif JP\",serif",
    type:{"title":"\"Hiragino Mincho ProN\",serif","weight":"400","lh":"1.75","titleWeight":"600","titleSpace":".1em","mark":"あア漢 Aa 12"},
    label:{"ja":"日本酒","en":"Sake","zh":"清酒","ko":"사케"},
    desc:{"ja":"白濁、和の情緒と穀物の香り","en":"Cloudy white, Japanese emotion and grain aroma","zh":"白浊，日本情绪与谷物香气","ko":"하얗게 흐림, 일본의 정서와 곡물 향"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(26,32,44,0.05)","--ui-text":"#1a202c","--ui-muted":"#495362","--ui-border":"rgba(26,32,44,.12)","--ui-button":"#e2e8f0","--ui-button-hover":"#c8ced7","--ui-field":"#ffffff","--ui-accent":"#d4af37","--ui-on-accent":"#000000","--ui-gold":"#f6e05e","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#4a5d6a","stage":"#f3f4f6","lane":"rgba(255,255,255,0.82)","track":"rgba(26,32,44,0.24)","ink":"#1a202c","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#f6e05e","good":"#1a202c","miss":"#81848b","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.1) brightness(1.02)"
  };
  S["sapphire"] = {
    cat:["dark","grad"],
    label:{"ja":"サファイア","en":"Sapphire","zh":"蓝宝石","ko":"사파이어"},
    desc:{"ja":"深藍の宝石、誠実と知恵の青","en":"Deep blue jewel, sincerity and wisdom in blue","zh":"深蓝宝石，诚实与智慧的蓝","ko":"깊은 파란 보석, 성실과 지혜의 파랑"},
    ui:{"--ui-bg":"linear-gradient(180deg,#030a1a,#01050d)","--ui-panel":"rgba(10,42,74,0.96)","--ui-soft":"rgba(230,242,255,0.05)","--ui-text":"#e6f2ff","--ui-muted":"#b0cad5","--ui-border":"rgba(77,166,255,.30)","--ui-button":"#1a3a5a","--ui-button-hover":"#35526f","--ui-field":"#0a2a4a","--ui-accent":"#4da6ff","--ui-on-accent":"#030a1a","--ui-gold":"#cce6ff","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(77,166,255,0.14)"},
    game:{"don":"#ff6b6b","ka":"#4da6ff","stage":"linear-gradient(180deg,#0a2a4a,#030a1a)","lane":"rgba(10,42,74,0.6)","track":"rgba(230,242,255,0.24)","ink":"#e6f2ff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,42,74,0.95)","perfect":"#cce6ff","good":"#e6f2ff","miss":"#808a98","glow":false},
    shapes:["circle","circle"],
    video:"grayscale(.2) hue-rotate(190deg) saturate(1.3) brightness(.8) contrast(1.2)"
  };
  S["scanline"] = {
    cat:["glitch","dark","life"],
    font:"\"Press Start 2P\",\"Courier New\",monospace",
    type:{"title":"\"Press Start 2P\",monospace","weight":"500","lh":"1.25","titleWeight":"700","titleSpace":".02em","titleTransform":"uppercase","mark":"SCAN"},
    label:{"ja":"スキャンライン","en":"Scanline","zh":"扫描线","ko":"스캔라인"},
    desc:{"ja":"CRTモニターの横縞、レトロゲーム筐体","en":"CRT monitor horizontal lines, retro game cabinet","zh":"CRT显示器横线，复古游戏机柜","ko":"CRT 모니터 가로선, 레트로 게임 캐비닛"},
    ui:{"--ui-bg":"#050505","--ui-panel":"rgba(5,5,5,0.96)","--ui-soft":"rgba(0,255,0,0.05)","--ui-text":"#00ff00","--ui-muted":"#9f9f9f","--ui-border":"rgba(0,255,0,.20)","--ui-button":"#1a1a1a","--ui-button-hover":"#173817","--ui-field":"#0d0d0d","--ui-accent":"#00ff00","--ui-on-accent":"#000000","--ui-gold":"#ffffff","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,255,0,0.14)"},
    game:{"don":"#cccccc","ka":"#666666","stage":"#0d0d0d","lane":"rgba(5,5,5,0.6)","track":"rgba(0,255,0,0.24)","ink":"#00ff00","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(5,5,5,0.95)","perfect":"#ffffff","good":"#00ff00","miss":"#028f02","glow":false},
    shapes:["square","square"],
    video:"grayscale(.2) saturate(1.5) contrast(1.2) brightness(.8)"
  };
  S["silver"] = {
    cat:["light","access","basic"],
    font:"\"Inter\",system-ui,sans-serif",
    type:{"title":"\"Inter\",sans-serif","weight":"400","lh":"1.55","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"白銀","en":"Silver","zh":"白银","ko":"은"},
    desc:{"ja":"清涼で清純な銀の輝き、月のような静寂","en":"Cool and pure silver shine, moon-like silence","zh":"清凉纯净的银光，月光般的静谧","ko":"시원하고 순수한 은빛, 달빛 같은 정적"},
    ui:{"--ui-bg":"#f4f6f7","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(44,62,80,0.05)","--ui-text":"#2c3e50","--ui-muted":"#4b5353","--ui-border":"rgba(44,62,80,.12)","--ui-button":"#d5dbdb","--ui-button-hover":"#bfc7c9","--ui-field":"#ffffff","--ui-accent":"#bdc3c7","--ui-on-accent":"#2c3e50","--ui-gold":"#ecf0f1","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(189,195,199,0.14)"},
    game:{"don":"#bdc3c7","ka":"#7f8c8d","stage":"#e8eaed","lane":"rgba(255,255,255,0.82)","track":"rgba(44,62,80,0.24)","ink":"#2c3e50","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ecf0f1","good":"#2c3e50","miss":"#86919b","glow":false},
    shapes:["square","square"],
    video:"grayscale(.2) contrast(1.05) brightness(1.02)"
  };
  S["slot-machine"] = {
    cat:["fun","grad","dark"],
    font:"\"Impact\",\"Haettenschweiler\",sans-serif",
    type:{"title":"\"Impact\",sans-serif","weight":"900","lh":"1.1","titleWeight":"900","titleSpace":"-.05em","titleTransform":"uppercase","mark":"BAR BAR BAR"},
    label:{"ja":"スロットマシーン","en":"Slot Machine","zh":"老虎机","ko":"슬롯 머신"},
    desc:{"ja":"レトロスロットマシーン、回転リールとレバーの音","en":"Retro slot machine, spinning reels and lever sound","zh":"复古老虎机，旋转滚筒和拉杆声","ko":"레트로 슬롯 머신, 회전 릴과 레버 소리"},
    ui:{"--ui-bg":"linear-gradient(180deg,#0a0a1a,#000000)","--ui-panel":"rgba(42,26,58,0.96)","--ui-soft":"rgba(255,224,102,0.05)","--ui-text":"#ffe066","--ui-muted":"#ada2c4","--ui-border":"rgba(255,0,85,.30)","--ui-button":"#2a1a3a","--ui-button-hover":"#463440","--ui-field":"#1a102a","--ui-accent":"#ff0055","--ui-on-accent":"#000000","--ui-gold":"#ffe066","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,0,85,0.14)"},
    game:{"don":"#ff0055","ka":"#00ffcc","stage":"linear-gradient(180deg,#2a1a3a,#0a0a1a)","lane":"rgba(42,26,58,0.6)","track":"rgba(255,224,102,0.24)","ink":"#ffe066","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(42,26,58,0.95)","perfect":"#ffe066","good":"#ffe066","miss":"#918044","glow":false},
    shapes:["square","square"],
    video:"hue-rotate(280deg) saturate(1.5) brightness(.85) contrast(1.2)"
  };
  S["snowyShrine"] = {
    cat:["dark","light","grad"],
    label:{"ja":"雪の神社","en":"Snowy Shrine","zh":"雪之神社","ko":"눈 신사"},
    desc:{"ja":"白い雪に包まれた神社と、朱色の鳥居","en":"A shrine wrapped in white snow, with a vermilion torii gate","zh":"白雪包裹的神社与朱红鸟居","ko":"흰 눈에 싸인 신사와 주홍색 도리이"},
    ui:{"--ui-bg":"linear-gradient(180deg,#080d1a,#04060d)","--ui-panel":"rgba(15,26,46,0.96)","--ui-soft":"rgba(243,244,246,0.05)","--ui-text":"#f3f4f6","--ui-muted":"#a8b8c8","--ui-border":"rgba(255,255,255,.20)","--ui-button":"#1c2a46","--ui-button-hover":"#38445d","--ui-field":"#0f1a2e","--ui-accent":"#c73e3a","--ui-on-accent":"#ffffff","--ui-gold":"#f0c987","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(199,62,58,0.14)"},
    game:{"don":"#c73e3a","ka":"#2c5f7c","stage":"linear-gradient(180deg,#0f1a2e,#080d1a)","lane":"rgba(15,26,46,0.6)","track":"rgba(243,244,246,0.24)","ink":"#f3f4f6","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(15,26,46,0.95)","perfect":"#f0c987","good":"#f3f4f6","miss":"#898c93","glow":false},
    shapes:["circle","diamond"],
    video:"grayscale(.5) contrast(1.15) brightness(.75)"
  };
  S["soda-pop"] = {
    cat:["fun","grad","light"],
    font:"\"Caveat\",\"Komodo Axis\",cursive",
    type:{"title":"\"Caveat\",cursive","weight":"400","lh":"1.4","titleWeight":"600","titleSpace":".02em","mark":"あア漢 Aa 12"},
    label:{"ja":"ソーダポップ","en":"Soda Pop","zh":"苏打汽水","ko":"소다 팝"},
    desc:{"ja":"炭酸の泡、ポップで楽しい色合い","en":"Carbonation bubbles, pop and fun colors","zh":"碳酸气泡，流行有趣的色调","ko":"탄산 기포, 팝적이고 재미있는 색감"},
    ui:{"--ui-bg":"#ffede1","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(45,52,54,0.05)","--ui-text":"#2d3436","--ui-muted":"#3b4244","--ui-border":"rgba(254,202,87,.24)","--ui-button":"#ff9ff3","--ui-button-hover":"#e491da","--ui-field":"#ffffff","--ui-accent":"#feca57","--ui-on-accent":"#000000","--ui-gold":"#ffeaa7","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(254,202,87,0.14)"},
    game:{"don":"#feca57","ka":"#54a0ff","stage":"#ff9ff3","lane":"rgba(255,255,255,0.82)","track":"rgba(45,52,54,0.24)","ink":"#2d3436","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffeaa7","good":"#2d3436","miss":"#8c8783","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.3) brightness(1.05) contrast(1.05)"
  };
  S["solar-flare"] = {
    cat:["fun","grad"],
    font:"\"Futura\",\"Avant Garde\",sans-serif",
    type:{"title":"\"Futura\",sans-serif","weight":"700","lh":"1.2","titleWeight":"900","titleSpace":"-.05em","titleTransform":"uppercase","mark":"FLARE"},
    label:{"ja":"太陽フレア","en":"Solar Flare","zh":"太阳耀斑","ko":"태양 플레어"},
    desc:{"ja":"太陽表面の爆発、激しい光と熱の放出","en":"Solar surface explosion, intense light and heat release","zh":"太阳表面爆发，强烈的光与热释放","ko":"태양 표면 폭발, 강한 빛과 열 방출"},
    ui:{"--ui-bg":"linear-gradient(180deg,#4a0a00,#1a0a00)","--ui-panel":"rgba(74,10,0,0.96)","--ui-soft":"rgba(255,255,255,0.05)","--ui-text":"#ffffff","--ui-muted":"#ff8c00","--ui-border":"rgba(255,69,0,.32)","--ui-button":"#4a0a00","--ui-button-hover":"#622a21","--ui-field":"#2a0500","--ui-accent":"#ff4500","--ui-on-accent":"#000000","--ui-gold":"#ffff00","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,69,0,0.14)"},
    game:{"don":"#ff4500","ka":"#ffd700","stage":"linear-gradient(180deg,#ff6b00,#ffa500,#ffff00)","lane":"rgba(74,10,0,0.6)","track":"rgba(255,255,255,0.24)","ink":"#000000","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(74,10,0,0.95)","perfect":"#ffff00","good":"#000000","miss":"#ae918c","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.2) saturate(1.4) hue-rotate(-10deg) brightness(1.05) contrast(1.15)"
  };
  S["source-sans-pro"] = {
    cat:["type","basic"],
    font:"\"Source Sans Pro\",system-ui,sans-serif",
    type:{"title":"\"Source Sans Pro\",sans-serif","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"ソースサンスプロ","en":"Source Sans Pro","zh":"源泉无衬线","ko":"소스 산스 프로"},
    desc:{"ja":"Adobe 製のオープンソースゴシック、UI に最適","en":"Adobe open source sans, ideal for UI","zh":"Adobe 开源无衬线体，适合 UI","ko":"Adobe 오픈 소스 고딕, UI 에 적합"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(44,62,80,0.05)","--ui-text":"#2c3e50","--ui-muted":"#4c5455","--ui-border":"rgba(44,62,80,.12)","--ui-button":"#dfe6e9","--ui-button-hover":"#c8d0d5","--ui-field":"#ffffff","--ui-accent":"#3498db","--ui-on-accent":"#000000","--ui-gold":"#f1c40f","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(52,152,219,0.14)"},
    game:{"don":"#e74c3c","ka":"#3498db","stage":"#f4f6f8","lane":"rgba(255,255,255,0.82)","track":"rgba(44,62,80,0.24)","ink":"#2c3e50","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#f1c40f","good":"#2c3e50","miss":"#8b959f","glow":false},
    shapes:["square","square"],
    video:"contrast(1.02) brightness(1.01)"
  };
  S["starmetal"] = {
    cat:["dark","grad"],
    font:"\"Orbitron\",\"Rajdhani\",system-ui,sans-serif",
    type:{"title":"\"Orbitron\",sans-serif","weight":"400","lh":"1.4","titleWeight":"700","titleSpace":".02em","mark":"あア漢 Aa 12"},
    label:{"ja":"スターメタル","en":"Starmetal","zh":"星铁","ko":"스타메탈"},
    desc:{"ja":"星から降り注ぐ金属、深宇宙のコバルトブルー","en":"Metal raining from stars, deep space cobalt blue","zh":"从星星降落的金属，深空钴蓝","ko":"별에서 내리는 금속, 심우주의 코발트 블루"},
    ui:{"--ui-bg":"linear-gradient(180deg,#071a33,#050c17)","--ui-panel":"rgba(10,25,47,0.96)","--ui-soft":"rgba(204,214,246,0.05)","--ui-text":"#ccd6f6","--ui-muted":"#9ea5b6","--ui-border":"rgba(100,255,218,.28)","--ui-button":"#16213e","--ui-button-hover":"#2e3956","--ui-field":"#0a192f","--ui-accent":"#64ffda","--ui-on-accent":"#050c17","--ui-gold":"#ccd6f6","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(100,255,218,0.14)"},
    game:{"don":"#64ffda","ka":"#8892b0","stage":"linear-gradient(180deg,#0a192f,#071a33)","lane":"rgba(10,25,47,0.6)","track":"rgba(204,214,246,0.24)","ink":"#ccd6f6","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,25,47,0.95)","perfect":"#ccd6f6","good":"#ccd6f6","miss":"#73819e","glow":false},
    shapes:["circle","circle"],
    video:"hue-rotate(200deg) saturate(1.2) brightness(.85) contrast(1.15)"
  };
  S["strawberry-cake"] = {
    cat:["light","fun","grad"],
    label:{"ja":"ストロベリーケーキ","en":"Strawberry Cake","zh":"草莓蛋糕","ko":"딸기 케이크"},
    desc:{"ja":"苺のショートケーキ、甘くて華やかなピンク","en":"Strawberry shortcake, sweet and gorgeous pink","zh":"草莓蛋糕，甜美华丽的粉色","ko":"딸기 쇼트케이크, 달콤하고 화려한 핑크"},
    ui:{"--ui-bg":"linear-gradient(180deg,#f8bbd0,#f48fb1)","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(136,14,79,0.05)","--ui-text":"#880e4f","--ui-muted":"#8a1046","--ui-border":"rgba(236,64,122,.24)","--ui-button":"#f8bbd0","--ui-button-hover":"#e9a5bf","--ui-field":"#ffffff","--ui-accent":"#ec407a","--ui-on-accent":"#000000","--ui-gold":"#ffcdd2","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(236,64,122,0.14)"},
    game:{"don":"#ec407a","ka":"#f48fb1","stage":"linear-gradient(180deg,#fce4ec,#f8bbd0)","lane":"rgba(255,255,255,0.82)","track":"rgba(136,14,79,0.24)","ink":"#880e4f","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffcdd2","good":"#880e4f","miss":"#ba5c89","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.1) saturate(1.15) brightness(1.03)"
  };
  S["summerNight"] = {
    cat:["fun","grad"],
    label:{"ja":"夏の夜風","en":"Summer Night Breeze","zh":"夏夜之风","ko":"여름 밤바람"},
    desc:{"ja":"打ち上げ花火と、ネオンのきらめく夜","en":"Fireworks and neon glittering at night","zh":"烟花与闪烁的霓虹之夜","ko":"불꽃놀이와 반짝이는 네온 밤"},
    ui:{"--ui-bg":"linear-gradient(180deg,#000000,#050810)","--ui-panel":"rgba(8,14,24,0.96)","--ui-soft":"rgba(255,255,255,0.05)","--ui-text":"#ffffff","--ui-muted":"#8fa8bb","--ui-border":"rgba(61,240,255,.28)","--ui-button":"#0b1826","--ui-button-hover":"#2b3642","--ui-field":"#060e18","--ui-accent":"#3df0ff","--ui-on-accent":"#032027","--ui-gold":"#ff3df0","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(61,240,255,0.14)"},
    game:{"don":"#ff3df0","ka":"#3df0ff","stage":"linear-gradient(180deg,#050810,#000000)","lane":"rgba(8,14,24,0.6)","track":"rgba(255,255,255,0.24)","ink":"#ffffff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(8,14,24,0.95)","perfect":"#ff3df0","good":"#ffffff","miss":"#8c8c8c","glow":false},
    shapes:["circle","square"],
    video:"grayscale(.2) hue-rotate(180deg) saturate(1.6) brightness(.65) contrast(1.3)"
  };
  S["supernova"] = {
    cat:["fun","grad"],
    font:"\"Impact\",\"Haettenschweiler\",sans-serif",
    type:{"title":"\"Impact\",sans-serif","weight":"900","lh":"1.1","titleWeight":"900","titleSpace":"-.05em","titleTransform":"uppercase","mark":"BOOM"},
    label:{"ja":"超新星","en":"Supernova","zh":"超新星","ko":"초신성"},
    desc:{"ja":"星の大爆発、壮絶な光と熱の放出","en":"Stellar great explosion, magnificent light and heat release","zh":"恒星大爆发，壮烈的光与热释放","ko":"별의 대폭발, 장엄한 빛과 열 방출"},
    ui:{"--ui-bg":"linear-gradient(180deg,#1a0a0a,#4a0a0a)","--ui-panel":"rgba(26,10,10,0.96)","--ui-soft":"rgba(255,255,255,0.05)","--ui-text":"#ffffff","--ui-muted":"#ff9670","--ui-border":"rgba(255,75,31,.32)","--ui-button":"#4a1a1a","--ui-button-hover":"#623838","--ui-field":"#2a0f0f","--ui-accent":"#ff4b1f","--ui-on-accent":"#000000","--ui-gold":"#ffd700","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,75,31,0.14)"},
    game:{"don":"#ff4b1f","ka":"#4ecdc4","stage":"linear-gradient(180deg,#ff4b1f,#ff9068,#ffffff)","lane":"rgba(26,10,10,0.6)","track":"rgba(255,255,255,0.24)","ink":"#000000","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,10,10,0.95)","perfect":"#ffd700","good":"#000000","miss":"#989191","glow":false},
    shapes:["circle","diamond"],
    video:"saturate(1.5) brightness(1.05) contrast(1.2)"
  };
  S["synthwave"] = {
    cat:["glitch","fun","grad"],
    font:"\"Orbitron\",\"Futura\",sans-serif",
    type:{"title":"\"Orbitron\",sans-serif","weight":"700","lh":"1.15","titleWeight":"800","titleSpace":"-.04em","titleTransform":"uppercase","mark":"80s"},
    label:{"ja":"シンセウェイブ","en":"Synthwave","zh":"合成波","ko":"신스웨이브"},
    desc:{"ja":"80年代レトログリッド、夕焼けと太陽","en":"80s retro grid, sunset and sun","zh":"80年代复古网格，日落和太阳","ko":"80년대 레트로 그리드, 일몰과 태양"},
    ui:{"--ui-bg":"#0f051a","--ui-panel":"rgba(15,5,26,0.96)","--ui-soft":"rgba(255,0,255,0.05)","--ui-text":"#ff00ff","--ui-muted":"#9b8aad","--ui-border":"rgba(255,0,255,.35)","--ui-button":"#2a1a3e","--ui-button-hover":"#3f1751","--ui-field":"#1a0a2e","--ui-accent":"#ff00ff","--ui-on-accent":"#000000","--ui-gold":"#ffd700","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,0,255,0.14)"},
    game:{"don":"#ffd700","ka":"#4ecdc4","stage":"#1a0a2e","lane":"rgba(15,5,26,0.6)","track":"rgba(255,0,255,0.24)","ink":"#ff00ff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(15,5,26,0.95)","perfect":"#ffd700","good":"#ff00ff","miss":"#a328a7","glow":false},
    shapes:["square","square"],
    video:"hue-rotate(260deg) saturate(1.5) brightness(.8) contrast(1.25)"
  };
  S["taiyaki"] = {
    cat:["life","fun"],
    label:{"ja":"たい焼き","en":"Taiyaki","zh":"鱼形烤饼","ko":"타이야키"},
    desc:{"ja":"和菓子のたい焼き、焦げ茶色の温かさ","en":"Japanese taiyaki, warm burnt brown","zh":"日式太阳烧，温暖焦茶色","ko":"일본 붕어빵, 따뜻한 구운 갈색"},
    ui:{"--ui-bg":"#d84315","--ui-panel":"rgba(185,58,18,0.96)","--ui-soft":"rgba(255,255,255,0.05)","--ui-text":"#ffffff","--ui-muted":"#ffffff","--ui-border":"rgba(230,81,0,.22)","--ui-button":"#cf4317","--ui-button-hover":"#d0471c","--ui-field":"#bf360c","--ui-accent":"#ffab91","--ui-on-accent":"#3e2723","--ui-gold":"#ffccbc","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,171,145,0.14)"},
    game:{"don":"#ffab91","ka":"#d7ccc8","stage":"#bf360c","lane":"rgba(185,58,18,0.6)","track":"rgba(255,255,255,0.24)","ink":"#ffebee","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(185,58,18,0.95)","perfect":"#ffccbc","good":"#ffebee","miss":"#241a17","glow":false},
    shapes:["circle","square"],
    video:"sepia(.4) contrast(1.1) brightness(.9)"
  };
  S["tart"] = {
    cat:["fun","grad"],
    label:{"ja":"タルト","en":"Tart","zh":"塔","ko":"타르트"},
    desc:{"ja":"フルーツタルト、色とりどりのフルーツ","en":"Fruit tart, colorful fruits","zh":"水果塔，色彩缤纷水果","ko":"과일 타르트, 색색깔 과일"},
    ui:{"--ui-bg":"#ffab91","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(191,54,12,0.05)","--ui-text":"#bf360c","--ui-muted":"#be2a2a","--ui-border":"rgba(191,54,12,.22)","--ui-button":"#ffe2df","--ui-button-hover":"#ffe2df","--ui-field":"#ffffff","--ui-accent":"#ff5252","--ui-on-accent":"#000000","--ui-gold":"#ffd54f","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(255,82,82,0.14)"},
    game:{"don":"#ff5252","ka":"#aed581","stage":"#ffe2df","lane":"rgba(255,255,255,0.82)","track":"rgba(191,54,12,0.24)","ink":"#bf360c","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffd54f","good":"#bf360c","miss":"#dc6b48","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.25) brightness(1.03)"
  };
  S["tequila-sunrise"] = {
    cat:["fun","grad"],
    font:"\"Futura\",\"Avant Garde\",sans-serif",
    type:{"title":"\"Futura\",sans-serif","weight":"700","lh":"1.2","titleWeight":"900","titleSpace":"-.04em","titleTransform":"uppercase","mark":"TEQUILA"},
    label:{"ja":"テキーラサンライズ","en":"Tequila Sunrise","zh":"龙舌兰日出","ko":"테킬라 선라이즈"},
    desc:{"ja":"夕焼けグラデーション、オレンジと赤","en":"Sunset gradient, orange and red","zh":"日落渐变，橙色和红色","ko":"노을 그라데이션, 오렌지와 빨강"},
    ui:{"--ui-bg":"linear-gradient(180deg,#45b7d1,#4ecdc4)","--ui-panel":"rgba(69,183,209,0.96)","--ui-soft":"rgba(255,255,255,0.05)","--ui-text":"#ffffff","--ui-muted":"#ff9ff3","--ui-border":"rgba(254,202,87,.30)","--ui-button":"#4ecdc4","--ui-button-hover":"#65d4cc","--ui-field":"#ff6b6b","--ui-accent":"#feca57","--ui-on-accent":"#ffffff","--ui-gold":"#ffeaa7","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(254,202,87,0.14)"},
    game:{"don":"#ff9ff3","ka":"#feca57","stage":"linear-gradient(180deg,#ff6b6b,#4ecdc4,#45b7d1)","lane":"rgba(69,183,209,0.82)","track":"rgba(255,255,255,0.24)","ink":"#ffffff","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(69,183,209,0.95)","perfect":"#ffeaa7","good":"#ffffff","miss":"#abdfea","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.3) brightness(1.02) contrast(1.1)",
    holdback:true
  };
  S["titanium"] = {
    cat:["dark","access","basic"],
    font:"\"Montserrat\",system-ui,sans-serif",
    type:{"title":"\"Montserrat\",sans-serif","weight":"500","lh":"1.45","titleWeight":"700","titleSpace":"-.02em","titleTransform":"uppercase","mark":"あア漢 Aa 12"},
    label:{"ja":"チタン","en":"Titanium","zh":"钛","ko":"티타늄"},
    desc:{"ja":"現代的で強靭なチタン、機械的な無機質感","en":"Modern and strong titanium, mechanical inorganic texture","zh":"现代而强韧的钛，机械性的无机质感","ko":"현대적이고 강인한 티타늄, 기계적인 무미건조한 질감"},
    ui:{"--ui-bg":"#34495e","--ui-panel":"rgba(52,73,94,0.96)","--ui-soft":"rgba(236,240,241,0.05)","--ui-text":"#ecf0f1","--ui-muted":"#eceeee","--ui-border":"rgba(52,152,219,.24)","--ui-button":"#2c3e50","--ui-button-hover":"#455565","--ui-field":"#5d6d7e","--ui-accent":"#3498db","--ui-on-accent":"#000000","--ui-gold":"#bdc3c7","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(52,152,219,0.14)"},
    game:{"don":"#95a5a6","ka":"#3498db","stage":"#5d6d7e","lane":"rgba(52,73,94,0.6)","track":"rgba(236,240,241,0.24)","ink":"#ecf0f1","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(52,73,94,0.95)","perfect":"#bdc3c7","good":"#ecf0f1","miss":"#1f2123","glow":false},
    shapes:["square","square"],
    video:"grayscale(.4) contrast(1.15) brightness(.9)"
  };
  S["tokyo-night"] = {
    cat:["fun","grad","dark"],
    font:"\"Orbitron\",\"Futura\",system-ui,sans-serif",
    type:{"title":"\"Orbitron\",sans-serif","weight":"700","lh":"1.2","titleWeight":"900","titleSpace":"-.05em","titleTransform":"uppercase","mark":"TOKYO"},
    label:{"ja":"東京ナイト","en":"Tokyo Night","zh":"东京之夜","ko":"도쿄 밤"},
    desc:{"ja":"ネオンと雨の路地、都会の夜","en":"Neon and rainy alley, city night","zh":"霓虹和雨巷，都市之夜","ko":"네온과 비 오는 골목길, 대도시 밤"},
    ui:{"--ui-bg":"#000000","--ui-panel":"rgba(10,10,26,0.96)","--ui-soft":"rgba(0,255,255,0.05)","--ui-text":"#00ffff","--ui-muted":"#a0a0b0","--ui-border":"rgba(0,255,255,.30)","--ui-button":"#1a1a2a","--ui-button-hover":"#173846","--ui-field":"#0a0a1a","--ui-accent":"#00ffff","--ui-on-accent":"#000000","--ui-gold":"#ffff00","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,255,255,0.14)"},
    game:{"don":"#ff00ff","ka":"#ff0040","stage":"#0a0a1a","lane":"rgba(10,10,26,0.6)","track":"rgba(0,255,255,0.24)","ink":"#00ffff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(10,10,26,0.95)","perfect":"#ffff00","good":"#00ffff","miss":"#008c8c","glow":false},
    shapes:["square","square"],
    video:"hue-rotate(180deg) saturate(1.6) brightness(.75) contrast(1.3)"
  };
  S["topaz"] = {
    cat:["grad","light","fun"],
    label:{"ja":"トパーズ","en":"Topaz","zh":"黄玉","ko":"토파즈"},
    desc:{"ja":"黄金色の宝石、友情と誠実の黄","en":"Golden yellow jewel, friendship and sincerity in yellow","zh":"金黄色宝石，友情与真诚的黄","ko":"금빛 보석, 우정과 성실의 노랑"},
    ui:{"--ui-bg":"linear-gradient(180deg,#b8860b,#6b4a0b)","--ui-panel":"rgba(255,193,7,0.96)","--ui-soft":"rgba(62,39,35,0.05)","--ui-text":"#3e2723","--ui-muted":"#634d45","--ui-border":"rgba(255,107,87,.30)","--ui-button":"#ffe082","--ui-button-hover":"#e6c876","--ui-field":"#fff9c4","--ui-accent":"#ff6b6b","--ui-on-accent":"#3e2723","--ui-gold":"#fff176","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,107,107,0.14)"},
    game:{"don":"#ff6b6b","ka":"#4ecdc4","stage":"linear-gradient(180deg,#ffc107,#bc8c17)","lane":"rgba(255,193,7,0.6)","track":"rgba(62,39,35,0.24)","ink":"#3e2723","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(255,193,7,0.95)","perfect":"#fff176","good":"#3e2723","miss":"#755218","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.2) saturate(1.15) brightness(1.05)"
  };
  S["tree-house"] = {
    cat:["life","grad"],
    font:"\"Comic Sans MS\",\"Cursive\",fantasy",
    type:{"title":"\"Comic Sans MS\",cursive","weight":"400","lh":"1.6","titleWeight":"600","titleSpace":".04em","mark":"あア漢 Aa 12"},
    label:{"ja":"ツリーハウス","en":"Tree House","zh":"树屋","ko":"트리 하우스"},
    desc:{"ja":"木の上の家、緑と木の温もり","en":"House on trees, green and wood warmth","zh":"树上的房子，绿色与木头的温暖","ko":"나무 위의 집, 초록과 나무의 온기"},
    ui:{"--ui-bg":"#c8e6c9","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(27,94,32,0.05)","--ui-text":"#1b5e20","--ui-muted":"#2e5430","--ui-border":"rgba(46,125,50,.22)","--ui-button":"#a5d6a7","--ui-button-hover":"#9fd1a2","--ui-field":"#ffffff","--ui-accent":"#81c784","--ui-on-accent":"#000000","--ui-gold":"#d4e157","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(129,199,132,0.14)"},
    game:{"don":"#ffab91","ka":"#81c784","stage":"#9dd39f","lane":"rgba(255,255,255,0.82)","track":"rgba(27,94,32,0.24)","ink":"#1b5e20","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#d4e157","good":"#1b5e20","miss":"#699b6c","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.15) brightness(1.05)"
  };
  S["turquoise"] = {
    cat:["light","grad"],
    label:{"ja":"ターコイズ","en":"Turquoise","zh":"青金石","ko":"터콰이즈"},
    desc:{"ja":"空色の宝石、癒やしと保護の青緑","en":"Sky blue jewel, healing and protection in teal","zh":"天蓝色宝石，治愈与保护的青绿","ko":"하늘색 보석, 치유와 보호의 청록"},
    ui:{"--ui-bg":"#81ecec","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(45,52,54,0.05)","--ui-text":"#2d3436","--ui-muted":"#314d4d","--ui-border":"rgba(0,206,201,.24)","--ui-button":"#55efc4","--ui-button-hover":"#50d7b2","--ui-field":"#ffffff","--ui-accent":"#00b894","--ui-on-accent":"#000000","--ui-gold":"#ffeaa7","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(0,184,148,0.14)"},
    game:{"don":"#e17055","ka":"#0984e3","stage":"#00cec9","lane":"rgba(255,255,255,0.82)","track":"rgba(45,52,54,0.24)","ink":"#2d3436","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffeaa7","good":"#2d3436","miss":"#538788","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.15) brightness(1.05) contrast(1.02)"
  };
  S["ubuntu"] = {
    cat:["type","fun","light"],
    font:"\"Ubuntu\",system-ui,sans-serif",
    type:{"title":"\"Ubuntu\",sans-serif","weight":"400","lh":"1.5","titleWeight":"700","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"ウブントゥ","en":"Ubuntu","zh":"乌班图","ko":"우분투"},
    desc:{"ja":"Linux ディストリビューションの定番、丸みのある書体","en":"Linux distribution standard, rounded typeface","zh":"Linux 发行版标准，圆润字体","ko":"리눅스 배포판 표준, 둥근 서체"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(26,35,126,0.05)","--ui-text":"#1a237e","--ui-muted":"#404b86","--ui-border":"rgba(26,35,126,.12)","--ui-button":"#bbdefb","--ui-button-hover":"#a6c6eb","--ui-field":"#ffffff","--ui-accent":"#dd2c00","--ui-on-accent":"#ffffff","--ui-gold":"#ffd54f","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(221,44,0,0.14)"},
    game:{"don":"#dd2c00","ka":"#0288d1","stage":"#e3f2fd","lane":"rgba(255,255,255,0.82)","track":"rgba(26,35,126,0.24)","ink":"#1a237e","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#ffd54f","good":"#1a237e","miss":"#8186b8","glow":false},
    shapes:["circle","circle"],
    video:"brightness(1.03) saturate(1.05)"
  };
  S["univers"] = {
    cat:["type","basic"],
    font:"system-ui,-apple-system,sans-serif",
    type:{"title":"system-ui,-apple-system,sans-serif","weight":"400","lh":"1.5","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"ユニバース","en":"Univers","zh":"宇宙体","ko":"유니버스"},
    desc:{"ja":"新グロテスク、調和のとれたモダンな書体","en":"Neo-grotesque sans, harmonious and modern","zh":"新怪诞体，和谐而现代","ko":"신그로테스크, 조화롭고 현대적인 서체"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(45,55,72,0.05)","--ui-text":"#2d3748","--ui-muted":"#4f5a69","--ui-border":"rgba(45,55,72,.12)","--ui-button":"#e2e8f0","--ui-button-hover":"#cad1da","--ui-field":"#ffffff","--ui-accent":"#3182ce","--ui-on-accent":"#000000","--ui-gold":"#f6e05e","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(49,130,206,0.14)"},
    game:{"don":"#e53e3e","ka":"#3182ce","stage":"#edf2f7","lane":"rgba(255,255,255,0.82)","track":"rgba(45,55,72,0.24)","ink":"#2d3748","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#f6e05e","good":"#2d3748","miss":"#8c919a","glow":false},
    shapes:["square","square"],
    video:"contrast(1.02) brightness(1.01)"
  };
  S["vaporwave"] = {
    cat:["glitch","fun","light"],
    font:"\"Trajan Pro\",\"Papyrus\",fantasy",
    type:{"title":"\"Trajan Pro\",fantasy","weight":"400","lh":"1.5","titleWeight":"800","titleSpace":".12em","titleTransform":"uppercase","mark":"あア漢 Aa"},
    label:{"ja":"ヴェイパーウェイブ","en":"Vaporwave","zh":"蒸汽波","ko":"베이퍼웨이브"},
    desc:{"ja":"90年代レトロ未来主義、ピンク×パープル×水色","en":"90s retro futurism, pink×purple×cyan","zh":"90年代复古未来主义，粉色×紫色×青色","ko":"90년대 레트로 미래주의, 핑크×퍼플×시안"},
    ui:{"--ui-bg":"#e0b0ff","--ui-panel":"rgba(224,176,255,0.96)","--ui-soft":"rgba(42,26,74,0.05)","--ui-text":"#2a1a4a","--ui-muted":"#3a263e","--ui-border":"rgba(255,105,180,.35)","--ui-button":"#d090ff","--ui-button-hover":"#ba81e7","--ui-field":"#f0d0ff","--ui-accent":"#ff69b4","--ui-on-accent":"#000000","--ui-gold":"#ffe0ff","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(255,105,180,0.14)"},
    game:{"don":"#ff69b4","ka":"#87ceeb","stage":"#f0a0e0","lane":"rgba(224,176,255,0.82)","track":"rgba(42,26,74,0.24)","ink":"#2a1a4a","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(224,176,255,0.95)","perfect":"#ffe0ff","good":"#2a1a4a","miss":"#7c5e9b","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.2) saturate(1.3) brightness(1.05)"
  };
  S["velvet-ropes"] = {
    cat:["fun","grad"],
    font:"\"Papyrus\",\"Papyrus Custom\",fantasy",
    type:{"title":"\"Papyrus\",fantasy","weight":"400","lh":"1.55","titleWeight":"600","titleSpace":".05em","mark":"あア漢 Aa 12"},
    label:{"ja":"ベルベットロープ","en":"Velvet Ropes","zh":"天鹅绒绳索","ko":"벨벳 로프"},
    desc:{"ja":"入場制限のベルベットロープ、排他的な夜","en":"Velvet ropes with entry restriction, exclusive night","zh":"带入场限制的天鹅绒绳索，排他性之夜","ko":"입장 제한 벨벳 로프, 배타적인 밤"},
    ui:{"--ui-bg":"#2a072e","--ui-panel":"rgba(74,14,78,0.96)","--ui-soft":"rgba(255,224,178,0.05)","--ui-text":"#ffe0b2","--ui-muted":"#b3a9c8","--ui-border":"rgba(212,175,55,.28)","--ui-button":"#4a0e4e","--ui-button-hover":"#62295b","--ui-field":"#3a0d3e","--ui-accent":"#d4af37","--ui-on-accent":"#2a072e","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#bb86fc","stage":"#4a0e4e","lane":"rgba(74,14,78,0.6)","track":"rgba(255,224,178,0.24)","ink":"#ffe0b2","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(74,14,78,0.95)","perfect":"#ffe082","good":"#ffe0b2","miss":"#9f7e77","glow":false},
    shapes:["circle","diamond"],
    video:"hue-rotate(280deg) saturate(1.25) brightness(.85) contrast(1.15)"
  };
  S["venice-canal"] = {
    cat:["light","grad"],
    font:"\"Garamond\",\"Baskerville\",serif",
    type:{"title":"\"Garamond\",serif","weight":"400","lh":"1.65","titleWeight":"600","titleSpace":".04em","mark":"あア漢 Aa 12"},
    label:{"ja":"ヴェネチア運河","en":"Venice Canal","zh":"威尼斯运河","ko":"베네치아 운하"},
    desc:{"ja":"水路とゴンドラ、水の都の情景","en":"Waterways and gondola, city of water scenery","zh":"水道和贡多拉，水都情景","ko":"수로와 곤돌라, 물의 도시 풍경"},
    ui:{"--ui-bg":"#1a3a5a","--ui-panel":"rgba(26,58,90,0.96)","--ui-soft":"rgba(253,245,230,0.05)","--ui-text":"#fdf5e6","--ui-muted":"#eff3f6","--ui-border":"rgba(78,205,196,.28)","--ui-button":"#3a5d79","--ui-button-hover":"#537187","--ui-field":"#2a4d69","--ui-accent":"#4ecdc4","--ui-on-accent":"#1a3a5a","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(78,205,196,0.14)"},
    game:{"don":"#d4af37","ka":"#4ecdc4","stage":"#2a4d69","lane":"rgba(26,58,90,0.6)","track":"rgba(253,245,230,0.24)","ink":"#fdf5e6","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(26,58,90,0.95)","perfect":"#ffe082","good":"#fdf5e6","miss":"#97a1a7","glow":false},
    shapes:["circle","circle"],
    video:"saturate(1.1) brightness(1.02)"
  };
  S["venus-clouds"] = {
    cat:["grad","light"],
    font:"\"Garamond\",\"Baskerville\",serif",
    type:{"title":"\"Garamond\",serif","weight":"400","lh":"1.65","titleWeight":"600","titleSpace":".04em","mark":"あア漢 Aa 12"},
    label:{"ja":"金星雲","en":"Venus Clouds","zh":"金星云","ko":"금성 구름"},
    desc:{"ja":"有毒な黄色い雲、金星の厚い大気","en":"Toxic yellow clouds, thick Venus atmosphere","zh":"有毒的黄色云，金星厚大气层","ko":"독성이 있는 노란 구름, 금성의 두꺼운 대기"},
    ui:{"--ui-bg":"linear-gradient(180deg,#ffff00,#ffa500)","--ui-panel":"rgba(255,255,0,0.96)","--ui-soft":"rgba(74,55,40,0.05)","--ui-text":"#4a3728","--ui-muted":"#5b534b","--ui-border":"rgba(212,175,55,.20)","--ui-button":"#e8dec7","--ui-button-hover":"#d3c8b2","--ui-field":"#fffef5","--ui-accent":"#d4af37","--ui-on-accent":"#4a3728","--ui-gold":"#ffe082","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#8c9eac","stage":"linear-gradient(180deg,#ffd700,#ffa500,#ffff00)","lane":"rgba(255,255,0,0.82)","track":"rgba(74,55,40,0.24)","ink":"#4a3728","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,0,0.95)","perfect":"#ffe082","good":"#4a3728","miss":"#9b9116","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.3) saturate(1.2) brightness(1.02)"
  };
  S["vibranium"] = {
    cat:["dark","grad","fun"],
    font:"\"Futura\",\"Avant Garde\",sans-serif",
    type:{"title":"\"Futura\",sans-serif","weight":"700","lh":"1.3","titleWeight":"900","titleSpace":"-.05em","titleTransform":"uppercase","mark":"あア漢 Aa 12"},
    label:{"ja":"ヴィブラニウム","en":"Vibranium","zh":"振金","ko":"비브라늄"},
    desc:{"ja":"衝撃を吸収する紫金属、ダークで神秘的","en":"Impact-absorbing purple metal, dark and mysterious","zh":"吸收冲击的紫色金属，深色神秘","ko":"충격을 흡수하는 보라색 금속, 다크하고 신비로운"},
    ui:{"--ui-bg":"linear-gradient(180deg,#0d0b1e,#000000)","--ui-panel":"rgba(13,11,30,0.96)","--ui-soft":"rgba(224,231,255,0.05)","--ui-text":"#e0e7ff","--ui-muted":"#b9b9c6","--ui-border":"rgba(187,134,252,.30)","--ui-button":"#3a2a5a","--ui-button-hover":"#50436f","--ui-field":"#2e1a47","--ui-accent":"#bb86fc","--ui-on-accent":"#130b1e","--ui-gold":"#03dac6","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(187,134,252,0.14)"},
    game:{"don":"#bb86fc","ka":"#03dac6","stage":"linear-gradient(180deg,#2e1a47,#0d0b1e)","lane":"rgba(13,11,30,0.6)","track":"rgba(224,231,255,0.24)","ink":"#e0e7ff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(13,11,30,0.95)","perfect":"#03dac6","good":"#e0e7ff","miss":"#81849a","glow":false},
    shapes:["circle","square"],
    video:"hue-rotate(270deg) saturate(1.4) brightness(.8) contrast(1.2)"
  };
  S["vip-lounge"] = {
    cat:["dark","grad"],
    font:"\"Garamond\",\"Baskerville\",serif",
    type:{"title":"\"Garamond\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".04em","mark":"あア漢 Aa 12"},
    label:{"ja":"VIPラウンジ","en":"VIP Lounge","zh":"VIP休息室","ko":"VIP 라운지"},
    desc:{"ja":"排他的なVIP空間、深紫のベルベット","en":"Exclusive VIP space, deep purple velvet","zh":"排他性VIP空间，深紫色天鹅绒","ko":"배타적인 VIP 공간, 진보라색 벨벳"},
    ui:{"--ui-bg":"#1a0f2a","--ui-panel":"rgba(42,26,58,0.96)","--ui-soft":"rgba(224,216,240,0.05)","--ui-text":"#e0d8f0","--ui-muted":"#bfb6d0","--ui-border":"rgba(187,134,252,.28)","--ui-button":"#3a2a5a","--ui-button-hover":"#50416e","--ui-field":"#2a1a3a","--ui-accent":"#bb86fc","--ui-on-accent":"#1a0f2a","--ui-gold":"#d4af37","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(187,134,252,0.14)"},
    game:{"don":"#d4af37","ka":"#bb86fc","stage":"#2a1a3a","lane":"rgba(42,26,58,0.6)","track":"rgba(224,216,240,0.24)","ink":"#e0d8f0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(42,26,58,0.95)","perfect":"#d4af37","good":"#e0d8f0","miss":"#877e97","glow":false},
    shapes:["circle","diamond"],
    video:"hue-rotate(260deg) saturate(1.2) brightness(.9) contrast(1.1)"
  };
  S["voidsteel"] = {
    cat:["dark","access"],
    font:"\"Rajdhani\",\"Oswald\",sans-serif",
    type:{"title":"\"Rajdhani\",sans-serif","weight":"400","lh":"1.4","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"ボイドスチール","en":"Void Steel","zh":"虚空钢","ko":"보이드 스틸"},
    desc:{"ja":"虚空の黒鋼、光を吸い込む究極のダーク","en":"Void black steel, ultimate dark absorbing light","zh":"虚空黑钢，吸收光的究极深色","ko":"공허의 검은 강철, 빛을 흡수하는究极 다크"},
    ui:{"--ui-bg":"#000000","--ui-panel":"rgba(5,5,5,0.96)","--ui-soft":"rgba(224,224,224,0.05)","--ui-text":"#e0e0e0","--ui-muted":"#969696","--ui-border":"#ffffff","--ui-button":"#101010","--ui-button-hover":"#2b2b2b","--ui-field":"#050505","--ui-accent":"#00ff88","--ui-on-accent":"#000000","--ui-gold":"#ff0040","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(0,255,136,0.14)"},
    game:{"don":"#ff0040","ka":"#00ff88","stage":"#050505","lane":"rgba(5,5,5,0.6)","track":"rgba(224,224,224,0.24)","ink":"#e0e0e0","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(5,5,5,0.95)","perfect":"#ff0040","good":"#e0e0e0","miss":"#7b7b7b","glow":false},
    shapes:["square","square"],
    video:"grayscale(1) brightness(.55) contrast(1.5)"
  };
  S["whiskey"] = {
    cat:["light","grad"],
    font:"\"Playfair Display\",\"Noto Serif JP\",serif",
    type:{"title":"\"Playfair Display\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".03em","mark":"あア漢 Aa 12"},
    label:{"ja":"ウイスキー","en":"Whiskey","zh":"威士忌","ko":"위스키"},
    desc:{"ja":"琥珀色、樽の香りと落ち着いた味わい","en":"Amber color, barrel aroma and calm taste","zh":"琥珀色，桶香与平静口感","ko":"호박색, 통향과 차분한 맛"},
    ui:{"--ui-bg":"linear-gradient(180deg,#5c4033,#3e2723)","--ui-panel":"rgba(139,69,19,0.96)","--ui-soft":"rgba(253,245,230,0.05)","--ui-text":"#fdf5e6","--ui-muted":"#faf6f5","--ui-border":"rgba(160,82,45,.24)","--ui-button":"#a0522d","--ui-button-hover":"#a75d3a","--ui-field":"#8b4513","--ui-accent":"#d4af37","--ui-on-accent":"#3e2723","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#b8860b","stage":"linear-gradient(180deg,#8b4513,#5c4033)","lane":"rgba(139,69,19,0.6)","track":"rgba(253,245,230,0.24)","ink":"#fdf5e6","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(139,69,19,0.95)","perfect":"#ffe082","good":"#fdf5e6","miss":"#b9a99a","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.3) contrast(1.1) brightness(.95)"
  };
  S["windmill"] = {
    cat:["light","life"],
    font:"\"Garamond\",\"Noto Serif JP\",serif",
    type:{"title":"\"Garamond\",serif","weight":"400","lh":"1.7","titleWeight":"600","titleSpace":".04em","mark":"あア漢 Aa 12"},
    label:{"ja":"風車","en":"Windmill","zh":"风车","ko":"풍차"},
    desc:{"ja":"オランダ風車、牧草地と青空","en":"Dutch windmill, pasture and blue sky","zh":"荷兰风车，牧场和蓝天","ko":"네덜란드 풍차, 목장과 파란 하늘"},
    ui:{"--ui-bg":"#c8e6c9","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(27,94,32,0.05)","--ui-text":"#1b5e20","--ui-muted":"#2e5430","--ui-border":"rgba(46,125,50,.22)","--ui-button":"#a5d6a7","--ui-button-hover":"#9fd1a2","--ui-field":"#ffffff","--ui-accent":"#4ecdc4","--ui-on-accent":"#000000","--ui-gold":"#d4e157","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(78,205,196,0.14)"},
    game:{"don":"#ffd700","ka":"#4ecdc4","stage":"#9ad29d","lane":"rgba(255,255,255,0.82)","track":"rgba(27,94,32,0.24)","ink":"#1b5e20","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#d4e157","good":"#1b5e20","miss":"#699b6c","glow":false},
    shapes:["square","square"],
    video:"saturate(1.1) brightness(1.04)"
  };
  S["wine-red"] = {
    cat:["dark","grad"],
    font:"\"Caslon\",\"Garamond\",serif",
    type:{"title":"\"Caslon\",serif","weight":"400","lh":"1.65","titleWeight":"600","titleSpace":".04em","mark":"あア漢 Aa 12"},
    label:{"ja":"ワインレッド","en":"Wine Red","zh":"酒红色","ko":"와인 레드"},
    desc:{"ja":"深い赤、タンニンと熟成の重み","en":"Deep red, tannin and aged weight","zh":"深红色，单宁与陈年的重量","ko":"깊은 빨강, 타닌과 숙성의 무게"},
    ui:{"--ui-bg":"#4a1c24","--ui-panel":"rgba(114,47,55,0.96)","--ui-soft":"rgba(253,245,230,0.05)","--ui-text":"#fdf5e6","--ui-muted":"#d9baab","--ui-border":"rgba(212,175,55,.24)","--ui-button":"#5d262c","--ui-button-hover":"#724144","--ui-field":"#722f37","--ui-accent":"#d4af37","--ui-on-accent":"#4a1c24","--ui-gold":"#ffe082","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#8c9eac","stage":"#722f37","lane":"rgba(114,47,55,0.6)","track":"rgba(253,245,230,0.24)","ink":"#fdf5e6","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(114,47,55,0.95)","perfect":"#ffe082","good":"#fdf5e6","miss":"#ac938f","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.4) contrast(1.15) brightness(.9)"
  };
  S["wormhole"] = {
    cat:["fun","grad"],
    font:"\"Caveat\",\"Komodo Axis\",cursive",
    type:{"title":"\"Caveat\",cursive","weight":"400","lh":"1.4","titleWeight":"600","titleSpace":".01em","mark":"あア漢 Aa 12"},
    label:{"ja":"ワームホール","en":"Wormhole","zh":"虫洞","ko":"웜홀"},
    desc:{"ja":"時空のトンネル、別の宇宙への扉","en":"Spacetime tunnel, door to another universe","zh":"时空隧道，通往另一个宇宙的门","ko":"시공간 터널, 또 다른 우주로 가는 문"},
    ui:{"--ui-bg":"linear-gradient(180deg,#241539,#123041,#153829,#38300f,#3b1526)","--ui-panel":"rgba(18,16,32,0.96)","--ui-soft":"rgba(244,242,255,0.05)","--ui-text":"#f4f2ff","--ui-muted":"#b0aecb","--ui-border":"rgba(255,255,255,.22)","--ui-button":"#201a35","--ui-button-hover":"#3c364f","--ui-field":"#151126","--ui-accent":"#f0eeff","--ui-on-accent":"#241a3a","--ui-gold":"#ffd166","--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(240,238,255,0.14)"},
    game:{"don":"#ff6b9d","ka":"#a29bfe","stage":"linear-gradient(180deg,#1a0f2e,#0e2233,#0e2e22,#2e2a0c,#33101f)","lane":"rgba(18,16,32,0.6)","track":"rgba(244,242,255,0.24)","ink":"#f4f2ff","inkShadow":"rgba(0,0,0,.85)","noteBorder":"#ffffff","panel":"rgba(18,16,32,0.95)","perfect":"#ffd166","good":"#f4f2ff","miss":"#968fa6","glow":false},
    shapes:["circle","diamond"],
    video:"saturate(1.4) contrast(1.2) brightness(.75) hue-rotate(30deg)"
  };
  S["zen-temple"] = {
    cat:["light","life"],
    font:"\"Hiragino Mincho ProN\",\"Yu Mincho\",\"YuMincho\",\"Noto Serif JP\",serif",
    type:{"title":"\"Hiragino Mincho ProN\",serif","weight":"400","lh":"1.75","titleWeight":"600","titleSpace":".1em","mark":"あア漢 Aa 12"},
    label:{"ja":"禅寺","en":"Zen Temple","zh":"禅寺","ko":"선사"},
    desc:{"ja":"枯山水、静寂と和の情緒","en":"Karesansui, silence and Japanese emotion","zh":"枯山水，寂静与日本情感","ko":"건산수, 정적과 일본 정서"},
    ui:{"--ui-bg":"#ffffff","--ui-panel":"rgba(255,255,255,0.96)","--ui-soft":"rgba(26,32,44,0.05)","--ui-text":"#1a202c","--ui-muted":"#495362","--ui-border":"rgba(26,32,44,.12)","--ui-button":"#e2e8f0","--ui-button-hover":"#c8ced7","--ui-field":"#ffffff","--ui-accent":"#d4af37","--ui-on-accent":"#000000","--ui-gold":"#f6e05e","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(212,175,55,0.14)"},
    game:{"don":"#d4af37","ka":"#4a5d6a","stage":"#f3f4f6","lane":"rgba(255,255,255,0.82)","track":"rgba(26,32,44,0.24)","ink":"#1a202c","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(255,255,255,0.95)","perfect":"#f6e05e","good":"#1a202c","miss":"#81848b","glow":false},
    shapes:["circle","circle"],
    video:"sepia(.1) brightness(1.02)"
  };
  S["zenStone"] = {
    cat:["light","access"],
    label:{"ja":"禅の石庭","en":"Zen Stone Garden","zh":"禅石庭","ko":"선 돌정원"},
    desc:{"ja":"白砂と黒石、静謐な禅の情景","en":"White sand and black stones, a quiet Zen scene","zh":"白沙与黑石，静谧的禅之情景","ko":"白 모래와 검은 돌, 정적인 선 장면"},
    ui:{"--ui-bg":"#ececec","--ui-panel":"rgba(250,250,250,0.96)","--ui-soft":"rgba(28,28,28,0.05)","--ui-text":"#1c1c1c","--ui-muted":"#535353","--ui-border":"rgba(40,40,40,.24)","--ui-button":"#e2e2e2","--ui-button-hover":"#c8c8c8","--ui-field":"#f8f8f8","--ui-accent":"#1c1c1c","--ui-on-accent":"#ffffff","--ui-gold":"#6e6e6e","--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(28,28,28,0.14)"},
    game:{"don":"#262626","ka":"#8c8c8c","stage":"#e8e8e8","lane":"rgba(250,250,250,0.82)","track":"rgba(28,28,28,0.24)","ink":"#1c1c1c","inkShadow":"rgba(255,255,255,.9)","noteBorder":"#ffffff","panel":"rgba(250,250,250,0.95)","perfect":"#6e6e6e","good":"#1c1c1c","miss":"#7a7a7a","glow":false},
    shapes:["square","square"],
    video:"grayscale(1) contrast(1.1) brightness(1.05)"
  };
  /* ⚠ 差し戻し（目録へお返しした色のもの）：寄せると別のテーマになるので、
     **色は目録のまま**内蔵し、既定の棚から外しています（ALL と その巻では見えます）。
     直すのは目録側です（`tools/check-skin-contrast` もこの一覧を読みます）。 */
  if (D) D.SKIN_HOLDBACK = ["ancient-bronze","chocolate","gold-chip","hot-cocoa","house-edge","orichalcum","tequila-sunrise"];
  /* 📚 巻の目録（13 巻）。`ids` は**この目録に居る ID の全部**（既に本体が持っているものも含む）。
     ＝ 棚で巻を選ぶと、その巻の全員が出る（新顔も定番も同じ扱い）。 */
  if (D) D.SKIN_VOLUMES = [
    {id:"vol-01",title:"vol.1 夜の情景と光の色彩",ids:["lanternAlley","moonlitTerrace","fireflyValley","midnightCafe","snowyShrine","autumnMaple","summerNight","zenStone","inkWash","paperMoon","copperHour","lavenderHill","emeraldNight","cherrySnow","ironMorning","goldLeafNight"]},
    {id:"vol-02",title:"vol.2 宝石・鉱石",ids:["ruby","sapphire","emerald","diamond","amber","amethyst","topaz","opal","quartz","onyx","jade","pearl","garnet","citrine","turquoise","obsidian"]},
    {id:"vol-03",title:"vol.3 タイポグラフィ",ids:["helvetica","garamond","futura","bodoni","caslon","baskerville","gill-sans","din","univers","frutiger","optima","rockwell","copperplate","didot","akzidenz","letterpress"]},
    {id:"vol-04",title:"vol.4 人気フォント",ids:["montserrat","opensans","noto-sans-jp","hiragino-kaku","avenir","proxima-nova","lato","roboto","source-sans-pro","ubuntu","playfair-display","merriweather","oswald","raleway","poppins","inter"]},
    {id:"vol-05",title:"vol.5 スイーツ・カフェ",ids:["matcha","chocolate","strawberry-cake","macaron","croissant","espresso","crepe","donut","parfait","mochi","dango","melon-pan","taiyaki","creme-brulee","tart","pancake"]},
    {id:"vol-06",title:"vol.6 金属",ids:["silver","gold","titanium","mithril","adamantium","orichalcum","vibranium","starmetal","voidsteel","celestial-bronze","draconic-iron","runic-iron","quicksilver","platinum","ancient-bronze","chrome-steel"]},
    {id:"vol-07",title:"vol.7 カジノ・ラグジュアリー",ids:["casino-royale","jackpot-777","slot-machine","roulette-wheel","poker-face","blackjack-21","high-roller","vip-lounge","neon-vegas","gold-chip","diamond-club","midnight-casino","velvet-ropes","champagne-gold","neon-sign","house-edge"]},
    {id:"vol-08",title:"vol.8 宇宙・惑星・星雲",ids:["nebula","black-hole","supernova","pulsar","quasar","event-horizon","dark-matter","wormhole","exoplanet","asteroid-belt","solar-flare","lunar-surface","martian-red","venus-clouds","mercury-core","cosmic-dust"]},
    {id:"vol-09",title:"vol.9 飲み物・カフェ",ids:["whiskey","wine-red","champagne","espresso-martini","mojito","sake","matcha-latte","hot-cocoa","energy-drink","soda-pop","beer-foam","absinthe","tequila-sunrise","old-fashioned","negroni","kir-royale"]},
    {id:"vol-10",title:"vol.10 建築・都市",ids:["art-deco","brutalist","gothic-cathedral","zen-temple","tokyo-night","paris-cafe","new-york-subway","venice-canal","kyoto-machiya","desert-mosque","ice-hotel","tree-house","lighthouse","windmill","clock-tower","bamboo-forest"]},
    {id:"glitch",title:"glitch デジタル実験",ids:["glitch-core","pixel-8bit","matrix-rain","motherboard","cyberpunk","datamosh","scanline","vaporwave","lofi-crt","hacker","synthwave","corrupted","crypto","pixel-art","glitch-text","neon-grid"]},
    {id:"wizard",title:"wizard ウィザード",ids:["wizard-cli","wizard-spell","wizard-grimoire","wizard-rune","wizard-alchemy","wizard-terminal","wizard-cauldron","wizard-crystal","wizard-tarot","wizard-void","wizard-arcane","wizard-eldritch","wizard-seance","wizard-ouija","wizard-hermetic","wizard-necromancer","wizard-console","wizard-grep","wizard-man","wizard-sudo","wizard-pipe","wizard-history","wizard-tmux","wizard-nord","wizard-grimoire-noir","wizard-grimoire-aureate","wizard-grimoire-umbra","wizard-grimoire-celestial","wizard-solomon-key","wizard-lemgeton","wizard-solomon-book","wizard-goetia","wizard-necronomicon","wizard-necronomicon-azif","wizard-raziel","wizard-abramelin","wizard-agrippa","wizard-honorius","wizard-heptameron","wizard-arbatel","wizard-liu-tao","wizard-san-lue","wizard-sun-tzu","wizard-sima-fa","wizard-wei-liao-zi","wizard-seven-military-classics","wizard-vegetius","wizard-machiavelli","wizard-clausewitz","wizard-jomini","wizard-mahan","wizard-douhet","wizard-aura-caster","wizard-glitch-sorcerer","wizard-crystal-gazer","wizard-void-walker","wizard-view-transition-master","wizard-anchor-positioner","wizard-scroll-driven-visionary","wizard-container-query-responder","wizard-reduce-motion-accessor","wizard-focus-ring-navigator"]},
    {id:"other",title:"その他・定番",ids:["shadow","daylight","neon","sakura","terminal","clarity","buddy","snowfield","garden","strawberry","melonberry","dusk","abyss","ember","dawn","midnightsun","pastelloop","prism","laser","aurora","wagara","showacafe","blueprint","planetarium","silverprint","nessun","graduation","hc","cbDark","cbLight","rainWindow","nightBath","shojiLight","stationDusk","morningKitchen","shoutengai","sumi","score","dotNight","mistForest","typeMincho","typeNewspaper","typeMarugo","typePop","typeKyokasho","typeTypewriter","typeKaisho","typeOldstyle","typeGothicHeavy","miku39","mikuNoir","mikuClassic","mikuIdol"]}
  ];
})();
